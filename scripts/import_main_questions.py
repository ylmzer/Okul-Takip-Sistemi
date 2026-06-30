import os
import zipfile
import re
import html
import sys
import json
import unicodedata
from pathlib import Path
from xml.etree import ElementTree as ET

if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

# Matches: "Soru 1)", "1.", "1-)", "Soru-1: ", "1 )", "SORU: 1"
QUESTION_START_RE = re.compile(r"^\s*(?:SORU\s*[-–—:]?\s*)?(\d+)\s*[-.)]\s*\)?\s*(.*)$", re.IGNORECASE)

# Matches option identifiers like "A)", "A.", "A-", "A )"
OPTION_RE = re.compile(r"^\s*([A-Ea-e])\s*[\)\.:\-]\s*(.*)")

# Matches correct answer lines: e.g. "Cevap: C", "Doğru Cevap: A", "Yanıt: E"
ANSWER_LINE_RE = re.compile(r"(?:cevap|yanıt|answer|doğru\s*cevap|doğru)\s*[:\-]?\s*([A-Ea-e])\s*$", re.IGNORECASE)

def clean_text(val):
    if val is None:
        return ""
    val = str(val).strip()
    val = re.sub(r"\s+", " ", val)
    return val

def clean_option_text(text):
    text = text.strip()
    # Strip any leading separators that might have been left over (like ).:- )
    text = re.sub(r"^[\)\.\:\-\s]+", "", text).strip()
    return text

def is_option_text(text):
    text = text.strip()
    if text.endswith(":"):
        return False
    return OPTION_RE.match(text) is not None

def split_inline_options(text):
    pattern = re.compile(r"\b([A-Ea-e])\s*[\)\.\:\-]\s*", re.UNICODE)
    parts = pattern.split(text)
    if len(parts) < 4:
        return None
    result = {}
    i = 1
    while i + 1 < len(parts):
        letter = parts[i].upper()
        content = parts[i + 1].strip()
        result[letter] = content
        i += 2
    return result if len(result) >= 2 else None

def normalize_turkish(text):
    text = unicodedata.normalize('NFC', text)
    text = text.replace('İ', 'i').replace('ı', 'i').replace('I', 'i')
    text = text.replace('Ç', 'c').replace('ç', 'c')
    text = text.replace('Ğ', 'g').replace('ğ', 'g')
    text = text.replace('Ö', 'o').replace('ö', 'o')
    text = text.replace('Ş', 's').replace('ş', 's')
    text = text.replace('Ü', 'u').replace('ü', 'u')
    return text.lower()

def extract_docx_blocks(path):
    blocks = []
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    body = document.find("w:body", NS)
    if body is None:
        return blocks
    
    def process_p(p_node, parent):
        runs_data = []
        for r in p_node.findall(".//w:r", NS):
            r_text = "".join(node.text or "" for node in r.iter(f"{{{NS['w']}}}t"))
            rPr = r.find("w:rPr", NS)
            bold = False
            underline = False
            if rPr is not None:
                if rPr.find("w:b", NS) is not None:
                    bold = True
                if rPr.find("w:u", NS) is not None:
                    underline = True
            runs_data.append({"text": r_text, "bold": bold, "underline": underline})
        
        p_text = clean_text("".join(rd["text"] for rd in runs_data))
        if not p_text:
            return
            
        bold = any(rd["bold"] for rd in runs_data)
        underline = any(rd["underline"] for rd in runs_data)
        
        blocks.append({
            "type": "p",
            "text": p_text,
            "bold": bold,
            "underline": underline,
            "runs": runs_data,
            "parent": parent
        })

    tbl_counter = 0
    for child in body:
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "p":
            process_p(child, "body")
        elif tag == "tbl":
            for tr_idx, tr in enumerate(child.findall("w:tr", NS)):
                for tc_idx, tc in enumerate(tr.findall("w:tc", NS)):
                    for p in tc.findall(".//w:p", NS):
                        process_p(p, (f"tbl_{tbl_counter}", tr_idx, tc_idx))
            tbl_counter += 1
    return blocks

def extract_pdf_blocks(path):
    blocks = []
    try:
        from pypdf import PdfReader
        reader = PdfReader(path)
        for page in reader.pages:
            text = page.extract_text() or ""
            for line in text.split("\n"):
                line = line.strip()
                if line:
                    blocks.append({
                        "type": "p",
                        "text": line,
                        "bold": False,
                        "underline": False,
                        "runs": [],
                        "parent": "body"
                    })
    except Exception:
        pass
    return blocks

def extract_txt_blocks(path):
    blocks = []
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if line:
                    blocks.append({
                        "type": "p",
                        "text": line,
                        "bold": False,
                        "underline": False,
                        "runs": [],
                        "parent": "body"
                    })
    except Exception:
        pass
    return blocks

def parse_exam_meta(filename):
    name = Path(filename or "").name
    compact = re.sub(r"\s+", "", name).lower()
    match = re.search(r"([12])d([123])s", compact)
    if match:
        return {"term": match.group(1), "examNumber": match.group(2)}
    term = re.search(r"([12])\s*\.?\s*donem", compact)
    number = re.search(r"([123])\s*\.?\s*(yazili|sinav)", compact)
    return {
        "term": term.group(1) if term else "",
        "examNumber": number.group(1) if number else ""
    }

def is_real_answer_start(num, text, questions):
    matching_q = next((q for q in questions if q["number"] == num), None)
    if not matching_q:
        return False
        
    text_clean = text.lower().strip()
    q_clean = matching_q["text"].lower().strip()
    
    if len(text_clean) < 4:
        return True
        
    q_words = set(re.findall(r"\w+", q_clean))
    t_words = set(re.findall(r"\w+", text_clean))
    overlap = q_words.intersection(t_words)
    
    if len(overlap) >= 2 or (len(q_words) > 0 and len(overlap) / len(q_words) > 0.25):
        return True
        
    return False

def is_metadata_line(text):
    t_clean = normalize_turkish(text).strip()
    if not t_clean:
        return True
    if len(t_clean) < 4:
        return True
        
    if 'lisesi' in t_clean and any(w in t_clean for w in ['anadolu', 'mesleki', 'teknik', 'ticaret', 'ortaokulu', 'ilkokulu']):
        return True
        
    if len(t_clean) < 40:
        phrases = [
            'adi soyadi', 'sinifi', 'subesi', 'numarasi', 'dersin adi',
            'egitim ogretim yili', 'egitim ve ogretim yili', 'cevap anahtari', 'aldigi not', 'yazili sinavi',
            'sinav suresi'
        ]
        if any(p in t_clean for p in phrases):
            return True
            
        words = set(re.split(r"[^a-z\d]+", t_clean))
        meta_words = {'sure', 'tarih', 'puan', 'ders', 'okul', 'yazili', 'donem', 'ogrenci', 'numara'}
        if any(w in words for w in meta_words):
            return True
            
    return False

def is_valid_question(q):
    text_lower = q["text"].lower()
    if q["options"]:
        return True
    if q["text"].strip().endswith("?"):
        return True
    
    points_match = re.search(r"\(\s*(\d+)\s*[pP][ua]*n?\s*\)", q["text"])
    if points_match or q["points"] != 10:
        return True
        
    t_norm = normalize_turkish(q["text"])
    words = set(re.split(r"[^a-z\d]+", t_norm))
    question_keywords = [
        "nedir", "nelerdir", "açıklayınız", "aciklayiniz", "yazınız", "yaziniz", 
        "hesaplayınız", "hesaplayiniz", "tanımlayınız", "tanimlayiniz", "bulunuz", 
        "gösteriniz", "gosteriniz", "hangisidir", "yapınız", "yapiniz", "veriniz", 
        "nasıldır", "nasildir", "belirtiniz", "kaçı", "kaci", "kaçtır", "kactir",
        "sınıflandırınız", "siniflandiriniz", "sıralayınız", "siralayiniz"
    ]
    if any(word in words for word in question_keywords):
        return True
        
    return False

def split_into_exam_copies(blocks):
    copies = []
    current_copy = []
    
    for idx, b in enumerate(blocks):
        text = b["text"]
        t_norm = normalize_turkish(text)
        
        is_new_header = False
        if idx > 15:
            if "lisesi" in t_norm and any(w in t_norm for w in ["anadolu", "mesleki", "teknik", "ticaret", "ortaokulu", "ilkokulu"]):
                is_new_header = True
            elif "egitim ogretim yili" in t_norm or "egitim ve ogretim yili" in t_norm:
                is_new_header = True
                
        if is_new_header and len(current_copy) > 15:
            copies.append(current_copy)
            current_copy = []
            
        current_copy.append(b)
        
    if current_copy:
        copies.append(current_copy)
        
    return copies

def parse_single_copy(blocks):
    in_answers = False
    question_blocks = []
    answer_blocks = []
    
    split_idx = -1
    for idx, b in enumerate(blocks):
        if b["type"] == "p":
            text = b["text"].upper()
            if ("CEVAP ANAHTARI" in text or "CEVAPLER" in text or "CEVAPLAR" in text) and idx > 15:
                split_idx = idx
                break
                
    if split_idx != -1:
        question_blocks = blocks[:split_idx]
        answer_blocks = blocks[split_idx+1:]
        is_intermingled = False
    else:
        is_ans_key = False
        for b in blocks[:15]:
            t_norm = normalize_turkish(b["text"])
            if "cevap anahtari" in t_norm or "cevaplar" in t_norm:
                is_ans_key = True
                break
        
        question_blocks = blocks
        answer_blocks = []
        is_intermingled = is_ans_key

    questions = []
    i = 0
    q_counter = 1
    inline_answers_by_num = {}
    
    while i < len(question_blocks):
        b = question_blocks[i]
        text = b["text"]
        
        if is_metadata_line(text):
            i += 1
            continue
            
        q_match = QUESTION_START_RE.match(text)
        is_explicit_q = q_match is not None
        
        is_implicit_q = False
        if not is_explicit_q and (text.endswith("?") or any(w in text.lower() for w in ["hangisidir", "nedir", "nelerdir"])):
            lookahead = []
            j = i + 1
            while j < len(question_blocks) and len(lookahead) < 4:
                if question_blocks[j]["type"] == "p":
                    lookahead.append(question_blocks[j])
                j += 1
            
            if len(lookahead) == 4:
                has_option_letters = all(is_option_text(la["text"]) for la in lookahead)
                all_short_plain = all(len(la["text"]) < 120 and not QUESTION_START_RE.match(la["text"]) for la in lookahead)
                if has_option_letters or all_short_plain:
                    is_implicit_q = True
                    
        if is_explicit_q or is_implicit_q:
            q_num = int(q_match.group(1)) if (is_explicit_q and q_match.group(1)) else q_counter
            q_text = q_match.group(2) if is_explicit_q else text
            
            points_match = re.search(r"\(\s*(\d+)\s*[pP][ua]*n?\s*\)", q_text)
            points = 10
            if points_match:
                points = int(points_match.group(1))
                q_text = q_text.replace(points_match.group(0), "").strip()
                
            new_q = {
                "number": q_num,
                "text": q_text,
                "type": "open",
                "options": [],
                "points": points,
                "parent": b.get("parent")
            }
            questions.append(new_q)
            q_counter = q_num + 1
            i += 1
            
            inline = split_inline_options(q_text)
            if inline:
                new_q["type"] = "multipleChoice"
                first_opt_m = re.search(r"\b([A-Ea-e])\s*[\)\.\:\-]\s*", q_text)
                if first_opt_m:
                    new_q["text"] = q_text[:first_opt_m.start()].strip()
                for l in ["A", "B", "C", "D", "E"]:
                    if l in inline:
                        new_q["options"].append({"letter": l, "text": clean_option_text(inline[l]), "underline": False})
                continue
                
            opt_blocks = []
            ans_blocks = []
            j = i
            while j < len(question_blocks):
                next_b = question_blocks[j]
                if next_b["type"] != "p":
                    break
                if next_b.get("parent") != new_q["parent"]:
                    break
                if QUESTION_START_RE.match(next_b["text"]):
                    break
                if is_metadata_line(next_b["text"]):
                    break
                    
                if is_option_text(next_b["text"]):
                    opt_blocks.append(next_b)
                elif is_implicit_q and len(opt_blocks) < 4 and len(next_b["text"]) < 120 and not is_intermingled:
                    opt_blocks.append(next_b)
                else:
                    if is_intermingled:
                        ans_blocks.append(next_b)
                    else:
                        break
                j += 1
                
            if opt_blocks:
                new_q["type"] = "multipleChoice"
                letters = ["A", "B", "C", "D", "E"]
                for idx, ob in enumerate(opt_blocks):
                    let = letters[idx] if idx < len(letters) else "E"
                    opt_text = ob["text"]
                    opt_m = OPTION_RE.match(opt_text)
                    if opt_m:
                        let = opt_m.group(1).upper()
                        opt_text = opt_m.group(2)
                    new_q["options"].append({"letter": let, "text": clean_option_text(opt_text), "underline": ob["underline"]})
                
                if is_intermingled:
                    while j < len(question_blocks):
                        next_b = question_blocks[j]
                        if next_b["type"] != "p" or next_b.get("parent") != new_q["parent"]:
                            break
                        if QUESTION_START_RE.match(next_b["text"]) or is_metadata_line(next_b["text"]):
                            break
                        ans_blocks.append(next_b)
                        j += 1
                        
            if ans_blocks:
                inline_answers_by_num[q_num] = ans_blocks
                
            i = j
            continue
        else:
            if questions and questions[-1]["parent"] == b.get("parent"):
                if not is_intermingled and not is_metadata_line(text):
                    questions[-1]["text"] += "\n" + text
            i += 1

    valid_qs = [q for q in questions if is_valid_question(q)]

    ans_by_num = {}
    
    if is_intermingled:
        for num, blocks_list in inline_answers_by_num.items():
            ans_by_num[num] = [{"text": b["text"], "underline": b["underline"]} for b in blocks_list]
    else:
        current_ans_num = None
        for b in answer_blocks:
            if b["type"] != "p":
                continue
            text = b["text"]
            if is_metadata_line(text):
                continue
                
            q_match = QUESTION_START_RE.match(text)
            if q_match:
                pot_num = int(q_match.group(1))
                pot_text = q_match.group(2)
                if is_real_answer_start(pot_num, pot_text, valid_qs):
                    current_ans_num = pot_num
                    if current_ans_num not in ans_by_num:
                        ans_by_num[current_ans_num] = []
                    ans_by_num[current_ans_num].append({"text": pot_text, "underline": b["underline"]})
                    continue
                    
            if current_ans_num is not None:
                if current_ans_num not in ans_by_num:
                    ans_by_num[current_ans_num] = []
                ans_by_num[current_ans_num].append({"text": text, "underline": b["underline"]})

    for q in valid_qs:
        num = q["number"]
        ans_items = ans_by_num.get(num, [])
        
        if q["type"] == "multipleChoice":
            correct = "A"
            found_correct = False
            for ai in ans_items:
                m = ANSWER_LINE_RE.search(ai["text"])
                if m:
                    correct = m.group(1).upper()
                    found_correct = True
                    break
                for opt in q["options"]:
                    if opt["text"] in ai["text"] and ai["underline"]:
                        correct = opt["letter"]
                        found_correct = True
                        break
            if not found_correct:
                for opt in q["options"]:
                    if opt["underline"]:
                        correct = opt["letter"]
                        break
            q["correctOption"] = correct
        else:
            clean_ans_items = []
            for ai in ans_items:
                if ai["text"] in q["text"]:
                    continue
                clean_ans_items.append(ai["text"])
            q["answer"] = "<br>".join(clean_ans_items) if clean_ans_items else ""

    valid_qs.sort(key=lambda x: x["number"])
    return valid_qs

def parse_document(blocks):
    copies = split_into_exam_copies(blocks)
    
    parsed_copies = []
    for idx, copy in enumerate(copies):
        qs = parse_single_copy(copy)
        parsed_copies.append(qs)
        
    def score_copy(qs):
        if not qs:
            return -1
        ans_count = 0
        for q in qs:
            if q["type"] == "multipleChoice":
                if q["correctOption"] != "A" or any(opt["underline"] for opt in q["options"]):
                    ans_count += 1
            else:
                if q.get("answer"):
                    ans_count += 1
        return ans_count
        
    scores = [score_copy(qs) for qs in parsed_copies]
    
    best_idx = scores.index(max(scores)) if scores else 0
    return parsed_copies[best_idx] if parsed_copies else []

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Dosya yolu belirtilmedi"}, ensure_ascii=False))
        sys.exit(1)
        
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"error": "Dosya bulunamadı"}, ensure_ascii=False))
        sys.exit(1)
        
    ext = os.path.splitext(file_path)[1].lower()
    filename = Path(file_path).name
    
    try:
        if ext == ".docx":
            blocks = extract_docx_blocks(file_path)
        elif ext == ".pdf":
            blocks = extract_pdf_blocks(file_path)
        elif ext in (".txt", ".text"):
            blocks = extract_txt_blocks(file_path)
        else:
            print(json.dumps({"error": "Desteklenmeyen dosya türü (.docx, .pdf veya .txt)"}, ensure_ascii=False))
            sys.exit(1)
            
        questions = parse_document(blocks)
        
        # Format the output matching what the front-end wizard expects
        # { "meta": ..., "questions": [...] }
        formatted_qs = []
        for idx, q in enumerate(questions):
            optA = ""
            optB = ""
            optC = ""
            optD = ""
            optE = ""
            
            for opt in q.get("options", []):
                let = opt["letter"]
                if let == "A": optA = opt["text"]
                elif let == "B": optB = opt["text"]
                elif let == "C": optC = opt["text"]
                elif let == "D": optD = opt["text"]
                elif let == "E": optE = opt["text"]
                
            formatted_qs.append({
                "questionNumber": idx + 1,
                "text": q["text"],
                "type": q["type"],
                "points": q.get("points", 10),
                "optionA": optA,
                "optionB": optB,
                "optionC": optC,
                "optionD": optD,
                "optionE": optE,
                "correctOption": q.get("correctOption", "A"),
                "answer": q.get("answer", "")
            })
            
        print(json.dumps({
            "meta": parse_exam_meta(filename),
            "questions": formatted_qs
        }, ensure_ascii=False))
        
    except Exception as e:
        import traceback
        print(json.dumps({
            "error": f"Ayrıştırma hatası: {str(e)}",
            "detail": traceback.format_exc()
        }, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()

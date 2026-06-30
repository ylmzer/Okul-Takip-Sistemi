import sys
import json
import os
import re

# Ensure standard output uses UTF-8 encoding
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

def clean_string(val):
    if val is None:
        return ""
    val = str(val).strip()
    # Replace multiple spaces with a single space
    val = re.sub(r'\s+', ' ', val)
    return val

def clean_compare(val):
    # Clean, convert to lower, and strip combining character
    return clean_string(val).lower().replace('\u0307', '')

def classify_row_parts(parts, known_teachers=None):
    record = {
        "student_name": "",
        "student_no": "",
        "class_name": "",
        "field": "",
        "business_name": "",
        "business_address": "",
        "business_phone": "",
        "coordinator_name": "",
        "days": ""
    }
    
    days_pattern = re.compile(r'\b(pzt|sal|çar|per|cum|pazartesi|salı|çarşamba|perşembe|cuma)\b', re.IGNORECASE)
    class_pattern = re.compile(r'\b(9|10|11|12)\s*[-/]?\s*[A-ZĞÜŞİÖÇ]\b', re.IGNORECASE)
    
    biz_keywords = [
        'ltd', 'şti', 'sti', 'ticaret', 'sanayi', 'kuaför', 'berber', 'eczane', 'market', 
        'aş', 'a.ş', 'hizmet', 'gıda', 'gida', 'oto', 'servis', 'atölye', 'atolye', 
        'tasarım', 'tasarim', 'güzellik', 'guzellik', 'mobilya', 'kuaförü', 'eczanesi',
        'marketi', 'insaat', 'inşaat', 'mühendislik', 'muhendislik', 'limited', 'şirketi'
    ]
    
    unclassified = []
    for part in parts:
        part_clean = clean_string(part)
        part_comp = clean_compare(part)
        if not part_clean or part_comp in ['sıra', 'sira', 'no', 'adi', 'soydi', 'adı', 'soyadı', 'ad soyad']:
            continue
            
        # Is it days?
        if days_pattern.search(part_clean) and len(part_clean) <= 25:
            record["days"] = part_clean
            continue
            
        # Is it class?
        if class_pattern.search(part_clean) and len(part_clean) <= 10:
            record["class_name"] = part_clean
            continue
            
        # Is it student number?
        if part_clean.isdigit() and 1 <= len(part_clean) <= 6:
            record["student_no"] = part_clean
            continue
            
        unclassified.append(part_clean)
        
    # Now classify remaining parts
    temp_unclassified = []
    for part in unclassified:
        part_comp = clean_compare(part)
        
        # Check if matches known teacher
        if known_teachers and any(clean_compare(t) in part_comp for t in known_teachers):
            record["coordinator_name"] = part
            continue
            
        # Check if all uppercase, length > 5, has no digits and doesn't contain business keywords
        words = part.split()
        if len(words) >= 2 and part.isupper() and not any(kw in part_comp for kw in biz_keywords) and not any(char.isdigit() for char in part):
            record["coordinator_name"] = part
            continue
            
        # Check if it contains business keywords
        if any(kw in part_comp for kw in biz_keywords):
            record["business_name"] = part
            continue
            
        temp_unclassified.append(part)
        
    # Let's filter out what was classified
    remaining = [p for p in temp_unclassified if p not in [record["coordinator_name"], record["business_name"]]]
    
    # Heuristics for student name vs business name vs field
    if remaining:
        student_name_candidate = None
        for p in remaining:
            p_comp = clean_compare(p)
            words = p.split()
            if len(words) >= 2 and not any(kw in p_comp for kw in biz_keywords) and ',' not in p and '.' not in p:
                student_name_candidate = p
                break
        if student_name_candidate:
            record["student_name"] = student_name_candidate
            remaining.remove(student_name_candidate)
        else:
            record["student_name"] = remaining[0]
            remaining.remove(remaining[0])
            
    # Business name fallback
    if remaining and not record["business_name"]:
        record["business_name"] = remaining[0]
        remaining.remove(remaining[0])
        
    # Field fallback
    if remaining and not record["field"]:
        record["field"] = remaining[0]
        remaining.remove(remaining[0])
        
    # Default days if student is found but days is empty
    if record["student_name"] and not record["days"]:
        record["days"] = "Pzt, Sal"
        
    return record

def parse_excel(file_path, known_teachers=None):
    import pandas as pd
    
    xls = pd.ExcelFile(file_path)
    records = []
    
    df = xls.parse(xls.sheet_names[0], header=None)
    
    header_row_idx = None
    col_mapping = {}
    
    keywords = {
        'student_name': ['ad', 'soyad', 'adı soyadı', 'adi soyadi', 'öğrenci', 'ogrenci', 'ad soyad'],
        'student_no': ['no', 'okul no', 'öğrenci no', 'ogrenci no', 'numara', 'numarası', 'numarasi'],
        'class_name': ['sınıf', 'şube', 'sinif', 'sube', 'sınıfı'],
        'field': ['alan', 'dal', 'bölüm', 'bolum', 'dalı', 'dali'],
        'business_name': ['işletme', 'isletme', 'işyeri', 'isyeri', 'firma', 'kurum', 'işyeri adı', 'firma adı'],
        'coordinator_name': ['koordinatör', 'koordinator', 'öğretmen', 'ogretmen', 'koordinatör öğretmen']
    }
    
    for r_idx in range(min(15, len(df))):
        row_vals = [clean_compare(val) if pd.notna(val) else '' for val in df.iloc[r_idx]]
        matches = {}
        for key, kws in keywords.items():
            for c_idx, val in enumerate(row_vals):
                if any(kw == val or val.startswith(kw) for kw in kws):
                    matches[key] = c_idx
                    break
        if 'student_name' in matches and len(matches) >= 2:
            header_row_idx = r_idx
            col_mapping = matches
            break
            
    start_row = header_row_idx + 1 if header_row_idx is not None else 0
    for r_idx in range(start_row, len(df)):
        row = df.iloc[r_idx]
        row_cells = [clean_string(val) if pd.notna(val) else '' for val in row]
        if not any(row_cells):
            continue
            
        if col_mapping:
            record = {
                "student_name": row_cells[col_mapping['student_name']] if 'student_name' in col_mapping else "",
                "student_no": row_cells[col_mapping['student_no']] if 'student_no' in col_mapping else "",
                "class_name": row_cells[col_mapping['class_name']] if 'class_name' in col_mapping else "",
                "field": row_cells[col_mapping['field']] if 'field' in col_mapping else "",
                "business_name": row_cells[col_mapping['business_name']] if 'business_name' in col_mapping else "",
                "business_address": "",
                "business_phone": "",
                "coordinator_name": row_cells[col_mapping['coordinator_name']] if 'coordinator_name' in col_mapping else "",
                "days": "Pzt, Sal"
            }
            for c_idx, val in enumerate(row_cells):
                if c_idx not in col_mapping.values() and val:
                    val_lower = clean_compare(val)
                    if any(d in val_lower for d in ['pzt', 'sal', 'çar', 'per', 'cum']):
                        record["days"] = val
                        break
        else:
            record = classify_row_parts(row_cells, known_teachers)
            
        if record["student_no"]:
            if '.' in record["student_no"]:
                record["student_no"] = record["student_no"].split('.')[0]
                
        if record["student_name"] and len(record["student_name"]) > 2:
            records.append(record)
            
    return records

def turkish_clean(val):
    if not val:
        return ""
    val = str(val).strip().lower()
    val = val.replace('\u0307', '')
    val = val.replace('ı', 'i').replace('i̇', 'i').replace('ö', 'o').replace('ü', 'u').replace('ş', 's').replace('ç', 'c').replace('ğ', 'g')
    return val

def parse_pdf(file_path, known_teachers=None):
    from pypdf import PdfReader
    
    reader = PdfReader(file_path)
    records = []
    
    is_nazilli_format = False
    for page in reader.pages[:2]:
        text = page.extract_text() or ""
        if "HAFTALIK ÖĞRETMEN GÖREV FORMU" in text or "ÇIRAK ÖĞRENCİLER İÇİN" in text:
            is_nazilli_format = True
            break
            
    if not is_nazilli_format:
        # Fallback to the original parsing logic
        for page in reader.pages:
            text = page.extract_text()
            if not text:
                continue
                
            lines = text.split('\n')
            for line in lines:
                line_clean = line.strip()
                if not line_clean:
                    continue
                    
                parts = [p.strip() for p in re.split(r'\t|\s{2,}', line_clean) if p.strip()]
                if len(parts) < 3:
                    continue
                    
                record = classify_row_parts(parts, known_teachers)
                if record["student_name"] and len(record["student_name"]) > 2:
                    if record["class_name"] or record["student_no"] or record["business_name"]:
                        records.append(record)
        return records
        
    # Extract coordinator teacher
    coordinator_teacher = ""
    first_page_text = reader.pages[0].extract_text() or ""
    first_page_lines = [l.strip() for l in first_page_text.split('\n') if l.strip()]
    for idx, line in enumerate(first_page_lines):
        clean_line = turkish_clean(line)
        if clean_line == "imza" and idx > 0:
            teacher_candidate = first_page_lines[idx - 1]
            if len(teacher_candidate.split()) >= 2 and not any(kw in turkish_clean(teacher_candidate) for kw in ["mudur", "mudurlugu", "md.yrd", "oguzhan", "unal"]):
                coordinator_teacher = teacher_candidate.strip()
                break
                
    if not coordinator_teacher:
        for page in reader.pages[1:]:
            page_text = page.extract_text() or ""
            page_lines = [l.strip() for l in page_text.split('\n') if l.strip()]
            for idx, line in enumerate(page_lines):
                clean_line = turkish_clean(line)
                if clean_line == "imza" and idx > 0:
                    teacher_candidate = page_lines[idx - 1]
                    if len(teacher_candidate.split()) >= 2 and not any(kw in turkish_clean(teacher_candidate) for kw in ["mudur", "mudurlugu", "md.yrd", "oguzhan", "unal"]):
                        coordinator_teacher = teacher_candidate.strip()
                        break
            if coordinator_teacher:
                break

    boilerplate_keywords = [
        "valiligi", "mudurlugu", "gorev formu", "oguzhan unal", "md.yrd", 
        "gorev ozeti", "ogrenci sayisi", "isyeri sayisi", "imza", "kontrol", 
        "adi adresi", "sinif no", "sira no", "ad soyad", "surdurmektedir", 
        "ayrilmistir", "gorus alinamadi", "devamsizlik", "yapmistir", 
        "pratik egitim", "gorus ve", "gozlemleri", "imzasi, kasesi", 
        "yilinda", "sayili kanun", "is gunu", "teslim ediniz", "gorevi", 
        "tc", "t.c.", "aydin", "merkezi", "mesleki egitim",
        "beceri egitimini", "isveren olmadigindan", "isverenin, ustanin",
        "kasesi", "gorusu", "ogretmenin", "gozlemleri", "pratik egitim konusu",
        "adi soyadi", "imzasi"
    ]
    
    date_pattern = re.compile(r'\d{2}-\d{2}\s+[a-zA-ZğüşıöçĞÜŞİÖÇ]+', re.IGNORECASE)
    year_pattern = re.compile(r'\b(2025|2026)\b')
    page_num_pattern = re.compile(r'^\s*\d+\s*$')
    slash_pattern = re.compile(r'^\s*/\s*$')
    
    def is_boilerplate(line):
        line_clean = turkish_clean(line)
        if len(line.strip()) <= 1:
            return True
        if any(kw in line_clean for kw in boilerplate_keywords):
            return True
        if date_pattern.search(line) or year_pattern.search(line):
            return True
        if page_num_pattern.match(line) or slash_pattern.match(line):
            return True
        if line_clean in ["imza", "imzasi", "kasesi", "imzasi, kasesi"]:
            return True
        if coordinator_teacher and line_clean == turkish_clean(coordinator_teacher):
            return True
        return False
        
    student_pattern = re.compile(r'\b(\d+)\s+(9|10|11|12)\s+(\d+)\s+([a-zA-ZğüşıöçĞÜŞİÖÇ\s\-\.\'\`\’]+)$', re.IGNORECASE)
    phone_pattern = re.compile(r'\b5\d{9}\b|\b\d{10}\b')
    
    address_keywords = ['mah', 'sok', 'sk', 'cad', 'cd', 'apt', 'no:', 'nazilli', 'ordu', 'altintas', 'yeni mah']
    
    def guess_field(biz_name):
        biz_clean = turkish_clean(biz_name)
        if any(w in biz_clean for w in ["erkek", "berber", "boss", "cut", "man"]):
            return "Güzellik ve Saç Bakım Hizmetleri / Erkek Kuaförlüğü"
        if any(w in biz_clean for w in ["bayan", "coiffure", "kadin", "guzellik", "diva", "nilufer"]):
            return "Güzellik ve Saç Bakım Hizmetleri / Kadın Kuaförlüğü"
        if any(w in biz_clean for w in ["kuafor", "kuaforu", "hair", "club"]):
            return "Güzellik ve Saç Bakım Hizmetleri / Erkek Kuaförlüğü"
        return "Belirtilmedi"
        
    current_business_lines = []
    current_business_info = { "name": "", "address": "", "phone": "" }
    
    for page_idx, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        just_processed_student = False
        
        for line in lines:
            found_phone = ""
            phone_match = phone_pattern.search(line)
            if phone_match:
                found_phone = phone_match.group(0)
                line = phone_pattern.sub("", line).strip()
                
            student_match = student_pattern.search(line)
            if student_match:
                row_no = student_match.group(1)
                class_name = student_match.group(2)
                student_no = student_match.group(3)
                student_name = student_match.group(4)
                
                if row_no == "1" or not current_business_info["name"]:
                    if current_business_lines:
                        full_text = " ".join(current_business_lines)
                        clean_full_text = turkish_clean(full_text)
                        
                        split_idx = -1
                        for kw in address_keywords:
                            kw_match = re.search(r'\b' + re.escape(kw) + r'\b', clean_full_text, re.IGNORECASE)
                            if kw_match:
                                if split_idx == -1 or kw_match.start() < split_idx:
                                    split_idx = kw_match.start()
                                    
                        if split_idx != -1:
                            name = full_text[:split_idx].strip().strip('-').strip()
                            address = full_text[split_idx:].strip()
                        else:
                            if len(current_business_lines) > 1:
                                name = current_business_lines[0].strip()
                                address = " ".join(current_business_lines[1:]).strip()
                            else:
                                name = full_text
                                address = ""
                                
                        current_business_info = {
                            "name": name,
                            "address": address,
                            "phone": found_phone or current_business_info.get("phone", "")
                        }
                    else:
                        if not current_business_info["name"]:
                            current_business_info = {
                                "name": "Bilinmeyen İşletme",
                                "address": "",
                                "phone": found_phone or ""
                            }
                    current_business_lines = []
                    
                if found_phone and not current_business_info["phone"]:
                    current_business_info["phone"] = found_phone
                    
                records.append({
                    "student_name": student_name.strip(),
                    "student_no": student_no.strip(),
                    "class_name": class_name.strip(),
                    "field": guess_field(current_business_info["name"]),
                    "business_name": current_business_info["name"],
                    "business_address": current_business_info["address"],
                    "business_phone": current_business_info["phone"],
                    "coordinator_name": coordinator_teacher or "",
                    "days": "Pzt, Sal"
                })
                just_processed_student = True
            elif is_boilerplate(line):
                continue
            else:
                if just_processed_student:
                    just_processed_student = False
                    continue
                    
                if line.strip():
                    current_business_lines.append(line.strip())
                    
    return records

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Dosya yolu belirtilmedi"}, ensure_ascii=False))
        sys.exit(1)
        
    file_path = sys.argv[1]
    
    # Optional list of known teachers to help parser
    known_teachers = None
    if len(sys.argv) > 2:
        try:
            known_teachers = json.loads(sys.argv[2])
        except Exception:
            pass
            
    if not os.path.exists(file_path):
        print(json.dumps({"error": "Dosya bulunamadı"}, ensure_ascii=False))
        sys.exit(1)
        
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        if ext in ['.xlsx', '.xls']:
            records = parse_excel(file_path, known_teachers)
        elif ext == '.pdf':
            records = parse_pdf(file_path, known_teachers)
        else:
            print(json.dumps({"error": "Desteklenmeyen dosya formatı"}, ensure_ascii=False))
            sys.exit(1)
            
        # Post-processing: clean student numbers, capitalizations
        for r in records:
            if r["student_name"]:
                r["student_name"] = r["student_name"].title()
            if r["coordinator_name"]:
                r["coordinator_name"] = r["coordinator_name"].upper()
            if r["business_name"]:
                r["business_name"] = r["business_name"].strip()
            if r["class_name"]:
                r["class_name"] = r["class_name"].upper().replace(" ", "")
                
        print(json.dumps({"records": records}, ensure_ascii=False))
        
    except Exception as e:
        import traceback
        err_msg = f"Ayrıştırma hatası: {str(e)}\n{traceback.format_exc()}"
        print(json.dumps({"error": err_msg}, ensure_ascii=False))
        sys.exit(1)

if __name__ == '__main__':
    main()

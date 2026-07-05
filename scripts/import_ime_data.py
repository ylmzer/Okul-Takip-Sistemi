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
    
    # --- Try to detect Nazilli "Haftalık Öğretmen Görev Formu" format ---
    # In this format:
    #   - Row 0 of Sheet 1 contains the week date and coordinator teacher info
    #   - Row 1-2 are table headers (İŞLETMENİN / ÖĞRENCİNİN / HAFTALIK KONTROL)
    #   - Row 3+ are data rows
    #   - Business name is in the first column and may be empty when the student 
    #     belongs to the same business as the row above (merged cell pattern)
    #   - Multiple sheets may contain continuation data
    
    first_df = xls.parse(xls.sheet_names[0], header=None)
    
    is_nazilli_excel = False
    coordinator_teacher = ""
    week_date = ""
    
    # Check first few rows for Nazilli format markers
    for r_idx in range(min(5, len(first_df))):
        row_vals = [str(v).strip() if pd.notna(v) else '' for v in first_df.iloc[r_idx]]
        row_text = turkish_clean(' '.join(row_vals))
        if 'isletmenin' in row_text and 'ogrencinin' in row_text:
            is_nazilli_excel = True
            break
    
    if is_nazilli_excel:
        # Extract week date and coordinator from row 0 of first sheet
        row0_vals = [str(v).strip() if pd.notna(v) else '' for v in first_df.iloc[0]]
        
        for val in row0_vals:
            if not val:
                continue
            # Clean newlines
            val_clean = val.replace('\n', ' ').replace('\r', ' ').strip()
            val_lower = turkish_clean(val_clean)
            
            # Check for week date (e.g. "6-10 Temmuz 2026")
            months = ["ocak", "subat", "mart", "nisan", "mayis", "haziran", 
                       "temmuz", "agustos", "eylul", "ekim", "kasim", "aralik"]
            if any(m in val_lower for m in months) and not week_date:
                # Extract just the date portion
                import re as _re
                date_match = _re.search(
                    r'(\d{1,2}\s*[-–]\s*\d{1,2}\s+[a-zA-ZğüşıöçĞÜŞİÖÇ]+\s*\d{4})',
                    val_clean
                )
                if date_match:
                    week_date = date_match.group(1).strip()
                else:
                    # Try multiline: "6-10 Temmuz\n2026"
                    date_match2 = _re.search(
                        r'(\d{1,2}\s*[-–]\s*\d{1,2}\s+[a-zA-ZğüşıöçĞÜŞİÖÇ]+)',
                        val_clean
                    )
                    year_match = _re.search(r'(202\d)', val_clean)
                    if date_match2 and year_match:
                        week_date = date_match2.group(1).strip() + " " + year_match.group(1)
                    elif date_match2:
                        week_date = date_match2.group(1).strip()
            
            # Check for coordinator teacher (e.g. "Yılmaz ER İmza")
            if 'imza' in val_lower and not coordinator_teacher:
                import re as _re
                # Extract name before "İmza"
                imza_match = _re.search(r'^(.+?)\s*[İi]mza', val_clean, _re.IGNORECASE)
                if imza_match:
                    coordinator_teacher = imza_match.group(1).strip()
        
        # Now parse data rows from all sheets
        records = []
        
        for sheet_name in xls.sheet_names:
            df = xls.parse(sheet_name, header=None)
            
            # Find the header row (contains "ad soyad" and "sinif" or "no")
            data_start_row = 0
            for r_idx in range(min(10, len(df))):
                row_vals = [turkish_clean(str(v).replace('\n', ' ')) if pd.notna(v) else '' for v in df.iloc[r_idx]]
                row_text = ' '.join(row_vals)
                if ('ad soyad' in row_text or 'adi' in row_text) and ('sinif' in row_text or 'no' in row_text):
                    data_start_row = r_idx + 1
                    break
            
            # Detect column indices from the header row
            header_row_idx = data_start_row - 1 if data_start_row > 0 else None
            
            # Column mapping for Nazilli format
            # The columns vary slightly between sheets but the pattern is:
            # BusinessName | BusinessAddress | (BusinessPhone) | SıraNo | Sınıf | No | AdSoyad | ... | Usta
            col_biz_name = 0
            col_biz_addr = 1
            col_biz_phone = -1
            col_sira = -1
            col_sinif = -1
            col_no = -1
            col_adsoyad = -1
            col_usta = -1
            
            if header_row_idx is not None:
                header_vals = [turkish_clean(str(v).replace('\n', ' ')) if pd.notna(v) else '' for v in df.iloc[header_row_idx]]
                
                for c_idx, hv in enumerate(header_vals):
                    if 'telefon' in hv:
                        col_biz_phone = c_idx
                    elif hv.startswith('sira') or ('sira' in hv and 'no' in hv):
                        col_sira = c_idx
                    elif 'sinif' in hv:
                        col_sinif = c_idx
                    elif hv == 'no' and col_sinif >= 0 and c_idx > col_sinif:
                        col_no = c_idx
                    elif 'ad soyad' in hv or 'adsoyad' in hv or 'ad' == hv:
                        col_adsoyad = c_idx
                    elif 'ustanin' in hv or 'isverenin' in hv or 'imzasi' in hv:
                        col_usta = c_idx
                
                # Fallback: try to find columns by position pattern
                if col_adsoyad < 0:
                    # In Nazilli format, Ad soyad is typically the column after No
                    if col_no >= 0:
                        col_adsoyad = col_no + 1
                
                # Fallback for usta: last column
                if col_usta < 0:
                    col_usta = len(header_vals) - 1
            
            # Track current business across rows (merged cell pattern)
            current_biz_name = ""
            current_biz_addr = ""
            current_biz_phone = ""
            
            for r_idx in range(data_start_row, len(df)):
                row = df.iloc[r_idx]
                row_cells = [clean_string(str(v)).replace('\n', ' ').replace('\r', ' ').strip() if pd.notna(v) else '' for v in row]
                
                # Skip empty rows
                if not any(row_cells):
                    continue
                
                # Check if this row has a new business name
                biz_name_val = row_cells[col_biz_name] if col_biz_name < len(row_cells) else ""
                if biz_name_val:
                    current_biz_name = biz_name_val
                    current_biz_addr = row_cells[col_biz_addr] if col_biz_addr >= 0 and col_biz_addr < len(row_cells) else ""
                    current_biz_phone = row_cells[col_biz_phone] if col_biz_phone >= 0 and col_biz_phone < len(row_cells) else ""
                
                # Extract student data
                student_name = row_cells[col_adsoyad] if col_adsoyad >= 0 and col_adsoyad < len(row_cells) else ""
                student_no = row_cells[col_no] if col_no >= 0 and col_no < len(row_cells) else ""
                class_name = row_cells[col_sinif] if col_sinif >= 0 and col_sinif < len(row_cells) else ""
                usta_name = row_cells[col_usta] if col_usta >= 0 and col_usta < len(row_cells) else ""
                
                # Clean student_no (remove .0 from float parsing)
                if student_no and '.' in student_no:
                    student_no = student_no.split('.')[0]
                
                # Skip if no student name
                if not student_name or len(student_name) < 2:
                    continue
                
                # Guess field from business name
                field = _guess_field_excel(current_biz_name)
                
                records.append({
                    "student_name": student_name,
                    "student_no": student_no,
                    "class_name": class_name,
                    "field": field,
                    "business_name": current_biz_name,
                    "business_address": current_biz_addr,
                    "business_phone": current_biz_phone,
                    "coordinator_name": coordinator_teacher,
                    "days": "Pzt, Sal"
                })
        
        return records
    
    # --- Fallback: Generic Excel parsing (original logic) ---
    records = []
    df = first_df
    
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

def _guess_field_excel(biz_name):
    """Guess the training field from the business name."""
    biz_clean = turkish_clean(biz_name)
    if any(w in biz_clean for w in ["erkek", "berber", "boss", "cut", "man"]):
        return "Güzellik ve Saç Bakım Hizmetleri / Erkek Kuaförlüğü"
    if any(w in biz_clean for w in ["bayan", "coiffure", "kadin", "guzellik", "diva", "nilufer"]):
        return "Güzellik ve Saç Bakım Hizmetleri / Kadın Kuaförlüğü"
    if any(w in biz_clean for w in ["kuafor", "kuaforu", "hair", "club"]):
        return "Güzellik ve Saç Bakım Hizmetleri / Erkek Kuaförlüğü"
    return "Belirtilmedi"

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
    
    # Check if Nazilli format
    is_nazilli_format = False
    
    # Decryption maps
    turkish_map = {
        'ø': 'İ',
        'ù': 'Ş',
        'h': 'Ü',
        'g': 'Ö',
        'ö': 'Ğ',
        '÷': 'Ğ',
        'd': 'Ç',
        '|': 'Ö',
        'Õ': 'I'
    }
    normal_lowercase = set("abcefijklmnopqrtuvwxyzıüşçğ")
    # Removed '-' from non_alphanumeric_encoded to prevent standard hyphens from triggering encoding
    non_alphanumeric_encoded = set("$%&'()*+,./<=>[\\]^_`{|}~øùö÷Õ|")
    punctuation_to_strip = ".-,"

    def guess_field(biz_name):
        biz_clean = turkish_clean(biz_name)
        if any(w in biz_clean for w in ["erkek", "berber", "boss", "cut", "man"]):
            return "Güzellik ve Saç Bakım Hizmetleri / Erkek Kuaförlüğü"
        if any(w in biz_clean for w in ["bayan", "coiffure", "kadin", "guzellik", "diva", "nilufer"]):
            return "Güzellik ve Saç Bakım Hizmetleri / Kadın Kuaförlüğü"
        if any(w in biz_clean for w in ["kuafor", "kuaforu", "hair", "club"]):
            return "Güzellik ve Saç Bakım Hizmetleri / Erkek Kuaförlüğü"
        return "Belirtilmedi"

    def decode_char(c):
        if c in turkish_map:
            return turkish_map[c]
        val = ord(c)
        if 36 <= val <= 61:
            return chr(val + 29)
        if 68 <= val <= 93:
            return chr(val - 3)
        return c

    def is_encoded_word(word):
        # Clean up word by stripping common trailing/leading punctuation
        check_word = word.strip(punctuation_to_strip)
        if not check_word:
            return False
            
        if re.match(r'^\d{10}$', check_word):  # phone
            return False
        if re.match(r'^\d{1,2}/[A-Z0-9]+$', check_word, re.IGNORECASE):  # class
            return False
        if re.match(r'^\d+$', check_word) and (1 <= len(check_word) <= 3):  # student no or row no
            return False
        if re.match(r'^\d{1,2}-\d{1,2}$', check_word):  # date range like 6-10
            return False
        if re.match(r'^202\d$', check_word):  # year like 2025 or 2026
            return False
            
        if any(c in normal_lowercase for c in check_word):
            return False
            
        if any(c in non_alphanumeric_encoded for c in check_word):
            return True
            
        return False

    def decode_word(word):
        if not is_encoded_word(word):
            return word
            
        # Check if this word contains standard plain Latin uppercase A, B, or C.
        # If it does, we do NOT apply Font A (-3) decoding to standard letters in this word.
        has_plain_abc = any(c in "ABC" for c in word)
        
        decoded_chars = []
        for c in word:
            if c in turkish_map:
                decoded_chars.append(turkish_map[c])
            else:
                val = ord(c)
                if 36 <= val <= 61:
                    decoded_chars.append(chr(val + 29))
                elif 68 <= val <= 93 and not has_plain_abc:
                    decoded_chars.append(chr(val - 3))
                else:
                    decoded_chars.append(c)
                    
        return "".join(decoded_chars)

    def decode_string(s):
        if not s:
            return ""
        words = s.split()
        decoded_words = [decode_word(w) for w in words]
        return " ".join(decoded_words)

    def clean_text(text):
        if not text:
            return ""
        # Replace control characters with space
        text = re.sub(r'[\x00-\x1f\x7f-\x9f\xad]', ' ', text)
        # Normalize multiple spaces
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    # Check format using both raw and decoded checks
    for page in reader.pages[:2]:
        text = page.extract_text() or ""
        decoded_text = decode_string(clean_text(text))
        if "HAFTALIK ÖĞRETMEN GÖREV FORMU" in text or "ÇIRAK ÖĞRENCİLER İÇİN" in text or \
           "HAFTALIK ÖĞRETMEN GÖREV FORMU" in decoded_text or "ÇIRAK ÖĞRENCİLER İÇİN" in decoded_text:
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

    # 1. Extract, decode and clean all lines per page
    all_pages_lines = []
    for page in reader.pages:
        text = page.extract_text() or ""
        # Clean control characters before decoding string so that split() works on spaces!
        lines = [decode_string(clean_text(l.strip())) for l in text.split('\n') if l.strip()]
        all_pages_lines.append(lines)

    # 2. Extract week date and coordinator teacher from page 1 top section
    week_date = ""
    coordinator_teacher = ""
    
    # Search for date pattern in the first page
    date_pattern = re.compile(r'(\d{1,2}[-./]\d{1,2}[-./]\d{4})|(\d{1,2}\s*-\s*\d{1,2}\s+[a-zA-ZğüşıöçĞÜŞİÖÇ]+)', re.IGNORECASE)
    year_pattern = re.compile(r'\b(2025|2026)\b')
    
    first_page_lines = all_pages_lines[0]
    
    # Simple search for week date at the top
    for line in first_page_lines[:6]:
        if date_pattern.search(line) or any(m in turkish_clean(line) for m in ["ocak", "subat", "mart", "nisan", "mayis", "haziran", "temmuz", "agustos", "eylul", "ekim", "kasim", "aralik"]):
            week_date = line
            # Check if next line contains year to merge them
            line_idx = first_page_lines.index(line)
            if line_idx + 1 < len(first_page_lines) and year_pattern.match(first_page_lines[line_idx + 1]):
                week_date += " " + first_page_lines[line_idx + 1]
            break
            
    # Search for coordinator teacher (line before "İmza")
    for idx, line in enumerate(first_page_lines[:20]):
        if turkish_clean(line) == "imza" and idx > 0:
            coordinator_teacher = first_page_lines[idx - 1]
            break

    # 3. Filter out boilerplate lines
    def is_boilerplate_line(line):
        line_comp = turkish_clean(line).replace(" ", "")
        if not line_comp:
            return True
        
        # Exact match keywords after cleaning
        exact_boilerplates = {
            "adi", "acresi", "telefonu", "sira", "no", "sinif", "adsoyad", 
            "tc", "imza", "imzasi", "kasesi", "gorusu", "gorus", "gozlemleri",
            "pratikegitimkonusu", "isletmenin", "ogrencinin", "haftalikkontrol",
            "tkck", "qkck"
        }
        if line_comp in exact_boilerplates:
            return True
            
        # Substring matches
        boilerplates = [
            "valiligi", "mudurlugu", "meslekiegitim", "gorevformu", "cirakogrenci",
            "ogrencisayisi", "isyerisayisi", "gorevozeti", "mdyrd", "oguzhanunal",
            "teslimediniz", "kkkkkkkk", "qkck", "surdurmektedir", "ayrilmistir",
            "olmadigindan", "gorusalinamadi", "devamsizlikyapmistir", "ogretmeninustanin",
            "imzasikasesi", "haftasindansonrakihafta", "sayilikanun", "uhdenize", "haftasindan",
            "egitimogretim", "beceri", "ayril", "alinamadi", "devam", "pratik",
            "veren", "ustanin", "usta", "adisoyadi", "imza", "isyeri", "sayi", "qkc", "adresi", 
            "kase", "uver", "yapm", "3udw", "rqvx", "omose", "tkck"
        ]
        if any(bp in line_comp for bp in boilerplates):
            return True
            
        # Page coords/numbers
        if line_comp in ["114", "115", "116", "120", "121", "122"]:
            return True
            
        return False

    cleaned_lines = []
    for page_lines in all_pages_lines:
        for line in page_lines:
            line_clean = line.strip()
            if not line_clean:
                continue
            if len(line_clean) <= 1 and not line_clean.isdigit():
                continue
            
            # Skip page numbers/garbage
            if line_clean in ["{", "}", "/"] or re.match(r'^\d+\s*/\s*\d+$', line_clean):
                continue
                
            if is_boilerplate_line(line_clean):
                continue
                
            # Skip week date line from data stream (safeguarded for length)
            if week_date and len(line_clean) > 3 and (line_clean == week_date or line_clean in week_date or week_date in line_clean):
                continue
                
            # Skip coordinator teacher line itself from the data stream
            if coordinator_teacher and line_clean == coordinator_teacher:
                continue
                
            # Skip date signature line
            if re.match(r'^\.*\/.*\/\d{4}$', line_clean):
                continue
                
            cleaned_lines.append(line_clean)

    # 4. Parse the stream of lines
    class_pattern = re.compile(r'^\d{1,2}/[A-Z0-9]+$', re.IGNORECASE)
    
    # First, let's identify the indices of student blocks in the cleaned_lines list
    student_indices = []
    i = 0
    while i < len(cleaned_lines) - 4:
        # Check if i matches a student block
        line_1 = cleaned_lines[i]      # Row No
        line_2 = cleaned_lines[i+1]    # Class Name
        line_3 = cleaned_lines[i+2]    # Student No
        line_4 = cleaned_lines[i+3]    # Student Name
        line_5 = cleaned_lines[i+4]    # Trainer Name
        
        if line_1.isdigit() and class_pattern.match(line_2) and line_3.isdigit() and len(line_4.split()) >= 1 and len(line_5.split()) >= 1:
            student_indices.append(i)
            i += 5  # Skip past this student block
        else:
            i += 1

    if not student_indices:
        return []
        
    # Group by businesses
    address_keywords = ['mah', 'sok', 'sk', 'cad', 'cd', 'apt', 'no:', 'blv', 'bulvar', 'nazilli', 'kuyucak', 'aydin', 'aydın', 'pamukören', 'pamukoren', 'horsunlu']
    phone_pattern = re.compile(r'\b5\d{9}\b|\b\d{10}\b')
    
    current_business = { "name": "Bilinmeyen İşletme", "address": "", "phone": "" }
    
    for idx, start_idx in enumerate(student_indices):
        row_no = cleaned_lines[start_idx]
        class_name = cleaned_lines[start_idx+1]
        student_no = cleaned_lines[start_idx+2]
        student_name = cleaned_lines[start_idx+3]
        trainer_name = cleaned_lines[start_idx+4]
        
        # If row_no is 1 (or it's the first student block), parse the business details preceding it
        if row_no == "1" or idx == 0:
            # The business lines are between the end of the previous student block (if any) and start_idx
            prev_end_idx = student_indices[idx-1] + 5 if idx > 0 else 0
            biz_lines = cleaned_lines[prev_end_idx:start_idx]
            
            # Parse business details from biz_lines
            biz_name = ""
            biz_address = ""
            biz_phone = ""
            
            # Find phone number
            remaining_biz_lines = []
            for bl in biz_lines:
                phone_match = phone_pattern.search(bl)
                if phone_match:
                    biz_phone = phone_match.group(0)
                elif bl.isdigit():
                    # Skip standalone coordinates or counts like 14, 10
                    continue
                else:
                    remaining_biz_lines.append(bl)
                    
            # Split remaining lines into name and address
            name_parts = []
            address_parts = []
            found_address_start = False
            
            for bl in remaining_biz_lines:
                bl_comp = turkish_clean(bl)
                if any(kw in bl_comp for kw in address_keywords) or found_address_start:
                    found_address_start = True
                    address_parts.append(bl)
                else:
                    name_parts.append(bl)
                    
            if name_parts:
                biz_name = " ".join(name_parts)
            else:
                biz_name = "Belirtilmedi"
                
            biz_address = " ".join(address_parts)
            
            current_business = {
                "name": biz_name,
                "address": biz_address,
                "phone": biz_phone
            }
            
        # Append record
        records.append({
            "student_name": student_name,
            "student_no": student_no,
            "class_name": class_name,
            "field": guess_field(current_business["name"]),
            "business_name": current_business["name"],
            "business_address": current_business["address"],
            "business_phone": current_business["phone"],
            "coordinator_name": coordinator_teacher.upper() if coordinator_teacher else "",
            "days": "Pzt, Sal"
        })
        
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

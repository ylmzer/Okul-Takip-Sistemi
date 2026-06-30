import sys
import json
import os
import re
import pandas as pd

if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

def clean_string(val):
    if val is None or pd.isna(val):
        return ""
    val = str(val).strip()
    val = re.sub(r'\s+', ' ', val)
    return val

def clean_compare(val):
    return clean_string(val).lower().replace('\u0307', '').replace(' ', '')

def split_full_name(full_name):
    full_name = clean_string(full_name)
    parts = [p for p in full_name.split(' ') if p]
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    last_name = parts[-1]
    first_name = " ".join(parts[:-1])
    return first_name, last_name

def normalize_phone(val):
    phone = clean_string(val)
    if phone.endswith(".0"):
        phone = phone[:-2]
    # Remove non-numeric characters
    phone = re.sub(r'\D', '', phone)
    # If it is 10 digits and starts with 5, add 0 (or keep as is)
    return phone

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Dosya yolu belirtilmedi"}, ensure_ascii=False))
        sys.exit(1)
        
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"error": "Dosya bulunamadı"}, ensure_ascii=False))
        sys.exit(1)
        
    try:
        # Read Excel
        xls = pd.ExcelFile(file_path)
        df = xls.parse(xls.sheet_names[0], header=None)
        
        # Find header row
        header_row_idx = -1
        col_mapping = {}
        
        keywords = {
            'full_name': ['adsoyad', 'adısoyadı', 'adisoyadi', 'ogrenciadisoyadi', 'öğrenciadısoyadı', 'kursiyeradisoyadi'],
            'first_name': ['ad', 'adı', 'adi', 'isim', 'firstname', 'öğrenciadı', 'ogrenciadi'],
            'last_name': ['soyad', 'soyadi', 'soyadı', 'lastname', 'öğrencisoyadı'],
            'phone': ['telefon', 'telefonnumarasi', 'telefonnumarası', 'phone', 'tel', 'ceptel']
        }
        
        # Look for headers in the first 15 rows
        for r_idx in range(min(15, len(df))):
            row_vals = [clean_compare(val) if pd.notna(val) else '' for val in df.iloc[r_idx]]
            matches = {}
            for key, kws in keywords.items():
                for c_idx, val in enumerate(row_vals):
                    if any(kw == val or val.startswith(kw) for kw in kws):
                        matches[key] = c_idx
                        break
            # We need phone column, and either full_name OR both first_name and last_name
            has_name = 'full_name' in matches or ('first_name' in matches and 'last_name' in matches)
            if 'phone' in matches and has_name:
                header_row_idx = r_idx
                col_mapping = matches
                break
        
        if header_row_idx == -1:
            # Fallback heuristic: assume first row with content is header, or try to identify by contents
            # For simplicity, if no header is found, raise error
            print(json.dumps({"error": "Excel başlıkları bulunamadı. Lütfen 'Ad Soyad' ve 'Telefon' sütunlarının olduğundan emin olun."}, ensure_ascii=False))
            sys.exit(1)
            
        start_row = header_row_idx + 1
        records = []
        for r_idx in range(start_row, len(df)):
            row = df.iloc[r_idx]
            row_cells = [clean_string(val) for val in row]
            if not any(row_cells):
                continue
                
            phone = normalize_phone(row_cells[col_mapping['phone']])
            first_name = ""
            last_name = ""
            
            if 'full_name' in col_mapping:
                fname = row_cells[col_mapping['full_name']]
                first_name, last_name = split_full_name(fname)
            else:
                first_name = row_cells[col_mapping['first_name']].strip()
                last_name = row_cells[col_mapping['last_name']].strip()
                
            if not first_name and not last_name:
                continue
                
            # Title capitalization
            first_name = first_name.title()
            last_name = last_name.upper()
            
            records.append({
                "firstName": first_name,
                "lastName": last_name,
                "phoneNumber": phone
            })
            
        print(json.dumps({"records": records}, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({"error": f"Hata oluştu: {str(e)}"}, ensure_ascii=False))
        sys.exit(1)

if __name__ == '__main__':
    main()

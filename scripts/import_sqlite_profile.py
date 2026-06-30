import sys
import json
import sqlite3
import re

# Ensure standard output uses UTF-8 encoding
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

def parse_days(gunler):
    if not gunler:
        return "Pzt, Sal"
    # The old program stored the opposite (internship days).
    # We need the school days, which is the complement in 1-5 (Pzt, Sal, Çar, Per, Cum)
    all_weekdays = ['1', '2', '3', '4', '5']
    stored_digits = [c for c in str(gunler) if c in all_weekdays]
    complement_digits = [d for d in all_weekdays if d not in stored_digits]
    
    mapping = {'1': 'Pzt', '2': 'Sal', '3': 'Çar', '4': 'Per', '5': 'Cum', '6': 'Cmt', '7': 'Paz'}
    days = [mapping[d] for d in complement_digits]
    if not days:
        return "Pzt, Sal"
    return ", ".join(days)

def clean_string(val):
    if val is None:
        return ""
    return str(val).strip()

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No database path provided"}))
        return

    db_path = sys.argv[1]
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. School Info
        school_records = []
        try:
            okul_rows = cursor.execute("SELECT id, ad, il, mudur, koord_muduryrd, koord_ogretmen FROM okul").fetchall()
            for r in okul_rows:
                school_records.append({
                    "id": f"school-{r[0]}",
                    "name": clean_string(r[1]),
                    "city": clean_string(r[2]),
                    "principal": clean_string(r[3]) or "Belirtilmedi",
                    "deputy": clean_string(r[4])
                })
        except Exception:
            pass
            
        # 2. Teacher Pool
        teachers = []
        try:
            ogretmen_rows = cursor.execute("SELECT id, adisoyadi FROM ogretmen").fetchall()
            for r in ogretmen_rows:
                name = clean_string(r[1])
                # Filter out system tags like '{ 20-24 Nisan 2026 }'
                if name and not name.startswith('{'):
                    teachers.append({
                        "id": f"teacher-{r[0]}",
                        "name": name
                    })
        except Exception:
            pass
            
        # 3. Fields / Branches
        fields = []
        try:
            alandal_rows = cursor.execute("SELECT id, alan, dal FROM alandal").fetchall()
            for r in alandal_rows:
                fields.append({
                    "id": f"field-{r[0]}",
                    "area": clean_string(r[1]),
                    "branch": clean_string(r[2])
                })
        except Exception:
            pass
            
        # 4. Businesses
        businesses = []
        try:
            isletme_rows = cursor.execute("SELECT id, adi, tel, eposta, adresi, calisan_grup FROM isletme").fetchall()
            for r in isletme_rows:
                businesses.append({
                    "id": f"biz-{r[0]}",
                    "name": clean_string(r[1]),
                    "phone": clean_string(r[2]),
                    "email": clean_string(r[3]),
                    "address": clean_string(r[4]),
                    "group": str(r[5]) if r[5] is not None else "1"
                })
        except Exception:
            pass
            
        # 5. Coordinators (Assignments)
        coordinators = []
        # Store a mapping of coordinator_id to business_id and teacher_name for student lookup
        coord_map = {}
        try:
            # Fetch muduryrd map
            muduryrd_map = {}
            try:
                muduryrd_rows = cursor.execute("SELECT id, adisoyadi FROM muduryrd").fetchall()
                for r_my in muduryrd_rows:
                    muduryrd_map[str(r_my[0])] = clean_string(r_my[1])
            except Exception:
                pass

            coord_rows = cursor.execute("SELECT id, ogretmen, muduryrd, isletme, gun FROM koordinator").fetchall()
            # Fetch teachers for name lookup
            teachers_map = {t['id'].split('-')[1]: t['name'] for t in teachers}
            for r in coord_rows:
                teacher_id = str(r[1])
                teacher_name = teachers_map.get(teacher_id, "Belirtilmedi")
                coord_map[r[0]] = {
                    "businessId": f"biz-{r[3]}",
                    "teacherName": teacher_name
                }
                deputy_id = str(r[2])
                deputy_name = muduryrd_map.get(deputy_id, "")
                coordinators.append({
                    "id": f"coord-{r[0]}",
                    "teacher": teacher_name,
                    "businessId": f"biz-{r[3]}",
                    "deputy": deputy_name,
                    "day": str(r[4]) if r[4] is not None else ""
                })
        except Exception:
            pass
            
        # 6. Students
        students = []
        try:
            # Map of fields for student branch name
            fields_map = {f['id'].split('-')[1]: f for f in fields}
            student_rows = cursor.execute("SELECT id, okulno, adisoyadi, alandal, koordinator, gunler, sinif, aktif FROM ogrenci").fetchall()
            for r in student_rows:
                field_id = str(r[3])
                field_obj = fields_map.get(field_id, {"area": "Belirtilmedi", "branch": ""})
                field_name = field_obj["area"]
                if field_obj["branch"]:
                    field_name += f" / {field_obj['branch']}"
                
                coord_id = r[4]
                mapped_coord = coord_map.get(coord_id, {"businessId": "biz-1", "teacherName": ""})
                
                students.append({
                    "id": f"stu-{r[0]}",
                    "no": str(r[1]),
                    "name": clean_string(r[2]),
                    "className": clean_string(r[6]) or "12/A",
                    "field": field_name,
                    "businessId": mapped_coord["businessId"],
                    "days": parse_days(r[5]),
                    "active": bool(r[7])
                })
        except Exception:
            pass

        # 7. Holidays
        holidays = []
        try:
            holiday_rows = cursor.execute("SELECT id, baslangic, bitis, aciklama, araTatil, baslangicDilimi, bitisDilimi FROM resmiTatiller").fetchall()
            for r in holiday_rows:
                holidays.append({
                    "id": f"hol-{r[0]}",
                    "startDate": clean_string(r[1]),
                    "endDate": clean_string(r[2]),
                    "name": clean_string(r[3]),
                    "isSchoolBreak": bool(r[4]),
                    "startPart": "pm" if r[5] == 1 else "full",
                    "endPart": "pm" if r[6] == 1 else "full"
                })
        except Exception:
            pass
            
        # 8. Student Absence Records
        absence_records = {}
        try:
            absence_rows = cursor.execute("SELECT ogrenciId, tarih, sembol FROM ogrDevamsizlik").fetchall()
            for r in absence_rows:
                student_id = f"stu-{r[0]}"
                date_val = clean_string(r[1])
                symbol = clean_string(r[2])
                
                if student_id not in absence_records:
                    absence_records[student_id] = {}
                if date_val not in absence_records[student_id]:
                    absence_records[student_id][date_val] = {}
                
                if symbol == 'S':
                    absence_records[student_id][date_val]['am'] = 'S'
                    absence_records[student_id][date_val]['pm'] = 'X'
                elif symbol == 'Ö':
                    absence_records[student_id][date_val]['am'] = 'X'
                    absence_records[student_id][date_val]['pm'] = 'Ö'
                else:
                    absence_records[student_id][date_val]['am'] = symbol
                    absence_records[student_id][date_val]['pm'] = symbol
        except Exception:
            pass
            
        # Compile final results
        result = {
            "schoolRecords": school_records,
            "teacherPool": teachers,
            "fields": fields,
            "businesses": businesses,
            "students": students,
            "coordinators": coordinators,
            "holidays": holidays,
            "absenceRecords": absence_records
        }
        
        # Add basic school name/year if schoolRecords has elements
        if school_records:
            result["school"] = {
                "name": school_records[0]["name"],
                "year": "2025-2026"
            }
            
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()

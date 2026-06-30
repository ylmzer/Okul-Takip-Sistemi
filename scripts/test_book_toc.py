"""Extended test suite for extract_book_toc.py

Tests all edge cases from real-world MEB textbooks.
"""
import sys, os, re, json
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, "scripts")

from extract_book_toc import (
    parse_toc_from_text, group_by_top_level, match_units_to_sections,
    format_entry, one_line, clean_number, deduplicate_entries,
    read_pdf_pages, find_toc_pages
)

passed = 0
failed = 0

def test(name, actual, expected, show_detail=True):
    global passed, failed
    if actual == expected:
        passed += 1
        print(f"  PASS: {name}")
    else:
        failed += 1
        print(f"  FAIL: {name}")
        if show_detail:
            print(f"    Expected: {expected}")
            print(f"    Got:      {actual}")

def test_contains(name, items, expected_numbers):
    global passed, failed
    actual_numbers = [e["number"] for e in items]
    missing = [n for n in expected_numbers if n not in actual_numbers]
    if not missing:
        passed += 1
        print(f"  PASS: {name} ({len(actual_numbers)} entries, all {len(expected_numbers)} expected found)")
    else:
        failed += 1
        print(f"  FAIL: {name}")
        print(f"    Missing: {missing}")
        print(f"    Got: {actual_numbers}")

# ============================================================================
print("\n" + "="*80)
print("1. STANDARD TOC FORMATS")
print("="*80)

# 1a: Full Şirketler Muhasebesi TOC (from user's screenshot)
toc_sirketler = """
1. ŞİRKETLER HAKKINDA GENEL BİLGİLER .............. 7
1.1. Şirket Kavramı ................................ 8
1.2. Şirketin Unsurları ........................... 12
1.3. Şirketlerin Sınıflandırılması ................ 15
1.3.1. Genel Olarak Şirketlerin Sınıflandırılması . 16
1.3.2. Gerçek Şahıs İşletmeleri ................... 18
1.3.3. Şahıs ve Sermaye Şirketlerinin Karşılaştırılması 20
1.4. Şirketler Muhasebesi ......................... 22
ÖLÇME VE DEĞERLENDİRME ............................ 24
2. KOLEKTİF ŞİRKETLER ............................. 27
2.1. Kolektif Şirketin Tanımı ..................... 28
2.2. Kolektif Şirketin Özellikleri ................ 30
2.3. Kolektif Şirketin Kuruluş İşlemleri .......... 32
2.4. Kuruluş İşlemlerinin Muhasebe Kayıtları ...... 36
2.5. Sermaye Değişiklikleri ve Muhasebe Kayıtları .. 42
2.5.1. Sermaye Artırımı ........................... 43
2.5.2. Sermaye Azaltımı ........................... 46
2.6. Kolektif Şirketlerde Kar ve Zarar Dağıtımı ... 50
2.6.1. Kar Dağıtımı ............................... 51
2.6.2. Zarar Dağıtımı ............................. 54
ÖLÇME VE DEĞERLENDİRME ............................ 56
3. KOMANDİT ŞİRKETLER ............................. 60
3.1. Komandit Şirketin Tanımı ..................... 61
3.2. Komandit Şirketin Özellikleri ................ 63
3.3. Komandit Şirketin Kuruluş İşlemleri .......... 65
3.4. Kuruluş İşlemlerinin Muhasebe Kayıtları ...... 68
3.5. Sermaye Değişiklikleri ....................... 72
3.6. Komandit Şirketlerde Kar ve Zarar Dağıtımı ... 76
ÖLÇME VE DEĞERLENDİRME ............................ 80
4. SERMAYE ŞİRKETLERİ ............................. 85
4.1. Anonim Şirket ve Özellikleri .................. 86
4.2. Limited Şirketler ............................ 92
4.3. Sermayesi Paylara Bölünmüş Komandit Şirketler  96
4.4. Sermaye Şirketlerinde Sözleşme Hazırlama ..... 98
4.5. Sermaye Şirketlerinin Kuruluşu .............. 102
4.6. Sermaye Şirketlerinde Sermaye Değişiklikleri . 108
4.7. Limited Şirketlerde Sermaye Değişiklikleri ... 114
4.8. Sermaye Şirketlerinde Kar ve Zarar Dağıtımı .. 120
ÖLÇME VE DEĞERLENDİRME ........................... 130
5. ŞİRKETLERDE TASFİYE ........................... 135
5.1. Tasfiye Kavramı ............................. 136
5.2. Şahıs Şirketlerinde Tasfiye ................. 140
5.3. Sermaye Şirketlerinde Tasfiye ................ 148
ÖLÇME VE DEĞERLENDİRME ........................... 155
6. ŞİRKETLERDE BİRLEŞME .......................... 160
6.1. Şirketlerde Birleşme Kavramı ................ 161
6.2. Şirketlerin Birleşme Sebepleri ............... 163
6.3. Şirketlerin Birleşme Şekilleri ............... 165
6.4. Birleşme Yapabilecek Olan Şirketler .......... 167
6.5. Şirket Birleşmelerinin Sınıflandırılması ..... 170
6.6. Şirket Birleşme Süreci ...................... 173
6.7. Birleşme İşlemlerinin Muhasebe Kayıtları ..... 176
ÖLÇME VE DEĞERLENDİRME ........................... 185
KAYNAKÇA ......................................... 190
"""
entries = parse_toc_from_text(toc_sirketler)
test_contains("Full Şirketler Muhasebesi", entries, [
    "1", "1.1", "1.2", "1.3", "1.3.1", "1.3.2", "1.3.3", "1.4",
    "2", "2.1", "2.2", "2.3", "2.4", "2.5", "2.5.1", "2.5.2", "2.6", "2.6.1", "2.6.2",
    "3", "3.1", "3.2", "3.3", "3.4", "3.5", "3.6",
    "4", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8",
    "5", "5.1", "5.2", "5.3",
    "6", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7",
])

# 1b: Verify matching with 6 units
grouped = group_by_top_level(entries)
units_6 = [
    {"title": "Şirketler Hakkında Genel Bilgiler"},
    {"title": "Kolektif Şirketler"},
    {"title": "Komandit Şirketler"},
    {"title": "Sermaye Şirketleri"},
    {"title": "Şirketlerde Tasfiye"},
    {"title": "Şirketlerde Birleşme"},
]
mapping = match_units_to_sections(units_6, grouped)
for ui in range(6):
    expected_top = str(ui + 1)
    test(f"Match unit {ui} -> section {expected_top}", mapping.get(ui), expected_top)

# ============================================================================
print("\n" + "="*80)
print("2. EDGE CASES")
print("="*80)

# 2a: Split lines (number on one line, title on next)
toc_split = """
1.
ŞİRKETLER HAKKINDA GENEL BİLGİLER
1.1.
Şirket Kavramı
1.2. Şirketin Unsurları ........ 12
1.3.
Şirketlerin Sınıflandırılması
1.4. Şirketler Muhasebesi
"""
entries = parse_toc_from_text(toc_split)
test_contains("Split lines", entries, ["1", "1.1", "1.2", "1.3", "1.4"])

# 2b: Single-digit standalone (just "1" on a line)
toc_single_digit = """
1
ŞİRKETLER HAKKINDA GENEL BİLGİLER .............. 7
1.1 Şirket Kavramı ............................... 8
1.2 Şirketin Unsurları .......................... 12
2
KOLEKTİF ŞİRKETLER ............................. 27
2.1 Kolektif Şirketin Tanımı .................... 28
"""
entries = parse_toc_from_text(toc_single_digit)
test_contains("Single-digit standalone", entries, ["1", "1.1", "1.2", "2", "2.1"])

# 2c: Mixed formats (some with dots, some without, some with trailing dot)
toc_mixed = """
1. BÖLÜM BİR .............. 5
1.1 Konu Bir ............... 6
1.2. Konu İki .............. 8
1.3 Konu Üç ............... 10
2 BÖLÜM İKİ ............... 15
2.1. Alt Konu .............. 16
"""
entries = parse_toc_from_text(toc_mixed)
test_contains("Mixed number formats", entries, ["1", "1.1", "1.2", "1.3", "2", "2.1"])

# 2d: TOC with ÖLÇME VE DEĞERLENDİRME between every section
toc_with_olcme = """
1. BİRİNCİ ÜNİTE .......... 5
1.1. Konu A ............... 6
1.2. Konu B ............... 8
ÖLÇME VE DEĞERLENDİRME ... 10
2. İKİNCİ ÜNİTE .......... 15
2.1. Konu C .............. 16
2.2. Konu D .............. 18
ÖLÇME VE DEĞERLENDİRME ... 20
3. ÜÇÜNCÜ ÜNİTE ......... 25
3.1. Konu E .............. 26
ÖLÇME VE DEĞERLENDİRME ... 28
"""
entries = parse_toc_from_text(toc_with_olcme)
test_contains("TOC with ÖLÇME VE DEĞERLENDİRME", entries, [
    "1", "1.1", "1.2", "2", "2.1", "2.2", "3", "3.1"
])
# Verify no excluded entries
titles = [e["title"] for e in entries]
test("No excluded entries leaked", any("ÖLÇME" in t for t in titles), False)

# 2e: Deep numbering (4+ levels)
toc_deep4 = """
1. ANA BÖLÜM .............. 5
1.1. Alt Bölüm ............ 6
1.1.1. Detay .............. 7
1.1.1.1. Çok Detay ........ 8
1.1.1.2. Başka Detay ....... 9
1.1.2. Diğer Detay ........ 10
1.2. İkinci Alt Bölüm ..... 12
"""
entries = parse_toc_from_text(toc_deep4)
test_contains("Deep 4-level nesting", entries, [
    "1", "1.1", "1.1.1", "1.1.1.1", "1.1.1.2", "1.1.2", "1.2"
])

# 2f: Page numbers without dots (just spaces)
toc_spaces_only = """
1. ANA BÖLÜM                    5
1.1. Alt Bölüm                  6
1.2. Diğer Alt Bölüm           10
2. İKİNCİ BÖLÜM                15
"""
entries = parse_toc_from_text(toc_spaces_only)
test_contains("Page nums with spaces only", entries, ["1", "1.1", "1.2", "2"])

# 2g: No page numbers at all
toc_no_pages = """
1. ANA BÖLÜM
1.1. Alt Bölüm
1.2. Diğer Alt Bölüm
2. İKİNCİ BÖLÜM
2.1. Konu
"""
entries = parse_toc_from_text(toc_no_pages)
test_contains("No page numbers", entries, ["1", "1.1", "1.2", "2", "2.1"])

# 2h: Multiline continuation (title wraps to next line)
toc_multiline = """
1. ŞİRKETLER HAKKINDA
GENEL BİLGİLER .............. 7
1.1. Şirket Kavramı ve
Tanımları .................... 8
1.2. Şirketin Unsurları ..... 12
"""
entries = parse_toc_from_text(toc_multiline)
test_contains("Multiline continuation", entries, ["1", "1.1", "1.2"])
# Check that continuation was properly appended
entry_1 = next((e for e in entries if e["number"] == "1"), None)
if entry_1:
    test("Continuation title complete", "GENEL" in entry_1["title"], True)

# ============================================================================
print("\n" + "="*80)
print("3. MATCHING WITH VARIED UNIT NAMES")
print("="*80)

toc_for_match = """
1. ŞİRKETLER HAKKINDA GENEL BİLGİLER .... 7
1.1. Şirket Kavramı ...................... 8
2. KOLEKTİF ŞİRKETLER ................... 20
2.1. Tanımı .............................. 21
3. KOMANDİT ŞİRKETLER ................... 40
3.1. Tanımı .............................. 41
4. SERMAYE ŞİRKETLERİ ................... 60
4.1. Anonim Şirket ....................... 61
5. KOOPERATİFLER ......................... 80
5.1. Kooperatif Kavramı .................. 81
6. ŞİRKETLERDE TASFİYE .................. 100
6.1. Tasfiye Kavramı ..................... 101
"""
entries = parse_toc_from_text(toc_for_match)
grouped = group_by_top_level(entries)

# Partial title match
units_partial = [
    {"title": "Genel Bilgiler"},
    {"title": "Kolektif Şirketler"},
    {"title": "Komandit Şirketler"},
    {"title": "Sermaye Şirketleri"},
    {"title": "Kooperatifler"},
    {"title": "Tasfiye"},
]
mapping = match_units_to_sections(units_partial, grouped)
for i in range(6):
    test(f"Partial match unit {i}", mapping.get(i), str(i+1))

# ============================================================================
print("\n" + "="*80)
print("4. HELPER FUNCTIONS")
print("="*80)

test("clean_number('1.2.3')", clean_number("1.2.3"), "1.2.3")
test("clean_number('1. 2. 3')", clean_number("1. 2. 3"), "1.2.3")
test("clean_number('01.02')", clean_number("01.02"), "1.2")
test("clean_number('1.2.3.')", clean_number("1.2.3."), "1.2.3")
test("clean_number('1')", clean_number("1"), "1")
test("clean_number('10.2')", clean_number("10.2"), "10.2")

# ============================================================================
print("\n" + "="*80)
print("5. REAL PDF TESTS (DBFs)")
print("="*80)

base = r"MUHASEBE VE FİNANSMAN ALANI"
for path, label in [
    (os.path.join(base, "11.SINIF", "ŞİRKETLER MUHASEBESİ 11.pdf"), "Şirketler Muhasebesi 11"),
    (os.path.join(base, "10.SINIF", "GENEL MUHASEBE 10.pdf"), "Genel Muhasebe 10"),
]:
    if not os.path.exists(path):
        print(f"  SKIP: {label}")
        continue
    pages = read_pdf_pages(path, max_pages=15)
    toc_indices, toc_text = find_toc_pages(pages)
    source = toc_text if toc_text else "\n".join(pages)
    entries = parse_toc_from_text(source)
    grouped = group_by_top_level(entries)
    print(f"  {label}: {len(entries)} entries, sections: {sorted(grouped.keys(), key=lambda x: int(x) if x.isdigit() else 99)}")

# ============================================================================
print("\n" + "="*80)
print(f"RESULTS: {passed} passed, {failed} failed")
if failed == 0:
    print("ALL TESTS PASSED!")
print("="*80)

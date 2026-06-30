import sys, os
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader

book_path = r"MUHASEBE VE FİNANSMAN ALANI\11.SINIF\ŞİRKETLER MUHASEBESİ 11.pdf"
reader = PdfReader(book_path)
print(f"Total pages: {len(reader.pages)}")

# Scan first 15 pages for İÇİNDEKİLER
for i in range(min(15, len(reader.pages))):
    txt = reader.pages[i].extract_text() or ""
    has_toc = "İÇİNDEKİLER" in txt or "ICINDEKILER" in txt or "İçindekiler" in txt
    first_line = txt.split('\n')[0].strip() if txt else "(empty)"
    print(f"Page {i+1}: {len(txt)} chars | TOC header: {has_toc} | First line: {first_line[:80]}")
    if has_toc:
        print("  --- RAW TOC PAGE TEXT (first 2000 chars) ---")
        print(txt[:2000])
        print("  --- END ---")

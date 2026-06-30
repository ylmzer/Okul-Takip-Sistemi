"""Debug script to extract and display TOC from real book PDFs.

Prints:
1. Raw TOC text found
2. Parsed entries
3. Any gaps in numbering
"""
import sys, os, json
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from extract_book_toc import (
    parse_toc_from_text, group_by_top_level,
    read_pdf_pages, find_toc_pages
)

BOOKS_DIR = r"C:\Users\eyilm\Downloads\Documents\Kitaplar"

def detect_gaps(entries):
    """Detect missing sequential numbers in entries."""
    numbers = [e["number"] for e in entries]
    gaps = []
    
    # Group by parent prefix
    by_parent = {}
    for num in numbers:
        parts = num.split(".")
        if len(parts) == 1:
            parent = ""
        else:
            parent = ".".join(parts[:-1])
        by_parent.setdefault(parent, []).append(int(parts[-1]))
    
    for parent, children in by_parent.items():
        children.sort()
        for i in range(len(children) - 1):
            expected = children[i] + 1
            actual = children[i + 1]
            if expected != actual:
                for missing_num in range(expected, actual):
                    prefix = f"{parent}.{missing_num}" if parent else str(missing_num)
                    gaps.append(prefix)
    
    return gaps

def test_book(filename):
    filepath = os.path.join(BOOKS_DIR, filename)
    if not os.path.exists(filepath):
        print(f"  NOT FOUND: {filepath}")
        return
    
    print(f"\n{'='*80}")
    print(f"BOOK: {filename}")
    print(f"{'='*80}")
    
    # Read pages
    pages = read_pdf_pages(filepath, max_pages=20)
    print(f"  Pages read: {len(pages)}")
    
    # Find TOC
    toc_indices, toc_text = find_toc_pages(pages)
    print(f"  TOC pages: {toc_indices}")
    
    if toc_text:
        print(f"\n  --- RAW TOC TEXT ({len(toc_text)} chars) ---")
        for line in toc_text.splitlines():
            stripped = line.strip()
            if stripped:
                print(f"    {stripped}")
        print(f"  --- END RAW TOC TEXT ---")
    else:
        print(f"  NO TOC TEXT FOUND")
        # Show first page text for debugging
        if pages:
            print(f"\n  --- FIRST PAGE TEXT (for debug) ---")
            for line in pages[0].splitlines()[:30]:
                print(f"    {line.strip()}")
            print(f"  --- END FIRST PAGE ---")
    
    # Parse entries
    source = toc_text if toc_text else "\n".join(pages[:15])
    entries = parse_toc_from_text(source)
    
    print(f"\n  PARSED ENTRIES ({len(entries)}):")
    for e in entries:
        print(f"    {e['number']:10s}  {e['title']}")
    
    # Detect gaps
    gaps = detect_gaps(entries)
    if gaps:
        print(f"\n  ⚠ GAPS DETECTED: {gaps}")
    else:
        print(f"\n  ✓ No gaps detected")
    
    # Group info
    grouped = group_by_top_level(entries)
    print(f"\n  SECTIONS: {sorted(grouped.keys(), key=lambda x: int(x) if x.isdigit() else 99)}")
    for top in sorted(grouped.keys(), key=lambda x: int(x) if x.isdigit() else 99):
        items = grouped[top]
        print(f"    Section {top}: {len(items)} entries")
    
    return entries

# Test all books
books = sorted(os.listdir(BOOKS_DIR))
print(f"Found {len(books)} books in {BOOKS_DIR}:")
for b in books:
    print(f"  - {b}")

all_results = {}
for book in books:
    if book.lower().endswith(".pdf"):
        entries = test_book(book)
        if entries:
            all_results[book] = entries

print(f"\n\n{'='*80}")
print("SUMMARY")
print(f"{'='*80}")
for book, entries in all_results.items():
    gaps = detect_gaps(entries)
    status = f"⚠ {len(gaps)} gaps" if gaps else "✓ OK"
    print(f"  {book:50s} {len(entries):3d} entries  {status}")
    if gaps:
        print(f"    Gaps: {gaps}")

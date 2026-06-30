"""Extract book table of contents from a PDF and match entries to unit titles.

Usage: extract_book_toc.py <book_pdf> <units_json>

units_json should be a JSON array of objects with at least a "title" field.
Output is a JSON object with "units" (matched results) and optionally "warnings".

Strategy:
1. Read pages with both pypdf and pdfplumber
2. Locate "İÇİNDEKİLER" header to find the TOC region
3. Parse ALL numbered entries from the TOC, keeping every depth level
4. Group entries by top-level section, match to units by title + position
"""
import json
import re
import sys
import unicodedata
from pathlib import Path


# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

def one_line(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize(value):
    value = unicodedata.normalize("NFKD", str(value or ""))
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.casefold()
    value = value.replace("ı", "i")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def strip_leading_number(value):
    return re.sub(r"^\s*\d+(?:\.\d+)*\.?\s+", "", one_line(value))


# ---------------------------------------------------------------------------
# PDF reading – tries both pdfplumber and pypdf, returns best result
# ---------------------------------------------------------------------------

def read_pdf_text_pypdf(path, max_pages=30):
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(path))
        pages = []
        for i in range(min(max_pages, len(reader.pages))):
            try:
                txt = reader.pages[i].extract_text() or ""
                pages.append(txt)
            except Exception:
                pages.append("")
        return pages
    except Exception:
        return []


def read_pdf_text_pdfplumber(path, max_pages=30):
    try:
        import pdfplumber
        pages = []
        with pdfplumber.open(str(path)) as pdf:
            for i, page in enumerate(pdf.pages[:max_pages]):
                try:
                    txt = page.extract_text() or ""
                    pages.append(txt)
                except Exception:
                    pages.append("")
        return pages
    except Exception:
        return []


def read_pdf_pages(path, max_pages=30):
    """Read pages from PDF using both libraries, return the one with more TOC entries."""
    pypdf_pages = read_pdf_text_pypdf(path, max_pages)
    plumber_pages = read_pdf_text_pdfplumber(path, max_pages)
    
    if not pypdf_pages and not plumber_pages:
        return []
    if not pypdf_pages:
        return plumber_pages
    if not plumber_pages:
        return pypdf_pages
    
    # Quick heuristic: whichever produces more numbered lines in the TOC region wins
    def count_numbered_lines(pages):
        full = "\n".join(pages)
        return len(re.findall(r"^\s*\d+(?:\.\d+)+\.?\s+\S", full, flags=re.MULTILINE))
    
    pypdf_score = count_numbered_lines(pypdf_pages)
    plumber_score = count_numbered_lines(plumber_pages)
    
    return plumber_pages if plumber_score >= pypdf_score else pypdf_pages


# ---------------------------------------------------------------------------
# TOC region detection
# ---------------------------------------------------------------------------

TOC_HEADER_PATTERNS = [
    r"İÇİNDEKİLER",
    r"İ\s*Ç\s*İ\s*N\s*D\s*E\s*K\s*İ\s*L\s*E\s*R",
    r"ICINDEKILER",
    r"İçindekiler",
    r"Içindekiler",
    r"IÇINDEKILER",
    r"İ+\s*Ç+\s*İ+\s*N+\s*D+\s*E+\s*K+\s*İ+\s*L+\s*E+\s*R+",
    r"I+\s*C+\s*I+\s*N+\s*D+\s*E+\s*K+\s*I+\s*L+\s*E+\s*R+",
]

# Patterns that signal end of TOC
TOC_END_PATTERNS = [
    r"(?:1\s*\.\s*)?ÖĞRENME\s+BİRİMİ",
    r"1\s*\.\s*BÖLÜM\b",
    r"(?:ÖNSÖZ|GİRİŞ|SUNUŞ|AÇIKLAMALAR)\s*$",
    r"TEMEL\s+KAVRAMLAR\b",
    r"NELER\s+ÖĞRENECEKSİNİZ",
    r"DERS\s+MATERYALİNİN\s+TANITIMI",
    r"KAZANIM(?:LAR)?\s*$",
    r"ÖĞRETİM\s+PROGRAMI",
]


def find_toc_pages(pages):
    """Find which page(s) contain the TOC and extract the TOC text.
    
    Returns (toc_page_indices, toc_text).
    """
    toc_page_start = -1
    toc_header_end = 0
    
    for i, page_text in enumerate(pages):
        for pat in TOC_HEADER_PATTERNS:
            m = re.search(pat, page_text, flags=re.I)
            if m:
                toc_page_start = i
                toc_header_end = m.end()
                break
        if toc_page_start >= 0:
            break
    
    if toc_page_start < 0:
        return [], ""
    
    # Collect TOC pages starting from the header page
    toc_pages_text = []
    for i in range(toc_page_start, min(toc_page_start + 8, len(pages))):
        page_text = pages[i]
        
        if i == toc_page_start:
            # Remove everything before the header
            page_text = page_text[toc_header_end:]
        
        # Check for TOC end markers line by line to ignore matches inside TOC entries
        lines = page_text.splitlines()
        cut_at_line = len(lines)
        for idx, raw_line in enumerate(lines):
            line = raw_line.strip()
            if not line:
                continue
            
            # Check if this line matches any end patterns
            matched = False
            for pat in TOC_END_PATTERNS:
                if re.search(pat, line, flags=re.I):
                    # TOC entries typically contain dot-leaders or end with a page number
                    has_dots = bool(re.search(r'\.{3,}', raw_line))
                    ends_with_page = bool(re.search(r'\s{2,}\d+$', raw_line)) or bool(re.search(r'\.\s*\d+$', raw_line))
                    
                    if has_dots or ends_with_page:
                        continue
                    
                    # If it has a numbered pattern or looks like a TOC listing, check next line
                    is_toc_listing = False
                    if idx + 1 < len(lines):
                        next_line = lines[idx + 1].strip()
                        if re.search(r'\.{3,}', next_line) or re.search(r'\s{2,}\d+$', next_line):
                            is_toc_listing = True
                    
                    if is_toc_listing:
                        continue
                    
                    matched = True
                    break
            
            if matched:
                cut_at_line = idx
                break
        
        page_text = "\n".join(lines[:cut_at_line])
        
        if i > toc_page_start:
            # Check if this page still looks like TOC
            # TOC pages have numbered entries like "1.2 Title" or "1.2.3 Title"
            numbered_lines = len(re.findall(
                r"^\s*\d+(?:\.\d+)*\.?\s+[A-ZÇĞİÖŞÜa-zçğıöşü]",
                page_text,
                flags=re.MULTILINE
            ))
            # Also count lines with dot-leaders (strong TOC signal)
            dot_leader_lines = len(re.findall(r"\.{3,}", page_text))
            
            if numbered_lines < 2 and dot_leader_lines < 2:
                break
        
        toc_pages_text.append(page_text)
    
    combined = "\n".join(toc_pages_text)
    
    # Heuristic: cut if we see many consecutive very long lines (body text)
    lines = combined.splitlines()
    streak = 0
    cut_at = len(lines)
    for i, raw in enumerate(lines):
        line = one_line(raw)
        if len(line) > 150 and not re.search(r"\.{3,}", raw):
            streak += 1
            if streak >= 3:
                cut_at = max(0, i - 2)
                break
        else:
            streak = 0
    
    return (
        list(range(toc_page_start, toc_page_start + len(toc_pages_text))),
        "\n".join(lines[:cut_at])
    )


# ---------------------------------------------------------------------------
# TOC entry parsing – comprehensive with multiple strategies
# ---------------------------------------------------------------------------

EXCLUDED_KEYWORDS = [
    "ders ici etkinlik", "ders ici", "etkinlik",
    "olcme ve degerlendirme", "olcme degerlendirme",
    "cevap anahtari", "alistirma",
    "sira sizde", "ders materyalinin tanitimi",
    "uygulama faaliyetleri", "uygulama faaliyetleri temrinler",
    "kaynakca", "bibliyografya", "sozluk",
    "neler ogreneceksiniz", "hazirlik calismasi",
    "arastirma", "ogrenme birimi zih",
]


def is_excluded(title):
    key = normalize(title)
    if len(key) < 3:
        return True
    return any(bit in key for bit in EXCLUDED_KEYWORDS)


# The main number pattern: matches "1", "1.2", "1.2.3", "1.2.3.4" etc.
# Allows optional trailing dot. Handles spaces in OCR-damaged numbers.
NUMBER_PATTERNS = [
    # Standard: "1.2.3" or "1.2.3."
    r"(\d+(?:\.\d+){0,8})\.?",
    # OCR damaged with spaces: "1. 2. 3" or "1 .2 .3"
    r"(\d+\s*\.\s*\d+(?:\s*\.\s*\d+){0,6})\.?",
]


def clean_number(raw_num):
    """Normalize a parsed number string: remove spaces, trailing dots."""
    cleaned = re.sub(r"\s+", "", raw_num).strip(".")
    # Remove leading zeros in parts: "01.02" -> "1.2"
    parts = cleaned.split(".")
    return ".".join(str(int(p)) for p in parts if p.isdigit())


def _is_standalone_header(text):
    """Check if text looks like a standalone non-numbered section header.
    
    These are things like 'ÖLÇME VE DEĞERLENDİRME', 'KAYNAKÇA', etc.
    that appear between numbered entries but are NOT continuations.
    Only checks against the excluded keywords list – NOT uppercase alone,
    because actual TOC titles can also be uppercase.
    """
    key = normalize(text)
    if not key:
        return False
    # Check against excluded keywords
    return any(bit in key for bit in EXCLUDED_KEYWORDS)


def parse_toc_from_text(toc_text):
    """Parse numbered TOC entries from text.
    
    Returns a list of {"number": "1.2.3", "title": "Some Title"}.
    Handles:
    - Dot-leaders (........42)
    - Trailing page numbers
    - Line continuations
    - OCR artifacts (spaces in numbers)
    - Multiple number formats
    - Standalone section headers (excluded, not appended)
    """
    entries = []
    pending = None

    def flush():
        nonlocal pending
        if not pending:
            return
        title = one_line(pending["title"])
        # Clean trailing page numbers (e.g. "Title 42" or "Title ...42")
        title = re.sub(r"\.{2,}\s*\d+\s*$", "", title).strip()
        title = re.sub(r"\s+\d{1,3}\s*$", "", title).strip()
        # Clean trailing dots
        title = title.rstrip(".")
        
        if title and len(title) >= 2 and not is_excluded(title):
            entries.append({"number": pending["number"], "title": title})
        pending = None

    raw_lines = toc_text.splitlines()
    skip_until = -1  # Track lines consumed by look-ahead
    
    for line_idx, raw in enumerate(raw_lines):
        # Skip lines already consumed by Pattern C look-ahead
        if line_idx <= skip_until:
            continue
        
        line = one_line(raw)
        if not line:
            continue
        
        # Step 1: Strip dot-leaders and trailing page numbers
        # Patterns: "Title ........ 42", "Title .....42", "Title ... 42"
        cleaned = re.sub(r"\s*\.{2,}\s*\d{1,4}\s*$", "", line).strip()
        # Also: "Title    42" (multiple spaces before page number)
        cleaned = re.sub(r"\s{3,}\d{1,4}\s*$", "", cleaned).strip()
        
        if not cleaned:
            continue
        
        # Step 2: Try to match numbered entries
        matched = False
        
        # Pattern A: Standard "1.2.3 Title" or "1.2.3. Title"
        m = re.match(r"^(\d+(?:\.\d+){0,8})\.?(?:\s+|\b)(.+)$", cleaned)
        if m:
            num_raw = m.group(1)
            title_raw = one_line(m.group(2))
            number = clean_number(num_raw)
            
            if number:
                top = number.split(".")[0]
                try:
                    top_int = int(top)
                except ValueError:
                    top_int = 999
                
                if top_int <= 20 and len(title_raw) <= 120:
                    flush()
                    pending = {"number": number, "title": title_raw}
                    matched = True
        
        # Pattern B: OCR-damaged "1 .2 .3 Title" or "1. 2. 3 Title"
        if not matched:
            m = re.match(r"^(\d+\s*\.\s*\d+(?:\s*\.\s*\d+){0,6})\.?(?:\s+|\b)(.+)$", cleaned)
            if m:
                num_raw = m.group(1)
                title_raw = one_line(m.group(2))
                number = clean_number(num_raw)
                
                if number:
                    top = number.split(".")[0]
                    try:
                        top_int = int(top)
                    except ValueError:
                        top_int = 999
                    
                    if top_int <= 20 and len(title_raw) <= 120:
                        flush()
                        pending = {"number": number, "title": title_raw}
                        matched = True
        
        # Pattern C: Number alone on a line, title on the next line
        # e.g. "1.4." alone, followed by "Şirketler Muhasebesi" on next
        if not matched:
            m = re.match(r"^(\d+(?:\.\d+){0,8})\.?\s*$", cleaned)
            if m:
                number = clean_number(m.group(1))
                top = number.split(".")[0]
                try:
                    top_int = int(top)
                except ValueError:
                    top_int = 999
                
                if top_int <= 20 and number:
                    flush()
                    title_from_next = ""
                    consumed_line = -1
                    for j in range(line_idx + 1, min(line_idx + 3, len(raw_lines))):
                        next_line = one_line(raw_lines[j])
                        if not next_line:
                            continue
                        # If next line starts with a number, it's a new entry
                        if re.match(r"^\d+(?:\.\d+)*\.?\s", next_line):
                            break
                        # Clean dot-leaders/page numbers from next line
                        next_clean = re.sub(r"\s*\.{2,}\s*\d{1,4}\s*$", "", next_line).strip()
                        next_clean = re.sub(r"\s{3,}\d{1,4}\s*$", "", next_clean).strip()
                        if next_clean and len(next_clean) <= 100 and not _is_standalone_header(next_clean):
                            title_from_next = next_clean
                            consumed_line = j
                            break
                    
                    if title_from_next:
                        pending = {"number": number, "title": title_from_next}
                        skip_until = consumed_line  # Don't re-process this line
                        matched = True
        
        if not matched:
            # Check if this line is a standalone section header
            # (e.g. "ÖLÇME VE DEĞERLENDİRME", "KAYNAKÇA")
            # These should NOT be appended as continuation text
            if _is_standalone_header(cleaned):
                flush()
                continue
            
            # Continuation line: append to pending entry's title
            continuation = re.sub(r"\s*\.{2,}\s*\d{1,4}\s*$", "", line).strip()
            continuation = re.sub(r"\s{3,}\d{1,4}\s*$", "", continuation).strip()
            
            if pending and continuation and len(continuation) < 80:
                # Don't append if this looks like a new numbered entry
                if not re.match(r"^\d+\.", continuation):
                    # Safety check: appending should not make the title excluded
                    test_title = one_line(f"{pending['title']} {continuation}")
                    if not is_excluded(test_title):
                        pending["title"] = test_title
                        continue
            
            flush()

    flush()
    
    # Post-process: deduplicate and validate
    entries = deduplicate_entries(entries)
    entries = validate_sequence(entries)
    
    return entries


def deduplicate_entries(entries):
    """Remove duplicate entries (same number)."""
    seen = set()
    result = []
    for entry in entries:
        if entry["number"] not in seen:
            seen.add(entry["number"])
            result.append(entry)
    return result


def validate_sequence(entries):
    """Remove entries that are clearly noise (number parts too large)."""
    result = []
    for entry in entries:
        parts = entry["number"].split(".")
        valid = True
        for part in parts:
            try:
                if int(part) > 30:
                    valid = False
                    break
            except ValueError:
                valid = False
                break
        if valid:
            result.append(entry)
    return result


# ---------------------------------------------------------------------------
# Section grouping & unit matching
# ---------------------------------------------------------------------------

def group_by_top_level(entries):
    """Group entries by their top-level section number (e.g. "1", "2")."""
    groups = {}
    for entry in entries:
        top = entry["number"].split(".")[0]
        groups.setdefault(top, []).append(entry)
    return groups


def title_similarity(a, b):
    """Token-overlap similarity between two normalized strings."""
    ta = set(normalize(a).split())
    tb = set(normalize(b).split())
    if not ta or not tb:
        return 0.0
    overlap = {t for t in (ta & tb) if len(t) > 2}
    if not overlap:
        return 0.0
    return len(overlap) / min(len(ta), len(tb))


def get_section_title(items, top_key):
    """Get the most likely title for a top-level section."""
    # Prefer the entry whose number is exactly the top key (e.g. "1")
    for item in items:
        if item["number"] == top_key:
            return item["title"]
    # Fallback: first item
    return items[0]["title"] if items else ""


def match_units_to_sections(units, grouped_entries):
    """For each unit, find the best matching TOC section group.
    
    Uses title similarity first, then numeric position as fallback.
    Returns a dict: unit_index -> top_level_key.
    """
    mapping = {}
    used_tops = set()
    n_units = len(units)

    # Phase 1: title similarity matching
    candidates = []
    for ui, unit in enumerate(units):
        unit_title = unit.get("title", "")
        for top, items in grouped_entries.items():
            section_title = get_section_title(items, top)
            score = title_similarity(unit_title, section_title)
            if score >= 0.25:
                candidates.append((score, ui, top))
    
    # Sort by score descending, greedily assign
    candidates.sort(key=lambda x: -x[0])
    for score, ui, top in candidates:
        if ui in mapping or top in used_tops:
            continue
        mapping[ui] = top
        used_tops.add(top)

    # Phase 2: numeric position (section N -> unit N-1)
    for top in sorted(grouped_entries.keys(), key=lambda x: int(x) if x.isdigit() else 99):
        if top in used_tops:
            continue
        try:
            idx = int(top) - 1
        except ValueError:
            continue
        if 0 <= idx < n_units and idx not in mapping:
            mapping[idx] = top
            used_tops.add(top)

    return mapping


def format_entry(entry):
    """Format a TOC entry as 'number. title'."""
    return f"{entry['number']}. {entry['title']}"


# ---------------------------------------------------------------------------
# Main logic
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: extract_book_toc.py <book_pdf> <units_json>"}))
        return

    book_path = sys.argv[1]
    units_json_str = sys.argv[2]

    try:
        units = json.loads(units_json_str)
    except Exception as e:
        print(json.dumps({"error": f"Invalid units JSON: {e}"}))
        return

    try:
        # 1. Read PDF pages (tries both libraries, picks best)
        pages = read_pdf_pages(book_path, max_pages=30)
        if not pages:
            print(json.dumps({"error": "Kitap PDF'inden metin okunamadi."}))
            return

        # 2. Find TOC pages
        toc_page_indices, toc_text = find_toc_pages(pages)
        
        entries = []
        if toc_text:
            entries = parse_toc_from_text(toc_text)
        
        if not entries:
            # Fallback: parse from full text of first 30 pages
            full_text = "\n".join(pages)
            entries = parse_toc_from_text(full_text)
        
        if not entries:
            # Last resort: more pages
            pages = read_pdf_pages(book_path, max_pages=50)
            toc_page_indices, toc_text = find_toc_pages(pages)
            if toc_text:
                entries = parse_toc_from_text(toc_text)
            if not entries:
                entries = parse_toc_from_text("\n".join(pages))

        if not entries:
            print(json.dumps({
                "error": "Kitap icindekiler tablosu otomatik tespit edilemedi. "
                         "Lutfen gercek ders kitabi PDF'ini sectiginizden emin olun."
            }))
            return

        # 3. Group entries by top-level section
        grouped = group_by_top_level(entries)

        # 4. Match each unit to a section group
        mapping = match_units_to_sections(units, grouped)

        # 5. Build results
        result = []
        warnings = []
        for ui, unit in enumerate(units):
            top = mapping.get(ui)
            if top and top in grouped:
                topics = [format_entry(e) for e in grouped[top]]
                result.append({
                    "title": unit.get("title", ""),
                    "topics": topics,
                })
            else:
                result.append({
                    "title": unit.get("title", ""),
                    "topics": [],
                })
                warnings.append(
                    f"'{unit.get('title', '')}' icin kitap icindekilerinden "
                    f"eslesen bolum bulunamadi."
                )

        print(json.dumps({"units": result, "warnings": warnings}, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

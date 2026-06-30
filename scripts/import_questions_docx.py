import html
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
GENERIC_QUESTION_RE = re.compile(r"^\s*(?:SORU\s*[-–—:]?\s*)?(\d+)\s*[-.)]\s*\)?\s*(.+?)\s*$", re.IGNORECASE)
SORU_RE = re.compile(r"^\s*SORU\s*[-–—:]?\s*(\d+)\s*[\).:-]*\s*(.*)$", re.IGNORECASE)
CEVAP_RE = re.compile(r"^\s*CEVAP\s*[-–—:]?\s*(\d+)\s*[\).:-]*\s*(.*)$", re.IGNORECASE)
POINT_RE = re.compile(r"\((\d+)\s*p\)", re.IGNORECASE)


def clean_text(value):
    return re.sub(r"[ \t]+", " ", str(value or "")).strip()


def paragraph_text(paragraph):
    return clean_text("".join((node.text or "") for node in paragraph.iter(f"{{{NS['w']}}}t")))


def paragraph_html(text):
    text = clean_text(text)
    return f"<p>{html.escape(text)}</p>" if text else ""


def table_to_rows(table):
    rows = []
    for tr in table.findall("w:tr", NS):
        row = []
        for tc in tr.findall("w:tc", NS):
            lines = []
            for paragraph in tc.findall(".//w:p", NS):
                text = paragraph_text(paragraph)
                if text:
                    lines.append(text)
            row.append(lines)
        rows.append(row)
    return rows


def table_html(rows):
    body = []
    for row in rows:
        cells = []
        for cell in row:
            text = "<br>".join(html.escape(line) for line in cell if clean_text(line))
            cells.append(f"<td>{text}</td>")
        body.append(f"<tr>{''.join(cells)}</tr>")
    return f"<table><tbody>{''.join(body)}</tbody></table>" if body else ""


def table_text(rows):
    parts = []
    for row in rows:
        for cell in row:
            parts.extend(cell)
    return " ".join(parts)


def extract_blocks(path):
    blocks = []
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    body = document.find("w:body", NS)
    if body is None:
        return blocks
    for child in body:
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "p":
            text = paragraph_text(child)
            if text:
                blocks.append({"type": "p", "text": text, "html": paragraph_html(text)})
        elif tag == "tbl":
            rows = table_to_rows(child)
            blocks.append({"type": "table", "rows": rows, "text": table_text(rows), "html": table_html(rows)})
    return blocks


def parse_question_start(line):
    match = GENERIC_QUESTION_RE.match(line)
    if not match:
        return None
    number = int(match.group(1))
    text = clean_text(match.group(2))
    point_match = POINT_RE.search(text)
    points = int(point_match.group(1)) if point_match else None
    text = POINT_RE.sub("", text).strip()
    return number, text, points


def parse_exam_meta(filename):
    name = Path(filename or "").stem
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


def ensure_entry(entries, number):
    return entries.setdefault(number, {
        "number": number,
        "points": None,
        "contentParts": [],
        "answerParts": [],
    })


def update_points(entry, points):
    if points:
        entry["points"] = points


def extract_points_from_tables(blocks):
    points = {}
    for block in blocks:
        if block["type"] != "table":
            continue
        rows = [[clean_text(" ".join(cell)) for cell in row] for row in block["rows"]]
        for index, row in enumerate(rows[:-1]):
            next_row = rows[index + 1]
            for cell_index, cell in enumerate(row):
                if not re.fullmatch(r"\d{1,2}", cell or ""):
                    continue
                if cell_index >= len(next_row):
                    continue
                point_cell = next_row[cell_index]
                if re.fullmatch(r"\d{1,3}", point_cell or ""):
                    points[int(cell)] = int(point_cell)
    return points


def parse_marker_document(blocks, header_points):
    entries = {}
    section = ""
    current = None
    mode = ""
    found_markers = False

    for block in blocks:
        text = block["text"]
        upper = text.upper()
        if block["type"] == "p" and upper in {"SORULAR", "SORULAR:", "SORULARI"}:
            section = "questions"
            current = None
            mode = ""
            continue
        if block["type"] == "p" and upper in {"CEVAPLAR", "CEVAPLAR:", "CEVAP ANAHTARI"}:
            section = "answers"
            current = None
            mode = ""
            continue

        if block["type"] == "p":
            soru_match = SORU_RE.match(text)
            cevap_match = CEVAP_RE.match(text)
            if soru_match:
                found_markers = True
                current = int(soru_match.group(1))
                entry = ensure_entry(entries, current)
                update_points(entry, header_points.get(current))
                body = POINT_RE.sub("", clean_text(soru_match.group(2))).strip()
                if section != "answers" and body:
                    entry["contentParts"].append(paragraph_html(body))
                mode = "question" if section != "answers" else "answer-wait"
                continue
            if cevap_match:
                found_markers = True
                current = int(cevap_match.group(1))
                entry = ensure_entry(entries, current)
                update_points(entry, header_points.get(current))
                body = POINT_RE.sub("", clean_text(cevap_match.group(2))).strip()
                if section == "answers" and body:
                    entry["answerParts"].append(paragraph_html(body))
                mode = "answer" if section == "answers" else "question-extra"
                continue

        if current is None:
            continue
        entry = ensure_entry(entries, current)
        if section == "answers" and mode == "answer":
            entry["answerParts"].append(block["html"])
        elif section == "questions":
            entry["contentParts"].append(block["html"])

    return entries if found_markers else {}


def parse_table_pair_document(blocks):
    entries = {}
    order = 0
    for block in blocks:
        if block["type"] != "table":
            continue
        for row in block["rows"]:
            for cell in row:
                lines = [line for line in cell if clean_text(line)]
                start_indexes = [index for index, line in enumerate(lines) if parse_question_start(line)]
                start_indexes.append(len(lines))
                for idx, start in enumerate(start_indexes[:-1]):
                    part = lines[start:start_indexes[idx + 1]]
                    if not part:
                        continue
                    parsed = parse_question_start(part[0])
                    if not parsed:
                        continue
                    number, title, points = parsed
                    entry = ensure_entry(entries, number)
                    update_points(entry, points)
                    content_parts = [paragraph_html(title), *[paragraph_html(line) for line in part[1:]]]
                    if not entry["contentParts"] or order < entry.get("contentOrder", 10**9):
                        entry["contentParts"] = content_parts
                        entry["contentOrder"] = order
                    if len(part) > 1:
                        entry["answerParts"] = [paragraph_html(line) for line in part[1:]]
                    order += 1
    return entries


def parse_docx(path, filename=""):
    blocks = extract_blocks(path)
    header_points = extract_points_from_tables(blocks)
    entries = parse_marker_document(blocks, header_points) or parse_table_pair_document(blocks)
    questions = []
    for number in sorted(entries):
        entry = entries[number]
        questions.append({
            "number": number,
            "points": entry["points"] or header_points.get(number) or 10,
            "content": "".join(entry["contentParts"]),
            "answer": "".join(entry["answerParts"]),
        })
    return {"meta": parse_exam_meta(filename), "questions": questions}


def main():
    path = sys.argv[1]
    filename = sys.argv[2] if len(sys.argv) > 2 else Path(path).name
    print(json.dumps(parse_docx(path, filename), ensure_ascii=False))


if __name__ == "__main__":
    main()

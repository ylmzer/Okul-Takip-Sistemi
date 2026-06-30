import html
import json
import re
import ssl
import sys
import tempfile
import unicodedata
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader


MEB_ROOT = "https://www.meb.gov.tr"
ARCHIVE_URL = f"{MEB_ROOT}/meb_haberindex.php?dil=tr"
ARCHIVE_AJAX_URL = f"{MEB_ROOT}/meb_haberindex_ajax.php"

MONTHS = {
    "ocak": 1,
    "subat": 2,
    "mart": 3,
    "nisan": 4,
    "mayis": 5,
    "haziran": 6,
    "temmuz": 7,
    "agustos": 8,
    "eylul": 9,
    "ekim": 10,
    "kasim": 11,
    "aralik": 12,
}

DATE_RE = re.compile(r"(\d{1,2})\s+([^\W\d_]+)(?:\s+(\d{4}))?", re.I | re.U)
RANGE_SAME_MONTH_RE = re.compile(
    r"(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([^\W\d_]+)(?:\s+(\d{4}))?",
    re.I | re.U,
)
SCHOOL_YEAR_RE = re.compile(r"(20\d{2})\s*[-/]\s*(20\d{2})")


def tr_key(value):
    text = str(value or "").casefold().replace("ı", "i")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", text).strip()


def school_year_parts(school_year):
    match = SCHOOL_YEAR_RE.search(str(school_year or ""))
    if not match:
        return None
    return int(match.group(1)), int(match.group(2))


def infer_year(month, school_year):
    parts = school_year_parts(school_year)
    if not parts:
        return None
    start_year, end_year = parts
    return start_year if month >= 8 else end_year


def iso_date(day, month_name, year=None, school_year=None):
    month = MONTHS.get(tr_key(month_name))
    if not month:
        return ""
    actual_year = int(year) if year else infer_year(month, school_year)
    if not actual_year:
        return ""
    return f"{actual_year:04d}-{month:02d}-{int(day):02d}"


def dates_in(text, school_year=None):
    found = []
    for match in RANGE_SAME_MONTH_RE.finditer(text or ""):
        start_day, end_day, month_name, year = match.groups()
        start = iso_date(start_day, month_name, year, school_year)
        end = iso_date(end_day, month_name, year, school_year)
        if start:
            found.append((match.start(), 0, start))
        if end:
            found.append((match.start(), 1, end))
    for match in DATE_RE.finditer(text or ""):
        date_value = iso_date(*match.groups(), school_year=school_year)
        if date_value:
            found.append((match.start(), 0, date_value))

    ordered = []
    for _, __, date_value in sorted(found, key=lambda item: (item[0], item[1])):
        if date_value not in ordered:
            ordered.append(date_value)
    return ordered


def matching_line_dates(text, patterns, school_year=None, limit=4):
    lines = text.splitlines()
    for index, line in enumerate(lines):
        normalized = tr_key(line)
        if not any(re.search(pattern, normalized, re.I) for pattern in patterns):
            continue
        context = " ".join(lines[index:index + limit])
        found = dates_in(context, school_year)
        if found:
            return found
    return []


def clean_html_text(raw_html):
    body = re.sub(r"(?is)<script\b.*?</script>|<style\b.*?</style>", " ", raw_html or "")
    body = re.sub(r"(?i)<\s*br\s*/?\s*>|</\s*(div|p|li|h[1-6]|section|article|tr)\s*>", "\n", body)
    body = re.sub(r"<[^>]+>", " ", body)
    text = html.unescape(body)
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s+", "\n", text)
    return re.sub(r"\n{2,}", "\n", text).strip()


def parse_calendar(text, school_year=""):
    if not school_year:
        match = SCHOOL_YEAR_RE.search(text or "")
        school_year = f"{match.group(1)}-{match.group(2)}" if match else ""

    start_dates = matching_line_dates(text, [
        r"okullarda birinci donem",
        r"egitim ogretim yilinin baslamasi",
        r"egitim-ogretim yilinin baslangici",
        r"egitim ogretim yilinin baslangici",
    ], school_year)
    end_dates = matching_line_dates(text, [
        r"egitim ogretim yili.*tamamlanacak",
        r"egitim ve ogretim yili.*tamamlanacak",
        r"egitim ogretim donemi.*tamamlanacak",
        r"egitim ogretim yilinin sona ermesi",
        r"egitim-ogretim yilinin sona ermesi",
        r"ikinci donem.*tamamlanacak",
    ], school_year, limit=1)
    ara1_dates = matching_line_dates(text, [
        r"birinci donem ara tatili",
        r"1\. donem ara tatili",
        r"i\. donem ara tatili",
    ], school_year)
    yariyil_dates = matching_line_dates(text, [
        r"yariyil tatili",
    ], school_year)
    ara2_dates = matching_line_dates(text, [
        r"ikinci donemin ara tatili",
        r"ikinci donem ara tatili",
        r"2\. donem ara tatili",
        r"ii\. donem ara tatili",
    ], school_year)
    etkinlik_dates = matching_line_dates(text, [
        r"etkinlik haftasi",
    ], school_year)

    return {
        "startDate": start_dates[0] if start_dates else "",
        "endDate": end_dates[-1] if end_dates else "",
        "araTatil1Start": ara1_dates[0] if len(ara1_dates) >= 1 else "",
        "araTatil1End": ara1_dates[1] if len(ara1_dates) >= 2 else (ara1_dates[0] if ara1_dates else ""),
        "yariyilStart": yariyil_dates[0] if len(yariyil_dates) >= 1 else "",
        "yariyilEnd": yariyil_dates[1] if len(yariyil_dates) >= 2 else (yariyil_dates[0] if yariyil_dates else ""),
        "araTatil2Start": ara2_dates[0] if len(ara2_dates) >= 1 else "",
        "araTatil2End": ara2_dates[1] if len(ara2_dates) >= 2 else (ara2_dates[0] if ara2_dates else ""),
        "etkinlikStart": etkinlik_dates[0] if len(etkinlik_dates) >= 1 else "",
        "etkinlikEnd": etkinlik_dates[1] if len(etkinlik_dates) >= 2 else "",
    }


def request_headers(content_type=None):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    }
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def read_url(url, data=None, headers=None):
    context = ssl._create_unverified_context()
    request = urllib.request.Request(url, data=data, headers=headers or request_headers())
    with urllib.request.urlopen(request, context=context, timeout=25) as response:
        raw = response.read()
        charset = response.headers.get_content_charset() or "utf-8"
    return raw.decode(charset, errors="replace")


def search_archive(query):
    read_url(ARCHIVE_URL, headers=request_headers("text/html"))
    form = {
        "draw": "1",
        "start": "0",
        "length": "25",
        "search[value]": query,
        "search[regex]": "false",
        "kategori": "",
        "dil": "tr",
        "order[0][column]": "0",
        "order[0][dir]": "desc",
        "columns[0][data]": "ISLEMSAAT",
        "columns[0][searchable]": "false",
        "columns[0][orderable]": "true",
        "columns[0][search][value]": "",
        "columns[0][search][regex]": "false",
        "columns[1][data]": "BASLIK",
        "columns[1][searchable]": "true",
        "columns[1][orderable]": "true",
        "columns[1][search][value]": "",
        "columns[1][search][regex]": "false",
    }
    data = urllib.parse.urlencode(form).encode("utf-8")
    headers = request_headers("application/x-www-form-urlencoded; charset=UTF-8")
    headers.update({
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Origin": MEB_ROOT,
        "Referer": ARCHIVE_URL,
        "X-Requested-With": "XMLHttpRequest",
    })
    payload = json.loads(read_url(ARCHIVE_AJAX_URL, data=data, headers=headers))
    return payload.get("data", [])


def find_calendar_news(year):
    results = search_archive(year)
    wanted = tr_key(f"{year} egitim ogretim yili takvimi")
    for item in results:
        title = tr_key(item.get("BASLIK", ""))
        if wanted in title or (
            year in title
            and "egitim" in title
            and "ogretim" in title
            and "takvimi" in title
        ):
            link = item.get("LINK") or ""
            url = urllib.parse.urljoin(MEB_ROOT, link)
            return {
                "year": year,
                "title": html.unescape(item.get("BASLIK", "")).strip(),
                "publishedAt": item.get("ISLEMSAAT", ""),
                "url": url,
            }
    return None


def fetch_news_calendar(year):
    news = find_calendar_news(year)
    if not news:
        return None
    raw_html = read_url(news["url"], headers=request_headers("text/html"))
    text = clean_html_text(raw_html)
    dates = parse_calendar(text, year)
    return {
        "year": year,
        "sourceType": "news",
        "sourceTitle": news["title"],
        "sourceUrl": news["url"],
        "publishedAt": news.get("publishedAt", ""),
        "dates": dates,
    }


def discover_years(requested_years=None):
    current = datetime.now().year
    if requested_years:
        years = requested_years
    else:
        years = [f"{year}-{year + 1}" for year in range(current - 5, current + 2)]

    calendars = []
    seen = set()
    for year in years:
        if not SCHOOL_YEAR_RE.fullmatch(str(year or "")) or year in seen:
            continue
        seen.add(year)
        try:
            calendar = fetch_news_calendar(year)
            if calendar:
                calendars.append(calendar)
        except Exception as error:
            calendars.append({
                "year": year,
                "sourceType": "news",
                "sourceTitle": "",
                "sourceUrl": "",
                "publishedAt": "",
                "dates": {},
                "error": str(error),
            })
    return [item for item in calendars if item.get("dates")]


def download_pdf(url):
    context = ssl._create_unverified_context()
    request = urllib.request.Request(url, headers=request_headers())
    with urllib.request.urlopen(request, context=context, timeout=25) as response:
        data = response.read()
    path = Path(tempfile.gettempdir()) / f"meb-calendar-{abs(hash(url))}.pdf"
    path.write_bytes(data)
    return path


def extract_text(pdf_path):
    reader = PdfReader(str(pdf_path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def fetch_pdf_calendar(url, year=""):
    pdf_path = download_pdf(url)
    text = extract_text(pdf_path)
    return {
        "year": year,
        "sourceType": "pdf",
        "sourceTitle": "MEB çalışma takvimi PDF",
        "sourceUrl": url,
        "publishedAt": "",
        "dates": parse_calendar(text, year),
    }


def is_useful_calendar(calendar):
    dates = calendar.get("dates") or {}
    return bool(
        dates.get("startDate")
        and dates.get("endDate")
        and dates.get("araTatil1Start")
        and dates.get("yariyilStart")
        and dates.get("araTatil2Start")
    )


def latest_calendar(calendars):
    useful = [item for item in calendars if is_useful_calendar(item)]
    useful.sort(key=lambda item: item.get("year", ""), reverse=True)
    return useful[0] if useful else None


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    payload = json.loads(sys.argv[1])
    year = str(payload.get("year") or "").strip()
    url = str(payload.get("url") or "").strip()
    years = payload.get("years") or []

    if url.lower().endswith(".pdf"):
        calendar = fetch_pdf_calendar(url, year)
        print(json.dumps({"calendar": calendar, "calendars": [calendar], "dates": calendar["dates"]}, ensure_ascii=False))
        return

    if url:
        raw_html = read_url(url, headers=request_headers("text/html"))
        text = clean_html_text(raw_html)
        if not year:
            match = SCHOOL_YEAR_RE.search(text)
            year = f"{match.group(1)}-{match.group(2)}" if match else ""
        calendar = {
            "year": year,
            "sourceType": "news",
            "sourceTitle": "",
            "sourceUrl": url,
            "publishedAt": "",
            "dates": parse_calendar(text, year),
        }
        print(json.dumps({"calendar": calendar, "calendars": [calendar], "dates": calendar["dates"]}, ensure_ascii=False))
        return

    calendars = discover_years(years or ([year] if year else None))
    selected = next((item for item in calendars if item.get("year") == year and is_useful_calendar(item)), None)
    selected = selected or latest_calendar(calendars)

    if not selected:
        raise RuntimeError("MEB haber arşivinde eğitim öğretim yılı takvimi bulunamadı.")

    print(json.dumps({
        "calendar": selected,
        "calendars": calendars,
        "dates": selected.get("dates", {}),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()

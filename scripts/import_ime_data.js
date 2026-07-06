import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const XLSX = require('xlsx');

// Turkish character mapping
const turkishMap = {
  'ø': 'İ',
  'ù': 'Ş',
  'h': 'Ü',
  'g': 'Ö',
  'ö': 'Ğ',
  '÷': 'Ğ',
  'd': 'Ç',
  '|': 'Ö',
  'Õ': 'I'
};

const normalLowercase = new Set("abcefijklmnopqrtuvwxyzıüşçğ");
const nonAlphanumericEncoded = new Set("$%&'()*+,./<=>[\\]^_`{|}~øùö÷Õ|");
const punctuationToStrip = ".-,";

function isEncodedWord(word) {
  let checkWord = word;
  while (checkWord && punctuationToStrip.includes(checkWord[0])) {
    checkWord = checkWord.slice(1);
  }
  while (checkWord && punctuationToStrip.includes(checkWord[checkWord.length - 1])) {
    checkWord = checkWord.slice(0, -1);
  }
  if (!checkWord) return false;

  if (/^\d{10}$/.test(checkWord)) return false;
  if (/^\d{1,2}\/[A-Z0-9]+$/i.test(checkWord)) return false;
  if (/^\d+$/.test(checkWord) && checkWord.length <= 3) return false;
  if (/^\d{1,2}-\d{1,2}$/.test(checkWord)) return false;
  if (/^202\d$/.test(checkWord)) return false;

  for (let i = 0; i < checkWord.length; i++) {
    if (normalLowercase.has(checkWord[i])) return false;
  }

  for (let i = 0; i < checkWord.length; i++) {
    if (nonAlphanumericEncoded.has(checkWord[i])) return true;
  }

  return false;
}

function decodeWord(word) {
  if (!isEncodedWord(word)) return word;

  const hasPlainABC = [...word].some(c => "ABC".includes(c));
  const decodedChars = [];
  for (let i = 0; i < word.length; i++) {
    const c = word[i];
    if (turkishMap[c]) {
      decodedChars.push(turkishMap[c]);
    } else {
      const val = c.charCodeAt(0);
      if (val >= 36 && val <= 61) {
        decodedChars.push(String.fromCharCode(val + 29));
      } else if (val >= 68 && val <= 93 && !hasPlainABC) {
        decodedChars.push(String.fromCharCode(val - 3));
      } else {
        decodedChars.push(c);
      }
    }
  }
  return decodedChars.join("");
}

function decodeString(s) {
  if (!s) return "";
  const words = s.split(/\s+/);
  const decodedWords = words.map(w => decodeWord(w));
  let decoded = decodedWords.join(" ");
  decoded = decoded.replace(/[\x00-\x1f\x7f-\x9f\xad]/g, ' ');
  return decoded.replace(/\s+/g, ' ').trim();
}

function turkishClean(val) {
  if (!val) return "";
  let s = String(val).trim().toLowerCase();
  s = s.replace(/\u0307/g, '');
  s = s.replace(/ı/g, 'i')
       .replace(/i̇/g, 'i')
       .replace(/ö/g, 'o')
       .replace(/ü/g, 'u')
       .replace(/ş/g, 's')
       .replace(/ç/g, 'c')
       .replace(/ğ/g, 'g');
  return s;
}

function guessField(bizName) {
  const bizClean = turkishClean(bizName);
  const maleKeywords = ["erkek", "berber", "boss", "cut", "man"];
  const femaleKeywords = ["bayan", "coiffure", "kadin", "guzellik", "diva", "nilufer"];
  const generalKeywords = ["kuafor", "kuaforu", "hair", "club"];

  if (maleKeywords.some(w => bizClean.includes(w))) {
    return "Güzellik ve Saç Bakım Hizmetleri / Erkek Kuaförlüğü";
  }
  if (femaleKeywords.some(w => bizClean.includes(w))) {
    return "Güzellik ve Saç Bakım Hizmetleri / Kadın Kuaförlüğü";
  }
  if (generalKeywords.some(w => bizClean.includes(w))) {
    return "Güzellik ve Saç Bakım Hizmetleri / Erkek Kuaförlüğü";
  }
  return "Belirtilmedi";
}

export async function parsePdf(filePath) {
  const items = [];
  const dataBuffer = fs.readFileSync(filePath);
  
  await pdf(dataBuffer, {
    pagerender: function(pageData) {
      return pageData.getTextContent().then(textContent => {
        for (let item of textContent.items) {
          if (!item.str.trim()) continue;
          items.push({
            x: Math.round(item.transform[4]),
            y: Math.round(item.transform[5]),
            str: item.str.trim(),
            page: pageData.pageIndex
          });
        }
        return "";
      });
    }
  });

  // Sort items: page (asc), Y (desc), X (asc)
  items.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
    return a.x - b.x;
  });

  // Extract coordinator and week info
  let weekDate = "";
  let coordinatorTeacher = "";

  // Look for weekDate (item near X=27 or containing Temmuz/Temmuz 2026)
  const weekItems = items.filter(it => it.x < 100 && it.y > 480 && it.page === 0);
  if (weekItems.length > 0) {
    const rawWeek = weekItems.map(it => it.str).join(" ");
    weekDate = decodeString(rawWeek);
  }

  // Look for coordinator (near X=694/704/678 and Y=509/499/490)
  const coordItems = items.filter(it => it.x > 600 && it.y > 480 && it.page === 0);
  for (let i = 0; i < coordItems.length; i++) {
    if (turkishClean(decodeString(coordItems[i].str)) === "imza" && i > 0) {
      coordinatorTeacher = decodeString(coordItems[i - 1].str);
      break;
    }
  }

  // Filter out header items for row grouping (all data rows are at Y < 420)
  const dataItems = items.filter(it => it.y < 420);

  // Group items into rows
  const rows = [];
  let currentGroup = [];
  for (const item of dataItems) {
    if (currentGroup.length === 0) {
      currentGroup.push(item);
    } else {
      const first = currentGroup[0];
      if (item.page === first.page && Math.abs(item.y - first.y) <= 12) {
        currentGroup.push(item);
      } else {
        rows.push(currentGroup);
        currentGroup = [item];
      }
    }
  }
  if (currentGroup.length > 0) {
    rows.push(currentGroup);
  }

  // Filter and process student rows
  const studentRows = [];
  for (const row of rows) {
    let rowNo = "";
    let className = "";
    let studentNo = "";
    let studentName = "";
    let trainerName = "";
    let y = 0;
    let page = 0;

    for (const item of row) {
      y = item.y;
      page = item.page;
      const x = item.x;
      const str = decodeString(item.str);

      if (x >= 230 && x <= 245 && /^\d+$/.test(str)) rowNo = str;
      else if (x >= 255 && x <= 270 && /^\d{1,2}\/[A-Z0-9]+$/i.test(str)) className = str;
      else if (x >= 285 && x <= 298 && /^\d+$/.test(str)) studentNo = str;
      else if (x >= 315 && x <= 335) studentName = str;
      else if (x >= 680 && x <= 710) trainerName = str;
    }

    if (studentNo && studentName) {
      studentRows.push({
        rowNo,
        className,
        studentNo,
        studentName,
        trainerName,
        y,
        page
      });
    }
  }

  const records = [];
  let currentBusiness = { name: "Bilinmeyen İşletme", address: "", phone: "" };

  for (let idx = 0; idx < studentRows.length; idx++) {
    const sRow = studentRows[idx];
    
    // Find the head of the current business block (the rowNo === "1" student)
    let headIdx = idx;
    while (headIdx > 0 && studentRows[headIdx].rowNo !== "1" && studentRows[headIdx].page === sRow.page) {
      headIdx--;
    }
    const headRow = studentRows[headIdx];

    // Find all students in this same business block
    let blockStudents = [headRow];
    for (let i = headIdx + 1; i < studentRows.length; i++) {
      if (studentRows[i].page !== sRow.page || studentRows[i].rowNo === "1") {
        break;
      }
      blockStudents.push(studentRows[i]);
    }

    // Find the minimum Y among these students
    const lowestY = Math.min(...blockStudents.map(s => s.y));

    // Y boundaries for business details of this block
    const upperLimit = headRow.y + 35;
    const lowerLimit = lowestY - 15;

    const page = sRow.page;
    const bizItems = items.filter(it => {
      if (it.page !== page) return false;
      if (it.y < lowerLimit || it.y > upperLimit) return false;
      return it.x < 220; // Business columns are X=10, 81, 169
    });

    // Group business items by X coordinate
    let nameParts = [];
    let addrParts = [];
    let phoneParts = [];

    // Sort items by Y desc (top to bottom) so we append lines in order
    bizItems.sort((a, b) => b.y - a.y);

    for (const bit of bizItems) {
      const str = decodeString(bit.str);
      if (bit.x < 50) nameParts.push(str);
      else if (bit.x >= 50 && bit.x <= 150) addrParts.push(str);
      else if (bit.x > 150) phoneParts.push(str);
    }

    const name = nameParts.length > 0 ? nameParts.join(" ") : "Belirtilmedi";
    const address = addrParts.length > 0 ? addrParts.join(" ") : "";
    const phone = phoneParts.length > 0 ? phoneParts.join(" ") : "";

    currentBusiness = { name, address, phone };

    records.push({
      student_name: sRow.studentName,
      student_no: sRow.studentNo,
      class_name: sRow.className,
      field: guessField(currentBusiness.name),
      business_name: currentBusiness.name,
      business_address: currentBusiness.address,
      business_phone: currentBusiness.phone,
      coordinator_name: coordinatorTeacher.toUpperCase(),
      days: "Pzt, Sal"
    });
  }

  return records;
}

export async function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;

  const firstSheet = workbook.Sheets[sheetNames[0]];
  const firstData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

  let isNazilliExcel = false;
  for (let r = 0; r < Math.min(5, firstData.length); r++) {
    const row = firstData[r] || [];
    const rowText = turkishClean(row.map(v => String(v || "").trim()).join(" "));
    if (rowText.includes('isletmenin') && rowText.includes('ogrencinin')) {
      isNazilliExcel = true;
      break;
    }
  }

  if (isNazilliExcel) {
    let weekDate = "";
    let coordinatorTeacher = "";

    const row0 = firstData[0] || [];
    for (const cell of row0) {
      if (!cell) continue;
      const cellClean = String(cell).replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
      const cellLower = turkishClean(cellClean);

      const months = ["ocak", "subat", "mart", "nisan", "mayis", "haziran", "temmuz", "agustos", "eylul", "ekim", "kasim", "aralik"];
      if (months.some(m => cellLower.includes(m)) && !weekDate) {
        const dateMatch = cellClean.match(/(\d{1,2}\s*[-–]\s*\d{1,2}\s+[a-zA-ZğüşıöçĞÜŞİÖÇ]+\s*\d{4})/);
        if (dateMatch) {
          weekDate = dateMatch[1].trim();
        } else {
          const dateMatch2 = cellClean.match(/(\d{1,2}\s*[-–]\s*\d{1,2}\s+[a-zA-ZğüşıöçĞÜŞİÖÇ]+)/);
          const yearMatch = cellClean.match(/(202\d)/);
          if (dateMatch2 && yearMatch) {
            weekDate = dateMatch2[1].trim() + " " + yearMatch[1];
          } else if (dateMatch2) {
            weekDate = dateMatch2[1].trim();
          }
        }
      }

      if (cellLower.includes('imza') && !coordinatorTeacher) {
        const imzaMatch = cellClean.match(/^(.+?)\s*[İi]mza/i);
        if (imzaMatch) {
          coordinatorTeacher = imzaMatch[1].trim();
        }
      }
    }

    const records = [];

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      let dataStartRow = 0;
      for (let r = 0; r < Math.min(10, data.length); r++) {
        const row = data[r] || [];
        const rowText = row.map(v => turkishClean(String(v || "").replace(/\n/g, ' '))).join(" ");
        if ((rowText.includes('ad soyad') || rowText.includes('adi')) && (rowText.includes('sinif') || rowText.includes('no'))) {
          dataStartRow = r + 1;
          break;
        }
      }

      const headerRowIdx = dataStartRow - 1;
      let colBizName = 0;
      let colBizAddr = 1;
      let colBizPhone = -1;
      let colSira = -1;
      let colSinif = -1;
      let colNo = -1;
      let colAdsoyad = -1;
      let colUsta = -1;

      if (headerRowIdx >= 0) {
        const headerVals = (data[headerRowIdx] || []).map(v => turkishClean(String(v || "").replace(/\n/g, ' ')));
        headerVals.forEach((hv, cIdx) => {
          if (hv.includes('telefon')) colBizPhone = cIdx;
          else if (hv.startsWith('sira') || (hv.includes('sira') && hv.includes('no'))) colSira = cIdx;
          else if (hv.includes('sinif')) colSinif = cIdx;
          else if (hv === 'no' && colSinif >= 0 && cIdx > colSinif) colNo = cIdx;
          else if (hv.includes('ad soyad') || hv.includes('adsoyad') || hv === 'ad') colAdsoyad = cIdx;
          else if (hv.includes('ustanin') || hv.includes('isverenin') || hv.includes('imzasi')) colUsta = cIdx;
        });

        if (colAdsoyad < 0 && colNo >= 0) {
          colAdsoyad = colNo + 1;
        }
        if (colUsta < 0) {
          colUsta = headerVals.length - 1;
        }
      }

      let currentBizName = "";
      let currentBizAddr = "";
      let currentBizPhone = "";

      for (let r = dataStartRow; r < data.length; r++) {
        const row = data[r] || [];
        const rowCells = row.map(v => String(v === undefined || v === null ? "" : v).replace(/\n/g, ' ').replace(/\r/g, ' ').trim());
        if (rowCells.every(c => c === "")) continue;

        const bizNameVal = rowCells[colBizName] || "";
        if (bizNameVal) {
          currentBizName = bizNameVal;
          currentBizAddr = colBizAddr >= 0 ? rowCells[colBizAddr] || "" : "";
          currentBizPhone = colBizPhone >= 0 ? rowCells[colBizPhone] || "" : "";
        }

        const studentName = colAdsoyad >= 0 ? rowCells[colAdsoyad] || "" : "";
        let studentNo = colNo >= 0 ? rowCells[colNo] || "" : "";
        const className = colSinif >= 0 ? rowCells[colSinif] || "" : "";

        if (studentNo && studentNo.includes('.')) {
          studentNo = studentNo.split('.')[0];
        }

        if (!studentName || studentName.length < 2) continue;

        records.push({
          student_name: studentName,
          student_no: studentNo,
          class_name: className,
          field: guessField(currentBizName),
          business_name: currentBizName,
          business_address: currentBizAddr,
          business_phone: currentBizPhone,
          coordinator_name: coordinatorTeacher,
          days: "Pzt, Sal"
        });
      }
    }

    return records;
  }

  return [];
}

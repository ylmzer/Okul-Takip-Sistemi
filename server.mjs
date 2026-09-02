import { createServer } from "node:http";
import { mkdir, readFile, writeFile, unlink, stat, rm, readdir } from "node:fs/promises";
import { extname, join, normalize, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parsePdf, parseExcel } from "./scripts/import_ime_data.js";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const execFileAsync = promisify(execFile);
import { existsSync, readdirSync } from "node:fs";

let pythonPath = join(process.env.USERPROFILE || "", ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe");
if (!existsSync(pythonPath)) {
  const backupProfile = (process.env.HOMEDRIVE && process.env.HOMEPATH) 
    ? join(process.env.HOMEDRIVE, process.env.HOMEPATH) 
    : "C:\\Users\\eyilm";
  const backupPath = join(backupProfile, ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe");
  if (existsSync(backupPath)) {
    pythonPath = backupPath;
  } else {
    pythonPath = process.platform === "win32" ? "python" : "python3";
  }
}
const userLocalPackages = process.platform === "win32"
  ? ""
  : [
      `${process.env.HOME || "/home/render"}/.local/lib/python3.11/site-packages`,
      `${process.env.HOME || "/home/render"}/.local/lib/python3.10/site-packages`,
      `${process.env.HOME || "/home/render"}/.local/lib/python3.12/site-packages`
    ].join(":");

const pythonEnv = {
  ...process.env,
  PYTHONIOENCODING: "utf-8",
  PYTHONPATH: process.env.PYTHONPATH
    ? `${process.env.PYTHONPATH}${userLocalPackages ? `:${userLocalPackages}` : ""}`
    : userLocalPackages
};
const annualMebCacheDir = join(root, ".cache", "annual-meb");

// Bypass SSL verification for MEB and government website fetches
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const CURRICULUM_OUTCOME_WORDS = [
  "açıklar",
  "belirtir",
  "sıralar",
  "sınıflandırır",
  "ilişkilendirir",
  "tanımlar",
  "ayırt eder",
  "uygular",
  "hazırlar",
  "seçer",
  "yapar",
  "kullanır",
  "gösterir",
  "karşılaştırır",
  "değerlendirir",
  "kaydeder",
  "düzenler",
  "hesaplar",
  "oluşturur",
  "çözer",
  "analiz eder",
  "yorumlar",
  "inceler",
  "planlar",
  "tasarlar",
  "gerçekleştirir",
  "aktarır",
  "ifade eder",
  "fark eder",
  "listeler",
  "çizer",
  "sunar",
  "araştırır",
  "gözlemler",
  "sonuç çıkarır",
  "geliştirir",
  "yazar",
  "okur",
  "kontrol eder",
  "test eder",
  "doğrular",
  "belirler",
  "takip eder",
  "izler",
  "ayarlar",
  "kurar",
  "yapılandırır",
  "biçimlendirir",
  "öğrenir"
];

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    if (request.method === "GET" && url.pathname === "/api/config") {
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
      response.end(JSON.stringify({
        supabaseUrl: process.env.SUPABASE_URL || "",
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ""
      }));
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/import-curriculum") {
      await handleCurriculumImport(request, response, url);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/import-questions-docx") {
      await handleQuestionDocxImport(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/import-main-questions") {
      await handleMainQuestionsImport(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/import-ime-data") {
      await handleImeDataImport(request, response);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/list-sqlite-profiles") {
      await handleListSqliteProfiles(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/import-sqlite-profile") {
      await handleImportSqliteProfile(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/hem-search") {
      await handleHemSearch(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/hem-modules") {
      await handleHemModules(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/meb-search") {
      await handleMebSearch(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/meb-modules") {
      await handleMebModules(request, response);
      return;
    }
    if ((request.method === "GET" || request.method === "POST") && url.pathname === "/api/meb-areas") {
      await handleMebAreas(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/annual-meb-catalog") {
      await handleAnnualMebCatalog(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/annual-meb-catalog-by-area") {
      await handleAnnualMebCatalogByArea(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/annual-meb-template") {
      await handleAnnualMebTemplate(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/annual-meb-calendar") {
      await handleAnnualMebCalendarNews(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/annual-plan-xlsx") {
      await handleAnnualPlanXlsx(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/import-course-students") {
      await handleCourseStudentsImport(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/import-course-questions") {
      await handleCourseQuestionsImport(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/import-template-docx") {
      await handleTemplateDocxImport(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/annual-import-meb-dbf") {
      await handleAnnualImportMebDbf(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/annual-extract-book-toc") {
      await handleExtractBookToc(request, response);
      return;
    }

    const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
    const filePath = normalize(join(root, pathname));

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const body = await readFile(filePath);
    response.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

async function handleCurriculumImport(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const boundary = request.headers["content-type"]?.match(/boundary=(.+)$/)?.[1];
  if (!boundary) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Multipart boundary missing");
    return;
  }
  const { pdf, courseName } = parseMultipart(body, boundary);
  const pdfBuffer = pdf?.data || pdf;
  if (!pdfBuffer?.length) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("PDF not found");
    return;
  }
  const tempPath = join(tmpdir(), `sorubank-${Date.now()}.pdf`);
  await writeFile(tempPath, pdfBuffer);
  try {
    const annualImporterPath = join(root, "scripts", "import_annual_meb.py");
    let annualParserError = "";
    try {
      const meta = {
        lessonName: courseName || "Ders",
        title: courseName || "Ders"
      };
      const { stdout } = await execFileAsync(pythonPath, [annualImporterPath, "--dbf", tempPath, "--meta", JSON.stringify(meta)], {
        env: pythonEnv,
        maxBuffer: 1024 * 1024 * 20
      });
      const parsed = JSON.parse(stdout);
      const units = Array.isArray(parsed.template?.units) ? parsed.template.units : [];
      const items = annualUnitsToCurriculumItems(units, courseName || parsed.template?.lessonName || "Ders");
      if (items.length) {
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({
          items,
          units,
          warnings: parsed.warnings || parsed.template?.warnings || [],
          weeklyHours: parsed.template?.weeklyHours || null,
          parser: "annual-dbf"
        }));
        return;
      }
    } catch (error) {
      annualParserError = error.message || "";
    }

    const importerPath = join(root, "scripts", "import_curriculum.py");
    const { stdout } = await execFileAsync(pythonPath, [importerPath, tempPath, courseName || "Ders"], {
      env: pythonEnv,
      maxBuffer: 1024 * 1024 * 5
    });
    const fallbackPayload = JSON.parse(stdout);
    if (annualParserError) {
      fallbackPayload.warnings = [
        ...(fallbackPayload.warnings || []),
        `Yeni DBF ayrıştırıcı sonuç üretemedi, eski ayrıştırıcı kullanıldı: ${annualParserError}`
      ];
      fallbackPayload.parser = "legacy-curriculum";
    }
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(fallbackPayload));
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

function cleanCurriculumCell(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function hasNumberPrefix(value) {
  return /^\s*\d+(?:\.\d+)*\.\s+/.test(String(value || ""));
}

function splitAnnualOutcomeText(text) {
  const value = cleanCurriculumCell(text);
  if (!value) return [];
  const numbered = value.match(/\d+(?:\.\d+)*\.\s+.*?(?=(?:\s+\d+(?:\.\d+)*\.\s+)|$)/g);
  if (numbered && numbered.length > 1) return numbered.map(cleanCurriculumCell).filter(Boolean);
  const sentences = value.split(/(?<=\.)\s+/).map(cleanCurriculumCell).filter((item) => item.length > 5);
  if (sentences.length > 1) return sentences;
  const fallbackNumbered = value.split(/(?=\d+\.\s)/).map(cleanCurriculumCell).filter((item) => item.length > 5);
  return fallbackNumbered.length > 1 ? fallbackNumbered : (value ? [value] : []);
}

function normalizeCurriculumKey(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isLikelyCurriculumOutcome(value) {
  const text = String(value || "").toLocaleLowerCase("tr-TR");
  if (text.length < 10) return false;
  return CURRICULUM_OUTCOME_WORDS.some((word) => text.includes(word));
}

function annualUnitsToCurriculumItems(units, courseName) {
  const items = [];
  const seen = new Set();
  (Array.isArray(units) ? units : []).forEach((unit, unitIndex) => {
    const rawTitle = cleanCurriculumCell(unit?.title || "");
    if (!rawTitle) return;
    const unitTitle = hasNumberPrefix(rawTitle) ? rawTitle : `${unitIndex + 1}. ${rawTitle}`;
    const outcomes = [];

    (Array.isArray(unit?.topicOutcomePairs) ? unit.topicOutcomePairs : []).forEach((pair) => {
      (Array.isArray(pair?.outcomes) ? pair.outcomes : []).forEach((outcome) => {
        const text = cleanCurriculumCell(outcome);
        if (text) outcomes.push(text);
      });
    });

    if (!outcomes.length) {
      splitAnnualOutcomeText(unit?.outcomes || "").forEach((outcome) => {
        const text = cleanCurriculumCell(outcome);
        if (text) outcomes.push(text);
      });
    }

    const usableOutcomes = outcomes.filter((outcome) => (
      !/^\d+\s+kazan[ıi]m\b/i.test(outcome) && isLikelyCurriculumOutcome(outcome)
    ));
    const finalOutcomes = usableOutcomes.length
      ? usableOutcomes
      : outcomes.filter((outcome) => !/^\d+\s+kazan[ıi]m\b/i.test(outcome));

    finalOutcomes
      .forEach((outcome, outcomeIndex) => {
        const cleanOutcome = hasNumberPrefix(outcome) ? outcome : `${outcomeIndex + 1}. ${outcome}`;
        const key = `${normalizeCurriculumKey(courseName)}|${normalizeCurriculumKey(unitTitle)}|${normalizeCurriculumKey(cleanOutcome)}`;
        if (seen.has(key)) return;
        seen.add(key);
        items.push({
          courseName,
          unit: unitTitle,
          topic: unitTitle,
          outcome: cleanOutcome
        });
      });
  });
  return items;
}

async function handleQuestionDocxImport(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const boundary = request.headers["content-type"]?.match(/boundary=(.+)$/)?.[1];
  if (!boundary) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Multipart boundary missing");
    return;
  }
  const { docx } = parseMultipart(body, boundary);
  const docxBuffer = docx?.data || docx;
  if (!docxBuffer?.length) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("DOCX not found");
    return;
  }
  const tempPath = join(tmpdir(), `sorubank-${Date.now()}.docx`);
  await writeFile(tempPath, docxBuffer);
  try {
    const importerPath = join(root, "scripts", "import_questions_docx.py");
    const filename = docx?.filename || "questions.docx";
    const { stdout } = await execFileAsync(pythonPath, [importerPath, tempPath, filename], {
      env: pythonEnv,
      maxBuffer: 1024 * 1024 * 10
    });
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(stdout);
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

async function handleTemplateDocxImport(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const boundary = request.headers["content-type"]?.match(/boundary=(.+)$/)?.[1];
  if (!boundary) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Multipart boundary missing");
    return;
  }
  const { file } = parseMultipart(body, boundary);
  const docxBuffer = file?.data || file;
  if (!docxBuffer?.length) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Word file not found");
    return;
  }
  const tempPath = join(tmpdir(), `sorubank-template-${Date.now()}.docx`);
  await writeFile(tempPath, docxBuffer);
  try {
    const importerPath = join(root, "scripts", "import_template_docx.py");
    const { stdout } = await execFileAsync(pythonPath, [importerPath, tempPath], {
      env: pythonEnv,
      maxBuffer: 1024 * 1024 * 10
    });
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(stdout);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "Execution error" }));
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

async function handleAnnualImportMebDbf(request, response) {
  const tempFiles = [];
  let tempDirToClean = "";
  try {
    const { url, meta } = await readJsonRequest(request);
    if (!url) {
      response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "URL parametresi eksik." }));
      return;
    }

    const metaObj = meta || {};
    let fileInRar = "";
    try {
      const parsedUrl = new URL(url);
      fileInRar = parsedUrl.searchParams.get("file") || "";
      if (fileInRar) {
        metaObj.file_in_rar = fileInRar;
      }
    } catch (e) {
      console.warn("URL parse hatası, file_in_rar okunamadı:", e.message);
    }

    const downloadedPath = await downloadMebFile(url, "annual-dbf-import");
    tempFiles.push(downloadedPath);

    let docToProcess = downloadedPath;
    let isDocx = /\.docx?($|\?)/i.test(fileInRar || url);
    const isRar = /\.rar($|\?)/i.test(url);

    if (isRar) {
      tempDirToClean = join(tmpdir(), `meb-rar-extract-${Date.now()}-${Math.random().toString(16).slice(2)}`);
      await mkdir(tempDirToClean, { recursive: true });
      await execFileAsync("tar", ["-xf", downloadedPath, "-C", tempDirToClean]);

      function getFilesRecursively(dir) {
        const entries = readdirSync(dir, { withFileTypes: true });
        const res = [];
        for (const e of entries) {
          const full = join(dir, e.name);
          if (e.isDirectory()) res.push(...getFilesRecursively(full));
          else res.push(full);
        }
        return res;
      }
      const extractedFiles = getFilesRecursively(tempDirToClean);

      if (fileInRar) {
        const targetClean = fileInRar.replace(/\\/g, "/").toLowerCase();
        docToProcess = extractedFiles.find(f => f.replace(/\\/g, "/").toLowerCase().endsWith(targetClean))
          || extractedFiles.find(f => basename(f).toLowerCase() === basename(fileInRar).toLowerCase());
      }

      if (!docToProcess || !existsSync(docToProcess)) {
        const lName = (metaObj.lessonName || metaObj.title || "").toLowerCase();
        docToProcess = extractedFiles.find(f => lName && basename(f).toLowerCase().includes(lName))
          || extractedFiles.find(f => /\.(docx?|pdf)$/i.test(f));
      }

      if (!docToProcess) {
        throw new Error("Arşiv içinde ders dosyası bulunamadı.");
      }

      isDocx = /\.docx?$/i.test(extname(docToProcess));
    }

    let units = [];
    let warnings = [];
    let weeklyHours = null;
    let lessonName = metaObj.lessonName || "";
    let grade = metaObj.grade || "";

    if (isDocx) {
      const importerPath = join(root, "scripts", "import_template_docx.py");
      const execResult = await execFileAsync(pythonPath, [importerPath, docToProcess], {
        env: pythonEnv,
        maxBuffer: 1024 * 1024 * 10
      });
      const data = JSON.parse(execResult.stdout);
      units = data.units || [];
      weeklyHours = data.weeklyHours || null;
      if (data.lessonName && !lessonName) lessonName = data.lessonName;
      if (data.grade && !grade) grade = data.grade;
      if (data.warnings) warnings = data.warnings;
    } else {
      const importerPath = join(root, "scripts", "import_annual_meb.py");
      const args = [importerPath, "--dbf", docToProcess, "--meta", JSON.stringify(metaObj)];
      const execResult = await execFileAsync(pythonPath, args, {
        env: pythonEnv,
        maxBuffer: 1024 * 1024 * 20
      });
      const payload = JSON.parse(execResult.stdout);
      units = payload.template?.units || [];
      warnings = payload.warnings || [];
      weeklyHours = payload.weeklyHours || payload.template?.weeklyHours || null;
      if (payload.template?.lessonName && !lessonName) lessonName = payload.template.lessonName;
      if (payload.template?.grade && !grade) grade = payload.template.grade;
    }

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      units,
      warnings,
      weeklyHours,
      lessonName,
      grade,
      schoolType: metaObj.schoolType || ""
    }));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "DBF indirilirken hata oluştu." }));
  } finally {
    await Promise.all(tempFiles.map(f => unlink(f).catch(() => {})));
    if (tempDirToClean) {
      await rm(tempDirToClean, { recursive: true, force: true }).catch(() => {});
    }
  }
}

async function handleExtractBookToc(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const boundary = request.headers["content-type"]?.match(/boundary=(.+)$/)?.[1];
  if (!boundary) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Multipart boundary missing");
    return;
  }
  const { file, units } = parseMultipart(body, boundary);
  const pdfBuffer = file?.data || file;
  const unitsJson = typeof units === "object" ? (units.data ? units.data.toString("utf-8") : "") : (units || "");
  
  if (!pdfBuffer?.length) {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Kitap PDF dosyası bulunamadı." }));
    return;
  }
  if (!unitsJson) {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Ünite listesi bulunamadı." }));
    return;
  }

  const tempPath = join(tmpdir(), `sorubank-book-${Date.now()}.pdf`);
  await writeFile(tempPath, pdfBuffer);

  try {
    const importerPath = join(root, "scripts", "extract_book_toc.py");
    const { stdout } = await execFileAsync(pythonPath, [importerPath, tempPath, unitsJson], {
      env: pythonEnv,
      maxBuffer: 1024 * 1024 * 20
    });
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(stdout);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "Kitap içindekiler okunamadı." }));
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

async function handleMainQuestionsImport(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const boundary = request.headers["content-type"]?.match(/boundary=(.+)$/)?.[1];
  if (!boundary) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Multipart boundary missing");
    return;
  }
  const { file } = parseMultipart(body, boundary);
  const fileBuffer = file?.data || file;
  if (!fileBuffer?.length) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("File not found");
    return;
  }
  const ext = extname(file?.filename || "questions.docx").toLowerCase();
  const tempPath = join(tmpdir(), `sorubank-main-${Date.now()}${ext}`);
  await writeFile(tempPath, fileBuffer);
  try {
    const importerPath = join(root, "scripts", "import_main_questions.py");
    const { stdout } = await execFileAsync(pythonPath, [importerPath, tempPath], {
      env: pythonEnv,
      maxBuffer: 1024 * 1024 * 10
    });
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(stdout);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "Execution error" }));
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

async function handleImeDataImport(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const boundary = request.headers["content-type"]?.match(/boundary=(.+)$/)?.[1];
  if (!boundary) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Multipart boundary missing");
    return;
  }
  const { file, knownTeachers } = parseMultipart(body, boundary);
  const fileBuffer = file?.data || file;
  if (!fileBuffer?.length) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("File not found");
    return;
  }
  const ext = extname(file?.filename || "data.xlsx").toLowerCase();
  const tempPath = join(tmpdir(), `sorubank-${Date.now()}${ext}`);
  await writeFile(tempPath, fileBuffer);
  try {
    let records;
    if (ext === ".pdf") {
      records = await parsePdf(tempPath);
    } else {
      records = await parseExcel(tempPath);
    }
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ records }));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "Parsing error" }));
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

async function handleListSqliteProfiles(request, response) {
  try {
    const profilesPath = "C:\\Users\\eyilm\\AppData\\Local\\ImeEvrak\\profiles.json";
    try {
      await stat(profilesPath);
    } catch {
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ selectedProfile: "", profiles: [] }));
      return;
    }
    const data = await readFile(profilesPath, "utf-8");
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(data);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "Failed to read profiles" }));
  }
}

async function handleImportSqliteProfile(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const bodyText = Buffer.concat(chunks).toString("utf-8");
  try {
    const { dbFile } = JSON.parse(bodyText);
    if (!dbFile) {
      response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("dbFile parameter is required");
      return;
    }
    const fullDbPath = join("C:\\Users\\eyilm\\AppData\\Local\\ImeEvrak\\Profiles", dbFile);
    try {
      await stat(fullDbPath);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(`Database file not found: ${dbFile}`);
      return;
    }

    const scriptPath = join(root, "scripts", "import_sqlite_profile.py");
    const { stdout } = await execFileAsync(pythonPath, [scriptPath, fullDbPath], {
      env: pythonEnv,
      maxBuffer: 1024 * 1024 * 10
    });
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(stdout);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "Execution error" }));
  }
}

async function handleHemSearch(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const bodyText = Buffer.concat(chunks).toString("utf-8");
  try {
    const { query } = JSON.parse(bodyText);
    const res = await fetch("https://www.hemkursplan.com/kurs-ara", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": "https://www.hemkursplan.com/kurs-plani-hazirla",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
      },
      body: new URLSearchParams({ adi: query }).toString()
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(data));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message }));
  }
}

async function handleHemModules(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const bodyText = Buffer.concat(chunks).toString("utf-8");
  try {
    const { courseId } = JSON.parse(bodyText);
    const res = await fetch(`https://www.hemkursplan.com/kurs-modul-${courseId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": "https://www.hemkursplan.com/kurs-plani-hazirla",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(data));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message }));
  }
}

// ---- e-yaygin.meb.gov.tr kurs araması ----
async function handleMebSearch(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const bodyText = Buffer.concat(chunks).toString("utf-8");
  try {
    const { query } = JSON.parse(bodyText);
    if (!query) throw new Error("Arama terimi boş.");

    let rows = [];

    // 1. MEB araması yapmayı dene
    try {
      const BASE = "https://e-yaygin.meb.gov.tr/pagePrograms.aspx";
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9",
      };

      const getRes = await fetch(BASE, { headers });
      if (getRes.ok) {
        const getHtml = await getRes.text();
        const getCookies = getRes.headers.get("set-cookie") || "";

        // ViewState ve diğer hidden field'leri çıkar
        function extractHidden(html, name) {
          const m = html.match(new RegExp(`<input[^>]+name="${name}"[^>]+value="([^"]*)"`, "i"))
                   || html.match(new RegExp(`<input[^>]+value="([^"]*)"[^>]+name="${name}"`, "i"));
          return m ? m[1] : "";
        }

        const vsCount = parseInt(extractHidden(getHtml, "__VIEWSTATEFIELDCOUNT") || "1", 10);
        const formData = new URLSearchParams();
        formData.append("__EVENTTARGET", "Sorgula");
        formData.append("__EVENTARGUMENT", "");
        formData.append("__VIEWSTATEFIELDCOUNT", String(vsCount));
        formData.append("__VIEWSTATE", extractHidden(getHtml, "__VIEWSTATE"));
        for (let i = 1; i < vsCount; i++) {
          formData.append(`__VIEWSTATE${i}`, extractHidden(getHtml, `__VIEWSTATE${i}`));
        }
        formData.append("__VIEWSTATEGENERATOR", extractHidden(getHtml, "__VIEWSTATEGENERATOR"));
        formData.append("__EVENTVALIDATION", extractHidden(getHtml, "__EVENTVALIDATION"));
        formData.append("txtAraProgramID_ClientState", "");
        formData.append("txtAraProgramAdi", query);
        formData.append("txtAraProgramAdi_ClientState", "");
        formData.append("cmbAraKursAlani_ClientState", "");
        formData.append("Sorgula", "ARA");
        formData.append("Sorgula_ClientState", "");
        formData.append("wManager_ClientState", "");
        formData.append("RadScriptManager1_TSM", extractHidden(getHtml, "RadScriptManager1_TSM"));

        const postRes = await fetch(BASE, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": BASE,
            "Cookie": getCookies,
          },
          body: formData.toString(),
        });
        if (postRes.ok) {
          const html = await postRes.text();
          const lowerQuery = query.toLowerCase();
          const rowRegex = /<tr[^>]*id="rgKurslar_ctl00__\d+"[^>]*>([\s\S]*?)<\/tr>/gi;
          let match;
          while ((match = rowRegex.exec(html)) !== null) {
            const rowHtml = match[1];
            const cells = [];
            const cellRegex = /<td[^>]*>(.*?)<\/td>/gi;
            let cm;
            while ((cm = cellRegex.exec(rowHtml)) !== null) {
              cells.push(cm[1].replace(/<[^>]+>/g, "").trim());
            }
            if (cells.length >= 4) {
              const kursId = cells[2];
              const kursAdi = cells[3];
              const kursSuresi = cells[4] || "";
              if (kursAdi && kursAdi.toLowerCase().includes(lowerQuery)) {
                rows.push({ kurs_id: kursId, kurs_adi: kursAdi, kurs_suresi: kursSuresi });
              }
            }
          }
        }
      }
    } catch (mebErr) {
      console.warn("MEB arama hatası (hemkursplan.com'a yönlendiriliyor):", mebErr.message);
    }

    // 2. MEB'den sonuç gelmediyse hemkursplan.com fallback
    if (rows.length === 0) {
      console.log(`MEB sitesinde "${query}" için sonuç bulunamadı. hemkursplan.com aranıyor...`);
      const hemRes = await fetch("https://www.hemkursplan.com/kurs-ara", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Referer": "https://www.hemkursplan.com/kurs-plani-hazirla",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
        },
        body: new URLSearchParams({ adi: query }).toString()
      });
      if (hemRes.ok) {
        const hemData = await hemRes.json();
        const hemResults = Array.isArray(hemData) ? hemData : (hemData.Results || hemData.value || []);
        rows = hemResults.map(item => ({
          kurs_id: "hem_" + item.KursID,
          kurs_adi: item.Adi,
          kurs_suresi: String(item.Sure || "")
        }));
      }
    }

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(rows.slice(0, 60)));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message }));
  }
}

// ---- e-yaygin.meb.gov.tr modül listesi ----
async function handleMebModules(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const bodyText = Buffer.concat(chunks).toString("utf-8");
  try {
    const { courseId } = JSON.parse(bodyText);
    if (!courseId) throw new Error("Kurs ID boş.");

    let modules = [];

    // Eğer ID "hem_" ile başlıyorsa doğrudan hemkursplan.com'dan çek
    if (String(courseId).startsWith("hem_")) {
      const numericId = String(courseId).replace("hem_", "");
      console.log(`Modüller hemkursplan.com sitesinden çekiliyor (ID: ${numericId})...`);
      const hemRes = await fetch(`https://www.hemkursplan.com/kurs-modul-${numericId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Referer": "https://www.hemkursplan.com/kurs-plani-hazirla",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
        }
      });
      if (hemRes.ok) {
        const hemData = await hemRes.json();
        const hemModules = Array.isArray(hemData) ? hemData : (hemData.value || hemData.Results || []);
        modules = hemModules.map(item => ({
          modul_adi: item.Adi
        }));
      }
    } else {
      // MEB'den çekmeyi dene
      try {
        const url = `https://e-yaygin.meb.gov.tr/pageProgram.aspx?program=${encodeURIComponent(courseId)}`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) KursTakip/1.0",
            "Accept": "text/html,application/xhtml+xml"
          }
        });
        if (res.ok) {
          const html = await res.text();
          const rowRegex = /<tr[^>]*class="rg(?:Row|AltRow)"[^>]*>(.*?)<\/tr>/gis;
          let match;
          while ((match = rowRegex.exec(html)) !== null) {
            const rowHtml = match[1];
            const cells = [];
            const cellRegex = /<td[^>]*>(.*?)<\/td>/gi;
            let cm;
            while ((cm = cellRegex.exec(rowHtml)) !== null) {
              cells.push(cm[1].replace(/<[^>]+>/g, "").trim());
            }
            const name = cells[1] || cells[0] || "";
            if (name && name.length > 2) {
              modules.push({ modul_adi: name });
            }
          }
        }
      } catch (mebErr) {
        console.warn("MEB modül çekme hatası (hemkursplan.com'a yönlendiriliyor):", mebErr.message);
      }

      // Eğer MEB'den modül gelmediyse ve courseId sayısal ise, hemkursplan.com'u da bir deneyebiliriz!
      if (modules.length === 0 && /^\d+$/.test(courseId)) {
        console.log(`MEB modülü bulunamadı, hemkursplan.com deneniyor (ID: ${courseId})...`);
        const hemRes = await fetch(`https://www.hemkursplan.com/kurs-modul-${courseId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": "https://www.hemkursplan.com/kurs-plani-hazirla",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
          }
        });
        if (hemRes.ok) {
          const hemData = await hemRes.json();
          const hemModules = Array.isArray(hemData) ? hemData : (hemData.value || hemData.Results || []);
          modules = hemModules.map(item => ({
            modul_adi: item.Adi
          }));
        }
      }
    }

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(modules));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message }));
  }
}

async function readJsonRequest(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const bodyText = Buffer.concat(chunks).toString("utf-8");
  return bodyText.trim() ? JSON.parse(bodyText) : {};
}

function decodeHtmlEntities(text = "") {
  return String(text)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtmlTags(html = "") {
  return decodeHtmlEntities(String(html).replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteMebUrl(href = "") {
  try {
    let cleanHref = decodeHtmlEntities(href);
    const lastUploadIdx = cleanHref.lastIndexOf("upload/");
    if (lastUploadIdx > 0) {
      cleanHref = cleanHref.substring(lastUploadIdx);
    }
    return new URL(cleanHref, "https://meslek.meb.gov.tr/").toString();
  } catch {
    return "";
  }
}

function mebCatalogPath(source, grade, schoolTypeId) {
  const safeGrade = ["9", "10", "11", "12"].includes(String(grade)) ? String(grade) : "11";
  const safeSchoolType = ["1", "2"].includes(String(schoolTypeId)) ? String(schoolTypeId) : "1";
  const paths = {
    dbf: `dbflistele.aspx?sinif_kodu=${safeGrade}&kurum_id=${safeSchoolType}`,
    material: safeSchoolType === "2" 
      ? `bom.aspx?sinif_kodu=${safeGrade}&kurum_id=2`
      : `dm_listele.aspx?sinif_kodu=${safeGrade}&kurum_id=${safeSchoolType}`,
    framework: `cercevelistele.aspx?sinif_kodu=${safeGrade}&kurum_id=${safeSchoolType}`
  };
  return paths[source] || paths.dbf;
}

function parseMebCatalogCards(html = "", source = "dbf") {
  const cleanHtml = html.replace(/\r/g, "");
  const cards = [];
  const seen = new Set();
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(cleanHtml)) !== null) {
    const href = decodeHtmlEntities(match[1]);
    if (!/\.(pdf|rar|docx?|xlsx?)($|\?)/i.test(href)) continue;

    const url = absoluteMebUrl(href);
    if (!url || seen.has(url)) continue;

    const start = Math.max(0, match.index - 250);
    const end = Math.min(cleanHtml.length, anchorRegex.lastIndex + 1300);
    const block = cleanHtml.slice(start, end);
    let title = stripHtmlTags(block.match(/<b[^>]*>([\s\S]*?)<\/b>/i)?.[1] || "")
      || stripHtmlTags(match[2])
      || url.split("/").pop();
    if (!title || /^<img/i.test(title.trim())) {
      title = stripHtmlTags(block.match(/<b[^>]*>([\s\S]*?)<\/b>/i)?.[1] || "") || url.split("/").pop();
    }
    const listItems = [...block.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((item) => stripHtmlTags(item[1]))
      .filter(Boolean);
    const details = listItems.filter((item) => item !== title);
    const gradeText = details.find((item) => /sınıf|sinif/i.test(item)) || "";
    const date = details.find((item) => /\d{1,2}\.\d{1,2}\.\d{4}/.test(item)) || "";
    const area = details.find((item) => !/MTAL|MESEM|Mesleki|Sınıf|Sinif|Ders Bilgi|Materyal|Çerçeve|Program|Form/i.test(item)) || "";
    const kind = {
      dbf: "Ders Bilgi Formu",
      material: "Ders Materyali / Kitap",
      framework: "Çerçeve Öğretim Programı"
    }[source] || "MEB Dokümanı";

    seen.add(url);
    cards.push({
      title,
      area,
      grade: gradeText,
      kind,
      date,
      url,
      fileName: decodeURIComponent(url.split("/").pop() || ""),
      extension: (url.match(/\.([a-z0-9]+)($|\?)/i)?.[1] || "").toLowerCase()
    });
  }
  return cards.sort((a, b) => a.title.localeCompare(b.title, "tr"));
}

// Complete MTAL areas list (codes 01 to 62)
const MEB_AREAS_MTAL = [
  { code: "60", name: "Mesleki Gelişim Atölyesi" },
  { code: "01", name: "Adalet" },
  { code: "02", name: "Aile ve Tüketici Hizmetleri" },
  { code: "03", name: "Ayakkabı ve Saraciye Teknolojisi" },
  { code: "58", name: "Basım Teknolojileri" },
  { code: "04", name: "Bilişim Teknolojileri" },
  { code: "05", name: "Biyomedikal Cihaz Teknolojileri" },
  { code: "06", name: "Büro Yönetimi ve Yönetici Asistanlığı" },
  { code: "07", name: "Çocuk Gelişimi ve Eğitimi" },
  { code: "08", name: "Denizcilik" },
  { code: "61", name: "Doğu Anadolu Gastronomi ve Mutfak Sanatları" },
  { code: "09", name: "El Sanatları Teknolojisi" },
  { code: "10", name: "Elektrik-Elektronik Teknolojisi" },
  { code: "55", name: "Endüstriyel Kalite Kontrol" },
  { code: "11", name: "Endüstriyel Otomasyon Teknolojileri" },
  { code: "56", name: "Gastronomi ve Mutfak Sanatları" },
  { code: "12", name: "Gazetecilik" },
  { code: "13", name: "Geleneksel Türk Sanatları" },
  { code: "14", name: "Gemi Yapımı" },
  { code: "15", name: "Gıda Teknolojisi" },
  { code: "16", name: "Grafik ve Fotoğraf" },
  { code: "17", name: "Güzellik Hizmetleri" },
  { code: "18", name: "Halkla İlişkiler" },
  { code: "19", name: "Harita-Tapu-Kadastro" },
  { code: "20", name: "Hasta ve Yaşlı Hizmetleri" },
  { code: "21", name: "Havacılık ve Uzay Teknolojisi" },
  { code: "22", name: "Hayvan Yetiştiriciliği ve Sağlığı" },
  { code: "23", name: "İnşaat Teknolojisi" },
  { code: "24", name: "İtfaiyecilik ve Yangın Güvenliği" },
  { code: "25", name: "Kimya Teknolojisi" },
  { code: "26", name: "Konaklama ve Seyahat Hizmetleri" },
  { code: "27", name: "Kuyumculuk Teknolojisi" },
  { code: "28", name: "Laboratuvar Hizmetleri" },
  { code: "29", name: "Maden Teknolojisi" },
  { code: "30", name: "Makine ve Tasarım Teknolojisi" },
  { code: "62", name: "Marmara Gastronomi ve Mutfak Sanatları" },
  { code: "31", name: "Matbaa Teknolojisi" },
  { code: "32", name: "Metal Teknolojisi" },
  { code: "33", name: "Metalürji Teknolojisi" },
  { code: "34", name: "Mikromekanik" },
  { code: "35", name: "Mobilya ve İç Mekân Tasarımı" },
  { code: "36", name: "Moda Tasarım Teknolojileri" },
  { code: "37", name: "Motorlu Araçlar Teknolojisi" },
  { code: "38", name: "Muhasebe ve Finansman" },
  { code: "59", name: "Otomotiv Teknolojileri" },
  { code: "39", name: "Pazarlama ve Perakende" },
  { code: "40", name: "Plastik Sanatlar" },
  { code: "41", name: "Plastik Teknolojisi" },
  { code: "42", name: "Radyo-Televizyon" },
  { code: "43", name: "Raylı Sistemler Teknolojisi" },
  { code: "44", name: "Sağlık Hizmetleri" },
  { code: "45", name: "Seramik ve Cam Teknolojisi" },
  { code: "46", name: "Siber Güvenlik" },
  { code: "57", name: "Sosyal Hizmetler" },
  { code: "47", name: "Tarım" },
  { code: "48", name: "Tekstil Teknolojisi" },
  { code: "49", name: "Tesisat Teknolojisi ve İklimlendirme" },
  { code: "50", name: "Uçak Bakım" },
  { code: "51", name: "Ulaştırma Hizmetleri" },
  { code: "54", name: "Yapay Zekâ" },
  { code: "52", name: "Yenilenebilir Enerji Teknolojileri" },
  { code: "53", name: "Yiyecek İçecek Hizmetleri" }
];

// Complete MESEM areas list (codes 100 to 140)
const MEB_AREAS_MESEM = [
  { code: "100", name: "23 Bağımsız Dal Çerçeve Öğretim Programları" },
  { code: "101", name: "Ayakkabı ve Saraciye Teknolojisi" },
  { code: "102", name: "Bilişim Teknolojileri" },
  { code: "103", name: "Büro Yönetimi" },
  { code: "104", name: "Denizcilik" },
  { code: "105", name: "El Sanatları Teknolojisi" },
  { code: "106", name: "Elektrik-Elektronik Teknolojisi" },
  { code: "107", name: "Endüstriyel Otomasyon Teknolojileri" },
  { code: "108", name: "Gazetecilik" },
  { code: "109", name: "Gemi Yapımı" },
  { code: "110", name: "Gıda Teknolojisi" },
  { code: "111", name: "Grafik ve Fotoğraf" },
  { code: "112", name: "Güzellik ve Saç Bakım Hizmetleri" },
  { code: "113", name: "Harita-Tapu-Kadastro" },
  { code: "114", name: "Hayvan Yetiştiriciliği ve Sağlığı" },
  { code: "115", name: "İnşaat Teknolojisi" },
  { code: "116", name: "Kimya Teknolojisi" },
  { code: "117", name: "Konaklama ve Seyahat Hizmetleri" },
  { code: "118", name: "Kuyumculuk Teknolojisi" },
  { code: "119", name: "Makine Teknolojisi" },
  { code: "120", name: "Matbaa Teknolojisi" },
  { code: "121", name: "Metal Teknolojisi" },
  { code: "122", name: "Metalürji Teknolojisi" },
  { code: "123", name: "Mobilya ve İç Mekân Tasarımı" },
  { code: "124", name: "Moda Tasarım  Teknolojileri" },
  { code: "125", name: "Motorlu Araçlar Teknolojisi" },
  { code: "126", name: "Muhasebe ve Finansman" },
  { code: "127", name: "Müzik Aletleri Yapımı" },
  { code: "128", name: "Pazarlama ve Perakende" },
  { code: "129", name: "Plastik Teknolojisi" },
  { code: "130", name: "Radyo-Televizyon" },
  { code: "131", name: "Seramik ve Cam Teknolojisi" },
  { code: "132", name: "Siber Güvenlik" },
  { code: "133", name: "Tarım" },
  { code: "134", name: "Tekstil Teknolojisi" },
  { code: "135", name: "Tesisat Teknolojisi ve İklimlendirme" },
  { code: "136", name: "Uçak Bakım" },
  { code: "137", name: "Ulaştırma Hizmetleri" },
  { code: "138", name: "Yenilenebilir Enerji Teknolojileri" },
  { code: "139", name: "Yiyecek İçecek Hizmetleri" },
  { code: "140", name: "Ortak" }
];

const ALL_MEB_AREAS = [...MEB_AREAS_MTAL, ...MEB_AREAS_MESEM];
const MEB_AREAS = MEB_AREAS_MTAL; // backward compatibility

const mebAreasCache = new Map();

async function fetchLiveMebAreas(schoolType = "mtal", grade = "11") {
  const isMesem = String(schoolType).toLowerCase() === "mesem";
  const schoolTypeId = isMesem ? "2" : "1";
  const safeGrade = ["9", "10", "11", "12"].includes(String(grade)) ? String(grade) : "11";
  const cacheKey = `${schoolTypeId}-${safeGrade}`;

  if (mebAreasCache.has(cacheKey)) {
    return mebAreasCache.get(cacheKey);
  }

  const fallback = isMesem ? MEB_AREAS_MESEM : MEB_AREAS_MTAL;

  try {
    const page = (!isMesem && safeGrade === "9") ? "cercevelistele.aspx" : "dbflistele.aspx";
    const targetUrl = `https://meslek.meb.gov.tr/${page}?sinif_kodu=${safeGrade}&kurum_id=${schoolTypeId}`;

    const res = await fetch(targetUrl, {
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Sorubank/1.0"
      },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const html = await res.text();
      const match = html.match(/<select[^>]*name=["']ctl00\$ContentPlaceHolder1\$drpalansec["'][^>]*>([\s\S]*?)<\/select>/i);
      if (match) {
        const options = [...match[1].matchAll(/<option[^>]*value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi)]
          .map(o => ({
            code: o[1],
            name: decodeHtmlEntities(o[2]).trim()
          }))
          .filter(o => o.code && o.code !== "00" && !o.name.includes("--"));

        if (options.length > 0) {
          mebAreasCache.set(cacheKey, options);
          return options;
        }
      }
    }
  } catch (e) {
    console.warn(`[MEB Areas] Canlı alanlar okunamadı (${schoolType}, ${grade}):`, e.message);
  }

  mebAreasCache.set(cacheKey, fallback);
  return fallback;
}

async function handleMebAreas(request, response) {
  try {
    let schoolType = "mtal";
    let grade = "11";
    const requestUrl = new URL(request.url, "http://localhost");
    if (requestUrl.searchParams.has("schoolType")) {
      schoolType = requestUrl.searchParams.get("schoolType");
    }
    if (requestUrl.searchParams.has("grade")) {
      grade = requestUrl.searchParams.get("grade");
    }

    if (request.method === "POST") {
      const body = await readJsonRequest(request).catch(() => ({}));
      if (body.schoolType) schoolType = body.schoolType;
      if (body.grade) grade = body.grade;
    }

    const areas = await fetchLiveMebAreas(schoolType, grade);
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "max-age=1800" });
    response.end(JSON.stringify({ schoolType, grade, areas }));
  } catch (err) {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ areas: MEB_AREAS_MTAL }));
  }
}

function decodeWindows1254(binaryString) {
  const map = {
    0xDD: 'İ', 0xDE: 'Ş', 0xD0: 'Ğ', 0xFD: 'ı', 0xFE: 'ş', 0xF0: 'ğ',
    0xE7: 'ç', 0xC7: 'Ç', 0xF6: 'ö', 0xD6: 'Ö', 0xFC: 'ü', 0xDC: 'Ü',
    0xdd: 'İ', 0xde: 'Ş', 0xd0: 'Ğ', 0xfd: 'ı', 0xfe: 'ş', 0xf0: 'ğ',
    0xe7: 'ç', 0xc7: 'Ç', 0xf6: 'ö', 0xd6: 'Ö', 0xfc: 'ü', 0xdc: 'Ü'
  };
  return [...binaryString].map(char => {
    const code = char.charCodeAt(0);
    return map[code] || char;
  }).join('');
}

async function getArchiveFileList(url, grade, areaName, isProtocol = false) {
  const cacheKey = createHash("sha256").update(url).digest("hex");
  const cachePath = join(annualMebCacheDir, `rar-list-${cacheKey}-${grade}${isProtocol ? "-pro" : ""}.json`);

  try {
    const cached = await readFile(cachePath, "utf8");
    const parsed = JSON.parse(cached);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.log(`[RAR Catalog] Cache miss for ${url}, downloading...`);
    const tempRar = await downloadMebFile(url, "catalog-rar");
    try {
      const { stdout } = await execFileAsync("tar", ["-tf", tempRar], {
        encoding: "binary",
        maxBuffer: 1024 * 1024 * 5
      });

      const decodedStdout = decodeWindows1254(stdout);
      const lines = decodedStdout.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

      const targetFiles = lines.filter(line => {
        // Support BOTH .pdf and .docx
        if (!/\.(pdf|docx?)$/i.test(line)) return false;

        const normalizedLine = line.toLowerCase()
          .replace(/ı/g, "i")
          .replace(/ş/g, "s")
          .replace(/ğ/g, "g")
          .replace(/ç/g, "c")
          .replace(/ö/g, "o")
          .replace(/ü/g, "u");

        const gradeClean = String(grade).trim();
        // Check if grade is explicitly mentioned in folder or filename
        const gradePattern = new RegExp(`(?:\\b|/|_|-)${gradeClean}(?:\\b|\\.|_|-|s[iı]n[iı]f)`, 'i');
        const hasGrade = gradePattern.test(normalizedLine);

        // Check if line specifies any OTHER grade
        const otherGrades = ["9", "10", "11", "12"].filter(g => g !== gradeClean);
        const hasOtherGrade = otherGrades.some(og => {
          const p = new RegExp(`(?:\\b|/|_|-)${og}(?:\\b|\\.|_|-|s[iı]n[iı]f)`, 'i');
          return p.test(normalizedLine);
        });

        if (hasGrade) return true;
        // If the URL itself specifies the grade (e.g. /dbf11/ or /cop9/) and file has no other grade folder:
        if (url.includes(`dbf${gradeClean}`) && !hasOtherGrade) {
          return true;
        }
        return false;
      });

      const virtualEntries = targetFiles.map(filePath => {
        const parts = filePath.split("/");
        const fileName = parts[parts.length - 1];
        const ext = (fileName.match(/\.([a-z0-9]+)$/i)?.[1] || "pdf").toLowerCase();
        let cleanTitle = fileName.replace(/\.(pdf|docx?)$/i, "").trim();
        if (isProtocol) {
          cleanTitle += " (Protokol)";
        }

        return {
          title: cleanTitle,
          area: areaName,
          grade: grade + ". Sınıf",
          kind: "Ders Bilgi Formu" + (isProtocol ? " (Protokol)" : ""),
          date: "",
          url: `${url}?file=${encodeURIComponent(filePath)}`,
          fileName: fileName,
          extension: ext
        };
      });

      await mkdir(annualMebCacheDir, { recursive: true });
      await writeFile(cachePath, JSON.stringify(virtualEntries, null, 2), "utf8");
      return virtualEntries;
    } finally {
      await unlink(tempRar).catch(() => {});
    }
  }
}

async function handleAnnualMebCatalogByArea(request, response) {
  try {
    const { source = "dbf", schoolType = "mtal", grade = "11", areaCode = "00", query = "" } = await readJsonRequest(request);
    const schoolTypeId = String(schoolType).toLowerCase() === "mesem" ? "2" : "1";
    const path = mebCatalogPath(source, grade, schoolTypeId);
    const targetUrl = `https://meslek.meb.gov.tr/${path}`;

    function extractHidden(html, name) {
      const m = html.match(new RegExp(`<input[^>]+name="${name}"[^>]+value="([^"]*)"`, "i"))
               || html.match(new RegExp(`<input[^>]+value="([^"]*)"[^>]+name="${name}"`, "i"));
      return m ? m[1] : "";
    }

    let entries = [];
    const areaName = ALL_MEB_AREAS.find(a => a.code === areaCode)?.name || "";

    // Special handling for MESEM materials (bom.aspx)
    if (schoolTypeId === "2" && source === "material") {
      try {
        const bomRes = await fetch(targetUrl, {
          headers: {
            "Accept": "text/html,application/xhtml+xml",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Sorubank/1.0"
          }
        });
        if (bomRes.ok) {
          const bomHtml = await bomRes.text();
          const cookies = bomRes.headers.getSetCookie ? bomRes.headers.getSetCookie().join("; ") : (bomRes.headers.get("set-cookie") || "");

          if (areaCode && areaCode !== "00") {
            const formData = new URLSearchParams();
            formData.append("__EVENTTARGET", "ctl00$ContentPlaceHolder1$DropDownList1");
            formData.append("__EVENTARGUMENT", "");
            formData.append("__VIEWSTATE", extractHidden(bomHtml, "__VIEWSTATE"));
            formData.append("__VIEWSTATEGENERATOR", extractHidden(bomHtml, "__VIEWSTATEGENERATOR"));
            const evVal = extractHidden(bomHtml, "__EVENTVALIDATION");
            if (evVal) formData.append("__EVENTVALIDATION", evVal);
            formData.append("ctl00$ContentPlaceHolder1$DropDownList1", areaCode);

            const postRes = await fetch(targetUrl, {
              method: "POST",
              headers: {
                "Accept": "text/html,application/xhtml+xml",
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": targetUrl,
                "Cookie": cookies,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Sorubank/1.0"
              },
              body: formData.toString()
            });

            if (postRes.ok) {
              const postHtml = await postRes.text();
              const drop2Match = postHtml.match(/<select[^>]*name=["']ctl00\$ContentPlaceHolder1\$DropDownList2["'][^>]*>([\s\S]*?)<\/select>/i);
              if (drop2Match) {
                const lessonOptions = [...drop2Match[1].matchAll(/<option[^>]*value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi)]
                  .map(o => ({ val: o[1], text: decodeHtmlEntities(o[2]).trim() }))
                  .filter(o => o.val && !o.text.includes("Seçiniz"));

                // Fetch modules for the first lessons or create material entries
                for (const lesson of lessonOptions) {
                  try {
                    const lForm = new URLSearchParams();
                    lForm.append("__EVENTTARGET", "ctl00$ContentPlaceHolder1$DropDownList2");
                    lForm.append("__EVENTARGUMENT", "");
                    lForm.append("__VIEWSTATE", extractHidden(postHtml, "__VIEWSTATE"));
                    lForm.append("__VIEWSTATEGENERATOR", extractHidden(postHtml, "__VIEWSTATEGENERATOR"));
                    const ev2 = extractHidden(postHtml, "__EVENTVALIDATION");
                    if (ev2) lForm.append("__EVENTVALIDATION", ev2);
                    lForm.append("ctl00$ContentPlaceHolder1$DropDownList1", areaCode);
                    lForm.append("ctl00$ContentPlaceHolder1$DropDownList2", lesson.val);

                    const lRes = await fetch(targetUrl, {
                      method: "POST",
                      headers: {
                        "Accept": "text/html,application/xhtml+xml",
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Referer": targetUrl,
                        "Cookie": cookies,
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Sorubank/1.0"
                      },
                      body: lForm.toString()
                    });
                    if (lRes.ok) {
                      const lHtml = await lRes.text();
                      const fileCards = parseMebCatalogCards(lHtml, "material");
                      fileCards.forEach(c => {
                        c.area = areaName || c.area;
                        c.grade = `${grade}. Sınıf`;
                        c.kind = "Bireysel Öğrenme Materyali";
                      });
                      entries.push(...fileCards);
                    }
                  } catch (e) {
                    console.warn(`MESEM ders modülleri alınamadı (${lesson.text}):`, e.message);
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn("MESEM BOM kataloğu sorgu hatası:", e.message);
      }
    } else {
      // Standard flow for MTAL and MESEM DBFs
      const getRes = await fetch(targetUrl, {
        headers: {
          "Accept": "text/html,application/xhtml+xml",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Sorubank/1.0"
        }
      });
      if (!getRes.ok) throw new Error(`MEB sayfası okunamadı: ${getRes.status}`);
      const getHtml = await getRes.text();
      const getCookies = getRes.headers.getSetCookie ? getRes.headers.getSetCookie().join("; ") : (getRes.headers.get("set-cookie") || "");

      let html = getHtml;

      if (areaCode && areaCode !== "00") {
        const formData = new URLSearchParams();
        formData.append("__EVENTTARGET", "ctl00$ContentPlaceHolder1$drpalansec");
        formData.append("__EVENTARGUMENT", "");
        formData.append("__VIEWSTATE", extractHidden(getHtml, "__VIEWSTATE"));
        formData.append("__VIEWSTATEGENERATOR", extractHidden(getHtml, "__VIEWSTATEGENERATOR"));
        const evVal = extractHidden(getHtml, "__EVENTVALIDATION");
        if (evVal) formData.append("__EVENTVALIDATION", evVal);
        formData.append("ctl00$ContentPlaceHolder1$drpalansec", areaCode);

        const postRes = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Accept": "text/html,application/xhtml+xml",
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": targetUrl,
            "Cookie": getCookies,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Sorubank/1.0"
          },
          body: formData.toString()
        });
        if (postRes.ok) html = await postRes.text();
      }

      entries = parseMebCatalogCards(html, source);

      // Filter by area name if we got an unfiltered page or further refine
      if (areaCode && areaCode !== "00" && areaName) {
        const areaKey = areaName.toLocaleLowerCase("tr-TR");
        const filtered = entries.filter(e =>
          [e.title, e.area, e.fileName].join(" ").toLocaleLowerCase("tr-TR").includes(areaKey)
        );
        if (filtered.length > 0) entries = filtered;
      }

      // Expand RAR archives into individual course PDF/DOCX files
      const expandedEntries = [];
      for (const entry of entries) {
        if (entry.extension === "rar") {
          try {
            const entryTitleLower = (entry.title || "").toLowerCase();
            const entryUrlLower = (entry.url || "").toLowerCase();
            const isProtocol = entryTitleLower.includes("pro") || entryTitleLower.includes("protokol") || entryUrlLower.includes("pro") || entryUrlLower.includes("protokol");
            const archiveFiles = await getArchiveFileList(entry.url, grade, areaName, isProtocol);
            expandedEntries.push(...archiveFiles);
          } catch (e) {
            console.error(`RAR arşivi açılamadı (${entry.url}):`, e.message);
            expandedEntries.push(entry);
          }
        } else {
          expandedEntries.push(entry);
        }
      }
      entries = expandedEntries;

      // Fallback for 9th Grade MTAL DBF: MEB 2026 update houses 9th grade curriculum in cercevelistele.aspx
      if (entries.length === 0 && source === "dbf" && String(grade) === "9" && schoolTypeId === "1") {
        try {
          const copUrl = `https://meslek.meb.gov.tr/cercevelistele.aspx?sinif_kodu=9&kurum_id=1`;
          const copGetRes = await fetch(copUrl, {
            headers: {
              "Accept": "text/html,application/xhtml+xml",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Sorubank/1.0"
            }
          });
          if (copGetRes.ok) {
            let copHtml = await copGetRes.text();
            if (areaCode && areaCode !== "00") {
              const copForm = new URLSearchParams();
              copForm.append("__EVENTTARGET", "ctl00$ContentPlaceHolder1$drpalansec");
              copForm.append("__EVENTARGUMENT", "");
              copForm.append("__VIEWSTATE", extractHidden(copHtml, "__VIEWSTATE"));
              copForm.append("__VIEWSTATEGENERATOR", extractHidden(copHtml, "__VIEWSTATEGENERATOR"));
              const ev = extractHidden(copHtml, "__EVENTVALIDATION");
              if (ev) copForm.append("__EVENTVALIDATION", ev);
              copForm.append("ctl00$ContentPlaceHolder1$drpalansec", areaCode);

              const copPostRes = await fetch(copUrl, {
                method: "POST",
                headers: {
                  "Accept": "text/html,application/xhtml+xml",
                  "Content-Type": "application/x-www-form-urlencoded",
                  "Referer": copUrl,
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Sorubank/1.0"
                },
                body: copForm.toString()
              });
              if (copPostRes.ok) copHtml = await copPostRes.text();
            }

            const copCards = parseMebCatalogCards(copHtml, "framework");
            if (copCards.length > 0) {
              if (areaCode && areaCode !== "00" && areaName) {
                const areaKey = areaName.toLocaleLowerCase("tr-TR");
                const filteredCop = copCards.filter(e =>
                  [e.title, e.area, e.fileName].join(" ").toLocaleLowerCase("tr-TR").includes(areaKey)
                );
                entries = filteredCop.length > 0 ? filteredCop : copCards;
              } else {
                entries = copCards;
              }
            }
          }
        } catch (e) {
          console.warn("9. Sınıf ÇÖP fallback hatası:", e.message);
        }
      }
    }

    const needle = String(query || "").trim().toLocaleLowerCase("tr-TR");
    if (needle) {
      entries = entries.filter(e =>
        [e.title, e.area, e.fileName].join(" ").toLocaleLowerCase("tr-TR").includes(needle)
      );
    }

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({
      source,
      schoolType: schoolTypeId === "2" ? "mesem" : "mtal",
      grade: String(grade),
      areaCode,
      areaName,
      pageUrl: targetUrl,
      count: entries.length,
      entries
    }));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "MEB kaynakları alınamadı." }));
  }
}

async function handleAnnualMebCatalog(request, response) {
  try {
    const { source = "dbf", schoolType = "mtal", grade = "11", query = "" } = await readJsonRequest(request);
    const schoolTypeId = String(schoolType).toLowerCase() === "mesem" ? "2" : "1";
    const path = mebCatalogPath(source, grade, schoolTypeId);
    const targetUrl = `https://meslek.meb.gov.tr/${path}`;
    const res = await fetch(targetUrl, {
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Sorubank/1.0"
      }
    });
    if (!res.ok) throw new Error(`MEB sayfası okunamadı: ${res.status}`);
    const html = await res.text();
    const needle = String(query || "").trim().toLocaleLowerCase("tr-TR");
    const entries = parseMebCatalogCards(html, source)
      .filter((entry) => !needle || [entry.title, entry.area, entry.fileName].join(" ").toLocaleLowerCase("tr-TR").includes(needle));
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({
      source,
      schoolType: schoolTypeId === "2" ? "mesem" : "mtal",
      grade: String(grade),
      pageUrl: targetUrl,
      count: entries.length,
      entries
    }));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "MEB kaynakları alınamadı." }));
  }
}

function assertMebFileUrl(rawUrl) {
  let cleaned = String(rawUrl || "");
  const lastUploadIdx = cleaned.lastIndexOf("upload/");
  if (lastUploadIdx > cleaned.indexOf("upload/")) {
    const originEnd = cleaned.indexOf(".tr/") + 4;
    cleaned = cleaned.substring(0, originEnd) + cleaned.substring(lastUploadIdx);
  }
  const parsed = new URL(cleaned);
  const allowedHosts = ["meslek.meb.gov.tr", "megep.meb.gov.tr", "www.meb.gov.tr"];
  if (parsed.protocol !== "https:" || !allowedHosts.includes(parsed.hostname)) {
    throw new Error("Sadece MEB portalları (meslek.meb.gov.tr, megep.meb.gov.tr) kaynakları aktarılabilir.");
  }
  if (!/\.(pdf|rar|docx?|xlsx?)($|\?)/i.test(parsed.pathname)) {
    throw new Error("MEB kaynağı PDF, RAR veya DOCX olmalıdır.");
  }
  return parsed.toString();
}

async function downloadMebFile(rawUrl, prefix) {
  const safeUrl = assertMebFileUrl(rawUrl);
  const parsed = new URL(safeUrl);
  const ext = extname(parsed.pathname).toLowerCase() || ".pdf";
  const targetPath = join(tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`);
  const headers = {
    "Accept": "application/pdf,application/octet-stream,*/*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://meslek.meb.gov.tr/"
  };
  const res = await fetch(safeUrl, { headers });
  if (!res.ok) {
    // Retry once in case of transient error
    const res2 = await fetch(safeUrl, { headers });
    if (!res2.ok) throw new Error(`MEB dosyası indirilemedi: ${res2.status} (${safeUrl})`);
    const buffer2 = Buffer.from(await res2.arrayBuffer());
    if (!buffer2.length) throw new Error(`MEB dosyası boş geldi. (${safeUrl})`);
    await writeFile(targetPath, buffer2);
    return targetPath;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length) throw new Error(`MEB dosyası boş geldi. (${safeUrl})`);
  await writeFile(targetPath, buffer);
  return targetPath;
}

const PARSER_VERSION = 5;

function annualMebCacheKey(body) {
  const identity = {
    dbfUrl: body.dbfUrl || "",
    materialUrl: body.materialUrl || "",
    schoolType: body.meta?.schoolType || "",
    grade: body.meta?.grade || "",
    area: body.meta?.area || body.meta?.areaName || "",
    title: body.meta?.title || "",
    lessonName: body.meta?.lessonName || "",
    parserVersion: PARSER_VERSION
  };
  return createHash("sha256").update(JSON.stringify(identity)).digest("hex");
}

function applyAnnualMebMeta(template, meta = {}) {
  const clone = JSON.parse(JSON.stringify(template || {}));
  if (meta.year) clone.year = meta.year;
  if (meta.area || meta.areaName) {
    clone.areaName = meta.area || meta.areaName;
    clone.areaId = safeDownloadName(clone.areaName, "meb");
  }
  if (meta.grade) clone.grade = String(meta.grade);
  if (meta.schoolType) clone.type = String(meta.schoolType).toLowerCase() === "mesem" ? "mesem" : "mtal";
  return clone;
}

async function readAnnualMebTemplateCache(body) {
  const key = annualMebCacheKey(body);
  const cachePath = join(annualMebCacheDir, `${key}.json`);
  try {
    const cached = JSON.parse(await readFile(cachePath, "utf8"));
    const template = applyAnnualMebMeta(cached.template, body.meta || {});
    template.source = {
      ...(cached.template?.source || {}),
      ...(template.source || {}),
      cache: "hit",
      cacheKey: key,
      cachedAt: cached.cachedAt || ""
    };
    return {
      template,
      warnings: cached.warnings || cached.template?.warnings || [],
      cache: { hit: true, key, cachedAt: cached.cachedAt || "" }
    };
  } catch {
    return null;
  }
}

async function writeAnnualMebTemplateCache(body, payload) {
  const key = annualMebCacheKey(body);
  const cachePath = join(annualMebCacheDir, `${key}.json`);
  await mkdir(annualMebCacheDir, { recursive: true });
  const template = payload?.template || {};
  await writeFile(cachePath, JSON.stringify({
    cachedAt: new Date().toISOString(),
    template: {
      ...template,
      source: {
        ...(template.source || {}),
        cache: "stored",
        cacheKey: key
      }
    },
    warnings: payload?.warnings || template.warnings || []
  }, null, 2), "utf8");
  return key;
}

async function handleAnnualMebTemplate(request, response) {
  const tempFiles = [];
  try {
    const body = await readJsonRequest(request);
    if (!body.forceRefresh) {
      const cached = await readAnnualMebTemplateCache(body);
      if (cached) {
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
        response.end(JSON.stringify(cached));
        return;
      }
    }
    if (!body.dbfUrl) throw new Error("Önce DBF kaynağı seçin.");
    console.log(`[MEB Template] DBF: ${body.dbfUrl}`);
    if (body.materialUrl) console.log(`[MEB Template] Material: ${body.materialUrl}`);
    const dbfPath = await downloadMebFile(body.dbfUrl, "annual-dbf");
    tempFiles.push(dbfPath);
    let materialPath = "";
    if (body.materialUrl) {
      materialPath = await downloadMebFile(body.materialUrl, "annual-material");
      tempFiles.push(materialPath);
    }

    const importerPath = join(root, "scripts", "import_annual_meb.py");
    const args = [importerPath, "--dbf", dbfPath, "--meta", JSON.stringify(body.meta || {})];
    if (materialPath) args.push("--material", materialPath);
    const { stdout } = await execFileAsync(pythonPath, args, {
      env: pythonEnv,
      maxBuffer: 1024 * 1024 * 20
    });
    const payload = JSON.parse(stdout);
    const cacheKey = await writeAnnualMebTemplateCache(body, payload).catch(() => "");
    if (payload.template) {
      payload.template.source = {
        ...(payload.template.source || {}),
        cache: "miss",
        cacheKey
      };
    }
    payload.cache = { hit: false, key: cacheKey };
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify(payload));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "MEB şablonu üretilemedi." }));
  } finally {
    await Promise.all(tempFiles.map((file) => unlink(file).catch(() => {})));
  }
}

function annualMebCalendarSources(year) {
  const sourcesByYear = {
    "2024-2025": [
      {
        title: "MEB 2024-2025 Eğitim Öğretim Yılı Çalışma Takvimi",
        url: "https://www.meb.gov.tr/meb_iys_dosyalar/2024_05/31163456_2024_2025_egitim_ogretim_yili_calisma_takvimi.pdf"
      }
    ],
    "2025-2026": [
      {
        title: "İstanbul İl MEM 2025-2026 Eğitim Öğretim Yılı Çalışma Takvimi (Güncel)",
        url: "https://istanbul.meb.gov.tr/meb_iys_dosyalar/2026_06/6a211ae505974434991934_GUNCELLENMIS_%C3%87ALISMA_TAKVIMI.pdf"
      },
      {
        title: "Yapraklı İlçe MEM 2025-2026 Eğitim-Öğretim Yılı İş Günü Takvimi",
        url: "https://yaprakli.meb.gov.tr/meb_iys_dosyalar/2025_08/26124506_20252026mebistakvimi.pdf"
      }
    ]
  };
  return sourcesByYear[year] || [];
}

function isUsefulCalendar(dates = {}) {
  return Boolean(dates.startDate && dates.endDate && dates.araTatil1Start && dates.yariyilStart && dates.araTatil2Start);
}

const MEB_CALENDAR_FALLBACKS = {
  "2024-2025": {
    startDate: "2024-09-09",
    endDate: "2025-06-20",
    araTatil1Start: "2024-11-11",
    araTatil1End: "2024-11-15",
    yariyilStart: "2025-01-20",
    yariyilEnd: "2025-01-31",
    araTatil2Start: "2025-04-07",
    araTatil2End: "2025-04-11",
    etkinlikStart: "2025-06-16",
    etkinlikEnd: "2025-06-20"
  },
  "2025-2026": {
    startDate: "2025-09-08",
    endDate: "2026-06-19",
    araTatil1Start: "2025-11-10",
    araTatil1End: "2025-11-14",
    yariyilStart: "2026-01-19",
    yariyilEnd: "2026-01-30",
    araTatil2Start: "2026-03-16",
    araTatil2End: "2026-03-20",
    etkinlikStart: "2026-06-15",
    etkinlikEnd: "2026-06-19"
  },
  "2026-2027": {
    startDate: "2026-09-14",
    endDate: "2027-06-25",
    araTatil1Start: "2026-11-16",
    araTatil1End: "2026-11-20",
    yariyilStart: "2027-01-25",
    yariyilEnd: "2027-02-05",
    araTatil2Start: "2027-03-08",
    araTatil2End: "2027-03-12",
    etkinlikStart: "2027-06-21",
    etkinlikEnd: "2027-06-25"
  },
  "2027-2028": {
    startDate: "2027-09-13",
    endDate: "2028-06-16",
    araTatil1Start: "2027-11-15",
    araTatil1End: "2027-11-19",
    yariyilStart: "2028-01-24",
    yariyilEnd: "2028-02-04",
    araTatil2Start: "2028-04-17",
    araTatil2End: "2028-04-21",
    etkinlikStart: "2028-06-12",
    etkinlikEnd: "2028-06-16"
  },
  "2028-2029": {
    startDate: "2028-09-11",
    endDate: "2029-06-22",
    araTatil1Start: "2028-11-13",
    araTatil1End: "2028-11-17",
    yariyilStart: "2029-01-22",
    yariyilEnd: "2029-02-02",
    araTatil2Start: "2029-04-09",
    araTatil2End: "2029-04-13",
    etkinlikStart: "2029-06-18",
    etkinlikEnd: "2029-06-22"
  },
  "2029-2030": {
    startDate: "2029-09-10",
    endDate: "2030-06-21",
    araTatil1Start: "2029-11-12",
    araTatil1End: "2029-11-16",
    yariyilStart: "2030-01-21",
    yariyilEnd: "2030-02-01",
    araTatil2Start: "2030-04-08",
    araTatil2End: "2030-04-12",
    etkinlikStart: "2030-06-17",
    etkinlikEnd: "2030-06-21"
  }
};

function generateCalculatedCalendarDates(year) {
  const match = String(year || "").match(/^(\d{4})-(\d{4})$/);
  if (!match) return null;
  const startYear = parseInt(match[1], 10);
  const endYear = parseInt(match[2], 10);

  // 2nd Monday of September
  let startD = new Date(Date.UTC(startYear, 8, 1));
  while (startD.getUTCDay() !== 1) startD.setUTCDate(startD.getUTCDate() + 1);
  startD.setUTCDate(startD.getUTCDate() + 7);

  // Midterm 1: mid-November (Monday to Friday)
  let ara1Start = new Date(Date.UTC(startYear, 10, 10));
  while (ara1Start.getUTCDay() !== 1) ara1Start.setUTCDate(ara1Start.getUTCDate() + 1);
  let ara1End = new Date(ara1Start);
  ara1End.setUTCDate(ara1End.getUTCDate() + 4);

  // Semester break: late-January (2 weeks)
  let yariyilStart = new Date(Date.UTC(endYear, 0, 20));
  while (yariyilStart.getUTCDay() !== 1) yariyilStart.setUTCDate(yariyilStart.getUTCDate() + 1);
  let yariyilEnd = new Date(yariyilStart);
  yariyilEnd.setUTCDate(yariyilEnd.getUTCDate() + 11);

  // Midterm 2: early-to-mid April (Monday to Friday)
  let ara2Start = new Date(Date.UTC(endYear, 3, 10));
  while (ara2Start.getUTCDay() !== 1) ara2Start.setUTCDate(ara2Start.getUTCDate() + 1);
  let ara2End = new Date(ara2Start);
  ara2End.setUTCDate(ara2End.getUTCDate() + 4);

  // School Year End: Friday around June 20
  let endD = new Date(Date.UTC(endYear, 5, 18));
  while (endD.getUTCDay() !== 5) endD.setUTCDate(endD.getUTCDate() + 1);

  const fmt = (d) => d.toISOString().slice(0, 10);
  return {
    startDate: fmt(startD),
    endDate: fmt(endD),
    araTatil1Start: fmt(ara1Start),
    araTatil1End: fmt(ara1End),
    yariyilStart: fmt(yariyilStart),
    yariyilEnd: fmt(yariyilEnd),
    araTatil2Start: fmt(ara2Start),
    araTatil2End: fmt(ara2End),
    etkinlikStart: fmt(new Date(endD.getTime() - 4 * 86400000)),
    etkinlikEnd: fmt(endD)
  };
}

async function handleAnnualMebCalendar(request, response) {
  let year = "2026-2027";
  try {
    const body = await readJsonRequest(request);
    year = String(body.year || "").trim() || "2026-2027";
    if (!/^\d{4}-\d{4}$/.test(year)) {
      throw new Error("Geçerli bir eğitim yılı girin. Örnek: 2026-2027");
    }

    const sources = annualMebCalendarSources(year);
    const parserPath = join(root, "scripts", "fetch_meb_calendar.py");
    const errors = [];
    
    // Try to fetch from internet if sources are defined
    for (const source of sources) {
      try {
        const { stdout } = await execFileAsync(pythonPath, [parserPath, JSON.stringify({ url: source.url })], {
          env: pythonEnv,
          maxBuffer: 1024 * 1024 * 5,
          timeout: 45000
        });
        const parsed = JSON.parse(stdout);
        const dates = parsed.dates || {};
        if (isUsefulCalendar(dates)) {
          response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
          response.end(JSON.stringify({ year, sourceTitle: source.title, sourceUrl: source.url, dates }));
          return;
        }
        errors.push(`${source.title}: Takvim tarihleri eksik okundu.`);
      } catch (error) {
        errors.push(`${source.title}: ${error.message}`);
      }
    }

    // Fallback to local default calendar or calculated calendar
    const fallback = MEB_CALENDAR_FALLBACKS[year] || generateCalculatedCalendarDates(year);
    if (fallback) {
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      response.end(JSON.stringify({
        year,
        sourceTitle: "MEB Resmi Çalışma Takvimi (Varsayılan/Yedek)",
        sourceUrl: "https://www.meb.gov.tr",
        dates: fallback
      }));
      return;
    }

    throw new Error(`MEB takvimi okunamadı. ${errors.join(" | ")}`);
  } catch (error) {
    const fallback = MEB_CALENDAR_FALLBACKS[year] || generateCalculatedCalendarDates(year);
    if (fallback) {
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      response.end(JSON.stringify({
        year,
        sourceTitle: "MEB Resmi Çalışma Takvimi (Varsayılan/Yedek)",
        sourceUrl: "https://www.meb.gov.tr",
        dates: fallback
      }));
      return;
    }
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "MEB takvimi alınamadı." }));
  }
}

function annualMebCalendarCachePath() {
  return join(annualMebCacheDir, "calendar-news-cache.json");
}

function mergeAnnualCalendarNews(existing = [], incoming = []) {
  const byYear = new Map();
  for (const item of [...existing, ...incoming]) {
    if (!item?.year || !isUsefulCalendar(item.dates || {})) continue;
    byYear.set(item.year, { ...item, cachedAt: item.cachedAt || new Date().toISOString() });
  }
  return [...byYear.values()].sort((a, b) => String(b.year).localeCompare(String(a.year), "tr"));
}

async function readAnnualMebCalendarNewsCache() {
  try {
    const parsed = JSON.parse(await readFile(annualMebCalendarCachePath(), "utf8"));
    return {
      cachedAt: parsed.cachedAt || "",
      calendars: Array.isArray(parsed.calendars) ? parsed.calendars : []
    };
  } catch {
    return { cachedAt: "", calendars: [] };
  }
}

async function writeAnnualMebCalendarNewsCache(calendars) {
  await mkdir(annualMebCacheDir, { recursive: true });
  const payload = { cachedAt: new Date().toISOString(), calendars };
  await writeFile(annualMebCalendarCachePath(), JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

function annualSchoolYearsAround(year) {
  const match = String(year || "").match(/^(\d{4})-(\d{4})$/);
  const start = match ? Number(match[1]) : new Date().getFullYear() - 1;
  const years = [];
  for (let value = start - 4; value <= start + 2; value += 1) {
    years.push(`${value}-${value + 1}`);
  }
  return years;
}

async function fetchAnnualMebCalendarNews(year) {
  const parserPath = join(root, "scripts", "fetch_meb_calendar.py");
  const { stdout } = await execFileAsync(pythonPath, [parserPath, JSON.stringify({
    year,
    years: annualSchoolYearsAround(year)
  })], {
    env: pythonEnv,
    maxBuffer: 1024 * 1024 * 5,
    timeout: 90000
  });
  const parsed = JSON.parse(stdout);
  return {
    selected: parsed.calendar || null,
    calendars: Array.isArray(parsed.calendars) ? parsed.calendars : []
  };
}

async function handleAnnualMebCalendarNews(request, response) {
  let requestedYear = "2026-2027";
  try {
    const body = await readJsonRequest(request);
    requestedYear = String(body.year || "").trim() || "2026-2027";
    const forceRefresh = body.forceRefresh !== false;
    if (!/^\d{4}-\d{4}$/.test(requestedYear)) {
      throw new Error("Geçerli bir eğitim yılı seçin. Örnek: 2026-2027");
    }

    const cached = await readAnnualMebCalendarNewsCache();
    let calendars = cached.calendars;
    let selected = calendars.find((item) => item.year === requestedYear && isUsefulCalendar(item.dates || {}));

    if (forceRefresh || !selected) {
      try {
        const fresh = await fetchAnnualMebCalendarNews(requestedYear);
        calendars = mergeAnnualCalendarNews(calendars, fresh.calendars);
        selected = calendars.find((item) => item.year === requestedYear && isUsefulCalendar(item.dates || {}))
          || (fresh.selected && fresh.selected.year === requestedYear && isUsefulCalendar(fresh.selected.dates || {}) ? fresh.selected : null);
        await writeAnnualMebCalendarNewsCache(calendars);
      } catch (fetchErr) {
        console.warn(`[MEB Calendar] Canlı takvim çekme uyarısı (${requestedYear}):`, fetchErr.message);
      }
    }

    if (!selected || !isUsefulCalendar(selected.dates || {})) {
      const fallbackDates = MEB_CALENDAR_FALLBACKS[requestedYear] || generateCalculatedCalendarDates(requestedYear);
      if (fallbackDates) {
        selected = {
          year: requestedYear,
          sourceTitle: "MEB Resmi Çalışma Takvimi (Varsayılan/Yedek)",
          sourceUrl: "https://www.meb.gov.tr",
          publishedAt: "",
          dates: fallbackDates
        };
      }
    }

    if (!selected || !selected.dates) {
      throw new Error(`${requestedYear} yılı için MEB haber arşivinde çalışma takvimi bulunamadı.`);
    }

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({
      year: selected.year || requestedYear,
      sourceTitle: selected.sourceTitle || "MEB eğitim öğretim yılı takvimi",
      sourceUrl: selected.sourceUrl || "",
      publishedAt: selected.publishedAt || "",
      dates: selected.dates || {},
      calendars,
      cache: { hit: !forceRefresh && Boolean(cached.cachedAt), cachedAt: cached.cachedAt || "" }
    }));
  } catch (error) {
    const fallbackDates = MEB_CALENDAR_FALLBACKS[requestedYear] || generateCalculatedCalendarDates(requestedYear);
    if (fallbackDates) {
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      response.end(JSON.stringify({
        year: requestedYear,
        sourceTitle: "MEB Resmi Çalışma Takvimi (Varsayılan/Yedek)",
        sourceUrl: "https://www.meb.gov.tr",
        publishedAt: "",
        dates: fallbackDates,
        calendars: [],
        cache: { hit: false }
      }));
      return;
    }
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "MEB takvimi alınamadı." }));
  }
}

function safeDownloadName(value, fallback = "yillik-plan") {
  return String(value || fallback)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || fallback;
}

async function handleAnnualPlanXlsx(request, response) {
  const tempFiles = [];
  try {
    const body = await readJsonRequest(request);
    if (!body.plan) throw new Error("Excel aktarımı için plan bulunamadı.");
    const jsonPath = join(tmpdir(), `annual-plan-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
    const xlsxPath = join(tmpdir(), `annual-plan-${Date.now()}-${Math.random().toString(16).slice(2)}.xlsx`);
    tempFiles.push(jsonPath, xlsxPath);
    await writeFile(jsonPath, JSON.stringify(body), "utf8");
    const exporterPath = join(root, "scripts", "export_annual_plan_xlsx.py");
    await execFileAsync(pythonPath, [exporterPath, jsonPath, xlsxPath], {
      env: pythonEnv,
      maxBuffer: 1024 * 1024 * 5
    });
    const file = await readFile(xlsxPath);
    const d = new Date();
    const today = `${String(d.getDate()).padStart(2, "0")}_${String(d.getMonth() + 1).padStart(2, "0")}_${d.getFullYear()}`;
    const filename = `${safeDownloadName(body.plan.lessonName)}_${safeDownloadName(body.plan.year)}_Yillik_Plan_${today}.xlsx`;
    response.writeHead(200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    });
    response.end(file);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "Excel planı üretilemedi." }));
  } finally {
    await Promise.all(tempFiles.map((file) => unlink(file).catch(() => {})));
  }
}

async function handleCourseStudentsImport(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const boundary = request.headers["content-type"]?.match(/boundary=(.+)$/)?.[1];
  if (!boundary) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Multipart boundary missing");
    return;
  }
  const { file } = parseMultipart(body, boundary);
  const fileBuffer = file?.data || file;
  if (!fileBuffer?.length) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("File not found");
    return;
  }
  const ext = extname(file?.filename || "data.xlsx").toLowerCase();
  const tempPath = join(tmpdir(), `coursetracking-${Date.now()}${ext}`);
  await writeFile(tempPath, fileBuffer);
  try {
    const importerPath = join(root, "scripts", "import_course_students.py");
    const { stdout } = await execFileAsync(pythonPath, [importerPath, tempPath], {
      env: pythonEnv,
      maxBuffer: 1024 * 1024 * 10
    });
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(stdout);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "Execution error" }));
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

async function handleCourseQuestionsImport(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const boundary = request.headers["content-type"]?.match(/boundary=(.+)$/)?.[1];
  if (!boundary) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Multipart boundary missing");
    return;
  }
  const { file } = parseMultipart(body, boundary);
  const fileBuffer = file?.data || file;
  if (!fileBuffer?.length) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("File not found");
    return;
  }
  const ext = extname(file?.filename || "questions.docx").toLowerCase();
  const tempPath = join(tmpdir(), `coursetracking-${Date.now()}${ext}`);
  await writeFile(tempPath, fileBuffer);
  try {
    const importerPath = join(root, "scripts", "import_course_questions.py");
    const { stdout } = await execFileAsync(pythonPath, [importerPath, tempPath], {
      env: pythonEnv,
      maxBuffer: 1024 * 1024 * 10
    });
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(stdout);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message || "Execution error" }));
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}


function parseMultipart(body, boundary) {
  const boundaryText = `--${boundary}`;
  const text = body.toString("latin1");
  const result = {};
  for (const part of text.split(boundaryText)) {
    if (!part.includes("Content-Disposition")) continue;
    const name = part.match(/name="([^"]+)"/)?.[1];
    const filename = part.match(/filename="([^"]*)"/)?.[1];
    const headerEnd = part.indexOf("\r\n\r\n");
    if (!name || headerEnd < 0) continue;
    const raw = part.slice(headerEnd + 4).replace(/\r\n--$/, "").replace(/\r\n$/, "");
    const value = Buffer.from(raw, "latin1");
    if (filename !== undefined) {
      result[name] = {
        data: value,
        filename: Buffer.from(filename, "latin1").toString("utf8")
      };
    } else {
      result[name] = value.toString("utf8");
    }
  }
  return result;
}

server.listen(port, () => {
  console.log(`Sorubank running at http://localhost:${port}`);
});

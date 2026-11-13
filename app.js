// Theme Manager
const systemThemeQuery = typeof window.matchMedia === "function"
  ? window.matchMedia("(prefers-color-scheme: dark)")
  : null;
let activeThemePreference = "system";

function normalizeThemePreference(theme) {
  return theme === "light" || theme === "dark" ? theme : "system";
}

function applyTheme(theme = "system") {
  activeThemePreference = normalizeThemePreference(theme);
  const useDarkTheme = activeThemePreference === "dark"
    || (activeThemePreference === "system" && Boolean(systemThemeQuery?.matches));
  document.body.classList.toggle("dark-mode", useDarkTheme);
  document.documentElement.style.colorScheme = useDarkTheme ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", useDarkTheme ? "#0b1220" : "#153f46");
}
window.applyTheme = applyTheme;

function handleSystemThemeChange() {
  if (activeThemePreference === "system") applyTheme("system");
}

if (systemThemeQuery) {
  if (typeof systemThemeQuery.addEventListener === "function") {
    systemThemeQuery.addEventListener("change", handleSystemThemeChange);
  } else if (typeof systemThemeQuery.addListener === "function") {
    systemThemeQuery.addListener(handleSystemThemeChange);
  }
}

function getAppModule(name) {
  return window.AppModules?.get(name) || null;
}

try {
  const settings = JSON.parse(localStorage.getItem("sorubank:global-settings:v1") || "{}");
  applyTheme(settings.theme || "system");
} catch (e) {}

const STORAGE_KEY = "sorubank:v1";

const palette = ["#9de0d6", "#f8c471", "#8fb8ed", "#f5a6b8", "#b7d889", "#c6b6f2"];
const questionTypes = {
  open: "Klasik",
  multipleChoice: "Çoktan seçmeli",
  trueFalse: "Doğru / yanlış",
  shortAnswer: "Kısa cevap"
};
const editorModes = {
  open: {
    eyebrow: "Klasik soru",
    promptLabel: "Açık uçlu soru metni",
    answerLabel: "Cevap anahtarı / örnek çözüm",
    questionPlaceholder: "Öğrencinin açıklayarak cevaplayacağı klasik soruyu buraya yazın.",
    answerPlaceholder: "Beklenen cevap, çözüm adımları ve puanlama notlarını yazın."
  },
  multipleChoice: {
    eyebrow: "Çoktan seçmeli soru",
    promptLabel: "Soru kökü",
    answerLabel: "Çözüm açıklaması",
    questionPlaceholder: "Soru kökünü buraya yazın. Seçenekleri aşağıdaki alandan yönetin.",
    answerPlaceholder: "Doğru seçeneğin gerekçesini veya çözüm yolunu yazın."
  },
  trueFalse: {
    eyebrow: "Doğru / yanlış sorusu",
    promptLabel: "Yargı / önerme",
    answerLabel: "Açıklama",
    questionPlaceholder: "Öğrencinin doğru ya da yanlış olarak değerlendireceği ifadeyi yazın.",
    answerPlaceholder: "İfadenin neden doğru veya yanlış olduğunu açıklayın."
  },
  shortAnswer: {
    eyebrow: "Kısa cevap sorusu",
    promptLabel: "Kısa cevap sorusu",
    answerLabel: "Açıklama / değerlendirme notu",
    questionPlaceholder: "Tek kelime, kavram veya kısa cümleyle cevaplanacak soruyu yazın.",
    answerPlaceholder: "Cevap varyasyonları dışındaki açıklama veya puanlama notlarını yazın."
  }
};
const choiceLabels = ["A", "B", "C", "D", "E", "F"];
const CLOUD_CONFIG_KEY = "sorubank:supabase-config";
const LOCAL_SESSION_KEY = "sorubank:local-session";
const LOCAL_USERS_KEY = "sorubank:local-users";
const SKILL_STORAGE_KEY = "ime-module:v1";
const SKILL_PROFILES_KEY = "ime-module:profiles:v1";
const STUDENT_TRACKING_STORAGE_KEY = "student-tracking:state:v1";
const ANNUAL_PLAN_STORAGE_KEY = "annual-plan:state:v1";
const COURSE_STORAGE_KEY = "coursetracking_state";
const BACKUP_PACKAGE_VERSION = 1;
const BACKUP_SNAPSHOT_KEY = "sorubank:backup-snapshots:v1";
const BACKUP_MODULES = Object.freeze({
  sorubank: {
    label: "Soru Bankası",
    keys: [STORAGE_KEY]
  },
  skill: {
    label: "İME",
    keys: [SKILL_STORAGE_KEY],
    prefixes: [`${SKILL_PROFILES_KEY}:`]
  },
  course: {
    label: "Kurs / Ders Takibi",
    keys: [COURSE_STORAGE_KEY]
  },
  student: {
    label: "Ders ve Öğrenci Takibi",
    keys: [STUDENT_TRACKING_STORAGE_KEY]
  },
  annualPlan: {
    label: "Yıllık Plan",
    keys: [ANNUAL_PLAN_STORAGE_KEY]
  },
  settings: {
    label: "Ayarlar / Profiller",
    keys: [LOCAL_SESSION_KEY, LOCAL_USERS_KEY, CLOUD_CONFIG_KEY, SKILL_PROFILES_KEY]
  }
});

let cloudState = {
  client: null,
  session: null,
  enabled: false,
  ready: false,
  syncing: false,
  lastSyncAt: "",
  lastError: "",
  configSource: "none"
};
let cloudSyncTimer = null;
let localSession = loadLocalSession();
// Apply landing module redirect on startup if not already in a module
if (localSession?.name && !localSession.activeModule) {
  try {
    const globalSettings = JSON.parse(localStorage.getItem("sorubank:global-settings:v1") || "{}");
    if (globalSettings.landingModule) {
      localSession.activeModule = globalSettings.landingModule;
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localSession));
    }
  } catch (e) {}
}
let authMode = "register";
let backupSnapshotTimer = null;

const initialState = {
  selectedCourseId: "course-physics",
  selectedCurriculumTopic: "",
  editingQuestionId: null,
  activeExamArchiveId: "",
  currentView: "bank",
  selectedQuestionIds: ["q-1", "q-2"],
  examBaskets: {},
  examAnswerSpaces: {},
  archivedExams: [],
  examMeta: {
    term: "1",
    examNumber: "1",
    className: "10/A",
    duration: "40 dakika",
    date: "",
    pageTarget: "auto",
    columns: "1",
    outputType: "exam",
    answerKeyMode: "answers",
    instruction: "Soruları dikkatlice okuyunuz. İşlem ve açıklamalarınızı cevap alanına yazınız."
  },
  settings: {
    schoolName: "NAZİLLİ 50. YIL TİCARET MESLEKİ VE\nTEKNİK ANADOLU LİSESİ",
    teachers: [],
    academicYear: "2025-2026"
  },
  curriculumItems: [
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "İş Hukuku", topic: "İş Hukukunun Tanımı", outcome: "İş Hukuku kavramını açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "İş Hukuku", topic: "İş Hukukunun Konusu", outcome: "İş Hukukunun konusunun kapsadığı alanı açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "İş Hukuku", topic: "İş Hukukunun İlkeleri", outcome: "İş Hukukunun ilkelerini açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "İş Hukuku", topic: "İş Hukukunun Tarihsel Gelişimi", outcome: "İş Hukukunun tarihsel gelişimini açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "İş Hukuku", topic: "İş Hukukunun Kaynakları", outcome: "İş Hukukunun kaynaklarını açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "Bireysel İş Hukuku", topic: "Bireysel İş Hukukunun Kavramları", outcome: "Bireysel İş Hukukunun kavramlarını açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "Bireysel İş Hukuku", topic: "İş Kanununun Uygulandığı Alanlar ve İstisnalar", outcome: "İş Kanununun uygulandığı alanları ve istisnaları açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "Bireysel İş Hukuku", topic: "İş Sözleşmesi", outcome: "İş sözleşmesini açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "Bireysel İş Hukuku", topic: "Çalışma Süreleri", outcome: "İzin, tatil ve çalışma sürelerini açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "Bireysel İş Hukuku", topic: "İzinler ve Tatiller", outcome: "İzin, tatil ve çalışma sürelerini açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "İş İlişkisinin Sona Ermesi", topic: "İş Sözleşmesinin Genel Sebeplerle Sona Ermesi", outcome: "İş sözleşmesinin genel sebeplerle sona ermesini açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "İş İlişkisinin Sona Ermesi", topic: "İş Sözleşmesinin Fesih Yoluyla Sona Erdirilmesi", outcome: "İş sözleşmesinin fesih yoluyla sona erdirilmesini açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "İş İlişkisinin Sona Ermesi", topic: "İş İlişkisinin Sona Ermesinde Hukuki Sonuçlar", outcome: "İş ilişkisinin sona ermesinin hukuki sonuçlarını açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "Sosyal Güvenlik Hukuku", topic: "Sosyal Güvenlik Kavramı", outcome: "Sosyal güvenlik kavramını açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "Sosyal Güvenlik Hukuku", topic: "Türkiye'de Sosyal Güvenliğin Tarihsel Gelişimi", outcome: "Türkiye'de sosyal güvenliğin tarihsel gelişimini açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "Sosyal Güvenlik Hukuku", topic: "Sosyal Güvenlik Kurumu", outcome: "Sosyal Güvenlik Kurumunu açıklar." },
    { courseName: "İş ve Sosyal Güvenlik Hukuku", unit: "Sosyal Güvenlik Hukuku", topic: "Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu", outcome: "Sosyal Sigortalar ve Genel Sağlık Sigortası Kanununu açıklar." }
  ],
  courses: [
    { id: "course-physics", name: "Fizik", grade: "10. sınıf", color: "#9de0d6" },
    { id: "course-history", name: "Tarih", grade: "9. sınıf", color: "#f8c471" },
    { id: "course-math", name: "Matematik", grade: "11. sınıf", color: "#8fb8ed" }
  ],
  questions: [
    {
      id: "q-1",
      courseId: "course-physics",
      topic: "Elektrik devreleri",
      outcome: "Ohm kanununu kullanarak devre değişkenlerini açıklar.",
      grade: "10",
      difficulty: "Orta",
      points: 20,
      tags: ["klasik", "işlem"],
      note: "Çözümde birim kontrolüne dikkat edilmeli.",
      content: "<p>Bir devrede direnç değeri <strong>12 ohm</strong>, devreden geçen akım ise <strong>2 A</strong> olarak ölçülüyor.</p><p>Bu devrenin uçları arasındaki gerilimi hesaplayınız ve kullandığınız bağıntıyı açıklayınız.</p>",
      answer: "<p>Ohm kanunu V = I x R şeklindedir. V = 2 x 12 = 24 V bulunur.</p>",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "q-2",
      courseId: "course-physics",
      topic: "Basınç",
      outcome: "Katı basıncını etkileyen değişkenleri yorumlar.",
      grade: "10",
      difficulty: "Kolay",
      points: 15,
      tags: ["yorum"],
      note: "",
      content: "<p>Aşağıdaki tablo, aynı ağırlıktaki üç cismin yere temas alanlarını göstermektedir.</p><table><tbody><tr><th>Cisim</th><th>Temas alanı</th></tr><tr><td>A</td><td>20 cm²</td></tr><tr><td>B</td><td>40 cm²</td></tr><tr><td>C</td><td>80 cm²</td></tr></tbody></table><p>Hangi cismin zemine uyguladığı basınç daha fazladır? Gerekçesiyle açıklayınız.</p>",
      answer: "<p>A cisminin basıncı en büyüktür. Ağırlıklar eşit olduğunda temas alanı azaldıkça basınç artar.</p>",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "q-3",
      courseId: "course-history",
      topic: "İlk Türk devletleri",
      outcome: "Devlet yönetimi anlayışını neden-sonuç ilişkisiyle açıklar.",
      grade: "9",
      difficulty: "Orta",
      points: 20,
      tags: ["açıklama", "neden-sonuç"],
      note: "",
      content: "<p>İlk Türk devletlerinde kut anlayışının yönetim yapısına etkilerini açıklayınız.</p>",
      answer: "<p>Kut anlayışı hükümdarlık yetkisinin Tanrı tarafından verildiği düşüncesidir. Bu anlayış merkezi otoriteyi güçlendirmiş, ancak hanedan üyelerinin yönetimde hak iddia etmesi taht mücadelelerine de yol açmıştır.</p>",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "q-4",
      courseId: "course-math",
      topic: "Fonksiyonlar",
      outcome: "Fonksiyon değerini hesaplar ve sonucu yorumlar.",
      grade: "11",
      difficulty: "Zor",
      points: 25,
      tags: ["işlem", "yorum"],
      note: "",
      content: "<p>f(x) = 2x² - 3x + 1 fonksiyonu veriliyor.</p><p>f(3) değerini hesaplayınız. Ardından bulunan değerin fonksiyon grafiğinde neyi ifade ettiğini açıklayınız.</p>",
      answer: "<p>f(3) = 2.9 - 9 + 1 = 10. Bu değer, x = 3 için grafikteki y değeridir.</p>",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

const initialSkillState = {
  activeView: "dashboard",
  schoolType: "mesem",
  school: {
    name: "Okul bilgisi girilmedi",
    year: "2025-2026"
  },
  schoolRecords: [
    {
      id: "school-1",
      name: "NAZİLLİ MESLEKİ EĞİTİM MERKEZİ",
      city: "AYDIN",
      principal: "Belirtilmedi",
      deputy: ""
    }
  ],
  teacherPool: [
    {
      id: "teacher-1",
      name: "YILMAZ ER"
    }
  ],
  fields: [
    {
      id: "field-1",
      area: "Belirtilmedi",
      branch: "Belirtilmedi"
    },
    {
      id: "field-2",
      area: "Güzellik ve saç bakım hizmetleri",
      branch: "Erkek kuaförlüğü"
    },
    {
      id: "field-3",
      area: "Güzellik ve saç bakım hizmetleri",
      branch: "Kadın kuaförlüğü"
    }
  ],
  businesses: [
    {
      id: "biz-1",
      name: "Örnek Muhasebe Bürosu",
      phone: "0256 000 00 00",
      address: "Nazilli",
      group: "1"
    },
    {
      id: "biz-2",
      name: "Örnek Finans Ltd.",
      phone: "",
      address: "Aydın",
      group: "2"
    }
  ],
  students: [
    {
      id: "stu-1",
      no: "101",
      name: "Ayşe Demir",
      className: "12/A",
      field: "Muhasebe ve Finansman",
      businessId: "biz-1",
      days: ""
    },
    {
      id: "stu-2",
      no: "102",
      name: "Mehmet Kaya",
      className: "12/B",
      field: "Muhasebe ve Finansman",
      businessId: "biz-2",
      days: ""
    }
  ],
  coordinators: [
    {
      id: "coord-1",
      teacher: "YILMAZ ER",
      businessId: "biz-1",
      day: "2"
    }
  ],
  holidays: [],
  wageManualAbsences: {},
  absenceRecords: {},
  reports: []
};

const persistedTextRepairPairs = [
  ["\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00b2", "\u00b2"],
  ["\u00c3\u201a\u00c2\u00b2", "\u00b2"],
  ["\u00c2\u00b2", "\u00b2"],
  ["\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00b3", "\u00b3"],
  ["\u00c3\u201a\u00c2\u00b3", "\u00b3"],
  ["\u00c2\u00b3", "\u00b3"],
  ["\u00c3\u2021", "\u00c7"],
  ["\u00c3\u00a7", "\u00e7"],
  ["\u00c4\u009e", "\u011e"],
  ["\u00c4\u0178", "\u011f"],
  ["\u00c4\u00b0", "\u0130"],
  ["\u00c4\u00b1", "\u0131"],
  ["\u00c3\u2013", "\u00d6"],
  ["\u00c3\u00b6", "\u00f6"],
  ["\u00c5\u009e", "\u015e"],
  ["\u00c5\u0178", "\u015f"],
  ["\u00c3\u0153", "\u00dc"],
  ["\u00c3\u00bc", "\u00fc"],
  ["\u00e2\u0153\u2026", "\u2705"],
  ["\u00e2\u20ac\u00a2", "\u2022"],
  ["\u00e2\u2020\u2019", "\u2192"],
  ["\u00e2\u2020\u0090", "\u2190"],
  ["\u00e2\u20ac\u201c", "\u2013"],
  ["\u00e2\u20ac\u201d", "\u2014"],
  ["\u00e2\u20ac\u00a6", "\u2026"],
  ["\u00e2\u20ac\u0153", "\u201c"],
  ["\u00e2\u20ac\u009d", "\u201d"],
  ["\u00e2\u20ac\u02dc", "\u2018"],
  ["\u00e2\u20ac\u2122", "\u2019"],
  ["\u00e2\u0161\u00a1", "\u26a1"]
];

function repairPersistedText(value) {
  if (typeof value === "string") {
    return persistedTextRepairPairs.reduce((text, [bad, good]) => text.split(bad).join(good), value)
      .replace(/\u00c2(?=[\s.,;:!?)\]}/]|$)/g, "");
  }
  if (Array.isArray(value)) return value.map(repairPersistedText);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, repairPersistedText(item)]));
  }
  return value;
}


let state = loadState();
let skillProfileStore = loadSkillProfileStore();
let skillState = getActiveSkillProfileState();
if (localSession?.id) saveSkillProfileStore();
saveState({ sync: false });
let activeRichEditor = null;
let savedSelectionRange = null;
let activeToolbar = null;
let isProgrammaticChange = false;
const EDITOR_DEFAULT_FONT_SIZE = "11";
const EDITOR_INLINE_FORMAT_TAGS = new Set(["A", "B", "BIG", "EM", "FONT", "I", "S", "SMALL", "SPAN", "STRIKE", "STRONG", "SUB", "SUP", "U"]);
const EDITOR_BLOCK_BOUNDARY_TAGS = new Set(["DIV", "P", "LI", "TD", "TH", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE"]);
let selectedResizableElement = null;
let resizePanel = null;
let dragInfo = null;
let tableActionsOverlay = null;
let resizeCornerHandle = null;
let activeHoveredTable = null;
let activeHoveredCell = null;
let overlayHideTimeout = null;
let journalEntryDialog = null;
let editingJournalTable = null;
let currentPreviewQuestionId = null;
let previewQuestionIds = [];
let cartViewMode = "summary";
let basketSectionMode = "questions";
let bulkSelectedQuestionIds = new Set();
let pendingStudentStatusIds = [];
const _initialReportDate = new Date();
let skillReportMonth = `${_initialReportDate.getFullYear()}-${String(_initialReportDate.getMonth() + 1).padStart(2, "0")}`;
let activeSkillReportType = "absence";
const sidebarCartCounts = new Map();
let cartFeedback = null;
let parsedImportRecords = [];

const JOURNAL_ACCOUNT_PLAN = Object.freeze(Object.fromEntries(`
100|Kasa
101|Alınan Çekler
102|Bankalar
103|Verilen Çekler ve Ödeme Emirleri (-)
108|Diğer Hazır Değerler
110|Hisse Senetleri
111|Özel Kesim Tahvil, Senet ve Bonoları
112|Kamu Kesimi Tahvil, Senet ve Bonoları
118|Diğer Menkul Kıymetler
119|Menkul Kıymetler Değer Düşüklüğü Karşılığı (-)
120|Alıcılar
121|Alacak Senetleri
122|Alacak Senetleri Reeskontu (-)
124|Kazanılmamış Finansal Kiralama Faiz Gelirleri (-)
126|Verilen Depozito ve Teminatlar
127|Diğer Ticari Alacaklar
128|Şüpheli Ticari Alacaklar
129|Şüpheli Ticari Alacaklar Karşılığı (-)
131|Ortaklardan Alacaklar
132|İştiraklerden Alacaklar
133|Bağlı Ortaklıklardan Alacaklar
135|Personelden Alacaklar
136|Diğer Çeşitli Alacaklar
137|Diğer Alacak Senetleri Reeskontu (-)
138|Şüpheli Diğer Alacaklar
139|Şüpheli Diğer Alacaklar Karşılığı (-)
150|İlk Madde ve Malzeme
151|Yarı Mamuller - Üretim
152|Mamuller
153|Ticari Mallar
157|Diğer Stoklar
158|Stok Değer Düşüklüğü Karşılığı (-)
159|Verilen Sipariş Avansları
170|Yıllara Yaygın İnşaat ve Onarım Maliyetleri
178|Yıllara Yaygın İnşaat Enflasyon Düzeltme Hesabı
179|Taşeronlara Verilen Avanslar
180|Gelecek Aylara Ait Giderler
181|Gelir Tahakkukları
190|Devreden KDV
191|İndirilecek KDV
192|Diğer KDV
193|Peşin Ödenen Vergiler ve Fonlar
195|İş Avansları
196|Personel Avansları
197|Sayım ve Tesellüm Noksanları
198|Diğer Çeşitli Dönen Varlıklar
199|Diğer Dönen Varlıklar Karşılığı (-)
220|Alıcılar
221|Alacak Senetleri
222|Alacak Senetleri Reeskontu (-)
224|Kazanılmamış Finansal Kiralama Faiz Gelirleri (-)
226|Verilen Depozito ve Teminatlar
229|Şüpheli Alacaklar Karşılığı (-)
231|Ortaklardan Alacaklar
232|İştiraklerden Alacaklar
233|Bağlı Ortaklıklardan Alacaklar
235|Personelden Alacaklar
236|Diğer Çeşitli Alacaklar
237|Diğer Alacak Senetleri Reeskontu (-)
239|Şüpheli Diğer Alacaklar Karşılığı (-)
240|Bağlı Menkul Kıymetler
241|Bağlı Menkul Kıymetler Değer Düşüklüğü Karşılığı (-)
242|İştirakler
243|İştiraklere Sermaye Taahhütleri (-)
244|İştirakler Sermaye Payları Değer Düşüklüğü Karşılığı (-)
245|Bağlı Ortaklıklar
246|Bağlı Ortaklıklara Sermaye Taahhütleri (-)
247|Bağlı Ortaklıklar Sermaye Payları Değer Düşüklüğü Karşılığı (-)
248|Diğer Mali Duran Varlıklar
249|Diğer Mali Duran Varlıklar Karşılığı (-)
250|Arazi ve Arsalar
251|Yer Altı ve Yer Üstü Düzenleri
252|Binalar
253|Tesis, Makina ve Cihazlar
254|Taşıtlar
255|Demirbaşlar
256|Diğer Maddi Duran Varlıklar
257|Birikmiş Amortismanlar (-)
258|Yapılmakta Olan Yatırımlar
259|Verilen Avanslar
260|Haklar
261|Şerefiye
262|Kuruluş ve Örgütlenme Giderleri
263|Araştırma ve Geliştirme Giderleri
264|Özel Maliyetler
267|Diğer Maddi Olmayan Duran Varlıklar
268|Birikmiş Amortismanlar (-)
269|Verilen Avanslar
271|Arama Giderleri
272|Hazırlık ve Geliştirme Giderleri
277|Diğer Özel Tükenmeye Tabi Varlıklar
278|Birikmiş Tükenme Payları (-)
279|Verilen Avanslar
280|Gelecek Yıllara Ait Giderler
281|Gelir Tahakkukları
291|Gelecek Yıllarda İndirilecek KDV
292|Diğer KDV
293|Gelecek Yıllar İhtiyacı Stoklar
294|Elden Çıkarılacak Stoklar ve Maddi Duran Varlıklar
295|Peşin Ödenen Vergiler ve Fonlar
297|Diğer Çeşitli Duran Varlıklar
298|Stok Değer Düşüklüğü Karşılığı (-)
299|Birikmiş Amortismanlar (-)
300|Banka Kredileri
301|Finansal Kiralama İşlemlerinden Borçlar
302|Ertelenmiş Finansal Kiralama Borçlanma Maliyetleri (-)
303|Uzun Vadeli Kredilerin Anapara Taksitleri ve Faizleri
304|Tahvil Anapara, Borç Taksit ve Faizleri
305|Çıkarılmış Bonolar ve Senetler
306|Çıkarılmış Diğer Menkul Kıymetler
308|Menkul Kıymetler İhraç Farkı (-)
309|Diğer Mali Borçlar
320|Satıcılar
321|Borç Senetleri
322|Borç Senetleri Reeskontu (-)
326|Alınan Depozito ve Teminatlar
329|Diğer Ticari Borçlar
331|Ortaklara Borçlar
332|İştiraklere Borçlar
333|Bağlı Ortaklıklara Borçlar
335|Personele Borçlar
336|Diğer Çeşitli Borçlar
337|Diğer Borç Senetleri Reeskontu (-)
340|Alınan Sipariş Avansları
349|Alınan Diğer Avanslar
350|Yıllara Yaygın İnşaat ve Onarım Hakedişleri
358|Yıllara Yaygın İnşaat Enflasyon Düzeltme Hesabı
360|Ödenecek Vergi ve Fonlar
361|Ödenecek Sosyal Güvenlik Kesintileri
368|Vadesi Geçmiş Ertelenmiş veya Taksitlendirilmiş Vergi ve Diğer Yükümlülükler
369|Ödenecek Diğer Yükümlülükler
370|Dönem Karı Vergi ve Diğer Yasal Yükümlülük Karşılıkları
371|Dönem Karının Peşin Ödenen Vergi ve Diğer Yükümlülükleri (-)
372|Kıdem Tazminatı Karşılığı
373|Maliyet Giderleri Karşılığı
379|Diğer Borç ve Gider Karşılıkları
380|Gelecek Aylara Ait Gelirler
381|Gider Tahakkukları
391|Hesaplanan KDV
392|Diğer KDV
393|Merkez ve Şubeler Cari Hesabı
397|Sayım ve Tesellüm Fazlaları
399|Diğer Çeşitli Yabancı Kaynaklar
400|Banka Kredileri
401|Finansal Kiralama İşlemlerinden Borçlar
402|Ertelenmiş Finansal Kiralama Borçlanma Maliyetleri (-)
405|Çıkarılmış Tahviller
407|Çıkarılmış Diğer Menkul Kıymetler
408|Menkul Kıymetler İhraç Farkı (-)
409|Diğer Mali Borçlar
420|Satıcılar
421|Borç Senetleri
422|Borç Senetleri Reeskontu (-)
426|Alınan Depozito ve Teminatlar
429|Diğer Ticari Borçlar
431|Ortaklara Borçlar
432|İştiraklere Borçlar
433|Bağlı Ortaklıklara Borçlar
436|Diğer Çeşitli Borçlar
437|Diğer Borç Senetleri Reeskontu (-)
438|Kamuya Olan Ertelenmiş veya Taksitlendirilmiş Borçlar
440|Alınan Sipariş Avansları
449|Alınan Diğer Avanslar
472|Kıdem Tazminatı Karşılıkları
479|Diğer Borç ve Gider Karşılıkları
480|Gelecek Yıllara Ait Gelirler
481|Gider Tahakkukları
492|Gelecek Yıllara Ertelenen veya Terkin Edilecek KDV
493|Tesise Katılma Payları
499|Diğer Çeşitli Uzun Vadeli Yabancı Kaynaklar
500|Sermaye
501|Ödenmemiş Sermaye (-)
502|Sermaye Düzeltmesi Olumlu Farkları
503|Sermaye Düzeltmesi Olumsuz Farkları (-)
520|Hisse Senetleri İhraç Primleri
521|Hisse Senedi İptal Karları
522|Maddi Duran Varlık Yeniden Değerleme Artışları
523|İştirakler Yeniden Değerleme Artışları
529|Diğer Sermaye Yedekleri
540|Yasal Yedekler
541|Statü Yedekleri
542|Olağanüstü Yedekler
548|Diğer Kar Yedekleri
549|Özel Fonlar
570|Geçmiş Yıl Karları
580|Geçmiş Yıl Zararları (-)
590|Dönem Net Karı
591|Dönem Net Zararı (-)
600|Yurtiçi Satışlar
601|Yurtdışı Satışlar
602|Diğer Gelirler
610|Satıştan İadeler (-)
611|Satış İskontoları (-)
612|Diğer İndirimler (-)
620|Satılan Mamuller Maliyeti (-)
621|Satılan Ticari Mallar Maliyeti (-)
622|Satılan Hizmet Maliyeti (-)
623|Diğer Satışların Maliyeti (-)
630|Araştırma ve Geliştirme Giderleri (-)
631|Pazarlama, Satış ve Dağıtım Giderleri (-)
632|Genel Yönetim Giderleri (-)
640|İştiraklerden Temettü Gelirleri
641|Bağlı Ortaklıklardan Temettü Gelirleri
642|Faiz Gelirleri
643|Komisyon Gelirleri
644|Konusu Kalmayan Karşılıklar
645|Menkul Kıymet Satış Karları
646|Kambiyo Karları
647|Reeskont Faiz Gelirleri
648|Enflasyon Düzeltmesi Karları
649|Diğer Olağan Gelir ve Karlar
653|Komisyon Giderleri (-)
654|Karşılık Giderleri (-)
655|Menkul Kıymet Satış Zararları (-)
656|Kambiyo Zararları (-)
657|Reeskont Faiz Giderleri (-)
658|Enflasyon Düzeltmesi Zararları (-)
659|Diğer Olağan Gider ve Zararlar (-)
660|Kısa Vadeli Borçlanma Giderleri (-)
661|Uzun Vadeli Borçlanma Giderleri (-)
671|Önceki Dönem Gelir ve Karları
679|Diğer Olağandışı Gelir ve Karlar
680|Çalışmayan Kısım Gider ve Zararları (-)
681|Önceki Dönem Gider ve Zararları (-)
689|Diğer Olağandışı Gider ve Zararlar (-)
690|Dönem Karı veya Zararı
691|Dönem Karı Vergi ve Diğer Yasal Yükümlülük Karşılıkları (-)
692|Dönem Net Karı veya Zararı
697|Yıllara Yaygın İnşaat Enflasyon Düzeltme Hesabı
698|Enflasyon Düzeltme Hesabı
710|Direkt İlk Madde ve Malzeme Giderleri
711|Direkt İlk Madde ve Malzeme Yansıtma Hesabı
712|Direkt İlk Madde ve Malzeme Fiyat Farkı
713|Direkt İlk Madde ve Malzeme Miktar Farkı
720|Direkt İşçilik Giderleri
721|Direkt İşçilik Giderleri Yansıtma Hesabı
722|Direkt İşçilik Ücret Farkları
723|Direkt İşçilik Süre (Zaman) Farkları
730|Genel Üretim Giderleri
731|Genel Üretim Giderleri Yansıtma Hesabı
732|Genel Üretim Giderleri Bütçe Farkları
733|Genel Üretim Giderleri Verimlilik Farkları
734|Genel Üretim Giderleri Kapasite Farkları
740|Hizmet Üretim Maliyeti
741|Hizmet Üretim Maliyeti Yansıtma Hesabı
742|Hizmet Üretim Maliyeti Fark Hesapları
750|Araştırma ve Geliştirme Giderleri
751|Araştırma ve Geliştirme Giderleri Yansıtma Hesabı
752|Araştırma ve Geliştirme Gider Farkları
760|Pazarlama, Satış ve Dağıtım Giderleri
761|Pazarlama, Satış ve Dağıtım Giderleri Yansıtma Hesabı
762|Pazarlama, Satış ve Dağıtım Giderleri Fark Hesabı
770|Genel Yönetim Giderleri
771|Genel Yönetim Giderleri Yansıtma Hesabı
772|Genel Yönetim Gider Farkları Hesabı
780|Finansman Giderleri
781|Finansman Giderleri Yansıtma Hesabı
782|Finansman Giderleri Fark Hesabı
`.trim().split("\n").map((line) => {
  const [code, ...nameParts] = line.split("|");
  return [code, nameParts.join("|")];
})));

const els = {
  authShell: document.querySelector("#authShell"),
  loginPanel: document.querySelector("#loginPanel"),
  moduleHub: document.querySelector("#moduleHub"),
  globalSettingsShell: document.querySelector("#globalSettingsShell"),
  systemAdminShell: document.querySelector("#systemAdminShell"),
  hubAdminModuleCard: document.querySelector("#hubAdminModuleCard"),
  accountSuspendedOverlay: document.querySelector("#accountSuspendedOverlay"),
  globalAnnouncementBar: document.querySelector("#globalAnnouncementBar"),
  globalAnnouncementText: document.querySelector("#globalAnnouncementText"),
  quickStartBtn: document.querySelector("#quickStartBtn"),
  showRegisterBtn: document.querySelector("#showRegisterBtn"),
  showLoginBtn: document.querySelector("#showLoginBtn"),
  localRegisterForm: document.querySelector("#localRegisterForm"),
  registerNameInput: document.querySelector("#registerNameInput"),
  registerEmailInput: document.querySelector("#registerEmailInput"),
  registerPasswordInput: document.querySelector("#registerPasswordInput"),
  localLoginForm: document.querySelector("#localLoginForm"),
  localUserEmailInput: document.querySelector("#localUserEmailInput"),
  localUserPasswordInput: document.querySelector("#localUserPasswordInput"),
  moduleProfileBtn: document.querySelector("#moduleProfileBtn"),
  moduleUserMenu: document.querySelector("#moduleUserMenu"),
  moduleUserAvatar: document.querySelector("#moduleUserAvatar"),
  moduleUserName: document.querySelector("#moduleUserName"),
  profileDialog: document.querySelector("#profileDialog"),
  profileForm: document.querySelector("#profileForm"),
  profileAvatar: document.querySelector("#profileAvatar"),
  profileNameInput: document.querySelector("#profileNameInput"),
  profileEmailInput: document.querySelector("#profileEmailInput"),
  profileCurrentPasswordInput: document.querySelector("#profileCurrentPasswordInput"),
  profileNewPasswordInput: document.querySelector("#profileNewPasswordInput"),
  closeProfileBtn: document.querySelector("#closeProfileBtn"),
  moduleSwitchBtn: document.querySelector("#moduleSwitchBtn"),
  moduleFloatSwitcher: document.querySelector("#moduleFloatSwitcher"),
  moduleFloatPanel: document.querySelector("#moduleFloatPanel"),
  moduleFloatButtons: document.querySelectorAll("[data-floating-module]"),
  desktopModuleDock: document.querySelector("#desktopModuleDock"),
  desktopModuleDockButtons: document.querySelectorAll("[data-dock-module]"),
  desktopSidebarCollapseBtn: document.querySelector("#desktopSidebarCollapseBtn"),
  mobileModuleHubBtn: document.querySelector("#mobileModuleHubBtn"),
  moduleSwitcherTriggers: document.querySelectorAll("button[data-module-switcher-trigger]"),
  moduleSwitcherBackdrop: document.querySelector("#moduleSwitcherBackdrop"),
  moduleSwitcherCurrentLabel: document.querySelector("#moduleSwitcherCurrentLabel"),
  appNavMobileSelect: document.querySelector("#appNavMobileSelect"),
  activeCourseCard: document.querySelector("#activeCourseCard"),
  coursePicker: document.querySelector("#coursePicker"),
  coursePickerButton: document.querySelector("#coursePickerButton"),
  courseList: document.querySelector("#courseList"),
  courseTitle: document.querySelector("#courseTitle"),
  questionGrid: document.querySelector("#questionGrid"),
  selectedList: document.querySelector("#selectedList"),
  cartSelectedList: document.querySelector("#cartSelectedList"),
  examCartBtn: document.querySelector("#examCartBtn"),
  examCartDialog: document.querySelector("#examCartDialog"),
  closeCartBtn: document.querySelector("#closeCartBtn"),
  closeCartBottomBtn: document.querySelector("#closeCartBottomBtn"),
  clearCartBtn: document.querySelector("#clearCartBtn"),
  goExamFromCartBtn: document.querySelector("#goExamFromCartBtn"),
  cartViewButtons: document.querySelectorAll("[data-cart-view]"),
  basketSectionButtons: document.querySelectorAll("[data-basket-section]"),
  basketSections: document.querySelectorAll("[data-basket-section-panel]"),
  cartQuestionCount: document.querySelector("#cartQuestionCount"),
  cartPointCount: document.querySelector("#cartPointCount"),
  cartDialogQuestionCount: document.querySelector("#cartDialogQuestionCount"),
  cartDialogPointCount: document.querySelector("#cartDialogPointCount"),
  cartWarningList: document.querySelector("#cartWarningList"),
  bulkQuestionToolbar: document.querySelector("#bulkQuestionToolbar"),
  bulkQuestionCount: document.querySelector("#bulkQuestionCount"),
  toggleVisibleQuestionsBtn: document.querySelector("#toggleVisibleQuestionsBtn"),
  deleteSelectedQuestionsBtn: document.querySelector("#deleteSelectedQuestionsBtn"),
  topicFilter: document.querySelector("#topicFilter"),
  randomTopic: document.querySelector("#randomTopic"),
  gradeFilter: document.querySelector("#gradeFilter"),
  searchInput: document.querySelector("#searchInput"),
  difficultyFilter: document.querySelector("#difficultyFilter"),
  randomDifficulty: document.querySelector("#randomDifficulty"),
  randomScope: document.querySelector("#randomScope"),
  randomCount: document.querySelector("#randomCount"),
  examCourseInput: document.querySelector("#examCourseInput"),
  examTermSelect: document.querySelector("#examTermSelect"),
  examNumberSelect: document.querySelector("#examNumberSelect"),
  examClassInput: document.querySelector("#examClassInput"),
  examDurationInput: document.querySelector("#examDurationInput"),
  examDateInput: document.querySelector("#examDateInput"),
  examPageTargetSelect: document.querySelector("#examPageTargetSelect"),
  examColumnSelect: document.querySelector("#examColumnSelect"),
  examOutputTypeSelect: document.querySelector("#examOutputTypeSelect"),
  answerKeyModeSelect: document.querySelector("#answerKeyModeSelect"),
  examInstructionInput: document.querySelector("#examInstructionInput"),
  examArchiveNameInput: document.querySelector("#examArchiveNameInput"),
  examArchiveSelect: document.querySelector("#examArchiveSelect"),
  saveExamArchiveBtn: document.querySelector("#saveExamArchiveBtn"),
  saveExamArchiveAsBtn: document.querySelector("#saveExamArchiveAsBtn"),
  loadExamArchiveBtn: document.querySelector("#loadExamArchiveBtn"),
  updateExamArchiveBtn: document.querySelector("#updateExamArchiveBtn"),
  deleteExamArchiveBtn: document.querySelector("#deleteExamArchiveBtn"),
  examAnalysisReport: document.querySelector("#examAnalysisReport"),
  examAnalysisPrintable: document.querySelector("#examAnalysisPrintable"),
  settingsForm: document.querySelector("#settingsForm"),
  cloudStatusTitle: document.querySelector("#cloudStatusTitle"),
  cloudStatusText: document.querySelector("#cloudStatusText"),
  authEmailInput: document.querySelector("#authEmailInput"),
  authPasswordInput: document.querySelector("#authPasswordInput"),
  signInBtn: document.querySelector("#signInBtn"),
  signUpBtn: document.querySelector("#signUpBtn"),
  signOutBtn: document.querySelector("#signOutBtn"),
  syncNowBtn: document.querySelector("#syncNowBtn"),
  supabaseUrlInput: document.querySelector("#supabaseUrlInput"),
  supabaseAnonKeyInput: document.querySelector("#supabaseAnonKeyInput"),
  saveCloudConfigBtn: document.querySelector("#saveCloudConfigBtn"),
  schoolNameInput: document.querySelector("#schoolNameInput"),
  teacherNameInput: document.querySelector("#teacherNameInput"),
  teacherList: document.querySelector("#teacherList"),
  addTeacherBtn: document.querySelector("#addTeacherBtn"),
  academicYearInput: document.querySelector("#academicYearInput"),
  metricQuestionCount: document.querySelector("#metricQuestionCount"),
  metricExamCount: document.querySelector("#metricExamCount"),
  metricTotalPoints: document.querySelector("#metricTotalPoints"),
  metricTopics: document.querySelector("#metricTopics"),
  questionForm: document.querySelector("#questionForm"),
  questionType: document.querySelector("#questionType"),
  questionCourse: document.querySelector("#questionCourse"),
  questionTopic: document.querySelector("#questionTopic"),
  questionOutcome: document.querySelector("#questionOutcome"),
  questionGrade: document.querySelector("#questionGrade"),
  questionDifficulty: document.querySelector("#questionDifficulty"),
  questionExamScope: document.querySelector("#questionExamScope"),
  questionPoints: document.querySelector("#questionPoints"),
  questionTags: document.querySelector("#questionTags"),
  questionNote: document.querySelector("#questionNote"),
  questionContent: document.querySelector("#questionContent"),
  questionPromptLabel: document.querySelector("#questionPromptLabel"),
  answerContent: document.querySelector("#answerContent"),
  answerLabel: document.querySelector("#answerLabel"),
  multipleChoicePanel: document.querySelector("#multipleChoicePanel"),
  trueFalsePanel: document.querySelector("#trueFalsePanel"),
  shortAnswerPanel: document.querySelector("#shortAnswerPanel"),
  choiceList: document.querySelector("#choiceList"),
  addChoiceBtn: document.querySelector("#addChoiceBtn"),
  correctChoice: document.querySelector("#correctChoice"),
  correctBoolean: document.querySelector("#correctBoolean"),
  acceptedAnswers: document.querySelector("#acceptedAnswers"),
  deleteQuestionBtn: document.querySelector("#deleteQuestionBtn"),
  questionEditorDialog: document.querySelector("#questionEditorDialog"),
  closeQuestionEditorBtn: document.querySelector("#closeQuestionEditorBtn"),
  questionPreviewDialog: document.querySelector("#questionPreviewDialog"),
  previewQuestionMeta: document.querySelector("#previewQuestionMeta"),
  previewQuestionContent: document.querySelector("#previewQuestionContent"),
  previewAnswerContent: document.querySelector("#previewAnswerContent"),
  previewQuestionContext: document.querySelector("#previewQuestionContext"),
  previewQuestionCounter: document.querySelector("#previewQuestionCounter"),
  previewQuestionPoints: document.querySelector("#previewQuestionPoints"),
  previewToggleExamBtn: document.querySelector("#previewToggleExamBtn"),
  prevPreviewBtn: document.querySelector("#prevPreviewBtn"),
  nextPreviewBtn: document.querySelector("#nextPreviewBtn"),
  printExamArea: document.querySelector("#printExamArea"),
  toastStack: document.querySelector("#toastStack"),
  confirmDialog: document.querySelector("#confirmDialog"),
  confirmTitle: document.querySelector("#confirmTitle"),
  confirmMessage: document.querySelector("#confirmMessage"),
  confirmOkBtn: document.querySelector("#confirmOkBtn"),
  confirmCancelBtn: document.querySelector("#confirmCancelBtn"),
  promptDialog: document.querySelector("#promptDialog"),
  promptForm: document.querySelector("#promptForm"),
  promptTitle: document.querySelector("#promptTitle"),
  promptLabel: document.querySelector("#promptLabel"),
  promptInput: document.querySelector("#promptInput"),
  promptOkBtn: document.querySelector("#promptOkBtn"),
  promptCancelBtn: document.querySelector("#promptCancelBtn"),
  curriculumTopicList: document.querySelector("#curriculumTopicList"),
  curriculumOutcomeList: document.querySelector("#curriculumOutcomeList"),
  selectedTopicTitle: document.querySelector("#selectedTopicTitle"),
  addTopicBtn: document.querySelector("#addTopicBtn"),
  addOutcomeBtn: document.querySelector("#addOutcomeBtn"),
  curriculumPdfInput: document.querySelector("#curriculumPdfInput"),
  questionDocxInput: document.querySelector("#questionDocxInput"),
  courseDialog: document.querySelector("#courseDialog"),
  courseForm: document.querySelector("#courseForm"),
  courseDialogTitle: document.querySelector("#courseDialogTitle"),
  courseIdInput: document.querySelector("#courseIdInput"),
  courseNameInput: document.querySelector("#courseNameInput"),
  courseGradeInput: document.querySelector("#courseGradeInput"),
  saveCourseBtn: document.querySelector("#saveCourseBtn"),
  skillShell: document.querySelector("#skillShell"),
  skillPageTitle: document.querySelector("#skillPageTitle"),
  skillGlobalSearchBox: document.querySelector("#skillGlobalSearchBox"),
  skillGlobalSearchInput: document.querySelector("#skillGlobalSearchInput"),
  skillGlobalSearchClear: document.querySelector("#skillGlobalSearchClear"),
  skillGlobalSearchResults: document.querySelector("#skillGlobalSearchResults"),
  skillModuleSwitchBtn: document.querySelector("#skillModuleSwitchBtn"),
  skillImeProfileBtn: document.querySelector("#skillImeProfileBtn"),
  skillImeProfileDialog: document.querySelector("#skillImeProfileDialog"),
  skillImeProfileForm: document.querySelector("#skillImeProfileForm"),
  skillImeProfileAvatar: document.querySelector("#skillImeProfileAvatar"),
  skillImeProfileList: document.querySelector("#skillImeProfileList"),
  skillImeProfileId: document.querySelector("#skillImeProfileId"),
  skillImeProfileName: document.querySelector("#skillImeProfileName"),
  skillImeProfileType: document.querySelector("#skillImeProfileType"),
  skillImeProfileNewBtn: document.querySelector("#skillImeProfileNewBtn"),
  skillImeProfileDeleteBtn: document.querySelector("#skillImeProfileDeleteBtn"),
  skillImeProfileCloseBtn: document.querySelector("#skillImeProfileCloseBtn"),
  skillImportDialog: document.querySelector("#skillImportDialog"),
  skillImportForm: document.querySelector("#skillImportForm"),
  skillImportFileInput: document.querySelector("#skillImportFileInput"),
  skillImportPreviewArea: document.querySelector("#skillImportPreviewArea"),
  skillImportStats: document.querySelector("#skillImportStats"),
  skillImportPreviewTable: document.querySelector("#skillImportPreviewTable"),
  skillImportSaveBtn: document.querySelector("#skillImportSaveBtn"),
  skillImportCloseBtn: document.querySelector("#skillImportCloseBtn"),
  skillImportCancelBtn: document.querySelector("#skillImportCancelBtn"),
  skillImportDataBtn: document.querySelector("#skillImportDataBtn"),
  skillNavButtons: document.querySelectorAll("[data-skill-view]"),
  skillNavMobileSelect: document.querySelector("#skillNavMobileSelect"),
  skillViewPanels: document.querySelectorAll("[data-skill-panel]"),
  skillQuickButtons: document.querySelectorAll("[data-skill-view-target]"),
  skillStatGrid: document.querySelector("#skillStatGrid"),
  skillAlertList: document.querySelector("#skillAlertList"),
  skillReportAssignmentList: document.querySelector("#skillReportAssignmentList"),
  skillReportBusinessCount: document.querySelector("#skillReportBusinessCount"),
  skillReportStudentCount: document.querySelector("#skillReportStudentCount"),
  skillYearBadge: document.querySelector("#skillYearBadge"),
  skillSchoolBadge: document.querySelector("#skillSchoolBadge"),
  skillNewStudentBtn: document.querySelector("#skillNewStudentBtn"),
  skillSchoolId: document.querySelector("#skillSchoolId"),
  skillSchoolName: document.querySelector("#skillSchoolName"),
  skillSchoolCity: document.querySelector("#skillSchoolCity"),
  skillSchoolPrincipal: document.querySelector("#skillSchoolPrincipal"),
  skillSchoolDeputy: document.querySelector("#skillSchoolDeputy"),
  skillSchoolType: document.querySelector("#skillSchoolType"),
  skillSchoolSummerStart: document.querySelector("#skillSchoolSummerStart"),
  skillSchoolSummerEnd: document.querySelector("#skillSchoolSummerEnd"),
  skillNewSchoolBtn: document.querySelector("#skillNewSchoolBtn"),
  skillDeleteSchoolBtn: document.querySelector("#skillDeleteSchoolBtn"),
  skillSaveSchoolBtn: document.querySelector("#skillSaveSchoolBtn"),
  skillSchoolTable: document.querySelector("#skillSchoolTable"),
  skillTeacherId: document.querySelector("#skillTeacherId"),
  skillTeacherName: document.querySelector("#skillTeacherName"),
  skillNewTeacherBtn: document.querySelector("#skillNewTeacherBtn"),
  skillDeleteTeacherBtn: document.querySelector("#skillDeleteTeacherBtn"),
  skillSaveTeacherBtn: document.querySelector("#skillSaveTeacherBtn"),
  skillTeacherTable: document.querySelector("#skillTeacherTable"),
  skillFieldId: document.querySelector("#skillFieldId"),
  skillFieldArea: document.querySelector("#skillFieldArea"),
  skillFieldBranch: document.querySelector("#skillFieldBranch"),
  skillNewFieldBtn: document.querySelector("#skillNewFieldBtn"),
  skillDeleteFieldBtn: document.querySelector("#skillDeleteFieldBtn"),
  skillDeleteAllFieldsBtn: document.querySelector("#skillDeleteAllFieldsBtn"),
  skillSaveFieldBtn: document.querySelector("#skillSaveFieldBtn"),
  skillFieldTable: document.querySelector("#skillFieldTable"),
  skillStudentForm: document.querySelector("#skillStudentForm"),
  skillStudentId: document.querySelector("#skillStudentId"),
  skillStudentNo: document.querySelector("#skillStudentNo"),
  skillStudentName: document.querySelector("#skillStudentName"),
  skillStudentClass: document.querySelector("#skillStudentClass"),
  skillStudentField: document.querySelector("#skillStudentField"),
  skillStudentBusiness: document.querySelector("#skillStudentBusiness"),
  skillStudentBusinessFilter: document.querySelector("#skillStudentBusinessFilter"),
  skillStudentClassFilter: document.querySelector("#skillStudentClassFilter"),
  skillStudentStatusFilter: document.querySelector("#skillStudentStatusFilter"),
  skillStudentDays: document.querySelector("#skillStudentDays"),
  skillStudentDayPicker: document.querySelector("#skillStudentDayPicker"),
  skillClassDayDialog: document.querySelector("#skillClassDayDialog"),
  skillClassDayForm: document.querySelector("#skillClassDayForm"),
  skillClassDaySelect: document.querySelector("#skillClassDaySelect"),
  skillClassDayStudentCount: document.querySelector("#skillClassDayStudentCount"),
  skillClassDayPicker: document.querySelector("#skillClassDayPicker"),
  skillAssignClassDaysBtn: document.querySelector("#skillAssignClassDaysBtn"),
  skillClassDayCloseBtn: document.querySelector("#skillClassDayCloseBtn"),
  skillClassDayCancelBtn: document.querySelector("#skillClassDayCancelBtn"),
  skillClearStudentBtn: document.querySelector("#skillClearStudentBtn"),
  skillToggleStudentStatusBtn: document.querySelector("#skillToggleStudentStatusBtn"),
  skillActivateStudentBtn: document.querySelector("#skillActivateStudentBtn"),
  skillDeleteSelectedStudentBtn: document.querySelector("#skillDeleteSelectedStudentBtn"),
  skillDeleteAllStudentBtn: document.querySelector("#skillDeleteAllStudentBtn"),
  skillStudentSearch: document.querySelector("#skillStudentSearch"),
  skillStudentTable: document.querySelector("#skillStudentTable"),
  skillStudentStatusDialog: document.querySelector("#skillStudentStatusDialog"),
  skillStudentStatusForm: document.querySelector("#skillStudentStatusForm"),
  skillStatusStudentSearch: document.querySelector("#skillStatusStudentSearch"),
  skillStatusStudentResults: document.querySelector("#skillStatusStudentResults"),
  skillStatusStudentSelect: document.querySelector("#skillStatusStudentSelect"),
  skillStatusDate: document.querySelector("#skillStatusDate"),
  skillStatusValue: document.querySelector("#skillStatusValue"),
  skillStatusReason: document.querySelector("#skillStatusReason"),
  skillStatusNote: document.querySelector("#skillStatusNote"),
  skillStatusCloseBtn: document.querySelector("#skillStatusCloseBtn"),
  skillStatusCancelBtn: document.querySelector("#skillStatusCancelBtn"),
  skillHolidayForm: document.querySelector("#skillHolidayForm"),
  skillHolidayId: document.querySelector("#skillHolidayId"),
  skillHolidayYear: document.querySelector("#skillHolidayYear"),
  skillAutoHolidayBtn: document.querySelector("#skillAutoHolidayBtn"),
  skillHolidayStartDate: document.querySelector("#skillHolidayStartDate"),
  skillHolidayStartPart: document.querySelector("#skillHolidayStartPart"),
  skillHolidayEndDate: document.querySelector("#skillHolidayEndDate"),
  skillHolidayEndPart: document.querySelector("#skillHolidayEndPart"),
  skillHolidayName: document.querySelector("#skillHolidayName"),
  skillHolidaySchoolBreak: document.querySelector("#skillHolidaySchoolBreak"),
  skillClearHolidayBtn: document.querySelector("#skillClearHolidayBtn"),
  skillDeleteSelectedHolidayBtn: document.querySelector("#skillDeleteSelectedHolidayBtn"),
  skillDeleteAllHolidayBtn: document.querySelector("#skillDeleteAllHolidayBtn"),
  skillHolidayTable: document.querySelector("#skillHolidayTable"),
  skillReportSchoolFilter: document.querySelector("#skillReportSchoolFilter"),
  skillReportCoordinatorFilter: document.querySelector("#skillReportCoordinatorFilter"),
  skillReportSearch: document.querySelector("#skillReportSearch"),
  skillReportSelectAll: document.querySelector("#skillReportSelectAll"),
  skillReportIncludeEmpty: document.querySelector("#skillReportIncludeEmpty"),
  skillReportOptions: document.querySelector(".skill-report-options"),
  skillReportMonthSelect: document.querySelector("#skillReportMonthSelect"),
  skillReportPrevMonthBtn: document.querySelector("#skillReportPrevMonthBtn"),
  skillReportNextMonthBtn: document.querySelector("#skillReportNextMonthBtn"),
  skillReportStartDate: document.querySelector("#skillReportStartDate"),
  skillReportEndDate: document.querySelector("#skillReportEndDate"),
  skillReportPerPage: document.querySelector("#skillReportPerPage"),
  skillReportMonthPicker: document.querySelector(".skill-month-picker"),
  skillReportRangeRow: document.querySelector(".skill-radio-row"),
  skillReportDateRows: document.querySelectorAll(".skill-date-row"),
  skillReportNup: document.querySelector(".skill-report-nup"),
  skillReportBusinessSymbolEnabled: document.querySelector("#skillReportBusinessSymbolEnabled"),
  skillReportSchoolSymbolEnabled: document.querySelector("#skillReportSchoolSymbolEnabled"),
  skillReportSymbolOptions: document.querySelector(".skill-report-symbol-options"),
  skillMonthlyOptions: document.querySelector(".skill-monthly-options"),
  skillMonthlyAutoFill: document.querySelector("#skillMonthlyAutoFill"),
  skillMonthlyMasterCert: document.querySelector("#skillMonthlyMasterCert"),
  skillMonthlyWagePaid: document.querySelector("#skillMonthlyWagePaid"),
  skillTerminationOptions: document.querySelector(".skill-termination-options"),
  skillTerminationBlank: document.querySelector("#skillTerminationBlank"),
  skillTerminationTemplate: document.querySelector("#skillTerminationTemplate"),
  skillTerminationNoticeFields: document.querySelector("#skillTerminationNoticeFields"),
  skillTerminationStudentTc: document.querySelector("#skillTerminationStudentTc"),
  skillTerminationVeliName: document.querySelector("#skillTerminationVeliName"),
  skillTerminationVeliPhone: document.querySelector("#skillTerminationVeliPhone"),
  skillTerminationVeliAddress: document.querySelector("#skillTerminationVeliAddress"),
  skillTerminationReasonCode: document.querySelector("#skillTerminationReasonCode"),
  skillStandardReasonsLabel: document.querySelector("#skillStandardReasonsLabel"),
  skillTerminationStudent: document.querySelector("#skillTerminationStudent"),
  skillTerminationContractDate: document.querySelector("#skillTerminationContractDate"),
  skillTerminationCancelDate: document.querySelector("#skillTerminationCancelDate"),
  skillTerminationReasons: document.querySelector("#skillTerminationReasons"),
  skillGradeOptions: document.querySelector(".skill-grade-options"),
  skillGradeType: document.querySelector("#skillGradeType"),
  skillGradeLayout: document.querySelector("#skillGradeLayout"),
  skillGradeTerm: document.querySelector("#skillGradeTerm"),
  skillWageOptions: document.querySelector(".skill-wage-options"),
  skillWageMinimumNet: document.querySelector("#skillWageMinimumNet"),
  skillWageStudentType: document.querySelector("#skillWageStudentType"),
  skillWageManualAbsence: document.querySelector("#skillWageManualAbsence"),
  skillWageManualBtn: document.querySelector("#skillWageManualBtn"),
  skillWageManualDialog: document.querySelector("#skillWageManualDialog"),
  skillWageManualForm: document.querySelector("#skillWageManualForm"),
  skillWageManualTable: document.querySelector("#skillWageManualTable"),
  skillWageManualSummary: document.querySelector("#skillWageManualSummary"),
  skillWageManualCloseBtn: document.querySelector("#skillWageManualCloseBtn"),
  skillWageManualCancelBtn: document.querySelector("#skillWageManualCancelBtn"),
  skillWageManualClearBtn: document.querySelector("#skillWageManualClearBtn"),
  skillReportTabs: document.querySelectorAll("[data-skill-report-tab]"),
  skillReportMobileSelect: document.querySelector("#skillReportMobileSelect"),
  skillReportPrecheckText: document.querySelector("#skillReportPrecheckText"),
  skillReportPrecheckBtn: document.querySelector("#skillReportPrecheckBtn"),
  skillReportPreviewTitle: document.querySelector("#skillReportPreviewTitle"),
  skillReportPreviewBtn: document.querySelector("#skillReportPreviewBtn"),
  skillReportPreviewDialog: document.querySelector("#skillReportPreviewDialog"),
  skillReportPreviewFrame: document.querySelector("#skillReportPreviewFrame"),
  skillReportPreviewCloseBtn: document.querySelector("#skillReportPreviewCloseBtn"),
  skillReportPdfBtn: document.querySelector("#skillReportPdfBtn"),
  skillReportPrintBtn: document.querySelector("#skillReportPrintBtn"),
  skillReportShareBtn: document.querySelector("#skillReportShareBtn"),
  skillReportZoomInBtn: document.querySelector("#skillReportZoomInBtn"),
  skillReportZoomOutBtn: document.querySelector("#skillReportZoomOutBtn"),
  skillReportZoomLabel: document.querySelector("#skillReportZoomLabel"),
  skillAbsenceEntryBtn: document.querySelector("#skillAbsenceEntryBtn"),
  skillAbsenceEntryDialog: document.querySelector("#skillAbsenceEntryDialog"),
  skillAbsenceSearchInput: document.querySelector("#skillAbsenceSearchInput"),
  skillAbsenceEntryMonthText: document.querySelector("#skillAbsenceEntryMonthText"),
  skillAbsenceEntryRangeText: document.querySelector("#skillAbsenceEntryRangeText"),
  skillAbsenceEntryStudentSelect: document.querySelector("#skillAbsenceEntryStudentSelect"),
  skillAbsencePrevMonthBtn: document.querySelector("#skillAbsencePrevMonthBtn"),
  skillAbsenceNextMonthBtn: document.querySelector("#skillAbsenceNextMonthBtn"),
  skillAbsenceAutoFillX: document.querySelector("#skillAbsenceAutoFillX"),
  skillAbsenceAutoFillO: document.querySelector("#skillAbsenceAutoFillO"),
  skillAbsenceEntryCloseBtn: document.querySelector("#skillAbsenceEntryCloseBtn"),
  skillAbsenceGridDayNames: document.querySelector("#skillAbsenceGridDayNames"),
  skillAbsenceGridDayNumbers: document.querySelector("#skillAbsenceGridDayNumbers"),
  skillAbsenceGridBody: document.querySelector("#skillAbsenceGridBody"),
  skillAbsenceStatusStudentName: document.querySelector("#skillAbsenceStatusStudentName"),
  skillAbsenceStatusCellCount: document.querySelector("#skillAbsenceStatusCellCount"),
  skillAbsenceClearBtn: document.querySelector("#skillAbsenceClearBtn"),
  skillAbsenceClearAllBtn: document.querySelector("#skillAbsenceClearAllBtn"),
  skillAbsenceSaveBtn: document.querySelector("#skillAbsenceSaveBtn"),
  skillAbsenceCancelBtn: document.querySelector("#skillAbsenceCancelBtn"),
  skillAbsenceOverlayMenu: document.querySelector("#skillAbsenceOverlayMenu"),
  skillBusinessForm: document.querySelector("#skillBusinessForm"),
  skillBusinessId: document.querySelector("#skillBusinessId"),
  skillBusinessName: document.querySelector("#skillBusinessName"),
  skillBusinessPhone: document.querySelector("#skillBusinessPhone"),
  skillBusinessGroup: document.querySelector("#skillBusinessGroup"),
  skillBusinessAddress: document.querySelector("#skillBusinessAddress"),
  skillClearBusinessBtn: document.querySelector("#skillClearBusinessBtn"),
  skillDeleteSelectedBusinessBtn: document.querySelector("#skillDeleteSelectedBusinessBtn"),
  skillDeleteAllBusinessBtn: document.querySelector("#skillDeleteAllBusinessBtn"),
  skillBusinessTable: document.querySelector("#skillBusinessTable"),
  skillCoordinatorForm: document.querySelector("#skillCoordinatorForm"),
  skillCoordinatorId: document.querySelector("#skillCoordinatorId"),
  skillCoordinatorSchool: document.querySelector("#skillCoordinatorSchool"),
  skillCoordinatorTeacher: document.querySelector("#skillCoordinatorTeacher"),
  skillCoordinatorDeputy: document.querySelector("#skillCoordinatorDeputy"),
  skillCoordinatorBusiness: document.querySelector("#skillCoordinatorBusiness"),
  skillCoordinatorDay: document.querySelector("#skillCoordinatorDay"),
  skillClearCoordinatorBtn: document.querySelector("#skillClearCoordinatorBtn"),
  skillDeleteSelectedCoordinatorBtn: document.querySelector("#skillDeleteSelectedCoordinatorBtn"),
  skillDeleteAllCoordinatorBtn: document.querySelector("#skillDeleteAllCoordinatorBtn"),
  skillCoordinatorTable: document.querySelector("#skillCoordinatorTable")
};

const MODULE_SWITCHER_LABELS = {
  sorubank: "Soru Bankası",
  "student-tracking": "Ders Takibi",
  "skill-training": "Beceri Eğitimi",
  "course-tracking": "Kurs Takibi",
  "annual-plan": "Yıllık Plan",
  settings: "Ayarlar",
  "system-admin": "Yönetim Paneli"
};
const DESKTOP_SIDEBAR_COLLAPSED_KEY = "sorubank:desktop-sidebar-collapsed";

let lastModuleSwitcherTrigger = null;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return normalizeState(structuredClone(initialState));
    const parsed = JSON.parse(saved);
    const nextState = { ...structuredClone(initialState), ...parsed };
    if (!Object.prototype.hasOwnProperty.call(parsed, "curriculumItems")) {
      nextState.curriculumItems = [];
    }
    if (!Object.prototype.hasOwnProperty.call(parsed, "selectedQuestionIds")) {
      nextState.selectedQuestionIds = [];
    }
    if (!Object.prototype.hasOwnProperty.call(parsed, "examBaskets")) {
      nextState.examBaskets = {};
    }
    if (!Object.prototype.hasOwnProperty.call(parsed, "examAnswerSpaces")) {
      nextState.examAnswerSpaces = {};
    }
    return normalizeState(nextState);
  } catch {
    return normalizeState(structuredClone(initialState));
  }
}



function normalizeSkillSchoolType(value = "") {
  return value === "lise" ? "lise" : "mesem";
}

function getSkillProfilesStorageKey() {
  return `${SKILL_PROFILES_KEY}:${localSession?.id || "guest"}`;
}

function hasAnyScopedSkillProfileStore() {
  const prefix = `${SKILL_PROFILES_KEY}:`;
  for (let index = 0; index < localStorage.length; index += 1) {
    if (String(localStorage.key(index) || "").startsWith(prefix)) return true;
  }
  return false;
}

function getSkillSchoolTypeLabel(value = getActiveSkillSchoolType()) {
  return normalizeSkillSchoolType(value) === "lise" ? "Meslek Lisesi" : "Mesem";
}

function normalizeSkillPhone(phone = "") {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith("90")) return digits.slice(2);
  return digits.length >= 7 ? digits : "";
}

function normalizeSkillBusinessNameKeys(name = "") {
  const ascii = String(name || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\u0307/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!ascii || ascii === "belirtilmedi" || ascii === "isletme yok" || ascii === "bilinmeyen isletme") {
    return { compact: "", sortedWords: "", wordCount: 0 };
  }
  const words = ascii.split(" ").filter(Boolean);
  const compact = words.join("");
  const sortedWords = [...words].sort().join(" ");
  return { compact, sortedWords, wordCount: words.length };
}

function cleanSkillBusinessAddress(address = "") {
  let s = String(address || "").trim();
  if (!s) return "";
  s = s
    .replace(/\bCADKNOWRPLA\b/gi, "CAD.NO:53/A")
    .replace(/\bCADKNOWSR\b/gi, "CAD.NO:65")
    .replace(/\bMAHKKARAYOLU\b/gi, "MAH. KARAYOLU")
    .replace(/\bMAHK\b/gi, "MAH.")
    .replace(/\/KUYUC\s+AK\b/gi, "/KUYUCAK")
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

function isCorruptedSkillAddress(address = "") {
  return /KNOW|MAHK|\bC\s+NO\s+PAMUK/i.test(String(address || ""));
}

function chooseBetterSkillAddress(existingAddr = "", incomingAddr = "") {
  const cleanA = cleanSkillBusinessAddress(existingAddr);
  const cleanB = cleanSkillBusinessAddress(incomingAddr);
  if (!cleanA) return cleanB;
  if (!cleanB) return cleanA;
  const badA = isCorruptedSkillAddress(existingAddr) && !isCorruptedSkillAddress(incomingAddr);
  const badB = isCorruptedSkillAddress(incomingAddr) && !isCorruptedSkillAddress(existingAddr);
  if (badA) return cleanB;
  if (badB) return cleanA;
  return cleanB.length > cleanA.length ? cleanB : cleanA;
}

function chooseBetterSkillBusinessName(nameA = "", nameB = "") {
  const a = String(nameA || "").trim();
  const b = String(nameB || "").trim();
  if (!a || a === "Belirtilmedi") return b;
  if (!b || b === "Belirtilmedi") return a;
  if (a.includes("-") && !b.includes("-")) return a;
  if (b.includes("-") && !a.includes("-")) return b;
  return a;
}

function areSameSkillBusiness(nameA, phoneA, nameB, phoneB) {
  const pA = normalizeSkillPhone(phoneA);
  const pB = normalizeSkillPhone(phoneB);
  if (pA && pB && pA === pB) {
    return true;
  }
  const kA = normalizeSkillBusinessNameKeys(nameA);
  const kB = normalizeSkillBusinessNameKeys(nameB);
  if (kA.compact && kB.compact) {
    if (kA.compact === kB.compact) return true;
    if (kA.wordCount >= 2 && kB.wordCount >= 2 && kA.sortedWords === kB.sortedWords) return true;
  }
  return false;
}

function findMatchingSkillBusiness(businesses = [], candidateName = "", candidatePhone = "", excludeId = "") {
  if (!Array.isArray(businesses)) return null;
  return businesses.find((b) => {
    if (!b || (excludeId && b.id === excludeId)) return false;
    return areSameSkillBusiness(b.name, b.phone, candidateName, candidatePhone);
  }) || null;
}

function deduplicateSkillBusinesses(targetState = skillState) {
  if (!targetState || !Array.isArray(targetState.businesses)) return false;
  const keptBusinesses = [];
  const idRemap = new Map();
  let changed = false;

  targetState.businesses.forEach((biz) => {
    if (!biz) return;
    const cleanedAddr = cleanSkillBusinessAddress(biz.address);
    if (cleanedAddr !== (biz.address || "")) {
      biz.address = cleanedAddr;
      changed = true;
    }
    const existing = findMatchingSkillBusiness(keptBusinesses, biz.name, biz.phone);
    if (!existing) {
      keptBusinesses.push(biz);
    } else {
      changed = true;
      idRemap.set(biz.id, existing.id);
      existing.name = chooseBetterSkillBusinessName(existing.name, biz.name);
      existing.phone = existing.phone || biz.phone || "";
      existing.address = chooseBetterSkillAddress(existing.address, biz.address);
      if (biz.group === "2") existing.group = "2";
    }
  });

  if (idRemap.size > 0) {
    targetState.businesses = keptBusinesses;
    if (Array.isArray(targetState.students)) {
      targetState.students.forEach((stu) => {
        if (stu && idRemap.has(stu.businessId)) {
          stu.businessId = idRemap.get(stu.businessId);
        }
      });
    }
    if (Array.isArray(targetState.coordinators)) {
      const mergedCoordinators = [];
      targetState.coordinators.forEach((coord) => {
        if (!coord) return;
        if (idRemap.has(coord.businessId)) {
          coord.businessId = idRemap.get(coord.businessId);
        }
        const existingCoord = mergedCoordinators.find((c) => c.businessId === coord.businessId);
        if (!existingCoord) {
          mergedCoordinators.push(coord);
        } else {
          if (!existingCoord.teacher && coord.teacher) existingCoord.teacher = coord.teacher;
          if (!existingCoord.deputy && coord.deputy) existingCoord.deputy = coord.deputy;
          if (!existingCoord.day && coord.day) existingCoord.day = coord.day;
        }
      });
      targetState.coordinators = mergedCoordinators;
    }
  }
  return changed;
}

window.normalizeSkillPhone = normalizeSkillPhone;
window.normalizeSkillBusinessNameKeys = normalizeSkillBusinessNameKeys;
window.cleanSkillBusinessAddress = cleanSkillBusinessAddress;
window.chooseBetterSkillAddress = chooseBetterSkillAddress;
window.chooseBetterSkillBusinessName = chooseBetterSkillBusinessName;
window.areSameSkillBusiness = areSameSkillBusiness;
window.findMatchingSkillBusiness = findMatchingSkillBusiness;
window.deduplicateSkillBusinesses = deduplicateSkillBusinesses;

function normalizeSkillStateShape(value = {}) {
  const nextState = {
    ...structuredClone(initialSkillState),
    ...(value || {})
  };
  nextState.schoolType = normalizeSkillSchoolType(nextState.schoolType);
  if (!Array.isArray(nextState.schoolRecords)) nextState.schoolRecords = structuredClone(initialSkillState.schoolRecords);
  if (!Array.isArray(nextState.teacherPool)) nextState.teacherPool = structuredClone(initialSkillState.teacherPool);
  if (!Array.isArray(nextState.fields)) nextState.fields = structuredClone(initialSkillState.fields);
  if (!Array.isArray(nextState.businesses)) nextState.businesses = structuredClone(initialSkillState.businesses);
  if (!Array.isArray(nextState.students)) nextState.students = structuredClone(initialSkillState.students);
  if (!Array.isArray(nextState.coordinators)) nextState.coordinators = structuredClone(initialSkillState.coordinators);
  if (!Array.isArray(nextState.holidays)) nextState.holidays = [];
  if (!nextState.wageManualAbsences || Array.isArray(nextState.wageManualAbsences)) nextState.wageManualAbsences = {};
  if (!nextState.absenceRecords || Array.isArray(nextState.absenceRecords)) nextState.absenceRecords = {};
  if (!Array.isArray(nextState.reports)) nextState.reports = [];
  nextState.students = nextState.students.map((student) => ({ ...student, active: student.active !== false }));
  deduplicateSkillBusinesses(nextState);
  return nextState;
}

function createBlankSkillState(schoolType = "mesem") {
  return normalizeSkillStateShape({
    ...structuredClone(initialSkillState),
    schoolType: normalizeSkillSchoolType(schoolType),
    school: {
      name: "Okul bilgisi girilmedi",
      year: initialSkillState.school.year
    },
    schoolRecords: [],
    teacherPool: [],
    fields: [],
    businesses: [],
    students: [],
    coordinators: [],
    holidays: [],
    wageManualAbsences: {},
    reports: []
  });
}

function createSkillProfile(name = "Yeni İME Profili", schoolType = "mesem", stateValue = null) {
  const nextState = normalizeSkillStateShape(stateValue || createBlankSkillState(schoolType));
  nextState.schoolType = normalizeSkillSchoolType(schoolType);
  return {
    id: uid("ime-profile"),
    name: String(name || "Yeni İME Profili").trim() || "Yeni İME Profili",
    schoolType: nextState.schoolType,
    state: nextState,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function inferSkillProfileName(stateValue = {}) {
  const schoolName = stateValue.schoolRecords?.[0]?.name || stateValue.school?.name;
  return schoolName && schoolName !== "Okul bilgisi girilmedi" ? schoolName : "Varsayılan İME Profili";
}

function normalizeSkillProfileStore(store = {}) {
  const profiles = Array.isArray(store.profiles) ? store.profiles : [];
  const nextProfiles = profiles.map((profile, index) => {
    const stateValue = normalizeSkillStateShape(profile.state || {});
    const schoolType = normalizeSkillSchoolType(profile.schoolType || stateValue.schoolType);
    stateValue.schoolType = schoolType;
    return {
      id: profile.id || `ime-profile-${index + 1}`,
      name: String(profile.name || inferSkillProfileName(stateValue)).trim() || `İME Profili ${index + 1}`,
      schoolType,
      state: stateValue,
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: profile.updatedAt || new Date().toISOString()
    };
  });
  if (!nextProfiles.length) {
    nextProfiles.push(createSkillProfile("Varsayılan Mesem Profili", "mesem", structuredClone(initialSkillState)));
  }
  const activeProfileId = nextProfiles.some((profile) => profile.id === store.activeProfileId)
    ? store.activeProfileId
    : nextProfiles[0].id;
  return { activeProfileId, profiles: nextProfiles };
}

function loadSkillProfileStore() {
  try {
    const scopedKey = getSkillProfilesStorageKey();
    let savedProfiles = localStorage.getItem(scopedKey);
    let store = savedProfiles ? normalizeSkillProfileStore(JSON.parse(savedProfiles)) : null;

    // Helper to check if a store is empty
    const isStoreEmpty = (s) => {
      if (!s || !s.profiles || s.profiles.length === 0) return true;
      if (s.profiles.length > 1) return false;
      const p = s.profiles[0];
      const state = p.state || {};
      const hasSchools = state.schoolRecords && state.schoolRecords.length > 0;
      const hasTeachers = state.teacherPool && state.teacherPool.length > 0;
      const hasStudents = state.students && state.students.length > 0;
      const hasBusinesses = state.businesses && state.businesses.length > 0;
      return !hasSchools && !hasTeachers && !hasStudents && !hasBusinesses;
    };

    // If the active store is missing (never saved for this user), try to migrate from any non-empty profile store in localStorage
    if (!savedProfiles && isStoreEmpty(store)) {
      const prefix = `${SKILL_PROFILES_KEY}:`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix) && key !== scopedKey) {
          try {
            const candidateRaw = localStorage.getItem(key);
            if (candidateRaw) {
              const candidate = normalizeSkillProfileStore(JSON.parse(candidateRaw));
              if (!isStoreEmpty(candidate)) {
                store = candidate;
                // Save it to the current user's scoped key immediately
                localStorage.setItem(scopedKey, JSON.stringify(store));
                break;
              }
            }
          } catch (e) {}
        }
      }
    }

    if (store) return store;

    const shouldMigrateLegacy = !hasAnyScopedSkillProfileStore();
    const legacyProfiles = shouldMigrateLegacy ? localStorage.getItem(SKILL_PROFILES_KEY) : "";
    if (legacyProfiles) return normalizeSkillProfileStore(JSON.parse(legacyProfiles));
    const legacy = shouldMigrateLegacy ? localStorage.getItem(SKILL_STORAGE_KEY) : "";
    const legacyState = legacy
      ? normalizeSkillStateShape(JSON.parse(legacy))
      : (shouldMigrateLegacy ? normalizeSkillStateShape(initialSkillState) : createBlankSkillState("mesem"));
    const profile = createSkillProfile(inferSkillProfileName(legacyState), legacyState.schoolType || "mesem", legacyState);
    const newStore = normalizeSkillProfileStore({ activeProfileId: profile.id, profiles: [profile] });
    localStorage.setItem(scopedKey, JSON.stringify(newStore));
    return newStore;
  } catch (error) {
    console.warn("İME profil verisi okunamadı, varsayılan profil açıldı.", error);
    return normalizeSkillProfileStore();
  }
}

function getActiveSkillProfile() {
  if (!skillProfileStore?.profiles?.length) {
    skillProfileStore = normalizeSkillProfileStore();
  }
  return skillProfileStore.profiles.find((profile) => profile.id === skillProfileStore.activeProfileId) || skillProfileStore.profiles[0];
}

function getActiveSkillProfileState() {
  const profile = getActiveSkillProfile();
  profile.state = normalizeSkillStateShape(profile.state);
  profile.state.schoolType = normalizeSkillSchoolType(profile.schoolType);
  return profile.state;
}

function saveSkillProfileStore() {
  const activeProfile = getActiveSkillProfile();
  if (activeProfile && skillState) {
    activeProfile.state = skillState;
    activeProfile.updatedAt = new Date().toISOString();
  }
  const scopedKey = getSkillProfilesStorageKey();
  localStorage.setItem(scopedKey, JSON.stringify(skillProfileStore));
  if (localSession?.id) {
    const prefix = `${SKILL_PROFILES_KEY}:`;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k !== scopedKey && (k === SKILL_PROFILES_KEY || k === SKILL_STORAGE_KEY || k.startsWith(prefix))) {
        localStorage.removeItem(k);
      }
    }
  }
  scheduleAutoBackupSnapshot("skill-profile-change");
}

function saveSkillState() {
  saveSkillProfileStore();
  if (typeof scheduleCloudSave === "function") scheduleCloudSave();
}

function ensureSkillCollections() {
  if (!skillState) {
    skillState = getActiveSkillProfileState() || {};
  }
  if (!Array.isArray(skillState.schoolRecords)) skillState.schoolRecords = [];
  if (!Array.isArray(skillState.teacherPool)) skillState.teacherPool = [];
  if (!Array.isArray(skillState.fields)) skillState.fields = [];
  if (!Array.isArray(skillState.businesses)) skillState.businesses = [];
  if (!Array.isArray(skillState.students)) skillState.students = [];
  if (!Array.isArray(skillState.coordinators)) skillState.coordinators = [];
  if (!Array.isArray(skillState.holidays)) skillState.holidays = [];
  if (!skillState.wageManualAbsences || Array.isArray(skillState.wageManualAbsences)) skillState.wageManualAbsences = {};
  if (!skillState.absenceRecords || Array.isArray(skillState.absenceRecords)) skillState.absenceRecords = {};
  if (!Array.isArray(skillState.reports)) skillState.reports = [];
  if (deduplicateSkillBusinesses(skillState)) {
    saveSkillState();
  }
  if (Array.isArray(skillState.holidays) && skillState.holidays.some((h) => String(h.startDate || "").startsWith("2026-"))) {
    const hasNovBreak2026 = skillState.holidays.some((h) => h.startDate === "2026-11-16" || (h.name || "").includes("1. dönem ara"));
    if (!hasNovBreak2026) {
      skillState.holidays.push({
        id: uid("hol"),
        startDate: "2026-11-16",
        endDate: "2026-11-20",
        startPart: "full",
        endPart: "full",
        name: "MEB 1. dönem ara tatili",
        isSchoolBreak: true
      });
      skillState.holidays = sortSkillHolidays(skillState.holidays);
      saveSkillState();
    }
  }
}


function loadLocalSession() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function loadLocalUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLocaleLowerCase("tr-TR");
}

function userInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "K";
  return parts.slice(0, 2).map((part) => part[0]?.toLocaleUpperCase("tr-TR")).join("");
}

function saveLocalSession(session) {
  const previousUserId = localSession?.id || "";
  localSession = session;
  if (session) {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }
  if (localSession && (localSession.id || "") !== previousUserId) {
    skillProfileStore = loadSkillProfileStore();
    skillState = getActiveSkillProfileState();
    saveSkillProfileStore();
  }
  renderAccessShell();
}

function ensureLocalSessionUser() {
  if (!localSession?.name || localSession.id) return;
  const email = normalizeEmail(localSession.email || `yerel-${Date.now()}@sorubank.local`);
  const users = loadLocalUsers();
  let user = users.find((item) => normalizeEmail(item.email) === email);
  if (!user) {
    user = {
      id: uid("user"),
      name: localSession.name,
      email,
      password: "",
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveLocalUsers(users);
  }
  localSession = {
    ...localSession,
    id: user.id,
    email: user.email
  };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localSession));
  skillProfileStore = loadSkillProfileStore();
  skillState = getActiveSkillProfileState();
  saveSkillProfileStore();
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  els.showRegisterBtn.classList.toggle("is-active", isRegister);
  els.showLoginBtn.classList.toggle("is-active", !isRegister);
  els.localRegisterForm.hidden = !isRegister;
  els.localLoginForm.hidden = isRegister;
}

function renderAccessShell() {
  ensureLocalSessionUser();
  const hasUser = Boolean(localSession?.name);
  const activeModule = localSession?.activeModule || "";
  const showApp = hasUser && activeModule === "sorubank";
  const showSkill = hasUser && activeModule === "skill-training";
  const showStudent = hasUser && activeModule === "student-tracking";
  const showAnnualPlan = hasUser && activeModule === "annual-plan";
  const showCourse = hasUser && activeModule === "course-tracking";
  const showGlobalSettings = hasUser && activeModule === "settings";
  const showAdmin = hasUser && activeModule === "system-admin";
  const showModules = hasUser && !showApp && !showSkill && !showStudent && !showAnnualPlan && !showCourse && !showGlobalSettings && !showAdmin;

  // Tarayıcı sekme başlığını (title) dinamik olarak güncelle
  if (showApp) {
    document.title = "OTS - Soru Bankası";
  } else if (showSkill) {
    document.title = "OTS - Beceri Eğitimi";
  } else if (showStudent) {
    document.title = "OTS - Ders Takibi";
  } else if (showAnnualPlan) {
    document.title = "OTS - Yıllık Plan";
  } else if (showCourse) {
    document.title = "OTS - Kurs Takibi";
  } else if (showGlobalSettings) {
    document.title = "OTS - Ayarlar";
  } else if (showAdmin) {
    document.title = "OTS - Yönetim Paneli";
  } else {
    document.title = "Okul Takip Sistemi";
  }

  document.body.classList.toggle("auth-mode", !hasUser);
  document.body.classList.toggle("module-mode", showModules);
  document.body.classList.toggle("app-mode", showApp);
  document.body.classList.toggle("skill-mode", showSkill);
  document.body.classList.toggle("student-mode", showStudent);
  document.body.classList.toggle("annual-mode", showAnnualPlan);
  document.body.classList.toggle("course-mode", showCourse);
  document.body.classList.toggle("global-settings-mode", showGlobalSettings);
  document.body.classList.toggle("admin-mode", showAdmin);
  if (!showApp) document.body.classList.remove("settings-mode");
  if (els.authShell) els.authShell.hidden = showAdmin || (hasUser && !showModules);
  if (els.loginPanel) els.loginPanel.hidden = hasUser;
  if (els.moduleHub) els.moduleHub.hidden = !showModules;
  if (els.globalSettingsShell) els.globalSettingsShell.hidden = !showGlobalSettings;
  if (els.systemAdminShell) els.systemAdminShell.hidden = !showAdmin;
  const sorubankModule = getAppModule("sorubank");
  const skillModule = getAppModule("skill-training");
  const studentModule = getAppModule("student-tracking");
  const annualModule = getAppModule("annual-plan");
  const courseModule = getAppModule("course-tracking");
  const adminModule = getAppModule("system-admin");
  const sorubankShell = sorubankModule?.shell || document.querySelector(".app-shell");
  if (sorubankShell) sorubankShell.hidden = !showApp;
  const skillShell = skillModule?.shell || els.skillShell;
  if (skillShell) skillShell.hidden = !showSkill;
  if (studentModule?.shell) studentModule.shell.hidden = !showStudent;
  if (annualModule?.shell) annualModule.shell.hidden = !showAnnualPlan;
  if (courseModule?.shell) courseModule.shell.hidden = !showCourse;
  if (els.localUserPasswordInput) els.localUserPasswordInput.value = "";
  if (els.registerPasswordInput) els.registerPasswordInput.value = "";
  renderUserCards();
  if (showSkill) (skillModule?.render || renderSkillModule)();
  if (showStudent) studentModule?.render();
  if (showAnnualPlan) annualModule?.render();
  if (showCourse) courseModule?.render();
  if (showGlobalSettings) renderGlobalSettings();
  if (showAdmin) adminModule?.render(localSession);
  updateFloatingModuleSwitcher();
}

function renderUserCards() {
  const name = localSession?.name || "Kullanıcı";
  const initials = userInitials(name);
  [els.moduleUserName].forEach((element) => {
    if (element) element.textContent = name;
  });
  [els.moduleUserAvatar, els.profileAvatar].forEach((element) => {
    if (element) element.textContent = initials;
  });
  (getAppModule("skill-training")?.renderProfileButton || renderSkillProfileButton)();
}

function setDesktopSidebarCollapsed(collapsed, { persist = true } = {}) {
  const isCollapsed = Boolean(collapsed);
  document.body.classList.toggle("sidebar-collapsed", isCollapsed);
  if (els.desktopSidebarCollapseBtn) {
    els.desktopSidebarCollapseBtn.setAttribute("aria-expanded", String(!isCollapsed));
    els.desktopSidebarCollapseBtn.setAttribute("aria-label", isCollapsed ? "Sol paneli aç" : "Sol paneli daralt");
    els.desktopSidebarCollapseBtn.title = isCollapsed ? "Sol paneli aç" : "Sol paneli daralt";
  }
  if (persist) {
    try {
      localStorage.setItem(DESKTOP_SIDEBAR_COLLAPSED_KEY, isCollapsed ? "1" : "0");
    } catch (error) {
      console.warn("Sol panel tercihi kaydedilemedi:", error);
    }
  }
}

function toggleDesktopSidebar() {
  setDesktopSidebarCollapsed(!document.body.classList.contains("sidebar-collapsed"));
}

function closeDesktopModuleDockAfterSelection(button) {
  if (!els.desktopModuleDock || !window.matchMedia("(min-width: 901px)").matches) return;
  els.desktopModuleDock.classList.add("is-selection-closing");
  if (button instanceof HTMLElement) button.blur();
}

function initializeDesktopSidebar() {
  let isCollapsed = false;
  try {
    isCollapsed = localStorage.getItem(DESKTOP_SIDEBAR_COLLAPSED_KEY) === "1";
  } catch (error) {
    console.warn("Sol panel tercihi okunamadı:", error);
  }
  setDesktopSidebarCollapsed(isCollapsed, { persist: false });
}

function closeMobileNavigationPanels() {
  const panel = document.getElementById("mobileNavPanel");
  const sidebar = document.querySelector("aside.sidebar");
  const navigationFab = document.getElementById("mobileNavFab");
  const sidebarToggle = document.getElementById("sidebarToggleBtn");
  if (panel) panel.hidden = true;
  sidebar?.classList.remove("is-expanded");
  navigationFab?.setAttribute("aria-expanded", "false");
  sidebarToggle?.setAttribute("aria-expanded", "false");
}

function closeFloatingModuleSwitcher({ restoreFocus = false } = {}) {
  if (!els.moduleFloatPanel) return;
  els.moduleFloatPanel.hidden = true;
  els.moduleSwitcherBackdrop?.setAttribute("hidden", "");
  els.moduleSwitcherTriggers?.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
  document.body.classList.remove("module-switcher-open");
  if (restoreFocus && lastModuleSwitcherTrigger instanceof HTMLElement) {
    lastModuleSwitcherTrigger.focus();
  }
}

function toggleFloatingModuleSwitcher(trigger = null) {
  if (!els.moduleFloatPanel) return;
  const willOpen = els.moduleFloatPanel.hidden;
  if (!willOpen) {
    closeFloatingModuleSwitcher({ restoreFocus: true });
    return;
  }
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  if (isMobile) closeMobileNavigationPanels();
  lastModuleSwitcherTrigger = trigger instanceof HTMLElement ? trigger : document.activeElement;
  els.moduleFloatPanel.hidden = false;
  els.moduleFloatPanel.setAttribute("aria-modal", isMobile ? "true" : "false");
  if (isMobile) {
    els.moduleSwitcherBackdrop?.removeAttribute("hidden");
    document.body.classList.add("module-switcher-open");
  }
  els.moduleSwitcherTriggers?.forEach((item) => item.setAttribute("aria-expanded", "true"));
  requestAnimationFrame(() => {
    const activeButton = els.moduleFloatPanel.querySelector("[data-floating-module].is-active");
    (activeButton || els.moduleFloatPanel.querySelector("[data-floating-module]"))?.focus();
  });
}

function updateFloatingModuleSwitcher() {
  const activeModule = localSession?.activeModule || "";
  const activeLabel = MODULE_SWITCHER_LABELS[activeModule] || "Modül seç";
  if (els.moduleSwitcherCurrentLabel) els.moduleSwitcherCurrentLabel.textContent = activeLabel;
  els.moduleFloatButtons?.forEach((button) => {
    const key = button.dataset.floatingModule || "";
    const isActive = key === (activeModule || "hub");
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
  els.desktopModuleDockButtons?.forEach((button) => {
    const key = button.dataset.dockModule || "";
    const isActive = key === (activeModule || "hub");
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
  closeFloatingModuleSwitcher();
}

function handleFloatingModuleChoice(moduleKey) {
  closeFloatingModuleSwitcher();
  closeMobileNavigationPanels();
  if (moduleKey === "hub") {
    returnToModuleHub();
    return;
  }
  openModule(moduleKey);
}

function renderGlobalSettings() {
  getAppModule("settings")?.render(localSession, {
    renderCloudStatus,
    updateBackupSnapshotStatus
  });
}

function renderSkillProfileButton() {
  if (!els.skillImeProfileBtn) return;
  const profile = getActiveSkillProfile();
  const label = getSkillSchoolTypeLabel(profile.schoolType);
  els.skillImeProfileBtn.textContent = profile.name || label;
  els.skillImeProfileBtn.title = `${profile.name || "İME Profili"} · ${label}`;
}

async function handleLocalRegister(event) {
  event.preventDefault();
  const name = els.registerNameInput.value.trim();
  const email = normalizeEmail(els.registerEmailInput.value);
  const password = els.registerPasswordInput.value;
  if (!name || !email || password.length < 4) {
    showToast("Ad soyad, geçerli e-posta ve en az 4 karakter şifre girin.", "warning");
    return;
  }

  let landingModule = "";
  try {
    const globalSettings = JSON.parse(localStorage.getItem("sorubank:global-settings:v1") || "{}");
    landingModule = globalSettings.landingModule || "";
  } catch (e) {}

  // 1. Bulut (Supabase) yapılandırılmışsa önce Supabase ile kaydet
  if (cloudState.client) {
    try {
      clearLocalUserData();
      const { data, error } = await cloudState.client.auth.signUp({
        email,
        password,
        options: {
          data: { name: name }
        }
      });
      if (error) throw error;

      if (data?.user) {
        // Yerel kullanıcı listesinde yoksa kaydet (offline destek için)
        const users = loadLocalUsers();
        const newUser = {
          id: data.user.id || uid("user"),
          name,
          email,
          password,
          createdAt: new Date().toISOString()
        };
        if (!users.some((u) => normalizeEmail(u.email) === email)) {
          users.push(newUser);
          saveLocalUsers(users);
        }

        if (data.session) {
          cloudState.session = data.session;
          renderCloudStatus();
          saveLocalSession({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            activeModule: landingModule,
            createdAt: new Date().toISOString()
          });
          showToast("Hesap oluşturuldu ve giriş yapıldı.");
          await syncUserToServer({ id: newUser.id, name: newUser.name, email: newUser.email, role: "teacher" });
          await pushCloudState();
        } else {
          showToast("Hesap oluşturuldu. Supabase e-posta onayı açıksa gelen kutusunu kontrol edin.", "info", "Kayıt Yapıldı");
          // E-posta onayı gerekiyorsa yerel olarak yine de giriş yaptıralım ki offline başlayabilsinler
          saveLocalSession({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            activeModule: landingModule,
            createdAt: new Date().toISOString()
          });
          await syncUserToServer({ id: newUser.id, name: newUser.name, email: newUser.email, role: "teacher" });
        }
        return;
      }
    } catch (err) {
      console.warn("Supabase registration failed:", err.message);
      showToast(`Kayıt başarısız: ${err.message}`, "error");
      return;
    }
  }

  // 2. Yerel Kayıt
  const users = loadLocalUsers();
  if (users.some((user) => normalizeEmail(user.email) === email)) {
    showToast("Bu e-posta ile kayıt zaten var. Giriş yapabilirsiniz.", "warning");
    setAuthMode("login");
    els.localUserEmailInput.value = email;
    return;
  }
  clearLocalUserData();
  const newUser = {
    id: uid("user"),
    name,
    email,
    password,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveLocalUsers(users);
  saveLocalSession({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    activeModule: landingModule,
    createdAt: new Date().toISOString()
  });
  showToast("Hesabınız oluşturuldu ve giriş yapıldı.");
  await syncUserToServer({ id: newUser.id, name: newUser.name, email: newUser.email, role: "teacher" });
}

async function handleLocalLogin(event) {
  event.preventDefault();
  const email = normalizeEmail(els.localUserEmailInput.value);
  const password = els.localUserPasswordInput.value;

  let landingModule = "";
  try {
    const globalSettings = JSON.parse(localStorage.getItem("sorubank:global-settings:v1") || "{}");
    landingModule = globalSettings.landingModule || "";
  } catch (e) {}

  // 1. Bulut (Supabase) yapılandırılmışsa önce buluttan giriş yapmayı dene
  if (cloudState.client) {
    try {
      clearLocalUserData();
      const { data, error } = await cloudState.client.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data?.session) {
        cloudState.session = data.session;
        renderCloudStatus();

        // Yerel kullanıcı listesinde yoksa kaydet (offline destek için)
        const users = loadLocalUsers();
        const name = data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || email.split("@")[0];
        if (!users.some((u) => normalizeEmail(u.email) === email)) {
          users.push({
            id: data.session.user.id,
            name,
            email,
            password,
            createdAt: new Date().toISOString()
          });
          saveLocalUsers(users);
        }

        saveLocalSession({
          id: data.session.user.id,
          name,
          email,
          activeModule: landingModule,
          createdAt: new Date().toISOString()
        });

        await syncUserToServer({ id: data.session.user.id, name, email, role: "teacher" });
        showToast("Giriş yapıldı, bulut verileri eşitleniyor...");
        await syncCloudNow();
        return;
      }
    } catch (err) {
      console.warn("Supabase auth failed:", err.message);
      showToast(`Giriş başarısız: ${err.message}`, "error");
      return;
    }
  }

  // 2. Yerel kontrol (Supabase yoksa veya bulut girişi başarısız olursa yerel veritabanına bak)
  const user = loadLocalUsers().find((item) => normalizeEmail(item.email) === email && item.password === password);
  if (!user) {
    showToast("E-posta veya şifre hatalı.", "error", "Giriş yapılamadı");
    return;
  }

  if (user.isActive === false) {
    showToast("Hesabınız sistem yöneticisi tarafından dondurulmuştur.", "error", "Hesap Askıya Alındı");
    if (els.accountSuspendedOverlay) els.accountSuspendedOverlay.hidden = false;
    return;
  }

  clearLocalUserData();

  saveLocalSession({
    id: user.id,
    name: user.name,
    email: user.email,
    activeModule: landingModule,
    createdAt: new Date().toISOString()
  });

  await syncUserToServer({ id: user.id, name: user.name, email: user.email, role: user.role || "teacher" });
  syncSystemPermissions();
}

function openModule(moduleKey) {
  if (!localSession) return;
  if (!["sorubank", "skill-training", "student-tracking", "annual-plan", "course-tracking", "settings", "system-admin"].includes(moduleKey)) {
    showToast("Bu modül sonraki aşamada bu yapıya bağlanacak.", "warning", "Hazırlanıyor");
    return;
  }

  // Hesap askıya alınma kontrolü
  const userAccount = getCurrentUserAccount();
  if (userAccount && userAccount.isActive === false) {
    if (els.accountSuspendedOverlay) els.accountSuspendedOverlay.hidden = false;
    showToast("Hesabınız sistem yöneticisi tarafından askıya alınmıştır.", "error", "Erişim Engellendi");
    return;
  }

  const isAdmin = Boolean(sessionStorage.getItem("ots:admin-token-pass"));
  const globalConfig = window.OTS_PUBLIC_CONFIG;

  // Modül kısıtlama kontrolleri (Yönetim Paneli ve Ayarlar hariç)
  if (moduleKey !== "system-admin" && moduleKey !== "settings") {
    // 1. Genel Sistem Bakım Modu
    if (!isAdmin && globalConfig?.maintenanceMode) {
      showToast(globalConfig.maintenanceMessage || "Sistem bakım modundadır. Modüllere erişim geçici olarak durdurulmuştur.", "warning", "Sistem Bakımda");
      return;
    }

    // 2. Genel Modül Devre Dışı Bırakılması
    if (!isAdmin && globalConfig?.globalModules?.[moduleKey]?.enabled === false) {
      const moduleName = globalConfig.globalModules[moduleKey]?.name || MODULE_SWITCHER_LABELS[moduleKey] || moduleKey;
      showToast(`${moduleName} modülü geçici olarak kullanıma kapatılmıştır.`, "warning", "Modül Devre Dışı");
      return;
    }

    // 3. Kullanıcıya Özel Modül Yetkisi Kontrolü
    if (!isAdmin && userAccount && Array.isArray(userAccount.allowedModules)) {
      if (!userAccount.allowedModules.includes(moduleKey)) {
        const moduleName = MODULE_SWITCHER_LABELS[moduleKey] || moduleKey;
        showToast(`${moduleName} modülüne erişim yetkiniz bulunmuyor. Sistem yöneticisi ile görüşünüz.`, "error", "Yetki Yetersiz");
        return;
      }
    }
  }

  saveLocalSession({
    ...localSession,
    activeModule: moduleKey,
    lastModuleAt: new Date().toISOString()
  });
  if (moduleKey === "sorubank") (getAppModule("sorubank")?.setView || setView)("bank");
  if (moduleKey === "skill-training") {
    const skillModule = getAppModule("skill-training");
    const activeView = skillModule?.state?.activeView || skillState.activeView || "dashboard";
    (skillModule?.setView || setSkillView)(activeView);
  }
  if (moduleKey === "student-tracking") {
    const module = getAppModule("student-tracking");
    module?.setView(module.state?.activeView || "dashboard");
  }
  if (moduleKey === "annual-plan") {
    const module = getAppModule("annual-plan");
    module?.setView(module.state?.activeView || "wizard");
  }
  if (moduleKey === "course-tracking") {
    const module = getAppModule("course-tracking");
    module?.setView(module.state?.activeView || "tracking");
  }
  if (moduleKey === "settings") renderGlobalSettings();
  if (moduleKey === "system-admin") {
    const adminModule = getAppModule("system-admin");
    adminModule?.render(localSession);
  }
}

function returnToModuleHub() {
  if (!localSession) return;
  saveLocalSession({ ...localSession, activeModule: "" });
}

function clearLocalUserData() {
  const allKeys = backupKeysForModules(Object.keys(BACKUP_MODULES));
  allKeys.forEach((key) => {
    if (key !== LOCAL_USERS_KEY && key !== CLOUD_CONFIG_KEY && key !== LOCAL_SESSION_KEY) {
      localStorage.removeItem(key);
    }
  });
  localStorage.removeItem("sorubank:global-settings:v1");
  localStorage.removeItem("sorubank:cloud-last-sync");
}

function logoutLocalSession() {
  clearLocalUserData();
  if (cloudState.client) {
    cloudState.client.auth.signOut().catch(() => {});
  }
  cloudState.session = null;
  saveLocalSession(null);
  window.location.href = window.location.pathname;
}

function closeUserMenus() {
  [els.moduleUserMenu].forEach((menu) => {
    if (menu) menu.hidden = true;
  });
}

function toggleUserMenu(menu) {
  if (!menu) return;
  const willOpen = menu.hidden;
  closeUserMenus();
  menu.hidden = !willOpen;
}

function handleProfileMenuAction(action) {
  closeUserMenus();
  if (action === "admin") {
    openModule("system-admin");
    return;
  }
  if (action === "settings") {
    openProfileDialog();
    return;
  }
  if (action === "logout") {
    logoutLocalSession();
  }
}

function getCurrentUserAccount() {
  if (!localSession?.email) return null;
  const email = normalizeEmail(localSession.email);
  const users = loadLocalUsers();
  return users.find((item) => normalizeEmail(item.email) === email) || null;
}

async function syncUserToServer(user) {
  const targetUser = user || localSession;
  if (!targetUser || (!targetUser.email && !targetUser.id)) return;
  try {
    const res = await fetch("/api/system/sync-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: targetUser.id || "",
        email: normalizeEmail(targetUser.email || ""),
        name: targetUser.name || (targetUser.email ? targetUser.email.split("@")[0] : "Kullanıcı"),
        role: targetUser.role || "teacher",
        allowedModules: targetUser.allowedModules
      })
    });
    if (res.ok) {
      await syncSystemPermissions();
    }
  } catch (err) {
    console.warn("syncUserToServer error:", err);
  }
}
window.syncUserToServer = syncUserToServer;

async function syncSystemPermissions() {
  try {
    const email = localSession?.email ? normalizeEmail(localSession.email) : "";
    const name = localSession?.name || "";
    const id = localSession?.id || "";
    const query = email ? `?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&id=${encodeURIComponent(id)}` : "";
    const res = await fetch(`/api/system/public-config${query}`);
    if (!res.ok) return;
    const config = await res.json();
    window.OTS_PUBLIC_CONFIG = config;

    // 1. Duyuru Çubuğu (Global Announcement Bar)
    if (config.announcement && config.announcement.active && config.announcement.message) {
      if (els.globalAnnouncementBar) {
        els.globalAnnouncementBar.hidden = false;
        els.globalAnnouncementBar.style.display = "flex";
        els.globalAnnouncementBar.setAttribute("data-announcement-type", config.announcement.type || "info");
      }
      if (els.globalAnnouncementText) {
        els.globalAnnouncementText.textContent = config.announcement.message;
      }
    } else {
      if (els.globalAnnouncementBar) {
        els.globalAnnouncementBar.hidden = true;
        els.globalAnnouncementBar.style.display = "none";
      }
    }

    // 2. Kullanıcı senkronizasyonu (System admin -> local users)
    if (config.user) {
      const users = loadLocalUsers();
      const userIndex = users.findIndex((u) => normalizeEmail(u.email) === normalizeEmail(config.user.email));
      if (userIndex >= 0) {
        users[userIndex] = {
          ...users[userIndex],
          isActive: config.user.isActive !== false,
          allowedModules: Array.isArray(config.user.allowedModules) ? config.user.allowedModules : users[userIndex].allowedModules,
          role: config.user.role || users[userIndex].role,
          credits: config.user.credits !== undefined ? config.user.credits : users[userIndex].credits
        };
        saveLocalUsers(users);
      }
    }

    // 3. Hesap askıya alınma kontrolü
    const currentUser = getCurrentUserAccount();
    if (currentUser && currentUser.isActive === false) {
      if (els.accountSuspendedOverlay) els.accountSuspendedOverlay.hidden = false;
      document.body.classList.add("is-account-suspended");
    } else {
      if (els.accountSuspendedOverlay) els.accountSuspendedOverlay.hidden = true;
      document.body.classList.remove("is-account-suspended");
    }

    // 4. Modül Hub Kartları rozetleri ve durumları
    const globalModules = config.globalModules || {};
    const allowedModules = currentUser?.allowedModules || ["sorubank", "student-tracking", "skill-training", "course-tracking", "annual-plan"];
    const isAdmin = Boolean(sessionStorage.getItem("ots:admin-token-pass"));

    const hubCards = document.querySelectorAll("#moduleHub .module-card[data-module]");
    hubCards.forEach((card) => {
      const modKey = card.dataset.module;
      if (!modKey || modKey === "system-admin" || modKey === "settings") return;
      const modConfig = globalModules[modKey];
      const isGloballyDisabled = modConfig && modConfig.enabled === false;
      const isPermitted = allowedModules.includes(modKey);

      let badge = card.querySelector(".module-access-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "module-access-badge";
        const header = card.querySelector(".module-card-header") || card;
        header.appendChild(badge);
      }

      if (config.maintenanceMode && !isAdmin) {
        card.classList.add("is-module-restricted");
        badge.textContent = "⚠️ Sistem Bakımda";
        badge.className = "module-access-badge badge-maintenance";
        badge.hidden = false;
      } else if (isGloballyDisabled && !isAdmin) {
        card.classList.add("is-module-restricted");
        badge.textContent = "🔴 Bakımda";
        badge.className = "module-access-badge badge-disabled";
        badge.hidden = false;
      } else if (!isPermitted && !isAdmin) {
        card.classList.add("is-module-restricted");
        badge.textContent = "🔒 Yetkisiz";
        badge.className = "module-access-badge badge-forbidden";
        badge.hidden = false;
      } else {
        card.classList.remove("is-module-restricted");
        badge.hidden = true;
      }
    });

    // 5. Yönetici Butonlarının Rol Tabanlı Gizlenmesi / Gösterilmesi
    const hasAdminToken = Boolean(sessionStorage.getItem("ots:admin-token-pass"));
    const isAdminUser = Boolean((currentUser && currentUser.role === "admin") || hasAdminToken);

    const adminElements = [
      document.querySelector("#hubAdminModuleCard"),
      document.querySelector("#profileMenuAdminBtn"),
      document.querySelector('[data-dock-module="system-admin"]'),
      document.querySelector('[data-floating-module="system-admin"]')
    ];

    adminElements.forEach((el) => {
      if (!el) return;
      if (isAdminUser) {
        el.removeAttribute("hidden");
        el.style.removeProperty("display");
        if (el.classList.contains("module-card")) {
          el.style.display = "flex";
        }
      } else {
        el.setAttribute("hidden", "");
        el.style.setProperty("display", "none", "important");
      }
    });

  } catch (err) {
    console.warn("syncSystemPermissions error:", err);
  }
}
window.syncSystemPermissions = syncSystemPermissions;
window.logoutLocalSession = logoutLocalSession;

// --- GİZLİ YÖNETİCİ ERİŞİM TETİKLEYİCİLERİ ---
// 1. Klavye Kısayolu: Ctrl + Shift + A veya Alt + Shift + A
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) ||
      (e.altKey && e.shiftKey && (e.key === "A" || e.key === "a"))) {
    e.preventDefault();
    openModule("system-admin");
  }
});

// 2. Gizli URL Kontrolü (?admin=gate veya #yonetim veya #admin)
function checkAdminSecretUrl() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (urlParams.get("admin") === "gate" || hash === "#yonetim" || hash === "#admin") {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      setTimeout(() => {
        openModule("system-admin");
      }, 250);
    }
  } catch (e) {}
}

// 3. Gizli Logo 5-Tıklama Easter Egg
let secretLogoClickCount = 0;
let secretLogoClickTimer = null;
function handleSecretLogoClick() {
  secretLogoClickCount++;
  clearTimeout(secretLogoClickTimer);
  secretLogoClickTimer = setTimeout(() => {
    secretLogoClickCount = 0;
  }, 2000);
  if (secretLogoClickCount >= 5) {
    secretLogoClickCount = 0;
    showToast("Gizli Yönetici Giriş Kapısı Açılıyor...", "info");
    openModule("system-admin");
  }
}
window.handleSecretLogoClick = handleSecretLogoClick;

function openProfileDialog() {
  if (!localSession) return;
  renderUserCards();
  els.profileNameInput.value = localSession.name || "";
  els.profileEmailInput.value = localSession.email || "";
  els.profileCurrentPasswordInput.value = "";
  els.profileNewPasswordInput.value = "";
  els.profileDialog.showModal();
}

function updateLocalProfile(event) {
  event.preventDefault();
  if (!localSession) return;
  const users = loadLocalUsers();
  const index = users.findIndex((user) => user.id === localSession.id);
  if (index < 0) {
    showToast("Yerel kullanıcı kaydı bulunamadı.", "error");
    return;
  }
  const name = els.profileNameInput.value.trim();
  const email = normalizeEmail(els.profileEmailInput.value);
  const currentPassword = els.profileCurrentPasswordInput.value;
  const newPassword = els.profileNewPasswordInput.value;
  if (!name || !email) {
    showToast("Ad soyad ve e-posta boş bırakılamaz.", "warning");
    return;
  }
  const emailUsed = users.some((user, userIndex) => userIndex !== index && normalizeEmail(user.email) === email);
  if (emailUsed) {
    showToast("Bu e-posta başka bir kullanıcıda kayıtlı.", "warning");
    return;
  }
  if (newPassword) {
    if (currentPassword !== users[index].password) {
      showToast("Şifre değiştirmek için mevcut şifre doğru olmalı.", "warning");
      return;
    }
    if (newPassword.length < 4) {
      showToast("Yeni şifre en az 4 karakter olmalı.", "warning");
      return;
    }
    users[index].password = newPassword;
  }
  users[index] = {
    ...users[index],
    name,
    email,
    updatedAt: new Date().toISOString()
  };
  saveLocalUsers(users);
  saveLocalSession({
    ...localSession,
    name,
    email
  });
  els.profileDialog.close();
  showToast("Profil bilgileri güncellendi.");
}

function renderSkillImeProfiles(selectedId = getActiveSkillProfile()?.id) {
  if (!els.skillImeProfileList) return;
  const activeProfile = getActiveSkillProfile();
  if (activeProfile && skillState) {
    activeProfile.state = skillState;
  }
  skillProfileStore = normalizeSkillProfileStore(skillProfileStore);
  skillState = getActiveSkillProfileState();
  const activeId = getActiveSkillProfile()?.id;
  els.skillImeProfileList.innerHTML = skillProfileStore.profiles.map((profile) => {
    const stateValue = normalizeSkillStateShape(profile.state);
    const businessCount = stateValue.businesses.length;
    const studentCount = stateValue.students.length;
    const typeLabel = getSkillSchoolTypeLabel(profile.schoolType);
    return `
      <button class="${profile.id === activeId ? "is-active" : ""}" type="button" data-skill-ime-profile="${escapeHtml(profile.id)}">
        <strong>${escapeHtml(profile.name)}</strong>
        <em>${escapeHtml(typeLabel)}</em>
        <small>${businessCount} işletme · ${studentCount} öğrenci</small>
      </button>
    `;
  }).join("");
  const selectedProfile = skillProfileStore.profiles.find((profile) => profile.id === selectedId) || getActiveSkillProfile();
  if (els.skillImeProfileId) els.skillImeProfileId.value = selectedProfile?.id || "";
  if (els.skillImeProfileName) els.skillImeProfileName.value = selectedProfile?.name || "";
  if (els.skillImeProfileType) els.skillImeProfileType.value = normalizeSkillSchoolType(selectedProfile?.schoolType);
  if (els.skillImeProfileAvatar) els.skillImeProfileAvatar.textContent = normalizeSkillSchoolType(selectedProfile?.schoolType) === "lise" ? "ML" : "ME";
}

function openSkillImeProfileDialog() {
  renderSkillImeProfiles();
  els.skillImeProfileDialog?.showModal();
}

function clearSkillImeProfileForm() {
  if (els.skillImeProfileId) els.skillImeProfileId.value = "";
  if (els.skillImeProfileName) els.skillImeProfileName.value = "";
  if (els.skillImeProfileType) els.skillImeProfileType.value = "mesem";
  if (els.skillImeProfileAvatar) els.skillImeProfileAvatar.textContent = "ME";
  els.skillImeProfileName?.focus();
}

function switchSkillImeProfile(profileId) {
  if (!skillProfileStore.profiles.some((profile) => profile.id === profileId)) return;
  saveSkillState();
  skillProfileStore.activeProfileId = profileId;
  skillState = getActiveSkillProfileState();
  saveSkillState();
  renderSkillModule();
  renderSkillImeProfiles(profileId);
}

function saveSkillImeProfile(event) {
  event.preventDefault();
  const id = els.skillImeProfileId?.value || "";
  const name = (els.skillImeProfileName?.value || "").trim();
  const schoolType = normalizeSkillSchoolType(els.skillImeProfileType?.value);
  if (!name) return showToast("İME profili için ad girin.", "warning");
  if (id) {
    const profile = skillProfileStore.profiles.find((item) => item.id === id);
    if (!profile) return;
    profile.name = name;
    profile.schoolType = schoolType;
    profile.state = normalizeSkillStateShape(profile.state);
    profile.state.schoolType = schoolType;
    profile.updatedAt = new Date().toISOString();
    if (profile.id === skillProfileStore.activeProfileId) {
      skillState.schoolType = schoolType;
      profile.state = skillState;
    }
    saveSkillState();
    renderSkillModule();
    renderSkillImeProfiles(id);
    showToast("İME profili güncellendi.");
    return;
  }
  saveSkillState();
  const profile = createSkillProfile(name, schoolType);
  skillProfileStore.profiles.push(profile);
  skillProfileStore.activeProfileId = profile.id;
  skillState = getActiveSkillProfileState();
  saveSkillState();
  renderSkillModule();
  renderSkillImeProfiles(profile.id);
  showToast("Yeni İME profili oluşturuldu.");
}

async function deleteSkillImeProfile() {
  const id = els.skillImeProfileId?.value || "";
  if (!id) return showToast("Silmek için profil seçin.", "warning");
  if (skillProfileStore.profiles.length <= 1) return showToast("Son İME profili silinemez.", "warning");
  const profile = skillProfileStore.profiles.find((item) => item.id === id);
  if (!profile) return;
  const confirmed = await appConfirm(`${profile.name} profilini silmek istiyor musunuz? Bu profil altındaki okul, işletme ve öğrenci kayıtları da silinir.`, {
    title: "İME profilini sil",
    okText: "Sil",
    cancelText: "Vazgeç"
  });
  if (!confirmed) return;
  skillProfileStore.profiles = skillProfileStore.profiles.filter((item) => item.id !== id);
  if (skillProfileStore.activeProfileId === id) {
    skillProfileStore.activeProfileId = skillProfileStore.profiles[0].id;
    skillState = getActiveSkillProfileState();
  }
  saveSkillState();
  renderSkillModule();
  renderSkillImeProfiles();
  showToast("İME profili silindi.");
}

function normalizeState(nextState) {
  nextState = repairPersistedText(nextState);
  nextState.courses = Array.isArray(nextState.courses) && nextState.courses.length ? nextState.courses : structuredClone(initialState.courses);
  nextState.curriculumItems = mergeCurriculumItems(nextState.curriculumItems);
  nextState.questions = Array.isArray(nextState.questions) ? nextState.questions.map(normalizeQuestion) : [];
  nextState.selectedQuestionIds = Array.isArray(nextState.selectedQuestionIds) ? nextState.selectedQuestionIds : [];
  nextState.examBaskets = normalizeExamBaskets(nextState.examBaskets, nextState.selectedQuestionIds, nextState.questions);
  nextState.examAnswerSpaces = normalizeExamAnswerSpaces(nextState.examAnswerSpaces, nextState.examBaskets);
  nextState.selectedQuestionIds = flattenExamBaskets(nextState.examBaskets);
  nextState.archivedExams = Array.isArray(nextState.archivedExams) ? nextState.archivedExams.map(normalizeArchivedExam) : [];
  nextState.activeExamArchiveId = nextState.archivedExams.some((exam) => exam.id === nextState.activeExamArchiveId) ? nextState.activeExamArchiveId : "";
  nextState.examMeta = {
    ...structuredClone(initialState.examMeta),
    ...(nextState.examMeta || {})
  };
  nextState.examMeta.term = String(nextState.examMeta.term || parseLegacyExamTitle(nextState.examMeta.title).term || "1");
  nextState.examMeta.examNumber = String(nextState.examMeta.examNumber || parseLegacyExamTitle(nextState.examMeta.title).examNumber || "1");
  nextState.examMeta.date = nextState.examMeta.date || "";
  nextState.examMeta.pageTarget = ["auto", "one", "two"].includes(nextState.examMeta.pageTarget) ? nextState.examMeta.pageTarget : "auto";
  nextState.examMeta.columns = ["1", "2", "table"].includes(String(nextState.examMeta.columns)) ? String(nextState.examMeta.columns) : "1";
  nextState.examMeta.outputType = ["exam", "study"].includes(nextState.examMeta.outputType) ? nextState.examMeta.outputType : "exam";
  nextState.examMeta.answerKeyMode = ["answers", "questions"].includes(nextState.examMeta.answerKeyMode) ? nextState.examMeta.answerKeyMode : "answers";
  nextState.settings = {
    ...structuredClone(initialState.settings),
    ...(nextState.settings || {})
  };
  if (!Array.isArray(nextState.settings.teachers)) {
    nextState.settings.teachers = String(nextState.settings.teacherNames || "")
      .split(/[,\n]/)
      .map((teacher) => teacher.trim())
      .filter(Boolean);
  }
  delete nextState.settings.teacherNames;
  if (!nextState.courses.some((course) => course.id === nextState.selectedCourseId)) {
    nextState.selectedCourseId = nextState.courses[0].id;
  }
  nextState.selectedCurriculumTopic = nextState.selectedCurriculumTopic || "";
  return nextState;
}

function normalizeExamBaskets(baskets, legacyIds = [], questions = []) {
  const normalized = {};
  if (baskets && typeof baskets === "object") {
    Object.entries(baskets).forEach(([courseId, ids]) => {
      if (Array.isArray(ids)) normalized[courseId] = [...new Set(ids)];
    });
  }
  legacyIds.forEach((id) => {
    const question = questions.find((item) => item.id === id);
    if (!question?.courseId) return;
    normalized[question.courseId] = normalized[question.courseId] || [];
    if (!normalized[question.courseId].includes(id)) normalized[question.courseId].push(id);
  });
  return normalized;
}

function normalizeAnswerSpaceConfig(config = {}) {
  let mode = "auto";
  let expected = Number(config.expectedAnswerItems || 0);
  if (config.answerSpaceMode && config.answerSpaceMode !== "auto") {
    if (config.answerSpaceMode === "short") expected = expected || 2;
    else if (config.answerSpaceMode === "medium") expected = expected || 4;
    else if (config.answerSpaceMode === "large") expected = expected || 7;
    else if (config.answerSpaceMode === "custom") expected = expected || 4;
  }
  return {
    answerSpaceMode: mode,
    expectedAnswerItems: Number.isFinite(expected) ? Math.max(0, Math.min(30, Math.round(expected))) : 0
  };
}

function normalizeExamAnswerSpaces(spaces = {}, baskets = {}) {
  const normalized = {};
  if (!spaces || typeof spaces !== "object") return normalized;
  Object.entries(spaces).forEach(([courseId, courseSpaces]) => {
    if (!courseSpaces || typeof courseSpaces !== "object") return;
    const basketSet = new Set(Array.isArray(baskets?.[courseId]) ? baskets[courseId] : []);
    Object.entries(courseSpaces).forEach(([questionId, config]) => {
      if (basketSet.size && !basketSet.has(questionId)) return;
      normalized[courseId] = normalized[courseId] || {};
      normalized[courseId][questionId] = normalizeAnswerSpaceConfig(config);
    });
  });
  return normalized;
}

function flattenExamBaskets(baskets = {}) {
  return [...new Set(Object.values(baskets).flatMap((ids) => Array.isArray(ids) ? ids : []))];
}

function normalizeArchivedExam(exam) {
  const meta = {
    ...structuredClone(initialState.examMeta),
    ...(exam.meta || {})
  };
  meta.term = String(meta.term || "1");
  meta.examNumber = String(meta.examNumber || "1");
  meta.date = meta.date || "";
  meta.pageTarget = ["auto", "one", "two"].includes(meta.pageTarget) ? meta.pageTarget : "auto";
  meta.columns = ["1", "2", "table"].includes(String(meta.columns)) ? String(meta.columns) : "1";
  return {
    id: exam.id || uid("exam"),
    courseId: exam.courseId || "",
    title: String(exam.title || "Kaydedilen sınav"),
    meta,
    questionIds: Array.isArray(exam.questionIds) ? exam.questionIds : [],
    questionPoints: exam.questionPoints && typeof exam.questionPoints === "object" ? exam.questionPoints : {},
    answerSpaces: exam.answerSpaces && typeof exam.answerSpaces === "object" ? exam.answerSpaces : {},
    createdAt: exam.createdAt || new Date().toISOString(),
    updatedAt: exam.updatedAt || exam.createdAt || new Date().toISOString()
  };
}

function mergeCurriculumItems(items = []) {
  const allItems = Array.isArray(items) ? items : [];
  const merged = [];
  const indexByKey = new Map();

  allItems.forEach((item) => {
    if (!item.courseName || !item.topic || !item.outcome) return;
    const key = curriculumIdentityKey(item);
    const existingIndex = indexByKey.get(key);
    if (existingIndex === undefined) {
      indexByKey.set(key, merged.length);
      merged.push(item);
      return;
    }
    if (curriculumItemScore(item) > curriculumItemScore(merged[existingIndex])) {
      merged[existingIndex] = item;
    }
  });

  const numberedUnitKeys = new Set(
    merged
      .filter((item) => hasCurriculumNumber(item.unit || item.topic))
      .map(curriculumUnitKey)
  );

  return merged.filter((item) => (
    hasCurriculumNumber(item.unit || item.topic) || !numberedUnitKeys.has(curriculumUnitKey(item))
  ));
}

function curriculumIdentityKey(item) {
  return [
    normalizeText(item.courseName),
    normalizeCurriculumText(item.unit || item.topic),
    normalizeCurriculumText(item.outcome)
  ].join("|");
}

function curriculumUnitKey(item) {
  return [
    normalizeText(item.courseName),
    normalizeCurriculumText(item.unit || item.topic)
  ].join("|");
}

function courseNameMatches(itemCourseName, courseName) {
  const itemKey = normalizeText(itemCourseName);
  const courseKey = normalizeText(courseName);
  return itemKey === courseKey || itemKey.includes(courseKey) || courseKey.includes(itemKey);
}

function normalizeCurriculumText(value) {
  return normalizeText(value).replace(/^\d+\s+/, "");
}

function hasCurriculumNumber(value) {
  return /^\s*\d+\./.test(String(value || ""));
}

function curriculumItemScore(item) {
  return [item.unit, item.topic, item.outcome].reduce((score, value) => (
    score + (hasCurriculumNumber(value) ? 1 : 0)
  ), 0);
}

function parseLegacyExamTitle(title = "") {
  const term = title.match(/([12])\.\s*dönem/i)?.[1];
  const examNumber = title.match(/([123])\.\s*yaz/i)?.[1];
  return { term, examNumber };
}

function normalizeQuestion(question) {
  const type = question.type && questionTypes[question.type] ? question.type : "open";
  const choices = Array.isArray(question.choices) && question.choices.length
    ? question.choices
    : choiceLabels.slice(0, 4).map((label) => ({ id: label, label, text: "" }));
  const points = normalizeImportedPoint(question.points);
  return {
    ...question,
    type,
    points,
    choices,
    correctChoiceId: question.correctChoiceId || choices[0]?.id || "A",
    correctBoolean: typeof question.correctBoolean === "boolean" ? question.correctBoolean : true,
    acceptedAnswers: Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [],
    examTerm: question.examTerm ? String(question.examTerm) : "",
    examNumber: question.examNumber ? String(question.examNumber) : ""
  };
}

function normalizeImportedPoint(value) {
  const points = Number(value);
  if (!Number.isFinite(points) || points < 1 || points > 100) return 10;
  return Math.round(points);
}

function saveState(options = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleAutoBackupSnapshot("sorubank-change");
  if (options.sync !== false) scheduleCloudSave();
}

function normalizeCloudConfig(config = {}) {
  return {
    url: String(config.url || config.supabaseUrl || "").trim(),
    anonKey: String(config.anonKey || config.supabaseAnonKey || "").trim()
  };
}

function storedCloudConfig() {
  try {
    return normalizeCloudConfig(JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY) || "{}"));
  } catch {
    return normalizeCloudConfig();
  }
}

function saveStoredCloudConfig(config) {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(normalizeCloudConfig(config)));
  scheduleAutoBackupSnapshot("settings-change");
}

async function loadCloudConfig() {
  const browserConfig = normalizeCloudConfig(window.SORUBANK_SUPABASE || {});
  if (browserConfig.url && browserConfig.anonKey) {
    return { ...browserConfig, source: "system" };
  }

  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (response.ok) {
      const serverConfig = normalizeCloudConfig(await response.json());
      if (serverConfig.url && serverConfig.anonKey) {
        return { ...serverConfig, source: "system" };
      }
    }
  } catch {
    // Local file usage or static hosting without an API endpoint should still work offline.
  }

  const manual = storedCloudConfig();
  return { ...manual, source: manual.url ? "manual" : "none" };
}

function renderCloudStatus() {
  if (!els.cloudStatusTitle) return;

  const isSystem = cloudState.configSource === "system";
  if (isSystem) {
    if (els.supabaseUrlInput) els.supabaseUrlInput.value = "";
    if (els.supabaseAnonKeyInput) els.supabaseAnonKeyInput.value = "";
  } else {
    const config = storedCloudConfig();
    if (els.supabaseUrlInput && !els.supabaseUrlInput.value) els.supabaseUrlInput.value = config.url;
    if (els.supabaseAnonKeyInput && !els.supabaseAnonKeyInput.value) els.supabaseAnonKeyInput.value = config.anonKey;
  }

  const config = storedCloudConfig();
  const email = cloudState.session?.user?.email || "";
  const configured = cloudState.enabled || (isSystem ? true : Boolean(config.url && config.anonKey));
  const connected = Boolean(cloudState.session);
  const busy = cloudState.syncing;
  let title = "Yerel kullanım";
  let text = "Supabase bağlantısı yapılınca verileriniz hesabınızla eşitlenir.";

  if (!configured) {
    title = "Supabase ayarı bekleniyor";
    text = "Project URL ve anon public key girilince giriş ve eşitleme açılır.";
  } else if (!cloudState.client) {
    title = "Bulut bağlantısı hazır değil";
    text = cloudState.lastError || "Supabase kütüphanesi yüklenemedi veya bağlantı ayarı eksik.";
  } else if (connected) {
    title = busy ? "Eşitleniyor" : "Buluta bağlı";
    text = busy
      ? "Okul Takip Sistemi verileri Supabase ile eşitleniyor."
      : `${email} hesabı ile bağlı${cloudState.lastSyncAt ? ` · Son eşitleme ${new Date(cloudState.lastSyncAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}` : ""}.`;
  } else {
    title = "Giriş bekleniyor";
    text = "Hesabınıza girince bu cihazdaki veriler ile bulut verileri eşitlenebilir.";
  }

  if (cloudState.lastError && configured && !busy) {
    text = cloudState.lastError;
  }

  els.cloudStatusTitle.textContent = title;
  els.cloudStatusText.textContent = text;
  const syncPanel = document.querySelector('[data-global-settings-panel="sync"]');
  if (syncPanel) {
    syncPanel.classList.toggle("cloud-connected", connected);
  }
  [els.signInBtn, els.signUpBtn].forEach((button) => {
    if (button) button.disabled = !cloudState.client || connected || busy;
  });
  if (els.signOutBtn) els.signOutBtn.disabled = !connected || busy;
  if (els.syncNowBtn) els.syncNowBtn.disabled = !connected || busy;
}

let isPushing = false;
let hasPendingPush = false;
let isSyncingFromCloud = false;
let isCloudInitialized = false;

function finalizeCloudInitialization() {
  isCloudInitialized = true;
  const hasLocalWrite = localStorage.getItem("sorubank:cloud-local-write");
  if (hasLocalWrite && cloudState.client && cloudState.session) {
    console.log("Pending local write detected after cloud init. Pushing to cloud...");
    scheduleCloudSave();
  }
  const loginPanel = document.getElementById("loginPanel");
  if (loginPanel) loginPanel.style.opacity = "1";
}

async function scheduleCloudSave() {
  // Buluttan veri indirilirken push yapma - race condition engeller
  if (isSyncingFromCloud) return;
  localStorage.setItem("sorubank:cloud-local-write", new Date().toISOString());
  if (!isCloudInitialized || !cloudState.client || !cloudState.session) return;

  if (isPushing) {
    hasPendingPush = true;
    return;
  }

  isPushing = true;
  while (true) {
    hasPendingPush = false;
    try {
      await pushCloudState({ silent: true, throwOnError: true });
    } catch (err) {
      console.error("Cloud save failed:", err);
      showToast("Değişiklikler buluta kaydedilemedi. İnternet bağlantınızı kontrol edin.", "error");
      isPushing = false;
      return;
    }
    if (!hasPendingPush) break;
  }
  isPushing = false;
}

function withTimeout(promise, ms = 6000) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Bağlantı zaman aşımına uğradı")), ms))
  ]);
}

function reloadAppState() {
  // localStorage'daki güncel verileri okuyarak tüm modülleri yeniden başlat
  try {
    // Soru Bankası state'ini yeniden yükle
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = normalizeState(JSON.parse(raw));
    }
    // Modülleri yeniden başlat ve yeni verileri localStorage'dan oku
    ["course-tracking", "student-tracking", "annual-plan"].forEach((moduleName) => getAppModule(moduleName)?.loadState?.());
    // Skill modülünü yeniden yükle
    if (typeof loadSkillProfileStore === "function") {
      skillProfileStore = loadSkillProfileStore();
      skillState = getActiveSkillProfileState();
    }
    if (typeof renderSkillModule === "function") renderSkillModule();
    // Render
    render();
    renderAccessShell();
    setView(state.currentView || "bank");
  } catch (e) {
    console.warn("reloadAppState failed:", e);
  }
}

async function checkAndSyncCloudBackground(options = {}) {
  if (!cloudState.client || !cloudState.session) return;

  const overlay = options.silent ? null : document.getElementById("cloudLoadingOverlay");
  if (overlay) overlay.removeAttribute("hidden");

  try {
    const userId = cloudState.session.user.id;
    const { data, error } = await withTimeout(
      cloudState.client
        .from("sorubank_cloud_states")
        .select("updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      6000
    );

    if (error) throw error;
    const localWriteAt = localStorage.getItem("sorubank:cloud-local-write") || "";
    if (!data) {
      if (localWriteAt) {
        await pushCloudState({ silent: true });
      }
      if (overlay) overlay.setAttribute("hidden", "true");
      return;
    }

    const remoteUpdatedAt = data.updated_at;
    const localLastSync = localStorage.getItem("sorubank:cloud-last-sync") || "";
    const remoteTime = remoteUpdatedAt ? Date.parse(remoteUpdatedAt) : 0;
    const localSyncTime = localLastSync ? Date.parse(localLastSync) : 0;
    const localWriteTime = localWriteAt ? Date.parse(localWriteAt) : 0;

    // Eğer yerelde buluta henüz gönderilmemiş daha yeni bir değişiklik varsa, buluttaki eski veriyi çekip yereli ezme; yereli buluta gönder!
    if (localWriteTime && (!remoteTime || localWriteTime >= remoteTime - 1000)) {
      console.log("Newer local write detected. Pushing local state to cloud instead of overwriting...");
      await pushCloudState({ silent: true });
      if (overlay) overlay.setAttribute("hidden", "true");
      return;
    }

    const isRemoteNewer = remoteUpdatedAt && (!localSyncTime || Math.abs(remoteTime - localSyncTime) > 1000) && remoteTime > localSyncTime;

    if (isRemoteNewer) {
      console.log("Newer remote state detected. Syncing background...");
      const { data: remoteStateData, error: readError } = await withTimeout(
        cloudState.client
          .from("sorubank_cloud_states")
          .select("state, updated_at")
          .eq("user_id", userId)
          .maybeSingle(),
        6000
      );
      
      if (readError) throw readError;
      if (remoteStateData?.state) {
        const isBackupPackage = remoteStateData.state.type === "sorubank-backup" && remoteStateData.state.storage;
        if (isBackupPackage) {
          isSyncingFromCloud = true;
          applyBackupPackage(remoteStateData.state, "replace");
          localStorage.setItem("sorubank:cloud-last-sync", remoteUpdatedAt);
          localStorage.removeItem("sorubank:cloud-local-write");
          cloudState.lastSyncAt = remoteUpdatedAt;
          renderCloudStatus();
          console.log("Background sync complete. Refreshing UI...");
          reloadAppState();
          isSyncingFromCloud = false;
        }
      }
    } else {
      if (remoteUpdatedAt && localLastSync !== remoteUpdatedAt) {
        localStorage.setItem("sorubank:cloud-last-sync", remoteUpdatedAt);
      }
      cloudState.lastSyncAt = remoteUpdatedAt || localLastSync;
      renderCloudStatus();
    }
    // Başarılı bittiğinde loading ekranını gizle
    if (overlay) overlay.setAttribute("hidden", "true");
  } catch (err) {
    console.warn("Background cloud sync check failed:", err.message);
    if (!options.silent) {
      const spinner = document.getElementById("cloudLoadingSpinner");
      const title = document.getElementById("cloudLoadingTitle");
      const desc = document.getElementById("cloudLoadingDesc");
      const errContainer = document.getElementById("cloudLoadingError");
      if (spinner) spinner.style.display = "none";
      if (title) title.textContent = "Bağlantı Hatası";
      if (desc) desc.textContent = "Bulut veritabanına bağlanılamadı.";
      if (errContainer) errContainer.style.display = "block";
      // Overlay'i gizlemiyoruz, kilitli kalıyor ve kullanıcı "Tekrar Dene" butonunu görüyor
    }
  }
}

async function initializeCloud() {
  const config = await loadCloudConfig();
  const isSystemConfig = config.source === "system";
  cloudState.configSource = config.source;

  if (isSystemConfig) {
    if (els.supabaseUrlInput) els.supabaseUrlInput.value = "";
    if (els.supabaseAnonKeyInput) els.supabaseAnonKeyInput.value = "";
  } else {
    if (els.supabaseUrlInput) els.supabaseUrlInput.value = config.url;
    if (els.supabaseAnonKeyInput) els.supabaseAnonKeyInput.value = config.anonKey;
  }

  const cloudConfigEl = document.querySelector(".cloud-config");
  if (cloudConfigEl) {
    cloudConfigEl.style.setProperty("display", isSystemConfig ? "none" : "", "important");
  }
  if (isSystemConfig) {
    const quickStartBtn = document.querySelector("#quickStartBtn");
    if (quickStartBtn) {
      quickStartBtn.style.setProperty("display", "none", "important");
    }
    const authCopy = document.querySelector(".auth-copy");
    if (authCopy) {
      authCopy.textContent = "Okul Takip Sistemi bulut hesabınızla giriş yapın. Verileriniz otomatik olarak eşitlenecektir.";
    }
    const introTitle = document.querySelector(".auth-intro h1");
    if (introTitle) {
      introTitle.textContent = "Hesabınıza giriş yapın";
    }
    setAuthMode("login");
  }
  if (!config.url || !config.anonKey) {
    cloudState = { ...cloudState, enabled: false, ready: true, client: null, session: null, lastError: "" };
    renderCloudStatus();
    finalizeCloudInitialization();
    return;
  }
  if (!window.supabase?.createClient) {
    cloudState = { ...cloudState, enabled: true, ready: false, client: null, session: null, lastError: "Supabase kütüphanesi yüklenemedi. İnternet bağlantısını veya CDN erişimini kontrol edin." };
    renderCloudStatus();
    finalizeCloudInitialization();
    return;
  }

  const overlay = document.getElementById("cloudLoadingOverlay");
  const hasLocalUser = Boolean(localSession?.name);
  if (hasLocalUser && overlay) {
    overlay.removeAttribute("hidden");
    const spinner = document.getElementById("cloudLoadingSpinner");
    const title = document.getElementById("cloudLoadingTitle");
    const desc = document.getElementById("cloudLoadingDesc");
    const errContainer = document.getElementById("cloudLoadingError");
    if (spinner) spinner.style.display = "block";
    if (title) title.textContent = "Veriler buluttan yükleniyor...";
    if (desc) desc.textContent = "Lütfen bekleyin, güncel veriler alınıyor.";
    if (errContainer) errContainer.style.display = "none";
  }

  try {
    const client = window.supabase.createClient(config.url, config.anonKey);
    const { data, error } = await withTimeout(client.auth.getSession(), 6000);
    if (error) throw error;
    cloudState = { ...cloudState, client, session: data.session, enabled: true, ready: true, lastError: "" };
    
     if (data.session) {
      const email = normalizeEmail(data.session.user.email);
      const name = data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || email.split("@")[0];
      const localEmail = localSession ? normalizeEmail(localSession.email) : "";
      if (email && localEmail && email !== localEmail) {
        console.warn("Session email mismatch. Syncing local profile to active cloud account:", email);
        saveLocalSession({
          id: data.session.user.id,
          name: name,
          email: email,
          activeModule: localSession?.activeModule || "",
          createdAt: new Date().toISOString()
        });
      }
      syncUserToServer({ id: data.session.user.id, name, email, role: "teacher" });
      await checkAndSyncCloudBackground();
    } else {
      if (overlay) overlay.setAttribute("hidden", "true");
    }

    client.auth.onAuthStateChange((_event, session) => {
      cloudState.session = session;
      if (session) {
        const email = normalizeEmail(session.user.email);
        const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || email.split("@")[0];
        const localEmail = localSession ? normalizeEmail(localSession.email) : "";
        if (email && localEmail && email !== localEmail) {
          saveLocalSession({
            id: session.user.id,
            name: name,
            email: email,
            activeModule: localSession?.activeModule || "",
            createdAt: new Date().toISOString()
          });
        }
        syncUserToServer({ id: session.user.id, name, email, role: "teacher" });
      }
      renderCloudStatus();
    });
    renderCloudStatus();
    finalizeCloudInitialization();
  } catch (error) {
    cloudState = { ...cloudState, enabled: true, ready: false, client: null, session: null, lastError: `Supabase bağlantısı kurulamadı: ${error.message}` };
    renderCloudStatus();
    if (hasLocalUser) {
      const spinner = document.getElementById("cloudLoadingSpinner");
      const title = document.getElementById("cloudLoadingTitle");
      const desc = document.getElementById("cloudLoadingDesc");
      const errContainer = document.getElementById("cloudLoadingError");
      if (spinner) spinner.style.display = "none";
      if (title) title.textContent = "Bağlantı Hatası";
      if (desc) desc.textContent = "Bulut veritabanına bağlanılamadı.";
      if (errContainer) errContainer.style.display = "block";
    } else {
      if (overlay) overlay.setAttribute("hidden", "true");
    }
    finalizeCloudInitialization();
  }
}

async function signInToCloud() {
  const email = els.authEmailInput.value.trim();
  const password = els.authPasswordInput.value;
  if (!email || !password) {
    showToast("E-posta ve şifre girin.", "warning");
    return;
  }

  // Overlay'ı göster
  const overlay = document.getElementById("cloudLoadingOverlay");
  if (overlay) {
    overlay.removeAttribute("hidden");
    const spinner = document.getElementById("cloudLoadingSpinner");
    const title = document.getElementById("cloudLoadingTitle");
    const desc = document.getElementById("cloudLoadingDesc");
    const errContainer = document.getElementById("cloudLoadingError");
    if (spinner) spinner.style.display = "block";
    if (title) title.textContent = "Giriş yapılıyor...";
    if (desc) desc.textContent = "Lütfen bekleyin, hesabınıza bağlanılıyor.";
    if (errContainer) errContainer.style.display = "none";
  }

  try {
    const { data, error } = await withTimeout(
      cloudState.client.auth.signInWithPassword({ email, password }),
      8000
    );
    if (error) throw error;
    cloudState.session = data.session;
    els.authPasswordInput.value = "";

    if (data.session) {
      // Giriş yapıldı, profili ayarla
      const userEmail = normalizeEmail(data.session.user.email);
      const name = data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || userEmail.split("@")[0];
      saveLocalSession({
        id: data.session.user.id,
        name: name,
        email: userEmail,
        activeModule: localSession?.activeModule || "",
        createdAt: new Date().toISOString()
      });
      renderAccessShell();

      // Overlay'ı güncelle - veri indiriliyor
      const titleEl = document.getElementById("cloudLoadingTitle");
      const descEl = document.getElementById("cloudLoadingDesc");
      if (titleEl) titleEl.textContent = "Veriler buluttan yükleniyor...";
      if (descEl) descEl.textContent = "Lütfen bekleyin, güncel veriler alınıyor.";

      // Buluttaki veriyi oku
      const userId = data.session.user.id;
      const { data: remoteStateData, error: readError } = await withTimeout(
        cloudState.client
          .from("sorubank_cloud_states")
          .select("state, updated_at")
          .eq("user_id", userId)
          .maybeSingle(),
        8000
      );
      if (readError) throw readError;

      if (remoteStateData?.state) {
        const isBackupPackage = remoteStateData.state.type === "sorubank-backup" && remoteStateData.state.storage;
        if (isBackupPackage) {
          isSyncingFromCloud = true;
          applyBackupPackage(remoteStateData.state, "replace");
          localStorage.setItem("sorubank:cloud-last-sync", remoteStateData.updated_at || new Date().toISOString());
          localStorage.removeItem("sorubank:cloud-local-write");
          cloudState.lastSyncAt = remoteStateData.updated_at;
          window.location.reload();
          return;
        }
      } else {
        // Bulutta veri yok, yerel veriyi gönder
        await withTimeout(pushCloudState({ silent: true }), 8000);
        finalizeCloudInitialization();
      }

      if (overlay) overlay.setAttribute("hidden", "true");
      renderCloudStatus();
      showToast("Bulut hesabına giriş yapıldı.");
    } else {
      if (overlay) overlay.setAttribute("hidden", "true");
      finalizeCloudInitialization();
    }
  } catch (error) {
    cloudState.lastError = `Giriş yapılamadı: ${error.message}`;
    const spinner = document.getElementById("cloudLoadingSpinner");
    const title = document.getElementById("cloudLoadingTitle");
    const desc = document.getElementById("cloudLoadingDesc");
    const errContainer = document.getElementById("cloudLoadingError");
    if (spinner) spinner.style.display = "none";
    if (title) title.textContent = "Bağlantı Hatası";
    if (desc) desc.textContent = error.message || "Sunucuya bağlanılamadı.";
    if (errContainer) errContainer.style.display = "block";
    finalizeCloudInitialization();
  }
}

async function signUpToCloud() {
  const email = els.authEmailInput.value.trim();
  const password = els.authPasswordInput.value;
  if (!email || !password) {
    showToast("E-posta ve şifre girin.", "warning");
    return;
  }
  cloudState.syncing = true;
  renderCloudStatus();
  try {
    const { data, error } = await cloudState.client.auth.signUp({ email, password });
    if (error) throw error;
    cloudState.session = data.session;
    els.authPasswordInput.value = "";
    renderCloudStatus();
    if (data.session) {
      await pushCloudState();
      showToast("Hesap oluşturuldu ve veriler buluta gönderildi.");
    } else {
      showToast("Hesap oluşturuldu. Supabase e-posta onayı açıksa gelen kutusunu kontrol edin.");
    }
  } catch (error) {
    cloudState.lastError = `Kayıt oluşturulamadı: ${error.message}`;
    showToast(cloudState.lastError, "error");
  } finally {
    cloudState.syncing = false;
    renderCloudStatus();
  }
}

async function signOutFromCloud() {
  if (!cloudState.client) return;
  cloudState.syncing = true;
  renderCloudStatus();
  try {
    await pushCloudState({ silent: true });
    const { error } = await cloudState.client.auth.signOut();
    if (error) throw error;
    cloudState.session = null;
    localStorage.removeItem("sorubank:cloud-last-sync");
    showToast("Bulut hesabından çıkış yapıldı.");
  } catch (error) {
    cloudState.lastError = `Çıkış yapılamadı: ${error.message}`;
    showToast(cloudState.lastError, "error");
  } finally {
    cloudState.syncing = false;
    renderCloudStatus();
  }
}

async function readCloudState() {
  const userId = cloudState.session?.user?.id;
  if (!cloudState.client || !userId) return null;
  const { data, error } = await cloudState.client
    .from("sorubank_cloud_states")
    .select("state, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function pushCloudState(options = {}) {
  const userId = cloudState.session?.user?.id;
  if (!cloudState.client || !userId) return;
  cloudState.syncing = true;
  renderCloudStatus();
  const pushStartedAt = new Date().toISOString();
  try {
    // Ensure latest in-memory skillState is flushed into skillProfileStore before collecting backup storage
    const activeProfile = getActiveSkillProfile();
    if (activeProfile && skillState) {
      activeProfile.state = skillState;
      localStorage.setItem(getSkillProfilesStorageKey(), JSON.stringify(skillProfileStore));
    }
    const payload = {
      user_id: userId,
      state: createBackupPackage(Object.keys(BACKUP_MODULES)),
      updated_at: pushStartedAt
    };
    const { data: upsertedRows, error } = await cloudState.client
      .from("sorubank_cloud_states")
      .upsert(payload, { onConflict: "user_id" })
      .select("updated_at")
      .maybeSingle();
    if (error) throw error;
    const syncedTimestamp = upsertedRows?.updated_at || payload.updated_at;
    cloudState.lastSyncAt = syncedTimestamp;
    localStorage.setItem("sorubank:cloud-last-sync", syncedTimestamp);
    const currentLocalWrite = localStorage.getItem("sorubank:cloud-local-write");
    if (!hasPendingPush && (!currentLocalWrite || Date.parse(currentLocalWrite) <= Date.parse(pushStartedAt))) {
      localStorage.removeItem("sorubank:cloud-local-write");
    }
    cloudState.lastError = "";
    if (!options.silent) showToast("Veriler buluta gönderildi.");
  } catch (error) {
    cloudState.lastError = `Buluta kaydedilemedi: ${error.message}`;
    if (!options.silent) showToast(cloudState.lastError, "error");
    if (options.throwOnError) throw error;
  } finally {
    cloudState.syncing = false;
    renderCloudStatus();
  }
}

async function syncCloudNow() {
  if (!cloudState.client) {
    showToast("Önce Supabase bağlantı ayarını kaydedin.", "warning");
    return;
  }
  if (!cloudState.session) {
    showToast("Eşitleme için önce giriş yapın.", "warning");
    return;
  }

  const overlay = document.getElementById("cloudLoadingOverlay");
  if (overlay) {
    overlay.removeAttribute("hidden");
    const spinner = document.getElementById("cloudLoadingSpinner");
    const title = document.getElementById("cloudLoadingTitle");
    const desc = document.getElementById("cloudLoadingDesc");
    const errContainer = document.getElementById("cloudLoadingError");
    if (spinner) spinner.style.display = "block";
    if (title) title.textContent = "Veriler buluttan yükleniyor...";
    if (desc) desc.textContent = "Lütfen bekleyin, güncel veriler alınıyor.";
    if (errContainer) errContainer.style.display = "none";
  }

  try {
    const userId = cloudState.session.user.id;
    const { data: remote, error } = await withTimeout(
      cloudState.client
        .from("sorubank_cloud_states")
        .select("state, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      8000
    );
    if (error) throw error;

    if (remote?.state) {
      const isBackupPackage = remote.state.type === "sorubank-backup" && remote.state.storage;
      if (isBackupPackage) {
        isSyncingFromCloud = true;
        applyBackupPackage(remote.state, "replace");
        localStorage.setItem("sorubank:cloud-last-sync", remote.updated_at || new Date().toISOString());
        localStorage.removeItem("sorubank:cloud-local-write");
        cloudState.lastSyncAt = remote.updated_at;
        reloadAppState();
        isSyncingFromCloud = false;
      }
    } else {
      // Bulutta veri yok, yereli gönder
      await withTimeout(pushCloudState({ silent: true }), 8000);
    }

    if (overlay) overlay.setAttribute("hidden", "true");
  } catch (error) {
    const spinner = document.getElementById("cloudLoadingSpinner");
    const title = document.getElementById("cloudLoadingTitle");
    const desc = document.getElementById("cloudLoadingDesc");
    const errContainer = document.getElementById("cloudLoadingError");
    if (spinner) spinner.style.display = "none";
    if (title) title.textContent = "Bağlantı Hatası";
    if (desc) desc.textContent = error.message || "Bulut veritabanına bağlanılamadı.";
    if (errContainer) errContainer.style.display = "block";
  }
}

async function saveCloudConfigFromForm() {
  saveStoredCloudConfig({
    url: els.supabaseUrlInput.value,
    anonKey: els.supabaseAnonKeyInput.value
  });
  cloudState = {
    client: null,
    session: null,
    enabled: false,
    ready: false,
    syncing: false,
    lastSyncAt: "",
    lastError: ""
  };
  await initializeCloud();
  showToast("Supabase bağlantı ayarı kaydedildi.");
}

function registerPwa() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" }).catch(() => {});
  });

  // Automatically reload when a new service worker takes control (cache update)
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Beceri Egitimi (Sinif Gunleri, Resmi Tatiller ve Gorunum) -> scripts/modules/skill-training/holidays-and-views.js
// Beceri Egitimi (Ana Ekran ve Raporlar) -> scripts/modules/skill-training/reports.js


// Beceri Egitimi (Yonetim, Tablolar, Formlar ve Arama) -> scripts/modules/skill-training/management.js

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function currentCourse() {
  return state.courses.find((course) => course.id === state.selectedCourseId) || state.courses[0];
}

function gradeValueForCourse(course) {
  const rawGrade = String(course?.grade || "").trim();
  return rawGrade.match(/\d+/)?.[0] || rawGrade;
}

function syncQuestionGradeFromCourse(force = false) {
  const grade = gradeValueForCourse(courseForQuestionForm());
  if (grade && (force || !els.questionGrade.value.trim())) {
    els.questionGrade.value = grade;
  }
}

function questionsForCurrentCourse() {
  return state.questions.filter((question) => question.courseId === currentCourse().id);
}

function curriculumForCourse(course = currentCourse()) {
  return state.curriculumItems.filter((item) => courseNameMatches(item.courseName, course.name));
}

function topicOptionsForCourse(course = currentCourse()) {
  const topicsByKey = new Map();
  curriculumForCourse(course).forEach((item) => {
    const topic = item.unit || item.topic;
    if (!topic) return;
    const key = normalizeCurriculumText(topic);
    const existing = topicsByKey.get(key);
    if (!existing || (hasCurriculumNumber(topic) && !hasCurriculumNumber(existing))) {
      topicsByKey.set(key, topic);
    }
  });
  return [...topicsByKey.values()];
}

function outcomeOptionsForTopic(topic, course = currentCourse()) {
  const selectedTopicKey = normalizeCurriculumText(topic);
  const outcomesByKey = new Map();
  curriculumForCourse(course)
    .filter((item) => !topic || normalizeCurriculumText(item.unit || item.topic) === selectedTopicKey)
    .map((item) => item.outcome)
    .filter(Boolean)
    .forEach((outcome) => {
      const key = normalizeCurriculumText(outcome);
      const existing = outcomesByKey.get(key);
      if (!existing || (hasCurriculumNumber(outcome) && !hasCurriculumNumber(existing))) {
        outcomesByKey.set(key, outcome);
      }
    });
  return [...outcomesByKey.values()];
}

function selectedQuestions() {
  const basketIds = basketIdsForCourse();
  const order = new Map(basketIds.map((id, index) => [id, index]));
  return state.questions
    .filter((question) => question.courseId === currentCourse().id && basketIds.includes(question.id))
    .sort((a, b) => order.get(a.id) - order.get(b.id))
    .map((question) => ({
      ...question,
      ...answerSpaceForBasketQuestion(question.id, question.courseId)
    }));
}

function basketIdsForCourse(courseId = currentCourse().id) {
  return Array.isArray(state.examBaskets?.[courseId]) ? state.examBaskets[courseId] : [];
}

function setBasketIdsForCourse(ids, courseId = currentCourse().id) {
  state.examBaskets = state.examBaskets || {};
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (uniqueIds.length) {
    state.examBaskets[courseId] = uniqueIds;
  } else {
    delete state.examBaskets[courseId];
  }
  cleanupExamAnswerSpacesForCourse(courseId, uniqueIds);
  state.selectedQuestionIds = flattenExamBaskets(state.examBaskets);
}

function answerSpaceForBasketQuestion(questionId, courseId = currentCourse().id) {
  return normalizeAnswerSpaceConfig(state.examAnswerSpaces?.[courseId]?.[questionId]);
}

function cleanupExamAnswerSpacesForCourse(courseId = currentCourse().id, ids = basketIdsForCourse(courseId)) {
  if (!state.examAnswerSpaces?.[courseId]) return;
  const idSet = new Set(ids);
  Object.keys(state.examAnswerSpaces[courseId]).forEach((questionId) => {
    if (!idSet.has(questionId)) delete state.examAnswerSpaces[courseId][questionId];
  });
  if (!Object.keys(state.examAnswerSpaces[courseId]).length) delete state.examAnswerSpaces[courseId];
}

function updateBasketAnswerSpace(questionId, patch, courseId = currentCourse().id) {
  state.examAnswerSpaces = state.examAnswerSpaces || {};
  state.examAnswerSpaces[courseId] = state.examAnswerSpaces[courseId] || {};
  const next = normalizeAnswerSpaceConfig({
    ...answerSpaceForBasketQuestion(questionId, courseId),
    ...patch
  });
  if (next.expectedAnswerItems === 0) {
    delete state.examAnswerSpaces[courseId][questionId];
  } else {
    state.examAnswerSpaces[courseId][questionId] = next;
  }
  if (!Object.keys(state.examAnswerSpaces[courseId]).length) delete state.examAnswerSpaces[courseId];
  saveState();
  renderExamCart();
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent.replace(/\u200b/g, "").trim();
}

function cleanEditorHtmlForSave(html) {
  return String(html || "").replace(/\u200b/g, "");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function showToast(message, type = "info", title = "") {
  if (!els.toastStack) return;

  if (!showToast._listenerRegistered) {
    document.addEventListener("close", (event) => {
      if (event.target.tagName === "DIALOG") {
        const activeDialog = document.querySelector("dialog[open]");
        if (activeDialog) {
          if (els.toastStack && els.toastStack.parentElement !== activeDialog) {
            activeDialog.appendChild(els.toastStack);
          }
          if (resizePanel && resizePanel.parentElement !== activeDialog) {
            activeDialog.appendChild(resizePanel);
          }
        } else {
          if (els.toastStack && els.toastStack.parentElement !== document.body) {
            document.body.appendChild(els.toastStack);
          }
          if (resizePanel && resizePanel.parentElement !== document.body) {
            document.body.appendChild(resizePanel);
          }
          clearResizableSelection();
        }
      }
    }, true);
    showToast._listenerRegistered = true;
  }

  // Dynamic overlay: place toast stack inside active dialog so it renders in the top layer
  const activeDialog = document.querySelector("dialog[open]");
  if (activeDialog) {
    if (els.toastStack.parentElement !== activeDialog) {
      activeDialog.appendChild(els.toastStack);
    }
  } else {
    if (els.toastStack.parentElement !== document.body) {
      document.body.appendChild(els.toastStack);
    }
  }

  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " is-error" : ""}${type === "warning" ? " is-warning" : ""}${type === "success" ? " is-success" : ""}`;
  const fallbackTitle = type === "error" ? "İşlem tamamlanamadı" : type === "warning" ? "Dikkat" : type === "success" ? "Başarılı" : "Bilgi";
  toast.title = "Kapatmak için tıklayın";
  toast.setAttribute("role", "status");

  toast.innerHTML = `
    <div class="toast-body">
      <strong>${escapeHtml(title || fallbackTitle)}</strong>
      <span>${escapeHtml(message)}</span>
    </div>
    <button type="button" class="toast-close" aria-label="Kapat" title="Kapat">&times;</button>
  `;

  let dismissed = false;
  const dismissToast = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (dismissed) return;
    dismissed = true;
    toast.classList.add("toast-leaving");
    setTimeout(() => {
      try { toast.remove(); } catch (_) {}
    }, 180);
  };

  toast.addEventListener("click", dismissToast);
  const closeBtn = toast.querySelector(".toast-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", dismissToast);
  }

  els.toastStack.append(toast);
  window.setTimeout(dismissToast, type === "error" ? 6000 : 3800);
}
window.showToast = showToast;

function appConfirm(message, options = {}) {
  if (!els.confirmDialog) return Promise.resolve(window.confirm(message));
  els.confirmTitle.textContent = options.title || "İşlemi onayla";
  if (options.html) {
    els.confirmMessage.innerHTML = message;
  } else {
    els.confirmMessage.textContent = message;
  }
  els.confirmOkBtn.textContent = options.okText || "Onayla";
  els.confirmCancelBtn.textContent = options.cancelText || "Vazgeç";
  return new Promise((resolve) => {
    const finish = (value) => {
      els.confirmOkBtn.removeEventListener("click", onOk);
      els.confirmCancelBtn.removeEventListener("click", onCancel);
      els.confirmDialog.removeEventListener("cancel", onCancel);
      if (els.confirmDialog.open) els.confirmDialog.close();
      resolve(value);
    };
    const onOk = () => finish(true);
    const onCancel = (event) => {
      event?.preventDefault?.();
      finish(false);
    };
    els.confirmOkBtn.addEventListener("click", onOk);
    els.confirmCancelBtn.addEventListener("click", onCancel);
    els.confirmDialog.addEventListener("cancel", onCancel);
    els.confirmDialog.showModal();
  });
}

function appPrompt(options = {}) {
  if (!els.promptDialog) return Promise.resolve(window.prompt(options.label || options.title || "Bilgi gir", options.value || ""));
  els.promptTitle.textContent = options.title || "Bilgi gir";
  els.promptLabel.textContent = options.label || "Metin";
  els.promptInput.value = options.value || "";
  els.promptInput.placeholder = options.placeholder || "";
  els.promptOkBtn.textContent = options.okText || "Kaydet";
  els.promptCancelBtn.textContent = options.cancelText || "Vazgeç";
  return new Promise((resolve) => {
    const finish = (value) => {
      els.promptForm.removeEventListener("submit", onSubmit);
      els.promptCancelBtn.removeEventListener("click", onCancel);
      els.promptDialog.removeEventListener("cancel", onCancel);
      if (els.promptDialog.open) els.promptDialog.close();
      resolve(value);
    };
    const onSubmit = (event) => {
      event.preventDefault();
      finish(els.promptInput.value.trim());
    };
    const onCancel = (event) => {
      event?.preventDefault?.();
      finish(null);
    };
    els.promptForm.addEventListener("submit", onSubmit);
    els.promptCancelBtn.addEventListener("click", onCancel);
    els.promptDialog.addEventListener("cancel", onCancel);
    els.promptDialog.showModal();
    window.setTimeout(() => {
      els.promptInput.focus();
      els.promptInput.select();
    }, 0);
  });
}

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function examScopeValue(question) {
  return question.examTerm && question.examNumber ? `${question.examTerm}-${question.examNumber}` : "";
}

function examScopeLabel(question) {
  return question.examTerm && question.examNumber ? `${question.examTerm}. Dönem ${question.examNumber}. Yazılı` : "";
}

function optionList(select, values, allLabel) {
  select.innerHTML = "";
  const all = document.createElement("option");
  all.value = "";
  all.textContent = allLabel;
  select.append(all);
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function render() {
  const course = currentCourse();
  els.courseTitle.textContent = `${course.name} Soru Havuzu`;
  renderCourses();
  renderCloudStatus();
  renderFilters();
  renderMetrics();
  renderQuestions();
  renderSelectedQuestions();
  renderExamCart();
  renderExamArchive();
  renderExamAnalysis();
  renderCourseOptions();
  renderCurriculumSelectors();
  renderCurriculumManager();
  syncExamMeta();
  syncSettings();
}

function closeCoursePicker() {
  els.coursePicker.classList.remove("is-open");
  els.coursePickerButton.setAttribute("aria-expanded", "false");
}

function openExamCart() {
  renderExamCart();
  els.examCartDialog.showModal();
}

function renderCourses() {
  const selectedCourse = currentCourse();
  const courseQuestions = state.questions.filter((question) => question.courseId === selectedCourse.id);
  const courseCurriculum = curriculumForCourse(selectedCourse);
  const selected = selectedQuestions();
  const selectedCount = courseQuestions.length;
  const curriculumUnitCount = new Set(courseCurriculum.map((item) => item.topic || item.unit).filter(Boolean)).size;
  const questionUnitCount = new Set(courseQuestions.map((question) => question.topic).filter(Boolean)).size;
  const unitCount = curriculumUnitCount || questionUnitCount;
  const feedbackType = cartFeedback?.courseId === selectedCourse.id ? cartFeedback.type : "";
  const outcomeCount = new Set([
    ...courseCurriculum.map((item) => item.outcome).filter(Boolean),
    ...courseQuestions.map((question) => question.outcome).filter(Boolean)
  ]).size;
  const typeCounts = courseQuestions.reduce((counts, question) => {
    const key = question.type && questionTypes[question.type] ? question.type : "open";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const typeStats = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `<span>${escapeHtml(questionTypes[type])}<strong>${count}</strong></span>`)
    .join("") || `<em>Henüz soru yok</em>`;

  els.coursePickerButton.style.setProperty("--course-color", selectedCourse.color);
  els.coursePickerButton.setAttribute("aria-expanded", els.coursePicker.classList.contains("is-open") ? "true" : "false");
  els.coursePickerButton.innerHTML = `
    <span class="picker-icon" aria-hidden="true"></span>
    <span><small>Ders seçimi</small><strong>${escapeHtml(selectedCourse.name)}</strong></span>
    <span class="course-picker-arrow" aria-hidden="true">▼</span>
  `;

  els.activeCourseCard.innerHTML = `
    <div class="active-course-summary" style="--course-color:${escapeHtml(selectedCourse.color)}">
      <button class="active-course-head" type="button" data-action="open-course">
        <span class="course-dot" aria-hidden="true"></span>
        <span><strong>${escapeHtml(selectedCourse.name)}</strong></span>
      </button>
      <div class="active-course-stats">
        <span><strong>${escapeHtml(gradeValueForCourse(selectedCourse) || selectedCourse.grade || "-")}</strong><small>Sınıf</small></span>
        <span><strong>${selectedCount}</strong><small>Soru</small></span>
        <span><strong>${unitCount}</strong><small>Ünite</small></span>
      </div>
      <div class="active-course-meta">
        <span><strong>${outcomeCount}</strong><small>Kazanım</small></span>
        <button class="active-cart-button${selected.length ? " has-items" : ""}${feedbackType ? ` cart-${feedbackType}` : ""}" type="button" data-action="open-cart" data-feedback="${feedbackType === "added" ? "+1" : feedbackType === "removed" ? "-1" : ""}">
          <small>Sınav sepeti</small>
          <strong>${selected.length} soru</strong>
          <em>${feedbackType === "added" ? "Eklendi" : feedbackType === "removed" ? "Çıkarıldı" : "Sepeti aç"}</em>
        </button>
      </div>
      <div class="active-course-types">
        <small>Soru türleri</small>
        <div>${typeStats}</div>
      </div>
      <div class="course-actions">
        <button type="button" data-action="edit">Düzenle</button>
        <button type="button" data-action="delete">Sil</button>
      </div>
    </div>
  `;
  els.activeCourseCard.querySelector('[data-action="open-course"]').addEventListener("click", () => {
    if (state.currentView === "settings") setView("bank");
  });
  els.activeCourseCard.querySelector('[data-action="open-cart"]').addEventListener("click", openExamCart);
  els.activeCourseCard.querySelector('[data-action="edit"]').addEventListener("click", () => openEditCourse(selectedCourse.id));
  els.activeCourseCard.querySelector('[data-action="delete"]').addEventListener("click", () => deleteCourse(selectedCourse.id));
  sidebarCartCounts.set(selectedCourse.id, selected.length);

  els.courseList.innerHTML = "";
  state.courses.forEach((course) => {
    const count = state.questions.filter((question) => question.courseId === course.id).length;
    const item = document.createElement("button");
    item.type = "button";
    item.className = `course-option${course.id === state.selectedCourseId ? " is-active" : ""}`;
    item.style.setProperty("--course-color", course.color);
    item.innerHTML = `
      <span class="course-dot" aria-hidden="true"></span>
      <span><strong>${escapeHtml(course.name)}</strong><small>${escapeHtml(course.grade || "Düzey belirtilmedi")}</small></span>
      <span class="course-count">${count}</span>
    `;
    item.addEventListener("click", () => {
      state.selectedCourseId = course.id;
      state.activeExamArchiveId = "";
      els.examArchiveNameInput.value = "";
      bulkSelectedQuestionIds.clear();
      saveState();
      closeCoursePicker();
      render();
      if (state.currentView === "settings") {
        setView("bank");
      }
    });
    els.courseList.append(item);
  });
}

function renderFilters() {
  const courseQuestions = questionsForCurrentCourse();
  const topics = [...new Set(courseQuestions.map((question) => question.topic).filter(Boolean))].sort();
  const previousTopic = els.topicFilter.value;
  const previousRandomTopic = els.randomTopic.value;
  optionList(els.topicFilter, topics, "Tüm birimler");
  optionList(els.randomTopic, topics, "Tüm birimler");
  els.difficultyFilter.value = "";
  optionList(els.gradeFilter, [], "Tüm sınıflar");
  els.topicFilter.value = topics.includes(previousTopic) ? previousTopic : "";
  els.randomTopic.value = topics.includes(previousRandomTopic) ? previousRandomTopic : "";
}

function renderMetrics() {
  const courseQuestions = questionsForCurrentCourse();
  const selected = selectedQuestions();
  els.metricQuestionCount.textContent = courseQuestions.length;
  els.metricExamCount.textContent = selected.length;
  els.metricTotalPoints.textContent = selected.reduce((sum, question) => sum + Number(question.points || 0), 0);
  els.metricTopics.textContent = new Set(courseQuestions.map((question) => question.topic).filter(Boolean)).size;
}

function filteredQuestions() {
  const term = els.searchInput.value.trim().toLocaleLowerCase("tr-TR");
  return questionsForCurrentCourse().filter((question) => {
    const haystack = [
      stripHtml(question.content),
      stripHtml(question.answer),
      question.topic,
      question.outcome,
      examScopeLabel(question),
      questionTypes[question.type],
      question.choices.map((choice) => choice.text).join(" "),
      question.acceptedAnswers.join(" "),
      question.tags.join(",")
    ].join(" ").toLocaleLowerCase("tr-TR");
    return (
      (!term || haystack.includes(term)) &&
      (!els.topicFilter.value || question.topic === els.topicFilter.value)
    );
  });
}

function selectedBulkQuestions() {
  const courseQuestionIds = new Set(questionsForCurrentCourse().map((question) => question.id));
  return [...bulkSelectedQuestionIds].filter((id) => courseQuestionIds.has(id));
}

function renderBulkToolbar(visibleQuestions = filteredQuestions()) {
  const selectedIds = selectedBulkQuestions();
  const visibleIds = visibleQuestions.map((question) => question.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => bulkSelectedQuestionIds.has(id));
  els.bulkQuestionCount.textContent = `${selectedIds.length} soru seçildi`;
  els.deleteSelectedQuestionsBtn.disabled = selectedIds.length === 0;
  els.toggleVisibleQuestionsBtn.disabled = visibleIds.length === 0;
  els.toggleVisibleQuestionsBtn.textContent = allVisibleSelected ? "Görünen seçimi kaldır" : "Hepsini seç";
}

function renderQuestions() {
  const questions = filteredQuestions();
  renderBulkToolbar(questions);
  els.questionGrid.innerHTML = "";
  if (!questions.length) {
    els.questionGrid.innerHTML = `<div class="empty-state">Bu filtrelerle eşleşen soru yok. Yeni bir soru ekleyebilir veya filtreleri temizleyebilirsiniz.</div>`;
    return;
  }
  questions.forEach((question) => {
    const isSelected = basketIdsForCourse().includes(question.id);
    const isBulkSelected = bulkSelectedQuestionIds.has(question.id);
    const card = document.createElement("article");
    card.className = `question-card${isSelected ? " is-selected" : ""}${isBulkSelected ? " is-bulk-selected" : ""}`;
    card.innerHTML = `
      <label class="question-select" title="Toplu işlem için seç">
        <input type="checkbox" data-action="bulk-select" ${isBulkSelected ? "checked" : ""} aria-label="Toplu işlem için soruyu seç" />
      </label>
      <div class="question-meta">
        <span class="chip">${questionTypes[question.type]}</span>
        <span class="chip">${escapeHtml(question.topic || "Birim yok")}</span>
        <span class="chip chip-points">${question.points} puan</span>
        ${examScopeLabel(question) ? `<span class="chip chip-scope">${escapeHtml(examScopeLabel(question))}</span>` : ""}
      </div>
      <div class="question-preview">${question.content}${renderQuestionSupplements(question, "bank")}</div>
      <div class="card-actions">
        <button class="card-btn card-btn-primary" type="button" data-action="toggle">${isSelected ? "Sınavdan çıkar" : "Sınava ekle"}</button>
        <button class="card-btn card-btn-soft" type="button" data-action="preview">Soru-cevap</button>
        <button class="card-btn card-btn-plain" type="button" data-action="edit">Düzenle</button>
      </div>
      <div class="question-card-footer">
        <label class="quick-points">
          <span>Puan</span>
          <input type="number" min="1" value="${question.points}" data-action="points" />
        </label>
        <button class="delete-question-btn" type="button" data-action="delete" title="Soruyu sil" aria-label="Soruyu sil">Sil</button>
      </div>
    `;
    card.querySelector('[data-action="toggle"]').addEventListener("click", () => toggleQuestion(question.id));
    card.querySelector('[data-action="preview"]').addEventListener("click", () => openQuestionPreview(question.id));
    card.querySelector('[data-action="edit"]').addEventListener("click", () => editQuestion(question.id));
    card.querySelector('[data-action="points"]').addEventListener("change", (event) => updateQuestionPoints(question.id, event.target.value));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteQuestionById(question.id));
    card.querySelector('[data-action="bulk-select"]').addEventListener("change", (event) => {
      if (event.target.checked) {
        bulkSelectedQuestionIds.add(question.id);
      } else {
        bulkSelectedQuestionIds.delete(question.id);
      }
      renderQuestions();
    });
    els.questionGrid.append(card);
  });
}

function renderSelectedQuestions() {
  const selected = selectedQuestions();
  els.selectedList.innerHTML = "";
  if (!selected.length) {
    els.selectedList.innerHTML = `<div class="empty-state">Henüz sınava soru eklenmedi. Havuzdan seçim yapabilir veya rastgele seçim kullanabilirsiniz.</div>`;
    return;
  }
  selected.forEach((question, index) => {
    const row = document.createElement("div");
    row.className = "selected-row";
    row.innerHTML = `
      <span class="selected-index">${index + 1}</span>
      <div>
        <p>${stripHtml(question.content).slice(0, 180)}${stripHtml(question.content).length > 180 ? "..." : ""}</p>
        <small>${questionTypes[question.type]} · ${question.topic || "Birim yok"}${examScopeLabel(question) ? ` · ${examScopeLabel(question)}` : ""} · ${question.points} puan</small>
      </div>
      <div class="selected-actions">
        <label class="quick-points selected-points">
          <span>Puan</span>
          <input type="number" min="1" value="${question.points}" data-action="points" />
        </label>
        <button class="ghost-action" data-action="remove" type="button">Çıkar</button>
      </div>
    `;
    row.querySelector('[data-action="points"]').addEventListener("change", (event) => updateQuestionPoints(question.id, event.target.value));
    row.querySelector('[data-action="remove"]').addEventListener("click", () => toggleQuestion(question.id));
    els.selectedList.append(row);
  });
}

function defaultExamArchiveTitle() {
  const className = state.examMeta.className ? ` ${state.examMeta.className}` : "";
  return `${currentCourse().name}${className} ${state.examMeta.term}. Dönem ${state.examMeta.examNumber}. Yazılı`;
}

function archivedExamsForCurrentCourse() {
  return state.archivedExams
    .filter((exam) => exam.courseId === currentCourse().id)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function currentExamSnapshot(id = state.activeExamArchiveId, title = els.examArchiveNameInput.value.trim()) {
  const selected = selectedQuestions();
  const now = new Date().toISOString();
  const answerSpaces = Object.fromEntries(selected.map((question) => [
    question.id,
    answerSpaceForBasketQuestion(question.id, question.courseId)
  ]));
  return {
    id: id || uid("exam"),
    courseId: currentCourse().id,
    title: title || defaultExamArchiveTitle(),
    meta: structuredClone(state.examMeta),
    questionIds: selected.map((question) => question.id),
    questionPoints: Object.fromEntries(selected.map((question) => [question.id, Number(question.points || 0)])),
    answerSpaces,
    createdAt: state.archivedExams.find((exam) => exam.id === id)?.createdAt || now,
    updatedAt: now
  };
}

function renderExamArchive() {
  const exams = archivedExamsForCurrentCourse();
  const activeExam = state.archivedExams.find((exam) => exam.id === state.activeExamArchiveId && exam.courseId === currentCourse().id);
  els.examArchiveNameInput.value = activeExam?.title || els.examArchiveNameInput.value || defaultExamArchiveTitle();
  els.examArchiveSelect.innerHTML = "";
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = exams.length ? "Sınav seçiniz" : "Bu ders için kayıt yok";
  els.examArchiveSelect.append(emptyOption);
  exams.forEach((exam) => {
    const option = document.createElement("option");
    option.value = exam.id;
    option.textContent = `${exam.title} (${exam.questionIds.length} soru)`;
    els.examArchiveSelect.append(option);
  });
  els.examArchiveSelect.value = activeExam?.id || "";
  const hasArchiveSelection = Boolean(els.examArchiveSelect.value);
  els.loadExamArchiveBtn.disabled = !hasArchiveSelection;
  els.updateExamArchiveBtn.disabled = !state.activeExamArchiveId || !activeExam || !selectedQuestions().length;
  els.deleteExamArchiveBtn.disabled = !hasArchiveSelection;
  els.saveExamArchiveBtn.textContent = activeExam ? "Arşivi güncelle" : "Arşive kaydet";
  els.saveExamArchiveBtn.disabled = !selectedQuestions().length;
  els.saveExamArchiveAsBtn.disabled = !selectedQuestions().length;
}

function addAnalysisBucket(map, label, points) {
  const key = label || "Belirtilmedi";
  const data = map.get(key) || { count: 0, points: 0 };
  data.count += 1;
  data.points += Number(points || 0);
  map.set(key, data);
}

function analysisListHtml(entries, emptyText, { totalPoints = 0 } = {}) {
  if (!entries.length) return `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
  return `
    <table class="analysis-distribution-table">
      <tbody>
        ${entries.map(([label, data]) => {
          const percent = totalPoints > 0 ? Math.round((data.points / totalPoints) * 100) : 0;
          const filledCells = Math.max(1, Math.round(percent / 10));
          const meter = Array.from({ length: 10 }, (_, index) => (
            `<td class="${index < filledCells ? "is-filled" : ""}">&nbsp;</td>`
          )).join("");
          return `
            <tr>
              <td class="analysis-dist-label">${escapeHtml(label)}</td>
              <td class="analysis-dist-bar">
                <table class="analysis-meter" cellspacing="0" cellpadding="0"><tr>${meter}</tr></table>
              </td>
              <td class="analysis-dist-value">${data.count} soru<br>${data.points} P</td>
              <td class="analysis-dist-percent">%${percent}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function buildAnalysisReportHtml({ printable = false } = {}) {
  const selected = selectedQuestions();
  if (!selected.length) {
    return `<div class="empty-state">Analiz için sınava soru ekleyin.</div>`;
  }
  const totalPoints = selected.reduce((sum, question) => sum + Number(question.points || 0), 0);
  const byUnit = new Map();
  const byOutcome = new Map();
  const byDifficulty = new Map();
  const byType = new Map();
  selected.forEach((question) => {
    const unit = question.topic || "Birim yok";
    const outcome = question.outcome || "Kazanım seçilmedi";
    const points = Number(question.points || 0);
    addAnalysisBucket(byUnit, unit, points);
    addAnalysisBucket(byOutcome, outcome, points);
    addAnalysisBucket(byDifficulty, question.difficulty || "Zorluk yok", points);
    addAnalysisBucket(byType, questionTypes[question.type] || question.type || "Soru türü yok", points);
  });
  const byCountThenName = (a, b) => b[1].count - a[1].count || b[1].points - a[1].points || a[0].localeCompare(b[0], "tr");
  const unitEntries = [...byUnit.entries()].sort(byCountThenName);
  const outcomeEntries = [...byOutcome.entries()].sort(byCountThenName);
  const difficultyEntries = [...byDifficulty.entries()].sort(byCountThenName);
  const typeEntries = [...byType.entries()].sort(byCountThenName);
  const dominantUnit = unitEntries[0]?.[0] || "-";
  const dominantOutcome = outcomeEntries[0]?.[0] || "-";
  const dominantDifficulty = difficultyEntries[0]?.[0] || "-";
  const rows = selected.map((question, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(stripHtml(question.content).slice(0, printable ? 105 : 90))}${stripHtml(question.content).length > (printable ? 105 : 90) ? "..." : ""}</td>
      <td>${escapeHtml(questionTypes[question.type] || question.type || "-")}</td>
      <td>${escapeHtml(question.difficulty || "-")}</td>
      <td>${escapeHtml(question.topic || "Birim yok")}</td>
      <td>${escapeHtml(question.outcome || "Kazanım seçilmedi")}</td>
      <td class="analysis-points-cell">${question.points} P</td>
    </tr>
  `).join("");
  const heading = printable ? `
    <div class="analysis-print-heading">
      <h3>${escapeHtml(currentCourse().name)} - ${escapeHtml(examTitle())} Analiz Raporu</h3>
      <p>${escapeHtml(state.examMeta.className || "")}${state.examMeta.date ? ` · ${escapeHtml(formatExamDate(state.examMeta.date))}` : ""}</p>
    </div>
  ` : "";
  const analysisBoxes = [
    {
      title: "Öğrenme birimi dağılımı",
      body: analysisListHtml(unitEntries, "Öğrenme birimi yok.", { totalPoints })
    },
    {
      title: "Hedeflenen kazanımlar",
      body: analysisListHtml(outcomeEntries, "Kazanım seçilmedi.", { totalPoints })
    },
    {
      title: "Zorluk dağılımı",
      body: analysisListHtml(difficultyEntries, "Zorluk bilgisi yok.", { totalPoints })
    },
    {
      title: "Soru türü dağılımı",
      body: analysisListHtml(typeEntries, "Soru türü yok.", { totalPoints })
    }
  ];
  const analysisBoxHtml = (box) => {
    const boxTag = printable ? "div" : "section";
    return `
    <${boxTag} class="analysis-box">
      <h3>${box.title}</h3>
      ${box.body}
    </${boxTag}>
  `;
  };
  const analysisGrid = printable ? `
    <table class="analysis-grid-table">
      <tr>
        <td class="analysis-grid-cell">${analysisBoxHtml(analysisBoxes[0])}</td>
        <td class="analysis-grid-cell analysis-grid-cell-right">${analysisBoxHtml(analysisBoxes[1])}</td>
      </tr>
      <tr>
        <td class="analysis-grid-cell">${analysisBoxHtml(analysisBoxes[2])}</td>
        <td class="analysis-grid-cell analysis-grid-cell-right">${analysisBoxHtml(analysisBoxes[3])}</td>
      </tr>
    </table>
  ` : `
    <div class="analysis-grid">
      ${analysisBoxes.map(analysisBoxHtml).join("")}
    </div>
  `;
  return `
    ${heading}
    <table class="analysis-kpi-table">
      <tr>
        <td class="analysis-kpi-card"><p class="analysis-kpi-label">Soru</p><p class="analysis-kpi-value">${selected.length}</p><p class="analysis-kpi-note">Seçili soru</p></td>
        <td class="analysis-kpi-card"><p class="analysis-kpi-label">Öğrenme birimi</p><p class="analysis-kpi-value">${unitEntries.length}</p><p class="analysis-kpi-note">Farklı birim</p></td>
        <td class="analysis-kpi-card"><p class="analysis-kpi-label">Kazanım</p><p class="analysis-kpi-value">${outcomeEntries.length}</p><p class="analysis-kpi-note">Farklı kazanım</p></td>
        <td class="analysis-kpi-card"><p class="analysis-kpi-label">Zorluk</p><p class="analysis-kpi-value">${escapeHtml(dominantDifficulty)}</p><p class="analysis-kpi-note">${difficultyEntries[0]?.[1].count || 0} soru</p></td>
      </tr>
    </table>
    <div class="analysis-brief">
      <span class="analysis-brief-title">Özet:</span>
      En yoğun birim ${escapeHtml(dominantUnit)}, öne çıkan kazanım ${escapeHtml(dominantOutcome)}, zorluk ${escapeHtml(dominantDifficulty)}.
    </div>
    ${analysisGrid}
    <table class="analysis-table">
      <thead>
        <tr><th>#</th><th>Soru özeti</th><th>Tür</th><th>Zorluk</th><th>Birim</th><th>Ölçülen kazanım</th><th>Puan</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderExamAnalysis() {
  const html = buildAnalysisReportHtml();
  els.examAnalysisReport.innerHTML = html;
  els.examAnalysisPrintable.innerHTML = buildAnalysisReportHtml({ printable: true });
}

function selectedQuestionRowHtml(question, index, options = {}) {
  const showAnswer = options.showAnswer;
  const answerSpace = answerSpaceForBasketQuestion(question.id, question.courseId);
  return `
    <span class="selected-index">${index + 1}</span>
    <div>
      <p>${stripHtml(question.content).slice(0, 180)}${stripHtml(question.content).length > 180 ? "..." : ""}</p>
      <small>${questionTypes[question.type]} · ${question.topic || "Birim yok"}${examScopeLabel(question) ? ` · ${examScopeLabel(question)}` : ""} · ${question.points} puan</small>
    </div>
    <div class="selected-actions">
      <label class="quick-points selected-points">
        <span>Puan</span>
        <input type="number" min="1" value="${question.points}" data-action="points" />
      </label>
      <label class="basket-answer-space-select">
        <span>Cevap boşluğu</span>
        <select data-action="expected-answer-items">
          <option value="0" ${answerSpace.expectedAnswerItems ? "" : "selected"}>Otomatik</option>
          ${Array.from({ length: 12 }, (_, index) => {
            const value = index + 1;
            return `<option value="${value}" ${answerSpace.expectedAnswerItems === value ? "selected" : ""}>${value} satır</option>`;
          }).join("")}
          ${[15, 20, 25, 30].map((value) => (
            `<option value="${value}" ${answerSpace.expectedAnswerItems === value ? "selected" : ""}>${value} satır</option>`
          )).join("")}
        </select>
      </label>
      <button class="ghost-action" data-action="remove" type="button">Çıkar</button>
    </div>
    ${showAnswer ? `
      <div class="basket-qa">
        <section>
          <h3>Soru</h3>
          <div>${question.content}${renderQuestionSupplements(question, "bank")}</div>
        </section>
        <section>
          <h3>Cevap</h3>
          <div>${answerKeyHtml(question) || "<p>Cevap girilmedi.</p>"}</div>
        </section>
      </div>
    ` : ""}
  `;
}

function bindSelectedQuestionRow(row, question) {
  row.querySelector('[data-action="points"]').addEventListener("change", (event) => updateQuestionPoints(question.id, event.target.value));
  row.querySelector('[data-action="remove"]').addEventListener("click", () => toggleQuestion(question.id));
  row.querySelector('[data-action="expected-answer-items"]')?.addEventListener("change", (event) => {
    const value = Number(event.target.value || 0);
    updateBasketAnswerSpace(question.id, {
      answerSpaceMode: "auto",
      expectedAnswerItems: Number.isFinite(value) ? value : 0
    }, question.courseId);
  });
}

function renderExamCart() {
  const selected = selectedQuestions();
  const totalPoints = selected.reduce((sum, question) => sum + Number(question.points || 0), 0);
  els.cartQuestionCount.textContent = `${selected.length} soru`;
  els.cartPointCount.textContent = `${totalPoints} puan`;
  els.cartDialogQuestionCount.textContent = selected.length;
  els.cartDialogPointCount.textContent = totalPoints;
  renderCartWarnings(selected, totalPoints);
  els.examCartBtn.classList.toggle("is-empty", !selected.length);
  els.clearCartBtn.disabled = !selected.length;
  els.goExamFromCartBtn.disabled = !selected.length;
  els.cartViewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.cartView === cartViewMode);
  });
  els.basketSectionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.basketSection === basketSectionMode);
  });
  els.basketSections.forEach((section) => {
    section.hidden = section.dataset.basketSectionPanel !== basketSectionMode;
  });
  els.cartSelectedList.innerHTML = "";
  if (!selected.length) {
    els.cartSelectedList.innerHTML = `<div class="empty-state">Sepette soru yok. Soru havuzundan sınava soru ekleyebilirsiniz.</div>`;
    return;
  }
  selected.forEach((question, index) => {
    const row = document.createElement("div");
    row.className = `selected-row basket-row${cartViewMode === "qa" ? " is-expanded" : ""}`;
    row.innerHTML = selectedQuestionRowHtml(question, index, { showAnswer: cartViewMode === "qa" });
    bindSelectedQuestionRow(row, question);
    els.cartSelectedList.append(row);
  });
}

function renderCartWarnings(selected, totalPoints) {
  if (!els.cartWarningList) return;
  const warnings = [];
  const topicCounts = selected.reduce((counts, question) => {
    const topic = question.topic || "Birim yok";
    counts.set(topic, (counts.get(topic) || 0) + 1);
    return counts;
  }, new Map());
  const repeatedTopic = [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (repeatedTopic && repeatedTopic[1] >= 3) {
    warnings.push(`Bu sınavda ${repeatedTopic[1]} soru "${repeatedTopic[0]}" biriminden.`);
  }
  const scopes = new Set(selected.map(examScopeLabel).filter(Boolean));
  const hasUnscoped = selected.some((question) => !examScopeLabel(question));
  if (scopes.size > 1 || (scopes.size === 1 && hasUnscoped)) {
    warnings.push("Farklı dönem/yazılı kapsamından soru var.");
  }
  els.cartWarningList.innerHTML = warnings.map((warning) => `<div>${escapeHtml(warning)}</div>`).join("");
  els.cartWarningList.hidden = !warnings.length;
}

function openQuestionPreview(id) {
  previewQuestionIds = filteredQuestions().map((question) => question.id);
  if (!previewQuestionIds.includes(id)) {
    previewQuestionIds = questionsForCurrentCourse().map((question) => question.id);
  }
  currentPreviewQuestionId = id;
  renderQuestionPreview();
  els.questionPreviewDialog.showModal();
}

function renderQuestionPreview() {
  const question = state.questions.find((item) => item.id === currentPreviewQuestionId);
  if (!question) return;
  const previewIndex = previewQuestionIds.indexOf(question.id);
  const hasSequence = previewIndex >= 0 && previewQuestionIds.length > 0;
  const isSelected = basketIdsForCourse().includes(question.id);
  els.previewQuestionMeta.innerHTML = [
    questionTypes[question.type],
    `${question.points} puan`,
    examScopeLabel(question)
  ].filter(Boolean).map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("");
  const contextRows = [
    ["Öğrenme birimi", question.topic || "Birim yok"],
    ["Kazanım", question.outcome || "Kazanım seçilmedi"]
  ];
  els.previewQuestionContext.innerHTML = contextRows.map(([label, value]) => `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");
  els.previewQuestionContent.innerHTML = `${question.content}${renderQuestionSupplements(question, "bank")}`;
  els.previewAnswerContent.innerHTML = answerKeyHtml(question);
  els.previewQuestionCounter.textContent = hasSequence ? `${previewIndex + 1} / ${previewQuestionIds.length}` : "1 / 1";
  els.previewQuestionPoints.value = question.points;
  els.previewToggleExamBtn.textContent = isSelected ? "Sınavdan çıkar" : "Sınava ekle";
  els.prevPreviewBtn.disabled = !hasSequence || previewQuestionIds.length <= 1;
  els.nextPreviewBtn.disabled = !hasSequence || previewQuestionIds.length <= 1;
}

function moveQuestionPreview(direction) {
  if (!previewQuestionIds.length) return;
  const currentIndex = Math.max(0, previewQuestionIds.indexOf(currentPreviewQuestionId));
  const nextIndex = (currentIndex + direction + previewQuestionIds.length) % previewQuestionIds.length;
  currentPreviewQuestionId = previewQuestionIds[nextIndex];
  renderQuestionPreview();
}

function renderQuestionSupplements(question, mode = "exam") {
  if (question.type === "multipleChoice") {
    const choices = question.choices
      .filter((choice) => choice.text.trim())
      .map((choice) => `<li><strong>${choice.label})</strong> ${escapeHtml(choice.text)}</li>`)
      .join("");
    return choices ? `<ol class="choice-preview">${choices}</ol>` : "";
  }
  if (question.type === "trueFalse" && mode === "exam") {
    return `<div class="true-false-line">Doğru ( ) &nbsp;&nbsp; Yanlış ( )</div>`;
  }
  return "";
}

function answerKeyHtml(question) {
  if (question.type === "multipleChoice") {
    const correct = question.choices.find((choice) => choice.id === question.correctChoiceId);
    return `<p><strong>Doğru seçenek:</strong> ${correct ? `${correct.label}) ${escapeHtml(correct.text)}` : "-"}</p>${question.answer || ""}`;
  }
  if (question.type === "trueFalse") {
    return `<p><strong>Doğru cevap:</strong> ${question.correctBoolean ? "Doğru" : "Yanlış"}</p>${question.answer || ""}`;
  }
  if (question.type === "shortAnswer") {
    const answers = question.acceptedAnswers.length ? question.acceptedAnswers.map(escapeHtml).join(", ") : "-";
    return `<p><strong>Kabul edilen cevaplar:</strong> ${answers}</p>${question.answer || ""}`;
  }
  return question.answer || "<p>Cevap eklenmedi.</p>";
}

function renderCourseOptions() {
  els.questionCourse.innerHTML = "";
  state.courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.name;
    els.questionCourse.append(option);
  });
  if (!state.editingQuestionId) {
    els.questionCourse.value = state.selectedCourseId;
  }
}

function courseForQuestionForm() {
  return state.courses.find((course) => course.id === els.questionCourse.value) || currentCourse();
}

function renderCurriculumSelectors(preferredTopic = els.questionTopic.value, preferredOutcome = els.questionOutcome.value) {
  const course = courseForQuestionForm();
  const curriculumTopics = topicOptionsForCourse(course);
  const questionTopics = [...new Set(state.questions
    .filter((question) => question.courseId === course.id)
    .map((question) => question.topic)
    .filter(Boolean))];
  const topics = [...new Set([...curriculumTopics, ...questionTopics])];

  els.questionTopic.innerHTML = `<option value="">Öğrenme birimi seçiniz</option>`;
  topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    els.questionTopic.append(option);
  });
  if (preferredTopic && !topics.includes(preferredTopic)) {
    const option = document.createElement("option");
    option.value = preferredTopic;
    option.textContent = preferredTopic;
    els.questionTopic.append(option);
  }
  els.questionTopic.value = preferredTopic || "";

  const curriculumOutcomes = outcomeOptionsForTopic(els.questionTopic.value, course);
  const questionOutcomes = [...new Set(state.questions
    .filter((question) => question.courseId === course.id && (!els.questionTopic.value || question.topic === els.questionTopic.value))
    .map((question) => question.outcome)
    .filter(Boolean))];
  const outcomes = [...new Set([...curriculumOutcomes, ...questionOutcomes])];

  els.questionOutcome.innerHTML = `<option value="">Kazanım seçiniz</option>`;
  outcomes.forEach((outcome) => {
    const option = document.createElement("option");
    option.value = outcome;
    option.textContent = outcome;
    els.questionOutcome.append(option);
  });
  if (preferredOutcome && !outcomes.includes(preferredOutcome)) {
    const option = document.createElement("option");
    option.value = preferredOutcome;
    option.textContent = preferredOutcome;
    els.questionOutcome.append(option);
  }
  els.questionOutcome.value = preferredOutcome || "";
}

function renderCurriculumManager() {
  const topics = topicOptionsForCourse();
  if (!topics.includes(state.selectedCurriculumTopic)) {
    state.selectedCurriculumTopic = topics[0] || "";
  }

  els.curriculumTopicList.innerHTML = "";
  if (!topics.length) {
    els.curriculumTopicList.innerHTML = `<div class="empty-state">Bu ders için öğrenme birimi yok. Manuel ekleyebilir veya PDF'den aktarabilirsiniz.</div>`;
  } else {
    topics.forEach((topic) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `topic-item${topic === state.selectedCurriculumTopic ? " is-active" : ""}`;
      button.innerHTML = `
        <span>${escapeHtml(topic)}</span>
        <small>${outcomeOptionsForTopic(topic).length} kazanım</small>
        <span class="topic-actions">
          <span data-action="edit-unit">Düzenle</span>
          <span data-action="delete-unit">Sil</span>
        </span>
      `;
      button.addEventListener("click", () => {
        state.selectedCurriculumTopic = topic;
        saveState();
        renderCurriculumManager();
      });
      button.querySelector('[data-action="edit-unit"]').addEventListener("click", (event) => {
        event.stopPropagation();
        editUnit(topic);
      });
      button.querySelector('[data-action="delete-unit"]').addEventListener("click", (event) => {
        event.stopPropagation();
        deleteUnit(topic);
      });
      els.curriculumTopicList.append(button);
    });
  }

  els.selectedTopicTitle.textContent = state.selectedCurriculumTopic || "Birim seçiniz";
  els.curriculumOutcomeList.innerHTML = "";
  const outcomes = outcomeOptionsForTopic(state.selectedCurriculumTopic);
  if (!state.selectedCurriculumTopic) {
    els.curriculumOutcomeList.innerHTML = `<div class="empty-state">Kazanım eklemek için önce öğrenme birimi seçin.</div>`;
    return;
  }
  if (!outcomes.length) {
    els.curriculumOutcomeList.innerHTML = `<div class="empty-state">Bu öğrenme birimi için kazanım yok.</div>`;
    return;
  }
  outcomes.forEach((outcome) => {
    const row = document.createElement("div");
    row.className = "outcome-item";
    row.innerHTML = `
      <span>${escapeHtml(outcome)}</span>
      <div>
        <button type="button" data-action="edit">Düzenle</button>
        <button type="button" data-action="delete">Sil</button>
      </div>
    `;
    row.querySelector('[data-action="edit"]').addEventListener("click", () => editOutcome(state.selectedCurriculumTopic, outcome));
    row.querySelector('[data-action="delete"]').addEventListener("click", () => deleteOutcome(state.selectedCurriculumTopic, outcome));
    els.curriculumOutcomeList.append(row);
  });
}

async function addTopic() {
  const topic = await appPrompt({
    title: "Öğrenme birimi ekle",
    label: "Öğrenme birimi adı",
    placeholder: "Örn. 1. Hukuka Giriş",
    okText: "Birim ekle"
  });
  if (!topic?.trim()) return;
  const outcome = await appPrompt({
    title: "İlk kazanımı ekle",
    label: "Bu öğrenme birimi için ilk kazanım",
    placeholder: "Örn. Hukuk kavramını açıklar.",
    okText: "Kazanım ekle"
  });
  if (!outcome?.trim()) return;
  state.curriculumItems.push({
    courseName: currentCourse().name,
    unit: topic.trim(),
    topic: topic.trim(),
    outcome: outcome.trim()
  });
  state.selectedCurriculumTopic = topic.trim();
  saveState();
  render();
}

async function addOutcome() {
  if (!state.selectedCurriculumTopic) {
    await addTopic();
    return;
  }
  const outcome = await appPrompt({
    title: "Kazanım ekle",
    label: `${state.selectedCurriculumTopic} öğrenme birimi için kazanım`,
    placeholder: "Kazanımı yazın",
    okText: "Kazanım ekle"
  });
  if (!outcome?.trim()) return;
  state.curriculumItems.push({
    courseName: currentCourse().name,
    unit: state.selectedCurriculumTopic,
    topic: state.selectedCurriculumTopic,
    outcome: outcome.trim()
  });
  saveState();
  render();
}

async function editOutcome(topic, oldOutcome) {
  const nextOutcome = await appPrompt({
    title: "Kazanımı düzenle",
    label: "Kazanım",
    value: oldOutcome,
    okText: "Kaydet"
  });
  if (!nextOutcome?.trim() || nextOutcome.trim() === oldOutcome) return;
  const courseName = currentCourse().name;
  const topicKey = normalizeCurriculumText(topic);
  state.curriculumItems = state.curriculumItems.map((item) => {
    const matchesCourse = courseNameMatches(item.courseName, courseName);
    return matchesCourse && normalizeCurriculumText(item.unit || item.topic) === topicKey && item.outcome === oldOutcome
      ? { ...item, outcome: nextOutcome.trim() }
      : item;
  });
  saveState();
  render();
}

async function deleteOutcome(topic, outcome) {
  if (!await appConfirm("Bu kazanım silinsin mi?", { title: "Kazanımı sil", okText: "Sil" })) return;
  const courseName = currentCourse().name;
  const topicKey = normalizeCurriculumText(topic);
  state.curriculumItems = state.curriculumItems.filter((item) => {
    const matchesCourse = courseNameMatches(item.courseName, courseName);
    return !(matchesCourse && normalizeCurriculumText(item.unit || item.topic) === topicKey && item.outcome === outcome);
  });
  saveState();
  render();
}

async function editUnit(oldUnit) {
  const nextUnit = await appPrompt({
    title: "Öğrenme birimini düzenle",
    label: "Öğrenme birimi adı",
    value: oldUnit,
    okText: "Kaydet"
  });
  if (!nextUnit?.trim() || nextUnit.trim() === oldUnit) return;
  const courseName = currentCourse().name;
  const oldUnitKey = normalizeCurriculumText(oldUnit);
  state.curriculumItems = state.curriculumItems.map((item) => {
    const matchesCourse = courseNameMatches(item.courseName, courseName);
    return matchesCourse && normalizeCurriculumText(item.unit || item.topic) === oldUnitKey
      ? { ...item, unit: nextUnit.trim(), topic: nextUnit.trim() }
      : item;
  });
  state.selectedCurriculumTopic = nextUnit.trim();
  saveState();
  render();
}

async function deleteUnit(unit) {
  if (!await appConfirm(`${unit} öğrenme birimi ve bağlı kazanımları silinsin mi?`, { title: "Öğrenme birimini sil", okText: "Sil" })) return;
  const courseName = currentCourse().name;
  const unitKey = normalizeCurriculumText(unit);
  state.curriculumItems = state.curriculumItems.filter((item) => {
    const matchesCourse = courseNameMatches(item.courseName, courseName);
    return !(matchesCourse && normalizeCurriculumText(item.unit || item.topic) === unitKey);
  });
  if (normalizeCurriculumText(state.selectedCurriculumTopic) === unitKey) state.selectedCurriculumTopic = "";
  saveState();
  render();
}

function openCreateCourse() {
  els.courseForm.reset();
  els.courseIdInput.value = "";
  els.courseDialogTitle.textContent = "Ders ekle";
  els.saveCourseBtn.textContent = "Ekle";
  els.courseDialog.showModal();
}

function openEditCourse(id) {
  const course = state.courses.find((item) => item.id === id);
  if (!course) return;
  els.courseIdInput.value = course.id;
  els.courseNameInput.value = course.name;
  els.courseGradeInput.value = course.grade || "";
  els.courseDialogTitle.textContent = "Dersi düzenle";
  els.saveCourseBtn.textContent = "Kaydet";
  els.courseDialog.showModal();
}

function saveCourse(event) {
  event.preventDefault();
  const name = els.courseNameInput.value.trim();
  if (!name) return;
  const existingId = els.courseIdInput.value;
  if (existingId) {
    const existingCourse = state.courses.find((course) => course.id === existingId);
    const previousName = existingCourse?.name || name;
    state.courses = state.courses.map((course) =>
      course.id === existingId ? { ...course, name, grade: els.courseGradeInput.value.trim() } : course
    );
    state.curriculumItems = state.curriculumItems.map((item) =>
      courseNameMatches(item.courseName, previousName) ? { ...item, courseName: name } : item
    );
  } else {
    const course = {
      id: uid("course"),
      name,
      grade: els.courseGradeInput.value.trim(),
      color: palette[state.courses.length % palette.length]
    };
    state.courses.push(course);
    state.selectedCourseId = course.id;
  }
  saveState();
  render();
  els.courseDialog.close();
}

async function deleteCourse(id) {
  if (state.courses.length <= 1) {
    showToast("En az bir ders kalmalı.", "warning");
    return;
  }
  const course = state.courses.find((item) => item.id === id);
  if (!course) return;
  const questionCount = state.questions.filter((question) => question.courseId === id).length;
  const confirmed = await appConfirm(`${course.name} dersi ve bu derse bağlı ${questionCount} soru silinsin mi?`, {
    title: "Dersi sil",
    okText: "Sil"
  });
  if (!confirmed) return;
  state.courses = state.courses.filter((item) => item.id !== id);
  const deletedQuestionIds = state.questions.filter((question) => question.courseId === id).map((question) => question.id);
  state.questions = state.questions.filter((question) => question.courseId !== id);
  state.curriculumItems = state.curriculumItems.filter((item) => !courseNameMatches(item.courseName, course.name));
  state.archivedExams = state.archivedExams.filter((exam) => exam.courseId !== id);
  delete state.examBaskets[id];
  if (state.examAnswerSpaces) delete state.examAnswerSpaces[id];
  state.selectedQuestionIds = flattenExamBaskets(state.examBaskets);
  deletedQuestionIds.forEach((questionId) => bulkSelectedQuestionIds.delete(questionId));
  if (state.selectedCourseId === id) {
    state.selectedCourseId = state.courses[0].id;
    state.activeExamArchiveId = "";
    bulkSelectedQuestionIds.clear();
  }
  if (deletedQuestionIds.includes(state.editingQuestionId)) {
    resetQuestionForm();
  }
  saveState();
  render();
}

function syncExamMeta() {
  const course = currentCourse();
  els.examCourseInput.value = course.name;
  els.examTermSelect.value = state.examMeta.term;
  els.examNumberSelect.value = state.examMeta.examNumber;
  
  const courseGrade = course.grade || "";
  const currentVal = state.examMeta.className || "";
  const courseGradeNum = String(courseGrade).match(/\d+/)?.[0] || "";
  const currentValNum = String(currentVal).match(/\d+/)?.[0] || "";
  
  if (courseGradeNum && (currentValNum !== courseGradeNum || !currentVal)) {
    const branchMatch = currentVal.match(/\/[A-Za-z0-9]+/);
    const branch = branchMatch ? branchMatch[0] : "";
    state.examMeta.className = courseGradeNum + branch;
  }
  
  els.examClassInput.value = state.examMeta.className || "";
  els.examDurationInput.value = state.examMeta.duration;
  els.examDateInput.value = state.examMeta.date || "";
  els.examPageTargetSelect.value = state.examMeta.pageTarget || "auto";
  els.examColumnSelect.value = state.examMeta.columns || "1";
  els.examOutputTypeSelect.value = state.examMeta.outputType || "exam";
  els.answerKeyModeSelect.value = state.examMeta.answerKeyMode || "answers";
  els.examInstructionInput.value = state.examMeta.instruction;
}

function syncSettings() {
  els.schoolNameInput.value = state.settings.schoolName;
  els.academicYearInput.value = state.settings.academicYear;
  renderTeacherList();
}

function renderTeacherList() {
  els.teacherList.innerHTML = "";
  if (!state.settings.teachers.length) {
    els.teacherList.innerHTML = `<div class="teacher-empty">Henüz öğretmen eklenmedi.</div>`;
    return;
  }
  state.settings.teachers.forEach((teacher, index) => {
    const item = document.createElement("div");
    item.className = "teacher-item";
    item.innerHTML = `
      <span>${escapeHtml(teacher)}</span>
      <button type="button" aria-label="Öğretmeni kaldır">×</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      state.settings.teachers.splice(index, 1);
      saveState();
      renderTeacherList();
    });
    els.teacherList.append(item);
  });
}

function setView(view) {
  if (view === "question") {
    if (els.questionEditorDialog && !els.questionEditorDialog.open) {
      els.questionEditorDialog.showModal();
    }
    if (!state.currentView || state.currentView === "question") {
      setView("bank");
    }
    return;
  }
  state.currentView = view;
  document.body.classList.toggle("settings-mode", view === "settings");
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === view));
  if (els.appNavMobileSelect) {
    els.appNavMobileSelect.value = view;
  }
  document.querySelectorAll(".view").forEach((panel) => panel.classList.toggle("is-active", panel.id === `${view}View`));
  document.querySelector("#settingsBtn").classList.toggle("is-active", view === "settings");
  saveState();
}

function toggleQuestion(id) {
  const basketIds = basketIdsForCourse();
  const courseId = currentCourse().id;
  const wasSelected = basketIds.includes(id);
  if (wasSelected) {
    setBasketIdsForCourse(basketIds.filter((questionId) => questionId !== id));
  } else {
    setBasketIdsForCourse([...basketIds, id]);
  }
  const token = Date.now();
  cartFeedback = { courseId, type: wasSelected ? "removed" : "added", token };
  saveState();
  render();
  setTimeout(() => {
    if (cartFeedback?.token === token) {
      cartFeedback = null;
      renderCourses();
    }
  }, 950);
  if (els.questionPreviewDialog.open && currentPreviewQuestionId === id) {
    renderQuestionPreview();
  }
}

function updateQuestionPoints(id, value) {
  const points = Math.min(100, Math.max(1, Number(value || 1)));
  state.questions = state.questions.map((question) => question.id === id ? { ...question, points } : question);
  saveState();
  renderMetrics();
  renderQuestions();
  renderSelectedQuestions();
  renderExamCart();
  renderExamArchive();
  renderExamAnalysis();
  if (els.questionPreviewDialog.open && currentPreviewQuestionId === id) {
    renderQuestionPreview();
  }
}

function editQuestion(id) {
  const storedQuestion = state.questions.find((item) => item.id === id);
  if (!storedQuestion) return;
  const question = normalizeQuestion(storedQuestion);
  state.editingQuestionId = id;
  els.deleteQuestionBtn.hidden = false;
  
  const titleEl = document.querySelector("#questionEditorTitle");
  if (titleEl) titleEl.textContent = "Soru Düzenle";
  
  els.questionType.value = question.type;
  els.questionCourse.value = question.courseId;
  renderCurriculumSelectors(question.topic, question.outcome);
  els.questionGrade.value = question.grade || gradeValueForCourse(courseForQuestionForm());
  els.questionDifficulty.value = question.difficulty;
  els.questionExamScope.value = examScopeValue(question);
  els.questionPoints.value = question.points;
  els.questionTags.value = question.tags.join(", ");
  els.questionNote.value = question.note;
  els.questionContent.innerHTML = question.content;
  els.answerContent.innerHTML = question.answer;
  renderChoiceEditor(question.choices, question.correctChoiceId);
  els.correctBoolean.value = String(question.correctBoolean);
  els.acceptedAnswers.value = question.acceptedAnswers.join("\n");
  updateTypePanels();
  setView("question");
}

function resetQuestionForm() {
  state.editingQuestionId = null;
  els.deleteQuestionBtn.hidden = true;
  
  const titleEl = document.querySelector("#questionEditorTitle");
  if (titleEl) titleEl.textContent = "Yeni Soru Ekle";
  
  els.questionType.value = "open";
  els.questionCourse.value = state.selectedCourseId;
  renderCurriculumSelectors("", "");
  syncQuestionGradeFromCourse(true);
  els.questionDifficulty.value = "Orta";
  els.questionExamScope.value = "";
  els.questionPoints.value = 10;
  els.questionTags.value = "";
  els.questionNote.value = "";
  els.questionContent.innerHTML = "";
  els.answerContent.innerHTML = "";
  renderChoiceEditor(choiceLabels.slice(0, 4).map((label) => ({ id: label, label, text: "" })), "A");
  els.correctBoolean.value = "true";
  els.acceptedAnswers.value = "";
  updateTypePanels();
}

function updateTypePanels() {
  const type = els.questionType.value;
  const mode = editorModes[type] || editorModes.open;
  els.questionPromptLabel.textContent = mode.promptLabel;
  els.answerLabel.textContent = mode.answerLabel;
  els.questionContent.dataset.placeholder = mode.questionPlaceholder;
  els.answerContent.dataset.placeholder = mode.answerPlaceholder;
  els.multipleChoicePanel.classList.toggle("is-active", type === "multipleChoice");
  els.trueFalsePanel.classList.toggle("is-active", type === "trueFalse");
  els.shortAnswerPanel.classList.toggle("is-active", type === "shortAnswer");
}

function renderChoiceEditor(choices, correctChoiceId) {
  els.choiceList.innerHTML = "";
  const normalizedChoices = choices.length ? choices : choiceLabels.slice(0, 4).map((label) => ({ id: label, label, text: "" }));
  normalizedChoices.forEach((choice, index) => {
    const row = document.createElement("div");
    row.className = "choice-row";
    row.dataset.choiceId = choice.id;
    row.innerHTML = `
      <span class="choice-label">${choice.label}</span>
      <input type="text" value="${escapeHtml(choice.text)}" placeholder="${choice.label} seçeneği" />
      <button class="choice-remove" type="button" ${normalizedChoices.length <= 2 ? "disabled" : ""} title="Seçeneği sil">×</button>
    `;
    row.querySelector("button").addEventListener("click", () => {
      if (els.choiceList.children.length <= 2) return;
      row.remove();
      refreshChoiceLabels();
    });
    els.choiceList.append(row);
  });
  refreshChoiceLabels(correctChoiceId);
}

function refreshChoiceLabels(preferredCorrectId = els.correctChoice.value) {
  [...els.choiceList.children].forEach((row, index) => {
    const label = choiceLabels[index];
    row.dataset.choiceId = label;
    row.querySelector(".choice-label").textContent = label;
    row.querySelector("input").placeholder = `${label} seçeneği`;
  });
  els.correctChoice.innerHTML = "";
  [...els.choiceList.children].forEach((row, index) => {
    const label = choiceLabels[index];
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    els.correctChoice.append(option);
  });
  els.correctChoice.value = [...els.correctChoice.options].some((option) => option.value === preferredCorrectId)
    ? preferredCorrectId
    : "A";
  [...els.choiceList.querySelectorAll(".choice-remove")].forEach((button) => {
    button.disabled = els.choiceList.children.length <= 2;
  });
}

function getChoicesFromEditor() {
  return [...els.choiceList.children].map((row, index) => ({
    id: choiceLabels[index],
    label: choiceLabels[index],
    text: row.querySelector("input").value.trim()
  }));
}

function saveQuestion(event) {
  event.preventDefault();
  clearResizableSelection();
  const content = cleanEditorHtmlForSave(els.questionContent.innerHTML).trim();
  if (!stripHtml(content)) {
    showToast("Soru metni boş olamaz.", "warning");
    return;
  }
  const now = new Date().toISOString();
  const choices = getChoicesFromEditor();
  const [examTerm = "", examNumber = ""] = els.questionExamScope.value.split("-");
  const payload = {
    type: els.questionType.value,
    courseId: els.questionCourse.value,
    topic: els.questionTopic.value.trim(),
    outcome: els.questionOutcome.value.trim(),
    grade: els.questionGrade.value.trim(),
    difficulty: els.questionDifficulty.value,
    examTerm,
    examNumber,
    points: Math.min(100, Math.max(1, Number(els.questionPoints.value || 10))),
    tags: els.questionTags.value.split(",").map((tag) => tag.trim()).filter(Boolean),
    note: els.questionNote.value.trim(),
    content,
    answer: cleanEditorHtmlForSave(els.answerContent.innerHTML).trim(),
    choices,
    correctChoiceId: els.correctChoice.value || choices[0]?.id || "A",
    correctBoolean: els.correctBoolean.value === "true",
    acceptedAnswers: els.acceptedAnswers.value.split("\n").map((answer) => answer.trim()).filter(Boolean),
    updatedAt: now
  };

  if (payload.type === "multipleChoice" && choices.filter((choice) => choice.text.trim()).length < 2) {
    showToast("Çoktan seçmeli soru için en az iki seçenek girin.", "warning");
    return;
  }

  if (state.editingQuestionId) {
    state.questions = state.questions.map((question) =>
      question.id === state.editingQuestionId ? { ...question, ...payload } : question
    );
    showToast("Soru başarıyla güncellendi.", "success");
  } else {
    const id = uid("q");
    state.questions.unshift({ id, ...payload, createdAt: now });
    state.editingQuestionId = id;
    showToast("Yeni soru başarıyla eklendi.", "success");
  }

  state.selectedCourseId = payload.courseId;
  saveState();
  render();
  
  editQuestion(state.editingQuestionId);
}

async function deleteQuestionById(id) {
  if (!id || !state.questions.some((question) => question.id === id)) return false;
  const confirmed = await appConfirm("Bu soru silinsin mi?", { title: "Soruyu sil", okText: "Sil" });
  if (!confirmed) return false;
  state.questions = state.questions.filter((question) => question.id !== id);
  Object.keys(state.examBaskets || {}).forEach((courseId) => {
    setBasketIdsForCourse(basketIdsForCourse(courseId).filter((questionId) => questionId !== id), courseId);
  });
  bulkSelectedQuestionIds.delete(id);
  if (state.editingQuestionId === id) {
    resetQuestionForm();
  }
  if (currentPreviewQuestionId === id) {
    previewQuestionIds = previewQuestionIds.filter((questionId) => questionId !== id);
    currentPreviewQuestionId = previewQuestionIds[0] || "";
    if (!currentPreviewQuestionId && els.questionPreviewDialog.open) {
      els.questionPreviewDialog.close();
    }
  }
  saveState();
  render();
  if (els.questionPreviewDialog.open && currentPreviewQuestionId) {
    renderQuestionPreview();
  }
  showToast("Soru silindi.");
  return true;
}

function toggleVisibleQuestionSelection() {
  const visibleIds = filteredQuestions().map((question) => question.id);
  if (!visibleIds.length) return;
  const allVisibleSelected = visibleIds.every((id) => bulkSelectedQuestionIds.has(id));
  visibleIds.forEach((id) => {
    if (allVisibleSelected) {
      bulkSelectedQuestionIds.delete(id);
    } else {
      bulkSelectedQuestionIds.add(id);
    }
  });
  renderQuestions();
}

async function deleteBulkQuestions() {
  const selectedIds = selectedBulkQuestions();
  if (!selectedIds.length) return;
  const confirmed = await appConfirm(`${selectedIds.length} soru kalıcı olarak silinsin mi?`, {
    title: "Seçili soruları sil",
    okText: "Sil"
  });
  if (!confirmed) return;
  const selectedIdSet = new Set(selectedIds);
  state.questions = state.questions.filter((question) => !selectedIdSet.has(question.id));
  Object.keys(state.examBaskets || {}).forEach((courseId) => {
    setBasketIdsForCourse(basketIdsForCourse(courseId).filter((questionId) => !selectedIdSet.has(questionId)), courseId);
  });
  if (selectedIdSet.has(state.editingQuestionId)) {
    resetQuestionForm();
  }
  if (selectedIdSet.has(currentPreviewQuestionId)) {
    previewQuestionIds = previewQuestionIds.filter((questionId) => !selectedIdSet.has(questionId));
    currentPreviewQuestionId = previewQuestionIds[0] || "";
    if (!currentPreviewQuestionId && els.questionPreviewDialog.open) {
      els.questionPreviewDialog.close();
    }
  }
  bulkSelectedQuestionIds.clear();
  saveState();
  render();
  showToast(`${selectedIds.length} soru silindi.`);
}

async function deleteCurrentQuestion() {
  if (!state.editingQuestionId) return;
  await deleteQuestionById(state.editingQuestionId);
}

function randomPick() {
  const count = Math.max(1, Number(els.randomCount.value || 1));
  const pool = questionsForCurrentCourse().filter((question) => {
    const scopeMatches = !els.randomScope.value || (
      question.examTerm === state.examMeta.term && question.examNumber === state.examMeta.examNumber
    );
    return (
      (!els.randomTopic.value || question.topic === els.randomTopic.value) &&
      (!els.randomDifficulty.value || question.difficulty === els.randomDifficulty.value) &&
      scopeMatches
    );
  });
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  setBasketIdsForCourse([...basketIdsForCourse(), ...shuffled.map((question) => question.id)]);
  saveState();
  render();
}

function clearSelectedForCurrentCourse() {
  setBasketIdsForCourse([]);
  saveState();
  render();
}

function insertTableOfSize(rows, cols) {
  focusActiveEditor();
  const tableRows = Array.from({ length: rows }, (_, rowIndex) => {
    const cells = Array.from({ length: cols }, (_, colIndex) => {
      const tag = rowIndex === 0 ? "th" : "td";
      const text = rowIndex === 0 ? `Başlık ${colIndex + 1}` : "Veri";
      return `<${tag}>${text}</${tag}>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  document.execCommand("insertHTML", false, `<table data-resizable="true" style="width: 100%; max-width: 100%; font-family: 'Segoe UI Semibold', 'Segoe UI', -apple-system, sans-serif; font-size: 11pt;"><tbody>${tableRows}</tbody></table><p><br></p>`);
}

function journalRowTemplate(row = {}, index = 0) {
  const isSubaccount = Boolean(row.isSubaccount || row.subaccount || isJournalSubaccountCode(row.code));
  const codePlaceholder = row.codePlaceholder || "100";
  const namePlaceholder = row.namePlaceholder || "Kasa Hesabı";
  return `
    <div class="journal-entry-row ${isSubaccount ? "is-subaccount-row" : ""}" data-journal-row>
      <input class="journal-code-input" type="text" value="${escapeHtml(row.code || "")}" placeholder="${escapeHtml(codePlaceholder)}" list="journalAccountCodeList" aria-label="Hesap kodu ${index + 1}" />
      <input class="journal-name-input" type="text" value="${escapeHtml(row.name || "")}" placeholder="${escapeHtml(namePlaceholder)}" aria-label="Hesap adı ${index + 1}" />
      <label class="journal-subaccount-toggle" title="Alt hesap olarak göster">
        <input class="journal-subaccount-input" type="checkbox" ${isSubaccount ? "checked" : ""} />
        <span>Alt</span>
      </label>
      <input class="journal-debit-input" type="number" min="0" step="0.01" value="${row.debit || ""}" placeholder="0,00" aria-label="Borç ${index + 1}" />
      <input class="journal-credit-input" type="number" min="0" step="0.01" value="${row.credit || ""}" placeholder="0,00" aria-label="Alacak ${index + 1}" />
      <button class="journal-remove-row" type="button" title="Satırı sil">×</button>
    </div>
  `;
}

function journalAccountNameForCode(code) {
  const normalized = String(code || "").trim();
  if (!/^\d{3}$/.test(normalized)) return "";
  return JOURNAL_ACCOUNT_PLAN[normalized] || "";
}

function syncJournalAccountNameForRow(rowEl) {
  if (!rowEl) return;
  const codeInput = rowEl.querySelector(".journal-code-input");
  const nameInput = rowEl.querySelector(".journal-name-input");
  const subaccountInput = rowEl.querySelector(".journal-subaccount-input");
  if (!codeInput || !nameInput) return;
  const shouldSkip = subaccountInput?.checked || isJournalSubaccountCode(codeInput.value);
  const accountName = shouldSkip ? "" : journalAccountNameForCode(codeInput.value);
  const canReplace = !nameInput.value.trim() || rowEl.dataset.accountNameAuto === "true";
  if (accountName && canReplace) {
    nameInput.value = accountName;
    rowEl.dataset.accountNameAuto = "true";
  } else if (!accountName && rowEl.dataset.accountNameAuto === "true") {
    nameInput.value = "";
    delete rowEl.dataset.accountNameAuto;
  }
}

function journalAccountCodeOptionsHtml() {
  return Object.entries(JOURNAL_ACCOUNT_PLAN)
    .map(([code, name]) => `<option value="${escapeHtml(code)}">${escapeHtml(name)}</option>`)
    .join("");
}

function journalNumber(value) {
  const number = Number(String(value || "").replace(",", "."));
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function formatJournalAmount(value) {
  const number = journalNumber(value);
  return number ? number.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
}

function parseJournalAmount(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function collectJournalEntryForm() {
  const dialog = ensureJournalEntryDialog();
  const isBlank = dialog.querySelector("#journalEntryBlank")?.checked || false;
  const collectedRows = [...dialog.querySelectorAll("[data-journal-row]")].map((row, index) => ({
    code: row.querySelector(".journal-code-input").value.trim(),
    name: row.querySelector(".journal-name-input").value.trim(),
    isSubaccount: row.querySelector(".journal-subaccount-input")?.checked || false,
    isAutoParent: row.dataset.autoParent === "true",
    index,
    debit: journalNumber(row.querySelector(".journal-debit-input").value),
    credit: journalNumber(row.querySelector(".journal-credit-input").value)
  }));
  const rows = isBlank
    ? collectedRows.map((row) => ({ ...row, code: "", name: "", isSubaccount: false, debit: 0, credit: 0 }))
    : collectedRows.filter((row) => row.code || row.name || row.debit || row.credit);

  return {
    date: dialog.querySelector("#journalEntryDate").value.trim(),
    description: dialog.querySelector("#journalEntryDescription").value.trim(),
    isBlank,
    rows
  };
}

function journalTotals(rows) {
  return rows.reduce((totals, row) => ({
    debit: totals.debit + journalNumber(row.debit),
    credit: totals.credit + journalNumber(row.credit)
  }), { debit: 0, credit: 0 });
}

function journalSubaccountParentCode(row, rows) {
  const code = String(row?.code || "").trim();
  if (isJournalSubaccountCode(code)) {
    const directParentCode = journalMainAccountCode(code);
    if (rows.some((candidate) => String(candidate?.code || "").trim() === directParentCode && !isJournalSubaccountRow(candidate))) {
      return directParentCode;
    }
  }
  for (let index = Number(row?.index) - 1; index >= 0; index -= 1) {
    const candidate = rows[index];
    if (candidate && !isJournalSubaccountRow(candidate) && candidate.code) {
      return String(candidate.code).trim();
    }
  }
  return "";
}

function journalParentCodesForRows(rows) {
  const parentCodes = new Set();
  rows.forEach((row) => {
    if (!isJournalSubaccountRow(row)) return;
    const parentCode = journalSubaccountParentCode(row, rows);
    if (parentCode) parentCodes.add(parentCode);
  });
  return parentCodes;
}

function journalEffectiveRows(rows) {
  const parentCodes = journalParentCodesForRows(rows);
  return rows.filter((row) => {
    if (isJournalSubaccountRow(row)) return true;
    return !parentCodes.has(String(row.code || "").trim());
  });
}

function journalChildTotalsByParent(rows) {
  const totals = new Map();
  rows.forEach((row) => {
    if (!isJournalSubaccountRow(row)) return;
    const parentCode = journalSubaccountParentCode(row, rows);
    if (!parentCode) return;
    const current = totals.get(parentCode) || { debit: 0, credit: 0 };
    current.debit += journalNumber(row.debit);
    current.credit += journalNumber(row.credit);
    totals.set(parentCode, current);
  });
  return totals;
}

function setJournalAmountInput(input, value) {
  input.value = value ? Number(value.toFixed(2)) : "";
}

function syncJournalParentAmounts() {
  const dialog = ensureJournalEntryDialog();
  const rowEls = [...dialog.querySelectorAll("[data-journal-row]")];
  const rows = rowEls.map((row, index) => ({
    code: row.querySelector(".journal-code-input").value.trim(),
    isSubaccount: row.querySelector(".journal-subaccount-input")?.checked || false,
    index,
    debit: journalNumber(row.querySelector(".journal-debit-input").value),
    credit: journalNumber(row.querySelector(".journal-credit-input").value)
  }));
  const childTotals = journalChildTotalsByParent(rows);

  rowEls.forEach((rowEl) => {
    rowEl.classList.toggle("is-subaccount-row", rowEl.querySelector(".journal-subaccount-input")?.checked || false);
    const code = rowEl.querySelector(".journal-code-input").value.trim();
    const debitInput = rowEl.querySelector(".journal-debit-input");
    const creditInput = rowEl.querySelector(".journal-credit-input");
    const totals = childTotals.get(code);
    const wasAutoParent = rowEl.dataset.autoParent === "true";

    if (totals && !(rowEl.querySelector(".journal-subaccount-input")?.checked)) {
      rowEl.dataset.autoParent = "true";
      rowEl.classList.add("is-auto-parent-row");
      setJournalAmountInput(debitInput, totals.debit);
      setJournalAmountInput(creditInput, totals.credit);
      debitInput.readOnly = true;
      creditInput.readOnly = true;
    } else {
      if (wasAutoParent) {
        debitInput.value = "";
        creditInput.value = "";
      }
      delete rowEl.dataset.autoParent;
      rowEl.classList.remove("is-auto-parent-row");
      debitInput.readOnly = false;
      creditInput.readOnly = false;
    }
  });
}

function updateJournalEntrySummary() {
  const dialog = ensureJournalEntryDialog();
  syncJournalParentAmounts();
  const { rows } = collectJournalEntryForm();
  const isBlank = dialog.querySelector("#journalEntryBlank")?.checked || false;
  const rowCount = dialog.querySelectorAll("[data-journal-row]").length || rows.length || 1;
  const totals = journalTotals(journalEffectiveRows(rows));
  const diff = Math.abs(totals.debit - totals.credit);
  const summary = dialog.querySelector("#journalEntrySummary");
  const insertBtn = dialog.querySelector("#journalEntryInsertBtn");
  const balanceBtn = dialog.querySelector("#journalEntryBalanceBtn");
  if (isBlank) {
    summary.textContent = `${rowCount} satır boş yevmiye`;
    summary.classList.remove("is-balanced", "is-unbalanced");
    if (balanceBtn) balanceBtn.disabled = true;
    insertBtn.textContent = editingJournalTable ? "Boş Yevmiyeyi Güncelle" : "Boş Yevmiyeyi Ekle";
    return;
  }
  if (balanceBtn) balanceBtn.disabled = false;
  const status = diff < 0.005 ? "Dengede" : `Fark: ${formatJournalAmount(diff)}`;
  summary.textContent = `Borç ${formatJournalAmount(totals.debit) || "0,00"} | Alacak ${formatJournalAmount(totals.credit) || "0,00"} | ${status}`;
  summary.classList.toggle("is-balanced", diff < 0.005 && (totals.debit > 0 || totals.credit > 0));
  summary.classList.toggle("is-unbalanced", diff >= 0.005);
  insertBtn.textContent = editingJournalTable ? "Yevmiyeyi Güncelle" : "Yevmiyeyi Ekle";
}

function addJournalEntryRow(row = {}) {
  const dialog = ensureJournalEntryDialog();
  const rowsEl = dialog.querySelector("#journalEntryRows");
  rowsEl.insertAdjacentHTML("beforeend", journalRowTemplate(row, rowsEl.children.length));
  updateJournalEntrySummary();
}

function emptyJournalEntryRows() {
  return [
    { code: "", name: "", debit: "", credit: "", codePlaceholder: "100", namePlaceholder: "Kasa Hesabı" },
    { code: "", name: "", debit: "", credit: "" }
  ];
}

function parseJournalEntryTable(table) {
  if (!table || table.dataset.journalEntry !== "true") {
    return { date: "", description: "", isBlank: false, rows: emptyJournalEntryRows() };
  }
  const isBlank = table.dataset.blank === "true";
  const titleText = table.querySelector(".journal-entry-date-cell")?.textContent.trim()
    || table.querySelector(".journal-entry-title-row th")?.textContent.trim()
    || "";
  const parsedDate = /^\.*\/\.*\/20\.*$/.test(titleText)
    ? ""
    : /^Yevmiye Maddesi\s*-\s*/i.test(titleText)
    ? titleText.replace(/^Yevmiye Maddesi\s*-\s*/i, "").trim()
    : (/^Yevmiye Maddesi$/i.test(titleText) ? "" : titleText);
  const descriptionText = table.querySelector(".journal-entry-desc-row th")?.textContent.trim() || "";
  const parsedDescription = descriptionText.replace(/^Açıklama:\s*/i, "").trim();
  const rows = [...table.querySelectorAll("tbody tr")].map((tr) => {
    const cells = [...tr.children];
    if (cells.length === 3) {
      const accountText = cells[0]?.textContent.trim() || "";
      const accountParts = accountText.match(/^(\S+)\s+(.+)$/);
      return {
        code: tr.dataset.code || accountParts?.[1] || "",
        name: tr.dataset.name || accountParts?.[2] || accountText,
        isSubaccount: tr.dataset.subaccount === "true" || cells[0]?.classList.contains("is-subaccount") || false,
        debit: parseJournalAmount(tr.dataset.debit || cells[1]?.textContent),
        credit: parseJournalAmount(tr.dataset.credit || cells[2]?.textContent)
      };
    }
    const accountCell = cells.find(cell => cell.classList.contains("journal-account") && cell.textContent.trim()) || cells[0];
    const accountText = (accountCell?.querySelector(".journal-account-text")?.textContent || accountCell?.textContent || "")
      .replace(/\s*-\s*\([^)]*\)\s*$/, "")
      .trim();
    const accountParts = accountText.match(/^(\S+)\s+(.+)$/);
    return {
      code: tr.dataset.code || accountParts?.[1] || accountText,
      name: tr.dataset.name || accountParts?.[2] || "",
      isSubaccount: tr.dataset.subaccount === "true" || accountCell?.classList.contains("is-subaccount") || false,
      debit: parseJournalAmount(tr.dataset.debit || cells[cells.length - 2]?.textContent),
      credit: parseJournalAmount(tr.dataset.credit || cells[cells.length - 1]?.textContent)
    };
  });
  return {
    date: table.dataset.date || parsedDate || "",
    description: table.dataset.description || parsedDescription || "",
    isBlank,
    rows: rows.length ? rows : emptyJournalEntryRows()
  };
}

function isJournalSubaccountCode(code) {
  return /^\d+\.\d+/.test(String(code || "").trim());
}

function isJournalSubaccountRow(row) {
  return Boolean(row?.isSubaccount || row?.subaccount || isJournalSubaccountCode(row?.code));
}

function journalMainAccountCode(code) {
  return String(code || "").trim().split(".")[0];
}

function renderJournalEntryTable(entry) {
  const rows = entry.rows.length ? entry.rows : emptyJournalEntryRows();
  const isBlank = Boolean(entry.isBlank || entry.blank);
  const parentCodes = journalParentCodesForRows(rows);
  const childTotals = journalChildTotalsByParent(rows);
  const title = escapeHtml(entry.date || "...../...../20.....");
  const descriptionRow = `<tr class="journal-entry-desc-row"><th colspan="4">Açıklama:${entry.description ? ` ${escapeHtml(entry.description)}` : ""}</th></tr>`;
  const bodyRows = rows.map((row) => {
    if (isBlank) {
      return `
    <tr data-code="" data-name="" data-subaccount="false" data-debit="0" data-credit="0">
      <td class="journal-account is-debit journal-account-debit-side">&nbsp;</td>
      <td class="journal-account is-debit journal-account-credit-side">&nbsp;</td>
      <td class="journal-amount">&nbsp;</td>
      <td class="journal-amount">&nbsp;</td>
    </tr>
  `;
    }
    const isSubaccount = isJournalSubaccountRow(row);
    const isParentWithSubaccounts = parentCodes.has(String(row.code || "").trim()) && !isSubaccount;
    const childTotalsForParent = isParentWithSubaccounts ? childTotals.get(String(row.code || "").trim()) : null;
    const debit = isSubaccount ? 0 : isParentWithSubaccounts ? childTotalsForParent?.debit || 0 : row.debit;
    const credit = isSubaccount ? 0 : isParentWithSubaccounts ? childTotalsForParent?.credit || 0 : row.credit;
    const inlineAmount = isSubaccount ? formatJournalAmount(journalNumber(row.debit) || journalNumber(row.credit)) : "";
    const isCredit = isSubaccount
      ? journalNumber(row.credit) && !journalNumber(row.debit)
      : journalNumber(credit) && !journalNumber(debit);
    const accountClass = [
      "journal-account",
      isCredit ? "is-credit" : "is-debit",
      isSubaccount ? "is-subaccount" : ""
    ].filter(Boolean).join(" ");
    const accountText = escapeHtml([row.code, row.name].filter(Boolean).join(" "));
    const inlineAmountHtml = inlineAmount ? `<span class="journal-subaccount-amount">- (${inlineAmount})</span>` : "";
    const accountContent = `<span class="journal-account-side"><span class="journal-account-text">${accountText}</span>${inlineAmountHtml}</span>`;
    const debitAccountCell = isCredit ? "" : accountContent;
    const creditAccountCell = isCredit ? accountContent : "";
    return `
    <tr data-code="${escapeHtml(row.code)}" data-name="${escapeHtml(row.name)}" data-subaccount="${isSubaccount ? "true" : "false"}" data-debit="${journalNumber(row.debit)}" data-credit="${journalNumber(row.credit)}">
      <td class="${accountClass} journal-account-debit-side">${debitAccountCell}</td>
      <td class="${accountClass} journal-account-credit-side">${creditAccountCell}</td>
      <td class="journal-amount">${formatJournalAmount(debit)}</td>
      <td class="journal-amount">${formatJournalAmount(credit)}</td>
    </tr>
  `;
  }).join("");

  return `
    <table class="journal-entry-table ${isBlank ? "is-blank-journal" : ""}" data-journal-entry="true" data-resizable="true" data-date="${escapeHtml(entry.date)}" data-description="${escapeHtml(entry.description)}" data-blank="${isBlank ? "true" : "false"}" style="width:100%; max-width:100%; font-family:'Segoe UI Semibold', 'Segoe UI', -apple-system, sans-serif; font-size:11pt;">
      <colgroup>
        <col class="journal-account-debit-col">
        <col class="journal-account-credit-col">
        <col class="journal-amount-col">
        <col class="journal-amount-col">
      </colgroup>
      <thead>
        <tr>
          <th class="journal-entry-date-cell" colspan="2">${title}</th>
          <th>Borç</th>
          <th>Alacak</th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
      <tfoot>${descriptionRow}</tfoot>
    </table>
  `;
}

function normalizeJournalEntryTablesHtml(html = "") {
  if (!String(html || "").includes("data-journal-entry")) return html || "";
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html || "";
  wrapper.querySelectorAll('table[data-journal-entry="true"]').forEach((table) => {
    table.outerHTML = renderJournalEntryTable(parseJournalEntryTable(table));
  });
  return wrapper.innerHTML;
}

function questionContentHtml(question, mode = "exam", { includeSupplements = true } = {}) {
  const content = normalizeJournalEntryTablesHtml(question.content || "");
  return `${content}${includeSupplements ? renderQuestionSupplements(question, mode) : ""}`;
}

function fillJournalEntryDialog(entry) {
  const dialog = ensureJournalEntryDialog();
  dialog.querySelector("#journalEntryDate").value = entry.date || "";
  dialog.querySelector("#journalEntryDescription").value = entry.description || "";
  dialog.querySelector("#journalEntryBlank").checked = Boolean(entry.isBlank || entry.blank);
  dialog.querySelector("#journalEntryRows").innerHTML = "";
  (entry.rows?.length ? entry.rows : emptyJournalEntryRows()).forEach(addJournalEntryRow);
  updateJournalEntrySummary();
}

function balanceJournalEntryRows() {
  const dialog = ensureJournalEntryDialog();
  const rows = [...dialog.querySelectorAll("[data-journal-row]")];
  const entry = collectJournalEntryForm();
  const totals = journalTotals(journalEffectiveRows(entry.rows));
  const diff = +(totals.debit - totals.credit).toFixed(2);
  if (Math.abs(diff) < 0.005) {
    showToast("Yevmiye maddesi zaten dengede.", "success");
    return;
  }

  const targetClass = diff > 0 ? ".journal-credit-input" : ".journal-debit-input";
  let targetRow = rows.find((row) => !journalNumber(row.querySelector(".journal-debit-input").value) && !journalNumber(row.querySelector(".journal-credit-input").value));
  if (!targetRow) {
    addJournalEntryRow();
    targetRow = [...dialog.querySelectorAll("[data-journal-row]")].at(-1);
  }
  targetRow.querySelector(targetClass).value = Math.abs(diff).toFixed(2);
  updateJournalEntrySummary();
}

function saveJournalEntryFromDialog(event) {
  event.preventDefault();
  syncJournalParentAmounts();
  const entry = collectJournalEntryForm();
  if (!entry.rows.length) {
    showToast("En az bir yevmiye satırı girin.", "warning");
    return;
  }
  if (!entry.isBlank && !entry.rows.some((row) => row.debit || row.credit)) {
    showToast("Borç veya alacak tutarı girin.", "warning");
    return;
  }
  const totals = journalTotals(journalEffectiveRows(entry.rows));
  if (!entry.isBlank && Math.abs(totals.debit - totals.credit) >= 0.005) {
    showToast("Borç ve alacak toplamları eşit değil. Yine de ekleyebilirsiniz; tablo farkı gösterecek.", "warning");
  }

  const html = renderJournalEntryTable(entry);
  if (editingJournalTable?.isConnected) {
    editingJournalTable.outerHTML = html;
    clearResizableSelection();
  } else {
    insertHtmlIntoActiveEditor(`${html}<p><br></p>`);
  }
  editingJournalTable = null;
  ensureJournalEntryDialog().close();
}

function ensureJournalEntryDialog() {
  if (journalEntryDialog) return journalEntryDialog;
  journalEntryDialog = document.createElement("dialog");
  journalEntryDialog.id = "journalEntryDialog";
  journalEntryDialog.className = "journal-entry-dialog";
  journalEntryDialog.innerHTML = `
    <form class="dialog-body journal-entry-form" id="journalEntryForm">
      <div class="journal-entry-heading">
        <div>
          <p class="eyebrow">Muhasebe</p>
          <h2>Yevmiye maddesi</h2>
        </div>
        <button class="course-dialog-close-btn" type="button" data-journal-close aria-label="Kapat">×</button>
      </div>
      <div class="journal-entry-meta">
        <label>
          <span>Tarih / madde no</span>
          <input id="journalEntryDate" type="text" placeholder="Örn. 01.06.2026 / 1" />
        </label>
        <label>
          <span>Açıklama</span>
          <input id="journalEntryDescription" type="text" placeholder="İşlem açıklaması" />
        </label>
      </div>
      <div class="journal-entry-grid-head" aria-hidden="true">
        <span>Hesap kodu</span>
        <span>Hesap adı</span>
        <span>Alt</span>
        <span>Borç</span>
        <span>Alacak</span>
        <span></span>
      </div>
      <div class="journal-entry-rows" id="journalEntryRows"></div>
      <datalist id="journalAccountCodeList">${journalAccountCodeOptionsHtml()}</datalist>
      <div class="journal-entry-tools">
        <button class="secondary-action" id="journalEntryAddRowBtn" type="button">Satır ekle</button>
        <button class="ghost-action" id="journalEntryBalanceBtn" type="button">Farkı dengele</button>
        <label class="journal-blank-toggle" title="Satır sayısı kadar boş yevmiye şablonu ekle">
          <input id="journalEntryBlank" type="checkbox" />
          <span>Boş</span>
        </label>
        <strong id="journalEntrySummary">Borç 0,00 | Alacak 0,00 | Dengede</strong>
      </div>
      <div class="dialog-actions">
        <button class="ghost-action" type="button" data-journal-close>Vazgeç</button>
        <button class="primary-action" id="journalEntryInsertBtn" type="submit">Yevmiyeyi Ekle</button>
      </div>
    </form>
  `;
  document.body.appendChild(journalEntryDialog);
  journalEntryDialog.querySelector("#journalEntryForm").addEventListener("submit", saveJournalEntryFromDialog);
  journalEntryDialog.querySelector("#journalEntryAddRowBtn").addEventListener("click", () => addJournalEntryRow());
  journalEntryDialog.querySelector("#journalEntryBalanceBtn").addEventListener("click", balanceJournalEntryRows);
  journalEntryDialog.querySelectorAll("[data-journal-close]").forEach((button) => {
    button.addEventListener("click", () => {
      editingJournalTable = null;
      journalEntryDialog.close();
    });
  });
  journalEntryDialog.addEventListener("input", (event) => {
    const row = event.target.closest?.("[data-journal-row]");
    if (row && event.target.classList.contains("journal-code-input")) {
      syncJournalAccountNameForRow(row);
    }
    if (row && event.target.classList.contains("journal-name-input")) {
      delete row.dataset.accountNameAuto;
    }
    if (row && event.target.classList.contains("journal-subaccount-input")) {
      syncJournalAccountNameForRow(row);
    }
    if (event.target.closest(".journal-entry-form")) updateJournalEntrySummary();
  });
  journalEntryDialog.addEventListener("change", (event) => {
    const row = event.target.closest?.("[data-journal-row]");
    if (row && event.target.classList.contains("journal-subaccount-input")) {
      syncJournalAccountNameForRow(row);
      updateJournalEntrySummary();
    }
  });
  journalEntryDialog.addEventListener("click", (event) => {
    const removeBtn = event.target.closest(".journal-remove-row");
    if (!removeBtn) return;
    const row = removeBtn.closest("[data-journal-row]");
    if (journalEntryDialog.querySelectorAll("[data-journal-row]").length <= 1) {
      row.querySelectorAll("input").forEach((input) => { input.value = ""; });
    } else {
      row.remove();
    }
    updateJournalEntrySummary();
  });
  return journalEntryDialog;
}

function openJournalEntryEditor(table = null) {
  editingJournalTable = table?.dataset?.journalEntry === "true" ? table : null;
  fillJournalEntryDialog(parseJournalEntryTable(editingJournalTable));
  const dialog = ensureJournalEntryDialog();
  if (!dialog.open) dialog.showModal();
  window.setTimeout(() => dialog.querySelector(".journal-code-input")?.focus(), 30);
}

function initJournalEntryTools() {
  document.querySelectorAll(".editor-tools").forEach((toolbar) => {
    if (toolbar.querySelector(".journal-entry-tool-btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "journal-entry-tool-btn";
    button.title = "Yevmiye maddesi ekle/düzenle";
    button.textContent = "Yev";
    button.addEventListener("mousedown", (event) => {
      activeToolbar = toolbar;
      activeRichEditor = toolbar.classList.contains("compact-tools") ? els.answerContent : els.questionContent;
      saveEditorSelection();
      event.preventDefault();
    });
    button.addEventListener("click", () => {
      const selectedJournal = selectedResizableElement?.dataset?.journalEntry === "true" ? selectedResizableElement : null;
      openJournalEntryEditor(selectedJournal);
    });
    const tableTool = toolbar.querySelector(".table-picker-wrapper");
    if (tableTool) {
      tableTool.insertAdjacentElement("afterend", button);
    } else {
      toolbar.appendChild(button);
    }
  });

  document.querySelectorAll(".rich-editor").forEach((editor) => {
    editor.addEventListener("dblclick", (event) => {
      const table = event.target.closest('table[data-journal-entry="true"]');
      if (!table || !editor.contains(table)) return;
      activeRichEditor = editor;
      activeToolbar = editor.id === "answerContent"
        ? document.querySelector(".editor-tools.compact-tools")
        : document.querySelector(".editor-tools:not(.compact-tools)");
      event.preventDefault();
      openJournalEntryEditor(table);
    });
  });
}

function insertImage(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    focusActiveEditor();
    document.execCommand("insertHTML", false, `<p><img src="${reader.result}" alt="Soru görseli" data-resizable="true" style="width: 70%; max-width: 100%; height: auto;"></p>`);
  };
  reader.readAsDataURL(file);
}

function ensureTableOverlays() {
  const activeDialog = document.querySelector("dialog[open]");
  const container = activeDialog || document.body;

  if (!tableActionsOverlay) {
    tableActionsOverlay = document.createElement("div");
    tableActionsOverlay.id = "editor-table-actions";
    tableActionsOverlay.className = "table-actions-overlay";
    tableActionsOverlay.innerHTML = `
      <div class="col-actions-group">
        <button type="button" class="action-btn col-delete" title="Sütunu Sil">-</button>
        <button type="button" class="action-btn col-add" title="Sütun Ekle">+</button>
      </div>
      <div class="row-actions-group">
        <button type="button" class="action-btn row-delete" title="Satırı Sil">-</button>
        <button type="button" class="action-btn row-add" title="Satır Ekle">+</button>
      </div>
      <button type="button" class="action-btn table-delete" title="Sil">🗑️</button>
    `;
    tableActionsOverlay.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    tableActionsOverlay.querySelector(".col-add").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleQuickColAdd();
    });
    tableActionsOverlay.querySelector(".col-delete").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleQuickColDelete();
    });
    tableActionsOverlay.querySelector(".row-add").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleQuickRowAdd();
    });
    tableActionsOverlay.querySelector(".row-delete").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleQuickRowDelete();
    });
    tableActionsOverlay.querySelector(".table-delete").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleQuickTableDelete();
    });
  }

  if (!resizeCornerHandle) {
    resizeCornerHandle = document.createElement("div");
    resizeCornerHandle.id = "editor-resize-handle-corner";
    resizeCornerHandle.className = "resize-handle-corner";
    resizeCornerHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleCornerMouseDown(e);
    });
  }

  if (tableActionsOverlay.parentElement !== container) {
    container.appendChild(tableActionsOverlay);
  }
  if (resizeCornerHandle.parentElement !== container) {
    container.appendChild(resizeCornerHandle);
  }
}

function positionTableOverlays(element, cell) {
  if (!tableActionsOverlay) return;
  
  const colActions = tableActionsOverlay.querySelector(".col-actions-group");
  const rowActions = tableActionsOverlay.querySelector(".row-actions-group");
  const tableDelete = tableActionsOverlay.querySelector(".table-delete");
  
  tableActionsOverlay.style.display = "block";
  
  if (element.tagName === "TABLE") {
    colActions.style.display = "flex";
    rowActions.style.display = "flex";
    tableDelete.title = "Tabloyu Sil";
    
    if (cell) {
      const cellRect = cell.getBoundingClientRect();
      const tableRect = element.getBoundingClientRect();
      
      const colLeft = cellRect.left + (cellRect.width / 2) - (colActions.offsetWidth / 2 || 24);
      const colTop = cellRect.top - (colActions.offsetHeight || 24) - 4;
      colActions.style.top = `${colTop}px`;
      colActions.style.left = `${colLeft}px`;
      
      const rowLeft = cellRect.left - (rowActions.offsetWidth || 24) - 4;
      const rowTop = cellRect.top + (cellRect.height / 2) - (rowActions.offsetHeight / 2 || 12);
      rowActions.style.top = `${rowTop}px`;
      rowActions.style.left = `${rowLeft}px`;
      
      const delLeft = tableRect.right - (tableDelete.offsetWidth || 20) - 2;
      const delTop = tableRect.top - (tableDelete.offsetHeight || 20) - 4;
      tableDelete.style.top = `${delTop}px`;
      tableDelete.style.left = `${delLeft}px`;
    }
  } else if (element.tagName === "IMG") {
    colActions.style.display = "none";
    rowActions.style.display = "none";
    tableDelete.title = "Görseli Sil";
    
    const imgRect = element.getBoundingClientRect();
    const delLeft = imgRect.right - (tableDelete.offsetWidth || 20) - 2;
    const delTop = imgRect.top - (tableDelete.offsetHeight || 20) - 4;
    tableDelete.style.top = `${delTop}px`;
    tableDelete.style.left = `${delLeft}px`;
  }
}

function positionCornerHandle() {
  if (!selectedResizableElement || !resizeCornerHandle) return;
  const rect = selectedResizableElement.getBoundingClientRect();
  
  resizeCornerHandle.style.display = "block";
  resizeCornerHandle.style.top = `${rect.bottom - 5}px`;
  resizeCornerHandle.style.left = `${rect.right - 5}px`;
}

function getTableDragTarget(table, clientX, clientY) {
  const tableRect = table.getBoundingClientRect();
  
  const isNearCornerX = Math.abs(clientX - tableRect.right) <= 8;
  const isNearCornerY = Math.abs(clientY - tableRect.bottom) <= 8;
  if (isNearCornerX && isNearCornerY) {
    return { type: 'table-corner', table, element: table };
  }

  const elements = document.elementsFromPoint(clientX, clientY);
  const cell = elements.find(el => el.tagName === 'TD' || el.tagName === 'TH');
  if (!cell || !table.contains(cell)) return null;

  const rect = cell.getBoundingClientRect();
  const rowIndex = cell.parentNode.rowIndex;
  const colIndex = cell.cellIndex;
  const threshold = 6;

  if (Math.abs(clientX - rect.right) <= threshold) {
    return { type: 'col-resize', table, colIndex, startSize: rect.width };
  }
  if (Math.abs(clientX - rect.left) <= threshold && colIndex > 0) {
    const prevCell = cell.parentNode.cells[colIndex - 1];
    return { type: 'col-resize', table, colIndex: colIndex - 1, startSize: prevCell ? prevCell.getBoundingClientRect().width : rect.width };
  }
  if (Math.abs(clientY - rect.bottom) <= threshold) {
    return { type: 'row-resize', table, rowIndex, startSize: rect.height };
  }
  if (Math.abs(clientY - rect.top) <= threshold && rowIndex > 0) {
    const prevRow = table.rows[rowIndex - 1];
    return { type: 'row-resize', table, rowIndex: rowIndex - 1, startSize: prevRow ? prevRow.getBoundingClientRect().height : rect.height };
  }

  return null;
}

function handleCornerMouseDown(e) {
  if (!selectedResizableElement) return;
  
  dragInfo = {
    type: 'table-corner',
    element: selectedResizableElement,
    startX: e.clientX,
    startY: e.clientY,
    startWidth: selectedResizableElement.getBoundingClientRect().width,
    startHeight: selectedResizableElement.getBoundingClientRect().height
  };
  
  document.addEventListener("mousemove", handleGlobalMouseMove);
  document.addEventListener("mouseup", handleGlobalMouseUp);
}

function handleGlobalMouseMove(e) {
  if (!dragInfo) return;
  
  e.preventDefault();
  
  if (dragInfo.type === 'col-resize') {
    const deltaX = e.clientX - dragInfo.startX;
    const newWidth = Math.max(20, dragInfo.startSize + deltaX);
    const table = dragInfo.table;
    const colIndex = dragInfo.colIndex;
    
    Array.from(table.rows).forEach(row => {
      const cell = row.cells[colIndex];
      if (cell) {
        cell.style.width = `${newWidth}px`;
      }
    });
    
    if (activeHoveredCell) positionTableOverlays(table, activeHoveredCell);
    positionCornerHandle();
  }
  
  else if (dragInfo.type === 'row-resize') {
    const deltaY = e.clientY - dragInfo.startY;
    const newHeight = Math.max(15, dragInfo.startSize + deltaY);
    const table = dragInfo.table;
    const rowIndex = dragInfo.rowIndex;
    
    const row = table.rows[rowIndex];
    if (row) {
      row.style.height = `${newHeight}px`;
    }
    
    if (activeHoveredCell) positionTableOverlays(table, activeHoveredCell);
    positionCornerHandle();
  }
  
  else if (dragInfo.type === 'table-corner') {
    const deltaX = e.clientX - dragInfo.startX;
    const deltaY = e.clientY - dragInfo.startY;
    const newWidthPx = Math.max(20, dragInfo.startWidth + deltaX);
    const newHeightPx = Math.max(20, dragInfo.startHeight + deltaY);
    const element = dragInfo.element;
    const editor = element.closest('.rich-editor');
    
    if (editor) {
      const editorWidth = editor.getBoundingClientRect().width || 1;
      const widthPercent = Math.max(10, Math.min(100, Math.round((newWidthPx / editorWidth) * 100)));
      element.style.width = `${widthPercent}%`;
      element.style.maxWidth = "100%";
      
      const rangeInput = document.getElementById("resizeRange");
      if (rangeInput) rangeInput.value = widthPercent;
    }
    
    element.style.height = `${newHeightPx}px`;
    
    positionCornerHandle();
    if (element.tagName === "TABLE" && activeHoveredCell) {
      positionTableOverlays(element, activeHoveredCell);
    } else if (element.tagName === "IMG") {
      positionTableOverlays(element, null);
    }
  }
}

function handleGlobalMouseUp(e) {
  if (dragInfo) {
    document.removeEventListener("mousemove", handleGlobalMouseMove);
    document.removeEventListener("mouseup", handleGlobalMouseUp);
    
    saveEditorSelection();
    dragInfo = null;
  }
}

function handleQuickColAdd() {
  if (!activeHoveredTable || !activeHoveredCell) return;
  const table = activeHoveredTable;
  const colIndex = activeHoveredCell.cellIndex;
  
  Array.from(table.rows).forEach(row => {
    const isHeader = row.parentNode.tagName === "THEAD" || row.rowIndex === 0;
    const cell = document.createElement(isHeader ? "th" : "td");
    cell.innerHTML = "Veri";
    const refCell = row.cells[colIndex];
    if (refCell) {
      cell.style.width = refCell.style.width;
      refCell.parentNode.insertBefore(cell, refCell.nextSibling);
    } else {
      row.appendChild(cell);
    }
  });
  
  if (tableActionsOverlay) tableActionsOverlay.style.display = "none";
  saveEditorSelection();
}

function handleQuickColDelete() {
  if (!activeHoveredTable || !activeHoveredCell) return;
  const table = activeHoveredTable;
  const colIndex = activeHoveredCell.cellIndex;
  
  Array.from(table.rows).forEach(row => {
    if (row.cells[colIndex]) {
      row.deleteCell(colIndex);
    }
  });
  
  const numCols = table.rows[0]?.cells.length || 0;
  if (numCols === 0) {
    table.remove();
    clearResizableSelection();
  } else {
    if (tableActionsOverlay) tableActionsOverlay.style.display = "none";
    saveEditorSelection();
  }
}

function handleQuickRowAdd() {
  if (!activeHoveredTable || !activeHoveredCell) return;
  const table = activeHoveredTable;
  const rowIndex = activeHoveredCell.parentNode.rowIndex;
  
  const newRow = table.insertRow(rowIndex + 1);
  const numCols = table.rows[0]?.cells.length || 1;
  for (let i = 0; i < numCols; i++) {
    const cell = newRow.insertCell(i);
    cell.innerHTML = "Veri";
    const refCell = table.rows[0]?.cells[i];
    if (refCell && refCell.style.width) {
      cell.style.width = refCell.style.width;
    }
  }
  
  if (tableActionsOverlay) tableActionsOverlay.style.display = "none";
  saveEditorSelection();
}

function handleQuickRowDelete() {
  if (!activeHoveredTable || !activeHoveredCell) return;
  const table = activeHoveredTable;
  const rowIndex = activeHoveredCell.parentNode.rowIndex;
  
  if (rowIndex >= 0 && table.rows[rowIndex]) {
    table.deleteRow(rowIndex);
  }
  
  if (table.rows.length === 0) {
    table.remove();
    clearResizableSelection();
  } else {
    if (tableActionsOverlay) tableActionsOverlay.style.display = "none";
    saveEditorSelection();
  }
}

function handleQuickTableDelete() {
  if (!activeHoveredTable) return;
  activeHoveredTable.remove();
  clearResizableSelection();
}

function selectResizableElement(element) {
  clearResizableSelection(false);
  selectedResizableElement = element;
  selectedResizableElement.classList.add("is-selected-media");
  selectedResizableElement.dataset.resizable = "true";
  
  ensureTableOverlays();

  if (resizePanel) {
    resizePanel.hidden = true;
  }
  positionCornerHandle();
}

function clearResizableSelection(hidePanel = true) {
  if (overlayHideTimeout) {
    clearTimeout(overlayHideTimeout);
    overlayHideTimeout = null;
  }
  if (selectedResizableElement) {
    selectedResizableElement.classList.remove("is-selected-media");
    if (selectedResizableElement.tagName === "TABLE") {
      selectedResizableElement.querySelectorAll("td, th").forEach(c => c.classList.remove("is-selected-cell"));
      delete selectedResizableElement.dataset.selectedCellRowIndex;
      delete selectedResizableElement.dataset.selectedCellColIndex;
    }
  }
  selectedResizableElement = null;
  activeHoveredTable = null;
  activeHoveredCell = null;
  
  if (hidePanel) {
    if (resizePanel) {
      resizePanel.hidden = true;
    }
    if (resizeCornerHandle) {
      resizeCornerHandle.style.display = "none";
    }
    if (tableActionsOverlay) {
      tableActionsOverlay.style.display = "none";
    }
  }
}

function positionResizePanel() {
  if (!selectedResizableElement || !resizePanel || resizePanel.hidden) return;
  const rect = selectedResizableElement.getBoundingClientRect();
  const panelRect = resizePanel.getBoundingClientRect();
  const top = Math.min(window.innerHeight - panelRect.height - 12, rect.bottom + 8);
  const left = Math.min(window.innerWidth - panelRect.width - 12, Math.max(12, rect.left));
  resizePanel.style.top = `${Math.max(12, top)}px`;
  resizePanel.style.left = `${left}px`;
}

function handleEditorMediaClick(event) {
  const media = event.target.closest("img, table");
  if (!media || !event.currentTarget.contains(media)) {
    clearResizableSelection();
    return;
  }
  
  if (media.tagName === "TABLE") {
    media.querySelectorAll("td, th").forEach(c => c.classList.remove("is-selected-cell"));
    const cell = event.target.closest("td, th");
    if (cell) {
      media.dataset.selectedCellRowIndex = cell.parentNode.rowIndex;
      media.dataset.selectedCellColIndex = cell.cellIndex;
      cell.classList.add("is-selected-cell");
      
      ensureTableOverlays();
      positionTableOverlays(media, cell);
    }
  } else if (media.tagName === "IMG") {
    event.preventDefault();
    ensureTableOverlays();
    positionTableOverlays(media, null);
  }
  selectResizableElement(media);
}

function focusActiveEditor() {
  activeRichEditor = activeRichEditor || els.questionContent;
  activeRichEditor.focus();
  const selection = window.getSelection();
  if (savedSelectionRange && !savedSelectionRange.collapsed && activeRichEditor.contains(savedSelectionRange.commonAncestorContainer)) {
    selection.removeAllRanges();
    selection.addRange(savedSelectionRange);
    return;
  }
  const currentRange = selection.rangeCount ? selection.getRangeAt(0) : null;
  if (currentRange && activeRichEditor.contains(currentRange.commonAncestorContainer)) {
    return;
  }

  selection.removeAllRanges();
  if (savedSelectionRange && activeRichEditor.contains(savedSelectionRange.commonAncestorContainer)) {
    selection.addRange(savedSelectionRange);
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(activeRichEditor);
  range.collapse(false);
  selection.addRange(range);
  savedSelectionRange = range.cloneRange();
}

function insertHtmlIntoActiveEditor(html) {
  activeRichEditor = activeRichEditor || els.questionContent;
  activeRichEditor.focus();
  const selection = window.getSelection();
  let range = savedSelectionRange;

  if (!range || !activeRichEditor.contains(range.commonAncestorContainer)) {
    range = document.createRange();
    range.selectNodeContents(activeRichEditor);
    range.collapse(false);
  }

  selection.removeAllRanges();
  selection.addRange(range);
  range.deleteContents();

  const fragment = range.createContextualFragment(html);
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  if (lastNode) {
    const nextRange = document.createRange();
    nextRange.setStartAfter(lastNode);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedSelectionRange = nextRange.cloneRange();
  } else {
    savedSelectionRange = range.cloneRange();
  }
  saveEditorSelection();
}

function commandActiveAtSelection(command, editor, range) {
  if (command === "bold") {
    const node = range.commonAncestorContainer;
    return nodeHasBoldContextWithin(node, editor);
  }
  try {
    return document.queryCommandState(command);
  } catch (_) {
    return false;
  }
}

function inlineFormattingElementForCommand(command) {
  if (command === "bold") return document.createElement("strong");
  if (command === "italic") return document.createElement("em");
  if (command === "underline") return document.createElement("u");
  if (command === "strikeThrough") return document.createElement("s");
  return null;
}

function prepareCollapsedInlineFormatting(command) {
  const selection = window.getSelection();
  if (!activeRichEditor || !selection.rangeCount || !selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  if (!activeRichEditor.contains(range.commonAncestorContainer)) return false;

  if (commandActiveAtSelection(command, activeRichEditor, range)) {
    document.execCommand(command, false, null);
    saveEditorSelection();
    return true;
  }

  const element = inlineFormattingElementForCommand(command);
  if (!element) return false;

  const marker = document.createTextNode("\u200b");
  element.appendChild(marker);
  range.insertNode(element);

  const nextRange = document.createRange();
  nextRange.setStart(marker, 1);
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);
  savedSelectionRange = nextRange.cloneRange();
  return true;
}

function stripBoldFormattingFromFragment(fragment) {
  fragment.querySelectorAll?.("b, strong").forEach(unwrapEditorElement);
  fragment.querySelectorAll?.("*").forEach((element) => {
    if (element.style) element.style.fontWeight = "";
  });
}

function selectionFragmentIsFullyBold(fragment) {
  const nodes = meaningfulEditorNodes(fragment);
  return nodes.length > 0 && nodes.every((node) => nodeHasBoldContextWithin(node, fragment));
}

function selectedRangeNodes(range, editor) {
  const nodes = [];
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
      if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue.replace(/\u200b/g, "").trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
      if (["IMG", "TABLE"].includes(node.tagName)) return NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_SKIP;
    }
  });
  let node = walker.nextNode();
  while (node) {
    nodes.push(node);
    node = walker.nextNode();
  }
  return nodes;
}

function selectedRangeIsFullyBold(range, editor) {
  const nodes = selectedRangeNodes(range, editor);
  return nodes.length > 0 && nodes.every((node) => nodeHasBoldContextWithin(node, editor));
}

function replaceSelectionWithFragment(range, fragment) {
  const selection = window.getSelection();
  const firstNode = fragment.firstChild;
  const lastNode = fragment.lastChild;
  range.deleteContents();
  range.insertNode(fragment);

  const nextRange = document.createRange();
  if (firstNode && lastNode && firstNode.parentNode && lastNode.parentNode) {
    nextRange.setStartBefore(firstNode);
    nextRange.setEndAfter(lastNode);
  } else {
    nextRange.selectNodeContents(activeRichEditor);
    nextRange.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(nextRange);
  savedSelectionRange = nextRange.cloneRange();
}

function toggleBoldForSelectedRange() {
  const selection = window.getSelection();
  if (!activeRichEditor || !selection.rangeCount || selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  if (!activeRichEditor.contains(range.commonAncestorContainer)) return false;

  const fragment = range.cloneContents();
  if (selectedRangeIsFullyBold(range, activeRichEditor) || selectionFragmentIsFullyBold(fragment)) {
    stripBoldFormattingFromFragment(fragment);
    const normalSpan = document.createElement("span");
    normalSpan.style.fontWeight = "normal";
    normalSpan.appendChild(fragment);
    const normalFragment = document.createDocumentFragment();
    normalFragment.appendChild(normalSpan);
    replaceSelectionWithFragment(range, normalFragment);
    return true;
  }

  const strong = document.createElement("strong");
  strong.appendChild(fragment);
  const wrapperFragment = document.createDocumentFragment();
  wrapperFragment.appendChild(strong);
  replaceSelectionWithFragment(range, wrapperFragment);
  return true;
}

function runEditorCommand(command, value = null) {
  focusActiveEditor();
  if (command === "removeFormat") {
    removeEditorFormattingToDefault();
    return;
  }
  if (command === "bold" && toggleBoldForSelectedRange()) {
    return;
  }
  if (["bold", "italic", "underline", "strikeThrough"].includes(command) && prepareCollapsedInlineFormatting(command)) {
    return;
  }
  document.execCommand(command, false, value);
  saveEditorSelection();
}

function clearDefaultEditorFontStyles(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
  if (element.style) {
    element.style.fontFamily = "";
    element.style.fontSize = "";
    element.style.lineHeight = "";
    element.style.color = "";
    element.style.backgroundColor = "";
    element.style.fontWeight = "";
    element.style.fontStyle = "";
    element.style.textDecoration = "";
  }
  if (element.tagName === "FONT") {
    element.removeAttribute("face");
    element.removeAttribute("size");
    element.removeAttribute("color");
  }
}

function unwrapEditorElement(element) {
  const parent = element?.parentNode;
  if (!parent) return;
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  element.remove();
}

function isEditorBoldElement(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
  if (element.tagName === "B" || element.tagName === "STRONG") return true;
  return isBoldFontWeightValue(element.style?.fontWeight);
}

function isBoldFontWeightValue(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "bold" || normalized === "bolder") return true;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric >= 600;
}

function isEditorInlineFormattingElement(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
  if (!EDITOR_INLINE_FORMAT_TAGS.has(element.tagName)) return false;
  if (["IMG", "TABLE", "TR", "TD", "TH"].includes(element.tagName)) return false;
  return true;
}

function meaningfulEditorNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue.replace(/\u200b/g, "").trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
      if (node !== root && ["IMG", "TABLE"].includes(node.tagName)) return NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_SKIP;
    }
  });
  let node = walker.nextNode();
  while (node) {
    nodes.push(node);
    node = walker.nextNode();
  }
  return nodes;
}

function nodeHasBoldContextWithin(node, root) {
  let current = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  while (current) {
    if (isEditorBoldElement(current)) return true;
    if (current === root) break;
    current = current.parentElement;
  }
  return false;
}

function blockContentIsFullyBold(block) {
  if (!block) return false;
  const nodes = meaningfulEditorNodes(block);
  return nodes.length > 0 && nodes.every((node) => nodeHasBoldContextWithin(node, block));
}

function blockEndsWithBoldFormatting(block) {
  if (!block) return false;
  if (blockNeedsNormalWeightWrapper(block)) return true;
  const nodes = meaningfulEditorNodes(block);
  const lastNode = nodes[nodes.length - 1];
  return Boolean(lastNode && nodeHasBoldContextWithin(lastNode, block));
}

function stripBoldFormattingFromBlock(block) {
  if (!block) return;
  const boldElements = Array.from(block.querySelectorAll("b, strong"));
  boldElements.forEach(unwrapEditorElement);
  [block, ...Array.from(block.querySelectorAll("*"))].forEach((element) => {
    if (element.style) element.style.fontWeight = "";
  });
}

function blockNeedsNormalWeightWrapper(block) {
  if (!block) return false;
  if (isEditorBoldElement(block)) return true;
  try {
    return isBoldFontWeightValue(window.getComputedStyle(block).fontWeight);
  } catch (_) {
    return false;
  }
}

function cleanEditorFormattingFragment(fragment) {
  if (!fragment) return;
  const elements = [
    ...(fragment.nodeType === Node.ELEMENT_NODE ? [fragment] : []),
    ...Array.from(fragment.querySelectorAll?.("*") || [])
  ];
  elements.forEach((element) => {
    const structural = ["TABLE", "THEAD", "TBODY", "TR", "TD", "TH", "IMG"].includes(element.tagName);
    clearDefaultEditorFontStyles(element);
    if (!structural) {
      element.removeAttribute("class");
    }
    if (isEditorInlineFormattingElement(element)) {
      unwrapEditorElement(element);
    }
  });
}

function resetEditorCommandStateToDefault() {
  ["bold", "italic", "underline", "strikeThrough"].forEach((command) => {
    try {
      if (document.queryCommandState(command)) {
        document.execCommand(command, false, null);
      }
    } catch (_) {}
  });
}

function restoreCaretAtNodePosition(marker) {
  const parent = marker.parentNode;
  if (!parent) return;
  const offset = Array.prototype.indexOf.call(parent.childNodes, marker);
  marker.remove();
  const selection = window.getSelection();
  const range = document.createRange();
  range.setStart(parent, Math.max(0, offset));
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  savedSelectionRange = range.cloneRange();
}

function splitFormattingAncestorsAtCaret(editor, { unwrapTrailing = false } = {}) {
  if (!editor) return;
  const selection = window.getSelection();
  if (!selection.rangeCount || !selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const marker = document.createTextNode("");
  range.insertNode(marker);
  let anchor = marker;
  let parent = anchor.parentElement;

  while (parent && parent !== editor) {
    if (!isEditorInlineFormattingElement(parent)) {
      parent = parent.parentElement;
      continue;
    }

    const grandParent = parent.parentNode;
    const trailingNodes = [];
    while (anchor.nextSibling) {
      trailingNodes.push(anchor.nextSibling);
    }

    grandParent.insertBefore(anchor, parent.nextSibling);
    if (trailingNodes.length) {
      if (unwrapTrailing) {
        trailingNodes.forEach((node) => grandParent.insertBefore(node, anchor.nextSibling));
      } else {
        const trailingWrapper = parent.cloneNode(false);
        clearDefaultEditorFontStyles(trailingWrapper);
        trailingNodes.forEach((node) => trailingWrapper.appendChild(node));
        grandParent.insertBefore(trailingWrapper, anchor.nextSibling);
      }
    }

    if (!parent.childNodes.length) parent.remove();
    parent = anchor.parentElement;
  }

  restoreCaretAtNodePosition(anchor);
}

function removeFormattingFromSelectedRange(editor, range) {
  const selection = window.getSelection();
  const fragment = range.extractContents();
  cleanEditorFormattingFragment(fragment);

  const firstNode = fragment.firstChild;
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  const nextRange = document.createRange();
  if (firstNode && lastNode && firstNode.parentNode && lastNode.parentNode) {
    nextRange.setStartBefore(firstNode);
    nextRange.setEndAfter(lastNode);
  } else {
    nextRange.selectNodeContents(editor);
    nextRange.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(nextRange);
  savedSelectionRange = nextRange.cloneRange();
  try {
    document.execCommand("removeFormat", false, null);
    if (selection.rangeCount) {
      normalizeFormattingRangeToDefault(editor, selection.getRangeAt(0));
    }
  } catch (_) {}
}

function normalizeFormattingRangeToDefault(editor, range) {
  if (!editor || !range) return;
  const common = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement;
  const scope = common && editor.contains(common) ? common : editor;
  if (scope !== editor) {
    clearDefaultEditorFontStyles(scope);
  }
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  let node = walker.currentNode;
  while (node) {
    clearDefaultEditorFontStyles(node);
    node = walker.nextNode();
  }
  editor.querySelectorAll("span:empty, font:empty").forEach((node) => node.remove());
}

function normalizeFormattingAtCaretToDefault(editor, range) {
  if (!editor || !range) return;
  let node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement;
  while (node && node !== editor) {
    clearDefaultEditorFontStyles(node);
    node = node.parentElement;
  }
}

function removeEditorFormattingToDefault() {
  focusActiveEditor();
  if (!activeRichEditor) return;
  const selection = window.getSelection();
  const range = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
  try {
    if (range && !range.collapsed) {
      removeFormattingFromSelectedRange(activeRichEditor, range);
    } else {
      document.execCommand("removeFormat", false, null);
      resetEditorCommandStateToDefault();
      normalizeFormattingAtCaretToDefault(activeRichEditor, range);
      if (range) {
        const block = nearestEditorBlock(range.commonAncestorContainer, activeRichEditor);
        if (block && block !== activeRichEditor) {
          cleanEditorFormattingFragment(block);
        }
      }
      splitFormattingAncestorsAtCaret(activeRichEditor);
    }
  } catch (_) {
    document.execCommand("removeFormat", false, null);
    activeRichEditor.querySelectorAll('[style*="font-family"], [style*="font-size"], [style*="font-weight"], font').forEach(clearDefaultEditorFontStyles);
  }
  activeRichEditor.style.fontFamily = "";
  activeRichEditor.style.fontSize = "";
  activeRichEditor.normalize();
  syncActiveToolbarDefaultFontSize();
  saveEditorSelection();
}

function nearestEditorBlock(node, editor) {
  let current = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  while (current && current !== editor) {
    if (EDITOR_BLOCK_BOUNDARY_TAGS.has(current.tagName)) return current;
    current = current.parentElement;
  }
  return editor;
}

function normalizedRangeText(range) {
  return range.toString().replace(/\u200b/g, "").trim();
}

function isEditorSelectionAtBlockBoundary(editor, inputType) {
  const selection = window.getSelection();
  if (!editor || !selection.rangeCount || !selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return false;
  const block = nearestEditorBlock(range.commonAncestorContainer, editor);
  if (!block || block === editor) return false;

  const probe = document.createRange();
  probe.selectNodeContents(block);
  if (inputType === "deleteContentBackward") {
    probe.setEnd(range.startContainer, range.startOffset);
  } else if (inputType === "deleteContentForward") {
    probe.setStart(range.startContainer, range.startOffset);
  } else {
    return false;
  }
  return normalizedRangeText(probe) === "";
}

function editorBlockPeer(block, direction) {
  if (!block || ["TD", "TH"].includes(block.tagName)) return null;
  const peer = direction === "backward" ? block.previousElementSibling : block.nextElementSibling;
  if (!peer || !EDITOR_BLOCK_BOUNDARY_TAGS.has(peer.tagName) || ["TD", "TH"].includes(peer.tagName)) return null;
  return peer;
}

function moveBlockChildrenAtBoundary(sourceBlock, targetBlock, direction) {
  const marker = document.createTextNode("");
  const shouldStripMovedBold = blockContentIsFullyBold(sourceBlock) && blockEndsWithBoldFormatting(targetBlock);
  const shouldWrapMovedContent = blockNeedsNormalWeightWrapper(targetBlock);
  if (shouldStripMovedBold) {
    stripBoldFormattingFromBlock(sourceBlock);
  }
  targetBlock.appendChild(marker);
  const movedContainer = shouldWrapMovedContent ? document.createElement("span") : targetBlock;
  if (shouldWrapMovedContent) {
    movedContainer.style.fontWeight = "normal";
  }
  while (sourceBlock.firstChild) {
    movedContainer.appendChild(sourceBlock.firstChild);
  }
  if (shouldWrapMovedContent && movedContainer.childNodes.length) {
    targetBlock.appendChild(movedContainer);
  }
  sourceBlock.remove();
  restoreCaretAtNodePosition(marker);
}

function mergeEditorBlockAtBoundary(editor, direction) {
  if (!editor) return false;
  const inputType = direction === "backward" ? "deleteContentBackward" : "deleteContentForward";
  if (!isEditorSelectionAtBlockBoundary(editor, inputType)) return false;
  const selection = window.getSelection();
  if (!selection.rangeCount) return false;
  const range = selection.getRangeAt(0);
  const block = nearestEditorBlock(range.commonAncestorContainer, editor);
  if (!block || block === editor) return false;
  const peer = editorBlockPeer(block, direction);
  if (!peer || !editor.contains(peer)) return false;

  activeRichEditor = editor;
  if (direction === "backward") {
    moveBlockChildrenAtBoundary(block, peer, "backward");
  } else {
    moveBlockChildrenAtBoundary(peer, block, "forward");
  }
  resetEditorCommandStateToDefault();
  editor.normalize();
  saveEditorSelection();
  return true;
}

function normalizeLineMergeFormattingToDefault(editor) {
  if (!editor) return;
  activeRichEditor = editor;
  splitFormattingAncestorsAtCaret(editor, { unwrapTrailing: true });
  resetEditorCommandStateToDefault();
  editor.normalize();
  saveEditorSelection();
}

function syncActiveToolbarDefaultFontSize() {
  if (!activeToolbar) return;
  const sizeSelect = activeToolbar.querySelector(".font-size-select");
  if (!sizeSelect) return;
  isProgrammaticChange = true;
  sizeSelect.value = EDITOR_DEFAULT_FONT_SIZE;
  sizeSelect._lastProgrammaticValue = EDITOR_DEFAULT_FONT_SIZE;
  isProgrammaticChange = false;
}

function setFontSizeOfSelection(sizeValue) {
  focusActiveEditor();
  const sizeWithUnit = sizeValue + "pt";
  const selection = window.getSelection();
  if (!selection.rangeCount || !activeRichEditor) return;
  const range = selection.getRangeAt(0);

  if (selection.isCollapsed) {
    let parentSpan = range.commonAncestorContainer;
    if (parentSpan.nodeType === Node.TEXT_NODE) {
      parentSpan = parentSpan.parentNode;
    }
    if (parentSpan && parentSpan.nodeName === "SPAN" && parentSpan.style.fontSize === sizeWithUnit) {
      return;
    }
    
    const span = document.createElement("span");
    span.style.fontSize = sizeWithUnit;
    span.innerHTML = "&#8203;"; // Zero-width space
    range.insertNode(span);
    
    const newRange = document.createRange();
    newRange.setStart(span.firstChild, 1);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    savedSelectionRange = newRange.cloneRange();
  } else {
    document.execCommand("fontSize", false, "7");
    const fonts = activeRichEditor.querySelectorAll('font[size="7"]');
    fonts.forEach((font) => {
      const span = document.createElement("span");
      span.style.fontSize = sizeWithUnit;
      while (font.firstChild) {
        span.appendChild(font.firstChild);
      }
      font.parentNode.replaceChild(span, font);
    });
    saveEditorSelection();
  }
}

function setListStyle(styleType, isOrdered) {
  focusActiveEditor();
  const cmd = isOrdered ? "insertOrderedList" : "insertUnorderedList";
  document.execCommand(cmd, false, null);
  
  const selection = window.getSelection();
  if (!selection.rangeCount || !activeRichEditor) return;
  let node = selection.getRangeAt(0).commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode;
  }
  
  const tag = isOrdered ? "OL" : "UL";
  while (node && node !== activeRichEditor) {
    if (node.nodeName === tag) {
      node.style.listStyleType = styleType;
      break;
    }
    node = node.parentNode;
  }
  saveEditorSelection();
}

function updateToolbarStates() {
  if (!activeRichEditor) return;
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  let node = range.commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode;
  }
  
  let fontSize = "";
  while (node && node !== activeRichEditor) {
    if (node.style && node.style.fontSize) {
      fontSize = node.style.fontSize;
      break;
    }
    node = node.parentNode;
  }
  
  let numericSize = "";
  if (fontSize) {
    const match = fontSize.match(/^(\d+(?:\.\d+)?)(pt|px)$/);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = match[2];
      if (unit === "pt") {
        numericSize = String(Math.round(val));
      } else if (unit === "px") {
        numericSize = String(Math.round(val * 0.75));
      }
    }
  }
  
  if (activeToolbar) {
    const sizeSelect = activeToolbar.querySelector(".font-size-select");
    if (sizeSelect) {
      isProgrammaticChange = true;
      const valToSet = (numericSize && Array.from(sizeSelect.options).some(opt => opt.value === numericSize)) ? numericSize : EDITOR_DEFAULT_FONT_SIZE;
      sizeSelect.value = valToSet;
      sizeSelect._lastProgrammaticValue = valToSet;
      isProgrammaticChange = false;
    }
  }
}

function saveEditorSelection() {
  const selection = window.getSelection();
  if (!selection.rangeCount || !activeRichEditor) return;
  const range = selection.getRangeAt(0);
  if (activeRichEditor.contains(range.commonAncestorContainer)) {
    savedSelectionRange = range.cloneRange();
    updateToolbarStates();
  }
}

function updateExamMeta() {
  state.examMeta = {
    term: els.examTermSelect.value,
    examNumber: els.examNumberSelect.value,
    className: els.examClassInput.value,
    duration: els.examDurationInput.value,
    date: els.examDateInput.value,
    pageTarget: els.examPageTargetSelect.value,
    columns: els.examColumnSelect.value,
    outputType: els.examOutputTypeSelect.value,
    answerKeyMode: els.answerKeyModeSelect.value,
    instruction: els.examInstructionInput.value
  };
  saveState();
  renderSelectedQuestions();
  renderExamAnalysis();
}

function saveExamArchive({ forceNew = false } = {}) {
  if (!selectedQuestions().length) {
    showToast("Arşive kaydetmek için önce sınava soru ekleyin.", "warning");
    return;
  }
  const activeExam = state.archivedExams.find((exam) => exam.id === state.activeExamArchiveId);
  const id = forceNew || !activeExam ? "" : state.activeExamArchiveId;
  const snapshot = currentExamSnapshot(id);
  if (id) {
    state.archivedExams = state.archivedExams.map((exam) => exam.id === id ? snapshot : exam);
  } else {
    state.archivedExams.unshift(snapshot);
  }
  state.activeExamArchiveId = snapshot.id;
  els.examArchiveNameInput.value = snapshot.title;
  saveState();
  renderExamArchive();
  showToast(id ? "Sınav arşiv kaydı güncellendi." : "Sınav arşive kaydedildi.");
}

function loadExamArchive() {
  const exam = state.archivedExams.find((item) => item.id === els.examArchiveSelect.value);
  if (!exam) return;
  state.selectedCourseId = exam.courseId;
  state.activeExamArchiveId = exam.id;
  state.examMeta = { ...structuredClone(initialState.examMeta), ...structuredClone(exam.meta) };
  const availableIds = new Set(state.questions.filter((question) => question.courseId === exam.courseId).map((question) => question.id));
  setBasketIdsForCourse(exam.questionIds.filter((id) => availableIds.has(id)), exam.courseId);
  state.examAnswerSpaces = state.examAnswerSpaces || {};
  state.examAnswerSpaces[exam.courseId] = {};
  Object.entries(exam.answerSpaces || {}).forEach(([questionId, config]) => {
    if (availableIds.has(questionId) && exam.questionIds.includes(questionId)) {
      state.examAnswerSpaces[exam.courseId][questionId] = normalizeAnswerSpaceConfig(config);
    }
  });
  if (!Object.keys(state.examAnswerSpaces[exam.courseId]).length) delete state.examAnswerSpaces[exam.courseId];
  state.questions = state.questions.map((question) => {
    if (!Object.prototype.hasOwnProperty.call(exam.questionPoints, question.id)) return question;
    return { ...question, points: Math.max(1, Number(exam.questionPoints[question.id] || question.points || 1)) };
  });
  els.examArchiveNameInput.value = exam.title;
  saveState();
  render();
  showToast("Sınav arşivden açıldı. Düzenleyip güncelleyebilirsiniz.");
}

async function deleteExamArchive() {
  const exam = state.archivedExams.find((item) => item.id === els.examArchiveSelect.value);
  if (!exam) return;
  const confirmed = await appConfirm(`${exam.title} arşivden silinsin mi?`, {
    title: "Arşiv kaydını sil",
    okText: "Sil"
  });
  if (!confirmed) return;
  state.archivedExams = state.archivedExams.filter((item) => item.id !== exam.id);
  if (state.activeExamArchiveId === exam.id) {
    state.activeExamArchiveId = "";
  }
  saveState();
  renderExamArchive();
  showToast("Arşiv kaydı silindi.");
}

function updateSettings(event) {
  event.preventDefault();
  addTeacherFromInput(false);
  state.settings = {
    schoolName: els.schoolNameInput.value.trim(),
    teachers: state.settings.teachers,
    academicYear: els.academicYearInput.value.trim()
  };
  saveState();
  renderTeacherList();
  showToast("Genel ayarlar kaydedildi.");
}

function addTeacherFromInput(shouldSave = true) {
  const teacher = els.teacherNameInput.value.trim();
  if (!teacher) return;
  state.settings.teachers.push(teacher);
  els.teacherNameInput.value = "";
  if (shouldSave) {
    saveState();
    renderTeacherList();
  }
}

async function importCurriculumPdf(file) {
  if (!file) return;
  const formData = new FormData();
  formData.append("pdf", file);
  const course = currentCourse();
  formData.append("courseName", course.name);
  try {
    const response = await fetch("/api/import-curriculum", {
      method: "POST",
      body: formData
    });
    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    if (!Array.isArray(result.items) || !result.items.length) {
      showToast("PDF içinden öğrenme birimi/kazanım bulunamadı.", "warning");
      return;
    }
    
    // Check if there are existing items for this course
    const courseItems = state.curriculumItems.filter(item => courseNameMatches(item.courseName, course.name));
    let finalItems = state.curriculumItems;
    if (courseItems.length > 0) {
      const confirmOverwrite = await appConfirm(
        `Bu ders için zaten kayıtlı kazanımlar var. Mevcut kazanımları temizleyip sadece PDF'dekileri mi aktarmak istersiniz? (Temizle'ye basarsanız eskiler silinir, Ekle'ye basarsanız üzerine eklenir.)`,
        {
          title: "Kazanım Aktarımı",
          okText: "Temizle ve Aktar",
          cancelText: "Üzerine Ekle"
        }
      );
      if (confirmOverwrite) {
        finalItems = state.curriculumItems.filter(item => !courseNameMatches(item.courseName, course.name));
      }
    }
    
    state.curriculumItems = mergeCurriculumItems([...finalItems, ...result.items]);
    state.selectedCurriculumTopic = result.items[0].topic;
    saveState();
    render();
    showToast(`${result.items.length} öğrenme birimi/kazanım kaydı aktarıldı.`);
  } catch (error) {
    showToast(`PDF aktarılamadı: ${error.message || "Bilinmeyen hata"}`, "error");
  } finally {
    els.curriculumPdfInput.value = "";
  }
}

async function importQuestionsDocx(file) {
  if (!file) return;
  const formData = new FormData();
  formData.append("docx", file);
  try {
    const response = await fetch("/api/import-questions-docx", {
      method: "POST",
      body: formData
    });
    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    const imported = Array.isArray(result.questions) ? result.questions : [];
    if (!imported.length) {
      showToast("Word dosyasından soru bulunamadı.", "warning");
      return;
    }
    const meta = result.meta || {};
    const scopeText = meta.term && meta.examNumber
      ? `${meta.term}. dönem ${meta.examNumber}. yazılı`
      : "dönem/yazılı etiketi bulunamadı";
    const confirmed = await appConfirm(`${file.name} dosyasında ${imported.length} soru bulundu. Kapsam: ${scopeText}. Bu sorular mevcut derse aktarılsın mı?`, {
      title: "Word sorularını aktar",
      okText: "Aktar"
    });
    if (!confirmed) return;

    const course = currentCourse();
    const now = new Date().toISOString();
    const importedQuestions = imported.map((question) => ({
      id: uid("q"),
      type: "open",
      courseId: course.id,
      topic: "",
      outcome: "",
      grade: gradeValueForCourse(course),
      difficulty: "Orta",
      examTerm: meta.term || "",
      examNumber: meta.examNumber || "",
      points: normalizeImportedPoint(question.points),
      tags: ["Word aktarım"],
      note: `Kaynak dosya: ${file.name}`,
      content: question.content || "",
      answer: question.answer || "",
      choices: choiceLabels.slice(0, 4).map((label) => ({ id: label, label, text: "" })),
      correctChoiceId: "A",
      correctBoolean: true,
      acceptedAnswers: [],
      createdAt: now,
      updatedAt: now
    }));
    state.questions = [...importedQuestions, ...state.questions];
    saveState();
    render();
    setView("bank");
    showToast(`${importedQuestions.length} soru soru havuzuna aktarıldı.`);
  } catch (error) {
    const message = String(error.message || "Bilinmeyen hata");
    const friendly = message === "Not found"
      ? "Word aktarım servisi bulunamadı. Sunucuyu kapatıp yeniden başlatın; yeni sunucu kodu yüklendikten sonra tekrar deneyin."
      : `Word dosyası aktarılamadı: ${message}`;
    showToast(friendly, "error");
  } finally {
    if (els.questionDocxInput) els.questionDocxInput.value = "";
  }
}

// Soru Bankasi (Sinav Baski, Onizleme ve Word Cikti) -> scripts/modules/sorubank/export-print.js

function backupSelectedModules() {
  return getAppModule("settings")?.selectedBackupModules(Object.keys(BACKUP_MODULES)) || Object.keys(BACKUP_MODULES);
}

function backupKeysForModules(modules = Object.keys(BACKUP_MODULES)) {
  const keys = new Set();
  modules.forEach((moduleKey) => {
    const module = BACKUP_MODULES[moduleKey];
    if (!module) return;
    (module.keys || []).forEach((key) => keys.add(key));
    (module.prefixes || []).forEach((prefix) => {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (String(key || "").startsWith(prefix)) keys.add(key);
      }
    });
  });
  return [...keys];
}

function collectBackupStorage(modules = Object.keys(BACKUP_MODULES)) {
  return Object.fromEntries(backupKeysForModules(modules).map((key) => [key, localStorage.getItem(key)]));
}

function parseBackupStorageValue(value) {
  if (value == null || value === "") return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function backupSummaryFromStorage(storage = {}) {
  const sorubank = parseBackupStorageValue(storage[STORAGE_KEY]) || {};
  const course = parseBackupStorageValue(storage[COURSE_STORAGE_KEY]) || {};
  const studentTracking = parseBackupStorageValue(storage[STUDENT_TRACKING_STORAGE_KEY]) || {};
  const annualPlan = parseBackupStorageValue(storage[ANNUAL_PLAN_STORAGE_KEY]) || {};
  const skillProfileKeys = Object.keys(storage).filter((key) => key === SKILL_PROFILES_KEY || key.startsWith(`${SKILL_PROFILES_KEY}:`));

  let skillSchools = 0;
  let skillStudents = 0;
  let skillBusinesses = 0;
  skillProfileKeys.forEach((key) => {
    const store = parseBackupStorageValue(storage[key]) || {};
    if (Array.isArray(store.profiles)) {
      store.profiles.forEach((profile) => {
        const stateVal = profile.state || {};
        if (Array.isArray(stateVal.schoolRecords)) skillSchools += stateVal.schoolRecords.length;
        if (Array.isArray(stateVal.students)) skillStudents += stateVal.students.length;
        if (Array.isArray(stateVal.businesses)) skillBusinesses += stateVal.businesses.length;
      });
    }
  });

  return {
    courses: Array.isArray(sorubank.courses) ? sorubank.courses.length : 0,
    questions: Array.isArray(sorubank.questions) ? sorubank.questions.length : 0,
    curriculumItems: Array.isArray(sorubank.curriculumItems) ? sorubank.curriculumItems.length : 0,
    skillSchools,
    skillStudents,
    skillBusinesses,
    courseModules: Array.isArray(course.modules) ? course.modules.length : 0,
    courseStudents: Array.isArray(course.students) ? course.students.length : 0,
    courseQuestions: course.questions && typeof course.questions === "object"
      ? Object.values(course.questions).reduce((total, items) => total + (Array.isArray(items) ? items.length : 0), 0)
      : 0,
    trackingClasses: Array.isArray(studentTracking.classes) ? studentTracking.classes.length : 0,
    trackingLessons: Array.isArray(studentTracking.lessons) ? studentTracking.lessons.length : 0,
    trackingStudents: Array.isArray(studentTracking.students) ? studentTracking.students.length : 0,
    trackingEvaluations: Array.isArray(studentTracking.routine) ? studentTracking.routine.length : 0,
    trackingHomework: Array.isArray(studentTracking.homework) ? studentTracking.homework.length : 0,
    trackingProjects: Array.isArray(studentTracking.projects) ? studentTracking.projects.length : 0,
    annualTemplates: Array.isArray(annualPlan.templates) ? annualPlan.templates.length : 0,
    annualGenerated: Array.isArray(annualPlan.generatedPlans) ? annualPlan.generatedPlans.length : 0,
    skillProfiles: skillProfileKeys.length
  };
}

function createBackupPackage(modules = Object.keys(BACKUP_MODULES), { reason = "manual" } = {}) {
  const uniqueModules = [...new Set(modules)].filter((moduleKey) => BACKUP_MODULES[moduleKey]);
  const storage = collectBackupStorage(uniqueModules);
  const summary = backupSummaryFromStorage(storage);
  return {
    app: "Okul Takip Sistemi",
    type: "sorubank-backup",
    version: BACKUP_PACKAGE_VERSION,
    reason,
    createdAt: new Date().toISOString(),
    modules: uniqueModules,
    moduleLabels: Object.fromEntries(uniqueModules.map((moduleKey) => [moduleKey, BACKUP_MODULES[moduleKey].label])),
    summary,
    storage
  };
}

function backupFileName(prefix = "okul-takip-sistemi-yedek") {
  const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
  return `${prefix}-${stamp}.json`;
}

function exportBackupPackage(modules = Object.keys(BACKUP_MODULES), prefix = "okul-takip-sistemi-tam-yedek") {
  const backup = createBackupPackage(modules);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  downloadBlob(blob, backupFileName(prefix));
  showToast("Yedek dosyası indirildi.");
}

function exportData() {
  exportBackupPackage(Object.keys(BACKUP_MODULES), "okul-takip-sistemi-tam-yedek");
}

function exportSelectedBackup() {
  exportBackupPackage(backupSelectedModules(), "okul-takip-sistemi-modul-yedek");
}

function normalizeBackupPackage(imported) {
  if ((imported?.type === "sorubank-backup" || imported?.type === "ots-backup") && imported.storage && typeof imported.storage === "object") {
    return imported;
  }
  if (Array.isArray(imported?.courses) && Array.isArray(imported?.questions)) {
    const normalized = normalizeState({ ...structuredClone(initialState), ...imported });
    return {
      app: "Okul Takip Sistemi",
      type: "sorubank-backup",
      version: 0,
      createdAt: new Date().toISOString(),
      modules: ["sorubank"],
      moduleLabels: { sorubank: "Soru Bankası" },
      summary: backupSummaryFromStorage({ [STORAGE_KEY]: JSON.stringify(normalized) }),
      storage: { [STORAGE_KEY]: JSON.stringify(normalized) }
    };
  }
  throw new Error("Geçersiz yedek dosyası");
}

function mergeBackupStorageValue(key, currentRaw, incomingRaw) {
  if (incomingRaw == null) return currentRaw;
  if (key === STORAGE_KEY) {
    const current = parseBackupStorageValue(currentRaw) || structuredClone(initialState);
    const incoming = parseBackupStorageValue(incomingRaw) || {};
    return JSON.stringify(normalizeState({
      ...structuredClone(initialState),
      ...current,
      ...incoming,
      courses: [...(Array.isArray(current.courses) ? current.courses : []), ...(Array.isArray(incoming.courses) ? incoming.courses : [])],
      curriculumItems: [...(Array.isArray(current.curriculumItems) ? current.curriculumItems : []), ...(Array.isArray(incoming.curriculumItems) ? incoming.curriculumItems : [])],
      questions: [...(Array.isArray(current.questions) ? current.questions : []), ...(Array.isArray(incoming.questions) ? incoming.questions : [])],
      archivedExams: [...(Array.isArray(current.archivedExams) ? current.archivedExams : []), ...(Array.isArray(incoming.archivedExams) ? incoming.archivedExams : [])],
      examBaskets: { ...(current.examBaskets || {}), ...(incoming.examBaskets || {}) },
      examAnswerSpaces: { ...(current.examAnswerSpaces || {}), ...(incoming.examAnswerSpaces || {}) }
    }));
  }
  if (key === COURSE_STORAGE_KEY) {
    const current = parseBackupStorageValue(currentRaw) || {};
    const incoming = parseBackupStorageValue(incomingRaw) || {};
    return JSON.stringify({
      ...current,
      ...incoming,
      schoolInfos: [...(Array.isArray(current.schoolInfos) ? current.schoolInfos : []), ...(Array.isArray(incoming.schoolInfos) ? incoming.schoolInfos : [])],
      modules: [...(Array.isArray(current.modules) ? current.modules : []), ...(Array.isArray(incoming.modules) ? incoming.modules : [])],
      students: [...(Array.isArray(current.students) ? current.students : []), ...(Array.isArray(incoming.students) ? incoming.students : [])],
      attendance: { ...(current.attendance || {}), ...(incoming.attendance || {}) },
      examSummaries: { ...(current.examSummaries || {}), ...(incoming.examSummaries || {}) },
      questions: { ...(current.questions || {}), ...(incoming.questions || {}) }
    });
  }
  if (key === SKILL_STORAGE_KEY) {
    const current = parseBackupStorageValue(currentRaw) || {};
    const incoming = parseBackupStorageValue(incomingRaw) || {};
    return JSON.stringify({
      ...current,
      ...incoming,
      schoolRecords: [...(Array.isArray(current.schoolRecords) ? current.schoolRecords : []), ...(Array.isArray(incoming.schoolRecords) ? incoming.schoolRecords : [])],
      teachers: [...(Array.isArray(current.teachers) ? current.teachers : []), ...(Array.isArray(incoming.teachers) ? incoming.teachers : [])],
      businesses: [...(Array.isArray(current.businesses) ? current.businesses : []), ...(Array.isArray(incoming.businesses) ? incoming.businesses : [])],
      students: [...(Array.isArray(current.students) ? current.students : []), ...(Array.isArray(incoming.students) ? incoming.students : [])],
      coordinators: [...(Array.isArray(current.coordinators) ? current.coordinators : []), ...(Array.isArray(incoming.coordinators) ? incoming.coordinators : [])],
      holidays: [...(Array.isArray(current.holidays) ? current.holidays : []), ...(Array.isArray(incoming.holidays) ? incoming.holidays : [])],
      wageManualAbsences: { ...(current.wageManualAbsences || {}), ...(incoming.wageManualAbsences || {}) },
      absenceRecords: { ...(current.absenceRecords || {}), ...(incoming.absenceRecords || {}) },
      reports: [...(Array.isArray(current.reports) ? current.reports : []), ...(Array.isArray(incoming.reports) ? incoming.reports : [])]
    });
  }
  if (key === LOCAL_USERS_KEY) {
    const current = parseBackupStorageValue(currentRaw);
    const incoming = parseBackupStorageValue(incomingRaw);
    if (Array.isArray(current) && Array.isArray(incoming)) {
      const byEmail = new Map(current.map((user) => [normalizeEmail(user.email), user]));
      incoming.forEach((user) => byEmail.set(normalizeEmail(user.email), { ...byEmail.get(normalizeEmail(user.email)), ...user }));
      return JSON.stringify([...byEmail.values()]);
    }
  }
  return incomingRaw;
}

function applyBackupPackage(backup, mode = "replace", modulesToRestore = backup.modules || Object.keys(BACKUP_MODULES)) {
  const storage = backup.storage || {};
  if (mode !== "merge") {
    backupKeysForModules(modulesToRestore).forEach((key) => {
      if (key !== BACKUP_SNAPSHOT_KEY) localStorage.removeItem(key);
    });
  }
  const allowedKeys = new Set();
  const allowedPrefixes = [];
  modulesToRestore.forEach((moduleKey) => {
    const module = BACKUP_MODULES[moduleKey];
    if (!module) return;
    (module.keys || []).forEach((key) => allowedKeys.add(key));
    (module.prefixes || []).forEach((prefix) => allowedPrefixes.push(prefix));
  });

  Object.entries(storage).forEach(([key, incomingRaw]) => {
    const isAllowed = allowedKeys.has(key) || allowedPrefixes.some((prefix) => key.startsWith(prefix));
    if (!isAllowed) return;
    if (incomingRaw == null) {
      localStorage.removeItem(key);
      return;
    }
    if (mode === "merge") {
      localStorage.setItem(key, mergeBackupStorageValue(key, localStorage.getItem(key), incomingRaw));
    } else {
      localStorage.setItem(key, incomingRaw);
    }
  });
}

function backupSummaryHtml(summary = {}, modulesToRestore = [], mode = "replace") {
  const lines = [];
  if (modulesToRestore.includes("sorubank") && (summary.courses || summary.questions || summary.curriculumItems)) {
    lines.push(`<li><strong>Soru Bankası:</strong> ${summary.courses || 0} ders, ${summary.questions || 0} soru, ${summary.curriculumItems || 0} kazanım</li>`);
  }
  if (modulesToRestore.includes("skill") && (summary.skillSchools || summary.skillBusinesses || summary.skillStudents)) {
    lines.push(`<li><strong>İME (Beceri Eğitimi):</strong> ${summary.skillSchools || 0} okul, ${summary.skillBusinesses || 0} işletme, ${summary.skillStudents || 0} öğrenci</li>`);
  }
  if (modulesToRestore.includes("course") && (summary.courseModules || summary.courseStudents || summary.courseQuestions)) {
    lines.push(`<li><strong>Kurs/Ders Takibi:</strong> ${summary.courseModules || 0} modül, ${summary.courseStudents || 0} öğrenci, ${summary.courseQuestions || 0} soru</li>`);
  }
  if (modulesToRestore.includes("student") && (summary.trackingClasses || summary.trackingLessons || summary.trackingStudents || summary.trackingEvaluations || summary.trackingHomework || summary.trackingProjects)) {
    lines.push(`<li><strong>Öğrenci Takibi:</strong> ${summary.trackingClasses || 0} sınıf, ${summary.trackingLessons || 0} ders, ${summary.trackingStudents || 0} öğrenci, ${summary.trackingEvaluations || 0} değerlendirme, ${summary.trackingHomework || 0} ödev, ${summary.trackingProjects || 0} proje</li>`);
  }
  if (modulesToRestore.includes("annualPlan") && (summary.annualTemplates || summary.annualGenerated)) {
    lines.push(`<li><strong>Yıllık Plan:</strong> ${summary.annualTemplates || 0} şablon, ${summary.annualGenerated || 0} üretilen plan</li>`);
  }
  if (modulesToRestore.includes("settings") && summary.skillProfiles) {
    lines.push(`<li><strong>Profil/Ayar:</strong> ${summary.skillProfiles || 0} İME profil kaydı</li>`);
  }

  const moduleText = modulesToRestore.map((moduleKey) => BACKUP_MODULES[moduleKey]?.label || moduleKey).join(", ") || "Hiçbiri";

  const warningText = mode === "merge"
    ? "Bu yedek, seçilen modüllerdeki mevcut verilerinizin üzerine eklenecektir."
    : "Bu yedek, seçilen modüllerdeki mevcut verilerinizin yerine geçecektir. Seçilmeyen diğer modülleriniz korunacaktır.";

  return `
    <div class="confirm-backup-rich" style="display: flex; flex-direction: column; gap: 12px; text-align: left; font-size: 0.85rem; line-height: 1.5; color: rgba(248, 251, 251, 0.85); font-family: sans-serif;">
      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px;">
        <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #9de0d6; font-weight: 600; display: flex; align-items: center; gap: 6px;">📦 Geri Yüklenecek Veriler</h4>
        <ul style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px;">
          ${lines.length > 0 ? lines.join("") : "<li>Seçilen modüller için yedek dosyasında veri bulunamadı.</li>"}
        </ul>
      </div>
      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px;">
        <h4 style="margin: 0 0 4px 0; font-size: 0.9rem; color: #9de0d6; font-weight: 600;">🛠️ İşlenecek Modüller</h4>
        <p style="margin: 0; color: rgba(248, 251, 251, 0.95); font-weight: 500;">${moduleText}</p>
      </div>
      <div style="padding: 10px 12px; background: rgba(235, 94, 85, 0.1); border: 1px solid rgba(235, 94, 85, 0.22); border-radius: 8px;">
        <strong style="color: #ff9f80; font-size: 0.82rem; display: block; text-align: center;">⚠️ ${warningText}</strong>
      </div>
      <p style="margin: 4px 0 0 0; font-weight: 600; text-align: center; color: rgba(248, 251, 251, 0.95);">Geri yükleme işlemine devam etmek istiyor musunuz?</p>
    </div>
  `;
}

async function restoreBackupPackage(backup, mode = "replace") {
  const selectedModules = backupSelectedModules();
  const modulesToRestore = (backup.modules || Object.keys(BACKUP_MODULES)).filter(m => selectedModules.includes(m));

  if (modulesToRestore.length === 0) {
    showToast("Geri yüklenecek hiçbir modül seçilmedi. Lütfen yukarıdan en az bir modül seçin.", "warning");
    return;
  }

  const summary = backup.summary || backupSummaryFromStorage(backup.storage);
  const summaryHtml = backupSummaryHtml(summary, modulesToRestore, mode);

  const confirmed = await appConfirm(summaryHtml, {
    title: "Yedekten geri yükle",
    okText: "Geri yükle",
    html: true
  });
  if (!confirmed) return;
  createAutoBackupSnapshot("before-restore", { silent: true });
  applyBackupPackage(backup, mode, modulesToRestore);
  showToast("Yedek geri yüklendi. Uygulama yenileniyor.");
  setTimeout(() => window.location.reload(), 350);
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const imported = JSON.parse(reader.result);
      const backup = normalizeBackupPackage(imported);
      const settingsModule = getAppModule("settings");
      const mode = settingsModule?.backupRestoreMode("replace") || "replace";
      await restoreBackupPackage(backup, mode);
    } catch {
      showToast("Bu dosya geçerli bir yedek dosyası gibi görünmüyor.", "error");
    } finally {
      settingsModule?.clearImportInput();
    }
  };
  reader.readAsText(file);
}

function loadBackupSnapshots() {
  try {
    const value = JSON.parse(localStorage.getItem(BACKUP_SNAPSHOT_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveBackupSnapshots(snapshots) {
  let limit = 20;
  try {
    const globalSettings = JSON.parse(localStorage.getItem("sorubank:global-settings:v1") || "{}");
    if (globalSettings.autoBackupLimit) {
      limit = Number(globalSettings.autoBackupLimit) || 20;
    }
  } catch (e) {}
  localStorage.setItem(BACKUP_SNAPSHOT_KEY, JSON.stringify(snapshots.slice(0, limit)));
}

function createAutoBackupSnapshot(reason = "auto", { silent = false } = {}) {
  try {
    const backup = createBackupPackage(Object.keys(BACKUP_MODULES), { reason });
    const snapshots = loadBackupSnapshots();
    snapshots.unshift({
      id: uid("backup"),
      createdAt: backup.createdAt,
      reason,
      summary: backup.summary,
      backup
    });
    saveBackupSnapshots(snapshots);
    updateBackupSnapshotStatus();
    if (!silent) showToast("Anlık otomatik yedek alındı.");
    return true;
  } catch (error) {
    try {
      const snapshots = loadBackupSnapshots();
      saveBackupSnapshots(snapshots.slice(0, 8));
    } catch {}
    if (!silent) showToast("Otomatik yedek alanı doldu. Lütfen tam yedek indirip saklayın.", "warning");
    return false;
  }
}

function scheduleAutoBackupSnapshot(reason = "change") {
  try {
    const globalSettings = JSON.parse(localStorage.getItem("sorubank:global-settings:v1") || "{}");
    if (globalSettings.autoBackupEnabled === false) return;
  } catch (e) {}
  clearTimeout(backupSnapshotTimer);
  backupSnapshotTimer = setTimeout(() => {
    createAutoBackupSnapshot(reason, { silent: true });
  }, 1500);
}

function formatBackupSnapshotDate(value) {
  if (!value) return "Henüz otomatik yedek yok";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function updateBackupSnapshotStatus() {
  const status = document.querySelector("#backupSnapshotStatus");
  if (!status) return;
  const latest = loadBackupSnapshots()[0];
  status.textContent = latest
    ? `Son otomatik yedek: ${formatBackupSnapshotDate(latest.createdAt)}`
    : "Henüz otomatik yedek yok";
}

async function restoreLatestSnapshot() {
  const latest = loadBackupSnapshots()[0];
  if (!latest?.backup) {
    showToast("Henüz otomatik yedek yok.", "warning");
    return;
  }
  await restoreBackupPackage(latest.backup, "replace");
}

els.showRegisterBtn.addEventListener("click", () => setAuthMode("register"));
els.showLoginBtn.addEventListener("click", () => setAuthMode("login"));
els.localRegisterForm.addEventListener("submit", handleLocalRegister);
els.localLoginForm.addEventListener("submit", handleLocalLogin);
els.quickStartBtn?.addEventListener("click", () => {
  const users = loadLocalUsers();
  let demoUser = users.find(u => normalizeEmail(u.email) === "ogretmen@okul.com");
  if (!demoUser) {
    demoUser = {
      id: uid("user"),
      name: "Değerli Öğretmenimiz",
      email: "ogretmen@okul.com",
      password: "demo",
      createdAt: new Date().toISOString()
    };
    users.push(demoUser);
    saveLocalUsers(users);
  }
  let landingModule = "";
  try {
    const globalSettings = JSON.parse(localStorage.getItem("sorubank:global-settings:v1") || "{}");
    landingModule = globalSettings.landingModule || "";
  } catch (e) {}
  saveLocalSession({
    id: demoUser.id,
    name: demoUser.name,
    email: demoUser.email,
    activeModule: landingModule,
    createdAt: new Date().toISOString()
  });
  syncUserToServer({
    id: demoUser.id,
    name: demoUser.name,
    email: demoUser.email,
    role: "teacher"
  });
  showToast("Hoş geldiniz! Demo hesapla giriş yapıldı.");
});
els.moduleHub.querySelectorAll("[data-module]").forEach((button) => {
  button.addEventListener("click", () => openModule(button.dataset.module));
});
els.desktopSidebarCollapseBtn?.addEventListener("click", toggleDesktopSidebar);
els.desktopModuleDockButtons?.forEach((button) => {
  button.addEventListener("click", () => {
    closeDesktopModuleDockAfterSelection(button);
    handleFloatingModuleChoice(button.dataset.dockModule);
  });
});
els.desktopModuleDock?.addEventListener("pointerleave", () => {
  els.desktopModuleDock.classList.remove("is-selection-closing");
});
els.desktopModuleDock?.addEventListener("focusin", () => {
  els.desktopModuleDock.classList.remove("is-selection-closing");
});
let moduleSwitcherHoverTimer = null;

if (els.moduleFloatSwitcher) {
  els.moduleFloatSwitcher.addEventListener("pointerenter", () => {
    if (window.matchMedia("(min-width: 901px)").matches) {
      clearTimeout(moduleSwitcherHoverTimer);
      if (els.moduleFloatPanel?.hidden) {
        toggleFloatingModuleSwitcher(document.querySelector("#otsFloatingLauncherBtn"));
      }
    }
  });
  els.moduleFloatSwitcher.addEventListener("pointerleave", () => {
    if (window.matchMedia("(min-width: 901px)").matches) {
      clearTimeout(moduleSwitcherHoverTimer);
      moduleSwitcherHoverTimer = setTimeout(() => {
        closeFloatingModuleSwitcher();
      }, 220);
    }
  });
}

els.moduleSwitcherTriggers?.forEach((trigger) => {
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFloatingModuleSwitcher(trigger);
  });
});

els.moduleFloatButtons?.forEach((button) => {
  button.addEventListener("click", () => handleFloatingModuleChoice(button.dataset.floatingModule));
});

els.moduleFloatPanel?.querySelectorAll("[data-floating-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.floatingAction;
    closeFloatingModuleSwitcher();
    if (action === "profile") {
      openProfileDialog();
    } else if (action === "logout") {
      logoutLocalSession();
    }
  });
});

els.moduleSwitcherBackdrop?.addEventListener("click", () => closeFloatingModuleSwitcher({ restoreFocus: true }));

document.querySelector("#mobileModulePanelCloseBtn")?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeFloatingModuleSwitcher({ restoreFocus: true });
});

document.addEventListener("pointerdown", (event) => {
  const clickedSwitcher = event.target instanceof Element && (event.target.closest("#moduleFloatSwitcher") || event.target.closest("[data-module-switcher-trigger]"));
  if (!clickedSwitcher && els.moduleFloatPanel && !els.moduleFloatPanel.hidden) {
    clearTimeout(moduleSwitcherHoverTimer);
    closeFloatingModuleSwitcher();
  }
});

document.addEventListener("click", (event) => {
  // OTS menüsünü dışarı tıklayınca kapat
  const clickedSwitcher = event.target instanceof Element && (event.target.closest("#moduleFloatSwitcher") || event.target.closest("[data-module-switcher-trigger]"));
  if (!clickedSwitcher && els.moduleFloatPanel && !els.moduleFloatPanel.hidden) {
    clearTimeout(moduleSwitcherHoverTimer);
    closeFloatingModuleSwitcher();
  }
  // Sağ gezinme menüsünü dışarı tıklayınca kapat
  const rightFab = document.getElementById("mobileNavFab");
  const rightPanel = document.getElementById("mobileNavPanel");
  if (rightPanel && !rightPanel.hidden && rightFab && !rightFab.contains(event.target) && !rightPanel.contains(event.target)) {
    rightPanel.hidden = true;
    rightFab.setAttribute("aria-expanded", "false");
  }
  // Soru Bankası sağ menüsünü dışarı tıklayınca kapat
  const sidebar = document.querySelector("aside.sidebar");
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  if (sidebar && sidebar.classList.contains("is-expanded") && sidebarToggleBtn && !sidebarToggleBtn.contains(event.target) && !sidebar.contains(event.target)) {
    sidebar.classList.remove("is-expanded");
    sidebarToggleBtn.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && els.moduleFloatPanel && !els.moduleFloatPanel.hidden && window.matchMedia("(max-width: 900px)").matches) {
    const focusableItems = [...els.moduleFloatPanel.querySelectorAll("button:not([disabled])")];
    const firstItem = focusableItems[0];
    const lastItem = focusableItems.at(-1);
    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem?.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem?.focus();
    }
  }
  if (event.key === "Escape") {
    closeFloatingModuleSwitcher({ restoreFocus: true });
    closeMobileNavigationPanels();
  }
});
els.moduleProfileBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleUserMenu(els.moduleUserMenu);
});

[els.moduleUserMenu].filter(Boolean).forEach((menu) => {
  menu.querySelectorAll("[data-profile-action]").forEach((button) => {
    button.addEventListener("click", () => handleProfileMenuAction(button.dataset.profileAction));
  });
});
[els.closeProfileBtn, document.querySelector("#profileCloseXBtn")].forEach((btn) => btn?.addEventListener("click", () => els.profileDialog.close()));
els.profileForm.addEventListener("submit", updateLocalProfile);

window.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.querySelector("#skillThemeToggleBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const globalSettings = JSON.parse(localStorage.getItem("sorubank:global-settings:v1") || "{}");
      const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
      globalSettings.theme = nextTheme;
      localStorage.setItem("sorubank:global-settings:v1", JSON.stringify(globalSettings));
      applyTheme(nextTheme);
      const themeSelect = document.querySelector("#appThemeSelect");
      if (themeSelect) themeSelect.value = nextTheme;
    });
  }
  window.AppModules.configure({
    returnToModuleHub,
    openProfileDialog,
    exportData,
    exportSelectedBackup,
    importData,
    createSnapshot: () => createAutoBackupSnapshot("manual"),
    restoreLatestSnapshot
  });

  resetQuestionForm();
  render();
  // Mobile app navigation select listener
  if (els.appNavMobileSelect) {
    els.appNavMobileSelect.addEventListener("change", (e) => setView(e.target.value));
  }
  
  // Sidebar expand/collapse toggle listener
  const sidebarToggleBtn = document.querySelector("#sidebarToggleBtn");
  const sidebar = document.querySelector("aside.sidebar");
  if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener("click", () => {
      const willExpand = !sidebar.classList.contains("is-expanded");
      if (willExpand) {
        closeFloatingModuleSwitcher();
        const panel = document.getElementById("mobileNavPanel");
        if (panel) panel.hidden = true;
      }
      sidebar.classList.toggle("is-expanded");
      sidebarToggleBtn.setAttribute("aria-expanded", String(willExpand));
    });
  }

  initializeDesktopSidebar();
  setView(state.currentView || "bank");
  renderAccessShell();
  syncSystemPermissions();
  checkAdminSecretUrl();
  document.querySelectorAll(".auth-brand-mark, .sidebar-brand, .brand, .app-brand").forEach((el) => {
    el.addEventListener("click", handleSecretLogoClick);
  });
  document.getElementById("suspendedLogoutBtn")?.addEventListener("click", () => {
    logoutLocalSession();
  });
  renderSkillModule();
  updateBackupSnapshotStatus();
  initializeCloud();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && isCloudInitialized) {
      console.log("App active. Running silent background cloud sync check...");
      checkAndSyncCloudBackground({ silent: true });
    }
  });
  registerPwa();
  initMobileNavigation();
});

// Mobile navigation enhancements
function initMobileNavigation() {
  const fab = document.getElementById("mobileNavFab");
  const panel = document.getElementById("mobileNavPanel");
  const closeBtn = document.getElementById("mobileNavPanelCloseBtn");
  const linksContainer = document.getElementById("mobileNavPanelLinks");

  // 1. Soru Bankası mobile tab buttons handler
  const sbTabBtns = document.querySelectorAll(".mobile-nav-tab-btn");
  const sbSelect = document.getElementById("appNavMobileSelect");
  
  if (sbSelect && sbTabBtns.length > 0) {
    sbTabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.navTab;
        sbSelect.value = view;
        sbSelect.dispatchEvent(new Event("change"));
        closeMobileNavigationPanels();
      });
    });

    // Update active tab class when select changes
    sbSelect.addEventListener("change", (e) => {
      sbTabBtns.forEach(btn => {
        btn.classList.toggle("is-active", btn.dataset.navTab === e.target.value);
      });
    });
  }

  // 2. Universal FAB helper
  function getActiveSelect() {
    const key = getActiveModuleKey();
    if (key === "settings") return document.getElementById("globalSettingsMobileSelect");
    if (key === "skill-training") return document.getElementById("skillNavMobileSelect");
    if (key === "student-tracking") return document.getElementById("studentNavMobileSelect");
    if (key === "annual-plan") return document.getElementById("annualNavMobileSelect");
    if (key === "course-tracking") return document.getElementById("courseNavMobileSelect");
    return null;
  }

  function getActiveModuleKey() {
    const classes = document.body.classList;
    if (classes.contains("global-settings-mode")) return "settings";
    if (classes.contains("skill-mode")) return "skill-training";
    if (classes.contains("student-mode")) return "student-tracking";
    if (classes.contains("annual-mode")) return "annual-plan";
    if (classes.contains("course-mode")) return "course-tracking";
    if (classes.contains("app-mode")) return "sorubank";
    return "";
  }

  // Toggle universal FAB visibility
  function updateFabVisibility() {
    const key = getActiveModuleKey();
    const isMobile = window.innerWidth <= 900;
    
    // Show universal FAB on mobile for all modules except sorubank and hub
    if (isMobile && key && key !== "sorubank" && key !== "") {
      if (fab) fab.hidden = false;
    } else {
      if (fab) fab.hidden = true;
      if (panel) panel.hidden = true;
      fab?.setAttribute("aria-expanded", "false");
    }
  }

  // Populate panel links
  function openPanel() {
    const select = getActiveSelect();
    if (!select || !linksContainer) return;
    closeFloatingModuleSwitcher();
    document.querySelector("aside.sidebar")?.classList.remove("is-expanded");
    
    linksContainer.innerHTML = "";
    Array.from(select.options).forEach(opt => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mobile-nav-panel-link-btn";
      if (select.value === opt.value) {
        btn.classList.add("is-active");
      }
      btn.innerHTML = opt.innerHTML;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        select.value = opt.value;
        select.dispatchEvent(new Event("change"));
        if (panel) panel.hidden = true;
        fab?.setAttribute("aria-expanded", "false");
      });
      linksContainer.appendChild(btn);
    });
    
    if (panel) panel.hidden = false;
    fab?.setAttribute("aria-expanded", "true");
  }

  if (fab) {
    fab.addEventListener("click", (e) => {
      e.stopPropagation();
      if (panel) {
        if (!panel.hidden) {
          panel.hidden = true;
          fab.setAttribute("aria-expanded", "false");
        } else {
          openPanel();
        }
      }
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (panel) panel.hidden = true;
    fab?.setAttribute("aria-expanded", "false");
  });

  // Update visibility on resize and module changes
  window.addEventListener("resize", updateFabVisibility);
  
  // Hook into app.js module transition logic
  const originalToggle = document.body.classList.toggle;
  document.body.classList.toggle = function(...args) {
    const res = originalToggle.apply(this, args);
    updateFabVisibility();
    return res;
  };
  
  // Initial visibility check
  updateFabVisibility();
}







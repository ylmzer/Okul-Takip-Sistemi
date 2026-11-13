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
  moduleSwitcherTriggers: document.querySelectorAll("[data-module-switcher-trigger]"),
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
  if (typeof scheduleAutoBackupSnapshot === "function") {
    scheduleAutoBackupSnapshot("skill-profile-change");
  }
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
    els.moduleFloatPanel.style.removeProperty("top");
    els.moduleFloatPanel.style.removeProperty("left");
    els.moduleFloatPanel.style.removeProperty("right");
    els.moduleSwitcherBackdrop?.removeAttribute("hidden");
    document.body.classList.add("module-switcher-open");
  } else {
    const anchor = (trigger instanceof HTMLElement && trigger.getBoundingClientRect().width > 0)
      ? trigger
      : [...document.querySelectorAll(".module-sidebar-brand[data-module-switcher-trigger]")].find((el) => el.offsetParent !== null);
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      const top = Math.min(rect.bottom + 8, window.innerHeight - 360);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - 268));
      els.moduleFloatPanel.style.setProperty("top", `${Math.max(12, top)}px`, "important");
      els.moduleFloatPanel.style.setProperty("left", `${left}px`, "important");
      els.moduleFloatPanel.style.setProperty("right", "auto", "important");
    }
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
  if (typeof scheduleAutoBackupSnapshot === "function") {
    scheduleAutoBackupSnapshot("sorubank-change");
  }
  if (options.sync !== false && typeof scheduleCloudSave === "function") scheduleCloudSave();
}

// Bulut Senkronizasyon -> scripts/core/cloud-sync.js

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

// Soru Bankasi (Soru Havuzu, Sinav Sepeti, Mufredat ve Ice Aktarma) -> scripts/modules/sorubank/bank-and-curriculum.js

// Soru Bankasi (Yevmiye ve Zengin Metin/Tablo Editoru) -> scripts/modules/sorubank/journal-and-editor.js


// Soru Bankasi (Sinav Baski, Onizleme ve Word Cikti) -> scripts/modules/sorubank/export-print.js

// Yedekleme ve Geri Yukleme -> scripts/modules/settings/backup.js


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

els.moduleSwitcherTriggers?.forEach((trigger) => {
  trigger.setAttribute("aria-haspopup", "dialog");
  if (trigger.tagName !== "BUTTON") {
    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        toggleFloatingModuleSwitcher(trigger);
      }
    });
  }
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







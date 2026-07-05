// Theme Manager
function applyTheme(theme) {
  document.body.classList.toggle("dark-mode", theme === "dark");
}
window.applyTheme = applyTheme;
try {
  const settings = JSON.parse(localStorage.getItem("sorubank:global-settings:v1") || "{}");
  applyTheme(settings.theme || "light");
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
      days: "Pzt, Sal"
    },
    {
      id: "stu-2",
      no: "102",
      name: "Mehmet Kaya",
      className: "12/B",
      field: "Muhasebe ve Finansman",
      businessId: "biz-2",
      days: "Çar, Per"
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
let skillReportMonth = "2026-05";
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
  mobileModuleHubBtn: document.querySelector("#mobileModuleHubBtn"),
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

    // If the active store is empty or missing, try to restore from any non-empty profile store in localStorage
    if (isStoreEmpty(store)) {
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
  localStorage.setItem(getSkillProfilesStorageKey(), JSON.stringify(skillProfileStore));
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

function loadSkillState() {
  try {
    const saved = localStorage.getItem(SKILL_STORAGE_KEY);
    if (!saved) return structuredClone(initialSkillState);
    return normalizeSkillStateShape(JSON.parse(saved));
  } catch (error) {
    console.warn("İME modülü verisi okunamadı, varsayılan veri açıldı.", error);
    return structuredClone(initialSkillState);
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
  const showModules = hasUser && !showApp && !showSkill && !showStudent && !showAnnualPlan && !showCourse && !showGlobalSettings;

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
  if (!showApp) document.body.classList.remove("settings-mode");
  if (els.loginPanel) els.loginPanel.hidden = hasUser;
  if (els.moduleHub) els.moduleHub.hidden = !showModules;
  if (els.globalSettingsShell) els.globalSettingsShell.hidden = !showGlobalSettings;
  const sorubankShell = window.SorubankModule?.shell || document.querySelector(".app-shell");
  if (sorubankShell) sorubankShell.hidden = !showApp;
  const skillShell = window.SkillTrainingModule?.shell || els.skillShell;
  if (skillShell) skillShell.hidden = !showSkill;
  if (window.StudentTrackingModule?.shell) window.StudentTrackingModule.shell.hidden = !showStudent;
  if (window.AnnualPlanModule?.shell) window.AnnualPlanModule.shell.hidden = !showAnnualPlan;
  if (window.CourseTrackingModule?.shell) window.CourseTrackingModule.shell.hidden = !showCourse;
  if (els.localUserPasswordInput) els.localUserPasswordInput.value = "";
  if (els.registerPasswordInput) els.registerPasswordInput.value = "";
  renderUserCards();
  if (showSkill) (window.SkillTrainingModule?.render || renderSkillModule)();
  if (showStudent) window.StudentTrackingModule?.render();
  if (showAnnualPlan) window.AnnualPlanModule?.render();
  if (showCourse) window.CourseTrackingModule?.render();
  if (showGlobalSettings) renderGlobalSettings();
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
  (window.SkillTrainingModule?.renderProfileButton || renderSkillProfileButton)();
}

function closeFloatingModuleSwitcher() {
  if (!els.moduleFloatPanel || !els.mobileModuleHubBtn) return;
  els.moduleFloatPanel.hidden = true;
  els.mobileModuleHubBtn.setAttribute("aria-expanded", "false");
}

function toggleFloatingModuleSwitcher() {
  if (!els.moduleFloatPanel || !els.mobileModuleHubBtn) return;
  const willOpen = els.moduleFloatPanel.hidden;
  els.moduleFloatPanel.hidden = !willOpen;
  els.mobileModuleHubBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
}

function updateFloatingModuleSwitcher() {
  const activeModule = localSession?.activeModule || "";
  els.moduleFloatButtons?.forEach((button) => {
    const key = button.dataset.floatingModule || "";
    const isActive = key === (activeModule || "hub");
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
  closeFloatingModuleSwitcher();
}

function handleFloatingModuleChoice(moduleKey) {
  closeFloatingModuleSwitcher();
  if (moduleKey === "hub") {
    returnToModuleHub();
    return;
  }
  openModule(moduleKey);
}

function renderGlobalSettings() {
  window.SorubankSettingsModule?.render(localSession, {
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

  clearLocalUserData();

  saveLocalSession({
    id: user.id,
    name: user.name,
    email: user.email,
    activeModule: landingModule,
    createdAt: new Date().toISOString()
  });
}

function openModule(moduleKey) {
  if (!localSession) return;
  if (!["sorubank", "skill-training", "student-tracking", "annual-plan", "course-tracking", "settings"].includes(moduleKey)) {
    showToast("Bu modül sonraki aşamada bu yapıya bağlanacak.", "warning", "Hazırlanıyor");
    return;
  }
  saveLocalSession({
    ...localSession,
    activeModule: moduleKey,
    lastModuleAt: new Date().toISOString()
  });
  if (moduleKey === "sorubank") (window.SorubankModule?.setView || setView)("bank");
  if (moduleKey === "skill-training") {
    const activeView = window.SkillTrainingModule?.state?.activeView || skillState.activeView || "dashboard";
    (window.SkillTrainingModule?.setView || setSkillView)(activeView);
  }
  if (moduleKey === "student-tracking") window.StudentTrackingModule?.setView(window.StudentTrackingModule.state?.activeView || "dashboard");
  if (moduleKey === "annual-plan") window.AnnualPlanModule?.setView(window.AnnualPlanModule.state?.activeView || "wizard");
  if (moduleKey === "course-tracking") window.CourseTrackingModule?.setView(window.CourseTrackingModule.state?.activeView || "tracking");
  if (moduleKey === "settings") renderGlobalSettings();
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
  if (action === "settings") {
    openProfileDialog();
    return;
  }
  if (action === "logout") {
    logoutLocalSession();
  }
}

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
  skillProfileStore = normalizeSkillProfileStore(skillProfileStore);
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
  saveSkillProfileStore();
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
    saveSkillProfileStore();
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
  saveSkillProfileStore();
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
  saveSkillProfileStore();
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
}

async function scheduleCloudSave() {
  // Buluttan veri indirilirken veya bulut başlatılırken push yapma - race condition engeller
  if (isSyncingFromCloud || !isCloudInitialized) return;
  localStorage.setItem("sorubank:cloud-local-write", new Date().toISOString());
  if (!cloudState.client || !cloudState.session) return;

  if (isPushing) {
    hasPendingPush = true;
    return;
  }

  isPushing = true;
  while (true) {
    hasPendingPush = false;
    try {
      await pushCloudState({ silent: true });
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
  // window.location.reload() kullanmıyoruz çünkü o sonsuz döngüye neden oluyor
  try {
    // Soru Bankası state'ini yeniden yükle
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = normalizeState(JSON.parse(raw));
    }
    // Modülleri yeniden başlat
    if (window.CourseTrackingModule?.init) {
      window.CourseTrackingModule.init({ returnToModuleHub });
    }
    if (window.StudentTrackingModule?.init) {
      window.StudentTrackingModule.init({ returnToModuleHub });
    }
    if (window.AnnualPlanModule?.init) {
      window.AnnualPlanModule.init({ returnToModuleHub });
    }
    // Skill modülünü yeniden yükle
    if (typeof loadSkillProfileStore === "function") loadSkillProfileStore();
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
    if (!data) {
      if (overlay) overlay.setAttribute("hidden", "true");
      return;
    }

    const remoteUpdatedAt = data.updated_at;
    const localLastSync = localStorage.getItem("sorubank:cloud-last-sync") || "";

    if (remoteUpdatedAt && remoteUpdatedAt !== localLastSync) {
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
      cloudState.lastSyncAt = localLastSync;
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
      const localEmail = localSession ? normalizeEmail(localSession.email) : "";
      if (email && localEmail && email !== localEmail) {
        console.warn("Session email mismatch. Syncing local profile to active cloud account:", email);
        const name = data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || email.split("@")[0];
        saveLocalSession({
          id: data.session.user.id,
          name: name,
          email: email,
          activeModule: localSession?.activeModule || "",
          createdAt: new Date().toISOString()
        });
      }
      await checkAndSyncCloudBackground();
    } else {
      if (overlay) overlay.setAttribute("hidden", "true");
    }

    client.auth.onAuthStateChange((_event, session) => {
      cloudState.session = session;
      if (session) {
        const email = normalizeEmail(session.user.email);
        const localEmail = localSession ? normalizeEmail(localSession.email) : "";
        if (email && localEmail && email !== localEmail) {
          const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || email.split("@")[0];
          saveLocalSession({
            id: session.user.id,
            name: name,
            email: email,
            activeModule: localSession?.activeModule || "",
            createdAt: new Date().toISOString()
          });
        }
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
          reloadAppState();
          isSyncingFromCloud = false;
          finalizeCloudInitialization();
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
  try {
    const payload = {
      user_id: userId,
      state: createBackupPackage(Object.keys(BACKUP_MODULES)),
      updated_at: new Date().toISOString()
    };
    const { error } = await cloudState.client
      .from("sorubank_cloud_states")
      .upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
    cloudState.lastSyncAt = payload.updated_at;
    localStorage.setItem("sorubank:cloud-last-sync", payload.updated_at);
    localStorage.removeItem("sorubank:cloud-local-write");
    cloudState.lastError = "";
    if (!options.silent) showToast("Veriler buluta gönderildi.");
  } catch (error) {
    cloudState.lastError = `Buluta kaydedilemedi: ${error.message}`;
    if (!options.silent) showToast(cloudState.lastError, "error");
  } finally {
    cloudState.syncing = false;
    renderCloudStatus();
  }
}

function applyCloudState(remoteState, updatedAt = "") {
  state = normalizeState({ ...structuredClone(initialState), ...(remoteState || {}) });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  cloudState.lastSyncAt = updatedAt || new Date().toISOString();
  localStorage.setItem("sorubank:cloud-last-sync", cloudState.lastSyncAt);
  localStorage.removeItem("sorubank:cloud-local-write");
  cloudState.lastError = "";
  render();
  renderCloudStatus();
}

function checkIsLocalStateEmpty() {
  try {
    // 1. Soru Bankası kontrolü
    const qCount = state?.questions?.length || 0;
    if (qCount > 0) return false;

    // 2. Kurs takibi kontrolü
    const courseStateRaw = localStorage.getItem("coursetracking_state");
    if (courseStateRaw) {
      const parsed = JSON.parse(courseStateRaw);
      if (parsed?.courses?.length > 0 || parsed?.questions?.length > 0) return false;
    }

    // 3. Öğrenci takibi kontrolü
    const studentStateRaw = localStorage.getItem("student-tracking:state:v1");
    if (studentStateRaw) {
      const parsed = JSON.parse(studentStateRaw);
      if (parsed?.students?.length > 0) return false;
    }

    // 4. Yıllık plan kontrolü
    const annualStateRaw = localStorage.getItem("annual-plan:state:v1");
    if (annualStateRaw) {
      const parsed = JSON.parse(annualStateRaw);
      if (parsed?.plans?.length > 0) return false;
    }

    return true;
  } catch (e) {
    return true;
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

function getSkillBusiness(id) {
  return skillState.businesses.find((business) => business.id === id);
}

function getSkillFieldLabel(field) {
  if (!field) return "";
  const area = String(field.area || "").trim();
  const branch = String(field.branch || "").trim();
  if (!area && !branch) return "";
  if (!branch || branch.toLocaleLowerCase("tr-TR") === "belirtilmedi") return area;
  if (!area || area.toLocaleLowerCase("tr-TR") === "belirtilmedi") return branch;
  return `${area} / ${branch}`;
}

function setSkillStudentDays(value = "") {
  if (els.skillStudentDays) els.skillStudentDays.value = value;
  const selectedDays = String(value).split(",").map((day) => day.trim()).filter(Boolean);
  els.skillStudentDayPicker?.querySelectorAll("[data-skill-student-day]").forEach((button) => {
    button.classList.toggle("is-active", selectedDays.includes(button.dataset.skillStudentDay));
  });
}

function selectedClassDays() {
  return Array.from(els.skillClassDayPicker?.querySelectorAll("[data-skill-class-day].is-active") || [])
    .map((button) => button.dataset.skillClassDay);
}

function normalizeSkillClass(value = "") {
  return String(value).trim().toLocaleLowerCase("tr-TR");
}

function getSkillStudentClassOptions() {
  const classMap = new Map();
  skillState.students.forEach((student) => {
    const className = String(student.className || "").trim();
    if (!className) return;
    const key = normalizeSkillClass(className);
    const current = classMap.get(key) || { name: className, count: 0 };
    current.count += 1;
    classMap.set(key, current);
  });
  return Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name, "tr-TR", { numeric: true }));
}

function getStudentCountByClass(className) {
  const normalizedClass = normalizeSkillClass(className);
  if (!normalizedClass) return 0;
  return skillState.students.filter((student) => normalizeSkillClass(student.className) === normalizedClass).length;
}

function getClassDaysFromStudents(className) {
  const normalizedClass = normalizeSkillClass(className);
  const dayCounts = new Map();
  skillState.students.forEach((student) => {
    if (normalizeSkillClass(student.className) !== normalizedClass) return;
    const days = String(student.days || "").trim();
    if (!days) return;
    dayCounts.set(days, (dayCounts.get(days) || 0) + 1);
  });
  return Array.from(dayCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function setSkillClassDayPickerDays(value = "") {
  const selectedDays = String(value).split(",").map((day) => day.trim()).filter(Boolean);
  els.skillClassDayPicker?.querySelectorAll("[data-skill-class-day]").forEach((button) => {
    button.classList.toggle("is-active", selectedDays.includes(button.dataset.skillClassDay));
  });
}

function updateSkillClassDaySummary() {
  if (!els.skillClassDayStudentCount || !els.skillClassDaySelect) return;
  const className = els.skillClassDaySelect.value;
  const count = getStudentCountByClass(className);
  els.skillClassDayStudentCount.textContent = className
    ? `${className} sınıfında ${count} öğrenci`
    : "Sınıf seçilmedi";
}

function getPreferredClassForDayDialog() {
  const selectedIds = selectedSkillIds(els.skillStudentTable, "[data-skill-select-student]");
  const selectedClasses = selectedIds
    .map((id) => skillState.students.find((student) => student.id === id)?.className)
    .map((className) => String(className || "").trim())
    .filter(Boolean);
  const uniqueSelectedClasses = [...new Set(selectedClasses.map((className) => normalizeSkillClass(className)))];
  if (uniqueSelectedClasses.length === 1) return selectedClasses[0];
  return (els.skillStudentClass?.value || els.skillStudentClassFilter?.value || "").trim();
}

function renderSkillClassDayOptions(preferredClass = "") {
  if (!els.skillClassDaySelect) return;
  const classes = getSkillStudentClassOptions();
  els.skillClassDaySelect.innerHTML = [
    `<option value="">Sınıf seçiniz</option>`,
    ...classes.map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)} (${item.count})</option>`)
  ].join("");
  const preferredKey = normalizeSkillClass(preferredClass);
  const matchedClass = classes.find((item) => normalizeSkillClass(item.name) === preferredKey)?.name || classes[0]?.name || "";
  els.skillClassDaySelect.value = matchedClass;
  els.skillClassDaySelect.disabled = !classes.length;
}

function openSkillClassDayDialog() {
  const classes = getSkillStudentClassOptions();
  if (!classes.length) return showToast("Gün atamak için önce sınıf bilgisi olan öğrenci ekleyin.", "warning");
  renderSkillClassDayOptions(getPreferredClassForDayDialog());
  setSkillClassDayPickerDays(getClassDaysFromStudents(els.skillClassDaySelect?.value));
  updateSkillClassDaySummary();
  els.skillClassDayDialog?.showModal();
}

function closeSkillClassDayDialog() {
  if (els.skillClassDayDialog?.open) els.skillClassDayDialog.close();
}

function assignDaysToClass(event) {
  event.preventDefault();
  const className = (els.skillClassDaySelect?.value || "").trim();
  const days = selectedClassDays();
  if (!className) return showToast("Gün atamak için şube / sınıf seçin.", "warning");
  if (!days.length) return showToast("Şubeye atanacak okul günlerini seçin.", "warning");
  const normalizedClass = normalizeSkillClass(className);
  let updatedCount = 0;
  skillState.students = skillState.students.map((student) => {
    if (normalizeSkillClass(student.className) !== normalizedClass) return student;
    updatedCount += 1;
    return { ...student, days: days.join(", ") };
  });
  if (!updatedCount) return showToast(`${className} şubesinde öğrenci bulunamadı.`, "warning");
  saveSkillState();
  closeSkillClassDayDialog();
  renderSkillModule();
  showToast(`${className} şubesindeki ${updatedCount} öğrenciye okul günü atandı.`);
}

function getCurrentSkillHolidayYear() {
  return new Date().getFullYear();
}

function getSkillHolidayYear() {
  return Number(els.skillHolidayYear?.value) || getCurrentSkillHolidayYear();
}

function getSkillHolidayYears() {
  const currentYear = getCurrentSkillHolidayYear();
  const years = new Set([currentYear - 1, currentYear, currentYear + 1]);
  skillState.holidays.forEach((holiday) => {
    const year = Number(String(holiday.startDate || "").slice(0, 4));
    if (year) years.add(year);
  });
  return Array.from(years).sort((a, b) => a - b);
}

function getSkillHolidayPartLabel(part = "full") {
  return {
    full: "Tam gün",
    am: "Öğleden önce",
    pm: "Öğleden sonra"
  }[part] || "Tam gün";
}

function formatSkillDate(value = "") {
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return "";
  return `${day}.${month}.${year}`;
}

function getSkillHolidayDisplayDate(holiday) {
  const start = formatSkillDate(holiday.startDate);
  const end = formatSkillDate(holiday.endDate || holiday.startDate);
  return start === end ? start : `${start} - ${end}`;
}

function sortSkillHolidays(holidays) {
  return [...holidays].sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || "")));
}

function getNextSkillHoliday() {
  const today = new Date().toISOString().slice(0, 10);
  return sortSkillHolidays(skillState.holidays || []).find((holiday) => String(holiday.endDate || holiday.startDate || "") >= today);
}

function getAutomaticSkillHolidays(year) {
  const fixedHolidays = [
    { startDate: `${year}-01-01`, endDate: `${year}-01-01`, name: "Yılbaşı" },
    { startDate: `${year}-04-23`, endDate: `${year}-04-23`, name: "Ulusal Egemenlik ve Çocuk Bayramı" },
    { startDate: `${year}-05-01`, endDate: `${year}-05-01`, name: "Emek ve Dayanışma Günü" },
    { startDate: `${year}-05-19`, endDate: `${year}-05-19`, name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
    { startDate: `${year}-07-15`, endDate: `${year}-07-15`, name: "Demokrasi ve Milli Birlik Günü" },
    { startDate: `${year}-08-30`, endDate: `${year}-08-30`, name: "Zafer Bayramı" },
    { startDate: `${year}-10-28`, endDate: `${year}-10-29`, startPart: "pm", endPart: "full", name: "Cumhuriyet Bayramı" }
  ];
  const yearSpecific = {
    2026: [
      { startDate: "2026-01-19", endDate: "2026-01-30", name: "MEB yarıyıl tatili", isSchoolBreak: true },
      { startDate: "2026-03-16", endDate: "2026-03-20", name: "MEB 2. dönem ara tatili", isSchoolBreak: true },
      { startDate: "2026-03-19", endDate: "2026-03-22", startPart: "pm", endPart: "full", name: "Ramazan Bayramı Tatili" },
      { startDate: "2026-05-26", endDate: "2026-05-30", startPart: "pm", endPart: "full", name: "Kurban Bayramı Tatili" }
    ]
  };
  return [...fixedHolidays, ...(yearSpecific[year] || [])].map((holiday) => ({
    id: uid("hol"),
    startPart: "full",
    endPart: "full",
    isSchoolBreak: false,
    ...holiday
  }));
}

function renderSkillHolidayYears() {
  if (!els.skillHolidayYear) return;
  const currentValue = els.skillHolidayYear.value || String(getCurrentSkillHolidayYear());
  els.skillHolidayYear.innerHTML = getSkillHolidayYears().map((year) => `<option value="${year}">${year}</option>`).join("");
  els.skillHolidayYear.value = getSkillHolidayYears().includes(Number(currentValue)) ? currentValue : String(getCurrentSkillHolidayYear());
}

function clearSkillHolidayForm() {
  const year = getSkillHolidayYear();
  if (els.skillHolidayId) els.skillHolidayId.value = "";
  if (els.skillHolidayStartDate) els.skillHolidayStartDate.value = `${year}-01-01`;
  if (els.skillHolidayEndDate) els.skillHolidayEndDate.value = `${year}-01-01`;
  if (els.skillHolidayStartPart) els.skillHolidayStartPart.value = "full";
  if (els.skillHolidayEndPart) els.skillHolidayEndPart.value = "full";
  if (els.skillHolidayName) els.skillHolidayName.value = "";
  if (els.skillHolidaySchoolBreak) els.skillHolidaySchoolBreak.checked = false;
}

function renderSkillHolidays() {
  if (!els.skillHolidayTable) return;
  ensureSkillCollections();
  renderSkillHolidayYears();
  const year = getSkillHolidayYear();
  if (!els.skillHolidayStartDate?.value && !els.skillHolidayId?.value) clearSkillHolidayForm();
  const rows = sortSkillHolidays(skillState.holidays.filter((holiday) => String(holiday.startDate || "").startsWith(`${year}-`)));
  els.skillHolidayTable.innerHTML = rows.length ? `
    <table class="skill-data-table skill-holiday-table">
      <thead>
        <tr>
          <th>Seç</th>
          <th>No</th>
          <th>Başlangıç</th>
          <th>Bitiş</th>
          <th>Ara Tatil / Yarıyıl</th>
          <th>Başlangıç Dilimi</th>
          <th>Bitiş Dilimi</th>
          <th>Açıklama</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((holiday, index) => `
          <tr data-skill-edit-holiday="${holiday.id}">
            <td><input type="checkbox" value="${holiday.id}" data-skill-select-holiday /></td>
            <td>${index + 1}</td>
            <td>${escapeHtml(formatSkillDate(holiday.startDate))}</td>
            <td>${escapeHtml(formatSkillDate(holiday.endDate || holiday.startDate))}</td>
            <td><input type="checkbox" ${holiday.isSchoolBreak ? "checked" : ""} disabled /></td>
            <td>${escapeHtml(getSkillHolidayPartLabel(holiday.startPart))}</td>
            <td>${escapeHtml(getSkillHolidayPartLabel(holiday.endPart))}</td>
            <td>${escapeHtml(holiday.name || "-")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : `<div class="empty-state">Bu yıl için tatil kaydı yok. Otomatik çekebilir veya manuel ekleyebilirsiniz.</div>`;
}

function saveSkillHoliday(event) {
  event.preventDefault();
  const startDate = els.skillHolidayStartDate?.value || "";
  const endDate = els.skillHolidayEndDate?.value || startDate;
  const name = (els.skillHolidayName?.value || "").trim();
  if (!startDate || !endDate || !name) return showToast("Tatil için tarih ve açıklama girin.", "warning");
  if (endDate < startDate) return showToast("Bitiş tarihi başlangıçtan önce olamaz.", "warning");
  const id = els.skillHolidayId?.value || uid("hol");
  const nextHoliday = {
    id,
    startDate,
    endDate,
    startPart: els.skillHolidayStartPart?.value || "full",
    endPart: els.skillHolidayEndPart?.value || "full",
    name,
    isSchoolBreak: Boolean(els.skillHolidaySchoolBreak?.checked)
  };
  const index = skillState.holidays.findIndex((holiday) => holiday.id === id);
  if (index >= 0) skillState.holidays[index] = nextHoliday;
  else skillState.holidays.push(nextHoliday);
  saveSkillState();
  clearSkillHolidayForm();
  renderSkillModule();
  showToast("Tatil kaydı kaydedildi.");
}

function fillAutomaticSkillHolidays() {
  const year = getSkillHolidayYear();
  const automaticHolidays = getAutomaticSkillHolidays(year);
  skillState.holidays = [
    ...skillState.holidays.filter((holiday) => !String(holiday.startDate || "").startsWith(`${year}-`)),
    ...automaticHolidays
  ];
  saveSkillState();
  clearSkillHolidayForm();
  renderSkillModule();
  showToast(`${year} yılı tatil kayıtları otomatik eklendi.`);
}

function editSkillHoliday(id) {
  const holiday = skillState.holidays.find((item) => item.id === id);
  if (!holiday) return;
  if (els.skillHolidayId) els.skillHolidayId.value = holiday.id;
  if (els.skillHolidayStartDate) els.skillHolidayStartDate.value = holiday.startDate || "";
  if (els.skillHolidayEndDate) els.skillHolidayEndDate.value = holiday.endDate || holiday.startDate || "";
  if (els.skillHolidayStartPart) els.skillHolidayStartPart.value = holiday.startPart || "full";
  if (els.skillHolidayEndPart) els.skillHolidayEndPart.value = holiday.endPart || "full";
  if (els.skillHolidayName) els.skillHolidayName.value = holiday.name || "";
  if (els.skillHolidaySchoolBreak) els.skillHolidaySchoolBreak.checked = Boolean(holiday.isSchoolBreak);
}

function handleSkillHolidayTableClick(event) {
  if (event.target.closest("input[type='checkbox']")) return;
  const row = event.target.closest("[data-skill-edit-holiday]");
  if (row) editSkillHoliday(row.dataset.skillEditHoliday);
}

function deleteSelectedSkillHolidays() {
  const ids = selectedSkillIds(els.skillHolidayTable, "[data-skill-select-holiday]");
  if (!ids.length) return showToast("Silmek için tatil kaydı seçin.", "warning");
  skillState.holidays = skillState.holidays.filter((holiday) => !ids.includes(holiday.id));
  saveSkillState();
  clearSkillHolidayForm();
  renderSkillModule();
  showToast("Seçili tatil kayıtları silindi.");
}

function deleteAllSkillHolidays() {
  skillState.holidays = [];
  saveSkillState();
  clearSkillHolidayForm();
  renderSkillModule();
  showToast("Tüm tatil kayıtları silindi.");
}

function getSkillDayName(day) {
  return {
    "1": "Pazartesi",
    "2": "Salı",
    "3": "Çarşamba",
    "4": "Perşembe",
    "5": "Cuma"
  }[day] || "Gün yok";
}

function setSkillView(view) {
  skillState.activeView = view;
  saveSkillState();
  els.skillNavButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.skillView === view);
  });
  if (els.skillNavMobileSelect) {
    els.skillNavMobileSelect.value = view;
  }
  const dataViews = ["school", "businesses", "fields", "coordinators", "students", "holidays"];
  const dataMenuButton = document.querySelector(".skill-nav-parent");
  if (dataMenuButton) dataMenuButton.classList.toggle("is-active", dataViews.includes(view));
  els.skillViewPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.skillPanel === view);
  });
  const titles = {
    dashboard: `Hoş geldin, ${(localSession?.name || "Kullanıcı").split(" ")[0].toLocaleUpperCase("tr-TR")}`,
    students: "Öğrenciler",
    businesses: "İşletmeler",
    coordinators: "Koordinatör Tanımlama",
    reports: "Raporlar",
    school: "Okul & Koordinatörler",
    fields: "Alan / Dal",
    holidays: "Resmi Tatiller"
  };
  if (els.skillPageTitle) els.skillPageTitle.textContent = titles[view] || "İme Evrak";
}

function renderSkillModule() {
  if (!els.skillShell) return;
  ensureSkillCollections();
  renderSkillProfileButton();
  renderSkillStats();
  renderSkillSelects();
  renderSkillSchools();
  renderSkillTeachers();
  renderSkillFields();
  renderSkillStudents();
  renderSkillBusinesses();
  renderSkillCoordinators();
  renderSkillHolidays();
  renderSkillAlerts();
  renderSkillReportAssignments();
  setSkillView(skillState.activeView || "dashboard");
}

function renderSkillStats() {
  if (!els.skillStatGrid) return;
  const activeStudents = skillState.students.filter((student) => student.active !== false).length;
  const businessCount = skillState.businesses.length;
  const coordinatorCount = skillState.teacherPool?.length || skillState.coordinators.length;
  const fieldCount = skillState.fields?.length || new Set(skillState.students.map((student) => student.field).filter(Boolean)).size;
  const passiveStudents = skillState.students.filter((student) => student.active === false).length;
  const nextHoliday = getNextSkillHoliday() || { name: "Tatil kaydı yok", startDate: "" };
  els.skillStatGrid.innerHTML = `
    <div class="skill-stat-card">
      <span>Toplam Öğrenci</span>
      <strong>${activeStudents}</strong>
      <div class="stat-dot-row">
        <small class="stat-dot">${activeStudents} aktif</small>
        <small class="stat-dot is-passive">${passiveStudents} aktif olmayan</small>
      </div>
    </div>
    <div class="skill-stat-card">
      <span>Toplam İşletme</span>
      <strong>${businessCount}</strong>
      <small>Aktif işletme</small>
    </div>
    <div class="skill-stat-card">
      <span>Alan / Dal</span>
      <strong>${fieldCount}</strong>
      <small>Tanımlı alan / dal</small>
    </div>
    <div class="skill-stat-card">
      <span>Koordinatör</span>
      <strong>${coordinatorCount}</strong>
      <small>Aktif koordinatör öğretmen</small>
    </div>
    <div class="skill-stat-card skill-holiday-card">
      <span>Yaklaşan Resmi Tatil</span>
      <h3>${escapeHtml(nextHoliday.name)}</h3>
      <small>${escapeHtml(getSkillHolidayDisplayDate(nextHoliday) || "Tarih girilmedi")}</small>
    </div>
  `;
  if (els.skillYearBadge) els.skillYearBadge.textContent = skillState.school.year || "2025-2026";
  if (els.skillSchoolBadge) els.skillSchoolBadge.textContent = skillState.school.name || "Okul bilgisi girilmedi";
}

function renderSkillAlerts() {
  if (!els.skillAlertList) return;
  const alerts = [];
  const studentsWithoutBusiness = skillState.students.filter((student) => !student.businessId).length;
  const coordinatorsWithoutDay = skillState.coordinators.filter((item) => !item.day).length;
  const nextHoliday = getNextSkillHoliday();

  if (studentsWithoutBusiness) {
    alerts.push({
      title: "Öğrenci Eşleştirme Kontrolü",
      text: `${studentsWithoutBusiness} öğrencinin işletme eşleştirmesi eksik.`,
      buttonText: "Öğrenciler",
      target: "students"
    });
  }
  if (coordinatorsWithoutDay) {
    alerts.push({
      title: "Koordinatör Görev Kontrolü",
      text: `${coordinatorsWithoutDay} koordinatör görevinde gün atanmamış.`,
      buttonText: "Koordinatörler",
      target: "coordinators"
    });
  }
  if (!skillState.businesses.length) {
    alerts.push({
      title: "İşletme Listesi Kontrolü",
      text: "İşletme listesi boş. Önce işletme ekleyin.",
      buttonText: "İşletmeler",
      target: "businesses"
    });
  }

  // Resmi Tatil alertleri
  if (nextHoliday) {
    alerts.push({
      title: "Yaklaşan Resmi Tatil",
      text: `${getSkillHolidayDisplayDate(nextHoliday)} tarihinde ${nextHoliday.name} var. Görev ve rapor tarihlerini kontrol edin.`,
      buttonText: "Resmi Tatiller",
      target: "holidays"
    });
  } else if (!skillState.holidays || !skillState.holidays.length) {
    alerts.push({
      title: "Resmi Tatil Takvimi",
      text: "Resmi tatil kaydı yok. Bu yılı otomatik çekerek takvimi oluşturun.",
      buttonText: "Resmi Tatiller",
      target: "holidays"
    });
  }

  const alertCountEl = document.getElementById("skillAlertCount");
  if (alertCountEl) {
    alertCountEl.textContent = `${alerts.length} bildirim`;
  }

  els.skillAlertList.innerHTML = alerts.map((alert) => `
    <div class="skill-alert">
      <span aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="display: block;">
          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"/>
        </svg>
      </span>
      <div>
        <strong>${escapeHtml(alert.title)}</strong>
        <small>${escapeHtml(alert.text)}</small>
      </div>
      <button data-skill-view-target="${escapeHtml(alert.target)}" type="button">${escapeHtml(alert.buttonText)}</button>
    </div>
  `).join("");
}

function renderSkillReportAssignments() {
  if (!els.skillReportAssignmentList) return;
  renderSkillReportControls();
  const query = (els.skillReportSearch?.value || "").toLocaleLowerCase("tr-TR");
  const teacherFilter = els.skillReportCoordinatorFilter?.value || "";
  const includeEmpty = Boolean(els.skillReportIncludeEmpty?.checked);
  const rows = skillState.businesses.filter((business) => {
    const students = skillState.students.filter((student) => student.businessId === business.id);
    const coordinator = skillState.coordinators.find((item) => item.businessId === business.id);
    const matchesEmpty = includeEmpty || students.length > 0;
    const matchesTeacher = !teacherFilter || coordinator?.teacher === teacherFilter;
    const matchesQuery = [business.name, coordinator?.teacher, ...students.map((student) => student.name)]
      .join(" ")
      .toLocaleLowerCase("tr-TR")
      .includes(query);
    return matchesEmpty && matchesTeacher && matchesQuery;
  });
  if (els.skillReportBusinessCount) els.skillReportBusinessCount.textContent = rows.length;
  if (els.skillReportStudentCount) {
    els.skillReportStudentCount.textContent = rows.reduce((total, business) => (
      total + skillState.students.filter((student) => student.businessId === business.id).length
    ), 0);
  }
  els.skillReportAssignmentList.innerHTML = rows.length ? rows.map((business) => {
    const students = skillState.students.filter((student) => student.businessId === business.id);
    const coordinator = skillState.coordinators.find((item) => item.businessId === business.id);
    return `
      <label class="skill-assignment-row" data-skill-report-business-row="${business.id}">
        <input type="checkbox" value="${business.id}" data-skill-report-business />
        <span>
          <strong>${escapeHtml(business.name)}</strong>
          <small>${students.length} öğrenci · Koordinatör: ${escapeHtml(coordinator?.teacher || "Atanmadı")}</small>
        </span>
      </label>
    `;
  }).join("") : `<div class="empty-state">İşletme kaydı bulunamadı.</div>`;
}

function renderSkillReportControls() {
  if (els.skillReportCoordinatorFilter) {
    const current = els.skillReportCoordinatorFilter.value || "";
    const teachers = [...new Set(skillState.coordinators.map((item) => item.teacher).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr-TR"));
    els.skillReportCoordinatorFilter.innerHTML = [`<option value="">Tümü</option>`, ...teachers.map((teacher) => `<option value="${escapeHtml(teacher)}">${escapeHtml(teacher)}</option>`)].join("");
    els.skillReportCoordinatorFilter.value = teachers.includes(current) ? current : "";
  }
  if (els.skillReportMonthSelect && !els.skillReportMonthSelect.options.length) {
    const months = [];
    for (let offset = -6; offset <= 6; offset += 1) {
      const date = new Date(2026, 4 + offset, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.push(`<option value="${value}">${date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</option>`);
    }
    els.skillReportMonthSelect.innerHTML = months.join("");
    els.skillReportMonthSelect.value = skillReportMonth;
    syncSkillReportRange();
  }
  if (els.skillTerminationStudent) {
    const current = els.skillTerminationStudent.value || "";
    els.skillTerminationStudent.innerHTML = [
      `<option value="">Öğrenci seçiniz</option>`,
      ...skillState.students.map((student) => {
        const business = getSkillBusiness(student.businessId);
        const label = `${student.no || "-"} - ${student.name || "Öğrenci"} (${business?.name || "İşletme yok"})`;
        return `<option value="${student.id}">${escapeHtml(label)}</option>`;
      })
    ].join("");
    els.skillTerminationStudent.value = skillState.students.some((student) => student.id === current) ? current : "";
  }
}

function syncSkillReportMonthDates() {
  if (!els.skillReportMonthSelect) return;
  skillReportMonth = els.skillReportMonthSelect.value || skillReportMonth;
  const [year, month] = skillReportMonth.split("-").map(Number);
  if (!year || !month) return;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  if (els.skillReportStartDate) els.skillReportStartDate.value = start;
  if (els.skillReportEndDate) els.skillReportEndDate.value = end;
}

function getCheckedSkillReportRange() {
  return document.querySelector('input[name="skillReportRange"]:checked')?.value || "month";
}

function setCheckedSkillReportRange(value) {
  const input = document.querySelector(`input[name="skillReportRange"][value="${value}"]`);
  if (input) input.checked = true;
}

function setSkillReportDateInputsEnabled(enabled) {
  if (els.skillReportStartDate) els.skillReportStartDate.disabled = !enabled;
  if (els.skillReportEndDate) els.skillReportEndDate.disabled = !enabled;
}

function getSkillWeekRange(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { startDate: toSkillIsoDate(start), endDate: toSkillIsoDate(end) };
}

function syncSkillReportRange() {
  const range = getCheckedSkillReportRange();
  if (range === "week") {
    const week = getSkillWeekRange();
    if (els.skillReportStartDate) els.skillReportStartDate.value = week.startDate;
    if (els.skillReportEndDate) els.skillReportEndDate.value = week.endDate;
    setSkillReportDateInputsEnabled(false);
  } else if (range === "month") {
    const today = new Date();
    skillReportMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    if (els.skillReportMonthSelect) {
      if (![...els.skillReportMonthSelect.options].some((option) => option.value === skillReportMonth)) {
        els.skillReportMonthSelect.add(new Option(today.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }), skillReportMonth));
      }
      els.skillReportMonthSelect.value = skillReportMonth;
    }
    syncSkillReportMonthDates();
    setSkillReportDateInputsEnabled(false);
  } else {
    setSkillReportDateInputsEnabled(true);
  }
  runSkillReportPrecheck();
}

function moveSkillReportMonth(offset) {
  const [year, month] = skillReportMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  skillReportMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (els.skillReportMonthSelect) {
    if (![...els.skillReportMonthSelect.options].some((option) => option.value === skillReportMonth)) {
      els.skillReportMonthSelect.add(new Option(date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }), skillReportMonth));
    }
    els.skillReportMonthSelect.value = skillReportMonth;
  }
  setCheckedSkillReportRange("month");
  syncSkillReportMonthDates();
  setSkillReportDateInputsEnabled(false);
  runSkillReportPrecheck();
}

function getSelectedReportBusinessIds() {
  return selectedSkillIds(els.skillReportAssignmentList, "[data-skill-report-business]");
}

function getReportDateRange() {
  return {
    startDate: els.skillReportStartDate?.value || `${skillReportMonth}-01`,
    endDate: els.skillReportEndDate?.value || `${skillReportMonth}-31`
  };
}

function getDatesBetween(startDate, endDate) {
  const dates = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(new Date(date));
  }
  return dates;
}

function getShortSkillDay(date) {
  return ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][date.getDay()];
}

function getLongSkillDay(date) {
  return ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"][date.getDay()];
}

function getSkillReportDayHeader(date) {
  return `${date.getDate()} ${getLongSkillDay(date)}`;
}

function formatSkillLongDate(date) {
  const dateObject = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  return `${formatSkillDate(toSkillIsoDate(dateObject))} ${getLongSkillDay(dateObject)}`;
}

function isEntireWeekHoliday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(d.setDate(diff));
  
  for (let i = 0; i < 5; i++) {
    const checkDate = new Date(monday);
    checkDate.setDate(monday.getDate() + i);
    const iso = toSkillIsoDate(checkDate);
    if (!getHolidayForDate(iso)) {
      return false;
    }
  }
  return true;
}

function formatGuidanceDate(date) {
  const dateObject = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  const iso = toSkillIsoDate(dateObject);
  const holiday = getHolidayForDate(iso);
  if (holiday) {
    const month = String(dateObject.getMonth() + 1).padStart(2, "0");
    const year = dateObject.getFullYear();
    return `.....${month}.${year}`;
  }
  return formatSkillDate(iso);
}

function formatGuidanceLongDate(date) {
  const dateObject = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  const formatted = formatGuidanceDate(dateObject);
  return `${formatted} ${getLongSkillDay(dateObject)}`;
}

function toSkillIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getHolidayForDate(dateValue) {
  return skillState.holidays.find((holiday) => dateValue >= holiday.startDate && dateValue <= (holiday.endDate || holiday.startDate));
}

function getBaseReportSymbolForDate(student, date) {
  if (date.getDay() === 0 || date.getDay() === 6) return "";
  const schoolDays = String(student.days || "").split(",").map((day) => day.trim()).filter(Boolean);
  const isSchoolDay = schoolDays.includes(getShortSkillDay(date));
  if (isSchoolDay) return els.skillReportSchoolSymbolEnabled?.checked === false ? "" : "O";
  return els.skillReportBusinessSymbolEnabled?.checked === false ? "" : "X";
}

function getActiveSkillSchoolType() {
  return skillState?.schoolType || "mesem";
}

function getSchoolForStudent(student) {
  if (!student || !student.businessId) return skillState?.schoolRecords?.[0] || skillState?.school;
  const coordinator = skillState.coordinators.find((c) => c.businessId === student.businessId);
  return skillState.schoolRecords.find((school) => school.id === coordinator?.schoolId) || skillState.schoolRecords?.[0] || skillState.school;
}

function getStudentSchoolConfig(student) {
  const school = getSchoolForStudent(student);
  const schoolType = normalizeSkillSchoolType(school?.schoolType || skillState.schoolType || "mesem");
  const summerStartDate = school?.summerStartDate || "";
  const summerEndDate = school?.summerEndDate || "";
  return { schoolType, summerStartDate, summerEndDate };
}

function isSkillSchoolBreakForMesem(holiday, student = null) {
  if (!Boolean(holiday?.isSchoolBreak)) return false;
  if (student) {
    const { schoolType } = getStudentSchoolConfig(student);
    return schoolType === "mesem";
  }
  return getActiveSkillSchoolType() === "mesem";
}

function getSkillMesemBreakSymbol(date) {
  if (date.getDay() === 0 || date.getDay() === 6) return "";
  return els.skillReportBusinessSymbolEnabled?.checked === false ? "" : "X";
}

function isHolidaySession(holiday, dateValue, session) {
  const startDate = holiday.startDate;
  const endDate = holiday.endDate || holiday.startDate;
  const startPart = holiday.startPart || "full";
  const endPart = holiday.endPart || "full";
  if (dateValue > startDate && dateValue < endDate) return true;
  if (dateValue === startDate && dateValue === endDate) {
    if (startPart === "full" || endPart === "full") return true;
    return startPart === session || endPart === session;
  }
  if (dateValue === startDate) {
    if (startPart === "full") return true;
    return startPart === session;
  }
  if (dateValue === endDate) {
    if (endPart === "full") return true;
    return endPart === session;
  }
  return false;
}

function getReportSymbolForDate(student, date, session) {
  const dateValue = toSkillIsoDate(date);
  const { schoolType, summerStartDate, summerEndDate } = getStudentSchoolConfig(student);
  
  if (summerStartDate && summerEndDate) {
    const isSummer = (dateValue >= summerStartDate && dateValue <= summerEndDate);
    if (schoolType === "lise") {
      if (isSummer) {
        return "";
      }
    } else if (schoolType === "mesem") {
      if (isSummer) {
        if (skillState.absenceRecords?.[student.id]?.[dateValue]?.[session] !== undefined) {
          return skillState.absenceRecords[student.id][dateValue][session];
        }
        const matchingHolidays = skillState.holidays.filter((holiday) => dateValue >= holiday.startDate && dateValue <= (holiday.endDate || holiday.startDate));
        const sessionHolidays = matchingHolidays.filter((holiday) => isHolidaySession(holiday, dateValue, session));
        if (sessionHolidays.some((holiday) => !holiday.isSchoolBreak)) {
          return "T";
        }
        if (date.getDay() === 0 || date.getDay() === 6) return "";
        return els.skillReportBusinessSymbolEnabled?.checked === false ? "" : "X";
      }
    }
  }

  if (skillState.absenceRecords?.[student.id]?.[dateValue]?.[session] !== undefined) {
    return skillState.absenceRecords[student.id][dateValue][session];
  }
  const matchingHolidays = skillState.holidays.filter((holiday) => dateValue >= holiday.startDate && dateValue <= (holiday.endDate || holiday.startDate));
  const sessionHolidays = matchingHolidays.filter((holiday) => isHolidaySession(holiday, dateValue, session));
  if (sessionHolidays.some((holiday) => !isSkillSchoolBreakForMesem(holiday, student))) return "T";
  if (sessionHolidays.some((holiday) => isSkillSchoolBreakForMesem(holiday, student))) return getSkillMesemBreakSymbol(date);
  return getBaseReportSymbolForDate(student, date);
}

function isMutedReportDate(date) {
  const dateValue = toSkillIsoDate(date);
  return date.getDay() === 0 || date.getDay() === 6 || skillState.holidays.some((holiday) => (
    dateValue >= holiday.startDate && dateValue <= (holiday.endDate || holiday.startDate) && !isSkillSchoolBreakForMesem(holiday)
  ));
}

function getSkillDeputyForReport(coordinator) {
  const coordinatorSchool = skillState.schoolRecords.find((school) => school.id === coordinator?.schoolId);
  return coordinatorSchool?.deputy || skillState.schoolRecords?.[0]?.deputy || coordinator?.deputy || skillState.school?.deputy || "Müdür Yardımcısı";
}

function getSkillSchoolForReport(coordinator) {
  return skillState.schoolRecords.find((school) => school.id === coordinator?.schoolId) || skillState.schoolRecords?.[0] || skillState.school;
}

function getGradeReportBusinessIds() {
  const selectedIds = getSelectedReportBusinessIds();
  return selectedIds.length ? selectedIds : skillState.businesses.map((business) => business.id);
}

function getFlexibleReportBusinessIds() {
  const selectedIds = getSelectedReportBusinessIds();
  return selectedIds.length ? selectedIds : skillState.businesses.map((business) => business.id);
}

function getGradeTermLabel() {
  return els.skillGradeTerm?.value === "2" ? "2. Dönem" : "1. Dönem";
}

function updateGradeLayoutOptions() {
  if (!els.skillGradeLayout) return;
  const isHighSchool = els.skillGradeType?.value === "lise";
  els.skillGradeLayout.innerHTML = isHighSchool
    ? `<option value="one">1 sayfaya 1 form (Dikey)</option>`
    : `<option value="one">1 sayfaya 1 form (Yatay)</option><option value="two-portrait">1 sayfaya 2 form (Dikey)</option>`;
}

function runSkillReportPrecheck() {
  const ids = ["grades", "wage", "absence", "daily", "monthly"].includes(activeSkillReportType) ? getFlexibleReportBusinessIds() : getSelectedReportBusinessIds();
  const { startDate, endDate } = getReportDateRange();
  const studentCount = skillState.students.filter((student) => ids.includes(student.businessId)).length;
  if (els.skillReportPrecheckText) {
    if (activeSkillReportType === "daily") {
      const entryCount = getDailyGuidanceEntries(ids, startDate, endDate).length;
      els.skillReportPrecheckText.textContent = `${ids.length} işletme için ${entryCount} günlük rehberlik formu hazır.`;
    } else if (activeSkillReportType === "monthly") {
      els.skillReportPrecheckText.textContent = `${ids.length} işletme için ${formatSkillDate(startDate)} - ${formatSkillDate(endDate)} aralığında aylık rehberlik raporu hazır.`;
    } else if (activeSkillReportType === "termination") {
      const student = skillState.students.find((item) => item.id === els.skillTerminationStudent?.value);
      els.skillReportPrecheckText.textContent = els.skillTerminationBlank?.checked
        ? "Boş sözleşme iptal tutanağı şablonu hazır."
        : student
          ? `${student.no || "-"} ${student.name} için sözleşme iptal tutanağı hazır.`
          : "Öğrenci seçin veya boş şablon oluştur seçeneğini işaretleyin.";
    } else if (activeSkillReportType === "grades") {
      const typeLabel = els.skillGradeType?.value === "lise" ? "Meslek Liseleri Not Fişi" : "Mesleki Eğitim Not Fişi";
      els.skillReportPrecheckText.textContent = `${ids.length} işletme, ${studentCount} öğrenci için ${getGradeTermLabel()} ${typeLabel} hazır.`;
    } else if (activeSkillReportType === "wage") {
      const typeLabel = els.skillWageStudentType?.value === "lise" ? "Meslek lisesi" : "Mesem";
      els.skillReportPrecheckText.textContent = `${ids.length} işletme, ${studentCount} öğrenci için ${typeLabel} ücret raporu hazır.`;
    } else {
      els.skillReportPrecheckText.textContent = `${ids.length} işletme, ${studentCount} öğrenci için ${formatSkillDate(startDate)} - ${formatSkillDate(endDate)} aralığı hazır.`;
    }
  }
}

function updateSkillReportPerPageLabels() {
  if (!els.skillReportPerPage) return;
  const labels = activeSkillReportType === "monthly"
    ? { 1: "1 Form (Dikey)", 2: "2 Form (Yatay)" }
    : { 1: "1", 2: "2" };
  Array.from(els.skillReportPerPage.options).forEach((option) => {
    option.textContent = labels[option.value] || option.textContent;
  });
}

function syncTerminationOptionState() {
  if (!els.skillTerminationStudent) return;
  const blank = Boolean(els.skillTerminationBlank?.checked);
  els.skillTerminationStudent.disabled = blank;
  if (els.skillTerminationContractDate) els.skillTerminationContractDate.disabled = blank;
  if (els.skillTerminationCancelDate) els.skillTerminationCancelDate.disabled = blank;
  if (els.skillTerminationReasons) els.skillTerminationReasons.disabled = blank;

  const isNotice = els.skillTerminationTemplate?.value === "notice";
  if (els.skillTerminationNoticeFields) {
    els.skillTerminationNoticeFields.hidden = !isNotice;
    const noticeInputs = els.skillTerminationNoticeFields.querySelectorAll("input, select, textarea");
    noticeInputs.forEach((input) => {
      input.disabled = blank;
    });
  }
  if (els.skillStandardReasonsLabel) {
    els.skillStandardReasonsLabel.hidden = isNotice;
  }
}

function setSkillReportType(type) {
  activeSkillReportType = type || "absence";
  const isTermination = activeSkillReportType === "termination";
  const isGrade = activeSkillReportType === "grades";
  const isWage = activeSkillReportType === "wage";
  if (els.skillReportOptions) {
    els.skillReportOptions.classList.toggle("is-termination-report", isTermination);
    els.skillReportOptions.classList.toggle("is-grade-report", isGrade);
    els.skillReportOptions.classList.toggle("is-wage-report", isWage);
  }
  els.skillReportTabs?.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.skillReportTab === activeSkillReportType);
  });
  if (els.skillReportMobileSelect) {
    els.skillReportMobileSelect.value = activeSkillReportType;
  }
  const hideSharedDateControls = isTermination || isGrade || isWage;
  if (els.skillReportMonthPicker) {
    els.skillReportMonthPicker.hidden = hideSharedDateControls;
    els.skillReportMonthPicker.style.display = hideSharedDateControls ? "none" : "";
  }
  if (els.skillReportRangeRow) {
    els.skillReportRangeRow.hidden = hideSharedDateControls;
    els.skillReportRangeRow.style.display = hideSharedDateControls ? "none" : "";
  }
  els.skillReportDateRows?.forEach((row) => {
    row.hidden = hideSharedDateControls;
    row.style.display = hideSharedDateControls ? "none" : "";
  });
  if (els.skillReportNup) {
    els.skillReportNup.hidden = hideSharedDateControls;
    els.skillReportNup.style.display = hideSharedDateControls ? "none" : "";
  }
  if (els.skillAbsenceEntryBtn) {
    els.skillAbsenceEntryBtn.hidden = activeSkillReportType !== "absence";
  }
  if (els.skillReportSymbolOptions) {
    els.skillReportSymbolOptions.hidden = activeSkillReportType !== "absence";
  }
  if (els.skillMonthlyOptions) {
    els.skillMonthlyOptions.hidden = activeSkillReportType !== "monthly";
  }
  if (els.skillTerminationOptions) {
    els.skillTerminationOptions.hidden = !isTermination;
  }
  if (els.skillGradeOptions) {
    els.skillGradeOptions.hidden = !isGrade;
  }
  if (els.skillWageOptions) {
    els.skillWageOptions.hidden = !isWage;
  }
  if (isGrade) updateGradeLayoutOptions();
  syncTerminationOptionState();
  updateSkillReportPerPageLabels();
  runSkillReportPrecheck();
}

function getDailyGuidanceEntries(ids, startDate, endDate) {
  const dates = getDatesBetween(startDate, endDate);
  return ids.flatMap((businessId) => {
    const business = getSkillBusiness(businessId);
    const coordinator = skillState.coordinators.find((item) => item.businessId === businessId);
    const students = skillState.students.filter((student) => student.businessId === businessId);
    const reportSchool = getSkillSchoolForReport(coordinator);
    const deputyName = getSkillDeputyForReport(coordinator);
    const matchingDates = coordinator?.day
      ? dates.filter((date) => {
          if (String(date.getDay()) !== String(coordinator.day)) return false;
          return !isEntireWeekHoliday(date);
        })
      : dates.filter((date) => !isEntireWeekHoliday(date)).slice(0, 1);
    return matchingDates.map((date) => ({
      business,
      coordinator,
      students,
      reportSchool,
      deputyName,
      date,
      field: students.find((student) => student.field)?.field || "-"
    }));
  });
}

function buildDailyGuidanceReportHtml() {
  const ids = getFlexibleReportBusinessIds();
  if (!ids.length) {
    showToast("İşletme kaydı bulunamadı.", "warning");
    return "";
  }
  const { startDate, endDate } = getReportDateRange();
  const perPage = Number(els.skillReportPerPage?.value || 1);
  const pageClass = perPage === 2 ? "two-up" : "one-up";
  const entries = getDailyGuidanceEntries(ids, startDate, endDate);
  if (!entries.length) {
    showToast("Seçilen aralıkta günlük rehberlik görevi bulunamadı.", "warning");
    return "";
  }
  const cards = entries.map((entry) => `
    <section class="daily-guidance-card ${perPage === 2 ? "is-half" : ""}">
      <h1>İŞLETMELERDE MESLEK EĞİTİMİ GÜNLÜK REHBERLİK GÖREV FORMU</h1>
      <div class="daily-info">
        <div><span>İşletmenin Adı</span><b>:</b><strong>${escapeHtml(entry.business?.name || "-")}</strong></div>
        <div><span>İzlemede Sorumlu Olduğu Öğrenci Sayısı</span><b>:</b><strong>${entry.students.length}</strong></div>
        <div><span>Meslek Alan Dalı</span><b>:</b><strong>${escapeHtml(entry.field)}</strong></div>
        <div><span>Görev Tarihi</span><b>:</b><strong>${escapeHtml(formatGuidanceLongDate(entry.date))}</strong></div>
      </div>
      <div class="daily-body">
        <strong>Aylık Rehberlik Formuna Göre:</strong>
        <p>İşletmede öğrenim gören öğrencilerin eğitimini olumsuz yönde etkileyen hususlar (varsa yazınız):</p>
        <p>Belirlenen aksaklıklarla ilgili yapılan rehberlik ve alınan önlemler:</p>
        <p>Aylık rehberlik formunda belirtilmesinde yarar görülen hususlar:</p>
      </div>
      <div class="daily-signatures">
        <span><strong>İşletme Eğitim Yetkilisi</strong><small>İmza</small></span>
        <span><strong>Koordinatör Öğretmen</strong><small>${escapeHtml(entry.coordinator?.teacher || "-")}<br>İmza</small></span>
        <span><strong>Koordinatör Müdür Yardımcısı</strong><small>${escapeHtml(entry.deputyName)}<br>İmza</small></span>
      </div>
      <div class="daily-note"><strong>Açıklamalar:</strong> Bu form koordinatör öğretmen tarafından her görev için görev haftası başında koordinatör müdür yardımcısından alınır. Görev sonrasında okula geldiği gün içinde imzaları tamamlanmış olarak koordinatör müdür yardımcısına teslim edilir. Bu form Aylık Rehberlik Formu'nun doldurulmasında esas alınır ve rapora eklenir.</div>
    </section>
  `).join("");
  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Günlük Rehberlik Önizleme</title>
        <style>
          @page { size: A4 portrait; margin: 9mm 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; }
          .report-sheet { width: 194mm; margin: 0 auto; }
          .daily-guidance-card {
            display: flex;
            flex-direction: column;
            width: 194mm;
            height: 279mm;
            min-height: 0;
            border: 1.8px solid #111;
            break-after: page;
            page-break-after: always;
            background: #fff;
          }
          .daily-guidance-card.is-half {
            min-height: 0;
            height: 133.5mm !important;
            break-after: auto;
            page-break-after: auto;
            overflow: visible !important;
          }
          .daily-guidance-card.is-half:nth-child(odd) {
            margin: 0 0 12mm 0 !important;
          }
          .daily-guidance-card.is-half:nth-child(even) {
            position: relative;
            margin: 0 !important;
            break-after: page;
            page-break-after: always;
          }
          .daily-guidance-card.is-half:nth-child(even)::before {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            top: -6mm;
            border-top: 1px dashed #000 !important;
          }
          h1 {
            margin: 0;
            padding: 2mm 3mm;
            border-bottom: 1px solid #111;
            text-align: center;
            font-size: 18px;
            line-height: 1.1;
            font-weight: 800;
          }
          .daily-info {
            padding: 2mm 3mm;
            border-bottom: 1px solid #111;
            font-size: 14px;
            line-height: 1.35;
          }
          .daily-info div { display: grid; grid-template-columns: 70mm 5mm minmax(0, 1fr); align-items: baseline; }
          .daily-info span, .daily-info b { font-weight: 400; }
          .daily-info strong { font-size: 16px; font-weight: 400; }
          .daily-body {
            display: grid;
            grid-template-rows: auto repeat(3, 1fr);
            flex: 1 1 auto;
            padding: 2mm 3mm;
            border-bottom: 1px solid #111;
            font-size: 15px;
            line-height: 1.35;
          }
          .daily-body strong { display: block; margin: 0; font-size: 16px; }
          .daily-body p { margin: 0; padding-top: 5mm; }
          .daily-signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            flex: 0 0 28mm;
            min-height: 0;
            border-bottom: 1px solid #111;
            text-align: center;
            font-size: 15px;
          }
          .daily-signatures span { padding: 3mm 2mm 2mm; }
          .daily-signatures strong, .daily-signatures small { display: block; }
          .daily-signatures small { margin-top: 3mm; font-size: 14px; line-height: 1.35; }
          .daily-note {
            display: flex;
            align-items: center;
            flex: 0 0 22mm;
            padding: 2mm 3mm;
            font-size: 11px;
            line-height: 1.18;
          }
          .daily-guidance-card.is-half h1 { padding: 1.3mm 2mm; font-size: 14px; }
          .daily-guidance-card.is-half .daily-info { padding: 1.2mm 2mm; font-size: 11px; line-height: 1.25; }
          .daily-guidance-card.is-half .daily-info div { grid-template-columns: 69mm 4mm minmax(0, 1fr); }
          .daily-guidance-card.is-half .daily-info strong { font-size: 12px; }
          .daily-guidance-card.is-half .daily-body { padding: 1.6mm 2mm; font-size: 12.5px; }
          .daily-guidance-card.is-half .daily-body strong { font-size: 13px; }
          .daily-guidance-card.is-half .daily-body p { padding-top: 2.8mm; }
          .daily-guidance-card.is-half .daily-signatures { flex-basis: 22mm; min-height: 0; font-size: 12.5px; }
          .daily-guidance-card.is-half .daily-signatures small { margin-top: 2mm; font-size: 12px; }
          .daily-guidance-card.is-half .daily-note { flex-basis: 13mm; padding: 1mm 2mm; font-size: 8.4px; }
          @media screen {
            body { background: #dfe4e9; padding: 10mm 0; }
            .daily-guidance-card { margin-bottom: 10mm; }
          }
          @media print {
            body { background: #fff; }
            .report-sheet { width: auto; margin: 0; }
          }
        </style>
      </head>
      <body><main class="report-sheet ${pageClass}">${cards}</main></body>
    </html>
  `;
}

const monthlyGuidanceTopics = [
  {
    section: "A. Mesleki ve Teknik Eğitim Yönetmeliği ile ilgili konular:",
    question: "1. Usta öğreticilik/eğitici personelin yıllık eğitim planı (Gelişim Tablosu) var mı? Uyguluyor mu? Öğrencilere sürekli aynı işlem mi, rotasyona göre mi eğitim yaptırılıyor?",
    answer: "Gelişim Tablosu var. Uygulanıyor. Rotasyona göre eğitim yaptırılıyor."
  },
  { question: "2. Öğrencilerin günlük çalışmaları yıllık eğitim planına uygun olarak planlanmış mı?", answer: "Öğrencilerin çalışmaları planlanmış." },
  { question: "3. Öğrenci devam durumu günlük olarak takip ediliyor mu?", answer: "Devamsızlık günlük olarak takip ediliyor." },
  { question: "4. Meslek eğitimi çalışmaları puanla değerlendiriliyor mu?", answer: "Mesleki çalışmalar puanla değerlendiriliyor." },
  { question: "5. Yapılan işlerle ilgili olarak her öğrenciye iş dosyası tutuluyor mu?", answer: "Öğrenciler iş dosyası tutturuluyor." },
  { question: "6. Öğrencilere 3308 sayılı Kanunun 25 inci maddesine göre aylık ücret ödeniyor mu?", answer: "Aylık ücret ödeniyor." },
  { question: "7. Meslek eğitimi, çalışma saatlerinde yapılıyor mu?", answer: "Meslek eğitimi, çalışma saatlerinde yapılıyor." },
  { question: "8. İş güvenliği konusunda öğrencilere yeterli bilgi veriliyor ve gerekli tedbirler alınıyor mu?", answer: "Yeterli bilgi veriliyor ve gerekli tedbirler alınıyor." },
  { question: "9. Öğrenciler disiplin, kılık-kıyafet ve işletmenin kurallarına uyuyor mu?", answer: "Öğrenciler işletmenin kurallarına uyuyor." },
  { question: "10. Öğrencilerin telafi eğitimine alınması gerekiyor mu? Gerekiyorsa hangi konularda telafi eğitimi uygulanmalı?", answer: "Telafi eğitimine ihtiyaç yoktur." },
  {
    section: "B. Eğitici Personel ile ilgili konular:",
    question: "1. İşletmenin meslek eğitimi ile görevli personelinin usta öğreticilik belgesi var mı?",
    answer: () => (els.skillMonthlyMasterCert?.checked ? "Usta öğreticilik belgesi var" : "Usta öğreticilik belgesi yok")
  },
  { question: "2. Eğitici personelin sorumlu olduğu öğrenci grubu sayısı Mesleki ve Teknik Eğitim Yönetmeliğinin 192 inci maddesine uygun mu?", answer: "Öğrenci grubu sayısı yönetmeliğe uygundur." },
  { question: "3. Meslek eğitimi konusunda koordinatör tarafından eğitici personele yapılan rehberlik ve konusu.", answer: "3308 Sayılı Kanun hakkında bilgi verildi. Staj dosyaları hakkında bilgi verildi." },
  { question: "4. Eğitici personelin geliştirme ve uyum kursuna ihtiyacı var mı?", answer: "Uyum kursuna ihtiyaç yoktur." },
  {
    section: "C. İşletme ile ilgili konular:",
    question: "1. İşletmelerde meslek eğitimi, yıllık çalışma takvimine uygun olarak sürdürülüyor mu?",
    answer: "Yıllık çalışma takvimine uygundur."
  },
  { question: "2. İşletmede meslek eğitiminin mevzuata göre sürdürülmesi ile ilgili gerekli tedbirler alınıyor mu? (Meslekî ve Teknik Eğitim Yönetmeliği madde 196.)", answer: "Gerekli tedbirler alınıyor." },
  { question: "3. Okul/kurum, öğretim programlarını (Gelişim Tablosu) işletmeye verdi mi?", answer: "Gelişim tablosu işletmeye verildi." },
  { question: "4. Öğrenciler için gelişim tablosu uygulanıyor mu?", answer: "Gelişim tablosu uygulanıyor." },
  { question: "5. İşletme yetkililerinin meslek eğitiminin uygulanışı ve öğretim programları konusundaki görüş ve önerileri:", answer: "__________" },
  { section: "D. Açıklanması gereken diğer hususlar:", question: "", answer: "__________" }
];

function getMonthlyGuidanceEntries(ids, startDate, endDate) {
  const dates = getDatesBetween(startDate, endDate);
  return ids.map((businessId) => {
    const business = getSkillBusiness(businessId);
    const coordinator = skillState.coordinators.find((item) => item.businessId === businessId);
    const students = skillState.students.filter((student) => student.businessId === businessId);
    const reportSchool = getSkillSchoolForReport(coordinator);
    const matchingDates = coordinator?.day
      ? dates.filter((date) => {
          if (String(date.getDay()) !== String(coordinator.day)) return false;
          return !isEntireWeekHoliday(date);
        })
      : dates.filter((date) => !isEntireWeekHoliday(date));
    return {
      business,
      coordinator,
      students,
      reportSchool,
      dates: matchingDates,
      field: students.find((student) => student.field)?.field || skillState.fields?.[0]?.area || "-",
      studentLine: students.map((student) => `${student.no || "-"} ${student.name}`).join(", ") || "-"
    };
  });
}

function buildMonthlyGuidanceRows() {
  const autoFill = Boolean(els.skillMonthlyAutoFill?.checked);
  return monthlyGuidanceTopics.map((item) => {
    const answer = typeof item.answer === "function" ? item.answer() : item.answer;
    return `
      <tr>
        <td>${item.section ? `<strong>${escapeHtml(item.section)}</strong><br>` : ""}${escapeHtml(item.question)}</td>
        <td>${escapeHtml(autoFill ? answer : "")}</td>
      </tr>
    `;
  }).join("");
}

function formatMonthlyGuidanceDates(dates) {
  if (!dates.length) return "-";
  return dates.map((date) => formatGuidanceDate(date)).join("<br>");
}

function buildMonthlyGuidanceReportHtml() {
  const ids = getFlexibleReportBusinessIds();
  if (!ids.length) {
    showToast("İşletme kaydı bulunamadı.", "warning");
    return "";
  }
  const { startDate, endDate } = getReportDateRange();
  const perPage = Number(els.skillReportPerPage?.value || 1);
  const entries = getMonthlyGuidanceEntries(ids, startDate, endDate);
  const pageClass = perPage === 2 ? "two-up" : "one-up";
  const rows = buildMonthlyGuidanceRows();
  const cards = entries.map((entry) => `
    <section class="monthly-guidance-card">
      <header>
        <h1>İŞLETMELERDE MESLEK EĞİTİMİ KOORDİNATÖRLERİNİN İŞLETMEYE YAPACAĞI<br>AYLIK REHBERLİK RAPOR FORMU</h1>
        <h2>${escapeHtml(entry.reportSchool?.name || "OKUL ADI")} MÜDÜRLÜĞÜ'NE</h2>
      </header>
      <p class="monthly-intro">Okulumuz <strong>${escapeHtml(entry.field)}</strong> alanı/dalı öğrencilerinin meslek eğitimi gördüğü işletmelerde yapmış olduğum bir aylık koordinatörlük görevlerim sırasında tespit ettiğim hususlar aşağıda belirtilmiştir.</p>
      <p class="monthly-request">Gereğini bilgilerinize arz ederim.</p>
      <div class="monthly-business-student-box">
        <div class="info-column">
          <span class="info-label">Öğrencilerin Adı Soyadı:</span>
          <span class="info-value"><strong class="highlight-student">${escapeHtml(entry.studentLine)}</strong></span>
        </div>
        <div class="info-column">
          <span class="info-label">İşletmenin Adı ve Adresi:</span>
          <span class="info-value">
            <strong class="highlight-business-name">${escapeHtml(entry.business?.name || "-")}</strong>
            <span class="business-address"> / ${escapeHtml(entry.business?.address || "-")}</span>
          </span>
        </div>
      </div>
      <div class="monthly-people">
        <span class="signature-cell">
          <span class="signature-name">..................................................</span>
          <span class="signature-title">İşletme Eğitim Yetkilisi</span>
        </span>
        <span class="signature-cell">
          <span class="signature-name">${entry.coordinator?.teacher ? escapeHtml(entry.coordinator.teacher) : ".................................................."}</span>
          <span class="signature-title">Koordinatör Öğretmen</span>
        </span>
        <span class="dates-cell">
          <span class="signature-title" style="text-decoration: underline; margin-bottom: 3.5px;">GÖREV TARİHLERİ</span>
          <small>${formatMonthlyGuidanceDates(entry.dates)}</small>
        </span>
      </div>
      <table>
        <thead><tr><th>Koordinatörün Rehberlik Yaptığı Konular</th><th>Değerlendirme ve Öneriler</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="monthly-note">Açıklama: Bu form her işletme için her ay ayrı ayrı doldurulacak, kurum idaresine verilecektir.</p>
    </section>
  `).join("");
  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Aylık Rehberlik Önizleme</title>
        <style>
          @page { size: ${perPage === 2 ? "A4 landscape" : "A4 portrait"}; margin: ${perPage === 2 ? "5mm" : "8mm"}; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; }
          .report-sheet.one-up { width: 194mm; margin: 0 auto; }
          .report-sheet.two-up { width: 287mm; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
          .monthly-guidance-card {
            height: ${perPage === 2 ? "200mm" : "281mm"} !important;
            padding: ${perPage === 2 ? "3mm" : "4mm"};
            border: 1.8px solid #111;
            break-after: ${perPage === 2 ? "auto" : "page"};
            page-break-after: ${perPage === 2 ? "auto" : "always"};
            background: #fff;
            font-size: ${perPage === 2 ? "7.2px" : "11px"};
            line-height: 1.18;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          .report-sheet.two-up .monthly-guidance-card:nth-child(2n) { break-after: page; page-break-after: always; }
          header { text-align: center; margin-bottom: ${perPage === 2 ? "1.5mm" : "2mm"}; }
          h1 { margin: 0 0 ${perPage === 2 ? "1.5mm" : "2.5mm"}; font-size: ${perPage === 2 ? "10px" : "14px"}; line-height: 1.12; }
          h2 { margin: 0 0 ${perPage === 2 ? "2mm" : "4.5mm"}; font-size: ${perPage === 2 ? "8.8px" : "12px"}; }
          p { margin: 0 0 ${perPage === 2 ? "1.5mm" : "2.5mm"}; }
          .monthly-intro { text-indent: ${perPage === 2 ? "5mm" : "8mm"}; }
          .monthly-request { margin-top: 0; }
          .monthly-business-student-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: ${perPage === 2 ? "3mm" : "6mm"};
            margin: ${perPage === 2 ? "2mm 0" : "4mm 0"};
            border: 1px solid #111;
            padding: ${perPage === 2 ? "1.5mm 2mm" : "2.5mm 3.5mm"};
            font-size: ${perPage === 2 ? "7px" : "10px"};
            line-height: 1.25;
          }
          .info-column {
            display: flex;
            flex-direction: column;
            gap: ${perPage === 2 ? "0.5mm" : "1.2mm"};
          }
          .info-label {
            font-weight: 800;
            display: block;
            margin-bottom: ${perPage === 2 ? "0.4mm" : "0.8mm"};
          }
          .highlight-student, .highlight-business-name {
            font-weight: 900 !important;
            color: #000000 !important;
          }
          .business-address {
            font-weight: normal !important;
            color: #333333 !important;
          }
          .monthly-people {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            align-items: stretch;
            min-height: ${perPage === 2 ? "18mm" : "28mm"};
            margin: ${perPage === 2 ? "1.5mm 0" : "4mm 0"};
            text-align: center;
            border: 1.5px solid #111;
          }
          .monthly-people span.signature-cell {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            padding: ${perPage === 2 ? "1.5mm 1mm" : "3mm 2mm"};
            border-right: 1.5px solid #111;
          }
          .monthly-people span.dates-cell {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding: ${perPage === 2 ? "1.5mm 1mm" : "2.5mm 2mm"};
          }
          .signature-name {
            font-weight: 800;
            margin-bottom: ${perPage === 2 ? "0.6mm" : "1.2mm"};
            text-align: center;
          }
          .signature-title {
            font-weight: bold;
            font-size: ${perPage === 2 ? "7px" : "9.8px"};
            text-align: center;
          }
          .dates-cell small {
            display: block;
            font-size: inherit;
            text-align: center;
          }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: ${perPage === 2 ? "7.2px" : "9.8px"}; line-height: 1.14; }
          th, td { border: 1px solid #111; padding: ${perPage === 2 ? "1.0mm 0.75mm" : "1.8mm 1.5mm"}; vertical-align: middle; }
          th:first-child, td:first-child { width: ${perPage === 2 ? "76%" : "59%"}; }
          th:last-child, td:last-child { width: ${perPage === 2 ? "24%" : "41%"}; }
          th { text-align: center; font-weight: 800; }
          td:last-child { font-style: ${els.skillMonthlyAutoFill?.checked ? "italic" : "normal"}; }
          .monthly-note { margin-top: ${perPage === 2 ? "3mm" : "4mm"}; }
          @media screen {
            body { background: #dfe4e9; padding: 8mm 0; }
            .monthly-guidance-card { margin-bottom: 8mm; }
          }
          @media print {
            body { background: #fff; }
            .report-sheet { margin: 0; }
          }
        </style>
      </head>
      <body><main class="report-sheet ${pageClass}">${cards}</main></body>
    </html>
  `;
}

function getGradeReportSchoolYear() {
  return skillState.school?.year || "2025-2026";
}

function getGradeReportSchool(coordinator) {
  return getSkillSchoolForReport(coordinator) || skillState.schoolRecords?.[0] || skillState.school;
}

function getGradeReportPrincipal(school) {
  return school?.principal || skillState.schoolRecords?.[0]?.principal || "Okul/Kurum Müdürü";
}

function getBusinessGradeRows(students) {
  const rows = students.length ? students : [{ no: "", name: "", field: "" }];
  return rows.map((student) => `
    <tr>
      <td class="no-cell">${escapeHtml(student.no || "")}</td>
      <td class="name-cell">${escapeHtml(student.name || "")}</td>
      <td class="field-cell">${escapeHtml(student.field || "")}</td>
      ${Array.from({ length: 17 }, () => "<td></td>").join("")}
    </tr>
  `).join("");
}

function buildVocationalGradeReportHtml(ids) {
  const term = els.skillGradeTerm?.value === "2" ? "2. DÖNEM" : "1. DÖNEM";
  const isTwoPortrait = els.skillGradeLayout?.value === "two-portrait";
  const cards = ids.map((businessId) => {
    const business = getSkillBusiness(businessId);
    const students = skillState.students.filter((student) => student.businessId === businessId);
    const studentCount = students.length || 1;
    const coordinator = skillState.coordinators.find((item) => item.businessId === businessId);
    const school = getGradeReportSchool(coordinator);
    const deputy = getSkillDeputyForReport(coordinator);
    const principal = getGradeReportPrincipal(school);

    let fontSize = "10px";
    let h1Margin = "4mm";
    let h1Padding = "4mm 2mm";
    let h1FontSize = "17px";
    let infoMargin = "3mm";
    let infoFontSize = "10px";
    let tableFontSize = "9.2px";
    let rowHeight = "18mm";
    let rowPadding = "1.2mm";
    let sigMargin = "3mm";
    let sigHeight = "32mm";
    let sigStrongSize = "12px";
    let sigSmallSize = "11px";
    let noteMargin = "3mm";
    let notePadding = "2.5mm";
    let noteFontSize = "11px";

    if (isTwoPortrait) {
      // Default portrait sizes (for 1-3 students)
      fontSize = "8.2px";
      h1Margin = "2mm";
      h1Padding = "2mm 1mm";
      h1FontSize = "12px";
      infoMargin = "2mm";
      infoFontSize = "8.2px";
      tableFontSize = "7.2px";
      rowHeight = "16mm";
      rowPadding = ".8mm";
      sigMargin = "2.5mm";
      sigHeight = "28mm";
      sigStrongSize = "8.5px";
      sigSmallSize = "7.5px";
      noteMargin = "2mm";
      notePadding = "1.5mm";
      noteFontSize = "7.5px";

      if (studentCount > 7) {
        // Very high density scaling (8+ students)
        fontSize = "6.5px";
        h1Margin = "0.8mm";
        h1Padding = "0.8mm .4mm";
        h1FontSize = "9.5px";
        infoMargin = "0.8mm";
        infoFontSize = "6.5px";
        tableFontSize = "5.5px";
        rowHeight = "7mm";
        rowPadding = ".3mm";
        sigMargin = "1mm";
        sigHeight = "15mm";
        sigStrongSize = "6.5px";
        sigSmallSize = "6.0px";
        noteMargin = "0.8mm";
        notePadding = "0.8mm";
        noteFontSize = "6.0px";
      } else if (studentCount > 5) {
        // High density scaling (6-7 students)
        fontSize = "7.0px";
        h1Margin = "1mm";
        h1Padding = "1mm .5mm";
        h1FontSize = "10px";
        infoMargin = "1mm";
        infoFontSize = "7px";
        tableFontSize = "6.0px";
        rowHeight = "9mm";
        rowPadding = ".4mm";
        sigMargin = "1.5mm";
        sigHeight = "18mm";
        sigStrongSize = "7.2px";
        sigSmallSize = "6.5px";
        noteMargin = "1mm";
        notePadding = "1mm";
        noteFontSize = "6.5px";
      } else if (studentCount > 3) {
        // Medium density scaling (4-5 students)
        fontSize = "7.6px";
        h1Margin = "1.5mm";
        h1Padding = "1.5mm 1mm";
        h1FontSize = "11px";
        infoMargin = "1.5mm";
        infoFontSize = "7.5px";
        tableFontSize = "6.6px";
        rowHeight = "12mm";
        rowPadding = ".6mm";
        sigMargin = "2mm";
        sigHeight = "23mm";
        sigStrongSize = "7.8px";
        sigSmallSize = "7.0px";
        noteMargin = "1.5mm";
        notePadding = "1.2mm";
        noteFontSize = "7.0px";
      }
    }

    return `
      <section class="grade-vocational-card ${isTwoPortrait ? "is-half" : ""}" style="
        --card-font-size: ${fontSize};
        --h1-margin: ${h1Margin};
        --h1-padding: ${h1Padding};
        --h1-font-size: ${h1FontSize};
        --info-margin: ${infoMargin};
        --info-font-size: ${infoFontSize};
        --table-font-size: ${tableFontSize};
        --row-height: ${rowHeight};
        --row-padding: ${rowPadding};
        --sig-margin: ${sigMargin};
        --sig-height: ${sigHeight};
        --sig-strong-size: ${sigStrongSize};
        --sig-small-size: ${sigSmallSize};
        --note-margin: ${noteMargin};
        --note-padding: ${notePadding};
        --note-font-size: ${noteFontSize};
      ">
        <h1>İŞLETMELERDE MESLEK EĞİTİMİ GÖREN ÖĞRENCİLERE AİT ${escapeHtml(term)} PUAN FİŞİ</h1>
        <table class="grade-info-table">
          <tr>
            <th>Okul/Kurum Adı :</th><td>${escapeHtml(school?.name || "")}</td>
            <th>Dersin Adı :</th><td>İşletmelerde Meslek Eğitimi</td>
          </tr>
          <tr>
            <th>ÖğretimYılı :</th><td>${escapeHtml(getGradeReportSchoolYear())}</td>
            <th>Tarih :</th><td></td>
          </tr>
          <tr>
            <th>İşletmenin Adı :</th><td>${escapeHtml(business?.name || "")}</td>
            <th>Koord. Öğrt. :</th><td>${escapeHtml(coordinator?.teacher || "")}</td>
          </tr>
        </table>
        <table class="grade-score-table">
          <colgroup>
            <col class="no-col">
            <col class="name-col">
            <col class="field-col">
            <col class="grade-col"><col class="grade-col"><col class="grade-col">
            <col class="grade-col"><col class="grade-col"><col class="grade-col">
            <col class="grade-col"><col class="grade-col"><col class="grade-col">
            <col class="grade-col"><col class="grade-col"><col class="grade-col">
            <col class="score-col">
            <col class="score-col">
            <col class="score-col">
            <col class="score-col">
            <col class="write-col">
          </colgroup>
          <thead>
            <tr>
              <th colspan="3">Öğrencinin</th>
              <th colspan="12">İşletmede Verilen Puanlar</th>
              <th colspan="2">Okulda<br>Verilen<br>Puanlar</th>
              <th colspan="3">Dönem<br>Başarısı</th>
            </tr>
            <tr>
              <th class="no-cell"><div class="vertical-text">Numarası</div></th>
              <th class="name-cell">Adı Soyadı</th>
              <th class="field-cell">Alan Dalı</th>
              <th colspan="3" class="grade-header-cell">Temrin</th>
              <th colspan="3" class="grade-header-cell">İş-Hizmet</th>
              <th colspan="3" class="grade-header-cell">Proje</th>
              <th colspan="3" class="grade-header-cell">Deney</th>
              <th class="score-cell"><div class="vertical-text">Telafi Eğitim<br>Puanı(*)</div></th>
              <th class="score-cell"><div class="vertical-text">Beceri Sınav<br>Puanı(*)</div></th>
              <th class="score-cell"><div class="vertical-text">Dönem<br>Puan Ort.</div></th>
              <th class="score-cell"><div class="vertical-text">Rakamla</div></th>
              <th class="write-cell"><div class="vertical-text">Yazıyla</div></th>
            </tr>
          </thead>
          <tbody>${getBusinessGradeRows(students)}</tbody>
        </table>
        <div class="grade-signatures">
          <span><strong>Usta Öğretici / İşletme Yetkilisi</strong><small>Kaşe - İmza</small></span>
          <span><strong>Eğitici Personel</strong><small>Kaşe - İmza</small></span>
          <span><strong>Koordinatör<br>Müdür Yardımcısı</strong><small>${escapeHtml(deputy)}</small></span>
          <span><strong>Okul/Kurum Müdürü</strong><small>${escapeHtml(principal)}</small></span>
        </div>
        <p class="grade-note"><strong>AÇIKLAMA :</strong> (*) işaretli bölümler okul/kurum müdürlüğünce doldurulacak ve puan ortalaması alınarak dönem ortalaması belirlenecektir.</p>
      </section>
    `;
  }).join("");

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Not Çizelgesi Önizleme</title>
        <style>
          @page { size: ${isTwoPortrait ? "A4 portrait" : "A4 landscape"}; margin: ${isTwoPortrait ? "9mm 8mm" : "8mm"}; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; }
          .grade-vocational-sheet { width: 100%; margin: 0 auto; }
          .grade-vocational-card {
            width: 100%;
            height: ${isTwoPortrait ? "139.5mm" : "186mm"};
            margin: 0 auto;
            break-after: ${isTwoPortrait ? "auto" : "page"};
            page-break-after: ${isTwoPortrait ? "auto" : "always"};
            font-size: var(--card-font-size);
            display: ${isTwoPortrait ? "flex" : "block"};
            flex-direction: ${isTwoPortrait ? "column" : "row"};
            justify-content: ${isTwoPortrait ? "center" : "normal"};
            overflow: hidden;
            box-sizing: border-box;
            background: #fff;
          }
          .grade-vocational-card > * {
            flex-shrink: 0;
          }
          .grade-vocational-card.is-half:nth-child(even) {
            border-top: 1px dashed #000 !important;
            break-after: page;
            page-break-after: always;
          }
          .grade-vocational-card h1 {
            margin: 0 0 var(--h1-margin);
            padding: var(--h1-padding);
            border: 1px solid #000;
            text-align: center;
            font-size: var(--h1-font-size);
            line-height: 1.12;
            font-weight: 800;
            letter-spacing: .2px;
          }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 1px solid #000; padding: var(--row-padding); vertical-align: middle; }
          .grade-info-table { margin-bottom: var(--info-margin); font-size: var(--info-font-size); }
          .grade-info-table th { width: 18%; text-align: left; background: #f2f2f2; font-weight: 800; }
          .grade-info-table td { width: 32%; }
          .grade-score-table { font-size: var(--table-font-size); line-height: 1.04; }
          .grade-score-table thead th { background: #efefef; text-align: center; font-weight: 800; }
          .grade-score-table tbody td { height: var(--row-height); padding: var(--row-padding); }
          .grade-score-table .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; display: inline-block; }
          .grade-score-table .no-col { width: ${isTwoPortrait ? "5mm" : "7.5mm"}; }
          .grade-score-table .name-col { width: ${isTwoPortrait ? "24mm" : "30mm"}; }
          .grade-score-table .field-col { width: ${isTwoPortrait ? "20mm" : "25mm"}; }
          .grade-score-table .grade-col, .grade-score-table .score-col, .grade-score-table .write-col { width: ${isTwoPortrait ? "8.5mm" : "12mm"}; }
          .grade-score-table .no-cell { text-align: center; }
          .grade-score-table .field-cell { font-size: calc(var(--table-font-size) - 1px); }
          .grade-signatures {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            margin-top: var(--sig-margin);
            border: 1px solid #000;
            border-right: 0;
            min-height: var(--sig-height);
            text-align: center;
          }
          .grade-signatures span {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 1mm;
            border-right: 1px solid #000;
            padding: var(--row-padding);
          }
          .grade-signatures strong { font-size: var(--sig-strong-size); line-height: 1.05; }
          .grade-signatures small { font-size: var(--sig-small-size); }
          .grade-note {
            margin: var(--note-margin) 0 0;
            padding: var(--note-padding);
            border: 1px solid #000;
            font-size: var(--note-font-size);
          }
          @media screen {
            body { background: #dfe4e9; padding: 8mm 0; }
            .grade-vocational-sheet { width: ${isTwoPortrait ? "194mm" : "281mm"}; }
            .grade-vocational-card { background: #fff; margin-bottom: ${isTwoPortrait ? "5mm" : "8mm"}; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          }
          @media print {
            html, body { margin: 0; padding: 0; }
            body { background: #fff; }
            .grade-vocational-card:last-child { break-after: auto !important; page-break-after: auto !important; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            th, td {
              border: 1px solid #000 !important;
            }
          }
        </style>
      </head>
      <body><main class="grade-vocational-sheet">${cards}</main></body>
    </html>
  `;
}

function getHighSchoolGradeStudentCards(ids) {
  const criteria = [
    "Kavrama Yeteneği",
    "Öğrendiklerini Uygulama Becerisi",
    "Verilen görevleri tek başına yapabilme",
    "Tertip, Düzen, Tasarruf, Temizlik Durumu",
    "Dilbilgisini geliştirme, araştırma, mesleğe uygunluğu",
    "Beşeri İlişkiler (Amirlerine, 3.Şahıslara Karşı)",
    "İş Pratiğindeki Becerisi",
    "İş ve Çalışma Saatlerine Bağlılığı",
    "Kılık ve Kıyafet Kurallarına Uyma",
    "Güvenirliği"
  ];
  const scores = [
    ["Pekiyi", "85,00 - 100"],
    ["İyi", "70,00 - 84,99"],
    ["Orta", "60,00 - 69,99"],
    ["Geçer", "50,00 - 59,99"],
    ["Geçmez", "0 - 49,99"]
  ];
  const students = skillState.students.filter((student) => ids.includes(student.businessId));
  const rows = students.length ? students : [{ no: "", name: "", className: "", field: "", businessId: ids[0] || "" }];
  return rows.map((student) => {
    const business = getSkillBusiness(student.businessId);
    const coordinator = skillState.coordinators.find((item) => item.businessId === student.businessId);
    const school = getGradeReportSchool(coordinator);
    const term = els.skillGradeTerm?.value === "2" ? "2. YARIYIL" : "1. YARIYIL";
    return `
      <section class="grade-high-card">
        <header>
          <h1>${escapeHtml(school?.name || "OKUL ADI")}</h1>
          <h2>${escapeHtml(getGradeReportSchoolYear())} EĞİTİM ÖĞRETİM YILI ${escapeHtml(term)}</h2>
          <h3>İŞLETMELERDE MESLEKİ EĞİTİM YAPAN ÖĞRENCİLERİN İŞYERİ DEĞERLENDİRME BELGESİ</h3>
        </header>
        <table class="high-student-table">
          <colgroup><col class="student-label-col"><col class="student-value-col"><col class="student-empty-col"></colgroup>
          <thead><tr><th colspan="3">ÖĞRENCİNİN</th></tr></thead>
          <tbody>
            <tr><th>Adı ve Soyadı</th><td>${escapeHtml(student.name || "")}</td><td rowspan="6"></td></tr>
            <tr><th>Okul No</th><td>${escapeHtml(student.no || "")}</td></tr>
            <tr><th>Sınıfı</th><td>${escapeHtml(student.className || "")}</td></tr>
            <tr><th>Alanı/Dalı</th><td>${escapeHtml(student.field || "")}</td></tr>
            <tr><th>Koordinatör Öğretmen</th><td>${escapeHtml(coordinator?.teacher || "")}</td></tr>
            <tr><th>İşletme</th><td>${escapeHtml(business?.name || "")}</td></tr>
          </tbody>
        </table>
        <table class="high-evaluation-table">
          <thead><tr><th>DEĞERLENDİRME</th><th>PUAN</th></tr></thead>
          <tbody>
            ${criteria.map((item, index) => `<tr><td>${index + 1}. ${escapeHtml(item)}</td><td></td></tr>`).join("")}
            <tr><th>Toplam Puan</th><td></td></tr>
            <tr><th>Dönem Puanı</th><td></td></tr>
          </tbody>
        </table>
        <div class="high-footer-grid">
          <table>
            <thead><tr><th colspan="2">Değerlendirme Esasları</th></tr></thead>
            <tbody>${scores.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}</tbody>
          </table>
          <div>Yukarıdaki çizelgede her şık 100 puan üzerinden değerlendirilecek, değerlendirme toplamının değerlendirme sayısına bölünmesi neticesi beceri puanı bulunacaktır.</div>
          <div>...../...../20....<br><br>Yetkili Adı Soyadı<br>Ünvanı&nbsp;&nbsp;Tarih<br>İmza-Mühür</div>
        </div>
      </section>
    `;
  }).join("");
}

function buildHighSchoolGradeReportHtml(ids) {
  const cards = getHighSchoolGradeStudentCards(ids);
  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Not Çizelgesi Önizleme</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; }
          .grade-high-card { width: 194mm; min-height: 281mm; margin: 0 auto; break-after: page; page-break-after: always; font-size: 13.6px; }
          .grade-high-card header { margin-bottom: 7mm; padding: 4mm 3mm; border: 2px solid #111; text-align: center; font-weight: 800; }
          .grade-high-card h1, .grade-high-card h2, .grade-high-card h3 { margin: 0; font-size: 18px; line-height: 1.08; }
          .grade-high-card h3 { margin-top: .8mm; }
          .grade-high-card table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .grade-high-card th, .grade-high-card td { border: 1px solid #111; padding: 1.65mm; vertical-align: middle; }
          .high-student-table { border: 2px solid #111; margin-bottom: 7mm; font-size: 15px; }
          .high-student-table .student-label-col { width: 49mm; }
          .high-student-table .student-empty-col { width: 42mm; }
          .high-student-table .student-value-col { width: auto; }
          .high-student-table thead th { text-align: center; font-size: 17px; padding: 1.8mm; }
          .high-student-table tbody th { text-align: left; font-weight: 800; }
          .high-evaluation-table { border: 2px solid #111; font-size: 14px; }
          .high-evaluation-table thead th { font-size: 16px; text-align: left; }
          .high-evaluation-table thead th:last-child { width: 32mm; text-align: center; }
          .high-evaluation-table td, .high-evaluation-table th { height: 8.15mm; padding: 1.35mm; }
          .high-evaluation-table tbody td:last-child { width: 32mm; }
          .high-footer-grid { display: grid; grid-template-columns: 63mm 1fr 63mm; margin-top: 7mm; border: 2px solid #111; border-right: 0; min-height: 43mm; font-size: 13.3px; text-align: center; }
          .high-footer-grid > div { border-right: 2px solid #111; padding: 2.5mm; display: flex; align-items: center; justify-content: center; }
          .high-footer-grid > table { height: 100%; border: 0; border-right: 2px solid #111; }
          .high-footer-grid table th, .high-footer-grid table td { border: 1px solid #111; padding: 1.05mm; text-align: left; }
          .high-footer-grid table th { text-align: center; }
          @media screen { body { background: #dfe4e9; padding: 8mm 0; } .grade-high-card { background: #fff; margin-bottom: 8mm; } }
          @media print {
            body { background: #fff; }
            .grade-high-card:last-child { break-after: auto; page-break-after: auto; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>${cards}</body>
    </html>
  `;
}

function buildGradeReportHtml() {
  const ids = getGradeReportBusinessIds();
  if (!ids.length) {
    showToast("Not çizelgesi için işletme kaydı bulunamadı.", "warning");
    return "";
  }
  return els.skillGradeType?.value === "lise"
    ? buildHighSchoolGradeReportHtml(ids)
    : buildVocationalGradeReportHtml(ids);
}

function parseSkillMoney(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function formatSkillMoney(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function getWageAbsenceDays() {
  return 0;
}

function getWageManualStudentIds() {
  const ids = getFlexibleReportBusinessIds();
  return skillState.students
    .filter((student) => ids.includes(student.businessId))
    .map((student) => student.id);
}

function renderWageManualDialog() {
  if (!els.skillWageManualTable) return;
  const ids = getFlexibleReportBusinessIds();
  const students = skillState.students.filter((student) => ids.includes(student.businessId));
  els.skillWageManualTable.innerHTML = students.map((student) => {
    const business = getSkillBusiness(student.businessId);
    const value = skillState.wageManualAbsences?.[student.id] ?? "";
    return `
      <tr>
        <td>${escapeHtml(business?.name || "-")}</td>
        <td>${escapeHtml(student.no || "-")}</td>
        <td>${escapeHtml(student.name || "-")}</td>
        <td>${escapeHtml(student.className || "-")}</td>
        <td><input type="number" min="0" max="30" step="1" value="${escapeHtml(value)}" data-wage-manual-student="${escapeHtml(student.id)}" /></td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="5">Öğrenci kaydı yok.</td></tr>`;
  updateWageManualSummary();
}

function updateWageManualSummary() {
  if (!els.skillWageManualSummary) return;
  const inputs = Array.from(els.skillWageManualTable?.querySelectorAll("[data-wage-manual-student]") || []);
  const filled = inputs.filter((input) => String(input.value || "").trim() !== "").length;
  els.skillWageManualSummary.textContent = `Girilen: ${filled} / ${inputs.length} öğrenci`;
}

function openWageManualDialog() {
  renderWageManualDialog();
  els.skillWageManualDialog?.showModal();
}

function closeWageManualDialog() {
  if (els.skillWageManualDialog?.open) els.skillWageManualDialog.close();
}

function clearWageManualInputs() {
  els.skillWageManualTable?.querySelectorAll("[data-wage-manual-student]").forEach((input) => {
    input.value = "";
  });
  updateWageManualSummary();
}

function saveWageManualAbsences(event) {
  event.preventDefault();
  if (!skillState.wageManualAbsences || Array.isArray(skillState.wageManualAbsences)) skillState.wageManualAbsences = {};
  els.skillWageManualTable?.querySelectorAll("[data-wage-manual-student]").forEach((input) => {
    const studentId = input.dataset.wageManualStudent;
    const raw = String(input.value || "").trim();
    if (!raw) {
      delete skillState.wageManualAbsences[studentId];
      return;
    }
    const value = Math.max(0, Math.min(30, Number(raw) || 0));
    skillState.wageManualAbsences[studentId] = value;
  });
  saveSkillState();
  closeWageManualDialog();
  runSkillReportPrecheck();
  showToast("Manuel devamsızlık değerleri kaydedildi.");
}

function getWageAbsenceForStudent(student) {
  if (!els.skillWageManualAbsence?.checked) return 0;
  const value = skillState.wageManualAbsences?.[student.id];
  return Number.isFinite(Number(value)) ? Math.max(0, Math.min(30, Number(value))) : 0;
}

function getWageSupportAmount({ studentType, business, monthlyAmount }) {
  if (studentType === "mesem") return monthlyAmount;
  return business?.group === "2" ? monthlyAmount / 3 : (monthlyAmount * 2) / 3;
}

function buildWageReportHtml() {
  const ids = getFlexibleReportBusinessIds();
  if (!ids.length) {
    showToast("Ücret raporu için işletme kaydı bulunamadı.", "warning");
    return "";
  }
  const { startDate, endDate } = getReportDateRange();
  const studentType = els.skillWageStudentType?.value || "mesem";
  const minimumWage = parseSkillMoney(els.skillWageMinimumNet?.value) || 28250;
  const monthlyAmount = minimumWage * 0.3;
  const rows = skillState.students
    .filter((student) => ids.includes(student.businessId))
    .map((student) => {
      const business = getSkillBusiness(student.businessId);
      const absenceDays = getWageAbsenceForStudent(student, startDate, endDate);
      const deduction = Math.min(monthlyAmount, (monthlyAmount / 30) * absenceDays);
      const net = Math.max(0, monthlyAmount - deduction);
      const support = getWageSupportAmount({ studentType, business, monthlyAmount: net });
      return { student, business, absenceDays, deduction, net, support };
    });
  const rateLabel = studentType === "mesem"
    ? "Oran: Mesem: %30"
    : "Oran: Meslek lisesi: %30";
  const rowHtml = rows.map(({ student, business, absenceDays, deduction, net, support }) => `
    <tr>
      <td>${escapeHtml(business?.name || "-")}</td>
      <td>${escapeHtml(student.no || "-")}</td>
      <td>${escapeHtml(student.name || "-")}</td>
      <td class="field-col">${escapeHtml((student.field || "-").toLocaleUpperCase("tr-TR"))}</td>
      <td class="number">${escapeHtml(absenceDays)}</td>
      <td class="money">${escapeHtml(formatSkillMoney(monthlyAmount))}</td>
      <td class="money">${escapeHtml(formatSkillMoney(deduction))}</td>
      <td class="money">${escapeHtml(formatSkillMoney(net))}</td>
      <td class="money">${escapeHtml(formatSkillMoney(support))}</td>
    </tr>
  `).join("") || `<tr><td colspan="9">Seçilen aralık için öğrenci kaydı yok.</td></tr>`;

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Ücret Raporu</title>
        <style>
          @page { size: A4 landscape; margin: 6mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #111; background: #fff; }
          .wage-sheet { width: 285mm; min-height: 196mm; margin: 0 auto; position: relative; padding: 2mm 0 10mm; overflow: hidden; }
          .wage-header { display: grid; grid-template-columns: 1fr auto; gap: 8mm; align-items: end; margin-bottom: 4mm; font-size: 10px; }
          .wage-header h1 { margin: 0 0 1mm; font-size: 11px; line-height: 1.1; }
          .wage-header p { margin: 0 0 1.6mm; color: #555; }
          .wage-header strong { display: block; margin-top: 3mm; font-weight: 500; color: #111; }
          .wage-rate { align-self: center; font-size: 10px; white-space: nowrap; }
          .wage-line { height: 1px; background: #222; margin-bottom: 5mm; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9.7px; }
          th { padding: .9mm 1mm; border: 1px solid #bcbcbc; background: #eeeeee; text-align: center; font-size: 9.4px; }
          td { padding: 2mm 1mm 1.1mm; border-bottom: 1px solid #d2d2d2; vertical-align: top; line-height: 1.12; }
          th:nth-child(1), td:nth-child(1) { width: 38mm; }
          th:nth-child(2), td:nth-child(2) { width: 16mm; }
          th:nth-child(3), td:nth-child(3) { width: 55mm; }
          th:nth-child(4), td:nth-child(4) { width: 34mm; }
          th:nth-child(5), td:nth-child(5) { width: 12mm; }
          th:nth-child(6), td:nth-child(6),
          th:nth-child(7), td:nth-child(7),
          th:nth-child(8), td:nth-child(8) { width: 23mm; }
          th:nth-child(9), td:nth-child(9) { width: 26mm; }
          .number, .money { text-align: right; white-space: nowrap; }
          .field-col { font-size: 7.8px; line-height: 1.02; word-break: break-word; }
          .wage-brand { position: absolute; left: 0; right: 0; bottom: 1mm; text-align: center; color: #666; font-size: 9px; }
          @media screen { body { background: #dfe4e9; padding: 8mm 0; } .wage-sheet { background: #fff; } }
          @media print { body { background: #fff; } }
        </style>
      </head>
      <body>
        <main class="wage-sheet">
          <header class="wage-header">
            <div>
              <h1>ÜCRET ÖDEME RAPORU</h1>
              <p>${escapeHtml(formatSkillDate(startDate))} - ${escapeHtml(formatSkillDate(endDate))}</p>
              <strong>Asgari (Net): ${escapeHtml(formatSkillMoney(minimumWage))}</strong>
            </div>
            <div class="wage-rate">${escapeHtml(rateLabel)}</div>
          </header>
          <div class="wage-line"></div>
          <table>
            <thead>
              <tr>
                <th>İşletme</th>
                <th>No</th>
                <th>Ad Soyad</th>
                <th>Alan</th>
                <th>Dev.</th>
                <th>Aylık</th>
                <th>Kesinti</th>
                <th>Net</th>
                <th>Devlet Desteği</th>
              </tr>
            </thead>
            <tbody>${rowHtml}</tbody>
          </table>
          <div class="wage-brand">İme Evrak</div>
        </main>
      </body>
    </html>
  `;
}

function formatTerminationReportDate(value) {
  return value ? formatSkillDate(value) : "....../....../20....";
}

function buildTerminationReasonLines(reason) {
  const text = String(reason || "").trim();
  const lines = text ? escapeHtml(text).replace(/\n/g, "<br>") : "";
  return `<div class="termination-reasons">${lines}${Array.from({ length: text ? 3 : 5 }, () => "<span></span>").join("")}</div>`;
}

function buildNoticeTerminationReportHtml() {
  const blank = Boolean(els.skillTerminationBlank?.checked);
  const student = blank ? null : skillState.students.find((item) => item.id === els.skillTerminationStudent?.value);
  if (!blank && !student) {
    showToast("Fesih raporu için öğrenci seçin veya boş şablon oluşturun.", "warning");
    return "";
  }
  const business = student ? getSkillBusiness(student.businessId) : null;
  const coordinator = student ? skillState.coordinators.find((item) => item.businessId === student.businessId) : null;
  const reportSchool = getSkillSchoolForReport(coordinator);
  const principalName = reportSchool?.principal || skillState.schoolRecords?.[0]?.principal || "Okul Müdürü";
  const deputyName = reportSchool?.deputy || skillState.schoolRecords?.[0]?.deputy || "Müdür Yardımcısı";
  const coordinatorName = coordinator?.teacher || "Koordinatör Öğretmen";
  
  const studentName = blank ? "" : (student.name || "");
  const studentClass = blank ? "" : (student.className || "");
  const studentNo = blank ? "" : (student.no || "0");
  const studentTc = blank ? "" : (els.skillTerminationStudentTc?.value || "");
  const studentBranch = blank ? "" : (student.field || "");
  
  const veliName = blank ? "" : (els.skillTerminationVeliName?.value || "");
  const veliPhone = blank ? "" : (els.skillTerminationVeliPhone?.value || "");
  const veliAddress = blank ? "" : (els.skillTerminationVeliAddress?.value || "");
  
  const businessAddress = blank ? "" : (business?.address || "");
  const businessPhoneVal = blank ? "" : (business?.phone || "");

  const selectedReasonCode = els.skillTerminationReasonCode?.value || "";
  const selectedReasonCodeSuffix = selectedReasonCode ? selectedReasonCode.replace("24-", "") : "......";
  
  const reasonList = [
    { code: "24-a", text: "İşletmenin kapanması" },
    { code: "24-b", text: "İşletmenin iş sağlığı ve Güvenliği yükümlülüklerini yerine getirmemesi" },
    { code: "24-c", text: "İşletmenin ücret ödeme yükümlülüğünü yerine getirmemesi" },
    { code: "24-ç", text: "İşletmenin ücretli izin yükümlülüğünü yerine getirmemesi" },
    { code: "24-d", text: "Öğrenciden öğretim programında belirtilen gün ve saatler dışında (gece çalışması dahil) mesleki eğitim/staja devam etmesinin talep edilmesi" },
    { code: "24-e", text: "İşletmenin, öğrenciyi öğretim programında yer almayan işlerde sürekli ve sistematik biçimde çalıştırması" },
    { code: "24-f", text: "İşletmenin araç, ekipman vb. bakımından eğitim programına uygunluğunu kaybetmesi" },
    { code: "24-g", text: "İşletmede görevlendirilen eğitici personel/usta öğreticinin, öğrencinin mesleki eğitim faaliyetlerini mevzuata ve öğretim programına uygun şekilde yürütmemesi veya yeterli rehberlik sağlaması" },
    { code: "24-ğ", text: "İşletmedeki eğitici personel/usta öğreticinin işten ayrılması (ölüm, istifa, emeklilik vb.)" },
    { code: "24-h", text: "Öğrencinin işyerinin şartlarına ve çalışma düzenine uymaması" },
    { code: "24-ı", text: "Öğrencinin, kasıtlı veya ağır ihmal sonucu işletmenin demirbaşına, makine ve teçhizatına zarar vermesi" },
    { code: "24-i", text: "Öğrencinin, işletmeye ait ticari sır, üretim bilgisi, müşteri verisi veya benzeri gizlilik arz eden bilgileri yetkisiz kişilerle paylaşması" },
    { code: "24-j", text: "Öğrencinin iş sağlığı ve güvenliği kurallarına kasıtlı ve ısrarlı şekilde uymaması" },
    { code: "24-k", text: "Öğrencinin adli bir suç nedeniyle tutuklanması veya hüküm giymesi sonucu eğitimin fiilen sürdürülememesi" },
    { code: "24-l", text: "Öğrencinin sağlık/özel eğitim durumunun işletmedeki eğitimden olumsuz etkilenmesi" },
    { code: "24-m", text: "Öğrencinin okul değiştirme veya örgün eğitim dışına çıkarma cezası alarak okul/kurumla ilişiğinin kesilmesi" },
    { code: "24-n", text: "Öğrencinin okula veya işletmeye devamsızlık nedeniyle sınıf tekrarına kalması" },
    { code: "24-o", text: "Öğrencinin ikametinin değişmesi nedeniyle işletmeye ulaşım zorluğu" },
    { code: "24-ö", text: "Öğrencinin nakil/geçiş yoluyla okul/program/tür değiştirmesi" },
    { code: "24-p", text: "Öğrencinin alan/dal değişikliği yapması" },
    { code: "24-r", text: "İşletme sahibinin değişmesi (ölüm, iflas, devir vb.)" },
    { code: "24-s", text: "İşletmede grev veya lokavt olması" },
    { code: "24-ş", text: "Tarafların karşılıklı ve yazılı mutabakatı" },
    { code: "24-t", text: "Deprem, yangın ve sel vb. doğal afetler" },
    { code: "24-u", text: "Mezuniyet" }
  ];

  const reasonsRowsHtml = reasonList.map(item => {
    const isSelected = !blank && item.code === selectedReasonCode;
    const tickVal = isSelected ? "✔" : "";
    return `
      <tr style="border-bottom: 1px solid #000;">
        <td style="width: 25px; border-right: 1px solid #000; text-align: center; font-weight: bold; padding: 1px; height: 14px;">${tickVal}</td>
        <td style="width: 40px; border-right: 1px solid #000; text-align: center; font-weight: bold; padding: 1px;">${item.code}</td>
        <td style="padding: 1px 4px; text-align: left;">${item.text}</td>
      </tr>
    `;
  }).join("");

  const coordinatorOpinion = "";

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Sözleşme Fesih Bildirimi Önizleme</title>
        <style>
          @page { size: A4 portrait; margin: 6mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; font-size: 10px; }
          .notice-card {
            width: 198mm;
            margin: 0 auto;
            padding: 2mm;
          }
          header { text-align: center; margin-bottom: 3mm; border: 2px solid #000; padding: 6px; }
          header h2 { margin: 0; font-size: 12px; font-weight: bold; }
          .main-table { width: 100%; border-collapse: collapse; border: 2px solid #000; table-layout: fixed; }
          .main-table td { border: 1px solid #000; }
          .section-title { background: #e5e7eb; font-weight: bold; padding: 4px 6px; font-size: 11px; text-transform: uppercase; }
          .vertical-header-cell {
            width: 40px;
            text-align: center;
            vertical-align: middle;
            background: #f3f4f6;
            font-size: 8px;
            font-weight: bold;
            line-height: 1.15;
            padding: 4px 2px;
          }
          .vertical-text-wrap {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            display: inline-block;
            text-align: center;
            margin: 0 auto;
          }
          .reasons-table { width: 100%; border-collapse: collapse; font-size: 8px; line-height: 1.1; }
          .reasons-table td { border: none !important; border-bottom: 1px solid #ccc !important; }
          .reasons-table tr:last-child td { border-bottom: none !important; }
          .signature-box { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; text-align: center; }
          @media screen {
            body { background: #dfe4e9; padding: 8mm 0; }
            .notice-card { background: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); min-height: 285mm; }
          }
          @media print {
            body { background: #fff; }
          }
        </style>
      </head>
      <body>
        <main class="notice-card">
          <header>
            <h2>NAZİLLİ MESLEKİ EĞİTİM MERKEZİ İŞLETMELERDE BECERİ EĞİTİMİ / ÇIRAKLIK SÖZLEŞMESİ FESİH BİLDİRİMİ</h2>
          </header>
          <table class="main-table">
            <colgroup>
              <col style="width: 40px;" />
              <col />
              <col style="width: 25%;" />
              <col style="width: 25%;" />
            </colgroup>
            <!-- ÖĞRENCİNİN -->
            <tr>
              <td colspan="4" class="section-title">ÖĞRENCİNİN</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 5px; width: 50%;"><strong>Adı ve Soyadı :</strong> ${escapeHtml(studentName)}</td>
              <td style="padding: 5px; width: 25%;"><strong>Sınıfı :</strong> ${escapeHtml(studentClass)}</td>
              <td style="padding: 5px; width: 25%;"><strong>Okul No :</strong> ${escapeHtml(studentNo)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 5px;"><strong>TC Numarası :</strong> ${escapeHtml(studentTc)}</td>
              <td colspan="2" style="padding: 5px;"><strong>Meslek Dalı :</strong> ${escapeHtml(studentBranch)}</td>
            </tr>

            <!-- VELİ -->
            <tr>
              <td class="vertical-header-cell">
                <div class="vertical-text-wrap">ÖĞRENCİ VELİSİ<br>TARAFINDAN<br>DOLDURULACAKTIR</div>
              </td>
              <td colspan="3" style="padding: 8px; vertical-align: top;">
                <div style="text-align: center; font-weight: bold; margin-bottom: 6px; font-size: 11px;">NAZİLLİ MESLEKİ EĞİTİM MERKEZİ MÜDÜRLÜĞÜNE</div>
                Velisi bulunduğum ve yukarıda kimlik bilgileri yazılı okulunuz öğrencisinin, işletmelerde beceri eğitimi sözleşmesini aşağıda belirttiğim nedenden dolayı; sözleşmesinin ilgili maddesi gereğince tarafımızca fesih edilmesini istiyorum. Gereğini bilgilerinize arz ederim.
                <div style="margin-top: 12px; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10px;">
                  <div>
                    <strong>Adres:</strong> ${escapeHtml(veliAddress)}<br>
                    <strong>Telefon:</strong> ${escapeHtml(veliPhone)}
                  </div>
                  <div style="display: flex; justify-content: flex-end; padding-right: 10px;">
                    <div style="text-align: center; display: inline-block;">
                      ....../....../202...<br><br>
                      <strong>${escapeHtml(veliName)}</strong><br>
                      <span>(Veli Adı Soyadı- İmza)</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <!-- İŞVEREN -->
            <tr>
              <td class="vertical-header-cell">
                <div class="vertical-text-wrap">AYRILDIĞI İŞVEREN/VEKİLİ<br>TARAFINDAN<br>DOLDURULACAKTIR</div>
              </td>
              <td colspan="3" style="padding: 8px; vertical-align: top;">
                <div style="text-align: center; font-weight: bold; margin-bottom: 6px; font-size: 11px;">NAZİLLİ MESLEKİ EĞİTİM MERKEZİ MÜDÜRLÜĞÜNE</div>
                İşletmemizde yukarıda kimlik bilgileri yazılı okulunuz öğrencisinin, işletmelerde beceri eğitimi sözleşmesinin aşağıda belirttiğim nedenden; ilgili maddesi gereğince tarafımızca fesih edilmesini istiyorum. Gereğini bilgilerinize arz ederim.
                <div style="margin-top: 12px; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10px;">
                  <div>
                    <strong>Adres:</strong> ${escapeHtml(businessAddress)}<br>
                    <strong>Telefon:</strong> ${escapeHtml(businessPhoneVal)}
                  </div>
                  <div style="display: flex; justify-content: flex-end; padding-right: 10px;">
                    <div style="text-align: center; display: inline-block;">
                      ....../....../202...<br><br>
                      <strong>(İşveren Adı Soyadı- İmza-Kaşe)</strong>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <!-- FESİH SÖZLEŞMESİ İLGİLİ MADDESİ -->
            <tr>
              <td class="vertical-header-cell">
                <div class="vertical-text-wrap">FESİH SÖZLEŞMESİ<br>İLGİLİ MADDESİ</div>
              </td>
              <td colspan="3" style="padding: 6px; vertical-align: top;">
                <div style="font-weight: bold; margin-bottom: 4px;">İşletmelerde Beceri Eğitimi Sözleşmesinin Fesih Sebebi:....</div>
                <table class="reasons-table">
                  ${reasonsRowsHtml}
                </table>
                <div style="margin-top: 6px; font-weight: bold; text-align: justify; font-size: 8.5px; line-height: 1.2;">
                  hallerinde tek taraflı olarak feshedilir. Fesih durumu, sözleşmenin feshi tarihinden itibaren 3 iş günü içinde ilgili okul/kurum müdürlüğüne yazılı olarak bildirilir. (3308 sayılı Kanun madde 22, Millî Eğitim Bakanlığı Ortaöğretim Kurumları Yönetmeliği, madde 133).
                </div>
              </td>
            </tr>

            <!-- KOORDİNATÖR -->
            <tr>
              <td class="vertical-header-cell">
                <div class="vertical-text-wrap">KOORDİNATÖR ÖĞRETMEN<br>TARAFINDAN<br>DOLDURULACAKTIR</div>
              </td>
              <td colspan="3" style="padding: 8px; vertical-align: top;">
                <strong>Varsa Özel Görüşü:</strong> <span style="border-bottom: 1px dashed #444; display: inline-block; width: 80%; min-height: 14px; padding-left: 5px;">${escapeHtml(coordinatorOpinion)}</span>
                <div style="display: flex; justify-content: flex-end; margin-top: 15px; padding-right: 10px;">
                  <div style="text-align: center; display: inline-block;">
                    ....../....../202...<br><br>
                    <strong>${escapeHtml(coordinatorName)}</strong><br>
                    <span>(Koordinatör Öğretmen - İmza)</span>
                  </div>
                </div>
              </td>
            </tr>

            <!-- OKUL MÜDÜRLÜĞÜ -->
            <tr>
              <td class="vertical-header-cell">
                <div class="vertical-text-wrap">OKUL MÜDÜRLÜĞÜ<br>TARAFINDAN<br>DOLDURULACAKTIR</div>
              </td>
              <td colspan="3" style="padding: 8px; vertical-align: top;">
                <div style="text-align: justify; line-height: 1.3; font-weight: bold; margin-bottom: 8px; font-size: 10.5px;">
                  Tarafların isteklerinin sözleşmenin ( 24 - <strong style="border-bottom: 1.5px solid #000; padding: 0 8px; min-width: 30px; display: inline-block; text-align: center;">${blank ? "......" : selectedReasonCodeSuffix}</strong> ) Maddesine uygun olduğu, yasal sorumluluk taraflara ait olmak üzere fesih işleminin yapılması ve sözleşmenin iptal edilmesi uygundur.
                </div>
                <div class="signature-box">
                  <div>
                    ....../....../202...<br><br>
                    <strong>${escapeHtml(deputyName)}</strong><br>
                    <span>Koordinatör Müdür Yardımcısı</span><br>
                    <span>İmza</span>
                  </div>
                  <div>
                    ....../....../202...<br><br>
                    <strong>${escapeHtml(principalName)}</strong><br>
                    <span>Okul Müdürü</span><br>
                    <span>İmza - Mühür</span>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </main>
      </body>
    </html>
  `;
}

function buildTerminationReportHtml() {
  const blank = Boolean(els.skillTerminationBlank?.checked);
  const isNotice = els.skillTerminationTemplate?.value === "notice";
  if (isNotice) {
    return buildNoticeTerminationReportHtml();
  }
  const student = blank ? null : skillState.students.find((item) => item.id === els.skillTerminationStudent?.value);
  if (!blank && !student) {
    showToast("Fesih raporu için öğrenci seçin veya boş şablon oluşturun.", "warning");
    return "";
  }
  const business = student ? getSkillBusiness(student.businessId) : null;
  const coordinator = student ? skillState.coordinators.find((item) => item.businessId === student.businessId) : null;
  const reportSchool = getSkillSchoolForReport(coordinator);
  const principal = reportSchool?.principal || skillState.schoolRecords?.[0]?.principal || "Okul Müdürü";
  const field = student?.field || "";
  const contractDate = blank ? "" : formatTerminationReportDate(els.skillTerminationContractDate?.value);
  const cancelDate = blank ? "" : formatTerminationReportDate(els.skillTerminationCancelDate?.value);
  const reasons = buildTerminationReasonLines(blank ? "" : els.skillTerminationReasons?.value);
  const className = student?.className || "";
  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Sözleşme İptal Önizleme</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; }
          .termination-card {
            width: 194mm;
            min-height: 275mm;
            margin: 0 auto;
            padding: 13mm 10mm;
            border: 1.8px solid #111;
            font-size: 14px;
            line-height: 1.18;
          }
          header { text-align: center; margin-bottom: 10mm; }
          h1, h2, h3 { margin: 0; font-weight: 800; }
          h1 { font-size: 14px; margin-bottom: 5mm; }
          h2 { font-size: 14px; margin-bottom: 6mm; }
          h3 { font-size: 20px; }
          .termination-row {
            display: grid;
            grid-template-columns: 72mm 6mm minmax(0, 1fr);
            align-items: center;
            min-height: 8.5mm;
            font-size: 14px;
          }
          .termination-row strong { font-size: 14px; }
          .termination-row .value {
            min-height: 7mm;
            padding: 1.4mm 1mm .4mm;
            border-bottom: 1px solid #cfcfcf;
            font-size: 14px;
            line-height: 1.1;
          }
          .student-title {
            margin: 4mm 0 1mm;
            font-size: 14px;
            font-weight: 800;
            text-decoration: underline;
          }
          .reason-row { align-items: start; margin-top: 3mm; }
          .reason-row strong, .reason-row b { padding-top: 1.5mm; }
          .termination-reasons {
            min-height: 30mm;
            padding-top: 0;
            border-bottom: 1px solid #cfcfcf;
          }
          .termination-reasons span {
            display: block;
            height: 7mm;
            border-bottom: 1px solid #d7d7d7;
          }
          .termination-text {
            margin-top: 18mm;
            font-weight: 800;
            text-align: justify;
            word-spacing: 2px;
          }
          .termination-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            margin-top: 18mm;
            align-items: start;
            text-align: center;
            font-size: 13px;
          }
          .termination-signatures strong,
          .termination-signatures span {
            display: block;
          }
          .termination-signatures small {
            display: block;
            margin-top: 6mm;
            font-size: 13px;
          }
          .principal-signature strong { margin-top: 6mm; }
          @media screen {
            body { background: #dfe4e9; padding: 8mm 0; }
          }
          @media print {
            body { background: #fff; }
          }
        </style>
      </head>
      <body>
        <main class="termination-card">
          <header>
            <h1>${escapeHtml(reportSchool?.name || "OKUL ADI")}</h1>
            <h2>İŞLETMELERDE BECERİ EĞİTİMİ GÖREN ÖĞRENCİLERE AİT</h2>
            <h3>SÖZLEŞME İPTAL TUTANAĞI</h3>
          </header>
          <section>
            <div class="termination-row"><strong>İŞLETMENİN ADI</strong><b>:</b><span class="value">${escapeHtml(business?.name || "")}</span></div>
            <div class="student-title">ÖĞRENCİNİN</div>
            <div class="termination-row"><strong>ADI SOYADI</strong><b>:</b><span class="value">${escapeHtml(student?.name || "")}</span></div>
            <div class="termination-row"><strong>ALANI</strong><b>:</b><span class="value">${escapeHtml(field)}</span></div>
            <div class="termination-row"><strong>SINIFI</strong><b>:</b><span class="value">${escapeHtml(className)}</span></div>
            <div class="termination-row"><strong>NUMARASI</strong><b>:</b><span class="value">${escapeHtml(student?.no || "")}</span></div>
            <div class="termination-row"><strong>SÖZLEŞME TARİHİ</strong><b>:</b><span class="value">${escapeHtml(contractDate)}</span></div>
            <div class="termination-row"><strong>SÖZLEŞME İPTAL TARİHİ</strong><b>:</b><span class="value">${escapeHtml(cancelDate)}</span></div>
            <div class="termination-row reason-row"><strong>İPTAL NEDENLERİ</strong><b>:</b>${reasons}</div>
          </section>
          <p class="termination-text">Ortaöğretim Kurumları Yönetmeliği uyarınca İşletmede Beceri Eğitimi yapılan ve yukarıda belirtilen iş yerinden kimliği yazılı öğrencinin açıklanan nedenlerden dolayı sözleşmesi iptal edilmiştir.</p>
          <div class="termination-signatures">
            <span><strong>İşletme Yetkilisi</strong></span>
            <span><strong>Koordinatör Öğretmen</strong><small>${escapeHtml(coordinator?.teacher || "")}</small></span>
            <span class="principal-signature"><span>....../....../${new Date().getFullYear()}</span><strong>${escapeHtml(principal)}</strong><small>Okul Müdürü</small></span>
          </div>
        </main>
      </body>
    </html>
  `;
}

function buildAbsenceReportHtml() {
  const ids = getFlexibleReportBusinessIds();
  if (!ids.length) {
    showToast("İşletme kaydı bulunamadı.", "warning");
    return "";
  }
  const { startDate, endDate } = getReportDateRange();

  function getSkillReportDocumentDateStr(endDateStr) {
    const parts = endDateStr.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let nextYear = year;
    let nextMonth = month;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    let targetDate = new Date(nextYear, nextMonth, 1);
    while (true) {
      const dayOfWeek = targetDate.getDay();
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, "0");
      const d = String(targetDate.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const isHoliday = skillState.holidays.some((holiday) => (
        dateStr >= holiday.startDate && 
        dateStr <= (holiday.endDate || holiday.startDate) && 
        !isSkillSchoolBreakForMesem(holiday)
      ));
      if (!isWeekend && !isHoliday) {
        return dateStr;
      }
      targetDate.setDate(targetDate.getDate() + 1);
    }
  }

  const docDateStr = getSkillReportDocumentDateStr(endDate);
  const dates = getDatesBetween(startDate, endDate);
  const perPage = Number(els.skillReportPerPage?.value || 1);
  const pageClass = perPage === 2 ? "two-up" : "one-up";
  const monthLabel = new Date(`${startDate}T00:00:00`).toLocaleDateString("tr-TR", { month: "long", year: "numeric" }).toLocaleUpperCase("tr-TR");
  const reportCards = ids.map((businessId) => {
    const business = getSkillBusiness(businessId);
    const coordinator = skillState.coordinators.find((item) => item.businessId === businessId);
    const reportSchool = getSkillSchoolForReport(coordinator);
    const deputyName = getSkillDeputyForReport(coordinator);
    const students = skillState.students.filter((student) => student.businessId === businessId);
    const dayHeads = dates.map((date) => `<th class="day-col date-head ${isMutedReportDate(date) ? "muted-day" : ""}" rowspan="2"><span>${escapeHtml(getSkillReportDayHeader(date))}</span></th>`).join("");
    const isHalf = perPage === 2;
    const dayColWidth = isHalf
      ? (113.0 / dates.length).toFixed(4)
      : (120.5 / dates.length).toFixed(4);
    const colGroup = isHalf
      ? `
        <colgroup>
          <col style="width: 33.0mm;">
          <col style="width: 5.5mm;">
          <col style="width: 16.5mm;">
          <col style="width: 6.0mm;">
          ${dates.map(() => `<col style="width: ${dayColWidth}mm;">`).join("")}
          <col style="width: 9.0mm;">
          <col style="width: 9.0mm;">
        </colgroup>
      `
      : `
        <colgroup>
          <col style="width: 30.0mm;">
          <col style="width: 6.0mm;">
          <col style="width: 16.5mm;">
          <col style="width: 7.0mm;">
          ${dates.map(() => `<col style="width: ${dayColWidth}mm;">`).join("")}
          <col style="width: 6.0mm;">
          <col style="width: 6.0mm;">
        </colgroup>
      `;
    const studentRows = students.map((student) => {
      let excusedAm = 0;
      let unexcusedAm = 0;
      let excusedPm = 0;
      let unexcusedPm = 0;
      let hasAnyAbsenceMark = false;
      dates.forEach((date) => {
        const amVal = getReportSymbolForDate(student, date, "am");
        const pmVal = getReportSymbolForDate(student, date, "pm");
        const amUpper = String(amVal || "").trim().toUpperCase();
        const pmUpper = String(pmVal || "").trim().toUpperCase();

        if (["İ", "I", "H", "R", "D", "T"].includes(amUpper)) hasAnyAbsenceMark = true;
        if (["İ", "I", "H", "R", "D", "T"].includes(pmUpper)) hasAnyAbsenceMark = true;

        if (["İ", "I", "H", "R"].includes(amUpper)) excusedAm += 0.5;
        if (["D", "T"].includes(amUpper)) unexcusedAm += 0.5;
        if (["İ", "I", "H", "R"].includes(pmUpper)) excusedPm += 0.5;
        if (["D", "T"].includes(pmUpper)) unexcusedPm += 0.5;
      });
      const excusedAmStr = !hasAnyAbsenceMark ? "" : (excusedAm % 1 === 0 ? String(excusedAm) : excusedAm.toFixed(1).replace(".", ","));
      const unexcusedAmStr = !hasAnyAbsenceMark ? "" : (unexcusedAm % 1 === 0 ? String(unexcusedAm) : unexcusedAm.toFixed(1).replace(".", ","));
      const excusedPmStr = !hasAnyAbsenceMark ? "" : (excusedPm % 1 === 0 ? String(excusedPm) : excusedPm.toFixed(1).replace(".", ","));
      const unexcusedPmStr = !hasAnyAbsenceMark ? "" : (unexcusedPm % 1 === 0 ? String(unexcusedPm) : unexcusedPm.toFixed(1).replace(".", ","));

      return `
        <tr>
          <td class="student-name" rowspan="2">${escapeHtml(student.name)}</td>
          <td class="student-no" rowspan="2">${escapeHtml(student.no || "-")}</td>
          <td class="student-field" rowspan="2">${escapeHtml(student.field || "-")}</td>
          <td class="student-days">S</td>
          ${dates.map((date) => `<td class="symbol-cell ${isMutedReportDate(date) ? "muted-day" : ""}">${escapeHtml(getReportSymbolForDate(student, date, "am"))}</td>`).join("")}
          <td class="total-cell">${escapeHtml(excusedAmStr)}</td><td class="total-cell">${escapeHtml(unexcusedAmStr)}</td>
        </tr>
        <tr>
          <td class="student-days">Ö</td>
          ${dates.map((date) => `<td class="symbol-cell ${isMutedReportDate(date) ? "muted-day" : ""}">${escapeHtml(getReportSymbolForDate(student, date, "pm"))}</td>`).join("")}
          <td class="total-cell">${escapeHtml(excusedPmStr)}</td><td class="total-cell">${escapeHtml(unexcusedPmStr)}</td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="${dates.length + 6}">Bu işletmeye bağlı öğrenci yok.</td></tr>`;
    return `
      <section class="absence-report-card ${perPage === 2 ? "is-half" : ""} ${perPage === 2 && students.length > 3 ? "is-condensed" : ""}">
        <div class="absence-report-wrapper">
          <header>
            <h1>${escapeHtml(reportSchool?.name || "OKUL ADI")}</h1>
            <h2>ÖĞRENCİLERİN İŞLETMELERDE MESLEKİ EĞİTİMİ AYLIK DEVAM - DEVAMSIZLIK BİLDİRİM ÇİZELGESİ</h2>
          </header>
          <div class="absence-report-meta">
            <span><strong>İŞLETME ADI</strong>${escapeHtml(business?.name || "-")}</span>
            <span><strong>İŞLETME TEL.</strong>${escapeHtml(business?.phone || "-")}</span>
            <span><strong>Ait Olduğu Ay</strong>${escapeHtml(monthLabel)}</span>
            <span><strong>Belgenin Düzenlendiği Tarih:</strong>${escapeHtml(formatSkillDate(docDateStr))}</span>
          </div>
          <table>
            ${colGroup}
            <thead>
              <tr>
                <th colspan="3" class="student-head">ÖĞRENCİNİN</th>
                <th rowspan="2" class="student-days"><span>GÜNLER</span></th>
                ${dayHeads}
                <th colspan="2" class="total-head">Toplam<br>Devamsızlık</th>
              </tr>
              <tr>
                <th class="student-name">ADI SOYADI</th>
                <th class="student-no"><span>OKUL NO</span></th>
                <th class="student-field"><span>ALAN DAL</span></th>
                <th class="total-cell"><span>ÖZÜRLÜ</span></th>
                <th class="total-cell"><span>ÖZÜRSÜZ</span></th>
              </tr>
            </thead>
            <tbody>${studentRows}</tbody>
          </table>
          <div class="absence-report-footer">
            <span><strong>İŞLETME YETKİLİSİ</strong><small>...../...../20.....<br><br><br>ADI SOYADI<br>Kaşe - İmza</small></span>
            <span><strong>İNCELENDİ</strong><small>...../...../20.....<br><br>${escapeHtml(deputyName)}<br>Koordinatör<br>Müdür Yardımcısı<br><br>İmza</small></span>
            <span>
              <div class="legend-note">
                <strong>Açıklama:</strong> Bu çizelge, işletme tarafından tutulacak, öğrencinin işletmede bulunması gereken günlere ait devamsızlık durumları ilgili sütunda, altta gösterilen uygun sembollerle belirtilecektir. (İ),(H),ve (R) ile gösterilen devamsızlıklar toplamı özürlü devamsızlık sütununa yazılacaktır.
              </div>
              <div class="legend-group">
                <div class="legend-title">Devam Sembolleri:</div>
                <div class="legend-items">
                  <span class="legend-item"><b>X</b>İşletmede</span>
                  <span class="legend-item"><b>O</b>Okulda</span>
                </div>
              </div>
              <div class="legend-group">
                <div class="legend-title">Devamsızlık Sembolleri:</div>
                <div class="legend-items">
                  <span class="legend-item"><b>İ</b>İzinli</span>
                  <span class="legend-item"><b>D</b>Özürsüz</span>
                  <span class="legend-item"><b>H</b>Hasta</span>
                  <span class="legend-item"><b>R</b>Raporlu</span>
                  <span class="legend-item"><b>T</b>Tatil</span>
                  <span class="legend-item"><b>S</b>Sabah</span>
                  <span class="legend-item"><b>Ö</b>Öğle</span>
                </div>
              </div>
            </span>
          </div>
        </div>
      </section>
    `;
  }).join("");
  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Devamsızlık Önizleme</title>
        <style>
          @page { size: A4 portrait; margin: 9mm 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; }
          .report-sheet { width: 194mm; margin: 0 auto; }
          .absence-report-card {
            width: 194mm;
            padding: 0;
            border: 0;
            background: #fff;
            break-after: page;
            page-break-after: always;
          }
          .absence-report-card.is-half {
            width: 194mm;
            height: 139.5mm;
            margin: 0 !important;
            padding: 0 !important;
            break-after: auto;
            page-break-after: auto;
            overflow: hidden;
            box-sizing: border-box;
            background: #fff;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
          }
          .absence-report-card.is-half > * {
            flex-shrink: 0 !important;
          }
          .absence-report-wrapper {
            width: 100%;
            display: block;
            padding: 0 0.5mm;
          }
          .absence-report-card.is-half:nth-child(even) {
            border-top: 1px dashed #000 !important;
            break-after: page;
            page-break-after: always;
          }
          header { text-align: center; margin-bottom: 2mm; }
          header {
            min-height: 12mm;
            padding: 2.5mm 2mm 1.8mm;
            border: 1px solid #000;
          }
          h1 { margin: 0; font-size: 12.5px; line-height: 1.15; font-weight: 800; }
          h2 { margin: 1mm 0 0; font-size: 11px; line-height: 1.12; font-weight: normal; }
          .absence-report-meta {
            display: grid;
            grid-template-columns: 87.62mm 28.11mm 28.12mm 49.15mm;
            margin-bottom: 1.8mm;
            border: 1px solid #000;
            font-size: 10px;
          }
          .absence-report-meta span {
            min-height: 12mm;
            padding: 1.3mm;
            border-right: 1px solid #000;
            text-align: center;
          }
          .absence-report-meta span:last-child {
            border-right: 0;
          }
          .absence-report-meta strong { display: block; margin-bottom: 1.4mm; font-size: 9.5px; font-weight: normal; }
          table { width: calc(100% - 1px); margin: 0 auto; border-collapse: collapse; table-layout: fixed; font-size: 8px; line-height: 1.05; border: 1px solid #000; }
          th, td { border: 1px solid #000; padding: .85mm .55mm; text-align: center; vertical-align: middle; overflow: hidden; background-clip: padding-box !important; }
          tbody td { padding: 0.9mm 0.55mm; }
          thead th { font-weight: normal; border-bottom: 1px solid #000 !important; }
          thead tr:first-child th { border-top: 1px solid #000 !important; }
          .student-head, .student-name, .student-field { text-align: left; }
          .student-head { text-align: center; }
          .student-name { font-size: 9.5px; }
          .student-no { }
          .student-field { font-size: 7.2px; line-height: 1.0; }
          .student-days { font-weight: normal; }
          th.student-days,
          thead th.student-no,
          thead th.student-field,
          thead th.total-cell {
            writing-mode: vertical-rl;
            white-space: nowrap;
            padding: 1.5mm 0.5mm;
            text-align: center;
            vertical-align: middle;
          }
          th.student-days span,
          thead th.student-no span,
          thead th.student-field span,
          thead th.total-cell span {
            display: inline-block;
            transform: rotate(180deg);
          }
          .date-head, .student-head, th.student-days, .total-head { border-top: 1px solid #000 !important; }
          .date-head {
            height: 22mm;
            writing-mode: vertical-rl;
            white-space: nowrap;
            text-align: right;
            vertical-align: middle;
            padding: 1.5mm 0.5mm;
          }
          .date-head span {
            display: inline-block;
            transform: rotate(180deg);
            color: #000;
            font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
            font-size: 11px;
            font-weight: normal;
            line-height: 1;
            letter-spacing: -0.05px;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
          .day-col { padding-left: 0; padding-right: 0; }
          .symbol-cell { font-size: 8px; font-weight: normal; padding-left: 0; padding-right: 0; }
          .muted-day {
            background: #e2e8f0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .total-cell { padding-left: 0; padding-right: 0; }
          .total-head { font-size: 6.8px; line-height: 1.05; white-space: normal; word-break: break-word; }
          .absence-report-footer {
            display: grid;
            grid-template-columns: 1fr 1fr 1.15fr;
            gap: 0;
            margin-top: 3mm;
            border: 1px solid #000;
            border-right: 0;
            font-size: 10px;
          }
          .absence-report-footer > span { min-height: 34mm; border-right: 1px solid #000; padding: 2mm; text-align: center; }
          .absence-report-footer strong, .absence-report-footer small { display: block; }
          .absence-report-footer strong { font-weight: normal; }
          .absence-report-footer small { margin-top: 3.5mm; line-height: 1.35; }
          .absence-report-footer > span:nth-child(3) { text-align: left; }
          .absence-report-footer > span:nth-child(3) strong { text-align: center; margin-bottom: 2mm; }
          .legend-group {
            margin-bottom: 2mm;
          }
          .legend-title {
            font-size: 8.5px;
            font-weight: bold;
            margin-bottom: 1.2mm;
          }
          .legend-items {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1mm 1.5mm;
          }
          .legend-item {
            display: inline-flex;
            align-items: center;
            white-space: nowrap;
            font-size: 8px;
          }
          .legend-item b {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 3.8mm;
            height: 3.8mm;
            border: 1px solid #000;
            margin-right: 0.8mm;
            font-weight: bold;
            background: #f8fafc;
          }
          .legend-note {
            border-bottom: 1px solid #000;
            padding-bottom: 2.0mm;
            margin-bottom: 2.0mm;
            font-size: 7.5px;
            line-height: 1.22;
          }
          .legend-note strong {
            display: inline !important;
            font-weight: bold !important;
            text-align: left !important;
          }
          .absence-report-card.is-half.is-condensed header { min-height: 9mm; margin-bottom: 1mm; padding: 1.5mm; }
          .absence-report-card.is-half.is-condensed h1 { font-size: 10px; }
          .absence-report-card.is-half.is-condensed h2 { font-size: 8.8px; }
          .absence-report-card.is-half .absence-report-meta {
            grid-template-columns: 87.37mm 26.36mm 26.37mm 52.90mm;
          }
          .absence-report-card.is-half.is-condensed .absence-report-meta {
            font-size: 8px;
            margin-bottom: 1mm;
          }
          .absence-report-card.is-half.is-condensed .absence-report-meta span { min-height: 8mm; padding: .9mm; }
          .absence-report-card.is-half.is-condensed .absence-report-meta strong { font-size: 7px; margin-bottom: .6mm; }
          .absence-report-card.is-half.is-condensed table { font-size: 6.2px; }
          .absence-report-card.is-half.is-condensed th, .absence-report-card.is-half.is-condensed td { padding: .45mm .35mm; }
          .absence-report-card.is-half.is-condensed tbody td { padding: 0.5mm 0.35mm; }
          .absence-report-card.is-half.is-condensed .date-head {
            height: 19mm;
            padding: 1mm 0.3mm;
            writing-mode: vertical-rl;
            white-space: nowrap;
            text-align: right;
            vertical-align: middle;
          }
          .absence-report-card.is-half.is-condensed .date-head span {
            display: inline-block;
            transform: rotate(180deg);
            font-size: 9.5px;
            font-weight: normal;
            letter-spacing: -0.05px;
          }
          .absence-report-card.is-half.is-condensed .day-col { }
          .absence-report-card.is-half.is-condensed .symbol-cell { font-size: 6.5px; }
          .absence-report-card.is-half.is-condensed .student-name { font-size: 7.5px; }
          .absence-report-card.is-half.is-condensed .student-no { }
          .absence-report-card.is-half.is-condensed .student-field { font-size: 5.8px; line-height: 1.0; }
          .absence-report-card.is-half.is-condensed .student-days { }
          .absence-report-card.is-half.is-condensed .total-cell { }
          .absence-report-card.is-half.is-condensed .total-head { font-size: 5.5px; line-height: 1.05; white-space: normal; word-break: break-word; }
          .absence-report-card.is-half.is-condensed .absence-report-footer { margin-top: 2mm; font-size: 8px; }
          .absence-report-card.is-half.is-condensed .absence-report-footer > span { min-height: 25mm; padding: 1.2mm; }
          .absence-report-card.is-half.is-condensed .absence-report-footer small { margin-top: 1.8mm; }
          .absence-report-card.is-half.is-condensed .legend-group {
            margin-bottom: 1.2mm;
          }
          .absence-report-card.is-half.is-condensed .legend-title {
            font-size: 7.2px;
            margin-bottom: 0.8mm;
          }
          .absence-report-card.is-half.is-condensed .legend-items {
            grid-template-columns: repeat(4, 1fr);
            gap: 0.8mm 1mm;
          }
          .absence-report-card.is-half.is-condensed .legend-item {
            font-size: 7px;
          }
          .absence-report-card.is-half.is-condensed .legend-item b {
            width: 3.3mm;
            height: 3.3mm;
            margin-right: 0.5mm;
          }
          .absence-report-card.is-half.is-condensed .legend-note {
            padding-bottom: 1.2mm;
            margin-bottom: 1.2mm;
            font-size: 6.2px;
            line-height: 1.15;
            border-bottom: 1px solid #000;
          }

          /* Border overrides removed to make all borders uniform 1px */

          @media screen {
            body { background: #f1f5f9; padding: 10mm 0; }
            .report-sheet { width: 194mm; margin: 0 auto; }
            .absence-report-card {
              margin-bottom: 10mm;
              padding: 0;
              box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04) !important;
              border: 1px solid #cbd5e1 !important;
              border-radius: 6px !important;
            }
          }
          @media print {
            body { background: #fff; }
            .report-sheet { width: auto; margin: 0; }
            .absence-report-card { box-shadow: none; margin: 0; border: none !important; border-radius: 0 !important; }
          }
        </style>
      </head>
      <body><main class="report-sheet ${pageClass}">${reportCards}</main></body>
    </html>
  `;
}

function previewSkillAbsenceReport() {
  if (!["absence", "daily", "monthly", "termination", "grades", "wage"].includes(activeSkillReportType)) {
    showToast("Bu rapor türü için önizleme henüz eklenmedi.", "warning");
    return;
  }
  const html = activeSkillReportType === "daily"
    ? buildDailyGuidanceReportHtml()
    : activeSkillReportType === "monthly"
      ? buildMonthlyGuidanceReportHtml()
      : activeSkillReportType === "termination"
        ? buildTerminationReportHtml()
        : activeSkillReportType === "grades"
          ? buildGradeReportHtml()
          : activeSkillReportType === "wage"
            ? buildWageReportHtml()
            : buildAbsenceReportHtml();
  if (!html) return;
  if (!els.skillReportPreviewFrame || !els.skillReportPreviewDialog) return;
  if (els.skillReportPreviewTitle) {
    els.skillReportPreviewTitle.textContent = activeSkillReportType === "daily"
      ? "Günlük Rehberlik Raporu Önizleme"
      : activeSkillReportType === "monthly"
        ? "Aylık Rehberlik Raporu Önizleme"
        : activeSkillReportType === "termination"
          ? "Sözleşme İptal Tutanağı Önizleme"
          : activeSkillReportType === "grades"
            ? "Not Çizelgesi Önizleme"
            : activeSkillReportType === "wage"
              ? "Ücret Raporu Önizleme"
              : "Devamsızlık Raporu Önizleme";
  }
  currentSkillReportZoom = 1.0;
  if (els.skillReportZoomLabel) {
    els.skillReportZoomLabel.textContent = "100%";
  }
  els.skillReportPreviewFrame.srcdoc = html;
  els.skillReportPreviewDialog.showModal();
}

function closeSkillReportPreview() {
  if (els.skillReportPreviewDialog?.open) els.skillReportPreviewDialog.close();
}

function printSkillAbsenceReport() {
  const frameWindow = els.skillReportPreviewFrame?.contentWindow;
  if (!frameWindow) return;
  frameWindow.focus();
  frameWindow.print();
}
let currentSkillReportZoom = 1.0;

function zoomSkillReport(factor) {
  currentSkillReportZoom = Math.min(2.0, Math.max(0.5, currentSkillReportZoom + factor));
  updateSkillReportZoom();
}

function updateSkillReportZoom() {
  if (els.skillReportZoomLabel) {
    els.skillReportZoomLabel.textContent = `${Math.round(currentSkillReportZoom * 100)}%`;
  }
  const frameDoc = els.skillReportPreviewFrame?.contentDocument;
  if (frameDoc && frameDoc.body) {
    frameDoc.body.style.zoom = currentSkillReportZoom;
  }
}

async function shareSkillReport() {
  const reportTitle = els.skillReportPreviewTitle?.textContent || "Rapor";
  if (navigator.share) {
    try {
      await navigator.share({
        title: reportTitle,
        text: `${reportTitle} - Okul Takip Sistemi (OTS) Beceri Eğitimi Modülü`,
        url: window.location.href
      });
    } catch (err) {
      console.log("Paylaşım başarısız veya iptal edildi:", err);
    }
  } else {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Rapor bağlantısı panoya kopyalandı!");
    } catch (err) {
      alert("Bağlantı kopyalanamadı.");
    }
  }
}

function selectedSkillIds(container, selector) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(`${selector}:checked`)).map((input) => input.value);
}

function renderSkillSchools() {
  if (!els.skillSchoolTable) return;
  ensureSkillCollections();
  els.skillSchoolTable.innerHTML = skillState.schoolRecords.map((school, index) => {
    const typeLabel = school.schoolType === "lise" ? "MTAL" : "MESEM";
    const startDateText = school.summerStartDate ? formatSkillDate(school.summerStartDate) : "-";
    const endDateText = school.summerEndDate ? formatSkillDate(school.summerEndDate) : "-";
    return `
      <tr data-skill-edit-school="${school.id}">
        <td><input type="checkbox" value="${school.id}" data-skill-select-school /></td>
        <td>${index + 1}</td>
        <td>${escapeHtml(school.name || "Okul adı yok")}</td>
        <td>${escapeHtml(school.city || "-")}</td>
        <td>${typeLabel}</td>
        <td>${startDateText}</td>
        <td>${endDateText}</td>
        <td>${escapeHtml(school.principal || "-")}</td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="8">Okul kaydı yok.</td></tr>`;
}

function renderSkillTeachers() {
  if (!els.skillTeacherTable) return;
  ensureSkillCollections();
  els.skillTeacherTable.innerHTML = skillState.teacherPool.map((teacher, index) => `
    <tr data-skill-edit-teacher="${teacher.id}">
      <td><input type="checkbox" value="${teacher.id}" data-skill-select-teacher /></td>
      <td>${index + 1}</td>
      <td>${escapeHtml(teacher.name || "Öğretmen adı yok")}</td>
    </tr>
  `).join("") || `<tr><td colspan="3">Koordinatör öğretmen kaydı yok.</td></tr>`;
}

function renderSkillFields() {
  if (!els.skillFieldTable) return;
  ensureSkillCollections();
  els.skillFieldTable.innerHTML = skillState.fields.map((field, index) => `
    <tr data-skill-edit-field="${field.id}">
      <td><input type="checkbox" value="${field.id}" data-skill-select-field /></td>
      <td>${index + 1}</td>
      <td>${escapeHtml(field.area || "Belirtilmedi")}</td>
      <td>${escapeHtml(field.branch || "Belirtilmedi")}</td>
    </tr>
  `).join("") || `<tr><td colspan="4">Alan / dal kaydı yok.</td></tr>`;
}

function clearSkillSchoolForm() {
  if (!els.skillSchoolId) return;
  els.skillSchoolId.value = "";
  els.skillSchoolName.value = "";
  els.skillSchoolCity.value = "";
  els.skillSchoolPrincipal.value = "";
  els.skillSchoolDeputy.value = "";
  if (els.skillSchoolType) els.skillSchoolType.value = "mesem";
  if (els.skillSchoolSummerStart) els.skillSchoolSummerStart.value = "";
  if (els.skillSchoolSummerEnd) els.skillSchoolSummerEnd.value = "";
}

function clearSkillTeacherForm() {
  if (!els.skillTeacherId) return;
  els.skillTeacherId.value = "";
  els.skillTeacherName.value = "";
}

function clearSkillFieldForm() {
  if (!els.skillFieldId) return;
  els.skillFieldId.value = "";
  els.skillFieldArea.value = "";
  els.skillFieldBranch.value = "";
}

function saveSkillSchool() {
  ensureSkillCollections();
  const name = els.skillSchoolName.value.trim();
  if (!name) return showToast("Okul adı girin.");
  const id = els.skillSchoolId.value || uid("school");
  const nextSchool = {
    id,
    name,
    city: els.skillSchoolCity.value.trim(),
    principal: els.skillSchoolPrincipal.value.trim(),
    deputy: els.skillSchoolDeputy.value.trim(),
    schoolType: els.skillSchoolType ? els.skillSchoolType.value : "mesem",
    summerStartDate: els.skillSchoolSummerStart ? els.skillSchoolSummerStart.value : "",
    summerEndDate: els.skillSchoolSummerEnd ? els.skillSchoolSummerEnd.value : ""
  };
  const index = skillState.schoolRecords.findIndex((school) => school.id === id);
  if (index >= 0) skillState.schoolRecords[index] = nextSchool;
  else skillState.schoolRecords.push(nextSchool);
  skillState.school.name = name;
  saveSkillState();
  clearSkillSchoolForm();
  renderSkillModule();
  showToast("Okul kaydedildi.");
}

function saveSkillTeacher() {
  ensureSkillCollections();
  const name = els.skillTeacherName.value.trim();
  if (!name) return showToast("Koordinatör öğretmen adı girin.");
  const id = els.skillTeacherId.value || uid("teacher");
  const previousTeacher = skillState.teacherPool.find((teacher) => teacher.id === id);
  const nextTeacher = { id, name };
  const index = skillState.teacherPool.findIndex((teacher) => teacher.id === id);
  if (index >= 0) skillState.teacherPool[index] = nextTeacher;
  else skillState.teacherPool.push(nextTeacher);
  if (previousTeacher?.name && previousTeacher.name !== name) {
    skillState.coordinators = skillState.coordinators.map((coordinator) => (
      coordinator.teacher === previousTeacher.name ? { ...coordinator, teacher: name } : coordinator
    ));
  }
  saveSkillState();
  clearSkillTeacherForm();
  renderSkillModule();
  showToast("Koordinatör öğretmen kaydedildi.");
}

function saveSkillField() {
  ensureSkillCollections();
  const area = els.skillFieldArea.value.trim();
  const branch = els.skillFieldBranch.value.trim();
  if (!area && !branch) return showToast("Alan veya dal bilgisi girin.");
  const id = els.skillFieldId.value || uid("field");
  const nextField = { id, area: area || "Belirtilmedi", branch: branch || "Belirtilmedi" };
  const index = skillState.fields.findIndex((field) => field.id === id);
  if (index >= 0) skillState.fields[index] = nextField;
  else skillState.fields.push(nextField);
  saveSkillState();
  clearSkillFieldForm();
  renderSkillModule();
  showToast("Alan / dal kaydedildi.");
}

function deleteSelectedSkillSchools() {
  const ids = selectedSkillIds(els.skillSchoolTable, "[data-skill-select-school]");
  if (!ids.length) return showToast("Silmek için okul seçin.");
  skillState.schoolRecords = skillState.schoolRecords.filter((school) => !ids.includes(school.id));
  skillState.coordinators = skillState.coordinators.filter((coordinator) => !ids.includes(coordinator.schoolId));
  if (!skillState.schoolRecords.length) skillState.school.name = "Okul bilgisi girilmedi";
  saveSkillState();
  clearSkillSchoolForm();
  renderSkillModule();
}

function deleteSelectedSkillTeachers() {
  const ids = selectedSkillIds(els.skillTeacherTable, "[data-skill-select-teacher]");
  if (!ids.length) return showToast("Silmek için öğretmen seçin.");
  const teacherNames = skillState.teacherPool.filter((teacher) => ids.includes(teacher.id)).map((teacher) => teacher.name);
  skillState.teacherPool = skillState.teacherPool.filter((teacher) => !ids.includes(teacher.id));
  skillState.coordinators = skillState.coordinators.filter((coordinator) => !teacherNames.includes(coordinator.teacher));
  saveSkillState();
  clearSkillTeacherForm();
  renderSkillModule();
}

function deleteSelectedSkillFields() {
  const ids = selectedSkillIds(els.skillFieldTable, "[data-skill-select-field]");
  if (!ids.length) return showToast("Silmek için alan / dal seçin.");
  skillState.fields = skillState.fields.filter((field) => !ids.includes(field.id));
  saveSkillState();
  clearSkillFieldForm();
  renderSkillModule();
}

function deleteAllSkillFields() {
  skillState.fields = [];
  saveSkillState();
  clearSkillFieldForm();
  renderSkillModule();
}

function handleSkillManagedTables(event) {
  const checkbox = event.target.closest("input[type='checkbox']");
  if (checkbox) return;
  const schoolRow = event.target.closest("[data-skill-edit-school]");
  if (schoolRow) {
    const school = skillState.schoolRecords.find((item) => item.id === schoolRow.dataset.skillEditSchool);
    if (!school) return;
    els.skillSchoolId.value = school.id;
    els.skillSchoolName.value = school.name || "";
    els.skillSchoolCity.value = school.city || "";
    els.skillSchoolPrincipal.value = school.principal || "";
    els.skillSchoolDeputy.value = school.deputy || "";
    if (els.skillSchoolType) els.skillSchoolType.value = school.schoolType || "mesem";
    if (els.skillSchoolSummerStart) els.skillSchoolSummerStart.value = school.summerStartDate || "";
    if (els.skillSchoolSummerEnd) els.skillSchoolSummerEnd.value = school.summerEndDate || "";
    return;
  }
  const teacherRow = event.target.closest("[data-skill-edit-teacher]");
  if (teacherRow) {
    const teacher = skillState.teacherPool.find((item) => item.id === teacherRow.dataset.skillEditTeacher);
    if (!teacher) return;
    els.skillTeacherId.value = teacher.id;
    els.skillTeacherName.value = teacher.name || "";
    return;
  }
  const fieldRow = event.target.closest("[data-skill-edit-field]");
  if (fieldRow) {
    const field = skillState.fields.find((item) => item.id === fieldRow.dataset.skillEditField);
    if (!field) return;
    els.skillFieldId.value = field.id;
    els.skillFieldArea.value = field.area || "";
    els.skillFieldBranch.value = field.branch || "";
  }
}

function renderSkillSelects() {
  ensureSkillCollections();
  const businessOptions = [
    `<option value="">İşletme seçiniz</option>`,
    ...skillState.businesses.map((business) => `<option value="${business.id}">${escapeHtml(business.name)}</option>`)
  ].join("");
  if (els.skillStudentBusiness) els.skillStudentBusiness.innerHTML = businessOptions;
  if (els.skillStudentBusinessFilter) {
    els.skillStudentBusinessFilter.innerHTML = [
      `<option value="">Tüm işletmeler</option>`,
      ...skillState.businesses.map((business) => `<option value="${business.id}">${escapeHtml(business.name)}</option>`)
    ].join("");
  }
  if (els.skillStudentClassFilter) {
    const currentClassFilter = els.skillStudentClassFilter.value || "";
    const classOptions = getSkillStudentClassOptions();
    els.skillStudentClassFilter.innerHTML = [
      `<option value="">Tüm şubeler</option>`,
      ...classOptions.map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)} (${item.count})</option>`)
    ].join("");
    els.skillStudentClassFilter.value = classOptions.some((item) => item.name === currentClassFilter) ? currentClassFilter : "";
  }
  if (els.skillStudentField) {
    els.skillStudentField.innerHTML = [
      `<option value="">Alan / dal seçiniz</option>`,
      ...skillState.fields.map((field) => {
        const label = getSkillFieldLabel(field);
        return `<option value="${escapeHtml(label)}">${escapeHtml(label)}</option>`;
      })
    ].join("");
  }
  if (els.skillCoordinatorBusiness) els.skillCoordinatorBusiness.innerHTML = businessOptions;
  const teacherOptions = [
    `<option value="">Öğretmen seçiniz</option>`,
    ...skillState.teacherPool.map((teacher) => `<option value="${escapeHtml(teacher.name)}">${escapeHtml(teacher.name)}</option>`)
  ].join("");
  if (els.skillCoordinatorTeacher) els.skillCoordinatorTeacher.innerHTML = teacherOptions;
  const schoolOptions = [
    `<option value="">Okul seçiniz</option>`,
    ...skillState.schoolRecords.map((school) => `<option value="${school.id}">${escapeHtml(school.name)}</option>`)
  ].join("");
  if (els.skillCoordinatorSchool) els.skillCoordinatorSchool.innerHTML = schoolOptions;
  const deputies = skillState.schoolRecords.map((school) => school.deputy).filter(Boolean);
  const deputyOptions = [`<option value="">Müdür yardımcısı seçiniz</option>`, ...[...new Set(deputies)].map((deputy) => `<option value="${escapeHtml(deputy)}">${escapeHtml(deputy)}</option>`)].join("");
  if (els.skillCoordinatorDeputy) els.skillCoordinatorDeputy.innerHTML = deputyOptions;
}

function renderSkillStudents() {
  if (!els.skillStudentTable) return;
  const query = (els.skillStudentSearch?.value || "").toLocaleLowerCase("tr-TR");
  const classFilter = normalizeSkillClass(els.skillStudentClassFilter?.value || "");
  const businessFilter = els.skillStudentBusinessFilter?.value || "";
  const statusFilter = els.skillStudentStatusFilter?.value || "";
  const rows = skillState.students.filter((student) => {
    const business = getSkillBusiness(student.businessId);
    const matchesSearch = [student.no, student.name, student.className, student.field, business?.name]
      .join(" ")
      .toLocaleLowerCase("tr-TR")
      .includes(query);
    const matchesClass = !classFilter || normalizeSkillClass(student.className) === classFilter;
    const matchesBusiness = !businessFilter || student.businessId === businessFilter;
    const matchesStatus = !statusFilter || (statusFilter === "active" ? student.active !== false : student.active === false);
    return matchesSearch && matchesClass && matchesBusiness && matchesStatus;
  });
  const studentRows = rows.length ? rows.map((student, index) => {
    const business = getSkillBusiness(student.businessId);
    return `
      <div class="skill-row skill-grid-row skill-student-grid-row" data-skill-edit-student="${student.id}">
        <span><input type="checkbox" value="${student.id}" data-skill-select-student /></span>
        <span>${index + 1}</span>
        <span><span class="skill-status-dot ${student.active === false ? "is-passive" : ""}" title="${student.active === false ? "Pasif" : "Aktif"}"></span></span>
        <span>${escapeHtml(student.no || "-")}</span>
        <strong>${escapeHtml(student.name)}</strong>
        <span>${escapeHtml(business?.name || "İşletme yok")}</span>
        <span>${escapeHtml(student.field || "Alan / dal yok")}</span>
        <span>${escapeHtml(student.className || "-")}</span>
        <span>${escapeHtml(student.days || "-")}</span>
      </div>
    `;
  }).join("") : `<div class="empty-state">Öğrenci kaydı bulunamadı.</div>`;
  els.skillStudentTable.innerHTML = `
    <div class="skill-grid-row skill-grid-head skill-student-grid-row">
      <span>Seç</span><span>No</span><span>Durum</span><span>Okul no</span><span>Ad soyad</span><span>İşletme</span><span>Alan / dal</span><span>Sınıf</span><span>Gün</span>
    </div>
    ${studentRows}
  `;
  updateSkillStudentActionState();
}

function renderSkillBusinesses() {
  if (!els.skillBusinessTable) return;
  const businessRows = skillState.businesses.length ? skillState.businesses.map((business, index) => `
    <div class="skill-row skill-grid-row" data-skill-edit-business="${business.id}">
      <span><input type="checkbox" value="${business.id}" data-skill-select-business /></span>
      <span>${index + 1}</span>
      <strong>${escapeHtml(business.name)}</strong>
      <span>${escapeHtml(business.phone || "-")}</span>
      <span>${business.group === "2" ? "20 ve üzeri" : "20'den az"}</span>
      <small>${escapeHtml(business.address || "Adres belirtilmedi")}</small>
    </div>
  `).join("") : `<div class="empty-state">İşletme kaydı bulunamadı.</div>`;
  els.skillBusinessTable.innerHTML = `
    <div class="skill-grid-row skill-grid-head">
      <span>Seç</span><span>No</span><span>İşletme Adı</span><span>Telefon</span><span>Çalışan</span><span>Adres</span>
    </div>
    ${businessRows}
  `;
  return;
  els.skillBusinessTable.innerHTML = skillState.businesses.length ? skillState.businesses.map((business) => {
    const studentCount = skillState.students.filter((student) => student.businessId === business.id).length;
    return `
      <div class="skill-row">
        <div>
          <strong>${escapeHtml(business.name)}</strong>
          <small>${escapeHtml(business.phone || "Telefon yok")} · ${business.group === "2" ? "20 ve üzeri çalışan" : "20'den az çalışan"} · ${studentCount} öğrenci</small>
          <small>${escapeHtml(business.address || "Adres belirtilmedi")}</small>
        </div>
        <div class="skill-row-actions">
          <button class="edit" type="button" data-skill-edit-business="${business.id}">Düzenle</button>
          <button class="delete" type="button" data-skill-delete-business="${business.id}">Sil</button>
        </div>
      </div>
    `;
  }).join("") : `<div class="empty-state">İşletme kaydı bulunamadı.</div>`;
}

function renderSkillCoordinators() {
  if (!els.skillCoordinatorTable) return;
  ensureSkillCollections();
  const coordinatorRows = skillState.coordinators.length ? skillState.coordinators.map((coordinator, index) => {
    const business = getSkillBusiness(coordinator.businessId);
    const school = skillState.schoolRecords.find((item) => item.id === coordinator.schoolId) || skillState.schoolRecords[0];
    return `
      <div class="skill-row skill-grid-row coordinator-grid-row" data-skill-edit-coordinator="${coordinator.id}">
        <span><input type="checkbox" value="${coordinator.id}" data-skill-select-coordinator /></span>
        <span>${index + 1}</span>
        <span>${escapeHtml(school?.name || "Okul yok")}</span>
        <strong>${escapeHtml(business?.name || "İşletme yok")}</strong>
        <span>${escapeHtml(coordinator.teacher || "-")}</span>
        <span>${escapeHtml(coordinator.deputy || "-")}</span>
        <span>${getSkillDayName(coordinator.day)}</span>
      </div>
    `;
  }).join("") : `<div class="empty-state">Koordinatör görevi bulunamadı.</div>`;
  els.skillCoordinatorTable.innerHTML = `
    <div class="skill-grid-row coordinator-grid-row skill-grid-head">
      <span>Seç</span><span>No</span><span>Okul</span><span>İşletme</span><span>Öğretmen</span><span>Müdür Yrd.</span><span>Gün</span>
    </div>
    ${coordinatorRows}
  `;
  return;
  els.skillCoordinatorTable.innerHTML = skillState.coordinators.length ? skillState.coordinators.map((coordinator) => {
    const business = getSkillBusiness(coordinator.businessId);
    return `
      <div class="skill-row">
        <div>
          <strong>${escapeHtml(coordinator.teacher)}</strong>
          <small>${escapeHtml(business?.name || "İşletme yok")} · ${getSkillDayName(coordinator.day)}</small>
        </div>
        <div class="skill-row-actions">
          <button class="delete" type="button" data-skill-delete-coordinator="${coordinator.id}">Sil</button>
        </div>
      </div>
    `;
  }).join("") : `<div class="empty-state">Koordinatör görevi bulunamadı.</div>`;
}

function clearSkillStudentForm() {
  els.skillStudentId.value = "";
  els.skillStudentNo.value = "";
  els.skillStudentName.value = "";
  els.skillStudentClass.value = "";
  els.skillStudentField.value = "";
  els.skillStudentBusiness.value = "";
  setSkillStudentDays("");
}

function clearSkillBusinessForm() {
  els.skillBusinessId.value = "";
  els.skillBusinessName.value = "";
  els.skillBusinessPhone.value = "";
  els.skillBusinessGroup.value = "1";
  els.skillBusinessAddress.value = "";
}

function saveSkillStudent(event) {
  event.preventDefault();
  const id = els.skillStudentId.value || uid("stu");
  const nextStudent = {
    id,
    no: els.skillStudentNo.value.trim(),
    name: els.skillStudentName.value.trim(),
    className: els.skillStudentClass.value.trim(),
    field: els.skillStudentField.value.trim(),
    active: skillState.students.find((student) => student.id === id)?.active !== false,
    businessId: els.skillStudentBusiness.value,
    days: els.skillStudentDays.value.trim()
  };
  if (!nextStudent.name) {
    showToast("Öğrenci adı boş bırakılamaz.", "warning");
    return;
  }
  const index = skillState.students.findIndex((student) => student.id === id);
  if (index >= 0) skillState.students[index] = nextStudent;
  else skillState.students.push(nextStudent);
  saveSkillState();
  clearSkillStudentForm();
  renderSkillModule();
  showToast("Öğrenci kaydı güncellendi.");
}

function saveSkillBusiness(event) {
  event.preventDefault();
  const id = els.skillBusinessId.value || uid("biz");
  const nextBusiness = {
    id,
    name: els.skillBusinessName.value.trim(),
    phone: els.skillBusinessPhone.value.trim(),
    group: els.skillBusinessGroup.value,
    address: els.skillBusinessAddress.value.trim()
  };
  if (!nextBusiness.name) {
    showToast("İşletme adı boş bırakılamaz.", "warning");
    return;
  }
  const index = skillState.businesses.findIndex((business) => business.id === id);
  if (index >= 0) skillState.businesses[index] = nextBusiness;
  else skillState.businesses.push(nextBusiness);
  saveSkillState();
  clearSkillBusinessForm();
  renderSkillModule();
  showToast("İşletme kaydı güncellendi.");
}

function saveSkillCoordinator(event) {
  event.preventDefault();
  const nextTeacher = els.skillCoordinatorTeacher.value.trim();
  const nextBusinessId = els.skillCoordinatorBusiness.value;
  if (!nextTeacher || !nextBusinessId) {
    showToast("Öğretmen ve işletme seçimi gerekli.", "warning");
    return;
  }
  const nextId = els.skillCoordinatorId?.value || uid("coord");
  const nextCoordinator = {
    id: nextId,
    schoolId: els.skillCoordinatorSchool?.value || skillState.schoolRecords?.[0]?.id || "",
    teacher: nextTeacher,
    businessId: nextBusinessId,
    deputy: els.skillCoordinatorDeputy?.value || "",
    day: els.skillCoordinatorDay.value
  };
  const nextIndex = skillState.coordinators.findIndex((coordinator) => coordinator.id === nextId);
  if (nextIndex >= 0) skillState.coordinators[nextIndex] = nextCoordinator;
  else skillState.coordinators.push(nextCoordinator);
  clearSkillCoordinatorForm();
  saveSkillState();
  renderSkillModule();
  showToast("Koordinatör görevi kaydedildi.");
  return;
  const teacher = els.skillCoordinatorTeacher.value.trim();
  const businessId = els.skillCoordinatorBusiness.value;
  if (!teacher || !businessId) {
    showToast("Öğretmen ve işletme seçimi gerekli.", "warning");
    return;
  }
  skillState.coordinators.push({
    id: uid("coord"),
    teacher,
    businessId,
    day: els.skillCoordinatorDay.value
  });
  els.skillCoordinatorTeacher.value = "";
  els.skillCoordinatorBusiness.value = "";
  els.skillCoordinatorDay.value = "";
  saveSkillState();
  renderSkillModule();
  showToast("Koordinatör görevi eklendi.");
}

function clearSkillCoordinatorForm() {
  if (els.skillCoordinatorId) els.skillCoordinatorId.value = "";
  if (els.skillCoordinatorSchool) els.skillCoordinatorSchool.value = "";
  if (els.skillCoordinatorTeacher) els.skillCoordinatorTeacher.value = "";
  if (els.skillCoordinatorDeputy) els.skillCoordinatorDeputy.value = "";
  if (els.skillCoordinatorBusiness) els.skillCoordinatorBusiness.value = "";
  if (els.skillCoordinatorDay) els.skillCoordinatorDay.value = "";
}

function deleteSelectedSkillBusinesses() {
  const ids = selectedSkillIds(els.skillBusinessTable, "[data-skill-select-business]");
  if (!ids.length) return showToast("Silmek icin isletme secin.");
  const hasStudents = skillState.students.some((student) => ids.includes(student.businessId));
  if (hasStudents) return showToast("Secili isletmeye bagli ogrenci var. Once ogrencileri tasiyin.", "warning");
  skillState.businesses = skillState.businesses.filter((business) => !ids.includes(business.id));
  skillState.coordinators = skillState.coordinators.filter((coordinator) => !ids.includes(coordinator.businessId));
  saveSkillState();
  clearSkillBusinessForm();
  renderSkillModule();
}

function deleteAllSkillBusinesses() {
  if (skillState.students.some((student) => student.businessId)) {
    showToast("Ogrenci bagli isletmeler toplu silinemez.", "warning");
    return;
  }
  skillState.businesses = [];
  skillState.coordinators = [];
  saveSkillState();
  clearSkillBusinessForm();
  renderSkillModule();
}

function deleteSelectedSkillStudents() {
  const ids = selectedSkillIds(els.skillStudentTable, "[data-skill-select-student]");
  if (!ids.length) return showToast("Silmek için öğrenci seçin.", "warning");
  skillState.students = skillState.students.filter((student) => !ids.includes(student.id));
  saveSkillState();
  clearSkillStudentForm();
  renderSkillModule();
  showToast("Seçili öğrenci kayıtları silindi.");
}

function deleteAllSkillStudents() {
  skillState.students = [];
  saveSkillState();
  clearSkillStudentForm();
  renderSkillModule();
  showToast("Tüm öğrenci kayıtları silindi.");
}

function getStudentStatusTargetIds() {
  const ids = selectedSkillIds(els.skillStudentTable, "[data-skill-select-student]");
  if (ids.length) return ids;
  return els.skillStudentId?.value ? [els.skillStudentId.value] : [];
}

function updateSkillStudentActionState() {
  if (!els.skillActivateStudentBtn) return;
  const ids = selectedSkillIds(els.skillStudentTable, "[data-skill-select-student]");
  const hasPassive = ids.some((id) => skillState.students.find((student) => student.id === id)?.active === false);
  els.skillActivateStudentBtn.disabled = !hasPassive;
  els.skillActivateStudentBtn.classList.toggle("is-disabled", !hasPassive);
}

function setPendingStatusStudents(ids = []) {
  pendingStudentStatusIds = ids;
  if (els.skillStatusStudentSelect) els.skillStatusStudentSelect.value = ids[0] || "";
}

function renderSkillStatusStudentSelect(selectedId = "") {
  if (!els.skillStatusStudentSelect) return;
  els.skillStatusStudentSelect.innerHTML = [
    `<option value="">Öğrenci seçiniz</option>`,
    ...skillState.students.map((student) => {
      const business = getSkillBusiness(student.businessId);
      const parts = [
        student.no || "-",
        student.name || "Adsız öğrenci",
        student.className || "Şube yok",
        business?.name || "İşletme yok"
      ];
      return `<option value="${escapeHtml(student.id)}">${escapeHtml(parts.join(" · "))}</option>`;
    })
  ].join("");
  els.skillStatusStudentSelect.value = skillState.students.some((student) => student.id === selectedId) ? selectedId : "";
}

function updatePendingStatusStudentFromSelect() {
  const studentId = els.skillStatusStudentSelect?.value || "";
  setPendingStatusStudents(studentId ? [studentId] : []);
}

function getSkillStatusStudentSearchResults() {
  const query = (els.skillStatusStudentSearch?.value || "").trim().toLocaleLowerCase("tr-TR");
  if (!query) return [];
  return skillState.students.filter((student) => {
    const business = getSkillBusiness(student.businessId);
    return [student.no, student.name, student.className, student.field, business?.name]
      .join(" ")
      .toLocaleLowerCase("tr-TR")
      .includes(query);
  });
}

function renderSkillStatusStudentResults() {
  if (!els.skillStatusStudentResults) return;
  const rows = getSkillStatusStudentSearchResults();
  const query = (els.skillStatusStudentSearch?.value || "").trim();
  if (!query) {
    els.skillStatusStudentResults.innerHTML = "";
    els.skillStatusStudentResults.hidden = true;
    return;
  }
  els.skillStatusStudentResults.hidden = false;
  els.skillStatusStudentResults.innerHTML = rows.length ? rows.slice(0, 8).map((student) => {
    const business = getSkillBusiness(student.businessId);
    return `
      <button type="button" data-skill-status-search-student="${student.id}">
        <strong>${escapeHtml(student.name || "Adsız öğrenci")}</strong>
        <small>${escapeHtml(student.no || "-")} · ${escapeHtml(student.className || "Şube yok")} · ${escapeHtml(business?.name || "İşletme yok")}</small>
      </button>
    `;
  }).join("") : `<div class="skill-status-search-empty">Eşleşen öğrenci yok</div>`;
}

function selectSkillStatusStudent(studentId) {
  setPendingStatusStudents(studentId ? [studentId] : []);
  if (els.skillStatusStudentSearch) els.skillStatusStudentSearch.value = "";
  if (els.skillStatusStudentResults) {
    els.skillStatusStudentResults.innerHTML = "";
    els.skillStatusStudentResults.hidden = true;
  }
}

function openSkillStudentStatusDialog(active = false) {
  const ids = getStudentStatusTargetIds();
  const selectedId = ids[0] || "";
  if (els.skillStatusStudentSearch) els.skillStatusStudentSearch.value = "";
  if (els.skillStatusStudentResults) els.skillStatusStudentResults.hidden = true;
  renderSkillStatusStudentSelect(selectedId);
  setPendingStatusStudents(selectedId ? [selectedId] : []);
  if (els.skillStatusDate) els.skillStatusDate.value = new Date().toISOString().slice(0, 10);
  if (els.skillStatusValue) els.skillStatusValue.value = active ? "active" : "passive";
  if (els.skillStatusReason) els.skillStatusReason.value = "";
  if (els.skillStatusNote) els.skillStatusNote.value = "";
  els.skillStudentStatusDialog?.showModal();
}

function closeSkillStudentStatusDialog() {
  pendingStudentStatusIds = [];
  if (els.skillStatusStudentSearch) els.skillStatusStudentSearch.value = "";
  if (els.skillStatusStudentResults) {
    els.skillStatusStudentResults.innerHTML = "";
    els.skillStatusStudentResults.hidden = true;
  }
  if (els.skillStatusStudentSelect) els.skillStatusStudentSelect.value = "";
  if (els.skillStudentStatusDialog?.open) els.skillStudentStatusDialog.close();
}

function saveSkillStudentStatus(event) {
  event.preventDefault();
  if (!pendingStudentStatusIds.length) {
    showToast("Durum işlemi için öğrenci seçin.", "warning");
    return;
  }
  const active = els.skillStatusValue?.value === "active";
  const statusRecord = {
    active,
    date: els.skillStatusDate?.value || new Date().toISOString().slice(0, 10),
    reason: els.skillStatusReason?.value || "",
    note: els.skillStatusNote?.value || "",
    updatedAt: new Date().toISOString()
  };
  skillState.students = skillState.students.map((student) => (
    pendingStudentStatusIds.includes(student.id)
      ? { ...student, active, statusRecord, statusHistory: [...(student.statusHistory || []), statusRecord] }
      : student
  ));
  saveSkillState();
  closeSkillStudentStatusDialog();
  renderSkillModule();
  showToast("Öğrenci durumu güncellendi.");
}

function setSelectedSkillStudentStatus(active) {
  openSkillStudentStatusDialog(active);
}

function toggleSelectedSkillStudentStatus() {
  openSkillStudentStatusDialog(false);
}

function deleteSelectedSkillCoordinators() {
  const ids = selectedSkillIds(els.skillCoordinatorTable, "[data-skill-select-coordinator]");
  if (!ids.length) return showToast("Silmek için koordinatör görevi seçin.");
  skillState.coordinators = skillState.coordinators.filter((coordinator) => !ids.includes(coordinator.id));
  saveSkillState();
  clearSkillCoordinatorForm();
  renderSkillModule();
}

function deleteAllSkillCoordinators() {
  skillState.coordinators = [];
  saveSkillState();
  clearSkillCoordinatorForm();
  renderSkillModule();
}

function handleSkillTableClick(event) {
  if (event.target.closest("input[type='checkbox']")) return;
  const studentRow = event.target.closest("[data-skill-edit-student]");
  const businessRow = event.target.closest("[data-skill-edit-business]");
  const coordinatorRow = event.target.closest("[data-skill-edit-coordinator]");
  const editStudentId = event.target.dataset.skillEditStudent || studentRow?.dataset.skillEditStudent;
  const deleteStudentId = event.target.dataset.skillDeleteStudent;
  const editBusinessId = event.target.dataset.skillEditBusiness || businessRow?.dataset.skillEditBusiness;
  const deleteBusinessId = event.target.dataset.skillDeleteBusiness;
  const editCoordinatorId = event.target.dataset.skillEditCoordinator || coordinatorRow?.dataset.skillEditCoordinator;
  const deleteCoordinatorId = event.target.dataset.skillDeleteCoordinator;

  if (editStudentId) {
    const student = skillState.students.find((item) => item.id === editStudentId);
    if (!student) return;
    setSkillView("students");
    els.skillStudentId.value = student.id;
    els.skillStudentNo.value = student.no || "";
    els.skillStudentName.value = student.name || "";
    els.skillStudentClass.value = student.className || "";
    els.skillStudentField.value = student.field || "";
    els.skillStudentBusiness.value = student.businessId || "";
    setSkillStudentDays(student.days || "");
    return;
  }

  if (editBusinessId) {
    const business = skillState.businesses.find((item) => item.id === editBusinessId);
    if (!business) return;
    setSkillView("businesses");
    els.skillBusinessId.value = business.id;
    els.skillBusinessName.value = business.name || "";
    els.skillBusinessPhone.value = business.phone || "";
    els.skillBusinessGroup.value = business.group || "1";
    els.skillBusinessAddress.value = business.address || "";
    return;
  }

  if (editCoordinatorId) {
    const coordinator = skillState.coordinators.find((item) => item.id === editCoordinatorId);
    if (!coordinator) return;
    setSkillView("coordinators");
    if (els.skillCoordinatorId) els.skillCoordinatorId.value = coordinator.id;
    if (els.skillCoordinatorSchool) els.skillCoordinatorSchool.value = coordinator.schoolId || "";
    els.skillCoordinatorTeacher.value = coordinator.teacher || "";
    if (els.skillCoordinatorDeputy) els.skillCoordinatorDeputy.value = coordinator.deputy || "";
    els.skillCoordinatorBusiness.value = coordinator.businessId || "";
    els.skillCoordinatorDay.value = coordinator.day || "";
    return;
  }

  if (deleteStudentId) {
    skillState.students = skillState.students.filter((student) => student.id !== deleteStudentId);
    saveSkillState();
    renderSkillModule();
    showToast("Öğrenci silindi.");
    return;
  }

  if (deleteBusinessId) {
    const hasStudents = skillState.students.some((student) => student.businessId === deleteBusinessId);
    if (hasStudents) {
      showToast("Bu işletmeye bağlı öğrenci var. Önce öğrencileri başka işletmeye taşıyın.", "warning");
      return;
    }
    skillState.businesses = skillState.businesses.filter((business) => business.id !== deleteBusinessId);
    skillState.coordinators = skillState.coordinators.filter((coordinator) => coordinator.businessId !== deleteBusinessId);
    saveSkillState();
    renderSkillModule();
    showToast("İşletme silindi.");
    return;
  }

  if (deleteCoordinatorId) {
    skillState.coordinators = skillState.coordinators.filter((coordinator) => coordinator.id !== deleteCoordinatorId);
    saveSkillState();
    renderSkillModule();
    showToast("Koordinatör görevi silindi.");
  }
}

function fillSkillStudentForm(studentId) {
  const student = skillState.students.find((item) => item.id === studentId);
  if (!student) return false;
  setSkillView("students");
  els.skillStudentId.value = student.id;
  els.skillStudentNo.value = student.no || "";
  els.skillStudentName.value = student.name || "";
  els.skillStudentClass.value = student.className || "";
  els.skillStudentField.value = student.field || "";
  els.skillStudentBusiness.value = student.businessId || "";
  setSkillStudentDays(student.days || "");
  return true;
}

function fillSkillBusinessForm(businessId) {
  const business = skillState.businesses.find((item) => item.id === businessId);
  if (!business) return false;
  setSkillView("businesses");
  els.skillBusinessId.value = business.id;
  els.skillBusinessName.value = business.name || "";
  els.skillBusinessPhone.value = business.phone || "";
  els.skillBusinessGroup.value = business.group || "1";
  els.skillBusinessAddress.value = business.address || "";
  return true;
}

function fillSkillCoordinatorForm(coordinatorId) {
  const coordinator = skillState.coordinators.find((item) => item.id === coordinatorId);
  if (!coordinator) return false;
  setSkillView("coordinators");
  if (els.skillCoordinatorId) els.skillCoordinatorId.value = coordinator.id;
  if (els.skillCoordinatorSchool) els.skillCoordinatorSchool.value = coordinator.schoolId || "";
  if (els.skillCoordinatorTeacher) els.skillCoordinatorTeacher.value = coordinator.teacher || "";
  if (els.skillCoordinatorDeputy) els.skillCoordinatorDeputy.value = coordinator.deputy || "";
  if (els.skillCoordinatorBusiness) els.skillCoordinatorBusiness.value = coordinator.businessId || "";
  if (els.skillCoordinatorDay) els.skillCoordinatorDay.value = coordinator.day || "";
  return true;
}

function fillSkillSchoolForm(schoolId) {
  const school = skillState.schoolRecords.find((item) => item.id === schoolId);
  if (!school) return false;
  setSkillView("school");
  if (els.skillSchoolId) els.skillSchoolId.value = school.id;
  if (els.skillSchoolName) els.skillSchoolName.value = school.name || "";
  if (els.skillSchoolCity) els.skillSchoolCity.value = school.city || "";
  if (els.skillSchoolPrincipal) els.skillSchoolPrincipal.value = school.principal || "";
  if (els.skillSchoolDeputy) els.skillSchoolDeputy.value = school.deputy || "";
  if (els.skillSchoolType) els.skillSchoolType.value = school.schoolType || "mesem";
  if (els.skillSchoolSummerStart) els.skillSchoolSummerStart.value = school.summerStartDate || "";
  if (els.skillSchoolSummerEnd) els.skillSchoolSummerEnd.value = school.summerEndDate || "";
  return true;
}

function fillSkillTeacherForm(teacherId) {
  const teacher = skillState.teacherPool.find((item) => item.id === teacherId);
  if (!teacher) return false;
  setSkillView("school");
  if (els.skillTeacherId) els.skillTeacherId.value = teacher.id;
  if (els.skillTeacherName) els.skillTeacherName.value = teacher.name || "";
  return true;
}

function fillSkillFieldForm(fieldId) {
  const field = skillState.fields.find((item) => item.id === fieldId);
  if (!field) return false;
  setSkillView("fields");
  if (els.skillFieldId) els.skillFieldId.value = field.id;
  if (els.skillFieldArea) els.skillFieldArea.value = field.area || "";
  if (els.skillFieldBranch) els.skillFieldBranch.value = field.branch || "";
  return true;
}

function getSkillGlobalSearchItems() {
  ensureSkillCollections();
  const items = [];
  skillState.students.forEach((student) => {
    const business = getSkillBusiness(student.businessId);
    items.push({
      type: "student",
      id: student.id,
      badge: "Öğrenci",
      title: `${student.no || "-"} - ${student.name || "Öğrenci"}`,
      detail: `${student.className || "Sınıf yok"} · ${business?.name || "İşletme yok"} · ${student.field || "Alan / dal yok"}`,
      search: [student.no, student.name, student.className, student.field, student.days, business?.name].join(" ")
    });
  });
  skillState.businesses.forEach((business) => {
    const students = skillState.students.filter((student) => student.businessId === business.id);
    const coordinator = skillState.coordinators.find((item) => item.businessId === business.id);
    items.push({
      type: "business",
      id: business.id,
      badge: "İşletme",
      title: business.name || "İşletme",
      detail: `${students.length} öğrenci · Koordinatör: ${coordinator?.teacher || "Atanmadı"} · ${business.address || "Adres yok"}`,
      search: [business.name, business.phone, business.address, coordinator?.teacher, ...students.map((student) => student.name)].join(" ")
    });
  });
  skillState.coordinators.forEach((coordinator) => {
    const business = getSkillBusiness(coordinator.businessId);
    const school = skillState.schoolRecords.find((item) => item.id === coordinator.schoolId) || skillState.schoolRecords[0];
    items.push({
      type: "coordinator",
      id: coordinator.id,
      badge: "Koordinatör",
      title: coordinator.teacher || "Koordinatör",
      detail: `${business?.name || "İşletme yok"} · ${getSkillDayName(coordinator.day)} · ${school?.name || "Okul yok"}`,
      search: [coordinator.teacher, coordinator.deputy, business?.name, school?.name, getSkillDayName(coordinator.day)].join(" ")
    });
  });
  skillState.schoolRecords.forEach((school) => {
    items.push({
      type: "school",
      id: school.id,
      badge: "Okul",
      title: school.name || "Okul",
      detail: `${school.city || "İl yok"} · Müdür: ${school.principal || "-"} · Müdür yrd.: ${school.deputy || "-"}`,
      search: [school.name, school.city, school.principal, school.deputy].join(" ")
    });
  });
  skillState.teacherPool.forEach((teacher) => {
    items.push({
      type: "teacher",
      id: teacher.id,
      badge: "Öğretmen",
      title: teacher.name || "Öğretmen",
      detail: "Koordinatör öğretmen kaydı",
      search: teacher.name || ""
    });
  });
  skillState.fields.forEach((field) => {
    const label = getSkillFieldLabel(field);
    items.push({
      type: "field",
      id: field.id,
      badge: "Alan / Dal",
      title: label,
      detail: `${field.area || "-"} · ${field.branch || "-"}`,
      search: [field.area, field.branch, label].join(" ")
    });
  });
  return items;
}

function renderSkillGlobalSearchResults() {
  if (!els.skillGlobalSearchInput || !els.skillGlobalSearchResults) return;
  const query = normalizeText(els.skillGlobalSearchInput.value);
  if (!query) {
    closeSkillGlobalSearchResults();
    return;
  }
  const words = query.split(/\s+/).filter(Boolean);
  const results = getSkillGlobalSearchItems()
    .map((item) => ({
      ...item,
      haystack: normalizeText([item.title, item.detail, item.search].join(" "))
    }))
    .filter((item) => words.every((word) => item.haystack.includes(word)))
    .slice(0, 12);
  els.skillGlobalSearchResults.hidden = false;
  els.skillGlobalSearchResults.innerHTML = results.length ? results.map((item) => `
    <button type="button" data-skill-global-type="${escapeHtml(item.type)}" data-skill-global-id="${escapeHtml(item.id)}">
      <em>${escapeHtml(item.badge)}</em>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </button>
  `).join("") : `<div class="skill-search-empty">Eşleşen kayıt bulunamadı.</div>`;
}

function closeSkillGlobalSearchResults() {
  if (!els.skillGlobalSearchResults) return;
  els.skillGlobalSearchResults.hidden = true;
  els.skillGlobalSearchResults.innerHTML = "";
}

function clearSkillGlobalSearch() {
  if (els.skillGlobalSearchInput) els.skillGlobalSearchInput.value = "";
  closeSkillGlobalSearchResults();
}

function openSkillGlobalSearchItem(type, id) {
  const handlers = {
    student: fillSkillStudentForm,
    business: fillSkillBusinessForm,
    coordinator: fillSkillCoordinatorForm,
    school: fillSkillSchoolForm,
    teacher: fillSkillTeacherForm,
    field: fillSkillFieldForm,
    course: (courseId) => {
      state.selectedCourseId = courseId;
      openModule("sorubank");
      render();
      return true;
    },
    question: (questionId) => {
      const question = state.questions.find((item) => item.id === questionId);
      if (!question) return false;
      state.selectedCourseId = question.courseId;
      openModule("sorubank");
      setView("bank");
      if (els.searchInput) els.searchInput.value = question.topic || stripHtml(question.content || "").slice(0, 40);
      render();
      return true;
    }
  };
  const opened = handlers[type]?.(id);
  if (opened) clearSkillGlobalSearch();
}

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
  toast.className = `toast${type === "error" ? " is-error" : ""}${type === "warning" ? " is-warning" : ""}`;
  const fallbackTitle = type === "error" ? "İşlem tamamlanamadı" : type === "warning" ? "Dikkat" : "Bilgi";
  toast.innerHTML = `<strong>${escapeHtml(title || fallbackTitle)}</strong><span>${escapeHtml(message)}</span>`;
  els.toastStack.append(toast);
  window.setTimeout(() => toast.remove(), type === "error" ? 7000 : 4200);
}

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

function applyResizableWidth(value) {
  if (!selectedResizableElement) return;
  const width = Math.max(10, Math.min(100, Number(value) || 100));
  selectedResizableElement.style.width = `${width}%`;
  selectedResizableElement.style.maxWidth = "100%";
  if (selectedResizableElement.tagName === "IMG") {
    selectedResizableElement.style.height = "auto";
  }
  const rangeInput = ensureResizePanel().querySelector("#resizeRange");
  if (rangeInput) rangeInput.value = width;
  positionResizePanel();
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

function examTitle() {
  return `${state.examMeta.term}. Dönem ${state.examMeta.examNumber}. Yazılı`;
}

function classGradeText() {
  const grade = String(state.examMeta.className || "").match(/\d+/)?.[0] || String(currentCourse().grade || "").match(/\d+/)?.[0] || "";
  return grade ? `${grade}. SINIFLAR` : "SINIFLAR";
}

function printHeaderTitle(mode) {
  const courseName = currentCourse().name.toLocaleUpperCase("tr-TR");
  const suffix = mode === "answer" ? "CEVAP ANAHTARI" : "SINAVI SORULARI";
  return `${classGradeText()} "${courseName}" DERSİ\n${state.examMeta.term}. DÖNEM ${state.examMeta.examNumber}. YAZILI ${suffix}`;
}

function questionNumberHtml(index, points = null) {
  const pointsText = points !== null && points !== undefined && points !== "" ? ` ${questionPointsHtml(points)}` : "";
  return `<span class="print-question-no" style="font-weight:bold; margin-right:8px; display:inline;">Soru-${index + 1})${pointsText}&nbsp;&nbsp;</span>`;
}

function questionPointsHtml(points) {
  return `<span class="print-question-points" style="font-weight:bold; white-space:nowrap;">(${points}P)</span>`;
}

function answerHeadingHtml(index, points) {
  return `<div class="print-answer-heading"><span>Cevap-${index + 1})</span> ${questionPointsHtml(points)}</div>`;
}

function answerQuestionLineHtml(question, index) {
  return `
    <div class="print-answer-question-line">
      ${questionNumberHtml(index, question.points)}
      <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(question, "answer")}</div>
    </div>
  `;
}

function answerItemHtml(question, index, { includeQuestion = false } = {}) {
  if (includeQuestion) {
    return `
      ${answerQuestionLineHtml(question, index)}
      <div class="print-answer-label">Cevap:</div>
      <div class="print-answer">${answerKeyHtml(question)}</div>
    `;
  }
  return `
    ${answerHeadingHtml(index, question.points)}
    <div class="print-answer">${answerKeyHtml(question)}</div>
  `;
}

function formatExamDate(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}

function answerWritingSpaceSize(question, { compact = false, study = false } = {}) {
  const mode = question.answerSpaceMode || "auto";
  const expectedItems = Number(question.expectedAnswerItems || 0);
  const min = compact ? (study ? 30 : 35) : (study ? 34 : 42);
  const lineUnit = compact ? (study ? 11 : 13) : (study ? 15 : 18);
  const fixedSizes = {
    short: compact ? (study ? 34 : 42) : (study ? 44 : 58),
    medium: compact ? (study ? 58 : 72) : (study ? 78 : 98),
    large: compact ? (study ? 88 : 112) : (study ? 128 : 165)
  };

  if (mode !== "auto" || expectedItems > 0) {
    let base;
    if (mode === "custom" && expectedItems > 0) {
      base = min + expectedItems * lineUnit;
    } else if (fixedSizes[mode]) {
      base = fixedSizes[mode];
    } else {
      const itemCount = Math.max(1, expectedItems);
      base = min + itemCount * lineUnit + Math.max(0, itemCount - 4) * (compact ? 4 : 6);
    }

    const maxLimit = compact ? 210 : 285;
    base = Math.max(min, Math.min(maxLimit, Math.round(base)));
    return {
      base,
      min: Math.min(min, base),
      weight: Math.max(0.8, Math.min(2.4, base / Math.max(1, min))),
      max: Math.max(base, Math.min(compact ? 245 : 330, base + (compact ? 45 : 70)))
    };
  }

  const answerHtml = answerKeyHtml(question);
  const answerText = stripHtml(answerHtml).replace(/\s+/g, " ").trim();
  const answerLength = answerText.length;
  const blockCount = (answerHtml.match(/<\/p>|<br\s*\/?>|<li\b|<\/div>|<\/tr>/gi) || []).length;
  const hasStructuredAnswer = /<table\b|<ol\b|<ul\b|<img\b/i.test(answerHtml);
  const maxBase = compact ? 230 : 315;

  let base = Math.max(min, Math.ceil(answerLength * (compact ? 0.42 : 0.5)));
  base += Math.min(compact ? 34 : 52, blockCount * (compact ? 7 : 10));
  if (hasStructuredAnswer) base += compact ? 18 : 30;
  base = Math.min(maxBase, Math.max(min, base));

  return {
    base,
    min,
    weight: Math.max(0.8, Math.min(3, base / min)),
    max: Math.max(base, Math.min(compact ? 280 : 360, base + (compact ? 70 : 115)))
  };
}

function answerSpaceMinHeight(space) {
  return parseFloat(window.getComputedStyle(space).minHeight) || 0;
}

function shrinkAnswerSpaces(answerSpaces, overflow) {
  if (!answerSpaces.length || overflow <= 0) return 0;
  let remaining = overflow;

  for (let pass = 0; pass < 4 && remaining > 1; pass += 1) {
    const shrinkable = answerSpaces
      .map(space => {
        const currentMinHeight = answerSpaceMinHeight(space);
        const minHeight = parseFloat(space.dataset.answerMin || "");
        const floorHeight = Number.isFinite(minHeight) ? minHeight : Math.min(32, currentMinHeight);
        return {
          space,
          currentMinHeight,
          room: Math.max(0, currentMinHeight - floorHeight)
        };
      })
      .filter(item => item.room > 0);
    if (!shrinkable.length) break;

    const totalRoom = shrinkable.reduce((total, item) => total + item.room, 0);
    let removed = 0;
    shrinkable.forEach(item => {
      const reduction = Math.min(item.room, remaining * (item.room / totalRoom));
      if (reduction > 0) {
        item.space.style.minHeight = `${Math.round(item.currentMinHeight - reduction)}px`;
        removed += reduction;
      }
    });
    if (removed <= 0.5) break;
    remaining -= removed;
  }

  return overflow - remaining;
}

function distributeRemainingAnswerSpace(answerSpaces, remainingSpace, { isTwoCol = false } = {}) {
  if (!answerSpaces.length || remainingSpace <= 0) return;

  if (isTwoCol) {
    const numRows = Math.ceil(answerSpaces.length / 2);
    const spacePerRow = Math.floor(remainingSpace / numRows);
    if (spacePerRow > 0) {
      answerSpaces.forEach(space => {
        const currentMinHeight = parseFloat(window.getComputedStyle(space).minHeight) || 0;
        space.style.minHeight = `${currentMinHeight + spacePerRow}px`;
      });
    }
    return;
  }

  let remaining = remainingSpace;
  for (let pass = 0; pass < 3 && remaining > 1; pass += 1) {
    const growable = answerSpaces
      .map(space => {
        const currentMinHeight = parseFloat(window.getComputedStyle(space).minHeight) || 0;
        const maxHeight = parseFloat(space.dataset.answerMax || "");
        const weight = parseFloat(space.dataset.answerWeight || "1") || 1;
        return {
          space,
          currentMinHeight,
          room: Number.isFinite(maxHeight) ? Math.max(0, maxHeight - currentMinHeight) : remaining,
          weight
        };
      })
      .filter(item => item.room > 0);
    if (!growable.length) break;

    const totalWeight = growable.reduce((total, item) => total + item.weight, 0);
    let used = 0;
    growable.forEach(item => {
      const share = remaining * (item.weight / totalWeight);
      const addition = Math.min(item.room, share);
      if (addition > 0) {
        item.space.style.minHeight = `${Math.round(item.currentMinHeight + addition)}px`;
        used += addition;
      }
    });
    if (used <= 0.5) break;
    remaining -= used;
  }
}

function adjustPrintPagesLayout() {
  const pages = Array.from(document.querySelectorAll(".print-page"));
  if (!pages.length) return;

  pages.forEach(page => {
    // Temporarily collapse page min-height to 0 to measure natural content scrollHeight
    const originalMinHeight = page.style.minHeight;
    page.style.minHeight = "0";

    const targetInnerHeight = 1015; // A4 inner height budget in pixels at 96 DPI (with safety buffer)
    
    const style = window.getComputedStyle(page);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;
    
    // Total height of elements currently rendered in page
    const innerContentHeight = page.scrollHeight - paddingTop - paddingBottom;
    const remainingSpace = targetInnerHeight - innerContentHeight;
    
    // Restore original min-height
    page.style.minHeight = originalMinHeight;
    
    if (remainingSpace <= 10) return; // Very little space left or page overflowed

    const answerSpaces = Array.from(page.querySelectorAll(".answer-space"));
    const answerItems = Array.from(page.querySelectorAll(".print-answer-item"));
    const normalQuestions = Array.from(page.querySelectorAll(".print-question:not(.placeholder-cell)"));
    
    const printDoc = page.closest(".print-document");
    const isTwoCol = printDoc && (printDoc.classList.contains("has-table-layout") || 
                                  printDoc.classList.contains("has-two-columns"));
    const isLastPage = page === pages[pages.length - 1];
    const shouldStretchAnswerSpaces = !(isTwoCol && isLastPage && normalQuestions.length <= 2);

    if (answerSpaces.length > 0 && shouldStretchAnswerSpaces) {
      distributeRemainingAnswerSpace(answerSpaces, remainingSpace, { isTwoCol });
    } else if (answerItems.length > 0) {
      // Answer keys should keep their natural spacing; only exam answer areas are stretched.
    } else if (answerSpaces.length > 0) {
      // In two-column/grid layouts, a final page with one row should not absorb all leftover page space.
    } else if (normalQuestions.length > 0) {
      const spacePerQuestion = Math.floor(remainingSpace / normalQuestions.length);
      if (spacePerQuestion > 0) {
        normalQuestions.forEach(q => {
          const currentMargin = parseFloat(window.getComputedStyle(q).marginBottom) || 0;
          q.style.marginBottom = `${currentMargin + spacePerQuestion}px`;
        });
      }
    }

    const overflow = (page.scrollHeight - paddingTop - paddingBottom) - targetInnerHeight;
    if (overflow > 0) {
      shrinkAnswerSpaces(Array.from(page.querySelectorAll(".answer-space")), overflow + 2);
    }
  });
}

function buildPrintDocument(mode) {
  const selected = selectedQuestions();
  if (!selected.length) {
    showToast("Word çıktısı için önce sınava soru ekleyin.", "warning");
    return false;
  }
  if (mode === "analysis") {
    els.printExamArea.innerHTML = `
      <div class="print-document print-analysis-document">
        ${buildAnalysisReportHtml({ printable: true })}
      </div>
    `;
    return true;
  }
  const schoolName = escapeHtml(state.settings.schoolName).replace(/\s+/g, " ");
  const teacherLine = `<div class="print-header-teacher">${
    state.settings.teachers.length
      ? `<strong>Ders öğretmeni:</strong> ${state.settings.teachers.map(escapeHtml).join(" / ")}`
      : ""
  }</div>`;
  const dateLine = `<div class="print-header-date">${
    state.examMeta.date
      ? `<strong>Sınav tarihi:</strong> ${escapeHtml(formatExamDate(state.examMeta.date))}`
      : ""
  }</div>`;
  const isStudyOutput = mode === "exam" && state.examMeta.outputType === "study";
  const answerIncludesQuestions = state.examMeta.answerKeyMode === "questions";
  
  // Mathematical Page-Fit Sizing Engine
  const pageTarget = state.examMeta.pageTarget || "auto";
  const columns = state.examMeta.columns || "1";
  const isTableLayout = columns === "table";
  const isTwoColLayout = columns === "2" || isTableLayout;
  
  const numQuestions = selected.length;
  const virtualRows = isTwoColLayout ? Math.ceil(numQuestions / 2) : numQuestions;
  
  const printClasses = [
    "print-document",
    isStudyOutput ? "study-document" : "",
    state.examMeta.pageTarget === "one" ? "fit-one-page" : "",
    state.examMeta.pageTarget === "two" ? "fit-two-pages" : "",
    state.examMeta.columns === "2" ? "has-two-columns" : "",
    state.examMeta.columns === "table" ? "has-table-layout" : ""
  ].filter(Boolean).join(" ");
  
  const isTable = columns === "table";
  
  // Create temporary container for measuring exact question heights as rendered by browser
  const tempContainer = document.createElement("div");
  tempContainer.className = `print-document ${printClasses}`;
  tempContainer.style.position = "absolute";
  tempContainer.style.left = "-9999px";
  tempContainer.style.top = "0";
  tempContainer.style.width = "210mm";
  tempContainer.style.padding = "8mm 12mm";
  tempContainer.style.boxSizing = "border-box";
  tempContainer.style.background = "#fff";
  
  const tempPage = document.createElement("div");
  tempPage.className = "print-page";
  tempContainer.appendChild(tempPage);
  document.body.appendChild(tempContainer);
  
  const questionHTMLs = selected.map((q, idx) => {
    const answerSize = answerWritingSpaceSize(q, { compact: isTwoColLayout, study: isStudyOutput });
    const baseSpace = answerSize.base;
    const answerSpace = Math.max(32, baseSpace);
    const answerSpaceAttrs = `data-answer-weight="${answerSize.weight.toFixed(3)}" data-answer-min="${Math.round(answerSize.min)}" data-answer-max="${Math.round(answerSize.max)}"`;
    
    if (mode === "answer") {
      return `
        <article class="print-question print-answer-item" data-q-id="${q.id}">
          ${answerItemHtml(q, idx, { includeQuestion: answerIncludesQuestions })}
        </article>
      `;
    }
    
    if (isStudyOutput) {
      if (isTable) {
        return `
          <div class="print-question print-study-item" data-q-id="${q.id}">
            <div style="font-weight:normal; margin-bottom:6px; line-height:1.26;">
              ${questionNumberHtml(idx, q.points)}
              <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(q, "exam", { includeSupplements: false })}</div>
            </div>
            <div class="answer-space" ${answerSpaceAttrs} style="min-height:${Math.max(30, Math.round(answerSpace * 0.72))}px; border-bottom:none;"></div>
          </div>
        `;
      }
      return `
        <article class="print-question print-study-item" data-q-id="${q.id}">
          <div class="study-question-line">
            ${questionNumberHtml(idx, q.points)}
            <div class="print-question-content" style="font-weight:normal;">${questionContentHtml(q, "exam")}</div>
          </div>
          <div class="answer-space" ${answerSpaceAttrs} style="min-height:${Math.max(30, Math.round(answerSpace * 0.72))}px"></div>
        </article>
      `;
    }
    
    if (isTable) {
      return `
        <div class="print-question" data-q-id="${q.id}">
          <div style="font-weight:normal; margin-bottom:6px; line-height:1.26;">
            ${questionNumberHtml(idx, q.points)}
            <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(q, "exam", { includeSupplements: false })}</div>
          </div>
          <div class="answer-space" ${answerSpaceAttrs} style="min-height:${answerSpace}px; border-bottom:none;"></div>
        </div>
      `;
    }
    
    return `
      <article class="print-question" data-q-id="${q.id}">
        <div style="font-weight:normal; line-height:1.26; margin-bottom:8px;">
          ${questionNumberHtml(idx, q.points)}
          <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(q, "exam")}</div>
        </div>
        <div class="answer-space" ${answerSpaceAttrs} style="min-height:${answerSpace}px"></div>
      </article>
    `;
  });
  
  tempPage.innerHTML = `<div class="print-questions">${questionHTMLs.join("")}</div>`;
  
  const measuredHeights = {};
  const measuredMinHeights = {};
  tempPage.querySelectorAll(".print-question").forEach(el => {
    const qId = el.getAttribute("data-q-id");
    const measuredHeight = el.offsetHeight || 100;
    const answerSpace = el.querySelector(".answer-space");
    if (answerSpace) {
      const currentAnswerHeight = parseFloat(window.getComputedStyle(answerSpace).minHeight) || 0;
      const minAnswerHeight = parseFloat(answerSpace.dataset.answerMin || "") || currentAnswerHeight;
      measuredMinHeights[qId] = Math.max(40, measuredHeight - currentAnswerHeight + minAnswerHeight);
    } else {
      measuredMinHeights[qId] = measuredHeight;
    }
    measuredHeights[qId] = measuredHeight;
  });
  
  document.body.removeChild(tempContainer);
  
  const printablePageHeight = 1010; // True A4 printable vertical space budget in pixels (~281mm - small buffer)
  let staticHeight = 0;
  if (!isStudyOutput) {
    staticHeight += 150; // schoolName, year, title
    if (mode === "exam") {
      staticHeight += 58; // student info table
    }
    if (mode === "exam" && state.examMeta.instruction && state.examMeta.instruction.trim()) {
      staticHeight += 28; // instructions line
    }
  }

  const getRenderedHeight = (questions, isPageOne) => {
    const pageStaticHeight = isPageOne ? staticHeight : 28;
    if (questions.length === 0) return pageStaticHeight;
    
    if (isTwoColLayout) {
      let height = pageStaticHeight;
      for (let i = 0; i < questions.length; i += 2) {
        const q1 = questions[i];
        const q2 = questions[i + 1];
        const h1 = measuredHeights[q1.id] || 100;
        const h2 = q2 ? (measuredHeights[q2.id] || 0) : 0;
        height += Math.max(h1, h2);
      }
      return height;
    }
    
    let height = pageStaticHeight;
    questions.forEach(q => {
      const heightMap = pageTarget === "auto" && !isTwoColLayout ? measuredMinHeights : measuredHeights;
      height += (heightMap[q.id] || measuredHeights[q.id] || 100);
    });
    return height;
  };

  const pagesQuestions = [];

  if (pageTarget === "one") {
    // Force exactly 1 page
    pagesQuestions.push({
      questions: selected,
      startIdx: 0
    });
  } else if (pageTarget === "two") {
    // Force exactly 2 pages, split equally
    let half = Math.ceil(selected.length / 2);
    if (isTwoColLayout && half < selected.length && half % 2 !== 0) {
      half += 1;
    }
    pagesQuestions.push({
      questions: selected.slice(0, half),
      startIdx: 0
    });
    if (half < selected.length) {
      pagesQuestions.push({
        questions: selected.slice(half),
        startIdx: half
      });
    }
  } else {
    // auto mode: partition based on actual physical space availability!
    let currentPage = [];
    let pageStartIndex = 0;
    
    for (let i = 0; i < selected.length; i++) {
      const q = selected[i];
      const testPage = [...currentPage, q];
      const pageLimit = printablePageHeight;
      
      const estimatedHeight = getRenderedHeight(testPage, pagesQuestions.length === 0);
      
      if (estimatedHeight > pageLimit && currentPage.length > 0) {
        pagesQuestions.push({
          questions: currentPage,
          startIdx: pageStartIndex
        });
        currentPage = [q];
        pageStartIndex = i;
      } else {
        currentPage.push(q);
      }
    }
    if (currentPage.length > 0) {
      pagesQuestions.push({
        questions: currentPage,
        startIdx: pageStartIndex
      });
    }

    if ((mode === "answer" || !isTwoColLayout) && pagesQuestions.length > 1) {
      let mergedOrphan = true;
      while (mergedOrphan && pagesQuestions.length > 1) {
        mergedOrphan = false;
        const lastPage = pagesQuestions[pagesQuestions.length - 1];
        const previousPage = pagesQuestions[pagesQuestions.length - 2];
        const previousPageIndex = pagesQuestions.length - 2;
        if (lastPage.questions.length !== 1) break;

        const candidateQuestions = [...previousPage.questions, lastPage.questions[0]];
        const candidateHeight = getRenderedHeight(candidateQuestions, previousPageIndex === 0);
        if (candidateHeight <= printablePageHeight + 72) {
          previousPage.questions = candidateQuestions;
          pagesQuestions.pop();
          mergedOrphan = true;
        }
      }

      let nextStartIdx = 0;
      pagesQuestions.forEach(page => {
        page.startIdx = nextStartIdx;
        nextStartIdx += page.questions.length;
      });
    }

    if (mode === "answer" && pagesQuestions.length > 1) {
      let compactedAnswers = true;
      while (compactedAnswers && pagesQuestions.length > 1) {
        compactedAnswers = false;
        const lastPage = pagesQuestions[pagesQuestions.length - 1];
        const previousPage = pagesQuestions[pagesQuestions.length - 2];
        const previousPageIndex = pagesQuestions.length - 2;

        while (lastPage.questions.length > 0) {
          const candidateQuestions = [...previousPage.questions, lastPage.questions[0]];
          const candidateHeight = getRenderedHeight(candidateQuestions, previousPageIndex === 0);
          if (candidateHeight > printablePageHeight + 140) break;

          previousPage.questions.push(lastPage.questions.shift());
          compactedAnswers = true;
        }

        if (lastPage.questions.length === 0) {
          pagesQuestions.pop();
          compactedAnswers = true;
        }
      }

      let nextStartIdx = 0;
      pagesQuestions.forEach(page => {
        page.startIdx = nextStartIdx;
        nextStartIdx += page.questions.length;
      });
    }

  }
  
  // Render pages
  const academicYearLine = `${escapeHtml(state.settings.academicYear)} EĞİTİM VE ÖĞRETİM YILI${state.examMeta.className ? ` ${escapeHtml(state.examMeta.className.toLocaleUpperCase('tr-TR'))} SINIFI` : ""}`;
  const courseName = currentCourse().name.toLocaleUpperCase("tr-TR");
  const suffix = mode === "answer" ? "CEVAP ANAHTARI" : "SINAVI SORULARI";
  const examTitleLine = `"${escapeHtml(courseName)}" DERSİ ${state.examMeta.term}. DÖNEM ${state.examMeta.examNumber}. YAZILI ${suffix}`;
  

  
  let pagesHtml = pagesQuestions.map((pageData, pIdx) => {
    const pageQuestions = pageData.questions;
    const pageStartIdx = pageData.startIdx;
    
    // Calculate page specific budget and proportional scaling factor k
    const pageStaticHeight = pIdx === 0 ? staticHeight : 28;
    const pagePrintableHeight = printablePageHeight;
    const pageVirtualRows = isTwoColLayout ? Math.ceil(pageQuestions.length / 2) : pageQuestions.length;
    
    let scale = 1.0;
    if (pageTarget === "one") {
      scale = 0.78;
    } else if (pageTarget === "two") {
      scale = 0.88;
    } else {
      scale = 0.88;
    }
    
    let pageStaticContentHeight = 0;
    pageQuestions.forEach(q => {
      const textLength = stripHtml(q.content).length;
      const estLineCount = Math.max(1, Math.ceil(textLength / (isTwoColLayout ? 45 : 90)));
      const textHeight = estLineCount * 18;
      
      let qStatic = 60;
      if (isTable) {
        qStatic = 50;
      } else if (isTwoColLayout) {
        qStatic = 41;
      }
      
      pageStaticContentHeight += Math.round((qStatic + textHeight) * scale);
    });
    
    if (isTwoColLayout) {
      pageStaticContentHeight = pageStaticContentHeight / 2;
    }
    
    const pageRemainingHeightForAnswers = pagePrintableHeight - pageStaticHeight - pageStaticContentHeight;
    
    const answerSizes = pageQuestions.map(q => answerWritingSpaceSize(q, {
      compact: isTwoColLayout,
      study: isStudyOutput
    }));
    const baseSpaces = answerSizes.map(size => size.base);
    
    // In two-column layout, calculate total required height based on the tallest column
    let pageBaseSpaceNeeded = 0;
    if (isTwoColLayout) {
      const half = Math.ceil(baseSpaces.length / 2);
      const col1Base = baseSpaces.slice(0, half).reduce((a, b) => a + b, 0);
      const col2Base = baseSpaces.slice(half).reduce((a, b) => a + b, 0);
      pageBaseSpaceNeeded = Math.max(col1Base, col2Base);
    } else {
      pageBaseSpaceNeeded = baseSpaces.reduce((a, b) => a + b, 0);
    }
    
    let k = 1.0;
    if (pageBaseSpaceNeeded > 0 && pageRemainingHeightForAnswers > 0) {
      k = pageRemainingHeightForAnswers / pageBaseSpaceNeeded;
    }
    
    const isLastPage = pIdx === pagesQuestions.length - 1;
    
    if (pageTarget === "auto") {
      // In auto mode, do not stretch during initial rendering. Let adjustPrintPagesLayout do all stretching.
      // We only allow minor shrinking (down to 0.85) if estimated height slightly exceeds the limit.
      k = Math.max(0.85, Math.min(1.0, k));
    } else {
      // In fit modes, we allow both shrinking and stretching to force fit the target
      k = Math.max(0.5, Math.min(1.6, k));
    }
    
    let renderList = pageQuestions.map((q, i) => ({
      question: q,
      qIdx: i,
      globalIndex: pageStartIdx + i
    }));

    if (isTable && renderList.length % 2 !== 0) {
      renderList.push({
        isPlaceholder: true
      });
    }

    const pageQuestionsHtml = renderList.map((item, gridIdx) => {
      if (item.isPlaceholder) {
        const isLastRow = gridIdx >= renderList.length - 2;
        const borderStyle = isLastRow ? 'style="border-bottom:none !important;"' : "";
        return `<div class="print-question placeholder-cell" ${borderStyle}></div>`;
      }
      
      const question = item.question;
      const qIdx = item.qIdx;
      const globalIndex = item.globalIndex;
      const answerSize = answerSizes[qIdx];
      const baseSpace = baseSpaces[qIdx];
      const answerSpace = Math.max(32, Math.round(baseSpace * k));
      const answerSpaceAttrs = (multiplier = 1) => {
        const maxSpace = Math.max(answerSpace, Math.round(answerSize.max * multiplier));
        const minSpace = Math.round(answerSize.min * multiplier);
        return `data-answer-weight="${answerSize.weight.toFixed(3)}" data-answer-min="${minSpace}" data-answer-max="${maxSpace}"`;
      };
      
      if (mode === "answer") {
        const isLastRow = isTable && gridIdx >= renderList.length - 2;
        const borderStyle = isLastRow ? 'style="border-bottom:none !important;"' : "";
        return `
          <article class="print-question print-answer-item" ${borderStyle}>
            ${answerItemHtml(question, globalIndex, { includeQuestion: answerIncludesQuestions })}
          </article>
        `;
      }
      
      if (isStudyOutput) {
        if (isTable) {
          const isLastRow = gridIdx >= renderList.length - 2;
          const borderStyle = isLastRow ? 'style="border-bottom:none !important;"' : "";
          return `
            <div class="print-question print-study-item" ${borderStyle}>
              <div style="font-weight:normal; margin-bottom:6px; line-height:1.26;">
                ${questionNumberHtml(globalIndex, question.points)}
                <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(question, "exam", { includeSupplements: false })}</div>
              </div>
              <div class="answer-space" ${answerSpaceAttrs(0.72)} style="min-height:${Math.max(30, Math.round(answerSpace * 0.72))}px; border-bottom:none;"></div>
            </div>
          `;
        }
        return `
          <article class="print-question print-study-item">
            <div class="study-question-line">
              ${questionNumberHtml(globalIndex, question.points)}
              <div class="print-question-content" style="font-weight:normal;">${questionContentHtml(question, "exam")}</div>
            </div>
            <div class="answer-space" ${answerSpaceAttrs(0.72)} style="min-height:${Math.max(30, Math.round(answerSpace * 0.72))}px"></div>
          </article>
        `;
      }
      
      if (isTable) {
        const isLastRow = gridIdx >= renderList.length - 2;
        const borderStyle = isLastRow ? 'style="border-bottom:none !important;"' : "";
        return `
          <div class="print-question" ${borderStyle}>
            <div style="font-weight:normal; margin-bottom:6px; line-height:1.26;">
              ${questionNumberHtml(globalIndex, question.points)}
              <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(question, "exam", { includeSupplements: false })}</div>
            </div>
            <div class="answer-space" ${answerSpaceAttrs()} style="min-height:${answerSpace}px; border-bottom:none;"></div>
          </div>
        `;
      }
      
      return `
        <article class="print-question">
          <div style="font-weight:normal; line-height:1.26; margin-bottom:8px;">
            ${questionNumberHtml(globalIndex, question.points)}
            <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(question, "exam")}</div>
          </div>
          <div class="answer-space" ${answerSpaceAttrs()} style="min-height:${answerSpace}px"></div>
        </article>
      `;
    }).join("");
    
    return `
      <div class="print-page">
        ${pIdx === 0 ? (
          isStudyOutput ? "" : `
          <header class="print-header">
            <div class="official-heading">
              <p>${schoolName}</p>
              <p>${academicYearLine}</p>
              <p>${examTitleLine}</p>
            </div>
            ${teacherLine}
            <div class="print-header-duration"><strong>Süre:</strong> ${escapeHtml(state.examMeta.duration || "-")}</div>
            ${dateLine}
            ${mode === "exam" && state.examMeta.instruction && state.examMeta.instruction.trim() ? `<div style="grid-column:1/-1"><strong>Yönerge:</strong> ${escapeHtml(state.examMeta.instruction)}</div>` : ""}
          </header>
          ${mode === "exam" && !isStudyOutput ? `
          <table class="student-info-table">
            <tr class="student-info-row">
              <td class="student-info-name">
                <strong>Adı Soyadı:</strong>
              </td>
              <td class="student-info-points student-info-points-top" valign="top">
                <div class="student-points-label">ALDIĞI PUAN</div>
              </td>
            </tr>
            <tr class="student-info-row">
              <td class="student-info-meta">
                <strong>Okul Numarası:</strong>
              </td>
              <td class="student-info-points student-info-points-bottom">&nbsp;</td>
            </tr>
          </table>
          ` : ""}
          `
        ) : ""}
        <div class="print-questions">
          ${pageQuestionsHtml}
        </div>
      </div>
    `;
  }).join("");
  
  els.printExamArea.innerHTML = `
    <div class="${printClasses}">
      ${pagesHtml}
    </div>
  `;
  
  // Temporarily show the print area off-screen to measure element dimensions accurately
  const originalDisplay = els.printExamArea.style.display;
  const originalPosition = els.printExamArea.style.position;
  const originalLeft = els.printExamArea.style.left;
  
  els.printExamArea.style.display = "block";
  els.printExamArea.style.position = "absolute";
  els.printExamArea.style.left = "-9999px";
  
  adjustPrintPagesLayout();
  
  els.printExamArea.style.display = originalDisplay;
  els.printExamArea.style.position = originalPosition;
  els.printExamArea.style.left = originalLeft;

  return true;
}

function documentModeLabel(mode) {
  if (mode === "answer") return "Cevap Anahtarı";
  if (mode === "analysis") return "Analiz Raporu";
  return "Sınav";
}

function safeFileName(value) {
  return String(value || "belge")
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "belge";
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function wordDocumentStyles() {
  return `
    @page WordSection1 {
      size: 595.3pt 841.9pt;
      margin: 22.7pt 34pt 22.7pt 34pt;
    }
    div.WordSection1 { page: WordSection1; }
    body {
      margin: 0;
      color: #000;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-size: 11pt;
      line-height: 1.2;
    }
    .print-document {
      width: 100%;
      margin: 0;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-size: 11pt;
    }
    .print-page {
      width: 100%;
      min-height: 0;
      padding: 0;
      margin: 0;
      border: 0;
      box-shadow: none;
      page-break-after: always;
    }
    .print-page + .print-page {
      page-break-before: always;
      break-before: page;
      mso-break-type: section-break;
    }
    .print-page:last-child { page-break-after: auto; }
    .print-header {
      display: block;
      margin-bottom: 6pt;
      padding-bottom: 4pt;
      border-bottom: 1pt solid #000;
      font-size: 10.6pt;
    }
    .official-heading {
      text-align: center;
      font-size: 11pt;
      font-weight: 700;
      line-height: 1.08;
      text-transform: uppercase;
      margin: 0 0 5pt;
    }
    .official-heading p { margin: 0 0 1pt; }
    .word-header-meta {
      width: 100%;
      border-collapse: collapse;
      margin: 2pt 0 0;
      table-layout: fixed;
    }
    .word-header-meta td {
      width: 33.33%;
      border: 0;
      padding: 0;
      font-size: 10.6pt;
      vertical-align: top;
    }
    .word-header-meta td:nth-child(2) { text-align: center; }
    .word-header-meta td:nth-child(3) { text-align: right; }
    .word-header-instruction {
      margin-top: 5pt;
      font-size: 11pt;
    }
    .student-info-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      box-sizing: border-box;
      margin-bottom: 8px;
      font-size: 11pt;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
    }
    .student-info-row {
      height: 20pt;
    }
    .student-info-table td {
      border: 1pt solid #000;
      height: 20pt;
      box-sizing: border-box;
    }
    .student-info-name,
    .student-info-meta {
      width: 75%;
      padding: 0 7pt;
      vertical-align: middle;
      line-height: 20pt;
    }
    .student-info-points {
      width: 25%;
      text-align: center;
      font-weight: bold;
      font-size: 11pt;
      vertical-align: top;
      height: 20pt;
      line-height: 1.1;
      padding: 0;
    }
    .student-info-points-top {
      border-bottom: 0;
    }
    .student-info-points-bottom {
      border-top: 0;
    }
    .student-points-label {
      font-size: 9pt;
      font-weight: bold;
      margin: 0;
      padding-top: 3pt;
    }
    .print-subpage-header {
      display: table !important;
      width: 100%;
      border-bottom: 1pt solid #000;
      padding-bottom: 4px;
      margin-bottom: 15px;
      font-size: 9.5pt;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-weight: bold;
      page-break-after: avoid;
      break-after: avoid;
    }
    .print-subpage-header > div {
      display: table-cell;
      width: 50%;
    }
    .print-subpage-header > div:nth-child(2) { text-align: right; }
    .print-question {
      display: block;
      page-break-inside: avoid;
      margin: 0 0 12px;
    }
    .print-question h2 {
      margin: 0 0 8px;
      font-size: 11pt;
    }
    .print-question-content p {
      display: inline;
      margin: 0;
    }
    .print-question-no,
    .print-question-points {
      font-weight: bold;
    }
    .print-question-no {
      display: inline;
      margin-right: 10pt;
    }
    .print-question-content {
      font-weight: normal;
    }
    .print-answer-heading {
      margin: 0 0 6pt;
      font-size: 11pt;
      line-height: 1.18;
      font-weight: bold;
    }
    .print-answer-label {
      margin: 5pt 0 2pt;
      font-size: 11pt;
      line-height: 1.16;
      font-weight: bold;
    }
    .print-answer-question-line {
      margin: 0 0 4pt;
      font-size: 11pt;
      line-height: 1.22;
      font-weight: normal;
    }
    .print-answer {
      display: block;
      white-space: pre-wrap;
      font-size: 11pt;
      line-height: 1.18;
    }
    .print-answer p,
    .print-answer div {
      display: block;
      margin: 4px 0;
      white-space: pre-wrap;
    }
    .print-answer ul,
    .print-answer ol {
      margin: 6px 0;
      padding-left: 20px;
    }
    .print-answer li { margin: 4px 0; }
    .print-question-content table,
    .print-answer table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 6pt 0;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-size: 11pt;
    }
    .print-question-content th,
    .print-question-content td,
    .print-answer th,
    .print-answer td {
      border: 0.75pt solid #000;
      padding: 4pt 5pt;
      vertical-align: top;
      line-height: 1.2;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-size: 11pt;
    }
    .print-question-content th,
    .print-answer th {
      font-weight: bold;
      text-align: center;
    }
    .print-question-content td p,
    .print-question-content th p,
    .print-answer td p,
    .print-answer th p {
      margin: 0 0 3pt;
      line-height: 1.2;
    }
    .print-question-content td p:last-child,
    .print-question-content th p:last-child,
    .print-answer td p:last-child,
    .print-answer th p:last-child {
      margin-bottom: 0;
    }
    .print-question-content table.journal-entry-table,
    .print-answer table.journal-entry-table {
      margin: 3pt 0;
      font-size: 11pt;
      line-height: 1.04;
    }
    .print-question-content .journal-entry-table .journal-account-debit-col,
    .print-question-content .journal-entry-table .journal-account-credit-col,
    .print-answer .journal-entry-table .journal-account-debit-col,
    .print-answer .journal-entry-table .journal-account-credit-col {
      width: 40%;
    }
    .print-question-content .journal-entry-table .journal-amount-col,
    .print-answer .journal-entry-table .journal-amount-col {
      width: 10%;
    }
    .print-question-content .journal-entry-table th,
    .print-question-content .journal-entry-table td,
    .print-answer .journal-entry-table th,
    .print-answer .journal-entry-table td {
      padding: 1pt 4pt;
      line-height: 1.02;
    }
    .print-question-content .journal-entry-table .journal-entry-date-cell,
    .print-answer .journal-entry-table .journal-entry-date-cell {
      font-size: 11pt;
    }
    .print-question-content .journal-entry-table .journal-entry-desc-row th,
    .print-answer .journal-entry-table .journal-entry-desc-row th {
      font-size: 11pt;
      text-align: left;
    }
    .print-question-content .journal-entry-table .journal-account,
    .print-answer .journal-entry-table .journal-account {
      text-align: left;
      color: #000;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-size: 11pt;
      font-weight: normal;
    }
    .print-question-content .journal-entry-table .journal-account-debit-side,
    .print-answer .journal-entry-table .journal-account-debit-side {
      border-right: none;
    }
    .print-question-content .journal-entry-table .journal-account-credit-side,
    .print-answer .journal-entry-table .journal-account-credit-side {
      border-left: none;
    }
    .print-question-content .journal-entry-table .journal-account-side,
    .print-answer .journal-entry-table .journal-account-side {
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
    }
    .print-question-content .journal-entry-table .journal-account.is-subaccount .journal-account-side,
    .print-answer .journal-entry-table .journal-account.is-subaccount .journal-account-side {
      font-size: 11pt;
    }
    .print-question-content .journal-entry-table tbody td,
    .print-answer .journal-entry-table tbody td {
      border-top: none;
      border-bottom: none;
    }
    .print-question-content .journal-entry-table .journal-subaccount-amount,
    .print-answer .journal-entry-table .journal-subaccount-amount {
      display: inline-block;
      margin-left: 8pt;
      text-align: right;
    }
    .answer-space {
      min-height: 30px;
      margin-top: 12px;
      border-bottom: none;
      mso-element: para-border-div;
    }
    .word-grid-table,
    .word-two-column-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin-top: 6pt;
    }
    .word-grid-table {
      border: 0.75pt solid #000;
    }
    .word-grid-table tr,
    .word-two-column-table tr,
    .word-grid-table td,
    .word-two-column-table td {
      page-break-inside: avoid;
      break-inside: avoid;
      mso-pagination: none;
    }
    .word-grid-table td,
    .word-two-column-table td {
      width: 50%;
      vertical-align: top;
    }
    .word-grid-table td {
      border: 0.75pt solid #000;
      padding: 4pt 6pt;
    }
    .word-two-column-table td {
      border: 0.75pt solid #000;
      padding: 5pt 6pt;
    }
    .word-grid-table .print-question,
    .word-two-column-table .print-question {
      border: 0;
      padding: 0;
      margin: 0;
      page-break-inside: avoid;
    }
    .word-question-inline {
      margin: 0;
      font-weight: normal;
      line-height: 1.26;
    }
    .word-question-inline p,
    .word-question-inline div {
      display: inline;
      margin: 0;
    }
    .word-question-inline .word-question-no {
      display: inline;
      margin-right: 10pt;
      font-weight: bold;
    }
    .word-question-inline .word-question-points {
      font-weight: bold;
      white-space: nowrap;
    }
    .word-answer-space {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8pt;
    }
    .word-grid-table .word-answer-space,
    .word-two-column-table .word-answer-space {
      margin-top: 5pt;
    }
    .word-answer-space td {
      border: 0;
      padding: 0;
      width: 100%;
      font-size: 1pt;
      line-height: 1pt;
    }
    .word-single-question-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 0 0 10pt;
      page-break-inside: avoid;
      break-inside: avoid;
      mso-pagination: none;
    }
    .word-single-question-table tr,
    .word-single-question-table td {
      page-break-inside: avoid;
      break-inside: avoid;
      mso-pagination: none;
    }
    .word-single-question-table td {
      border: 0;
      padding: 0;
      vertical-align: top;
    }
    .word-single-question-table .print-question {
      margin: 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .print-document.fit-one-page {
      font-size: 8.4pt;
    }
    .print-document.fit-one-page .official-heading {
      font-size: 9.6pt;
      line-height: 1.04;
      margin-bottom: 2pt;
    }
    .print-document.fit-one-page .print-header,
    .print-document.fit-one-page .word-header-meta td {
      font-size: 8.8pt;
    }
    .print-document.fit-one-page .student-info-table {
      font-size: 8.6pt;
      margin-bottom: 5pt;
    }
    .print-document.fit-one-page .student-info-name,
    .print-document.fit-one-page .student-info-meta {
      padding: 1pt 5pt;
    }
    .print-document.fit-one-page .student-points-label {
      font-size: 8pt;
      padding-top: 2pt;
    }
    .print-document.fit-one-page .word-grid-table td,
    .print-document.fit-one-page .word-two-column-table td {
      padding: 3pt 5pt;
    }
    .print-document.fit-one-page .word-question-inline {
      font-size: 8.4pt;
      line-height: 1.08;
    }
    .print-document.fit-one-page .print-answer-heading,
    .print-document.fit-one-page .print-answer-question-line,
    .print-document.fit-one-page .print-answer,
    .print-document.fit-one-page .print-answer-label {
      font-size: 8.8pt;
      line-height: 1.08;
    }
    .print-document.fit-one-page .word-answer-space {
      margin-top: 2pt;
    }
    .print-document.fit-one-page .word-single-question-table {
      margin-bottom: 3pt;
      page-break-inside: auto;
      break-inside: auto;
    }
    .print-document.fit-two-pages {
      font-size: 10.3pt;
    }
    .print-document.fit-two-pages .official-heading {
      font-size: 10.5pt;
      line-height: 1.08;
      margin-bottom: 3pt;
    }
    .print-document.fit-two-pages .print-header,
    .print-document.fit-two-pages .word-header-meta td {
      font-size: 10pt;
    }
    .print-document.fit-two-pages .student-info-table {
      font-size: 10pt;
      margin-bottom: 9pt;
    }
    .print-document.fit-two-pages .student-info-name,
    .print-document.fit-two-pages .student-info-meta {
      padding: 4pt 6pt;
    }
    .print-document.fit-two-pages .word-grid-table td,
    .print-document.fit-two-pages .word-two-column-table td {
      padding: 3.5pt 5.5pt;
    }
    .print-document.fit-two-pages .word-question-inline {
      font-size: 10.3pt;
      line-height: 1.18;
    }
    .print-document.fit-two-pages .print-answer-heading,
    .print-document.fit-two-pages .print-answer-question-line,
    .print-document.fit-two-pages .print-answer,
    .print-document.fit-two-pages .print-answer-label {
      font-size: 10.2pt;
      line-height: 1.14;
    }
    .print-document.fit-two-pages .word-answer-space {
      margin-top: 4pt;
    }
    .print-document.fit-two-pages .word-single-question-table {
      margin-bottom: 7pt;
    }
    .print-analysis-document {
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-size: 11pt;
      color: #111;
    }
    .analysis-print-heading {
      margin-bottom: 10pt;
      padding-bottom: 6pt;
      border-bottom: 1pt solid #000;
      text-align: center;
    }
    .analysis-print-heading h3 {
      margin: 0 0 3pt;
      font-size: 11pt;
    }
    .analysis-print-heading p {
      margin: 0;
      font-size: 9.5pt;
    }
    .analysis-kpi-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8pt;
    }
    .analysis-kpi-table td {
      width: 25%;
      border: 1pt solid #777;
      padding: 6pt;
      vertical-align: middle;
      text-align: center;
      background: #f3f7f7;
    }
    .analysis-kpi-card {
      min-height: 44pt;
      border-top: 2.5pt solid #148177;
    }
    .analysis-kpi-card p {
      display: block;
      margin: 0;
    }
    .analysis-kpi-label {
      color: #000;
      font-size: 8.5pt;
      font-weight: normal;
    }
    .analysis-kpi-value {
      display: block;
      margin: 3pt 0 0;
      font-size: 13pt;
      line-height: 1.05;
      font-weight: normal;
    }
    .analysis-kpi-note {
      display: block;
      margin: 2pt 0 0;
      font-size: 7.5pt;
      line-height: 1.15;
      font-weight: normal;
    }
    .analysis-brief {
      margin-bottom: 8pt;
      padding: 6pt;
      border: 1pt solid #aaa;
      background: #fffdf5;
      font-size: 9.2pt;
      line-height: 1.3;
    }
    .analysis-grid {
      width: 100%;
      margin-bottom: 8pt;
    }
    .analysis-grid-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 7pt;
      margin-bottom: 8pt;
    }
    .analysis-grid-cell {
      width: 50%;
      border: 0;
      padding: 0 4pt 7pt 0;
      vertical-align: top;
    }
    .analysis-grid-cell-right {
      padding-left: 4pt;
      padding-right: 0;
    }
    .analysis-box {
      border: 1pt solid #999;
      padding: 6pt;
      margin-bottom: 7pt;
      page-break-inside: avoid;
    }
    .analysis-grid-table .analysis-box {
      margin-bottom: 0;
      min-height: 68pt;
    }
    .analysis-box h3 {
      margin: 0 0 5pt;
      font-size: 10.5pt;
      color: #000;
    }
    .analysis-distribution-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.7pt;
    }
    .analysis-distribution-table td {
      border-bottom: 1pt solid #ddd;
      padding: 3pt 2pt;
      vertical-align: middle;
    }
    .analysis-dist-label {
      width: 42%;
      font-weight: normal;
    }
    .analysis-dist-bar {
      width: 30%;
    }
    .analysis-meter {
      width: 100%;
      border-collapse: separate;
    }
    .analysis-meter td {
      height: 5pt;
      padding: 0;
      border: 1pt solid #fff;
      background: #e9eeee;
    }
    .analysis-meter td.is-filled {
      background: #148177;
    }
    .analysis-dist-value {
      width: 18%;
      text-align: right;
      white-space: nowrap;
      font-weight: normal;
    }
    .analysis-dist-percent {
      width: 12%;
      text-align: right;
      font-weight: normal;
    }
    .analysis-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
    }
    .analysis-table th,
    .analysis-table td {
      border: 1pt solid #888;
      padding: 4pt;
      vertical-align: top;
    }
    .analysis-table th {
      background: #eef4f4;
      font-weight: bold;
    }
    table { border-collapse: collapse; }
    img { max-width: 100%; height: auto; }
  `;
}

function normalizeWordAnswerSpaces(root) {
  const isCompactLayout = root.classList.contains("has-table-layout") || root.classList.contains("has-two-columns");
  const isOnePage = root.classList.contains("fit-one-page");
  const isTwoPages = root.classList.contains("fit-two-pages");
  const minimumHeight = isOnePage
    ? (isCompactLayout ? 44 : 68)
    : isTwoPages
      ? (isCompactLayout ? 68 : 76)
      : (isCompactLayout ? 95 : 130);
  const maximumHeight = isOnePage
    ? (isCompactLayout ? 82 : 118)
    : isTwoPages
      ? (isCompactLayout ? 88 : 102)
      : Infinity;

  root.querySelectorAll(".answer-space").forEach(space => {
    const styledHeight = parseFloat(space.style.minHeight || space.style.height || "");
    const dataMin = parseFloat(space.dataset.answerMin || "");
    const baseHeight = [styledHeight, dataMin]
      .filter(Number.isFinite)
      .reduce((max, value) => Math.max(max, value), 0);
    const heightPx = Math.min(maximumHeight, Math.max(minimumHeight, baseHeight || minimumHeight));
    const heightPt = Math.round(heightPx * 0.75);

    const table = document.createElement("table");
    table.className = "word-answer-space";
    table.setAttribute("cellspacing", "0");
    table.setAttribute("cellpadding", "0");
    table.style.height = `${heightPt}pt`;
    table.style.minHeight = `${heightPt}pt`;

    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.style.height = `${heightPt}pt`;
    cell.innerHTML = "&nbsp;";
    row.appendChild(cell);
    table.appendChild(row);
    space.replaceWith(table);
  });
}

function inlineWordHtmlFromContent(contentNode) {
  const clone = contentNode.cloneNode(true);
  Array.from(clone.querySelectorAll("p, div")).reverse().forEach(node => {
    if (node.classList && node.classList.contains("print-question-content")) return;
    const span = document.createElement("span");
    span.innerHTML = node.innerHTML;
    node.replaceWith(span, document.createTextNode(" "));
  });
  return clone.innerHTML.replace(/\s+/g, " ").trim();
}

function normalizeWordQuestionLines(root) {
  root.querySelectorAll(".print-question:not(.placeholder-cell):not(.print-answer-item)").forEach(question => {
    const content = question.querySelector(".print-question-content");
    if (!content) return;

    const heading = content.parentElement;
    if (!heading) return;

    const numberText = Array.from(heading.children)
      .find(child => child !== content && /^Soru-\d+\)/.test(child.textContent.trim()))
      ?.textContent.trim();
    if (!numberText) return;

    let pointsText = "";
    Array.from(heading.children).forEach(child => {
      const text = child.textContent.trim();
      if (child !== content && /^\(\s*\d+(?:[.,]\d+)?\s*P\s*\)$/.test(text)) {
        pointsText = text;
      }
    });

    let contentHtml = inlineWordHtmlFromContent(content);
    if (!pointsText) {
      const pointMatch = contentHtml.match(/\(\s*\d+(?:[.,]\d+)?\s*P\s*\)\s*$/);
      if (pointMatch) {
        pointsText = pointMatch[0].trim();
        contentHtml = contentHtml.slice(0, pointMatch.index).trim();
      }
    }

    const inline = document.createElement("div");
    inline.className = "word-question-inline";
    inline.innerHTML = `<span class="word-question-no">${escapeHtml(numberText)}&nbsp;&nbsp;</span>${contentHtml}${pointsText ? ` <span class="word-question-points">${escapeHtml(pointsText)}</span>` : ""}`;
    heading.replaceWith(inline);
  });
}

function normalizeWordStudentInfo(root) {
  root.querySelectorAll(".student-info-row").forEach(row => {
    row.style.height = "20pt";
  });
  root.querySelectorAll(".student-info-name, .student-info-meta").forEach(cell => {
    cell.setAttribute("valign", "middle");
    cell.style.verticalAlign = "middle";
    cell.style.height = "20pt";
    cell.style.paddingTop = "0";
    cell.style.paddingBottom = "0";
    cell.style.lineHeight = "20pt";
  });
  root.querySelectorAll(".student-info-points").forEach(cell => {
    cell.setAttribute("valign", "top");
    cell.style.verticalAlign = "top";
    cell.style.height = "20pt";
    cell.style.padding = "0";
  });
  root.querySelectorAll(".student-info-points-top").forEach(cell => {
    cell.style.borderBottom = "0";
  });
  root.querySelectorAll(".student-info-points-bottom").forEach(cell => {
    cell.style.borderTop = "0";
  });
  root.querySelectorAll(".student-points-label").forEach(label => {
    label.style.marginTop = "0";
    label.style.paddingTop = root.classList.contains("fit-one-page") ? "2pt" : "3pt";
  });
}

function normalizeWordPageBreaks(root) {
  root.querySelectorAll(".print-page").forEach((page, index) => {
    page.style.pageBreakAfter = index === root.querySelectorAll(".print-page").length - 1 ? "auto" : "always";
    if (index > 0) {
      page.style.pageBreakBefore = "always";
      page.style.breakBefore = "page";
    }
  });
}

function makeWordCellParagraph(html) {
  const paragraph = document.createElement("p");
  paragraph.innerHTML = html || "&nbsp;";
  paragraph.style.margin = "0 0 3pt";
  paragraph.style.lineHeight = "1.2";
  return paragraph;
}

function splitFlatNumberedCellLines(text) {
  const normalized = (text || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const matches = Array.from(normalized.matchAll(/\d{1,2}[.)]\s*/g))
    .filter(match => match.index === 0 || !/\d/.test(normalized.charAt(match.index - 1)));
  if (matches.length < 2) return [];

  return matches
    .map((match, index) => normalized.slice(match.index, matches[index + 1]?.index || normalized.length).trim())
    .filter(Boolean);
}

function normalizeWordTableCellLines(cell) {
  if (cell.querySelector("table")) return;

  const paragraphs = [];
  let inlineBuffer = [];
  const flushInlineBuffer = () => {
    const html = inlineBuffer.map(node => node.outerHTML || escapeHtml(node.textContent || "")).join("").trim();
    inlineBuffer = [];
    if (html) paragraphs.push(makeWordCellParagraph(html));
  };

  Array.from(cell.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) inlineBuffer.push(node.cloneNode(true));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toLowerCase();
    if (tag === "br") {
      flushInlineBuffer();
      return;
    }
    if (tag === "p" || tag === "div") {
      flushInlineBuffer();
      if (node.textContent.trim() || node.querySelector("img, table")) {
        paragraphs.push(makeWordCellParagraph(node.innerHTML));
      }
      return;
    }
    if (tag === "ol" || tag === "ul") {
      flushInlineBuffer();
      Array.from(node.children).forEach((item, index) => {
        if (item.tagName.toLowerCase() !== "li") return;
        const prefix = tag === "ol" ? `${index + 1}. ` : "• ";
        paragraphs.push(makeWordCellParagraph(`${prefix}${item.innerHTML}`));
      });
      return;
    }
    inlineBuffer.push(node.cloneNode(true));
  });
  flushInlineBuffer();

  if (paragraphs.length === 1) {
    const flatLines = splitFlatNumberedCellLines(paragraphs[0].textContent);
    if (flatLines.length > 1) {
      paragraphs.splice(0, paragraphs.length, ...flatLines.map(line => makeWordCellParagraph(escapeHtml(line))));
    }
  }

  if (paragraphs.length <= 1) return;
  paragraphs[paragraphs.length - 1].style.marginBottom = "0";
  cell.replaceChildren(...paragraphs);
}

function normalizeWordContentTables(root) {
  root.querySelectorAll(".print-question-content table, .print-answer table").forEach(table => {
    const isJournalTable = table.classList.contains("journal-entry-table");
    table.setAttribute("cellspacing", "0");
    table.setAttribute("cellpadding", "0");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.tableLayout = "fixed";
    table.style.margin = isJournalTable ? "3pt 0" : "6pt 0";
    table.style.fontFamily = '"Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif';
    table.style.fontSize = "11pt";
    if (isJournalTable) {
      table.style.fontSize = "11pt";
      table.style.lineHeight = "1.02";
      const cols = table.querySelectorAll("col");
      if (cols.length >= 4) {
        if (cols[0]) cols[0].style.width = "40%";
        if (cols[1]) cols[1].style.width = "40%";
        if (cols[2]) cols[2].style.width = "10%";
        if (cols[3]) cols[3].style.width = "10%";
      } else {
        if (cols[0]) cols[0].style.width = "72%";
        if (cols[1]) cols[1].style.width = "14%";
        if (cols[2]) cols[2].style.width = "14%";
      }
    }
    table.querySelectorAll("th, td").forEach(cell => {
      cell.style.border = "0.75pt solid #000";
      cell.style.padding = isJournalTable ? "0pt 4pt" : "4pt 5pt";
      cell.style.verticalAlign = "top";
      cell.style.lineHeight = isJournalTable ? "1.02" : "1.2";
      cell.style.fontFamily = '"Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif';
      cell.style.fontSize = "11pt";
      normalizeWordTableCellLines(cell);
    });
    table.querySelectorAll("th").forEach(cell => {
      cell.style.fontWeight = "bold";
      cell.style.textAlign = "center";
    });
    if (isJournalTable) {
      const isBlankJournal = table.classList.contains("is-blank-journal") || table.dataset.blank === "true";
      table.querySelectorAll(".journal-entry-date-cell").forEach(cell => {
        cell.style.fontSize = "11pt";
        cell.style.padding = "1pt 4pt";
      });
      table.querySelectorAll(".journal-entry-desc-row th").forEach(cell => {
        cell.style.fontSize = "11pt";
        cell.style.textAlign = "left";
        cell.style.padding = "1pt 4pt";
      });
      table.querySelectorAll(".journal-amount").forEach(cell => {
        cell.style.textAlign = "right";
        cell.style.fontSize = "11pt";
      });
      table.querySelectorAll(".journal-account").forEach(cell => {
        cell.style.textAlign = "left";
        cell.style.fontSize = "11pt";
        cell.style.color = "#000";
        cell.style.fontWeight = "normal";
        cell.style.paddingLeft = cell.classList.contains("is-subaccount") && cell.textContent.trim() ? "14pt" : "4pt";
      });
      table.querySelectorAll(".journal-account-debit-side").forEach(cell => {
        cell.style.borderRight = "none";
      });
      table.querySelectorAll(".journal-account-credit-side").forEach(cell => {
        cell.style.borderLeft = "none";
      });
      table.querySelectorAll(".journal-account-side").forEach(node => {
        const cell = node.closest(".journal-account");
        node.style.display = "inline-block";
        node.style.width = "100%";
        node.style.boxSizing = "border-box";
        node.style.verticalAlign = "top";
        if (cell?.classList.contains("is-subaccount")) {
          node.style.paddingLeft = "0";
          node.style.fontSize = "11pt";
        }
      });
      table.querySelectorAll(".journal-subaccount-amount").forEach(node => {
        node.style.display = "inline-block";
        node.style.marginLeft = "8pt";
        node.style.textAlign = "right";
      });
      table.querySelectorAll("tfoot th").forEach(cell => {
        cell.style.fontSize = "11pt";
      });
      table.querySelectorAll("tbody td").forEach(cell => {
        cell.style.borderTop = "none";
        cell.style.borderBottom = "none";
        if (isBlankJournal) cell.style.height = "18pt";
      });
    }
  });
}

function convertWordHeaderMeta(root) {
  root.querySelectorAll(".print-header").forEach(header => {
    const teacher = header.querySelector(".print-header-teacher");
    const duration = header.querySelector(".print-header-duration");
    const date = header.querySelector(".print-header-date");
    if (!teacher && !duration && !date) return;

    const metaTable = document.createElement("table");
    metaTable.className = "word-header-meta";
    metaTable.setAttribute("cellspacing", "0");
    metaTable.setAttribute("cellpadding", "0");

    const row = document.createElement("tr");
    [teacher, duration, date].forEach(node => {
      const cell = document.createElement("td");
      if (node) {
        cell.innerHTML = node.innerHTML || "&nbsp;";
        node.remove();
      } else {
        cell.innerHTML = "&nbsp;";
      }
      row.appendChild(cell);
    });
    metaTable.appendChild(row);

    const instruction = Array.from(header.children).find(child => {
      if (child.classList && child.classList.contains("official-heading")) return false;
      return child.textContent && child.textContent.trim().startsWith("Yönerge:");
    });

    header.appendChild(metaTable);
    if (instruction) {
      instruction.classList.add("word-header-instruction");
      header.appendChild(instruction);
    }
  });
}

function convertWordQuestionsToTable(root) {
  const isGrid = root.classList.contains("has-table-layout");
  const isTwoColumn = root.classList.contains("has-two-columns");
  if (!isGrid && !isTwoColumn) return;

  root.querySelectorAll(".print-page .print-questions").forEach(container => {
    const questions = Array.from(container.children)
      .filter(child => child.classList && child.classList.contains("print-question"));
    if (!questions.length) return;

    const table = document.createElement("table");
    table.className = isGrid ? "word-grid-table" : "word-two-column-table";
    table.setAttribute("cellspacing", "0");
    table.setAttribute("cellpadding", "0");

    for (let index = 0; index < questions.length; index += 2) {
      const row = document.createElement("tr");
      row.style.pageBreakInside = "avoid";
      [questions[index], questions[index + 1]].forEach(question => {
        const cell = document.createElement("td");
        cell.style.pageBreakInside = "avoid";
        if (question && !question.classList.contains("placeholder-cell")) {
          question.removeAttribute("style");
          question.style.pageBreakInside = "avoid";
          question.style.breakInside = "avoid";
          cell.appendChild(question);
        } else {
          cell.innerHTML = "&nbsp;";
        }
        row.appendChild(cell);
      });
      table.appendChild(row);
    }

    container.replaceChildren(table);
  });
}

function wrapWordSingleColumnQuestions(root) {
  const isTwoColumnOutput = root.classList.contains("has-table-layout") || root.classList.contains("has-two-columns");
  if (isTwoColumnOutput || root.classList.contains("fit-one-page")) return;

  root.querySelectorAll(".print-page .print-questions").forEach(container => {
    const questions = Array.from(container.children)
      .filter(child => child.classList && child.classList.contains("print-question") && child.querySelector(".word-answer-space"));
    if (!questions.length) return;

    questions.forEach(question => {
      const table = document.createElement("table");
      table.className = "word-single-question-table";
      table.setAttribute("cellspacing", "0");
      table.setAttribute("cellpadding", "0");
      table.style.pageBreakInside = "avoid";

      const row = document.createElement("tr");
      row.style.pageBreakInside = "avoid";

      const cell = document.createElement("td");
      cell.style.pageBreakInside = "avoid";
      question.style.pageBreakInside = "avoid";
      question.style.breakInside = "avoid";
      cell.appendChild(question);
      row.appendChild(cell);
      table.appendChild(row);
      container.appendChild(table);
    });
  });
}

function prepareWordPrintHtml() {
  const printDocument = els.printExamArea.querySelector(".print-document");
  if (!printDocument) return "";
  const clone = printDocument.cloneNode(true);
  normalizeWordPageBreaks(clone);
  convertWordHeaderMeta(clone);
  normalizeWordStudentInfo(clone);
  normalizeWordContentTables(clone);
  normalizeWordQuestionLines(clone);
  normalizeWordAnswerSpaces(clone);
  wrapWordSingleColumnQuestions(clone);
  convertWordQuestionsToTable(clone);
  return clone.outerHTML;
}

function exportWordDocument(mode) {
  if (!buildPrintDocument(mode)) return;

  const label = documentModeLabel(mode);
  const courseName = currentCourse().name || "Ders";
  const title = `${courseName} ${label}`;
  const documentHtml = prepareWordPrintHtml();
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>${wordDocumentStyles()}</style>
</head>
<body>
  <div class="WordSection1">
    ${documentHtml}
  </div>
</body>
</html>`;

  const fileName = safeFileName(`${courseName}-${label}-${new Date().toISOString().slice(0, 10)}`);
  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
  downloadBlob(blob, `${fileName}.doc`);
  showToast(`${label} Word dosyası indirildi.`);
}

function backupSelectedModules() {
  return window.SorubankSettingsModule?.selectedBackupModules(Object.keys(BACKUP_MODULES)) || Object.keys(BACKUP_MODULES);
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
    trackingPlans: Array.isArray(studentTracking.plans) ? studentTracking.plans.length : 0,
    annualTemplates: Array.isArray(annualPlan.templates) ? annualPlan.templates.length : 0,
    annualGenerated: Array.isArray(annualPlan.generatedPlans) ? annualPlan.generatedPlans.length : 0,
    skillProfiles: skillProfileKeys.length
  };
}

function backupSummaryText(summary = {}) {
  return [
    `Soru Bankası: ${summary.courses || 0} ders, ${summary.questions || 0} soru, ${summary.curriculumItems || 0} kazanım`,
    `İME: ${summary.skillSchools || 0} okul, ${summary.skillBusinesses || 0} işletme, ${summary.skillStudents || 0} öğrenci`,
    `Kurs/Ders: ${summary.courseModules || 0} modül, ${summary.courseStudents || 0} öğrenci, ${summary.courseQuestions || 0} soru`,
    `Ders Takibi: ${summary.trackingClasses || 0} sınıf, ${summary.trackingLessons || 0} ders, ${summary.trackingStudents || 0} öğrenci, ${summary.trackingPlans || 0} yıllık plan`,
    `Yıllık Plan: ${summary.annualTemplates || 0} şablon, ${summary.annualGenerated || 0} üretilen plan`,
    `Profil/Ayar: ${summary.skillProfiles || 0} İME profil kaydı`
  ].join("\n");
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
  if (modulesToRestore.includes("student") && (summary.trackingClasses || summary.trackingLessons || summary.trackingStudents || summary.trackingPlans)) {
    lines.push(`<li><strong>Ders Takibi:</strong> ${summary.trackingClasses || 0} sınıf, ${summary.trackingLessons || 0} ders, ${summary.trackingStudents || 0} öğrenci, ${summary.trackingPlans || 0} yıllık plan</li>`);
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
      const mode = window.SorubankSettingsModule?.backupRestoreMode("replace") || "replace";
      await restoreBackupPackage(backup, mode);
    } catch {
      showToast("Bu dosya geçerli bir yedek dosyası gibi görünmüyor.", "error");
    } finally {
      window.SorubankSettingsModule?.clearImportInput();
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
  showToast("Hoş geldiniz! Demo hesapla giriş yapıldı.");
});
els.moduleHub.querySelectorAll("[data-module]").forEach((button) => {
  button.addEventListener("click", () => openModule(button.dataset.module));
});
els.mobileModuleHubBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleFloatingModuleSwitcher();
});
els.moduleFloatButtons?.forEach((button) => {
  button.addEventListener("click", () => handleFloatingModuleChoice(button.dataset.floatingModule));
});
document.addEventListener("click", (event) => {
  // Sol modül menüsünü dışarı tıklayınca kapat
  if (els.moduleFloatSwitcher && !els.moduleFloatSwitcher.contains(event.target)) {
    closeFloatingModuleSwitcher();
  }
  // Sağ gezinme menüsünü dışarı tıklayınca kapat
  const rightFab = document.getElementById("mobileNavFab");
  const rightPanel = document.getElementById("mobileNavPanel");
  if (rightPanel && !rightPanel.hidden && rightFab && !rightFab.contains(event.target) && !rightPanel.contains(event.target)) {
    rightPanel.hidden = true;
  }
  // Soru Bankası sağ menüsünü dışarı tıklayınca kapat
  const sidebar = document.querySelector("aside.sidebar");
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  if (sidebar && sidebar.classList.contains("is-expanded") && sidebarToggleBtn && !sidebarToggleBtn.contains(event.target) && !sidebar.contains(event.target)) {
    sidebar.classList.remove("is-expanded");
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeFloatingModuleSwitcher();
    const rightPanel = document.getElementById("mobileNavPanel");
    if (rightPanel) rightPanel.hidden = true;
    const sidebar = document.querySelector("aside.sidebar");
    if (sidebar) sidebar.classList.remove("is-expanded");
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
      const nextTheme = globalSettings.theme === "dark" ? "light" : "dark";
      globalSettings.theme = nextTheme;
      localStorage.setItem("sorubank:global-settings:v1", JSON.stringify(globalSettings));
      applyTheme(nextTheme);
      const themeSelect = document.querySelector("#appThemeSelect");
      if (themeSelect) themeSelect.value = nextTheme;
    });
  }
  window.CourseTrackingModule?.init({
    returnToModuleHub
  });
  window.StudentTrackingModule?.init({
    returnToModuleHub
  });
  window.AnnualPlanModule?.init({
    returnToModuleHub
  });
  window.SorubankSettingsModule?.init({
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
      sidebar.classList.toggle("is-expanded");
    });
  }

  setView(state.currentView || "bank");
  setAuthMode("register");
  renderAccessShell();
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
        
        // Hide Soru Bankası float panel
        const sidebar = document.querySelector("aside.sidebar");
        if (sidebar) sidebar.classList.remove("is-expanded");
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
    }
  }

  // Populate panel links
  function openPanel() {
    const select = getActiveSelect();
    if (!select || !linksContainer) return;
    
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
      });
      linksContainer.appendChild(btn);
    });
    
    if (panel) panel.hidden = false;
  }

  if (fab) {
    fab.addEventListener("click", (e) => {
      e.stopPropagation();
      if (panel) {
        if (!panel.hidden) {
          panel.hidden = true;
        } else {
          openPanel();
        }
      }
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", (e) => { e.stopPropagation(); if (panel) panel.hidden = true; });

  // 3. Module Float Panel close button handler
  const moduleCloseBtn = document.getElementById("mobileModulePanelCloseBtn");
  if (moduleCloseBtn) {
    moduleCloseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const mPanel = document.getElementById("moduleFloatPanel");
      if (mPanel) mPanel.hidden = true;
    });
  }
  
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







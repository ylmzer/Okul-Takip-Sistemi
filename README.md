# Okul Takip Sistemi (OTS)

Okul Takip Sistemi (OTS), öğretmenlerin ders, sınav, öğrenci, staj ve müfredat süreçlerini tek bir merkezden, internet olsun veya olmasın yönetebilmeleri için tasarlanmış **offline-first (öncelikli yerel)** ve **bulut senkronizasyonlu** modüler bir okul yönetim yardımcı uygulamasıdır.

---

## 📌 Modüler Yapı ve Özellikler

Uygulama, öğretmenlerin günlük okul işlerini kolaylaştırmak adına birbiriyle entegre çalışan 6 ana modülden oluşmaktadır:

### 1. Soru Bankası (Soru Havuzu ve Sınav Hazırlama)
* **Ders ve Soru Yönetimi:** Ders bazlı bağımsız soru havuzları oluşturma.
* **Çeşitli Soru Tipleri:** Klasik, çoktan seçmeli, doğru/yanlış ve kısa cevaplı soru hazırlama editörleri.
* **Zengin İçerik Desteği:** Soru ve cevap alanlarında gelişmiş metin düzenleme, resim ekleme ve tablo oluşturma desteği.
* **Müfredat Entegrasyonu:** Her soruya konu, kazanım, zorluk derecesi, sınıf düzeyi ve puan atama.
* **Akıllı Sınav Oluşturucu:** Sınav sepetine elle soru ekleme veya konu/zorluk filtresine göre rastgele soru seçtirme.
* **Yazdırma Motoru:** Resmi okul standartlarına uygun sınav kağıdı ve cevap anahtarını doğrudan tarayıcıdan yazdırma/PDF olarak kaydetme.

### 2. Ders ve Öğrenci Takibi
* **Öğrenci Listesi Yönetimi:** Sınıf bazlı öğrenci ekleme, Excel dosyasından hızlı öğrenci aktarımı.
* **Yoklama ve Devam Takibi:** Ders saatlerine göre kolay devam-devamsızlık kaydı tutma.
* **Ders İçi Performans:** Öğrencilerin ödev, proje ve ders içi katılım durumlarını puanlama ve izleme.

### 3. Beceri Eğitimi (İşletmede Mesleki Eğitim - İME)
* **Staj ve İşletme Takibi:** Koordinatör öğretmenlerin, stajyer öğrencilerin işletmelerdeki süreçlerini izleme paneli.
* **İş Dosyası ve Evrak Yönetimi:** Öğrencilerin haftalık iş dosyası teslim durumları ve koordinatör denetim raporları.
* **İşletme Bilgileri:** Staj yapılan kurumların iletişim, yetkili ve adres bilgilerinin yönetimi.

### 4. Kurs Takibi (DYK ve Ders Dışı Kurs Planlama)
* **Ders Planlama ve Zamanlama:** Hafta sonu Destekleme Yetiştirme Kursları (DYK) veya okul dışı ek kurs saatlerinin planlanması.
* **Katılım ve Takvim:** Kursa katılan öğrenci yoklamaları ve haftalık ders çizelgesi.

### 5. Yıllık Plan (Müfredat Planlama Sihirbazı)
* **Müfredat Kazanım Yönetimi:** MEB ders bilgi formlarından veya müfredat dosyalarından kazanımları otomatik okuma/içe aktarma.
* **Çalışma Takvimi:** MEB resmi iş takvimi ile uyumlu, haftalık bazda konu ve kazanım dağılımı yapma sihirbazı.
* **Plan Çıktısı:** Hazırlanan yıllık planları Excel formatında dışa aktarma.

### 6. Genel Ayarlar ve Yedekleme
* **Okul ve Öğretmen Profilleri:** Okul adı, eğitim-öğretim yılı ve öğretmen profillerinin düzenlenmesi.
* **Modüler Yedekleme:** Tüm uygulama verilerini veya sadece seçilen modülleri (örn. sadece Soru Bankası) tek tıkla JSON dosyası olarak indirme ve yedekten geri yükleme.
* **Bulut Senkronizasyonu:** Supabase altyapısı ile yerel verileri anında buluta yedekleme ve farklı cihazlardan ortak erişim.

---

## ⚡ Teknolojik Altyapı

* **Bağımsız Sunucu:** Sunucu tarafında hiçbir harici `npm` paketine veya kütüphanesine bağımlı olmayan, yerleşik Node.js HTTP modülleriyle çalışan ultra hafif `server.mjs` yapısı.
* **Offline-First (Öncelikli Yerel):** İnternet bağlantısı kesildiğinde dahi tarayıcı hafızasını (`localStorage`) kullanarak kesintisiz çalışma.
* **Otomatik Bulut Senkronizasyonu (Supabase):** Canlı ortama alındığında Supabase Auth ve Database API'leri ile kullanıcı bazlı gerçek zamanlı veri eşitleme.
* **PWA (Progressive Web App):** Güvenli bağlantılar (HTTPS) üzerinde çalışırken mobil cihazlara veya bilgisayara yerel bir uygulama gibi yüklenebilme, ana ekrana eklenebilme özelliği.

---

## 🚀 Kurulum ve Çalıştırma

### Yerel Çalıştırma
Uygulama herhangi bir bağımlılık kurulumu (npm install) gerektirmez. Sunucuyu başlatmak için:

```powershell
node server.mjs
```

Ardından tarayıcınızda `http://localhost:4173` adresini açarak uygulamayı kullanmaya başlayabilirsiniz.

### Supabase ve Canlı Yayın (Render vb. Platformlar)
1. **Supabase Projesi Açın:** [Supabase](https://supabase.com) üzerinde yeni bir proje oluşturun.
2. **Şemayı Yükleyin:** `supabase/schema.sql` dosyasındaki veritabanı şemasını Supabase SQL Editor içerisinde çalıştırın.
3. **Çevre Değişkenleri (Environment Variables):** Projeyi Render veya benzeri bir bulut sunucusunda yayınlarken aşağıdaki değişkenleri tanımlayın:
   * `SUPABASE_URL` = *(Supabase Proje URL'iniz)*
   * `SUPABASE_ANON_KEY` = *(Supabase Anon/Public Key'iniz)*
4. Sunucu canlıya alındığında, giriş ekranı otomatik olarak Supabase Auth üzerinden bulut giriş portalına dönüşecek ve yerel butonları gizleyerek tüm verilerinizi bu hesaba otomatik eşitleyecektir.

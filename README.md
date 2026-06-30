# Sorubank

Sorubank, öğretmenlerin ders bazlı soru havuzu oluşturması, klasik soruları zengin içerikle saklaması ve seçilen sorulardan yazdırılabilir sınav ile cevap anahtarı üretmesi için hazırlanmış ilk MVP uygulamasıdır.

## İlk sürümde olanlar

- Ders bazlı ayrı soru havuzları
- Ders ekleme, düzenleme ve silme
- Her ders için öğrenme birimi/kazanım yönetimi
- Ders bilgi formu PDF dosyasından öğrenme birimi/kazanım aktarma
- Klasik soru ve cevap anahtarı editörü
- Klasik, çoktan seçmeli, doğru/yanlış ve kısa cevap soru tipleri
- Soru tipine göre değişen cevap/seçenek alanları
- Soru ve cevap alanları için zengin metin araçları, görsel ve tablo desteği
- Ders bilgi formundan çıkarılmış öğrenme birimi/kazanım seçimleri
- Tablo ve görsel ekleme desteği
- Konu, kazanım, sınıf, zorluk, puan ve etiket alanları
- Arama ve filtreleme
- Elle sınava soru ekleme
- Konu/zorluk filtresiyle rastgele soru seçme
- Sorulara dönem/yazılı kapsam etiketi verme
- Havuz kartından hızlı puan güncelleme
- Dönem ve yazılı sınav sayısı seçimi
- Genel ayarlardan okul adı, öğretmen listesi ve eğitim öğretim yılı yönetimi
- Genel ayarlar içinde JSON yedek dışa/içe aktarma
- Resmi sınav üst bilgisi oluşturma
- Sınav kağıdı ve cevap anahtarı yazdırma
- Tarayıcıda kalıcı veri saklama
- JSON yedek dışa/içe aktarma
- Mobil uyumlu arayüz temeli

## Çalıştırma

Bu proje bağımlılıksız statik web uygulaması olarak başlatıldı. Codex çalışma zamanı ile:

```powershell
& "C:\Users\eyilm\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\server.mjs
```

Ardından `http://localhost:4173` adresini açın.

İsterseniz `index.html` dosyasını doğrudan tarayıcıda da açabilirsiniz.

## Supabase ve PWA kurulumu

1. Supabase Dashboard içinde yeni bir proje oluşturun.
2. `supabase/schema.sql` dosyasındaki SQL'i Supabase SQL Editor içinde çalıştırın.
3. Project Settings > API ekranından Project URL ve anon public key değerlerini alın.
4. Yerelde isterseniz uygulamadaki Ayarlar > Senkronizasyon alanına bu değerleri girin.
5. Vercel için `SUPABASE_URL` ve `SUPABASE_ANON_KEY` environment variable olarak ekleyin.
6. PWA dosyaları `manifest.webmanifest` ve `service-worker.js` ile hazırdır; HTTPS üzerinden açıldığında mobil cihazda ana ekrana eklenebilir.

Not: `supabase-config.example.js` dosyasını kopyalayıp `supabase-config.js` olarak doldurabilirsiniz. Bu dosya `.gitignore` içindedir; anahtarlar repoya eklenmez. Buradaki anon key tarayıcıda görünmesi normal olan public anahtardır, service role key kesinlikle kullanılmamalıdır.

## Gelecek geliştirme yönü

- Modül bazlı ayrı çalışma alanları
- Word/PDF dışa aktarma motoru
- Rubrik ve ayrıntılı puanlama
- Soru kullanım geçmişi
- Benzer soru kontrolü
- Çoktan seçmeli, doğru/yanlış ve boşluk doldurma soru tipleri
- PWA veya mobil uygulama
- AI destekli soru ve cevap anahtarı taslakları

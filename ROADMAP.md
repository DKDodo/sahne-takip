# Sahne Takip — Yol haritası

Müzisyen için sahne ve ödeme takibi. İnşaat Takip ile aynı tema ve altyapı, çok daha sade. Bu liste kullanıcının istekleridir; her adım bitince işaretlenir.

Durum: ✅ bitti · 🔄 sürüyor · ⏳ sırada · ⏸ kullanıcı bekleniyor

## Kullanıcının istekleri (28 Ekim 2026)

| # | İstek | Durum |
|---|---|---|
| 1 | İnşaat Takip'e benzer, çok daha basit, ayrı bir program | ✅ `C:\Users\pc\Desktop\sahne_takip` |
| 2 | Hangi mekandan ne kadar aldım, hangi tarihte aldım | ✅ Alınan ödemeler (mekan, tarih, tutar) |
| 3 | Ne kadar alacağım var | ✅ Sahne ücreti − alınan = alacak; mekan bazında |
| 4 | Kime ne kadar gönderdim | ✅ Gönderilenler (kişi, tarih, tutar) |
| 5 | Mobil için (Android) | ✅ 412 × 915 ve 360 × 800'de denendi, yana taşma yok; "Yükle" düğmesi. Gerçek telefonda deneme Adım 3 |
| 6 | Telefon Windows bilgisayara bağlı | 🔄 Aynı adres bilgisayarda da açılır; karekodla telefona geçiş |
| 7 | Aynı tema yeterli | ✅ Sarı-siyah, açık/koyu tema, lamba düğmesi |
| 8 | Ad: "Sahne Takip"; imza yok | ✅ |
| 9 | Bulut olsun | ⏳ Ayrı Supabase projesi; e-posta + şifre ile giriş |
| 10 | Bölüşme hesabı | ✅ Sahne başına ekip payları ("eşit böl"); kime ne kadar borcum kaldı |
| 11 | Bu ay ne kadar kazandım | ✅ Pano'da ve Kazanç ekranında aylık |
| 12 | Commit ve yayın kullanıcı onayıyla | ⏸ Onaydan önce commit/push yok |

## Kararlar (28 Ekim 2026)

- **Kazanç iki türlü gösterilir:** *Bu ay kazancım* = o ay çıkılan sahnelerin ücreti − ekip payları (benim payım). *Bu ay elime geçen* = o ay alınan ödemeler − o ay gönderilenler.
- **Alacak:** Her mekana ödenen para önce o sahneye bağlıysa o sahneye, değilse en eski ödenmemiş sahneye sayılır. Sahne "Ödendi / Kısmen / Bekliyor" kendiliğinden görünür.
- **Pay borcu:** Kişiye gönderilen para aynı mantıkla o kişinin en eski payına sayılır.
- **EXE yok:** Telefon öncelikli. Bilgisayarda aynı adres Edge/Chrome ile açılır ve uygulama olarak yüklenebilir.

## Adımlar

### Adım 1 — Uygulama ✅
- Ekranlar: Pano, Sahneler (+ ayrıntı), Mekanlar (+ ekstre), Ekip (+ ekstre), Kazanç (aylık), Para (alınan / gönderilen), Silinenler, Ayarlar
- Hızlı giriş: alttaki "+" → Yeni sahne · Ödeme aldım · Para gönderdim
- Silinenler ve geri alma, yedek indir / yükle, Excel (CSV)
- Android 412 × 915 ve 360 × 800'de deneme: 32/32 (sahne, eşit böl, ödeme, gönderim, hesaplar, silme/geri alma, kalıcılık, koyu tema, yana taşma yok)
- Birim testleri: 25 (13 hesap, 12 bulut eşitleme)

### Adım 2 — Bulut ⏳
- Yeni Supabase projesi (kullanıcı açar), kurulum SQL'i, izinli e-posta, hesap, yeni hesap açmayı kapatma, publishable key

### Adım 3 — Yayın ⏳
- GitHub deposu `DKDodo/sahne-takip` (kullanıcı açar, herkese açık) → GitHub Actions (`.github/workflows/yayin.yml`) → GitHub Pages
- Depo ayarı: Settings → Pages → Source: GitHub Actions
- Android'de Chrome → Uygulamayı yükle

### Sonra (fikir havuzu)
- Sahne günü hatırlatması
- Yıllık özet

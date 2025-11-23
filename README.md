# 💰 Kumbara - Ortak Para Toplama Uygulaması

Kumbara, herkesin link üzerinden erişip para ekleyebileceği, toplam miktarı görebileceği ve katkıları listeleyebileceği modern bir web uygulamasıdır.

## ✨ Özellikler

- 🌐 Herkes linkten erişebilir
- 💵 Miktar ekleme
- 📋 Tüm katkıları listeleme
- 🗑️ Katkı silme
- 💰 Anlık toplam miktar gösterimi
- 📱 Mobil uyumlu modern tasarım
- 💾 SQLite veritabanı ile kalıcı veri saklama

## 🚀 Kurulum ve Çalıştırma

### 1. Gereksinimler

- Node.js (v14 veya üzeri)
- npm (Node.js ile birlikte gelir)

### 2. Bağımlılıkları Yükle

Terminalde proje klasörüne gidin ve şu komutu çalıştırın:

```bash
npm install
```

### 3. Uygulamayı Başlat

```bash
npm start
```

Veya geliştirme modu için (otomatik yeniden başlatma):

```bash
npm run dev
```

### 4. Uygulamaya Erişim

Tarayıcınızda şu adresi açın:

```
http://localhost:3000
```

## 🌍 İnternet Üzerinden Paylaşma (ÜCRETSİZ)

Uygulamanızı ücretsiz olarak internete açmak için detaylı kılavuz için **DEPLOY.md** dosyasına bakın.

### Hızlı Özet - Render (Önerilen):

1. **GitHub'a yükleyin** (git init, git add ., git commit, git push)
2. **Render.com'a kaydolun** (ücretsiz)
3. **GitHub repo'nuzu bağlayın** ve deploy edin
4. **Hazır!** Size verilen linki paylaşın (örnek: `https://kumbara.onrender.com`)

Detaylı adımlar için `DEPLOY.md` dosyasını okuyun!

## 📁 Proje Yapısı

```
kumbara/
├── server.js          # Express sunucu ve API
├── package.json       # Proje bağımlılıkları
├── kumbara.db         # SQLite veritabanı (otomatik oluşur)
├── public/
│   ├── index.html     # Ana sayfa
│   ├── style.css      # Stil dosyası
│   └── script.js      # Frontend JavaScript
└── README.md          # Bu dosya
```

## 🔧 API Endpoints

- `GET /api/total` - Toplam miktarı getir
- `GET /api/contributions` - Tüm katkıları getir
- `POST /api/contributions` - Yeni katkı ekle
- `DELETE /api/contributions/:id` - Katkı sil

## 💡 Kullanım İpuçları

- Veritabanı dosyası (`kumbara.db`) otomatik olarak oluşturulur
- Verileri sıfırlamak için `kumbara.db` dosyasını silebilirsiniz
- Port numarasını değiştirmek için `PORT` environment variable kullanın:
  ```bash
  PORT=8080 npm start
  ```

## 🛠️ Sorun Giderme

**Port zaten kullanımda hatası:**
- Farklı bir port kullanın: `PORT=3001 npm start`

**Veritabanı hatası:**
- `kumbara.db` dosyasını silin ve uygulamayı yeniden başlatın

**Bağımlılık hataları:**
- `node_modules` klasörünü silin ve `npm install` çalıştırın

## 📝 Lisans

MIT


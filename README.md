# Firebase + WhatsApp Notification API

REST API untuk mengirimkan notifikasi push menggunakan Firebase Cloud Messaging (FCM) dan WhatsApp dengan keamanan API Key.

## 📋 Daftar Isi

- [Fitur](#fitur)
- [Prerequisites](#prerequisites)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Keamanan API](#keamanan-api)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [API Endpoints](#api-endpoints)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Security](#security)

## ✨ Fitur

- ✅ Mengirim notifikasi push ke satu perangkat (FCM)
- ✅ Mengirim notifikasi push ke beberapa perangkat sekaligus (FCM)
- ✅ Mengirim notifikasi push ke topic (FCM)
- ✅ Subscribe/Unsubscribe perangkat ke/dari topic
- ✅ **Integrasi WhatsApp messaging dengan Baileys**
- ✅ **Dual messaging (FCM + WhatsApp)**
- ✅ **WhatsApp QR code untuk setup**
- ✅ **WhatsApp auto-reconnect**
- ✅ **Image/media sharing via WhatsApp**
- ✅ **WhatsApp Broadcast List (True Broadcast)**
- ✅ **WhatsApp Bulk Messaging**
- ✅ **API Key authentication**
- ✅ **Domain restriction**
- ✅ Validasi input dengan Joi
- ✅ Rate limiting untuk mencegah spam
- ✅ Error handling yang komprehensif
- ✅ CORS support
- ✅ Security headers dengan Helmet
- ✅ Health check endpoint
- ✅ Request logging
- ✅ Environment-based configuration

## 🔧 Prerequisites

- Node.js (v14 atau lebih baru)
- npm atau yarn
- Firebase project dengan Cloud Messaging enabled
- Firebase service account key
- WhatsApp account (untuk scanning QR code)

## 📦 Instalasi

1. Clone atau download project ini
2. Install dependencies:

```bash
npm install
```

## ⚙️ Konfigurasi

### 1. Environment Variables

Salin file `.env.example` ke `.env` dan sesuaikan konfigurasi:

```env
# Firebase Service Account Key
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebase-service-account.json

# Server Configuration
PORT=3000
NODE_ENV=development

# API Security Configuration
API_KEY_1=your-super-secret-api-key-here-12345
API_KEY_2=another-secret-api-key-67890
API_KEY_3=third-secret-api-key-abcdef

# Allowed domains for API access
ALLOWED_DOMAIN_1=https://yourdomain.com
ALLOWED_DOMAIN_2=https://www.yourdomain.com
ALLOWED_DOMAIN_3=https://localhost:3000
ALLOWED_DOMAIN_4=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 2. Firebase Service Account

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Pergi ke **Project Settings** > **Service accounts**
4. Klik **Generate new private key**
5. Download file JSON dan simpan sebagai `firebase-service-account.json` di root directory

### 3. Struktur File

```
api-firebase/
├── controllers/
│   └── notificationController.js
├── middleware/
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   ├── apiKeyAuth.js
│   └── upload.js
├── routes/
│   └── notificationRoutes.js
├── services/
│   ├── firebaseService.js
│   ├── whatsappService.js
│   └── db.js
├── validators/
│   └── notificationValidator.js
├── docs/
│   ├── API_AUTHENTICATION.md
│   └── ...
├── examples/
│   ├── client-example.js
│   └── test-interface.html
├── .env
├── .env.example
├── .gitignore
├── index.js
├── package.json
└── firebase-service-account.json
```

## 🔐 Keamanan API

API ini dilindungi dengan sistem keamanan berlapis:

### 1. API Key Authentication
Semua endpoint dilindungi memerlukan header `X-API-Key`:

```http
X-API-Key: your-secret-api-key
```

### 2. Domain Restriction
Hanya domain yang terdaftar di `ALLOWED_DOMAINS` yang dapat mengakses fully protected endpoints.

### 3. Rate Limiting
- 100 requests per 15 menit per API key
- Rate limit berdasarkan API key, bukan IP

### 4. Security Levels

**Public (Tanpa Auth):**
- `GET /api/health`

**API Key Only:**
- WhatsApp management endpoints (`/whatsapp/status`, `/whatsapp/qr`, etc.)

**Fully Protected (API Key + Domain + Rate Limit):**
- FCM endpoints (`/send-to-device`, `/send-to-topic`, etc.)
- WhatsApp messaging endpoints (`/whatsapp/send-message`, etc.)
- Dual messaging endpoints (`/send-dual-message`)

Baca dokumentasi lengkap di [API_AUTHENTICATION.md](./docs/API_AUTHENTICATION.md)

## 🚀 Menjalankan Aplikasi

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📍 API Endpoints

### Base URL
```
http://localhost:3000/api/notifications
```

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Firebase Notification API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. Kirim ke Satu Perangkat
```http
POST /send-to-device
```

**Request Body:**
```json
{
  "token": "fcm_token_perangkat",
  "notification": {
    "title": "Judul Notifikasi",
    "body": "Isi pesan notifikasi",
    "imageUrl": "https://example.com/image.jpg" // opsional
  },
  "data": { // opsional
    "key1": "value1",
    "key2": "value2"
  }
}
```

### 3. Kirim ke Beberapa Perangkat
```http
POST /send-to-multiple-devices
```

**Request Body:**
```json
{
  "tokens": ["token1", "token2", "token3"],
  "notification": {
    "title": "Judul Notifikasi",
    "body": "Isi pesan notifikasi",
    "imageUrl": "https://example.com/image.jpg"
  },
  "data": {
    "key1": "value1"
  }
}
```

### 4. Kirim ke Topic
```http
POST /send-to-topic
```

**Request Body:**
```json
{
  "topic": "news",
  "notification": {
    "title": "Breaking News",
    "body": "Berita terbaru hari ini",
    "imageUrl": "https://example.com/news.jpg"
  },
  "data": {
    "category": "news",
    "timestamp": "2024-01-01"
  }
}
```

### 5. Subscribe ke Topic
```http
POST /subscribe-to-topic
```

**Request Body:**
```json
{
  "tokens": ["token1", "token2"], // atau string tunggal
  "topic": "news"
}
```

### 6. Unsubscribe dari Topic
```http
POST /unsubscribe-from-topic
```

**Request Body:**
```json
{
  "tokens": ["token1", "token2"],
  "topic": "news"
}
```

## 💡 Contoh Penggunaan

### Menggunakan cURL

#### Kirim notifikasi ke satu perangkat:
```bash
curl -X POST http://localhost:3000/api/notifications/send-to-device \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your_fcm_token_here",
    "notification": {
      "title": "Halo!",
      "body": "Ini adalah notifikasi test"
    }
  }'
```

#### Kirim notifikasi ke topic:
```bash
curl -X POST http://localhost:3000/api/notifications/send-to-topic \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "general",
    "notification": {
      "title": "Pengumuman",
      "body": "Ada pengumuman penting untuk semua pengguna"
    }
  }'
```

### Menggunakan JavaScript (Frontend)

```javascript
const sendNotification = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/notifications/send-to-device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'fcm_token_here',
        notification: {
          title: 'Notifikasi dari Web',
          body: 'Pesan dikirim dari aplikasi web'
        },
        data: {
          source: 'web_app',
          timestamp: new Date().toISOString()
        }
      })
    });

    const result = await response.json();
    console.log('Notifikasi terkirim:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Menggunakan Node.js

```javascript
const axios = require('axios');

const sendNotificationToTopic = async () => {
  try {
    const response = await axios.post('http://localhost:3000/api/notifications/send-to-topic', {
      topic: 'promotions',
      notification: {
        title: 'Promo Spesial!',
        body: 'Dapatkan diskon 50% untuk semua produk',
        imageUrl: 'https://example.com/promo.jpg'
      },
      data: {
        promo_code: 'SAVE50',
        valid_until: '2024-12-31'
      }
    });

    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};
```

## ❌ Error Handling

API menggunakan status code HTTP standar dan mengembalikan response error dalam format JSON:

```json
{
  "success": false,
  "message": "Deskripsi error",
  "errors": [ // untuk validation errors
    {
      "field": "notification.title",
      "message": "Title notifikasi wajib diisi"
    }
  ]
}
```

### Common Error Codes:

- `400` - Bad Request (validation error, invalid token, dll)
- `401` - Unauthorized 
- `404` - Not Found (token tidak terdaftar)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Firebase-specific Errors:

- `messaging/invalid-registration-token` - FCM token tidak valid
- `messaging/registration-token-not-registered` - FCM token tidak terdaftar
- `messaging/invalid-argument` - Parameter tidak valid
- `messaging/message-rate-exceeded` - Rate limit Firebase terlampaui

## 🚦 Rate Limiting

API menggunakan rate limiting untuk mencegah abuse:

- **General endpoints**: 100 requests per 15 menit
- **Send notifications**: 10 requests per menit  
- **Multiple devices**: 5 requests per 5 menit
- **Topic operations**: 20 requests per 10 menit

## 🔒 Security

- **Helmet.js**: Security headers
- **CORS**: Konfigurasi domain yang diizinkan
- **Rate Limiting**: Mencegah spam requests
- **Input Validation**: Validasi semua input dengan Joi
- **Error Handling**: Tidak mengekspos sensitive information di production

## 🧪 Testing

Anda dapat menggunakan tools seperti:
- Postman
- Insomnia  
- cURL
- Thunder Client (VS Code extension)

Import collection Postman atau gunakan contoh cURL di atas untuk testing.

## 📝 Catatan Penting

1. **Firebase Service Account**: Jangan commit file `firebase-service-account.json` ke git
2. **FCM Tokens**: Token FCM dapat expired, implementasikan refresh token di client
3. **Topics**: Nama topic harus mengikuti aturan Firebase (alfanumerik, -, _, ., ~, %)
4. **Rate Limits**: Sesuaikan rate limit sesuai kebutuhan aplikasi Anda
5. **CORS**: Konfigurasi CORS sesuai domain aplikasi client Anda

## 🤝 Kontribusi

1. Fork project ini
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Project ini menggunakan MIT License.

---

**Happy Coding! 🚀**

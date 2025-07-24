# Setup Guide - Firebase Notification API

## 📋 Prerequisites

Sebelum memulai, pastikan Anda memiliki:

1. **Node.js** (v14 atau lebih baru)
2. **npm** atau **yarn**
3. **Firebase Project** dengan Cloud Messaging enabled
4. **FCM Service Account Key**

## 🚀 Step-by-Step Setup

### 1. Setup Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Aktifkan **Cloud Messaging**:
   - Pergi ke **Project Settings** > **Cloud Messaging**
   - Catat **Server Key** (untuk referensi)

### 2. Generate Service Account Key

1. Di Firebase Console, pergi ke **Project Settings**
2. Klik tab **Service accounts**
3. Pilih **Node.js** sebagai language
4. Klik **Generate new private key**
5. Download file JSON yang dihasilkan
6. Rename file menjadi `firebase-service-account.json`
7. Letakkan file di root directory project

### 3. Install Dependencies

```bash
cd Api-Firebase
npm install
```

### 4. Environment Configuration

1. Copy file `.env` yang sudah ada
2. Sesuaikan konfigurasi sesuai kebutuhan:

```env
# Firebase Service Account Key
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebase-service-account.json

# Server Configuration
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 5. Test Configuration

Jalankan API untuk memastikan konfigurasi benar:

```bash
npm run dev
```

Akses: `http://localhost:3000/api/notifications/health`

Jika berhasil, Anda akan mendapat response:
```json
{
  "success": true,
  "message": "Firebase Notification API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## 🧪 Testing Setup

### Option 1: Menggunakan Postman

1. Import file `docs/postman-collection.json`
2. Set environment variables:
   - `fcm_token`: Token FCM perangkat untuk testing
   - `topic_name`: Nama topic untuk testing
3. Run collection tests

### Option 2: Menggunakan cURL

Test basic functionality:

```bash
# Health check
curl http://localhost:3000/api/notifications/health

# Send notification (ganti YOUR_FCM_TOKEN)
curl -X POST http://localhost:3000/api/notifications/send-to-device \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_FCM_TOKEN",
    "notification": {
      "title": "Test",
      "body": "Setup berhasil!"
    }
  }'
```

## 📱 Mendapatkan FCM Token

### Untuk Android App:

```javascript
import { getMessaging, getToken } from "firebase/messaging";

const messaging = getMessaging();
getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' }).then((currentToken) => {
  if (currentToken) {
    console.log('FCM Token:', currentToken);
  }
});
```

### Untuk Web App:

```javascript
// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

// Firebase config
const firebaseConfig = {
  // Your config
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Get FCM token
getToken(messaging, { 
  vapidKey: 'YOUR_VAPID_KEY' 
}).then((currentToken) => {
  if (currentToken) {
    console.log('FCM Token:', currentToken);
  } else {
    console.log('No registration token available.');
  }
}).catch((err) => {
  console.log('An error occurred while retrieving token. ', err);
});
```

## 🔧 Production Setup

### 1. Environment Variables

Untuk production, set environment variables:

```bash
export NODE_ENV=production
export PORT=3000
export FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/path/to/service-account.json
export ALLOWED_ORIGINS=https://yourapp.com,https://yourdomain.com
```

### 2. Process Manager (PM2)

Install PM2:
```bash
npm install -g pm2
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'firebase-notification-api',
    script: 'index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js --env production
```

### 3. Nginx Configuration

Example Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ⚠️ Security Checklist

- [ ] Service account key tidak di-commit ke git
- [ ] Environment variables di-set dengan benar
- [ ] CORS dikonfigurasi untuk domain yang tepat
- [ ] Rate limiting aktif
- [ ] HTTPS enabled di production
- [ ] Firewall rules dikonfigurasi
- [ ] Log monitoring di-setup

## 📊 Monitoring

### Health Check Endpoint

Setup monitoring untuk endpoint:
- `GET /api/notifications/health`

### Log Monitoring

API menggunakan console.log untuk logging. Di production, gunakan proper logging service seperti:
- Winston + ELK Stack
- CloudWatch (AWS)
- Stackdriver (GCP)

### Performance Monitoring

Monitor metrics:
- Response time
- Error rate
- FCM delivery rate
- Rate limit hits

## 🚨 Troubleshooting

### Common Issues:

1. **"Failed to initialize Firebase Admin SDK"**
   - Pastikan path service account key benar
   - Pastikan file service account key valid

2. **"messaging/invalid-registration-token"**
   - FCM token tidak valid atau expired
   - Generate token baru dari client app

3. **"Not allowed by CORS"**
   - Tambahkan domain ke ALLOWED_ORIGINS
   - Pastikan CORS configuration benar

4. **Rate limit exceeded**
   - Tunggu window rate limit reset
   - Sesuaikan rate limit configuration

### Debug Mode

Untuk debugging, set environment:
```bash
NODE_ENV=development
```

Ini akan menampilkan:
- Detailed error messages
- Stack traces
- Request/response logs

## 📞 Support

Jika mengalami masalah:

1. Check logs untuk error messages
2. Verify Firebase service account permissions
3. Test dengan Postman collection
4. Check firewall/network connectivity

Untuk bantuan lebih lanjut, buat issue di repository atau hubungi tim development.

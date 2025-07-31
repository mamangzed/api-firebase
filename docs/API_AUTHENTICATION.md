# API Authentication Guide

## Overview
API ini dilindungi dengan sistem API Key authentication dan domain restriction untuk memastikan hanya klien yang diotorisasi yang dapat mengakses endpoint.

## Authentication Headers

Semua request ke endpoint yang dilindungi harus menyertakan header:

```
X-API-Key: your-secret-api-key
```

## Security Levels

### 1. Public Endpoints (Tanpa Autentikasi)
- `GET /api/health` - Health check

### 2. API Key Only
- `POST /api/whatsapp/initialize` - Inisialisasi WhatsApp
- `GET /api/whatsapp/status` - Status koneksi WhatsApp
- `POST /api/whatsapp/reconnect` - Reconnect WhatsApp
- `GET /api/whatsapp/qr` - QR Code text
- `GET /api/whatsapp/qr/image` - QR Code image

### 3. Fully Protected (API Key + Domain Restriction + Rate Limiting)
- `POST /api/send-to-device` - Kirim notifikasi FCM
- `POST /api/send-to-multiple-devices` - Kirim ke multiple FCM
- `POST /api/send-to-topic` - Kirim ke topic FCM
- `POST /api/subscribe-to-topic` - Subscribe topic
- `POST /api/unsubscribe-from-topic` - Unsubscribe topic
- `POST /api/register-fcm-token` - Register FCM token
- `POST /api/send-dual-message` - Kirim ke FCM + WhatsApp
- `POST /api/whatsapp/send-message` - Universal WhatsApp message
- `POST /api/whatsapp/send` - Text WhatsApp message
- `POST /api/whatsapp/send-image` - Image WhatsApp message
- `POST /api/whatsapp/send-image-url` - Image dari URL

## Rate Limiting
- 100 requests per 15 menit per API key
- Rate limit berdasarkan API key, bukan IP

## Domain Restriction
Hanya domain yang terdaftar dalam `ALLOWED_DOMAINS` yang dapat mengakses fully protected endpoints.

## Example Usage

### JavaScript (Frontend)
```javascript
const apiKey = 'your-secret-api-key';

// Kirim pesan WhatsApp
const response = await fetch('/api/whatsapp/send-message', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
    },
    body: JSON.stringify({
        phoneNumber: '081234567890',
        message: 'Hello from API!'
    })
});

const result = await response.json();
console.log(result);
```

### cURL
```bash
# Kirim notifikasi FCM
curl -X POST http://localhost:3000/api/send-to-device \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "token": "fcm-token-here",
    "notification": {
      "title": "Test Notification",
      "body": "This is a test message"
    }
  }'

# Kirim pesan WhatsApp universal
curl -X POST http://localhost:3000/api/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "phoneNumber": "081234567890",
    "message": "Hello WhatsApp!"
  }'

# Kirim image WhatsApp dari URL
curl -X POST http://localhost:3000/api/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "phoneNumber": "081234567890",
    "imageUrl": "https://example.com/image.jpg",
    "caption": "Check out this image!"
  }'
```

### Postman
1. Buat request baru
2. Set method ke POST
3. Masukkan URL endpoint
4. Di Headers tab, tambahkan:
   - Key: `X-API-Key`
   - Value: `your-secret-api-key`
5. Di Body tab, pilih raw dan JSON
6. Masukkan data JSON sesuai endpoint

## Response Codes

### Success Responses
- `200` - OK, request berhasil
- `201` - Created, resource berhasil dibuat

### Error Responses
- `401` - Unauthorized
  - Missing API key: `{"error": "API key is required", "message": "Please provide X-API-Key header"}`
  - Invalid API key: `{"error": "Invalid API key", "message": "The provided API key is not valid"}`
- `403` - Forbidden
  - Domain not allowed: `{"error": "Access denied", "message": "This domain is not authorized to access this API"}`
- `429` - Too Many Requests
  - Rate limit exceeded: `{"error": "Too many requests from this API key", "retryAfter": "15 minutes"}`
- `400` - Bad Request - Data tidak valid
- `500` - Internal Server Error - Kesalahan server

## Setup Environment Variables

Copy `.env.example` ke `.env` dan sesuaikan nilai-nilai berikut:

```env
# API Keys (gunakan string yang kuat dan unik)
API_KEY_1=your-super-secret-api-key-here-12345
API_KEY_2=another-secret-api-key-67890

# Domain yang diizinkan
ALLOWED_DOMAIN_1=https://yourdomain.com
ALLOWED_DOMAIN_2=https://localhost:3000
ALLOWED_DOMAIN_3=http://localhost:3000
```

## Security Best Practices

1. **API Key Management**
   - Gunakan API key yang panjang dan rumit
   - Jangan hardcode API key di frontend code
   - Rotasi API key secara berkala
   - Simpan API key di environment variables

2. **Domain Restriction**
   - Hanya tambahkan domain yang benar-benar diperlukan
   - Gunakan HTTPS untuk production
   - Hindari wildcard domain

3. **Rate Limiting**
   - Monitor penggunaan API secara berkala
   - Sesuaikan rate limit berdasarkan kebutuhan
   - Implementasi retry logic dengan exponential backoff

4. **Logging**
   - Semua API usage akan di-log secara otomatis
   - Monitor log untuk aktivitas mencurigakan
   - Jangan log API key secara penuh (hanya 8 karakter pertama)

## Troubleshooting

### "API key is required"
- Pastikan header `X-API-Key` disertakan
- Cek spelling header name

### "Invalid API key"
- Pastikan API key sesuai dengan yang ada di `.env`
- Cek tidak ada trailing spaces

### "Access denied"
- Pastikan domain Anda terdaftar di `ALLOWED_DOMAINS`
- Cek protocol (http/https) sesuai
- Request tanpa origin (seperti Postman) biasanya diizinkan

### "Too many requests"
- Tunggu 15 menit atau gunakan API key lain
- Implementasi retry dengan delay
- Optimasi frekuensi request

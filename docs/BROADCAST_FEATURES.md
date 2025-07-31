# WhatsApp Broadcast Features

API ini mendukung dua jenis broadcast WhatsApp:

## 1. Bulk Messaging (Individual Messages)
Mengirim pesan ke multiple nomor satu per satu. Setiap penerima menerima pesan individual.

### Endpoints:
- `POST /api/whatsapp/broadcast` - Bulk text messages
- `POST /api/whatsapp/broadcast-image` - Bulk image messages

### Contoh Bulk Text Message:
```bash
curl -X POST http://localhost:3000/api/whatsapp/broadcast \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "phoneNumbers": ["081234567890", "081234567891", "081234567892"],
    "message": "Hello! This is a bulk message."
  }'
```

### Contoh Bulk Image Message:
```bash
curl -X POST http://localhost:3000/api/whatsapp/broadcast-image \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "phoneNumbers": ["081234567890", "081234567891"],
    "imageUrl": "https://example.com/promo.jpg",
    "caption": "Check out our latest promotion!"
  }'
```

### Karakteristik:
- ✅ Maksimal 100 nomor per request (text)
- ✅ Maksimal 50 nomor per request (image)
- ✅ Delay otomatis antar pengiriman (1-2 detik)
- ✅ Detailed response per nomor
- ⚠️ Setiap penerima mendapat pesan individual

## 2. WhatsApp Broadcast List (True Broadcast)
Menggunakan fitur broadcast list asli WhatsApp. Semua penerima dalam satu list menerima pesan yang sama.

### Endpoints:
- `POST /api/whatsapp/broadcast-list/create` - Buat broadcast list
- `GET /api/whatsapp/broadcast-list` - List semua broadcast lists
- `POST /api/whatsapp/broadcast-list/send` - Kirim text ke broadcast list
- `POST /api/whatsapp/broadcast-list/send-image` - Kirim image ke broadcast list
- `PUT /api/whatsapp/broadcast-list/participants` - Update participants
- `DELETE /api/whatsapp/broadcast-list/:id` - Hapus broadcast list

### Workflow Broadcast List:

#### 1. Buat Broadcast List:
```bash
curl -X POST http://localhost:3000/api/whatsapp/broadcast-list/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "name": "Marketing Updates",
    "recipients": ["081234567890", "081234567891", "081234567892"]
  }'
```

Response:
```json
{
  "success": true,
  "message": "Broadcast list created successfully",
  "data": {
    "success": true,
    "broadcastId": "120363049317329393@g.us",
    "name": "Marketing Updates",
    "recipients": 3,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. Kirim Pesan ke Broadcast List:
```bash
curl -X POST http://localhost:3000/api/whatsapp/broadcast-list/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "broadcastId": "120363049317329393@g.us",
    "message": "Hello everyone! This is a broadcast message."
  }'
```

#### 3. Kirim Image ke Broadcast List:
```bash
curl -X POST http://localhost:3000/api/whatsapp/broadcast-list/send-image \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "broadcastId": "120363049317329393@g.us",
    "imageUrl": "https://example.com/image.jpg",
    "caption": "Check this out!"
  }'
```

#### 4. Update Participants:
```bash
# Add participants
curl -X PUT http://localhost:3000/api/whatsapp/broadcast-list/participants \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "broadcastId": "120363049317329393@g.us",
    "action": "add",
    "participants": ["081234567893", "081234567894"]
  }'

# Remove participants  
curl -X PUT http://localhost:3000/api/whatsapp/broadcast-list/participants \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "broadcastId": "120363049317329393@g.us",
    "action": "remove",
    "participants": ["081234567893"]
  }'
```

#### 5. List Broadcast Lists:
```bash
curl -X GET http://localhost:3000/api/whatsapp/broadcast-list \
  -H "X-API-Key: your-secret-api-key"
```

#### 6. Hapus Broadcast List:
```bash
curl -X DELETE http://localhost:3000/api/whatsapp/broadcast-list/120363049317329393@g.us \
  -H "X-API-Key: your-secret-api-key"
```

### Karakteristik Broadcast List:
- ✅ Maksimal 256 recipients per broadcast list
- ✅ Menggunakan fitur broadcast asli WhatsApp
- ✅ Hanya kontak yang sudah save nomor Anda yang bisa menerima
- ✅ Lebih efisien untuk grup besar
- ✅ Persistent - list tetap ada sampai dihapus

## Perbandingan

| Feature | Bulk Messaging | Broadcast List |
|---------|----------------|----------------|
| Max Recipients | 100 (text), 50 (image) | 256 |
| Delivery Method | Individual messages | True broadcast |
| WhatsApp Requirement | None | Recipients must have saved your number |
| Persistence | No | Yes, until deleted |
| API Calls | 1 per batch | 1 per message to all |
| Rate Limiting | Built-in delays | WhatsApp native |
| Use Case | One-time bulk sending | Regular broadcasts to subscribers |

## JavaScript Client Examples

```javascript
const apiClient = new NotificationApiClient('your-api-key');

// Bulk messaging
const bulkResult = await apiClient.sendWhatsAppBroadcast(
  ['081234567890', '081234567891'],
  'Bulk message to all'
);

// Broadcast list workflow
const listResult = await apiClient.createBroadcastList(
  'Newsletter',
  ['081234567890', '081234567891', '081234567892']
);

const broadcastId = listResult.data.broadcastId;

await apiClient.sendToBroadcastList(
  broadcastId,
  'Newsletter message to subscribers'
);

await apiClient.sendImageToBroadcastList(
  broadcastId,
  'https://example.com/newsletter.jpg',
  'Monthly newsletter image'
);
```

## Error Handling

### Common Errors:
- `400` - Invalid phone numbers format
- `400` - Too many recipients
- `401` - Invalid API key
- `403` - Domain not allowed
- `404` - Broadcast list not found
- `500` - WhatsApp connection error

### Response Format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Best Practices

### Bulk Messaging:
1. **Limit Recipients**: Jangan kirim ke terlalu banyak nomor sekaligus
2. **Valid Numbers**: Pastikan format nomor valid
3. **Rate Limiting**: Gunakan delay antar batch
4. **Error Handling**: Handle failed deliveries per nomor

### Broadcast List:
1. **Contact Requirement**: Pastikan recipients sudah save nomor Anda
2. **List Management**: Buat list berdasarkan kategori/topic
3. **Regular Cleanup**: Hapus list yang tidak digunakan
4. **Participant Management**: Update participants secara berkala

### Security:
1. **API Key**: Jangan expose API key di client-side
2. **Domain Restriction**: Gunakan domain whitelist
3. **Rate Monitoring**: Monitor usage untuk deteksi abuse
4. **Input Validation**: Validasi semua input di client dan server

// API Client untuk Firebase + WhatsApp API
class NotificationApiClient {
    constructor(apiKey, baseUrl = 'http://localhost:3000/api') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    // Private method untuk membuat request headers
    _getHeaders(additionalHeaders = {}) {
        return {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            ...additionalHeaders
        };
    }

    // Private method untuk handle response
    async _handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'API request failed');
        }
        
        return data;
    }

    // Health check
    async healthCheck() {
        const response = await fetch(`${this.baseUrl}/health`);
        return this._handleResponse(response);
    }

    // FCM Methods
    async sendToDevice(token, notification, data = null) {
        const response = await fetch(`${this.baseUrl}/send-to-device`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({
                token,
                notification,
                data
            })
        });
        return this._handleResponse(response);
    }

    async sendToMultipleDevices(tokens, notification, data = null) {
        const response = await fetch(`${this.baseUrl}/send-to-multiple-devices`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({
                tokens,
                notification,
                data
            })
        });
        return this._handleResponse(response);
    }

    async sendToTopic(topic, notification, data = null) {
        const response = await fetch(`${this.baseUrl}/send-to-topic`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({
                topic,
                notification,
                data
            })
        });
        return this._handleResponse(response);
    }

    async subscribeToTopic(token, topic) {
        const response = await fetch(`${this.baseUrl}/subscribe-to-topic`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({
                token,
                topic
            })
        });
        return this._handleResponse(response);
    }

    async unsubscribeFromTopic(token, topic) {
        const response = await fetch(`${this.baseUrl}/unsubscribe-from-topic`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({
                token,
                topic
            })
        });
        return this._handleResponse(response);
    }

    async registerFcmToken(userId, token, deviceInfo = {}) {
        const response = await fetch(`${this.baseUrl}/register-fcm-token`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({
                userId,
                token,
                deviceInfo
            })
        });
        return this._handleResponse(response);
    }

    // WhatsApp Methods
    async initializeWhatsApp() {
        const response = await fetch(`${this.baseUrl}/whatsapp/initialize`, {
            method: 'POST',
            headers: this._getHeaders()
        });
        return this._handleResponse(response);
    }

    async getWhatsAppStatus() {
        const response = await fetch(`${this.baseUrl}/whatsapp/status`, {
            headers: this._getHeaders()
        });
        return this._handleResponse(response);
    }

    async reconnectWhatsApp() {
        const response = await fetch(`${this.baseUrl}/whatsapp/reconnect`, {
            method: 'POST',
            headers: this._getHeaders()
        });
        return this._handleResponse(response);
    }

    async getWhatsAppQR() {
        const response = await fetch(`${this.baseUrl}/whatsapp/qr`, {
            headers: this._getHeaders()
        });
        return this._handleResponse(response);
    }

    async getWhatsAppQRImage() {
        const response = await fetch(`${this.baseUrl}/whatsapp/qr/image`, {
            headers: this._getHeaders()
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to get QR image');
        }
        
        return response.blob(); // Return image blob
    }

    // Universal WhatsApp message (text or image)
    async sendWhatsAppMessage(phoneNumber, options = {}) {
        const payload = {
            phoneNumber,
            ...options
        };

        const response = await fetch(`${this.baseUrl}/whatsapp/send-message`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify(payload)
        });
        return this._handleResponse(response);
    }

    // Specific WhatsApp methods
    async sendWhatsAppText(phoneNumber, message) {
        return this.sendWhatsAppMessage(phoneNumber, { message });
    }

    async sendWhatsAppImageFromUrl(phoneNumber, imageUrl, caption = '') {
        return this.sendWhatsAppMessage(phoneNumber, { imageUrl, caption });
    }

    async sendWhatsAppImageFile(phoneNumber, imageFile, caption = '') {
        const formData = new FormData();
        formData.append('phoneNumber', phoneNumber);
        formData.append('caption', caption);
        formData.append('image', imageFile);

        const response = await fetch(`${this.baseUrl}/whatsapp/send-image`, {
            method: 'POST',
            headers: {
                'X-API-Key': this.apiKey
                // Don't set Content-Type, let browser set it with boundary for FormData
            },
            body: formData
        });
        return this._handleResponse(response);
    }

    // WhatsApp broadcast (bulk messaging) methods
    async sendWhatsAppBroadcast(phoneNumbers, message) {
        const response = await fetch(`${this.baseUrl}/whatsapp/broadcast`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({
                phoneNumbers,
                message
            })
        });
        return this._handleResponse(response);
    }

    async sendWhatsAppBroadcastImage(phoneNumbers, imageUrl, caption = '') {
        const response = await fetch(`${this.baseUrl}/whatsapp/broadcast-image`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({
                phoneNumbers,
                imageUrl,
                caption
            })
        });
        return this._handleResponse(response);
    }

    // WhatsApp broadcast list (true broadcast) methods
    async createBroadcastList(name, recipients) {
        const response = await fetch(`${this.baseUrl}/whatsapp/broadcast-list/create`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({
                name,
                recipients
            })
        });
        return this._handleResponse(response);
    }

    async getBroadcastLists() {
        const response = await fetch(`${this.baseUrl}/whatsapp/broadcast-list`, {
            headers: this._getHeaders()
        });
        return this._handleResponse(response);
    }

    async sendToBroadcastList(broadcastId, message) {
        const response = await fetch(`${this.baseUrl}/whatsapp/broadcast-list/send`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({
                broadcastId,
                message
            })
        });
        return this._handleResponse(response);
    }

    async sendImageToBroadcastList(broadcastId, imageUrl, caption = '') {
        const response = await fetch(`${this.baseUrl}/whatsapp/broadcast-list/send-image`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({
                broadcastId,
                imageUrl,
                caption
            })
        });
        return this._handleResponse(response);
    }

    async deleteBroadcastList(broadcastId) {
        const response = await fetch(`${this.baseUrl}/whatsapp/broadcast-list/${broadcastId}`, {
            method: 'DELETE',
            headers: this._getHeaders()
        });
        return this._handleResponse(response);
    }

    async updateBroadcastListParticipants(broadcastId, action, participants) {
        const response = await fetch(`${this.baseUrl}/whatsapp/broadcast-list/participants`, {
            method: 'PUT',
            headers: this._getHeaders(),
            body: JSON.stringify({
                broadcastId,
                action,
                participants
            })
        });
        return this._handleResponse(response);
    }

    // Dual messaging (FCM + WhatsApp)
    async sendDualMessage(fcmToken, phoneNumber, notification, whatsappMessage = null) {
        const response = await fetch(`${this.baseUrl}/send-dual-message`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({
                fcmToken,
                phoneNumber,
                notification,
                whatsappMessage: whatsappMessage || notification.body
            })
        });
        return this._handleResponse(response);
    }

    // Utility method with retry logic
    async sendWithRetry(method, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await method();
            } catch (error) {
                lastError = error;
                
                // Don't retry on authentication errors
                if (error.message.includes('API key') || error.message.includes('Access denied')) {
                    throw error;
                }
                
                // Don't retry on last attempt
                if (attempt === maxRetries) {
                    break;
                }
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
        
        throw lastError;
    }
}

// Usage Examples
const apiClient = new NotificationApiClient('your-secret-api-key');

// Example: Send FCM notification
async function sendFCMNotification() {
    try {
        const result = await apiClient.sendToDevice(
            'fcm-token-here',
            {
                title: 'Hello!',
                body: 'This is a test notification'
            },
            {
                customData: 'some-value'
            }
        );
        console.log('FCM sent:', result);
    } catch (error) {
        console.error('Error sending FCM:', error.message);
    }
}

// Example: Send WhatsApp text message
async function sendWhatsAppText() {
    try {
        const result = await apiClient.sendWhatsAppText(
            '081234567890',
            'Hello from WhatsApp API!'
        );
        console.log('WhatsApp sent:', result);
    } catch (error) {
        console.error('Error sending WhatsApp:', error.message);
    }
}

// Example: Send WhatsApp image from URL
async function sendWhatsAppImage() {
    try {
        const result = await apiClient.sendWhatsAppImageFromUrl(
            '081234567890',
            'https://example.com/image.jpg',
            'Check out this image!'
        );
        console.log('WhatsApp image sent:', result);
    } catch (error) {
        console.error('Error sending WhatsApp image:', error.message);
    }
}

// Example: Send dual message (FCM + WhatsApp)
async function sendDualNotification() {
    try {
        const result = await apiClient.sendDualMessage(
            'fcm-token-here',
            '081234567890',
            {
                title: 'Important Notice',
                body: 'You have a new message'
            },
            'You have a new message via WhatsApp too!'
        );
        console.log('Dual message sent:', result);
    } catch (error) {
        console.error('Error sending dual message:', error.message);
    }
}

// Example: Get WhatsApp QR for setup
async function setupWhatsApp() {
    try {
        // Initialize WhatsApp
        await apiClient.initializeWhatsApp();
        
        // Check status
        const status = await apiClient.getWhatsAppStatus();
        console.log('WhatsApp status:', status);
        
        // If not connected, get QR code
        if (!status.isConnected && status.hasQR) {
            const qr = await apiClient.getWhatsAppQR();
            console.log('QR Code:', qr.qr);
            
            // Or get QR as image
            const qrImage = await apiClient.getWhatsAppQRImage();
            const qrUrl = URL.createObjectURL(qrImage);
            
            // Display QR image in HTML
            const img = document.createElement('img');
            img.src = qrUrl;
            document.body.appendChild(img);
        }
    } catch (error) {
        console.error('Error setting up WhatsApp:', error.message);
    }
}

// Example: File upload for WhatsApp image
async function sendWhatsAppFromFile() {
    const fileInput = document.getElementById('imageFile');
    const file = fileInput.files[0];
    
    if (file) {
        try {
            const result = await apiClient.sendWhatsAppImageFile(
                '081234567890',
                file,
                'Image from file upload'
            );
            console.log('Image file sent:', result);
        } catch (error) {
            console.error('Error sending image file:', error.message);
        }
    }
}

// Example: Use retry logic
async function sendWithRetry() {
    try {
        const result = await apiClient.sendWithRetry(
            () => apiClient.sendWhatsAppText('081234567890', 'Retry test'),
            3, // max retries
            1000 // initial delay
        );
        console.log('Message sent with retry:', result);
    } catch (error) {
        console.error('Failed after retries:', error.message);
    }
}

// Example: Create WhatsApp broadcast list
async function createBroadcastList() {
    try {
        const result = await apiClient.createBroadcastList(
            'Marketing Updates',
            ['081234567890', '081234567891', '081234567892']
        );
        console.log('Broadcast list created:', result);
        return result.data.broadcastId;
    } catch (error) {
        console.error('Error creating broadcast list:', error.message);
    }
}

// Example: Send message to broadcast list
async function sendToBroadcastList() {
    try {
        const broadcastId = 'your-broadcast-id-here'; // Get from createBroadcastList
        const result = await apiClient.sendToBroadcastList(
            broadcastId,
            'Hello everyone! This is a broadcast message.'
        );
        console.log('Message sent to broadcast list:', result);
    } catch (error) {
        console.error('Error sending to broadcast list:', error.message);
    }
}

// Example: Send image to broadcast list
async function sendImageToBroadcastList() {
    try {
        const broadcastId = 'your-broadcast-id-here';
        const result = await apiClient.sendImageToBroadcastList(
            broadcastId,
            'https://example.com/promo.jpg',
            'Check out our latest promotion!'
        );
        console.log('Image sent to broadcast list:', result);
    } catch (error) {
        console.error('Error sending image to broadcast list:', error.message);
    }
}

// Example: Get all broadcast lists
async function listBroadcastLists() {
    try {
        const result = await apiClient.getBroadcastLists();
        console.log('Broadcast lists:', result);
        return result.data.broadcastLists;
    } catch (error) {
        console.error('Error getting broadcast lists:', error.message);
    }
}

// Example: Add participants to broadcast list
async function addParticipantsToBroadcastList() {
    try {
        const broadcastId = 'your-broadcast-id-here';
        const result = await apiClient.updateBroadcastListParticipants(
            broadcastId,
            'add',
            ['081234567893', '081234567894']
        );
        console.log('Participants added:', result);
    } catch (error) {
        console.error('Error adding participants:', error.message);
    }
}

// Example: Remove participants from broadcast list
async function removeParticipantsFromBroadcastList() {
    try {
        const broadcastId = 'your-broadcast-id-here';
        const result = await apiClient.updateBroadcastListParticipants(
            broadcastId,
            'remove',
            ['081234567893']
        );
        console.log('Participants removed:', result);
    } catch (error) {
        console.error('Error removing participants:', error.message);
    }
}

// Example: Delete broadcast list
async function deleteBroadcastListExample() {
    try {
        const broadcastId = 'your-broadcast-id-here';
        const result = await apiClient.deleteBroadcastList(broadcastId);
        console.log('Broadcast list deleted:', result);
    } catch (error) {
        console.error('Error deleting broadcast list:', error.message);
    }
}

// Example: Bulk messaging (sending to multiple numbers individually)
async function sendBulkMessages() {
    try {
        const phoneNumbers = ['081234567890', '081234567891', '081234567892'];
        const message = 'Individual message to each contact';
        
        const result = await apiClient.sendWhatsAppBroadcast(phoneNumbers, message);
        console.log('Bulk messages sent:', result);
    } catch (error) {
        console.error('Error sending bulk messages:', error.message);
    }
}

// Example: Bulk image messaging
async function sendBulkImageMessages() {
    try {
        const phoneNumbers = ['081234567890', '081234567891'];
        const imageUrl = 'https://example.com/image.jpg';
        const caption = 'Check this out!';
        
        const result = await apiClient.sendWhatsAppBroadcastImage(phoneNumbers, imageUrl, caption);
        console.log('Bulk image messages sent:', result);
    } catch (error) {
        console.error('Error sending bulk image messages:', error.message);
    }
}

// Example: Complete broadcast workflow
async function completeBroadcastWorkflow() {
    try {
        console.log('Starting complete broadcast workflow...');
        
        // 1. Create broadcast list
        const broadcastResult = await apiClient.createBroadcastList(
            'Auto Generated List',
            ['081234567890', '081234567891', '081234567892']
        );
        const broadcastId = broadcastResult.data.broadcastId;
        console.log('Created broadcast list with ID:', broadcastId);
        
        // 2. Send initial message
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        await apiClient.sendToBroadcastList(broadcastId, 'Welcome to our broadcast list!');
        
        // 3. Add more participants
        await new Promise(resolve => setTimeout(resolve, 2000));
        await apiClient.updateBroadcastListParticipants(
            broadcastId,
            'add',
            ['081234567893', '081234567894']
        );
        
        // 4. Send image
        await new Promise(resolve => setTimeout(resolve, 2000));
        await apiClient.sendImageToBroadcastList(
            broadcastId,
            'https://example.com/welcome.jpg',
            'Welcome image'
        );
        
        // 5. List all broadcast lists
        const lists = await apiClient.getBroadcastLists();
        console.log('All broadcast lists:', lists);
        
        console.log('Broadcast workflow completed successfully!');
        
    } catch (error) {
        console.error('Error in broadcast workflow:', error.message);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationApiClient;
}

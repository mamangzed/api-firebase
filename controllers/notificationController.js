const firebaseService = require('../services/firebaseService');
// Lazy load WhatsApp service to prevent blocking
let whatsappService = null;
const getWhatsAppService = () => {
    if (!whatsappService) {
        whatsappService = require('../services/whatsappService');
    }
    return whatsappService;
};
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const {
    sendToDeviceSchema,
    sendToMultipleDevicesSchema,
    sendToTopicSchema,
    topicSubscriptionSchema,
    sendDualMessageSchema
} = require('../validators/notificationValidator');
const db = require('../services/db');

class NotificationController {
    /**
     * Mengirim notifikasi ke satu perangkat
     */
    async sendToDevice(req, res) {
        try {
            const { error, value } = sendToDeviceSchema.validate(req.body);
            
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                });
            }

            const { token, notification, data } = value;
            const response = await firebaseService.sendToDevice(token, notification, data);

            res.status(200).json({
                success: true,
                message: 'Notifikasi berhasil dikirim',
                data: {
                    messageId: response,
                    sentAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error in sendToDevice:', error);
            
            if (error.code === 'messaging/invalid-registration-token') {
                return res.status(400).json({
                    success: false,
                    message: 'FCM token tidak valid'
                });
            }

            if (error.code === 'messaging/registration-token-not-registered') {
                return res.status(404).json({
                    success: false,
                    message: 'FCM token tidak terdaftar'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Gagal mengirim notifikasi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Mengirim notifikasi ke beberapa perangkat
     */
    async sendToMultipleDevices(req, res) {
        try {
            const { error, value } = sendToMultipleDevicesSchema.validate(req.body);
            
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                });
            }

            const { tokens, notification, data } = value;
            const response = await firebaseService.sendToMultipleDevices(tokens, notification, data);

            res.status(200).json({
                success: true,
                message: 'Notifikasi berhasil dikirim ke beberapa perangkat',
                data: {
                    successCount: response.successCount,
                    failureCount: response.failureCount,
                    responses: response.responses.map((resp, index) => ({
                        token: tokens[index],
                        success: resp.success,
                        messageId: resp.messageId || null,
                        error: resp.error ? {
                            code: resp.error.code,
                            message: resp.error.message
                        } : null
                    })),
                    sentAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error in sendToMultipleDevices:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengirim notifikasi ke beberapa perangkat',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Mengirim notifikasi ke topic
     */
    async sendToTopic(req, res) {
        try {
            const { error, value } = sendToTopicSchema.validate(req.body);
            
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                });
            }

            const { topic, notification, data } = value;
            const response = await firebaseService.sendToTopic(topic, notification, data);

            res.status(200).json({
                success: true,
                message: `Notifikasi berhasil dikirim ke topic: ${topic}`,
                data: {
                    messageId: response,
                    topic: topic,
                    sentAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error in sendToTopic:', error);
            
            if (error.code === 'messaging/invalid-argument') {
                return res.status(400).json({
                    success: false,
                    message: 'Topic name tidak valid'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Gagal mengirim notifikasi ke topic',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Subscribe token ke topic
     */
    async subscribeToTopic(req, res) {
        try {
            const { error, value } = topicSubscriptionSchema.validate(req.body);
            
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                });
            }

            const { tokens, topic } = value;
            const response = await firebaseService.subscribeToTopic(tokens, topic);

            res.status(200).json({
                success: true,
                message: `Berhasil subscribe ke topic: ${topic}`,
                data: {
                    successCount: response.successCount,
                    failureCount: response.failureCount,
                    topic: topic,
                    subscribedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error in subscribeToTopic:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal subscribe ke topic',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Unsubscribe token dari topic
     */
    async unsubscribeFromTopic(req, res) {
        try {
            const { error, value } = topicSubscriptionSchema.validate(req.body);
            
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                });
            }

            const { tokens, topic } = value;
            const response = await firebaseService.unsubscribeFromTopic(tokens, topic);

            res.status(200).json({
                success: true,
                message: `Berhasil unsubscribe dari topic: ${topic}`,
                data: {
                    successCount: response.successCount,
                    failureCount: response.failureCount,
                    topic: topic,
                    unsubscribedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error in unsubscribeFromTopic:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal unsubscribe dari topic',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Health check endpoint
     */
    async healthCheck(req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'Firebase Notification API is running',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Service unavailable'
            });
        }
    }

    /**
     * Register FCM token (dummy, in-memory array)
     */
    static fcmTokens = [];

    /**
     * Mengirim pesan ke FCM dan WhatsApp secara bersamaan
     */
    async sendDualMessage(req, res) {
        try {
            const { error, value } = sendDualMessageSchema.validate(req.body);
            
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                });
            }

            const { fcm, whatsapp } = value;
            const results = {
                fcm: null,
                whatsapp: null,
                errors: []
            };

            // Send to FCM
            try {
                const fcmResponse = await firebaseService.sendToDevice(
                    fcm.token, 
                    fcm.notification, 
                    fcm.data
                );
                results.fcm = {
                    success: true,
                    messageId: fcmResponse,
                    sentAt: new Date().toISOString()
                };
            } catch (fcmError) {
                console.error('FCM Error:', fcmError);
                results.fcm = {
                    success: false,
                    error: fcmError.message
                };
                results.errors.push({
                    service: 'fcm',
                    message: fcmError.message
                });
            }

            // Send to WhatsApp
            try {
                const waResponse = await getWhatsAppService().sendMessage(
                    whatsapp.phoneNumber,
                    whatsapp.message
                );
                results.whatsapp = waResponse;
            } catch (waError) {
                console.error('WhatsApp Error:', waError);
                results.whatsapp = {
                    success: false,
                    error: waError.message
                };
                results.errors.push({
                    service: 'whatsapp',
                    message: waError.message
                });
            }

            // Determine overall success
            const overallSuccess = results.fcm?.success || results.whatsapp?.success;
            const statusCode = overallSuccess ? 200 : 500;

            res.status(statusCode).json({
                success: overallSuccess,
                message: overallSuccess ? 
                    'Pesan berhasil dikirim ke setidaknya satu platform' : 
                    'Gagal mengirim pesan ke semua platform',
                data: results,
                sentAt: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error in sendDualMessage:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Initialize WhatsApp connection
     */
    async initializeWhatsApp(req, res) {
        try {
            await getWhatsAppService().initialize();
            res.status(200).json({
                success: true,
                message: 'WhatsApp initialization started. Check console for QR code.'
            });
        } catch (error) {
            console.error('Error initializing WhatsApp:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to initialize WhatsApp',
                error: error.message
            });
        }
    }

    /**
     * Get WhatsApp connection status
     */
    async getWhatsAppStatus(req, res) {
        try {
            const status = getWhatsAppService().getConnectionStatus();
            res.status(200).json({
                success: true,
                data: status
            });
        } catch (error) {
            console.error('Error getting WhatsApp status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get WhatsApp status',
                error: error.message
            });
        }
    }

    /**
     * Force WhatsApp reconnection
     */
    async reconnectWhatsApp(req, res) {
        try {
            await getWhatsAppService().ensureConnection();
            res.status(200).json({
                success: true,
                message: 'WhatsApp reconnection successful'
            });
        } catch (error) {
            console.error('Error reconnecting WhatsApp:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reconnect WhatsApp',
                error: error.message
            });
        }
    }

    async registerFcmToken(req, res) {
        try {
            const { userId, fcmToken } = req.body;
            if (!userId || !fcmToken) {
                return res.status(400).json({
                    success: false,
                    message: 'userId dan fcmToken wajib diisi'
                });
            }
            // Update fcm_token di database
            const [result] = await db.query('UPDATE users SET fcm_token = ? WHERE user_id = ?', [fcmToken, userId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
            }
            res.json({ success: true, message: 'FCM token berhasil didaftarkan' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mendaftarkan FCM token' });
        }
    }

    /**
     * Get WhatsApp QR code as image
     */
    async getWhatsAppQRImage(req, res) {
        try {
            const currentQR = getWhatsAppService().getQRCode();
            
            if (!currentQR) {
                return res.status(404).json({
                    success: false,
                    message: 'No QR code available. Please initialize WhatsApp first.'
                });
            }
            
            // Generate QR code as PNG buffer
            const qrCodeBuffer = await QRCode.toBuffer(currentQR, {
                type: 'png',
                width: 400,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            // Set response headers for image
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Length', qrCodeBuffer.length);
            res.setHeader('Cache-Control', 'no-cache');
            
            // Send image buffer
            res.send(qrCodeBuffer);
            
        } catch (error) {
            console.error('Error getting QR code image:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate QR code image',
                error: error.message
            });
        }
    }

    /**
     * Get WhatsApp QR code with image URL
     */
    async getWhatsAppQR(req, res) {
        try {
            const currentQR = getWhatsAppService().getQRCode();
            
            if (!currentQR) {
                return res.status(404).json({
                    success: false,
                    message: 'No QR code available. Please initialize WhatsApp first.'
                });
            }
            
            // Generate QR code as base64 image
            const qrCodeImage = await QRCode.toDataURL(currentQR);
            
            // Get base URL from request
            const baseURL = `${req.protocol}://${req.get('host')}`;
            const qrImageURL = `${baseURL}/api/notifications/whatsapp/qr/image`;
            
            res.json({
                success: true,
                qrCode: qrCodeImage,
                qrCodeText: currentQR,
                qrImageURL: qrImageURL,
                instructions: {
                    message: "Scan this QR code with your WhatsApp app",
                    steps: [
                        "1. Open WhatsApp on your phone",
                        "2. Go to Settings > Linked Devices",
                        "3. Tap 'Link a Device'",
                        "4. Scan the QR code displayed above"
                    ]
                }
            });
            
        } catch (error) {
            console.error('Error getting QR code:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get QR code',
                error: error.message
            });
        }
    }

    /**
     * Send WhatsApp message only
     * phoneNumber parameter supports both phone numbers and JIDs
     */
    async sendWhatsAppMessage(req, res) {
        try {
            const { phoneNumber, message } = req.body;
            
            if (!phoneNumber || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Both phoneNumber and message are required'
                });
            }

            const result = await getWhatsAppService().sendMessage(phoneNumber, message);
            
            res.status(200).json({
                success: true,
                message: 'WhatsApp message sent successfully',
                data: result
            });
            
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send WhatsApp message',
                error: error.message
            });
        }
    }

    /**
     * Send WhatsApp image message from file upload
     * phoneNumber parameter supports both phone numbers and JIDs
     */
    async sendWhatsAppImage(req, res) {
        try {
            const { phoneNumber, caption } = req.body;
            
            if (!phoneNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'phoneNumber is required (can be phone number or JID)'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Image file is required'
                });
            }

            const result = await getWhatsAppService().sendImageMessage(
                phoneNumber, 
                req.file.path, 
                caption || ''
            );
            
            // Delete uploaded file after sending
            const fs = require('fs');
            fs.unlinkSync(req.file.path);
            
            res.status(200).json({
                success: true,
                message: 'WhatsApp image sent successfully',
                data: result
            });
            
        } catch (error) {
            // Clean up file if error occurred
            if (req.file) {
                const fs = require('fs');
                try {
                    fs.unlinkSync(req.file.path);
                } catch (cleanupError) {
                    console.error('Error cleaning up file:', cleanupError);
                }
            }
            
            console.error('Error sending WhatsApp image:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send WhatsApp image',
                error: error.message
            });
        }
    }

    /**
     * Send WhatsApp image message from URL
     * phoneNumber parameter supports both phone numbers and JIDs
     */
    async sendWhatsAppImageFromUrl(req, res) {
        try {
            const { phoneNumber, imageUrl, caption } = req.body;
            
            if (!phoneNumber || !imageUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'phoneNumber and imageUrl are required'
                });
            }

            const result = await getWhatsAppService().sendImageFromUrl(
                phoneNumber, 
                imageUrl, 
                caption || ''
            );
            
            res.status(200).json({
                success: true,
                message: 'WhatsApp image sent successfully',
                data: result
            });
            
        } catch (error) {
            console.error('Error sending WhatsApp image from URL:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send WhatsApp image',
                error: error.message
            });
        }
    }

    /**
     * Universal WhatsApp message sender - supports text only or text with image
     * phoneNumber parameter supports both phone numbers and JIDs
     */
    async sendWhatsAppUniversal(req, res) {
        try {
            const { phoneNumber, message, imageUrl, caption } = req.body;
            
            if (!phoneNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'phoneNumber is required (can be phone number or JID)'
                });
            }

            if (!message && !imageUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'Either message or imageUrl is required'
                });
            }

            let result;

            // If imageUrl is provided, send image with caption
            if (imageUrl) {
                // Use caption if provided, otherwise use message as caption
                const imageCaption = caption || message || '';
                
                result = await getWhatsAppService().sendImageFromUrl(
                    phoneNumber, 
                    imageUrl, 
                    imageCaption
                );
                
                // If there's additional text message and it's different from caption, send it separately
                if (message && message !== imageCaption) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
                    const textResult = await getWhatsAppService().sendMessage(phoneNumber, message);
                    result.additionalMessage = textResult;
                }
            } else {
                // Send text message only
                result = await getWhatsAppService().sendMessage(phoneNumber, message);
            }
            
            res.status(200).json({
                success: true,
                message: imageUrl ? 'WhatsApp message with image sent successfully' : 'WhatsApp text message sent successfully',
                data: result
            });
            
        } catch (error) {
            console.error('Error sending WhatsApp universal message:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send WhatsApp message',
                error: error.message
            });
        }
    }

    async createWhatsAppBroadcastList(req, res) {
        try {
            const { name, recipients } = req.body;
            
            // Validation
            if (!name || name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Broadcast list name is required',
                });
            }
            
            if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Recipients array is required and cannot be empty',
                });
            }
            
            if (recipients.length > 256) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 256 recipients allowed per broadcast list',
                });
            }
            
            // Remove duplicates and validate phone numbers or JIDs
            const uniqueNumbers = [...new Set(recipients)];
            const validNumbers = uniqueNumbers.filter(num => {
                const str = num.toString();
                // If it contains @, it's a JID - allow it
                if (str.includes('@')) {
                    return true;
                }
                // Otherwise validate as phone number
                const cleaned = str.replace(/[^\d]/g, '');
                return cleaned.length >= 10 && cleaned.length <= 15;
            });
            
            if (validNumbers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid phone numbers or JIDs found',
                });
            }
            
            const result = await getWhatsAppService().createBroadcastList(name, validNumbers);
            
            res.status(200).json({
                success: true,
                message: 'Broadcast list created successfully',
                data: result
            });
            
        } catch (error) {
            console.error('Error creating WhatsApp broadcast list:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create WhatsApp broadcast list',
                error: error.message
            });
        }
    }

    async getWhatsAppBroadcastLists(req, res) {
        try {
            const result = await getWhatsAppService().getBroadcastLists();
            
            res.status(200).json({
                success: true,
                message: 'Broadcast lists retrieved successfully',
                data: result
            });
            
        } catch (error) {
            console.error('Error getting WhatsApp broadcast lists:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get WhatsApp broadcast lists',
                error: error.message
            });
        }
    }

    async getValidWhatsAppBroadcastLists(req, res) {
        try {
            const result = await getWhatsAppService().getValidBroadcastLists();
            
            res.status(200).json({
                success: true,
                message: 'Valid broadcast lists retrieved successfully',
                data: result
            });
            
        } catch (error) {
            console.error('Error getting valid WhatsApp broadcast lists:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get valid WhatsApp broadcast lists',
                error: error.message
            });
        }
    }

    async getBroadcastListInfo(req, res) {
        try {
            const { broadcastId } = req.params;
            
            if (!broadcastId) {
                return res.status(400).json({
                    success: false,
                    message: 'Broadcast ID is required'
                });
            }
            
            const result = await getWhatsAppService().getBroadcastListInfo(broadcastId);
            
            res.status(200).json({
                success: true,
                message: 'Broadcast list info retrieved successfully',
                data: result
            });
            
        } catch (error) {
            console.error('Error getting broadcast list info:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get broadcast list info',
                error: error.message
            });
        }
    }

    async getAllWhatsAppChats(req, res) {
        try {
            const result = await getWhatsAppService().getAllChats();
            
            res.status(200).json({
                success: true,
                message: 'All chats retrieved successfully',
                data: result
            });
            
        } catch (error) {
            console.error('Error getting all WhatsApp chats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get all WhatsApp chats',
                error: error.message
            });
        }
    }

    async sendToBroadcastList(req, res) {
        try {
            const { broadcastId, message } = req.body;
            
            // Validation
            if (!broadcastId || broadcastId.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Broadcast ID is required',
                });
            }
            
            if (!message || message.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required',
                });
            }
            
            const result = await getWhatsAppService().sendToBroadcastList(broadcastId, message);
            
            res.status(200).json({
                success: true,
                message: 'Message sent to broadcast list successfully',
                data: result
            });
            
        } catch (error) {
            console.error('Error sending to WhatsApp broadcast list:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send to WhatsApp broadcast list',
                error: error.message
            });
        }
    }

    async sendImageToBroadcastList(req, res) {
        try {
            const { broadcastId, imageUrl, caption = '' } = req.body;
            
            // Validation
            if (!broadcastId || broadcastId.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Broadcast ID is required',
                });
            }
            
            if (!imageUrl || imageUrl.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Image URL is required',
                });
            }
            
            // Validate image URL format
            try {
                new URL(imageUrl);
            } catch (urlError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid image URL format',
                });
            }
            
            const result = await getWhatsAppService().sendImageToBroadcastList(broadcastId, imageUrl, caption);
            
            res.status(200).json({
                success: true,
                message: 'Image sent to broadcast list successfully',
                data: result
            });
            
        } catch (error) {
            console.error('Error sending image to WhatsApp broadcast list:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send image to WhatsApp broadcast list',
                error: error.message
            });
        }
    }

    async deleteBroadcastList(req, res) {
        try {
            const { broadcastId } = req.params;
            
            if (!broadcastId) {
                return res.status(400).json({
                    success: false,
                    message: 'Broadcast ID is required',
                });
            }
            
            const result = await getWhatsAppService().deleteBroadcastList(broadcastId);
            
            res.status(200).json({
                success: true,
                message: 'Broadcast list deleted successfully',
                data: result
            });
            
        } catch (error) {
            console.error('Error deleting WhatsApp broadcast list:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete WhatsApp broadcast list',
                error: error.message
            });
        }
    }

    async updateBroadcastListParticipants(req, res) {
        try {
            const { broadcastId, action, participants } = req.body;
            
            // Validation
            if (!broadcastId || broadcastId.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Broadcast ID is required',
                });
            }
            
            if (!action || !['add', 'remove'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Action must be "add" or "remove"',
                });
            }
            
            if (!participants || !Array.isArray(participants) || participants.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Participants array is required and cannot be empty',
                });
            }
            
            // Validate phone numbers or JIDs
            const validNumbers = participants.filter(num => {
                const str = num.toString();
                // If it contains @, it's a JID - allow it
                if (str.includes('@')) {
                    return true;
                }
                // Otherwise validate as phone number
                const cleaned = str.replace(/[^\d]/g, '');
                return cleaned.length >= 10 && cleaned.length <= 15;
            });
            
            if (validNumbers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid phone numbers or JIDs found',
                });
            }
            
            const result = await getWhatsAppService().updateBroadcastListParticipants(
                broadcastId, 
                action, 
                validNumbers
            );
            
            res.status(200).json({
                success: true,
                message: `Broadcast list participants ${action}ed successfully`,
                data: result
            });
            
        } catch (error) {
            console.error('Error updating WhatsApp broadcast list participants:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update WhatsApp broadcast list participants',
                error: error.message
            });
        }
    }

    async sendWhatsAppBroadcast(req, res) {
        try {
            const { phoneNumbers, message } = req.body;
            
            // Validation
            if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone numbers array is required and cannot be empty',
                });
            }
            
            if (phoneNumbers.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 100 phone numbers allowed per broadcast',
                });
            }
            
            if (!message || message.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required',
                });
            }
            
            // Remove duplicates and validate phone numbers or JIDs
            const uniqueNumbers = [...new Set(phoneNumbers)];
            const validNumbers = uniqueNumbers.filter(num => {
                const str = num.toString();
                // If it contains @, it's a JID - allow it
                if (str.includes('@')) {
                    return true;
                }
                // Otherwise validate as phone number
                const cleaned = str.replace(/[^\d]/g, '');
                return cleaned.length >= 10 && cleaned.length <= 15;
            });
            
            if (validNumbers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid phone numbers or JIDs found',
                });
            }
            
            if (validNumbers.length !== uniqueNumbers.length) {
                console.log(`Filtered ${uniqueNumbers.length - validNumbers.length} invalid numbers`);
            }
            
            const result = await getWhatsAppService().sendBroadcastMessage(validNumbers, message);
            
            res.status(200).json({
                success: true,
                message: `Broadcast completed: ${result.successful}/${result.total} messages sent successfully`,
                data: result
            });
            
        } catch (error) {
            console.error('Error sending WhatsApp broadcast:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send WhatsApp broadcast',
                error: error.message
            });
        }
    }

    async sendWhatsAppBroadcastImage(req, res) {
        try {
            const { phoneNumbers, imageUrl, caption = '' } = req.body;
            
            // Validation
            if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone numbers array is required and cannot be empty',
                });
            }
            
            if (phoneNumbers.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 50 phone numbers allowed per image broadcast',
                });
            }
            
            if (!imageUrl || imageUrl.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Image URL is required',
                });
            }
            
            // Validate image URL format
            try {
                new URL(imageUrl);
            } catch (urlError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid image URL format',
                });
            }
            
            // Remove duplicates and validate phone numbers or JIDs
            const uniqueNumbers = [...new Set(phoneNumbers)];
            const validNumbers = uniqueNumbers.filter(num => {
                const str = num.toString();
                // If it contains @, it's a JID - allow it
                if (str.includes('@')) {
                    return true;
                }
                // Otherwise validate as phone number
                const cleaned = str.replace(/[^\d]/g, '');
                return cleaned.length >= 10 && cleaned.length <= 15;
            });
            
            if (validNumbers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid phone numbers or JIDs found',
                });
            }
            
            const result = await getWhatsAppService().sendBroadcastImageFromUrl(validNumbers, imageUrl, caption);
            
            res.status(200).json({
                success: true,
                message: `Image broadcast completed: ${result.successful}/${result.total} messages sent successfully`,
                data: result
            });
            
        } catch (error) {
            console.error('Error sending WhatsApp image broadcast:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send WhatsApp image broadcast',
                error: error.message
            });
        }
    }
}

module.exports = new NotificationController();

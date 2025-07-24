const firebaseService = require('../services/firebaseService');
const {
    sendToDeviceSchema,
    sendToMultipleDevicesSchema,
    sendToTopicSchema,
    topicSubscriptionSchema
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
}

module.exports = new NotificationController();

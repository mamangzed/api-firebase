const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

class FirebaseService {
    constructor() {
        this.initializeFirebase();
    }

    initializeFirebase() {
        try {
            const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || './firebase-service-account.json';
            const serviceAccount = require(path.resolve(serviceAccountPath));

            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            }

            this.messaging = admin.messaging();
            console.log('Firebase Admin SDK initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            throw new Error('Failed to initialize Firebase Admin SDK');
        }
    }

    /**
     * Mengirim notifikasi ke satu perangkat
     * @param {string} token - FCM token perangkat
     * @param {Object} notification - Data notifikasi
     * @param {Object} data - Data tambahan (opsional)
     * @returns {Promise<string>} Message ID
     */
    async sendToDevice(token, notification, data = {}) {
        try {
            const message = {
                token: token,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.imageUrl || undefined
                },
                data: data,
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            };

            const response = await this.messaging.send(message);
            console.log('Successfully sent message:', response);
            return response;
        } catch (error) {
            console.error('Error sending message to device:', error);
            throw error;
        }
    }

    /**
     * Mengirim notifikasi ke beberapa perangkat
     * @param {Array} tokens - Array FCM tokens
     * @param {Object} notification - Data notifikasi
     * @param {Object} data - Data tambahan (opsional)
     * @returns {Promise<Object>} Batch response
     */
    async sendToMultipleDevices(tokens, notification, data = {}) {
        try {
            const message = {
                tokens: tokens,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.imageUrl || undefined
                },
                data: data,
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            };

            const response = await this.messaging.sendMulticast(message);
            console.log('Successfully sent messages:', response);
            return response;
        } catch (error) {
            console.error('Error sending messages to multiple devices:', error);
            throw error;
        }
    }

    /**
     * Mengirim notifikasi ke topic
     * @param {string} topic - Nama topic
     * @param {Object} notification - Data notifikasi
     * @param {Object} data - Data tambahan (opsional)
     * @returns {Promise<string>} Message ID
     */
    async sendToTopic(topic, notification, data = {}) {
        try {
            const message = {
                topic: topic,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.imageUrl || undefined
                },
                data: data,
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            };

            const response = await this.messaging.send(message);
            console.log('Successfully sent message to topic:', response);
            return response;
        } catch (error) {
            console.error('Error sending message to topic:', error);
            throw error;
        }
    }

    /**
     * Subscribe token ke topic
     * @param {Array|string} tokens - FCM token(s)
     * @param {string} topic - Nama topic
     * @returns {Promise<Object>} Subscription response
     */
    async subscribeToTopic(tokens, topic) {
        try {
            const tokensArray = Array.isArray(tokens) ? tokens : [tokens];
            const response = await this.messaging.subscribeToTopic(tokensArray, topic);
            console.log('Successfully subscribed to topic:', response);
            return response;
        } catch (error) {
            console.error('Error subscribing to topic:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe token dari topic
     * @param {Array|string} tokens - FCM token(s)
     * @param {string} topic - Nama topic
     * @returns {Promise<Object>} Unsubscription response
     */
    async unsubscribeFromTopic(tokens, topic) {
        try {
            const tokensArray = Array.isArray(tokens) ? tokens : [tokens];
            const response = await this.messaging.unsubscribeFromTopic(tokensArray, topic);
            console.log('Successfully unsubscribed from topic:', response);
            return response;
        } catch (error) {
            console.error('Error unsubscribing from topic:', error);
            throw error;
        }
    }
}

module.exports = new FirebaseService();

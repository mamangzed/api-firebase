const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const upload = require('../middleware/upload');
const { protectApi, validateApiKey } = require('../middleware/apiKeyAuth');

// Health check - no auth required
router.get('/health', notificationController.healthCheck);

// FCM notification endpoints - protected
router.post('/send-to-device', protectApi, notificationController.sendToDevice);
router.post('/send-to-multiple-devices', protectApi, notificationController.sendToMultipleDevices);
router.post('/send-to-topic', protectApi, notificationController.sendToTopic);
router.post('/subscribe-to-topic', protectApi, notificationController.subscribeToTopic);
router.post('/unsubscribe-from-topic', protectApi, notificationController.unsubscribeFromTopic);
router.post('/register-fcm-token', protectApi, notificationController.registerFcmToken);

// Dual messaging endpoint - protected
router.post('/send-dual-message', protectApi, notificationController.sendDualMessage);

// WhatsApp management endpoints - API key only (no domain restriction for status checks)
router.post('/whatsapp/initialize', validateApiKey, notificationController.initializeWhatsApp);
router.get('/whatsapp/status', validateApiKey, notificationController.getWhatsAppStatus);
router.post('/whatsapp/reconnect', validateApiKey, notificationController.reconnectWhatsApp);
router.get('/whatsapp/qr', validateApiKey, notificationController.getWhatsAppQR);
router.get('/whatsapp/qr/image', validateApiKey, notificationController.getWhatsAppQRImage);

// WhatsApp messaging endpoints - fully protected
router.post('/whatsapp/send-message', protectApi, notificationController.sendWhatsAppUniversal);
router.post('/whatsapp/send', protectApi, notificationController.sendWhatsAppMessage);
router.post('/whatsapp/send-image', protectApi, upload.single('image'), notificationController.sendWhatsAppImage);
router.post('/whatsapp/send-image-url', protectApi, notificationController.sendWhatsAppImageFromUrl);

// WhatsApp broadcast endpoints (bulk messaging) - fully protected
router.post('/whatsapp/broadcast', protectApi, notificationController.sendWhatsAppBroadcast);
router.post('/whatsapp/broadcast-image', protectApi, notificationController.sendWhatsAppBroadcastImage);

// WhatsApp broadcast list endpoints (true WhatsApp broadcast) - fully protected
router.post('/whatsapp/broadcast-list/create', protectApi, notificationController.createWhatsAppBroadcastList);
router.get('/whatsapp/broadcast-list', validateApiKey, notificationController.getWhatsAppBroadcastLists);
router.get('/whatsapp/broadcast-list/valid', validateApiKey, notificationController.getValidWhatsAppBroadcastLists);
router.get('/whatsapp/broadcast-list/info/:broadcastId', validateApiKey, notificationController.getBroadcastListInfo);
router.get('/whatsapp/chats/all', validateApiKey, notificationController.getAllWhatsAppChats);
router.post('/whatsapp/broadcast-list/send', protectApi, notificationController.sendToBroadcastList);
router.post('/whatsapp/broadcast-list/send-image', protectApi, notificationController.sendImageToBroadcastList);
router.delete('/whatsapp/broadcast-list/:broadcastId', validateApiKey, notificationController.deleteBroadcastList);
router.put('/whatsapp/broadcast-list/participants', protectApi, notificationController.updateBroadcastListParticipants);

module.exports = router;

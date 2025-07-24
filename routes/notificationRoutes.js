const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Health check
router.get('/health', notificationController.healthCheck);

// Mengirim notifikasi ke satu perangkat
router.post('/send-to-device', notificationController.sendToDevice);

// Mengirim notifikasi ke beberapa perangkat
router.post('/send-to-multiple-devices', notificationController.sendToMultipleDevices);

// Mengirim notifikasi ke topic
router.post('/send-to-topic', notificationController.sendToTopic);

// Subscribe ke topic
router.post('/subscribe-to-topic', notificationController.subscribeToTopic);

// Unsubscribe dari topic
router.post('/unsubscribe-from-topic', notificationController.unsubscribeFromTopic);

// Register FCM token
router.post('/register-fcm-token', notificationController.registerFcmToken);

module.exports = router;

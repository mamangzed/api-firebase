const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const notificationRoutes = require('./routes/notificationRoutes');
const { errorHandler, notFoundHandler, requestLogger } = require('./middleware/errorHandler');
const { 
    generalLimiter, 
    notificationLimiter, 
    multipleDevicesLimiter, 
    topicLimiter 
} = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',') 
            : ['http://localhost:3000'];
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(requestLogger);
}

// Rate limiting
app.use(generalLimiter);

// Routes dengan rate limiting khusus
app.use('/api/notifications/send-to-device', notificationLimiter);
app.use('/api/notifications/send-to-multiple-devices', multipleDevicesLimiter);
app.use('/api/notifications/send-to-topic', notificationLimiter);
app.use('/api/notifications/subscribe-to-topic', topicLimiter);
app.use('/api/notifications/unsubscribe-from-topic', topicLimiter);

// API routes
app.use('/api/notifications', notificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Firebase Notification API',
        version: '1.0.0',
        documentation: '/api/notifications/health',
        endpoints: {
            health: 'GET /api/notifications/health',
            sendToDevice: 'POST /api/notifications/send-to-device',
            sendToMultipleDevices: 'POST /api/notifications/send-to-multiple-devices',
            sendToTopic: 'POST /api/notifications/send-to-topic',
            subscribeToTopic: 'POST /api/notifications/subscribe-to-topic',
            unsubscribeFromTopic: 'POST /api/notifications/unsubscribe-from-topic'
        }
    });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Firebase Notification API running on port ${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Server: http://localhost:${PORT}`);
    console.log(`💡 Health Check: http://localhost:${PORT}/api/notifications/health`);
});

module.exports = app;

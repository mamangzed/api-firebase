// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Jika response sudah dikirim, delegate ke default Express error handler
    if (res.headersSent) {
        return next(err);
    }

    // Firebase Admin SDK errors
    if (err.code && err.code.startsWith('messaging/')) {
        const firebaseErrorMessages = {
            'messaging/invalid-registration-token': 'FCM token tidak valid',
            'messaging/registration-token-not-registered': 'FCM token tidak terdaftar',
            'messaging/invalid-argument': 'Parameter tidak valid',
            'messaging/invalid-recipient': 'Penerima tidak valid',
            'messaging/invalid-payload': 'Payload notifikasi tidak valid',
            'messaging/message-rate-exceeded': 'Rate limit terlampaui',
            'messaging/device-message-rate-exceeded': 'Rate limit perangkat terlampaui',
            'messaging/topics-message-rate-exceeded': 'Rate limit topic terlampaui',
            'messaging/invalid-apns-credentials': 'Kredensial APNS tidak valid',
            'messaging/mismatched-credential': 'Kredensial tidak cocok',
            'messaging/authentication-error': 'Error autentikasi',
            'messaging/server-unavailable': 'Server Firebase tidak tersedia',
            'messaging/internal-error': 'Internal error Firebase',
        };

        return res.status(400).json({
            success: false,
            message: firebaseErrorMessages[err.code] || 'Error Firebase',
            code: err.code
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Data tidak valid',
            errors: err.details
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token tidak valid'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token telah kedaluwarsa'
        });
    }

    // Default error
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? 'Terjadi kesalahan internal' : message,
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            originalMessage: err.message 
        })
    });
};

// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint tidak ditemukan',
        path: req.originalUrl,
        method: req.method
    });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
};

module.exports = {
    errorHandler,
    notFoundHandler,
    requestLogger
};

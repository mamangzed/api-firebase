const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs: windowMs,
        max: max,
        message: {
            success: false,
            message: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        // Skip successful requests to prevent false positives
        skipSuccessfulRequests: false,
        // Skip failed requests
        skipFailedRequests: false,
        // Key generator based on API key or IP
        keyGenerator: (req) => {
            // Use API key if available, otherwise use IP
            const apiKey = req.headers['x-api-key'];
            if (apiKey) {
                return `api_key:${apiKey}`;
            }
            return req.ip;
        }
    });
};

// General rate limit untuk semua endpoints
const generalLimiter = createRateLimit(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 menit
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per 15 menit
    'Terlalu banyak request, coba lagi nanti.'
);

// Strict rate limit untuk endpoint notifikasi
const notificationLimiter = createRateLimit(
    1 * 60 * 1000, // 1 menit
    10, // 10 requests per menit
    'Terlalu banyak notifikasi dikirim, coba lagi dalam 1 menit.'
);

// Rate limit untuk multiple devices (lebih ketat)
const multipleDevicesLimiter = createRateLimit(
    5 * 60 * 1000, // 5 menit
    5, // 5 requests per 5 menit
    'Terlalu banyak request untuk multiple devices, coba lagi dalam 5 menit.'
);

// Rate limit untuk topic operations
const topicLimiter = createRateLimit(
    10 * 60 * 1000, // 10 menit
    20, // 20 requests per 10 menit
    'Terlalu banyak operasi topic, coba lagi dalam 10 menit.'
);

module.exports = {
    generalLimiter,
    notificationLimiter,
    multipleDevicesLimiter,
    topicLimiter
};

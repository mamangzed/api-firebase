const rateLimit = require('express-rate-limit');

// API Keys yang diizinkan (sebaiknya simpan di environment variables)
const VALID_API_KEYS = [
    process.env.API_KEY_1 || 'your-secret-api-key-1',
    process.env.API_KEY_2 || 'your-secret-api-key-2',
    // Tambah API key lainnya sesuai kebutuhan
];

// Domain yang diizinkan mengakses API
const ALLOWED_DOMAINS = [
    process.env.ALLOWED_DOMAIN_1 || 'https://yourdomain.com',
    process.env.ALLOWED_DOMAIN_2 || 'https://localhost:3000',
    process.env.ALLOWED_DOMAIN_3 || 'http://localhost:3000',
    // Tambah domain lainnya sesuai kebutuhan
];

// Rate limiting per API key
const apiKeyRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100, // maksimal 100 request per 15 menit per API key
    message: {
        error: 'Too many requests from this API key, please try again later.',
        retryAfter: '15 minutes'
    },
    keyGenerator: (req) => {
        return req.headers['x-api-key'] || req.ip;
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware untuk validasi API Key
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            error: 'API key is required',
            message: 'Please provide X-API-Key header'
        });
    }
    
    if (!VALID_API_KEYS.includes(apiKey)) {
        return res.status(401).json({
            error: 'Invalid API key',
            message: 'The provided API key is not valid'
        });
    }
    
    // Simpan API key di request untuk logging
    req.apiKey = apiKey;
    next();
};

// Middleware untuk validasi domain origin
const validateOrigin = (req, res, next) => {
    const origin = req.headers.origin || req.headers.referer;
    
    // Skip validation untuk request tanpa origin (seperti Postman, curl, dll)
    if (!origin) {
        console.log('Request without origin detected, allowing...');
        return next();
    }
    
    // Cek apakah origin diizinkan
    const isAllowed = ALLOWED_DOMAINS.some(domain => {
        // Remove trailing slash untuk perbandingan
        const normalizedDomain = domain.replace(/\/$/, '');
        const normalizedOrigin = origin.replace(/\/$/, '');
        
        return normalizedOrigin === normalizedDomain || 
               normalizedOrigin.startsWith(normalizedDomain);
    });
    
    if (!isAllowed) {
        return res.status(403).json({
            error: 'Access denied',
            message: 'This domain is not authorized to access this API',
            origin: origin
        });
    }
    
    next();
};

// Middleware untuk logging API usage
const logApiUsage = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const apiKey = req.apiKey || 'NO-KEY';
    const origin = req.headers.origin || req.headers.referer || 'NO-ORIGIN';
    const userAgent = req.headers['user-agent'] || 'NO-USER-AGENT';
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`[API Usage] ${timestamp} | Key: ${apiKey.substring(0, 8)}... | IP: ${ip} | Origin: ${origin} | ${req.method} ${req.originalUrl}`);
    
    // Override res.json untuk logging response
    const originalJson = res.json;
    res.json = function(data) {
        console.log(`[API Response] ${timestamp} | Status: ${res.statusCode} | Key: ${apiKey.substring(0, 8)}...`);
        return originalJson.call(this, data);
    };
    
    next();
};

// Kombinasi middleware untuk proteksi lengkap
const protectApi = [
    validateApiKey,
    validateOrigin,
    apiKeyRateLimit,
    logApiUsage
];

module.exports = {
    validateApiKey,
    validateOrigin,
    logApiUsage,
    apiKeyRateLimit,
    protectApi
};

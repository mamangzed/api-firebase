const Joi = require('joi');

// Validation schema untuk notifikasi ke satu perangkat
const sendToDeviceSchema = Joi.object({
    token: Joi.string().required().messages({
        'string.empty': 'FCM token tidak boleh kosong',
        'any.required': 'FCM token wajib diisi'
    }),
    notification: Joi.object({
        title: Joi.string().max(100).required().messages({
            'string.empty': 'Title notifikasi tidak boleh kosong',
            'string.max': 'Title tidak boleh lebih dari 100 karakter',
            'any.required': 'Title notifikasi wajib diisi'
        }),
        body: Joi.string().max(250).required().messages({
            'string.empty': 'Body notifikasi tidak boleh kosong',
            'string.max': 'Body tidak boleh lebih dari 250 karakter',
            'any.required': 'Body notifikasi wajib diisi'
        }),
        imageUrl: Joi.string().uri().optional().messages({
            'string.uri': 'Image URL harus berupa URL yang valid'
        })
    }).required(),
    data: Joi.object().pattern(Joi.string(), Joi.string()).optional()
});

// Validation schema untuk notifikasi ke beberapa perangkat
const sendToMultipleDevicesSchema = Joi.object({
    tokens: Joi.array().items(Joi.string()).min(1).max(500).required().messages({
        'array.min': 'Minimal 1 token diperlukan',
        'array.max': 'Maksimal 500 tokens per request',
        'any.required': 'Array tokens wajib diisi'
    }),
    notification: Joi.object({
        title: Joi.string().max(100).required().messages({
            'string.empty': 'Title notifikasi tidak boleh kosong',
            'string.max': 'Title tidak boleh lebih dari 100 karakter',
            'any.required': 'Title notifikasi wajib diisi'
        }),
        body: Joi.string().max(250).required().messages({
            'string.empty': 'Body notifikasi tidak boleh kosong',
            'string.max': 'Body tidak boleh lebih dari 250 karakter',
            'any.required': 'Body notifikasi wajib diisi'
        }),
        imageUrl: Joi.string().uri().optional().messages({
            'string.uri': 'Image URL harus berupa URL yang valid'
        })
    }).required(),
    data: Joi.object().pattern(Joi.string(), Joi.string()).optional()
});

// Validation schema untuk notifikasi ke topic
const sendToTopicSchema = Joi.object({
    topic: Joi.string().pattern(/^[a-zA-Z0-9-_.~%]+$/).required().messages({
        'string.empty': 'Topic tidak boleh kosong',
        'string.pattern.base': 'Topic harus berupa string alfanumerik dengan karakter -_.~%',
        'any.required': 'Topic wajib diisi'
    }),
    notification: Joi.object({
        title: Joi.string().max(100).required().messages({
            'string.empty': 'Title notifikasi tidak boleh kosong',
            'string.max': 'Title tidak boleh lebih dari 100 karakter',
            'any.required': 'Title notifikasi wajib diisi'
        }),
        body: Joi.string().max(250).required().messages({
            'string.empty': 'Body notifikasi tidak boleh kosong',
            'string.max': 'Body tidak boleh lebih dari 250 karakter',
            'any.required': 'Body notifikasi wajib diisi'
        }),
        imageUrl: Joi.string().uri().optional().messages({
            'string.uri': 'Image URL harus berupa URL yang valid'
        })
    }).required(),
    data: Joi.object().pattern(Joi.string(), Joi.string()).optional()
});

// Validation schema untuk subscribe/unsubscribe topic
const topicSubscriptionSchema = Joi.object({
    tokens: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string()).min(1).max(1000)
    ).required().messages({
        'alternatives.match': 'Tokens harus berupa string atau array string',
        'array.min': 'Minimal 1 token diperlukan',
        'array.max': 'Maksimal 1000 tokens per request',
        'any.required': 'Tokens wajib diisi'
    }),
    topic: Joi.string().pattern(/^[a-zA-Z0-9-_.~%]+$/).required().messages({
        'string.empty': 'Topic tidak boleh kosong',
        'string.pattern.base': 'Topic harus berupa string alfanumerik dengan karakter -_.~%',
        'any.required': 'Topic wajib diisi'
    })
});

module.exports = {
    sendToDeviceSchema,
    sendToMultipleDevicesSchema,
    sendToTopicSchema,
    topicSubscriptionSchema
};

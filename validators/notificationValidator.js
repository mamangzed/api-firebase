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

// Validation schema untuk kirim ke FCM dan WhatsApp
const sendDualMessageSchema = Joi.object({
    // FCM Configuration
    fcm: Joi.object({
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
    }).required(),
    
    // WhatsApp Configuration
    whatsapp: Joi.object({
        phoneNumber: Joi.string().pattern(/^[\d+\-\s()]+$/).required().messages({
            'string.empty': 'Nomor WhatsApp tidak boleh kosong',
            'string.pattern.base': 'Nomor WhatsApp harus berupa angka',
            'any.required': 'Nomor WhatsApp wajib diisi'
        }),
        message: Joi.string().max(4096).required().messages({
            'string.empty': 'Pesan WhatsApp tidak boleh kosong',
            'string.max': 'Pesan WhatsApp tidak boleh lebih dari 4096 karakter',
            'any.required': 'Pesan WhatsApp wajib diisi'
        })
    }).required()
});

// Validation schema untuk membuat broadcast list WhatsApp
const createBroadcastListSchema = Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
        'string.empty': 'Nama broadcast list tidak boleh kosong',
        'string.min': 'Nama broadcast list minimal 1 karakter',
        'string.max': 'Nama broadcast list maksimal 100 karakter',
        'any.required': 'Nama broadcast list wajib diisi'
    }),
    recipients: Joi.array()
        .items(Joi.string().pattern(/^[\d+\-\s()]+$/))
        .min(1)
        .max(256)
        .required()
        .messages({
            'array.min': 'Minimal 1 penerima diperlukan',
            'array.max': 'Maksimal 256 penerima per broadcast list',
            'any.required': 'Array penerima wajib diisi'
        })
});

// Validation schema untuk mengirim ke broadcast list
const sendToBroadcastListSchema = Joi.object({
    broadcastId: Joi.string().required().messages({
        'string.empty': 'Broadcast ID tidak boleh kosong',
        'any.required': 'Broadcast ID wajib diisi'
    }),
    message: Joi.string().max(4096).required().messages({
        'string.empty': 'Pesan tidak boleh kosong',
        'string.max': 'Pesan tidak boleh lebih dari 4096 karakter',
        'any.required': 'Pesan wajib diisi'
    })
});

// Validation schema untuk mengirim image ke broadcast list
const sendImageToBroadcastListSchema = Joi.object({
    broadcastId: Joi.string().required().messages({
        'string.empty': 'Broadcast ID tidak boleh kosong',
        'any.required': 'Broadcast ID wajib diisi'
    }),
    imageUrl: Joi.string().uri().required().messages({
        'string.empty': 'Image URL tidak boleh kosong',
        'string.uri': 'Image URL harus berupa URL yang valid',
        'any.required': 'Image URL wajib diisi'
    }),
    caption: Joi.string().max(1024).optional().messages({
        'string.max': 'Caption tidak boleh lebih dari 1024 karakter'
    })
});

// Validation schema untuk update participants broadcast list
const updateBroadcastListParticipantsSchema = Joi.object({
    broadcastId: Joi.string().required().messages({
        'string.empty': 'Broadcast ID tidak boleh kosong',
        'any.required': 'Broadcast ID wajib diisi'
    }),
    action: Joi.string().valid('add', 'remove').required().messages({
        'any.only': 'Action harus "add" atau "remove"',
        'any.required': 'Action wajib diisi'
    }),
    participants: Joi.array()
        .items(Joi.string().pattern(/^[\d+\-\s()]+$/))
        .min(1)
        .max(100)
        .required()
        .messages({
            'array.min': 'Minimal 1 participant diperlukan',
            'array.max': 'Maksimal 100 participants per request',
            'any.required': 'Array participants wajib diisi'
        })
});

// Validation schema untuk broadcast bulk message
const broadcastMessageSchema = Joi.object({
    phoneNumbers: Joi.array()
        .items(Joi.string().pattern(/^[\d+\-\s()]+$/))
        .min(1)
        .max(100)
        .required()
        .messages({
            'array.min': 'Minimal 1 nomor telepon diperlukan',
            'array.max': 'Maksimal 100 nomor telepon per broadcast',
            'any.required': 'Array nomor telepon wajib diisi'
        }),
    message: Joi.string().max(4096).required().messages({
        'string.empty': 'Pesan tidak boleh kosong',
        'string.max': 'Pesan tidak boleh lebih dari 4096 karakter',
        'any.required': 'Pesan wajib diisi'
    })
});

// Validation schema untuk broadcast bulk image
const broadcastImageSchema = Joi.object({
    phoneNumbers: Joi.array()
        .items(Joi.string().pattern(/^[\d+\-\s()]+$/))
        .min(1)
        .max(50)
        .required()
        .messages({
            'array.min': 'Minimal 1 nomor telepon diperlukan',
            'array.max': 'Maksimal 50 nomor telepon per image broadcast',
            'any.required': 'Array nomor telepon wajib diisi'
        }),
    imageUrl: Joi.string().uri().required().messages({
        'string.empty': 'Image URL tidak boleh kosong',
        'string.uri': 'Image URL harus berupa URL yang valid',
        'any.required': 'Image URL wajib diisi'
    }),
    caption: Joi.string().max(1024).optional().messages({
        'string.max': 'Caption tidak boleh lebih dari 1024 karakter'
    })
});

module.exports = {
    sendToDeviceSchema,
    sendToMultipleDevicesSchema,
    sendToTopicSchema,
    topicSubscriptionSchema,
    sendDualMessageSchema,
    createBroadcastListSchema,
    sendToBroadcastListSchema,
    sendImageToBroadcastListSchema,
    updateBroadcastListParticipantsSchema,
    broadcastMessageSchema,
    broadcastImageSchema
};

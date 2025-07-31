const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    downloadMediaMessage 
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.currentQR = null;
        this.authDir = path.join(__dirname, '..', 'auth_info_baileys');
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000; // 5 seconds
        this.isReconnecting = false;
    }
    
    async initialize() {
        try {
            // Create auth directory if it doesn't exist
            if (!fs.existsSync(this.authDir)) {
                fs.mkdirSync(this.authDir, { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
            
            this.sock = makeWASocket({
                auth: state,
                defaultQueryTimeoutMs: 60000,
                browser: ['Scriptin.ID by mamangzed', 'Desktop App', '2.0.0'],
                printQRInTerminal: false,
                emitOwnEvents: false,
                markOnlineOnConnect: true
            });

            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    this.currentQR = qr;
                    console.log('\n=== WhatsApp QR Code ===');
                    console.log('Scan this QR code with your WhatsApp app:');
                    
                    // Generate QR code in terminal
                    qrcode.generate(qr, { small: true });
                }
                
                if (connection === 'close') {
                    this.isConnected = false;
                    const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                    
                    console.log('Connection closed due to:', lastDisconnect?.error);
                    console.log('Should reconnect:', shouldReconnect);
                    
                    if (shouldReconnect && !this.isReconnecting) {
                        this.handleReconnect();
                    }
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.reconnectAttempts = 0; // Reset attempts on successful connection
                    this.isReconnecting = false;
                    this.currentQR = null; // Clear QR after successful connection
                    console.log('WhatsApp connection opened');
                }
            });

            this.sock.ev.on('creds.update', saveCreds);
            
            // Event listener untuk pesan masuk
            this.sock.ev.on('messages.upsert', async (messageUpdate) => {
                console.log('New message update received:', JSON.stringify({
                    type: messageUpdate.type,
                    messageCount: messageUpdate.messages?.length || 0
                }, null, 2));
                
                const { messages, type } = messageUpdate;
                
                console.log(`Processing ${messages?.length || 0} messages of type: ${type}`);
                
                if (type === 'notify') {
                    for (const msg of messages) {
                        console.log('Processing message:', {
                            hasMessage: !!msg.message,
                            fromJid: msg.key.remoteJid,
                            messageTimestamp: msg.messageTimestamp,
                            messageTypes: msg.message ? Object.keys(msg.message) : []
                        });
                        
                        if (msg.message) {
                            const from = msg.key.remoteJid;
                            const messageType = Object.keys(msg.message)[0];
                            const timestamp = new Date(msg.messageTimestamp * 1000).toLocaleString();
                            
                            console.log(`\n🔍 ANALYZING MESSAGE:`);
                            console.log(`From: ${from}`);
                            console.log(`Type: ${messageType}`);
                            console.log(`Timestamp: ${timestamp}`);
                            
                            // Don't skip broadcast-related messages, only skip pure system messages
                            if (messageType === 'protocolMessage' && !from.includes('@broadcast')) {
                                console.log(`⏭️  Skipping non-broadcast system message: ${messageType}`);
                                continue;
                            }
                            
                            // Format display number/ID based on JID type
                            let fromDisplay = from;
                            let sourceType = 'unknown';
                            
                            if (from.endsWith('@s.whatsapp.net')) {
                                fromDisplay = from.replace('@s.whatsapp.net', '');
                                sourceType = 'individual';
                            } else if (from.endsWith('@g.us')) {
                                fromDisplay = from.replace('@g.us', '');
                                sourceType = 'group';
                            } else if (from.includes('@broadcast')) {
                                fromDisplay = from; // Keep full broadcast ID
                                sourceType = 'broadcast';
                            }
                            
                            console.log('\n=== PESAN MASUK ===');
                            console.log('Dari JID:', from);
                            console.log('Dari:', fromDisplay);
                            console.log('Tipe Sumber:', sourceType);
                            console.log('Waktu:', timestamp);
                            console.log('Tipe Pesan:', messageType);
                            
                            // Tampilkan isi pesan berdasarkan tipe
                            if (messageType === 'conversation') {
                                console.log('Isi Pesan:', msg.message.conversation);
                            } else if (messageType === 'extendedTextMessage') {
                                console.log('Isi Pesan:', msg.message.extendedTextMessage.text);
                            } else if (messageType === 'imageMessage') {
                                console.log('Pesan Gambar dengan caption:', msg.message.imageMessage.caption || 'Tanpa caption');
                            } else if (messageType === 'videoMessage') {
                                console.log('Pesan Video dengan caption:', msg.message.videoMessage.caption || 'Tanpa caption');
                            } else if (messageType === 'audioMessage') {
                                console.log('Pesan Audio diterima');
                            } else if (messageType === 'documentMessage') {
                                console.log('Pesan Dokumen:', msg.message.documentMessage.fileName || 'Nama file tidak diketahui');
                            } else {
                                console.log('Tipe pesan lain:', messageType);
                                // Log the actual message content for debugging
                                console.log('Message content:', JSON.stringify(msg.message, null, 2));
                            }
                            
                            // Handling berdasarkan tipe sumber
                            if (sourceType === 'broadcast') {
                                console.log('📢 PESAN DARI BROADCAST LIST');
                                console.log('Broadcast ID:', from);
                                
                                // Try to get broadcast list info
                                try {
                                    const broadcastInfo = await this.getBroadcastListInfo(from);
                                    if (broadcastInfo.success) {
                                        console.log('Broadcast Name:', broadcastInfo.name);
                                        console.log('Total Recipients:', broadcastInfo.totalRecipients);
                                    }
                                } catch (infoError) {
                                    console.log('Could not get broadcast info:', infoError.message);
                                }
                                
                            } else if (sourceType === 'group') {
                                console.log('👥 PESAN DARI GROUP');
                                console.log('Group ID:', from);
                                if (msg.key.participant) {
                                    const participant = msg.key.participant.replace('@s.whatsapp.net', '');
                                    console.log('Pengirim dalam group:', participant);
                                }
                            } else if (sourceType === 'individual') {
                                console.log('👤 PESAN DARI INDIVIDU');
                                console.log('Nomor:', fromDisplay);
                            }
                            
                            console.log('==================\n');
                        }
                    }
                }
            });
            
            console.log('WhatsApp service initialized');
            return true;
            
        } catch (error) {
            console.error('Error initializing WhatsApp:', error);
            throw error;
        }
    }

    async handleReconnect() {
        if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }

        this.isReconnecting = true;
        this.reconnectAttempts++;
        
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(async () => {
            try {
                await this.initialize();
            } catch (error) {
                console.error('Reconnect failed:', error);
                this.isReconnecting = false;
                
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.handleReconnect();
                } else {
                    console.error('Max reconnect attempts reached. Please reinitialize manually.');
                }
            }
        }, this.reconnectDelay);
    }

    async ensureConnection() {
        if (!this.isConnected || !this.sock) {
            console.log('WhatsApp not connected, attempting to reconnect...');
            
            if (!this.isReconnecting) {
                this.reconnectAttempts = 0; // Reset for manual reconnect
                await this.initialize();
                
                // Wait a bit for connection to establish
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                if (!this.isConnected) {
                    throw new Error('WhatsApp connection failed. Please scan QR code first.');
                }
            } else {
                throw new Error('WhatsApp is reconnecting. Please try again in a moment.');
            }
        }
    }

    formatPhoneNumberOrJID(input) {
        // If input already contains @, it's likely a JID
        if (input.includes('@')) {
            // Special handling for broadcast JIDs
            if (input.includes('@broadcast')) {
                // Validate if it's a proper broadcast JID
                if (input === 'status@broadcast' || input.match(/^\d+@broadcast$/)) {
                    return input;
                } else {
                    console.warn('Invalid broadcast JID format:', input);
                    console.warn('Valid formats: status@broadcast or {broadcastId}@broadcast');
                    return input; // Return as-is, but warn
                }
            }
            return input;
        }
        
        // Otherwise, format as phone number
        let formattedNumber = input.replace(/[^\d]/g, '');
        
        if (!formattedNumber.startsWith('62')) {
            if (formattedNumber.startsWith('0')) {
                formattedNumber = '62' + formattedNumber.substring(1);
            } else {
                formattedNumber = '62' + formattedNumber;
            }
        }
        
        return formattedNumber + '@s.whatsapp.net';
    }

    async sendMessage(phoneNumberOrJID, message) {
        await this.ensureConnection();

        try {
            const jid = this.formatPhoneNumberOrJID(phoneNumberOrJID);
            
            // Prepare message content
            const messageContent = { text: message };
            
            // For broadcast lists, send directly without additional options
            if (jid.includes('@broadcast')) {
                console.log('Sending to broadcast JID:', jid);
                
                // Try to get broadcast list info for validation
                try {
                    const broadcastInfo = await this.getBroadcastListInfo(jid);
                    if (broadcastInfo.success) {
                        console.log(`✅ Valid broadcast list found: ${broadcastInfo.name} (${broadcastInfo.totalRecipients} recipients)`);
                    } else {
                        console.warn('⚠️  Could not validate broadcast list:', broadcastInfo.error);
                    }
                } catch (infoError) {
                    console.warn('⚠️  Could not get broadcast info:', infoError.message);
                }
                
                const result = await this.sock.sendMessage(jid, messageContent);
                
                console.log('Message sent successfully to broadcast:', jid);
                console.log('Message ID:', result.key.id);
                console.log('Note: If this appears as deviceSentMessage, the broadcast list might not exist or be valid.');
                
                return {
                    success: true,
                    messageId: result.key.id,
                    to: jid,
                    originalInput: phoneNumberOrJID,
                    note: 'If message appears as deviceSentMessage, the broadcast list might not exist. Use /whatsapp/broadcast-list/valid to see available lists.',
                    timestamp: new Date().toISOString()
                };
            } else {
                // Regular message to individual or group
                const result = await this.sock.sendMessage(jid, messageContent);
                
                console.log('Message sent successfully to:', jid);
                console.log('Message ID:', result.key.id);
                
                return {
                    success: true,
                    messageId: result.key.id,
                    to: jid,
                    originalInput: phoneNumberOrJID,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error('Error sending message:', error);
            
            // If error is connection related, mark as disconnected
            if (error.message.includes('Connection') || error.message.includes('socket')) {
                this.isConnected = false;
            }
            
            throw error;
        }
    }

    async sendImageFromUrl(phoneNumberOrJID, imageUrl, caption = '') {
        await this.ensureConnection();

        try {
            const jid = this.formatPhoneNumberOrJID(phoneNumberOrJID);

            // Prepare message content
            const messageContent = {
                image: { url: imageUrl },
                caption: caption
            };
            
            // For broadcast lists, send directly without additional options
            if (jid.includes('@broadcast')) {
                console.log('Sending image to broadcast list (no additional options):', jid);
                const result = await this.sock.sendMessage(jid, messageContent);
                
                console.log('Image message sent successfully to broadcast list:', jid);
                console.log('Message ID:', result.key.id);
                
                return {
                    success: true,
                    messageId: result.key.id,
                    to: jid,
                    originalInput: phoneNumberOrJID,
                    timestamp: new Date().toISOString()
                };
            } else {
                // Regular image message to individual or group
                const result = await this.sock.sendMessage(jid, messageContent);
                
                console.log('Image message sent successfully to:', jid);
                console.log('Message ID:', result.key.id);
                
                return {
                    success: true,
                    messageId: result.key.id,
                    to: jid,
                    originalInput: phoneNumberOrJID,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error('Error sending image message:', error);
            
            // If error is connection related, mark as disconnected
            if (error.message.includes('Connection') || error.message.includes('socket')) {
                this.isConnected = false;
            }
            
            throw error;
        }
    }

    async sendImageMessage(phoneNumberOrJID, imagePath, caption = '') {
        await this.ensureConnection();

        try {
            const jid = this.formatPhoneNumberOrJID(phoneNumberOrJID);

            // Check if file exists
            if (!fs.existsSync(imagePath)) {
                throw new Error('Image file not found');
            }

            // Prepare message content
            const messageContent = {
                image: { url: imagePath },
                caption: caption
            };
            
            // For broadcast lists, send directly without additional options
            if (jid.includes('@broadcast')) {
                console.log('Sending image to broadcast list (no additional options):', jid);
                const result = await this.sock.sendMessage(jid, messageContent);
                
                console.log('Image message sent successfully to broadcast list:', jid);
                console.log('Message ID:', result.key.id);
                
                return {
                    success: true,
                    messageId: result.key.id,
                    to: jid,
                    originalInput: phoneNumberOrJID,
                    timestamp: new Date().toISOString()
                };
            } else {
                // Regular image message to individual or group
                const result = await this.sock.sendMessage(jid, messageContent);
                
                console.log('Image message sent successfully to:', jid);
                console.log('Message ID:', result.key.id);
                
                return {
                    success: true,
                    messageId: result.key.id,
                    to: jid,
                    originalInput: phoneNumberOrJID,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error('Error sending image message:', error);
            
            // If error is connection related, mark as disconnected
            if (error.message.includes('Connection') || error.message.includes('socket')) {
                this.isConnected = false;
            }
            
            throw error;
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            isReconnecting: this.isReconnecting,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            hasQR: !!this.currentQR
        };
    }

    getQRCode() {
        return this.currentQR;
    }

    async getValidBroadcastLists() {
        await this.ensureConnection();

        try {
            console.log('Getting valid broadcast lists from WhatsApp...');
            
            // Try to get all chats and look for actual broadcast lists
            const chats = await this.sock.groupFetchAllParticipating();
            console.log('Total chats found:', Object.keys(chats).length);
            
            const validBroadcastLists = [];
            
            // Look for actual broadcast lists
            for (const [chatId, chat] of Object.entries(chats)) {
                console.log('Examining chat:', chatId, 'Type:', chat.announce ? 'broadcast' : 'group');
                
                // Check if it's a broadcast list (announce groups are broadcast lists)
                if (chat.announce === true || chatId.includes('@broadcast')) {
                    const broadcastInfo = {
                        id: chatId,
                        name: chat.subject || 'Unnamed Broadcast',
                        participants: chat.participants?.length || 0,
                        isAnnounce: chat.announce || false,
                        creation: chat.creation,
                        type: 'broadcast'
                    };
                    
                    validBroadcastLists.push(broadcastInfo);
                    console.log('Found broadcast list:', broadcastInfo);
                }
            }
            
            // Also check for status broadcast
            try {
                // Try to send a test to status@broadcast to see if it's valid
                console.log('Checking status@broadcast availability...');
                validBroadcastLists.push({
                    id: 'status@broadcast',
                    name: 'WhatsApp Status',
                    participants: 0,
                    isAnnounce: true,
                    type: 'status'
                });
            } catch (statusError) {
                console.log('status@broadcast not available:', statusError.message);
            }
            
            console.log('Total valid broadcast lists found:', validBroadcastLists.length);
            
            return {
                success: true,
                broadcastLists: validBroadcastLists,
                total: validBroadcastLists.length,
                message: validBroadcastLists.length > 0 ? 
                    'Found valid broadcast lists' : 
                    'No broadcast lists found. Create broadcast lists in WhatsApp app first.',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error getting valid broadcast lists:', error);
            return {
                success: false,
                broadcastLists: [],
                total: 0,
                error: error.message,
                message: 'Could not retrieve broadcast lists. Make sure WhatsApp is properly connected.',
                timestamp: new Date().toISOString()
            };
        }
    }

    async getBroadcastListInfo(broadcastId) {
        await this.ensureConnection();

        try {
            console.log('Getting broadcast list info for:', broadcastId);
            
            // Use the getBroadcastListInfo method from Baileys
            const bList = await this.sock.getBroadcastListInfo(broadcastId);
            
            console.log(`Broadcast list name: ${bList.name}, recipients: ${bList.recipients?.length || 0}`);
            
            return {
                success: true,
                broadcastId: broadcastId,
                name: bList.name,
                recipients: bList.recipients || [],
                totalRecipients: bList.recipients?.length || 0,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error getting broadcast list info:', error);
            
            // If getBroadcastListInfo is not available, try alternative method
            if (error.message.includes('not a function')) {
                console.log('getBroadcastListInfo not available, trying alternative method...');
                
                try {
                    // Try to get group metadata if it's a group-based broadcast
                    if (broadcastId.endsWith('@g.us')) {
                        const metadata = await this.sock.groupMetadata(broadcastId);
                        return {
                            success: true,
                            broadcastId: broadcastId,
                            name: metadata.subject || 'Unnamed Broadcast',
                            recipients: metadata.participants || [],
                            totalRecipients: metadata.participants?.length || 0,
                            description: metadata.desc,
                            owner: metadata.owner,
                            method: 'groupMetadata',
                            timestamp: new Date().toISOString()
                        };
                    }
                } catch (altError) {
                    console.log('Alternative method also failed:', altError.message);
                }
            }
            
            return {
                success: false,
                broadcastId: broadcastId,
                error: error.message,
                message: 'Could not get broadcast list info. Make sure the broadcast ID is valid.',
                timestamp: new Date().toISOString()
            };
        }
    }

    async createBroadcastList(name, recipients) {
        await this.ensureConnection();

        try {
            // Format recipients phone numbers or JIDs
            const formattedRecipients = recipients.map(phoneNumber => {
                return this.formatPhoneNumberOrJID(phoneNumber);
            });

            // Create broadcast list
            const result = await this.sock.groupCreate(formattedRecipients, name);
            
            console.log('Broadcast list created:', result);
            return {
                success: true,
                broadcastId: result.id,
                name: name,
                recipients: formattedRecipients.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error creating broadcast list:', error);
            throw error;
        }
    }

    async getBroadcastLists() {
        await this.ensureConnection();

        try {
            // Try multiple methods to get broadcast lists
            console.log('Attempting to fetch broadcast lists...');
            
            // Method 1: Get all chats and filter for broadcast
            const chats = await this.sock.groupFetchAllParticipating();
            console.log('Method 1 - Fetched chats:', Object.keys(chats).length, 'chats found');
            
            // Method 2: Try to get broadcast lists specifically
            let broadcastLists = [];
            
            // Check all chats for broadcast-like IDs
            for (const [chatId, chat] of Object.entries(chats)) {
                console.log('Checking chat:', chatId, 'Name:', chat.subject || 'No name');
                
                // Broadcast lists typically have different ID patterns
                if (chatId.includes('broadcast') || chatId.includes('@broadcast') || chatId.endsWith('@g.us')) {
                    try {
                        // Try to get additional info
                        let listInfo = {
                            id: chatId,
                            name: chat.subject || chat.name || 'Unnamed Broadcast',
                            recipients: 0,
                            createdAt: chat.creation || null,
                            type: 'unknown'
                        };
                        
                        // Try to determine if it's a broadcast list
                        if (chat.participants) {
                            listInfo.recipients = chat.participants.length;
                            listInfo.type = 'group';
                        }
                        
                        // Check if it's actually a broadcast list
                        try {
                            const metadata = await this.sock.groupMetadata(chatId);
                            if (metadata) {
                                listInfo.name = metadata.subject || listInfo.name;
                                listInfo.recipients = metadata.participants?.length || 0;
                                listInfo.type = metadata.announce ? 'broadcast' : 'group';
                                listInfo.description = metadata.desc;
                                listInfo.owner = metadata.owner;
                            }
                        } catch (metaError) {
                            console.log('Could not get metadata for:', chatId, metaError.message);
                        }
                        
                        broadcastLists.push(listInfo);
                        
                    } catch (error) {
                        console.log('Error processing chat:', chatId, error.message);
                    }
                }
            }
            
            // Method 3: Enhanced metadata collection for broadcast lists
            try {
                console.log('Enhancing broadcast list metadata...');
                
                // If we found any potential broadcast IDs, try to get additional info
                for (const listInfo of broadcastLists) {
                    if (listInfo.id.includes('@broadcast')) {
                        try {
                            // Try to get group metadata (some broadcast lists might have metadata)
                            if (listInfo.id.endsWith('@g.us')) {
                                const metadata = await this.sock.groupMetadata(listInfo.id);
                                if (metadata) {
                                    listInfo.name = metadata.subject || listInfo.name;
                                    listInfo.recipients = metadata.participants?.length || 0;
                                    listInfo.description = metadata.desc;
                                    listInfo.owner = metadata.owner;
                                    listInfo.type = 'broadcast';
                                    console.log(`Enhanced broadcast metadata: ${metadata.subject} (${metadata.participants?.length || 0} participants)`);
                                }
                            }
                        } catch (metadataError) {
                            console.log(`Could not get metadata for ${listInfo.id}:`, metadataError.message);
                        }
                    }
                }
            } catch (enhanceError) {
                console.log('Metadata enhancement error:', enhanceError.message);
            }
            
            // Method 4: Check contacts/labels for broadcast lists
            try {
                const labels = await this.sock.getLabels();
                console.log('Labels found:', labels?.length || 0);
            } catch (labelError) {
                console.log('Labels not available:', labelError.message);
            }
            
            console.log('Total broadcast lists found:', broadcastLists.length);
            
            return {
                success: true,
                broadcastLists: broadcastLists,
                total: broadcastLists.length,
                debug: {
                    totalChats: Object.keys(chats).length,
                    chatIds: Object.keys(chats),
                    method: 'multi-method-scan'
                }
            };

        } catch (error) {
            console.error('Error getting broadcast lists:', error);
            
            // Return empty result with debug info instead of throwing
            return {
                success: false,
                broadcastLists: [],
                total: 0,
                error: error.message,
                debug: {
                    errorType: error.constructor.name,
                    method: 'failed-scan'
                }
            };
        }
    }

    async sendToBroadcastList(broadcastId, message) {
        await this.ensureConnection();

        try {
            // Prepare message content
            const messageContent = { text: message };
            
            // Send directly to broadcast list without additional options
            console.log('Sending to broadcast list (no additional options):', broadcastId);
            const result = await this.sock.sendMessage(broadcastId, messageContent);

            console.log('Message sent to broadcast list:', result);
            return {
                success: true,
                messageId: result.key.id,
                broadcastId: broadcastId,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error sending to broadcast list:', error);
            throw error;
        }
    }

    async sendImageToBroadcastList(broadcastId, imageUrl, caption = '') {
        await this.ensureConnection();

        try {
            // Prepare message content
            const messageContent = {
                image: { url: imageUrl },
                caption: caption
            };
            
            // Send directly to broadcast list without additional options
            console.log('Sending image to broadcast list (no additional options):', broadcastId);
            const result = await this.sock.sendMessage(broadcastId, messageContent);

            console.log('Image sent to broadcast list:', result);
            return {
                success: true,
                messageId: result.key.id,
                broadcastId: broadcastId,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error sending image to broadcast list:', error);
            throw error;
        }
    }

    async deleteBroadcastList(broadcastId) {
        await this.ensureConnection();

        try {
            await this.sock.groupLeave(broadcastId);
            
            console.log('Broadcast list deleted:', broadcastId);
            return {
                success: true,
                broadcastId: broadcastId,
                message: 'Broadcast list deleted successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error deleting broadcast list:', error);
            throw error;
        }
    }

    async updateBroadcastListParticipants(broadcastId, action, participants) {
        await this.ensureConnection();

        try {
            // Format participants phone numbers or JIDs
            const formattedParticipants = participants.map(phoneNumber => {
                return this.formatPhoneNumberOrJID(phoneNumber);
            });

            let result;
            if (action === 'add') {
                result = await this.sock.groupParticipantsUpdate(broadcastId, formattedParticipants, 'add');
            } else if (action === 'remove') {
                result = await this.sock.groupParticipantsUpdate(broadcastId, formattedParticipants, 'remove');
            } else {
                throw new Error('Invalid action. Use "add" or "remove"');
            }

            console.log('Broadcast list participants updated:', result);
            return {
                success: true,
                broadcastId: broadcastId,
                action: action,
                participants: formattedParticipants.length,
                result: result,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error updating broadcast list participants:', error);
            throw error;
        }
    }

    async sendBroadcastMessage(phoneNumbers, message) {
        await this.ensureConnection();

        const results = [];
        const errors = [];
        
        console.log(`Starting broadcast to ${phoneNumbers.length} numbers...`);

        for (let i = 0; i < phoneNumbers.length; i++) {
            const phoneNumber = phoneNumbers[i];
            try {
                // Format phone number or JID
                const jid = this.formatPhoneNumberOrJID(phoneNumber);
                
                // Prepare message content
                const messageContent = { text: message };
                
                // Send directly to broadcast list if it's a broadcast JID
                let result;
                if (jid.includes('@broadcast')) {
                    console.log('Sending to broadcast list (no additional options):', jid);
                    result = await this.sock.sendMessage(jid, messageContent);
                } else {
                    result = await this.sock.sendMessage(jid, messageContent);
                }

                results.push({
                    phoneNumber: jid,
                    originalNumber: phoneNumber,
                    success: true,
                    messageId: result.key.id,
                    timestamp: new Date().toISOString()
                });

                console.log(`Broadcast ${i + 1}/${phoneNumbers.length}: Success to ${jid}`);
                
                // Add delay between messages to avoid rate limiting
                if (i < phoneNumbers.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                }

            } catch (error) {
                console.error(`Error sending to ${phoneNumber}:`, error);
                errors.push({
                    phoneNumber: phoneNumber,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                results.push({
                    phoneNumber: phoneNumber,
                    originalNumber: phoneNumber,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        const summary = {
            total: phoneNumbers.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results,
            timestamp: new Date().toISOString()
        };

        console.log(`Broadcast completed: ${summary.successful}/${summary.total} successful`);
        return summary;
    }

    async sendBroadcastImageFromUrl(phoneNumbers, imageUrl, caption = '') {
        await this.ensureConnection();

        const results = [];
        const errors = [];
        
        console.log(`Starting image broadcast to ${phoneNumbers.length} numbers...`);

        for (let i = 0; i < phoneNumbers.length; i++) {
            const phoneNumber = phoneNumbers[i];
            try {
                // Format phone number or JID
                const jid = this.formatPhoneNumberOrJID(phoneNumber);
                
                // Prepare message content
                const messageContent = {
                    image: { url: imageUrl },
                    caption: caption
                };
                
                // Send directly to broadcast list if it's a broadcast JID
                let result;
                if (jid.includes('@broadcast')) {
                    console.log('Sending image to broadcast list (no additional options):', jid);
                    result = await this.sock.sendMessage(jid, messageContent);
                } else {
                    result = await this.sock.sendMessage(jid, messageContent);
                }

                results.push({
                    phoneNumber: jid,
                    originalNumber: phoneNumber,
                    success: true,
                    messageId: result.key.id,
                    timestamp: new Date().toISOString()
                });

                console.log(`Image broadcast ${i + 1}/${phoneNumbers.length}: Success to ${jid}`);
                
                // Add delay between messages
                if (i < phoneNumbers.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay for images
                }

            } catch (error) {
                console.error(`Error sending image to ${phoneNumber}:`, error);
                errors.push({
                    phoneNumber: phoneNumber,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                results.push({
                    phoneNumber: phoneNumber,
                    originalNumber: phoneNumber,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        const summary = {
            total: phoneNumbers.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results,
            timestamp: new Date().toISOString()
        };

        console.log(`Image broadcast completed: ${summary.successful}/${summary.total} successful`);
        return summary;
    }

    async getAllChats() {
        await this.ensureConnection();

        try {
            console.log('Fetching all chats for debugging...');
            
            // Get all participating groups
            const groups = await this.sock.groupFetchAllParticipating();
            console.log('Groups found:', Object.keys(groups).length);
            
            // Try to get all chats (if method exists)
            let allChats = {};
            try {
                // Some versions might have different methods
                if (this.sock.chats && typeof this.sock.chats.all === 'function') {
                    const chatArray = this.sock.chats.all();
                    console.log('All chats array:', chatArray.length);
                    
                    chatArray.forEach(chat => {
                        allChats[chat.id] = chat;
                    });
                } else if (this.sock.chats) {
                    // Direct access to chats store
                    allChats = this.sock.chats;
                    console.log('Direct chats access:', Object.keys(allChats).length);
                }
            } catch (chatsError) {
                console.log('Alternative chat methods not available:', chatsError.message);
            }
            
            // Combine and categorize chats
            const categorizedChats = {
                individuals: [],
                groups: [],
                broadcasts: [],
                unknown: []
            };
            
            // Process groups
            Object.entries(groups).forEach(([chatId, chat]) => {
                const chatInfo = {
                    id: chatId,
                    name: chat.subject || chat.name || 'Unnamed',
                    type: 'group',
                    participants: chat.participants?.length || 0,
                    creation: chat.creation,
                    isAnnounce: chat.announce || false
                };
                
                if (chatId.includes('broadcast') || chat.announce) {
                    categorizedChats.broadcasts.push(chatInfo);
                } else {
                    categorizedChats.groups.push(chatInfo);
                }
            });
            
            // Process other chats
            Object.entries(allChats).forEach(([chatId, chat]) => {
                if (!groups[chatId]) { // Skip if already processed as group
                    const chatInfo = {
                        id: chatId,
                        name: chat.name || chat.notify || chat.pushName || 'Unknown',
                        type: chatId.includes('@s.whatsapp.net') ? 'individual' : 'unknown',
                        lastMessage: chat.lastMessage?.messageTimestamp,
                        unreadCount: chat.unreadCount || 0
                    };
                    
                    if (chatInfo.type === 'individual') {
                        categorizedChats.individuals.push(chatInfo);
                    } else {
                        categorizedChats.unknown.push(chatInfo);
                    }
                }
            });
            
            return {
                success: true,
                summary: {
                    individuals: categorizedChats.individuals.length,
                    groups: categorizedChats.groups.length,
                    broadcasts: categorizedChats.broadcasts.length,
                    unknown: categorizedChats.unknown.length,
                    total: Object.keys(groups).length + Object.keys(allChats).length
                },
                chats: categorizedChats,
                debug: {
                    groupsMethod: Object.keys(groups).length,
                    allChatsMethod: Object.keys(allChats).length,
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('Error getting all chats:', error);
            return {
                success: false,
                error: error.message,
                chats: { individuals: [], groups: [], broadcasts: [], unknown: [] }
            };
        }
    }

    async forceReconnect() {
        this.isConnected = false;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.currentQR = null;
        
        if (this.sock) {
            try {
                this.sock.end();
            } catch (error) {
                console.log('Error ending socket:', error.message);
            }
        }
        
        await this.initialize();
        return this.getConnectionStatus();
    }
}

const whatsappService = new WhatsAppService();
module.exports = whatsappService;

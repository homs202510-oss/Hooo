const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
    botName: process.env.BOT_NAME || 'PHANTOM',
    prefix: process.env.BOT_PREFIX || '/',
    ownerNumber: process.env.OWNER_NUMBER || '',
    pairingNumber: process.env.PAIRING_NUMBER || '',
    pingUrl: process.env.PING_URL || '',
    channelLink: process.env.CHANNEL_LINK || '',
    supportGroupLink: process.env.SUPPORT_GROUP_LINK || '',
    telegramLink: process.env.TELEGRAM_LINK || '',
    env: process.env.NODE_ENV || 'development',
    
    ai: {
        provider: process.env.AI_PROVIDER || 'openai',
        openaiKey: process.env.OPENAI_API_KEY || '',
        geminiKey: process.env.GEMINI_API_KEY || '',
    },
    
    paths: {
        root: __dirname,
        auth: path.join(__dirname, 'auth'),   // Baileys بيحتاج فولدر للجلسة (بيتعمل لوحده)
        data: __dirname,                       // phantom.db جنب الملفات
    },
};

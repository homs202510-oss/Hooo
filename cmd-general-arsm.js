// ارسم.js - توليد صور من وصف نصي باستخدام Pollinations.ai مع نظام نقاط (مثل اسال)
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // نستخدم axios بدلاً من fetch للتوافق مع CommonJS

const pointsPath = path.join(__dirname, 'db-points.json');
const ranksPath = path.join(__dirname, 'db-ranks.json');

// ========== التأكد من وجود الملفات ==========
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(ranksPath)) fs.writeFileSync(ranksPath, JSON.stringify({}, null, 2));

// ========== دوال مساعدة (نفس نظام اسال) ==========
function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } 
    catch { return {}; }
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getLevel(points) {
    if (points >= 1000000000) return '👑 DEVELOPER';
    if (points >= 100000000) return '🌀 KING OF POINTS';
    if (points >= 10000000) return '💀 BIG BOSS';
    if (points >= 1000000) return '🔥🔥 WTF';
    if (points >= 100000) return '🔪🩸 KILLER';
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '🔥 advanced';
    if (points >= 200) return '🌱 junior';
    return '🙂 beginner';
}

function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    num = Math.floor(num);
    if (num >= 1e15) return '∞';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + ' تريليون';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + ' مليار';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' مليون';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + ' ألف';
    return num.toString();
}

// ========== دالة الإرسال الموحدة (مثل اسال) ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎨 تـولـيـد الـصـور 🎨\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== ثوابت ==========
const PRICE = 50; // سعر التوليد

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['ارسم'],
    description: '🎨 توليد صور من وصف نصي (نظام نقاط)',
    category: 'عام',
    usage: '.ارسم <وصف الصورة>',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            // استخراج النص
            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || '';
            const args = text.trim().split(/\s+/).slice(1);
            const prompt = args.join(' ');

            // ===== إذا لم يكتب وصف =====
            if (!prompt) {
                const points = loadJSON(pointsPath);
                const userPoints = points[sender] || 0;
                await sendMessage(sock, chatId, [
                    '🎨 *كيفية الاستخدام:*',
                    '',
                    '📌 `.ارسم [وصف الصورة]`',
                    '',
                    '📝 *أمثلة:*',
                    '   `.ارسم غروب شمس على البحر`',
                    '   `.ارسم مدينة مستقبلية ليلاً`',
                    '',
                    `💰 *السعر:* ${PRICE} نقطة`,
                    `💰 *رصيدك الحالي:* ${formatNumber(userPoints)} نقطة`,
                    `🏅 *رتبتك:* ${getLevel(userPoints)}`
                ], msg);
                return;
            }

            // ===== التحقق من النقاط =====
            const points = loadJSON(pointsPath);
            const userPoints = points[sender] || 0;

            if (userPoints < PRICE) {
                await sendMessage(sock, chatId, [
                    '❌ *رصيد غير كافٍ*',
                    '',
                    `💰 سعر الخدمة: *${PRICE} نقطة*`,
                    `💰 رصيدك الحالي: *${formatNumber(userPoints)} نقطة*`,
                    `💰 المتبقي: *${formatNumber(PRICE - userPoints)} نقطة*`,
                    '',
                    '📌 يمكنك كسب النقاط عبر:',
                    '   • الفوز في المعارك ⚔️',
                    '   • هزيمة الوحوش 🐉',
                    '   • المشاركة في الفعاليات 🎯'
                ], msg);
                return;
            }

            // ===== خصم النقاط =====
            points[sender] = userPoints - PRICE;
            saveJSON(pointsPath, points);

            // ===== رسالة جاري التوليد =====
            await sendMessage(sock, chatId, [
                '⏳ *جاري توليد صورة احترافية...*',
                '',
                `📝 *الطلب:* ${prompt}`,
                `💰 *تم خصم:* ${PRICE} نقطة`,
                `📉 *الرصيد المتبقي:* ${formatNumber(points[sender])} نقطة`
            ], msg);

            // ===== توليد الصورة باستخدام Pollinations.ai =====
            try {
                const encodedPrompt = encodeURIComponent(prompt);
                const apiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=1024&nologo=true`;
                
                const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });
                if (response.status !== 200) throw new Error(`فشل التوليد: ${response.status}`);

                const imageBuffer = Buffer.from(response.data);

                // ===== إرسال الصورة =====
                const caption = `🖼️ *تم إنشاء الصورة بنجاح*
━━━━━━━━━━━━━━━━━━━━
🎨 *الطلب:* ${prompt}
💰 *السعر:* ${PRICE} نقطة
📉 *الرصيد المتبقي:* ${formatNumber(points[sender])} نقطة
🏅 *رتبتك:* ${getLevel(points[sender])}
━━━━━━━━━━━━━━━━━━━━
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: caption
                }, { quoted: msg });

                // ===== تحديث الرتب (إذا أردت) =====
                // يمكن إضافة نظام رتب هنا إذا أردت

            } catch (genError) {
                // ===== في حالة فشل التوليد: إرجاع النقاط =====
                points[sender] = (points[sender] || 0) + PRICE;
                saveJSON(pointsPath, points);

                await sendMessage(sock, chatId, [
                    '❌ *فشل توليد الصورة*',
                    '',
                    `📝 ${genError.message || 'خطأ غير معروف'}`,
                    '',
                    '📌 حاول بوصف مختلف أو جرب لاحقاً',
                    '💰 *تم إرجاع النقاط تلقائياً*'
                ], msg);
            }

        } catch (error) {
            console.error('❌ خطأ في أمر ارسم:', error);
            // في حالة خطأ عام، نحاول إرجاع النقاط إن أمكن
            try {
                const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
                const points = loadJSON(pointsPath);
                points[sender] = (points[sender] || 0) + PRICE;
                saveJSON(pointsPath, points);
            } catch {}
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ في النظام*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};
// اغنيه.js - تحميل صوت من تيك توك مقابل نقاط

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const commandPrice = 50;
const pointsFile = path.join(__dirname, 'db-points.json');

// ========== دوال النقاط ==========
function loadPoints() {
    if (!fs.existsSync(pointsFile)) {
        fs.writeFileSync(pointsFile, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(pointsFile));
}

function savePoints(data) {
    fs.writeFileSync(pointsFile, JSON.stringify(data, null, 2));
}

// ========== دالة تنسيق الأرقام ==========
function formatPoints(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    num = Math.floor(num);
    if (num >= 1e15) return '∞';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + ' تريليون';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + ' مليار';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' مليون';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + ' ألف';
    return num.toString();
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎵 تـحـمـيـل صـوت 🎵\n`;
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

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['اغنيه', 'أغنية', 'اغنية'],
    category: 'وسائط',
    description: '🎵 تحميل صوت من تيك توك مقابل نقاط',
    usage: '.اغنيه [كلمة البحث]',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        // ===== استخراج النص =====
        let fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        let searchText = fullText.replace(/^[.!،]?(اغنيه|تك|صوت)\s*/i, '').trim();

        if (!searchText && msg.args) {
            searchText = msg.args.join(' ').trim();
        }

        if (!searchText) {
            await sendMessage(sock, chatId, [
                '📖 *كيفية الاستخدام:*',
                '',
                '📌 `.اغنيه [كلمة البحث]`',
                '',
                '📝 *أمثلة:*',
                '   `.اغنيه قرآن`',
                '   `.اغنيه انمي`',
                '   `.اغنيه ريمكس`',
                '',
                `💰 *السعر:* ${commandPrice} نقطة`,
                '🎵 *المصدر:* تيك توك'
            ], msg);
            return;
        }

        // ===== التحقق من النقاط =====
        const points = loadPoints();
        const userPoints = points[sender] || 0;

        if (userPoints < commandPrice) {
            await sendMessage(sock, chatId, [
                '❌ *رصيد غير كافٍ*',
                '',
                `💰 سعر الخدمة: *${commandPrice} نقطة*`,
                `💰 رصيدك الحالي: *${formatPoints(userPoints)} نقطة*`,
                `💰 المتبقي: *${formatPoints(commandPrice - userPoints)} نقطة*`,
                '',
                '📌 يمكنك كسب النقاط عبر:',
                '   • الفوز في المعارك ⚔️',
                '   • هزيمة الوحوش 🐉',
                '   • المشاركة في الفعاليات 🎯'
            ], msg);
            return;
        }

        try {
            // ===== جلب الصوت =====
            const apiUrl = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(searchText)}`;

            const res = await axios.get(apiUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (res.status !== 200 || res.data.code !== 0 || !res.data.data?.videos?.length) {
                await sendMessage(sock, chatId, [
                    '🔍 *لا توجد نتائج*',
                    '',
                    `📌 لم نجد فيديوهات لـ "${searchText}"`,
                    '📌 جرب كلمة بحث مختلفة'
                ], msg);
                return;
            }

            const video = res.data.data.videos[0];
            const audioUrl = video.music || video.music_info?.play || video.music_info?.url;

            if (!audioUrl) {
                await sendMessage(sock, chatId, [
                    '❌ *لا يوجد صوت متاح*',
                    '',
                    '📌 هذا الفيديو لا يحتوي على صوت قابل للتحميل'
                ], msg);
                return;
            }

            // ===== خصم النقاط =====
            points[sender] = userPoints - commandPrice;
            savePoints(points);

            // ===== إرسال الصوت =====
            await sock.sendMessage(chatId, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt: false,
                caption: `🎵 *صوت من تيك توك*\n━━━━━━━━━━━━━━━━━━━━\n🔍 *البحث:* ${searchText}\n💰 *السعر:* ${commandPrice} نقطة\n📉 *الرصيد المتبقي:* ${formatPoints(points[sender])} نقطة\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
            }, { quoted: msg });

            // ===== رسالة تأكيد =====
            await sendMessage(sock, chatId, [
                '✅ *تم إرسال الصوت بنجاح!*',
                '',
                `💰 *تم خصم:* ${commandPrice} نقطة`,
                `📉 *الرصيد المتبقي:* ${formatPoints(points[sender])} نقطة`
            ], msg);

        } catch (error) {
            console.error('❌ خطأ في أمر اغنيه:', error);

            let errorLines = [
                '❌ *فشل جلب الصوت*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`
            ];

            if (error.code === 'ECONNABORTED') {
                errorLines = [
                    '⏰ *انتهت المهلة*',
                    '',
                    '📌 الخادم بطيء، حاول مرة أخرى',
                    '📌 أو جرب كلمة بحث مختلفة'
                ];
            }

            if (error.response?.status >= 500) {
                errorLines = [
                    '🚫 *الخدمة غير متاحة حالياً*',
                    '',
                    '📌 حاول مرة أخرى لاحقاً'
                ];
            }

            errorLines.push('');
            errorLines.push('💡 لم يتم خصم نقاط');

            await sendMessage(sock, chatId, errorLines, msg);
        }
    }
};
// شارة.js - تحميل شارات أنمي / مسلسلات / أفلام (نسخة محسنة بدون خطوط)
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const commandPrice = 50;
const pointsFile = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
if (!fs.existsSync(pointsFile)) fs.writeFileSync(pointsFile, JSON.stringify({}, null, 2));

function loadPoints() {
    try {
        return JSON.parse(fs.readFileSync(pointsFile));
    } catch {
        return {};
    }
}

function savePoints(data) {
    fs.writeFileSync(pointsFile, JSON.stringify(data, null, 2));
}

// ========== تحديد نوع الطلب ==========
function detectType(text) {
    const t = text.toLowerCase();

    if (t.includes('انمي') || t.includes('anime') || t.includes('شارة') || t.includes('اوست') || t.includes('opening')) {
        return '🎌 أنمي';
    }

    if (t.includes('مسلسل') || t.includes('series') || t.includes('netflix') || t.includes('drama')) {
        return '📺 مسلسل';
    }

    if (t.includes('فيلم') || t.includes('movie') || t.includes('cinema') || t.includes('film')) {
        return '🎬 فيلم';
    }

    return '🎵 عام';
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎵 تـحـمـيـل شـارات 🎵\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'شارة',
    category: 'وسائط',
    description: '🎵 تحميل شارات أنمي / مسلسلات / أفلام مقابل نقاط',
    usage: '.شارة [اسم]',
    price: commandPrice,

    async execute(sock, msg, args) {
        try {
            const chatId = msg.key.remoteJid;
            const sender = msg.key.participant || msg.key.remoteJid;

            const points = loadPoints();
            const userPoints = points[sender] || 0;

            // استخراج النص
            let searchText = '';

            if (args && Array.isArray(args)) {
                searchText = args.join(' ').trim();
            }

            if (!searchText && msg.message?.conversation) {
                searchText = msg.message.conversation.replace(/^\.شارة\s*/i, '').trim();
            }

            if (!searchText && msg.message?.extendedTextMessage?.text) {
                searchText = msg.message.extendedTextMessage.text.replace(/^\.شارة\s*/i, '').trim();
            }

            // عرض المساعدة
            if (!searchText) {
                const lines = [
                    '🎵 *تحميل شارات*',
                    '',
                    `💰 السعر: ${commandPrice} نقطة`,
                    `🪙 رصيدك: ${userPoints} نقطة`,
                    '',
                    '📖 الاستخدام:',
                    '.شارة [اسم الشارة]',
                    '',
                    '📝 أمثلة:',
                    '.شارة دراغون بول',
                    '.شارة ون بيس',
                    '.شارة مسلسل قيامة عثمان',
                    '.شارة فيلم تيتانيك'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // التحقق من الرصيد
            if (userPoints < commandPrice) {
                const lines = [
                    '❌ *نقاط غير كافية*',
                    '',
                    `💰 السعر: ${commandPrice} نقطة`,
                    `🪙 رصيدك: ${userPoints} نقطة`,
                    `💔 تحتاج: ${commandPrice - userPoints} نقطة إضافية`
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            const type = detectType(searchText);

            let finalSearch = searchText;

            if (type === '🎌 أنمي') {
                finalSearch = `${searchText} anime opening OST official`;
            }

            if (type === '📺 مسلسل') {
                finalSearch = `${searchText} series theme song opening`;
            }

            if (type === '🎬 فيلم') {
                finalSearch = `${searchText} movie soundtrack OST theme`;
            }

            // رسالة انتظار
            await sendMessage(sock, chatId, [
                `🔍 جاري البحث عن: "${searchText}"`,
                '⏳ جاري التحميل...'
            ], msg);

            const apiUrl = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(finalSearch)}`;

            const res = await axios.get(apiUrl, {
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (res.status !== 200 || res.data.code !== 0 || !res.data.data?.videos?.length) {
                await sendMessage(sock, chatId, [
                    '❌ لم يتم العثور على نتيجة مناسبة',
                    '',
                    '💡 حاول استخدام كلمات مختلفة'
                ], msg);
                return;
            }

            const videos = res.data.data.videos;

            // اختيار أفضل نتيجة
            const video =
                videos.find(v =>
                    (v.music_info?.title || v.title || '').toLowerCase().includes(searchText.toLowerCase())
                ) ||
                videos.find(v => v.music_info?.title) ||
                videos[0];

            const audioUrl = video.music || video.music_info?.play || video.music_info?.url;

            if (!audioUrl) {
                await sendMessage(sock, chatId, [
                    '❌ لا يوجد صوت متاح'
                ], msg);
                return;
            }

            const title = video.music_info?.title || video.title || searchText;
            const author = video.author?.nickname || 'غير معروف';

            // خصم النقاط قبل الإرسال
            points[sender] = userPoints - commandPrice;
            savePoints(points);

            // إرسال الصوت
            await sock.sendMessage(chatId, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${title}.mp3`
            }, { quoted: msg });

            const lines = [
                `✅ *تم التحميل بنجاح*`,
                '',
                `🎵 الاسم: ${title}`,
                `🎬 النوع: ${type}`,
                `👤 المؤلف: ${author}`,
                '',
                `💰 تم خصم ${commandPrice} نقطة`,
                `🪙 رصيدك: ${points[sender]} نقطة`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (err) {
            console.error('❌ خطأ في شارة:', err);

            await sendMessage(sock, chatId, [
                '❌ حدث خطأ أثناء التحميل',
                '',
                '💡 تأكد من اتصالك بالإنترنت',
                '🔄 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};
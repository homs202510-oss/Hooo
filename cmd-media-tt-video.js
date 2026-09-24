// تيك.js - تحميل فيديو من تيك توك (نسخة محسنة بدون خطوط)
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SEARCH_PRICE = 100;
const LINK_PRICE = 50;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_DOC_SIZE = 100 * 1024 * 1024;

const pointsPath = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));

function loadPoints() {
    try {
        return JSON.parse(fs.readFileSync(pointsPath));
    } catch {
        return {};
    }
}

function savePoints(data) {
    fs.writeFileSync(pointsPath, JSON.stringify(data, null, 2));
}

function isTikTokLink(text) {
    return /https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/\S+/i.test(text);
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎵 تـحـمـيـل تـيـك تـوك 🎵\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['تيك'],
    category: 'وسائط',
    description: '🎵 تحميل فيديو من تيك توك (بحث أو رابط)',
    usage: '.تيك [بحث أو رابط]',
    price: { search: SEARCH_PRICE, link: LINK_PRICE },

    async execute(sock, msg, args) {
        try {
            const chatId = msg.key.remoteJid;
            const sender = msg.key.participant || msg.key.remoteJid;

            const points = loadPoints();
            const userPoints = points[sender] || 0;

            let inputText = '';

            if (args && Array.isArray(args)) {
                inputText = args.join(' ').trim();
            }
            if (!inputText && msg.message?.conversation) {
                inputText = msg.message.conversation.replace(/^\.تيك\s*/, '').trim();
            }
            if (!inputText && msg.message?.extendedTextMessage?.text) {
                inputText = msg.message.extendedTextMessage.text.replace(/^\.تيك\s*/, '').trim();
            }

            // ===== عرض المساعدة =====
            if (!inputText) {
                const lines = [
                    '🎵 *تحميل فيديو تيك توك*',
                    '',
                    '📌 الاستخدام:',
                    '.تيك [اسم البحث] - بحث عن فيديو',
                    '.تيك [رابط] - تحميل من رابط',
                    '',
                    '💰 الأسعار:',
                    `• بحث: ${SEARCH_PRICE} نقطة`,
                    `• رابط: ${LINK_PRICE} نقطة`,
                    '',
                    '📝 أمثلة:',
                    '.تيك انمي',
                    '.تيك https://vt.tiktok.com/xxxxx'
                ];
                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            const isLink = isTikTokLink(inputText);
            const price = isLink ? LINK_PRICE : SEARCH_PRICE;

            if (userPoints < price) {
                const lines = [
                    '❌ *نقاط غير كافية*',
                    '',
                    `💰 السعر: ${price} نقطة`,
                    `🪙 رصيدك: ${userPoints} نقطة`,
                    `💔 تحتاج: ${price - userPoints} نقطة إضافية`
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== رسالة انتظار =====
            await sendMessage(sock, chatId, [
                `🔍 جاري البحث عن: "${inputText}"`,
                `💳 سيتم خصم ${price} نقطة بعد الإرسال`
            ], msg);

            // ===== جلب البيانات من API =====
            let apiUrl;
            if (isLink) {
                apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(inputText)}`;
            } else {
                apiUrl = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(inputText)}`;
            }

            const response = await axios.get(apiUrl, {
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (response.status !== 200 || response.data.code !== 0) {
                throw new Error('فشل الاتصال بالخادم');
            }

            let videoData;
            if (isLink) {
                videoData = response.data.data;
                if (!videoData || !videoData.play) throw new Error('لا يوجد فيديو');
            } else {
                const videos = response.data.data?.videos;
                if (!videos || !videos.length) throw new Error('لا توجد نتائج');
                videoData = videos[0];
                if (!videoData || !videoData.play) throw new Error('لا يوجد فيديو');
            }

            const videoUrl = videoData.play;
            const caption = `
🎬 ${videoData.title || 'فيديو تيك توك'}

👤 الحساب: ${videoData.author?.nickname || 'غير معروف'}
❤️ الإعجابات: ${(videoData.digg_count || 0).toLocaleString()}
💬 التعليقات: ${(videoData.comment_count || 0).toLocaleString()}
${isLink ? '🔗 رابط' : '🔍 بحث: ' + inputText}
`.trim();

            // ===== تحميل الفيديو =====
            let videoBuffer = null;
            let fileSize = 0;
            let downloadFailed = false;

            try {
                const videoRes = await axios.get(videoUrl, {
                    responseType: 'arraybuffer',
                    timeout: 60000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'Referer': 'https://www.tiktok.com/'
                    }
                });
                videoBuffer = Buffer.from(videoRes.data);
                fileSize = videoBuffer.length;
            } catch (downloadErr) {
                console.error('❌ فشل تحميل الفيديو:', downloadErr.message);
                downloadFailed = true;
            }

            // ===== إذا فشل التحميل أو الحجم كبير =====
            if (downloadFailed || fileSize > MAX_DOC_SIZE) {
                // خصم النقاط (لأننا قدمنا الرابط)
                points[sender] = userPoints - price;
                savePoints(points);

                const lines = [
                    '⚠️ لا يمكن تحميل الفيديو بسبب الحجم أو مشكلة في التنزيل.',
                    '',
                    `🔗 رابط المشاهدة:`,
                    `${videoUrl}`,
                    '',
                    `💰 تم خصم ${price} نقطة`,
                    `🪙 رصيدك: ${points[sender]} نقطة`
                ];
                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            // ===== إرسال الفيديو =====
            let sent = false;

            // محاولة إرسال كفيديو
            try {
                await sock.sendMessage(chatId, {
                    video: videoBuffer,
                    caption: caption,
                    mimetype: 'video/mp4'
                });
                sent = true;
            } catch (videoError) {
                console.error('❌ فشل إرسال كفيديو، نحاول كوثيقة:', videoError.message);
            }

            // إذا فشل، نحاول كوثيقة
            if (!sent) {
                try {
                    await sock.sendMessage(chatId, {
                        document: videoBuffer,
                        mimetype: 'video/mp4',
                        fileName: `تيك_${Date.now()}.mp4`,
                        caption: caption
                    });
                    sent = true;
                } catch (docError) {
                    console.error('❌ فشل إرسال كوثيقة، نرسل الرابط:', docError.message);
                }
            }

            // إذا فشل كل شيء، نرسل الرابط
            if (!sent) {
                await sock.sendMessage(chatId, {
                    text: `⚠️ تعذر رفع الفيديو، إليك الرابط:\n${videoUrl}\n\n${caption}`
                }, { quoted: msg });
            }

            // خصم النقاط
            points[sender] = userPoints - price;
            savePoints(points);

            const lines = [
                `✅ تم الإرسال بنجاح`,
                `💰 تم خصم ${price} نقطة`,
                `🪙 رصيدك: ${points[sender]} نقطة`
            ];
            await sendMessage(sock, chatId, lines, msg);

        } catch (error) {
            console.error('❌ خطأ في تيك:', error);

            let errorMsg = '❌ فشل التحميل';
            if (error.code === 'ECONNABORTED') errorMsg = '⏰ انتهت المهلة';
            else if (error.response?.status === 404) errorMsg = '🔍 لا توجد نتائج';
            else if (error.response?.status >= 500) errorMsg = '🚫 الخدمة غير متاحة';
            else if (error.message.includes('لا يوجد فيديو')) errorMsg = '❌ لم نجد فيديو';
            else if (error.message.includes('لا توجد نتائج')) errorMsg = '🔍 لا توجد نتائج للبحث';

            await sendMessage(sock, chatId, [
                `${errorMsg}`,
                '💡 لم يتم خصم نقاط',
                '🔄 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};
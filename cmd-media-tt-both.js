// توك.js - تحميل فيديو + صوت من تيك توك (يدعم الروابط والبحث)
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const commandPrice = 200;

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
    command: ['توك', 'تيكتوك'],
    category: 'وسائط',
    description: '🎬 تحميل فيديو + صوت من تيك توك (بحث أو رابط)',
    usage: '.توك [بحث أو رابط]',
    price: commandPrice,

    async execute(sock, msg, args) {
        try {
            const chatId = msg.key.remoteJid;
            const sender = msg.key.participant || msg.key.remoteJid;

            const points = loadPoints();
            const userPoints = points[sender] || 0;

            // استخراج النص
            let inputText = '';

            if (args && Array.isArray(args) && args.length) {
                inputText = args.join(' ').trim();
            }

            if (!inputText && msg.message?.conversation) {
                inputText = msg.message.conversation.replace(/^\.توك\s*/i, '').trim();
            }

            if (!inputText && msg.message?.extendedTextMessage?.text) {
                inputText = msg.message.extendedTextMessage.text.replace(/^\.توك\s*/i, '').trim();
            }

            // ===== عرض المساعدة =====
            if (!inputText) {
                const lines = [
                    '🎬 *تحميل تيك توك*',
                    '',
                    '📌 الاستخدام:',
                    '.توك [اسم البحث] - بحث عن فيديو',
                    '.توك [رابط] - تحميل من رابط',
                    '',
                    `💰 السعر: ${commandPrice} نقطة`,
                    '',
                    '📝 أمثلة:',
                    '.توك انمي',
                    '.توك https://vt.tiktok.com/xxxxx'
                ];
                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            // ===== التحقق من الرصيد =====
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

            // ===== رسالة انتظار =====
            await sendMessage(sock, chatId, [
                `🔍 جاري البحث عن: "${inputText}"`,
                `💳 سيتم خصم ${commandPrice} نقطة بعد الإرسال`
            ], msg);

            // ===== تحديد نوع الطلب (رابط أو بحث) =====
            const isLink = isTikTokLink(inputText);

            // ===== جلب البيانات من API =====
            let apiUrl;
            if (isLink) {
                apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(inputText)}`;
            } else {
                apiUrl = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(inputText)}`;
            }

            const res = await axios.get(apiUrl, {
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (res.status !== 200 || res.data.code !== 0) {
                throw new Error('فشل الاتصال بالخادم');
            }

            let video;
            if (isLink) {
                video = res.data.data;
                if (!video || !video.play) throw new Error('لا يوجد فيديو');
            } else {
                const videos = res.data.data?.videos;
                if (!videos || !videos.length) throw new Error('لا توجد نتائج');
                video = videos[0];
                if (!video || !video.play) throw new Error('لا يوجد فيديو');
            }

            const videoUrl = video.play;
            const audioUrl = video.music || video.music_info?.play || video.music_info?.url;

            if (!videoUrl || !audioUrl) {
                throw new Error('لا يمكن تحميل الفيديو أو الصوت');
            }

            const caption = `
🎬 ${video.title || 'فيديو تيك توك'}

👤 الحساب: ${video.author?.nickname || 'غير معروف'}
❤️ الإعجابات: ${(video.digg_count || 0).toLocaleString()}
💬 التعليقات: ${(video.comment_count || 0).toLocaleString()}
${isLink ? '🔗 رابط' : '🔍 بحث: ' + inputText}
`.trim();

            // ===== إرسال الفيديو =====
            try {
                await sock.sendMessage(chatId, {
                    video: { url: videoUrl },
                    caption: caption
                }, { quoted: msg });
            } catch (videoError) {
                console.error('❌ فشل إرسال الفيديو:', videoError.message);
                // محاولة إرسال كوثيقة
                try {
                    const videoRes = await axios.get(videoUrl, { responseType: 'arraybuffer' });
                    await sock.sendMessage(chatId, {
                        document: Buffer.from(videoRes.data),
                        mimetype: 'video/mp4',
                        fileName: `تيك_${Date.now()}.mp4`,
                        caption: caption
                    }, { quoted: msg });
                } catch (docError) {
                    console.error('❌ فشل إرسال كوثيقة:', docError.message);
                    // إذا فشل كل شيء، نرسل الرابط
                    await sock.sendMessage(chatId, {
                        text: `⚠️ تعذر رفع الفيديو، إليك الرابط:\n${videoUrl}`
                    }, { quoted: msg });
                }
            }

            // ===== انتظار بسيط =====
            await new Promise(r => setTimeout(r, 1500));

            // ===== إرسال الصوت =====
            try {
                await sock.sendMessage(chatId, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: msg });
            } catch (audioError) {
                console.error('❌ فشل إرسال الصوت:', audioError.message);
                await sock.sendMessage(chatId, {
                    text: `⚠️ تعذر رفع الصوت، إليك الرابط:\n${audioUrl}`
                }, { quoted: msg });
            }

            // ===== خصم النقاط =====
            points[sender] = userPoints - commandPrice;
            savePoints(points);

            const lines = [
                `✅ تم الإرسال بنجاح`,
                `💰 تم خصم ${commandPrice} نقطة`,
                `🪙 رصيدك: ${points[sender]} نقطة`
            ];
            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (err) {
            console.error('❌ خطأ في توك:', err);

            let errorMsg = '❌ حدث خطأ أثناء التحميل';
            if (err.code === 'ECONNABORTED') errorMsg = '⏰ انتهت المهلة';
            else if (err.response?.status === 404) errorMsg = '🔍 لا توجد نتائج';
            else if (err.response?.status >= 500) errorMsg = '🚫 الخدمة غير متاحة';
            else if (err.message.includes('لا يوجد فيديو')) errorMsg = '❌ لم نجد فيديو';
            else if (err.message.includes('لا توجد نتائج')) errorMsg = '🔍 لا توجد نتائج للبحث';
            else if (err.message.includes('لا يمكن تحميل')) errorMsg = '❌ لا يمكن تحميل المحتوى';

            await sendMessage(sock, chatId, [
                `${errorMsg}`,
                '💡 لم يتم خصم نقاط',
                '🔄 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};
// ابتهالات.js - تحميل ابتهالات دينية مقابل نقاط

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

    let msg = `🎙️ ابـتـهـالات دينـيـة 🎙️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== البحث عن ابتهال ==========
async function searchDhikr(query) {
    // تجربة صيغ بحث مختلفة
    const searchQueries = [
        `ابتهال ${query}`,
        `${query} ابتهال`,
        `${query} ديني`,
        `ابتهال ${query} ديني`,
        `${query} انشاد ديني`
    ];

    for (const searchTerm of searchQueries) {
        try {
            const apiUrl = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(searchTerm)}`;
            const res = await axios.get(apiUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (res.status === 200 && res.data.code === 0 && res.data.data?.videos?.length > 0) {
                return res.data.data.videos;
            }
        } catch (e) {
            console.log(`⚠️ فشل البحث بـ "${searchTerm}":`, e.message);
        }
    }
    return [];
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['ابتهالات', 'ابتهال', 'انشاد'],
    category: 'وسائط',
    description: '🎙️ تحميل ابتهالات دينية مقابل نقاط',
    usage: '.ابتهالات [اسم الابتهال أو المنشد]',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        // ===== استخراج النص =====
        let fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        let searchText = fullText.replace(/^[.!،]?(ابتهالات|ابتهال|إنشاد)\s*/i, '').trim();

        if (!searchText && msg.args) {
            searchText = msg.args.join(' ').trim();
        }

        if (!searchText) {
            await sendMessage(sock, chatId, [
                '📖 *كيفية الاستخدام:*',
                '',
                '📌 `.ابتهالات [اسم الابتهال أو المنشد]`',
                '',
                '📝 *أمثلة:*',
                '   `.ابتهالات النقشبندي`',
                '   `.ابتهالات مولاي`',
                '   `.ابتهالات طه`',
                '',
                `💰 *السعر:* ${commandPrice} نقطة`,
                '🎙️ *المصدر:* تيك توك'
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
            // ===== البحث =====
            const videos = await searchDhikr(searchText);

            if (videos.length === 0) {
                await sendMessage(sock, chatId, [
                    '🔍 *لا توجد نتائج*',
                    '',
                    `📌 لم نجد ابتهالات لـ "${searchText}"`,
                    '📌 جرب كلمات بحث مختلفة مثل:',
                    '   • اسم منشد معروف (النقشبندي، طه)',
                    '   • كلمات الابتهال (مولاي، طه)',
                    '   • نوع الابتهال (ديني، إنشاد)'
                ], msg);
                return;
            }

            // ===== اختيار فيديو عشوائي =====
            const video = videos[Math.floor(Math.random() * videos.length)];
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
            const videoTitle = video.title || searchText;
            await sock.sendMessage(chatId, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt: false,
                caption: `🎙️ *ابتهال ديني*\n━━━━━━━━━━━━━━━━━━━━\n📌 *العنوان:* ${videoTitle}\n🔍 *البحث:* ${searchText}\n💰 *السعر:* ${commandPrice} نقطة\n📉 *الرصيد المتبقي:* ${formatPoints(points[sender])} نقطة\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
            }, { quoted: msg });

            // ===== رسالة تأكيد =====
            await sendMessage(sock, chatId, [
                '✅ *تم إرسال الابتهال بنجاح!*',
                '',
                `💰 *تم خصم:* ${commandPrice} نقطة`,
                `📉 *الرصيد المتبقي:* ${formatPoints(points[sender])} نقطة`
            ], msg);

        } catch (error) {
            console.error('❌ خطأ في أمر ابتهالات:', error);

            let errorLines = [
                '❌ *فشل جلب الابتهال*',
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
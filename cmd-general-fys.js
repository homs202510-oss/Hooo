// فيسبوك.js - تحميل فيديو من فيسبوك (مع نظام نقاط) - نسخة نهائية مع تنزيل محلي

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const commandPrice = 50;
const pointsPath = path.join(__dirname, 'db-points.json');
const tempDir = (() => { const d = path.join(require('os').tmpdir(), 'phantom-tmp'); require('fs').mkdirSync(d, { recursive: true }); return d; })();

// ========== التأكد من وجود المجلدات ==========
if (!fs.existsSync(__dirname)) {
    fs.mkdirSync(__dirname, { recursive: true });
}
if (!fs.existsSync(pointsPath)) {
    fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// ========== دوال النقاط ==========
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

function getPoints(user) {
    const points = loadPoints();
    return points[user] || 0;
}

function deductPoints(user, amount) {
    const points = loadPoints();
    const current = points[user] || 0;

    if (current < amount) {
        return { success: false, message: `رصيدك ${current} نقطة، تحتاج ${amount} نقطة` };
    }

    points[user] = current - amount;
    savePoints(points);
    return { success: true };
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `📥 تـحـمـيـل فـيـسـبـوك 📥\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`;
    
    await sock.sendMessage(chatId, { 
        text: msg, 
        mentions 
    }, { 
        quoted: quoted 
    });
}

// ========== دوال مساعدة ==========
function parseString(string) {
    try {
        return JSON.parse(`{"text": "${string}"}`).text;
    } catch {
        return string;
    }
}

function match(data, ...patterns) {
    for (const pattern of patterns) {
        const result = data.match(pattern);
        if (result) return result;
    }
    return null;
}

// ========== تحميل فيديو من فيسبوك (جلب الرابط) ==========
async function fesnuk(postUrl, cookie = "", userAgent = "") {
    if (!postUrl || !postUrl.trim()) throw new Error("يرجى تحديد رابط فيسبوك صالح.");
    if (!/(facebook.com|fb.watch)/.test(postUrl)) throw new Error("رابط فيسبوك غير صالح.");

    const headers = {
        "sec-fetch-user": "?1",
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-site": "none",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "cache-control": "max-age=0",
        authority: "www.facebook.com",
        "upgrade-insecure-requests": "1",
        "accept-language": "en-GB,en;q=0.9",
        "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
        "user-agent": userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        cookie: cookie || "",
    };

    try {
        const { data } = await axios.get(postUrl, { headers, timeout: 30000 });
        const extractData = data.replace(/"/g, '"').replace(/&/g, "&");

        const sdUrl = match(extractData, /"browser_native_sd_url":"(.*?)"/, /sd_src\s*:\s*"([^"]*)"/)?.[1];
        const hdUrl = match(extractData, /"browser_native_hd_url":"(.*?)"/, /hd_src\s*:\s*"([^"]*)"/)?.[1];
        const title = match(extractData, /<meta\sname="description"\scontent="(.*?)"/)?.[1] || "";

        if (sdUrl) {
            return {
                url: postUrl,
                title: parseString(title),
                quality: {
                    sd: parseString(sdUrl),
                    hd: parseString(hdUrl || ""),
                },
            };
        } else {
            throw new Error("تعذر جلب الوسائط في هذا الوقت. حاول مرة أخرى.");
        }
    } catch (error) {
        console.error("Error:", error);
        throw new Error("تعذر جلب الوسائط في هذا الوقت. حاول مرة أخرى.");
    }
}

// ========== تحميل الملف إلى Buffer ==========
async function downloadVideoToBuffer(url) {
    const response = await axios({
        url: url,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.facebook.com/'
        }
    });
    return Buffer.from(response.data);
}

// ========== الأمر الرئيسي ==========
module.exports = {
    category: 'عام',
    command: ['فيسبوك', 'فيس'],
    description: '📥 تحميل فيديو من فيسبوك (50 نقطة)',
    usage: '.فيسبوك [رابط الفيديو]',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/).slice(1);
            const url = args[0];

            // ===== عرض المساعدة =====
            if (!url) {
                const userPoints = getPoints(sender);
                const lines = [
                    '📥 *تحميل فيديو من فيسبوك*',
                    '',
                    `💰 السعر: ${commandPrice} نقطة`,
                    `🪙 رصيدك: ${userPoints} نقطة`,
                    '',
                    '📖 *الاستخدام:*',
                    '.فيسبوك [رابط الفيديو]',
                    '',
                    '📝 *أمثلة:*',
                    '.فيسبوك https://fb.watch/xyz',
                    '.فيس https://facebook.com/watch?v=123'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== التحقق من صحة الرابط =====
            if (!/(facebook.com|fb.watch)/.test(url)) {
                await sendMessage(sock, chatId, [
                    '❌ *رابط غير صالح*',
                    '',
                    '📌 الرابط يجب أن يكون من فيسبوك (facebook.com أو fb.watch)'
                ], msg);
                return;
            }

            // ===== التحقق من النقاط =====
            const userPoints = getPoints(sender);
            if (userPoints < commandPrice) {
                await sendMessage(sock, chatId, [
                    '❌ *رصيدك غير كافٍ*',
                    '',
                    `🪙 رصيدك: ${userPoints} نقطة`,
                    `💰 المطلوب: ${commandPrice} نقطة`,
                    `💔 تحتاج: ${commandPrice - userPoints} نقطة إضافية`
                ], msg, [sender]);
                return;
            }

            // ===== رسالة جاري التحميل =====
            await sendMessage(sock, chatId, [
                '📥 *جاري تحميل الفيديو...*',
                '',
                `🔗 ${url}`
            ], msg);

            // ===== جلب روابط الفيديو =====
            const result = await fesnuk(url);

            if (!result.quality.sd) {
                await sendMessage(sock, chatId, [
                    '❌ *فشل التحميل*',
                    '',
                    '📌 تعذر جلب الفيديو، تأكد من صحة الرابط وحاول مرة أخرى.'
                ], msg);
                return;
            }

            // اختيار أفضل جودة
            const videoUrl = result.quality.hd || result.quality.sd;
            const quality = result.quality.hd ? 'HD' : 'SD';

            // ===== تحميل الفيديو إلى Buffer =====
            let videoBuffer;
            try {
                videoBuffer = await downloadVideoToBuffer(videoUrl);
            } catch (downloadErr) {
                console.error('❌ فشل تحميل الفيديو:', downloadErr.message);
                await sendMessage(sock, chatId, [
                    '❌ *فشل تحميل الفيديو*',
                    '',
                    '📌 تعذر تنزيل الفيديو من الخادم، حاول مرة أخرى.'
                ], msg);
                return;
            }

            if (!videoBuffer || videoBuffer.length < 1024) {
                await sendMessage(sock, chatId, [
                    '❌ *الملف فارغ أو تالف*',
                    '',
                    '📌 حاول مرة أخرى باستخدام رابط آخر.'
                ], msg);
                return;
            }

            // ===== خصم النقاط =====
            const deductionResult = deductPoints(sender, commandPrice);
            if (!deductionResult.success) {
                await sendMessage(sock, chatId, [
                    `❌ فشل الخصم: ${deductionResult.message}`
                ], msg);
                return;
            }

            const remainingPoints = getPoints(sender);
            const fileSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(1);

            // ===== إرسال الفيديو =====
            try {
                // إرسال الفيديو مباشرة
                await sock.sendMessage(chatId, {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption: `✅ *تم التحميل بنجاح*\n📌 *العنوان:* ${result.title.substring(0, 50)}${result.title.length > 50 ? '...' : ''}\n📊 *الجودة:* ${quality}\n💾 *الحجم:* ${fileSizeMB} MB\n💰 *تم خصم ${commandPrice} نقطة*\n🪙 *الرصيد المتبقي:* ${remainingPoints} نقطة`
                }, { quoted: msg });

                await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

            } catch (sendErr) {
                console.error('❌ فشل إرسال الفيديو:', sendErr.message);
                // محاولة إرساله كمستند إذا فشل كفيديو
                try {
                    await sock.sendMessage(chatId, {
                        document: videoBuffer,
                        mimetype: 'video/mp4',
                        fileName: `${result.title.substring(0, 30)}.mp4`,
                        caption: `✅ *تم التحميل (كملف)*\n📌 *العنوان:* ${result.title.substring(0, 50)}${result.title.length > 50 ? '...' : ''}\n📊 *الجودة:* ${quality}\n💾 *الحجم:* ${fileSizeMB} MB\n💰 *تم خصم ${commandPrice} نقطة*\n🪙 *الرصيد المتبقي:* ${remainingPoints} نقطة`
                    }, { quoted: msg });
                } catch (finalErr) {
                    await sendMessage(sock, chatId, [
                        '❌ *فشل إرسال الفيديو*',
                        '',
                        `📝 ${finalErr.message || 'خطأ غير معروف'}`,
                        '',
                        '📌 تم خصم النقاط، يمكنك المحاولة مرة أخرى.'
                    ], msg);
                }
            }

        } catch (error) {
            console.error('❌ خطأ في أمر فيسبوك:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 تأكد من صحة الرابط وحاول مرة أخرى.'
            ], msg);
        }
    }
};
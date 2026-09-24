// دمج.js - دمج إيموجيين في ملصق (نسخة محسنة بدون خطوط) مع النشر في جروب الملصقات (بدون رسالة إشعار)
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const webp = require("node-webpmux");
const crypto = require("crypto");

// ========== استيراد دوال نظام التبادل ==========
let loadData, getGroupName;
try {
    const exchangeModule = require('./cmd-guilds-exchange');
    loadData = exchangeModule.loadData;
    getGroupName = exchangeModule.getGroupName;
} catch (e) {
    console.error('❌ فشل استيراد دوال التبادل:', e.message);
    loadData = () => ({});
    getGroupName = async () => 'جروب غير معروف';
}

// ========== EXIF ==========
function generateStickerID() {
    return crypto.randomBytes(8).toString("hex");
}

function buildExifBuffer(packname, author, id, emojis = ["✨"]) {
    const jsonBuffer = Buffer.from(
        JSON.stringify({
            "sticker-pack-id": id,
            "sticker-pack-name": packname,
            "sticker-pack-publisher": author,
            emojis
        }),
        "utf8"
    );

    const exifAttr = Buffer.from([
        0x49, 0x49, 0x2A, 0x00,
        0x08, 0x00, 0x00, 0x00,
        0x01, 0x00,
        0x41, 0x57,
        0x07, 0x00,
        0x00, 0x00,
        0x00, 0x00,
        0x16, 0x00,
        0x00, 0x00
    ]);

    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);

    return exif;
}

async function addExif(buffer) {
    const img = new webp.Image();
    await img.load(buffer);

    img.exif = buildExifBuffer(
        "『⚕️ 𝑂⃝⃕ ╏ 𝐅𝐑𝐈𝐄𝐍𝐃𝐒 ⚘️ 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 』",
        "𝑷𝑯𝑨𝑵𝑻𝑶𝑴",
        generateStickerID(),
        ["🔥", "✨"]
    );

    return img.save(null);
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎨 دمـج الإمـوجـي 🎨\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: "دمج",
    category: "وسائط",
    description: "🎨 دمج إيموجيين في ملصق واحد",
    usage: ".دمج [إيموجي1] [إيموجي2]",
    example: ".دمج 😭 👄",

    async execute(sock, msg) {
        try {
            const from = msg.key.remoteJid;
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderName = msg.pushName || sender.split('@')[0];

            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
            const args = fullText.trim().split(/\s+/).slice(1);

            // ===== عرض المساعدة =====
            if (args.length < 2) {
                const lines = [
                    '🎨 *دمج الإيموجي*',
                    '',
                    '📌 الاستخدام:',
                    '.دمج [إيموجي1] [إيموجي2]',
                    '',
                    '📝 أمثلة:',
                    '.دمج 😭 👄',
                    '.دمج 🔥 ❤️',
                    '.دمج 🐱 👽',
                    '',
                    '💡 النتيجة: ملصق يجمع بين الإيموجيين'
                ];
                await sendMessage(sock, from, lines, msg);
                return;
            }

            const e1 = encodeURIComponent(args[0]);
            const e2 = encodeURIComponent(args[1]);
            const url = `https://emojik.vercel.app/s/${e1}_${e2}?size=512`;

            // ===== تفاعل جارٍ التحميل =====
            await sock.sendMessage(from, {
                react: { text: '⏳', key: msg.key }
            });

            const res = await axios.get(url, {
                responseType: "arraybuffer",
                timeout: 10000
            });

            if (!res.headers["content-type"]?.includes("image")) {
                await sendMessage(sock, from, [
                    '❌ فشل جلب الصورة',
                    '',
                    '💡 تأكد من كتابة الإيموجي بشكل صحيح'
                ], msg);
                return;
            }

            // ===== مجلد مؤقت =====
            const temp = path.join(__dirname, "../temp");
            if (!fs.existsSync(temp)) fs.mkdirSync(temp, { recursive: true });

            const inputPath = path.join(temp, `in-${Date.now()}.png`);
            const outputPath = path.join(temp, `out-${Date.now()}.webp`);

            fs.writeFileSync(inputPath, Buffer.from(res.data));

            // ===== تحويل إلى ملصق =====
            const ffmpegArgs = [
                "-y",
                "-i", inputPath,
                "-vf",
                "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000",
                "-vcodec", "libwebp",
                "-q:v", "75",
                "-preset", "default",
                "-loop", "0",
                "-an",
                outputPath
            ];

            execFile("ffmpeg", ffmpegArgs, async (err) => {
                try {
                    if (err || !fs.existsSync(outputPath)) {
                        await sendMessage(sock, from, [
                            '❌ فشل التحويل',
                            '',
                            '💡 تأكد من تثبيت ffmpeg'
                        ], msg);
                        return;
                    }

                    const webpBuffer = fs.readFileSync(outputPath);
                    const sticker = await addExif(webpBuffer);

                    // ===== تفاعل نجاح =====
                    await sock.sendMessage(from, {
                        react: { text: '✅', key: msg.key }
                    });

                    // ===== إرسال الملصق في الجروب الحالي =====
                    await sock.sendMessage(from, {
                        sticker
                    }, { quoted: msg });

                    // ===== نشر الملصق في جروب "ملصقات" (إن وجد) بدون رسالة إشعار =====
                    try {
                        const exchangeData = loadData();
                        const stickerGroups = exchangeData['ملصقات'] || [];

                        if (stickerGroups.length > 0) {
                            for (const groupJid of stickerGroups) {
                                if (groupJid === from) continue;
                                try {
                                    // إرسال الملصق فقط بدون رسالة إشعار
                                    await sock.sendMessage(groupJid, {
                                        sticker: sticker
                                    });
                                    console.log(`✅ نشر الملصق المدمج في ${groupJid}`);
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                } catch (e) {
                                    console.error(`❌ فشل النشر في ${groupJid}:`, e.message);
                                }
                            }
                        }
                    } catch (e) {
                        console.error('❌ خطأ في نشر الملصق المدمج:', e.message);
                    }

                } finally {
                    try {
                        if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                        if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    } catch (e) {}
                }
            });

        } catch (err) {
            console.error('❌ خطأ في دمج:', err);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حصل خطأ أثناء دمج الإيموجي',
                '',
                '💡 تأكد من الإيموجي وحاول مرة أخرى'
            ], msg);
        }
    }
};
// رابط.js - جلب رابط فيديو من يوتيوب (نسخة محسنة بدون خطوط)
const yts = require("yt-search");

module.exports = {
    command: "رابط",
    description: "🔗 جلب أول رابط فيديو من يوتيوب",
    category: "وسائط",
    usage: ".رابط [اسم الفيديو]",
    example: ".رابط naruto opening",

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            // ===== استخراج النص =====
            const text = msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                msg.message?.imageMessage?.caption ||
                msg.message?.videoMessage?.caption ||
                "";

            const args = text.trim().split(" ").slice(1).join(" ").trim();

            // ===== عرض المساعدة =====
            if (!args) {
                const lines = [
                    '🔗 *جلب رابط يوتيوب*',
                    '',
                    '📌 الاستخدام:',
                    '.رابط [اسم الفيديو]',
                    '',
                    '📝 مثال:',
                    '.رابط naruto opening'
                ];

                let msgText = `🔗 رابـط يـوتـيـوب 🔗\n`;
                msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
                for (const line of lines) {
                    msgText += `${line}\n`;
                }
                msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
                msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

                await sock.sendMessage(chatId, { text: msgText }, { quoted: msg });
                return;
            }

            // ===== تفاعل جاري البحث =====
            await sock.sendMessage(chatId, {
                react: { text: "🔍", key: msg.key }
            });

            // ===== البحث =====
            const search = await yts(args);

            if (!search || !search.videos || search.videos.length === 0) {
                await sock.sendMessage(chatId, {
                    react: { text: "❌", key: msg.key }
                });

                await sock.sendMessage(chatId, {
                    text: `❌ لم يتم العثور على نتائج لـ "${args}"`
                }, { quoted: msg });
                return;
            }

            const video = search.videos[0];

            // ===== تجهيز الرد =====
            const lines = [
                '🔗 *رابط الفيديو*',
                '',
                `🎬 العنوان: ${video.title}`,
                `👤 القناة: ${video.author.name}`,
                `⏱ المدة: ${video.timestamp}`,
                `👁 المشاهدات: ${video.views.toLocaleString()}`,
                `📅 منذ: ${video.ago}`,
                '',
                `🔗 ${video.url}`
            ];

            let msgText = `🔗 رابـط يـوتـيـوب 🔗\n`;
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            for (const line of lines) {
                msgText += `${line}\n`;
            }
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

            // ===== إرسال الصورة المصغرة إن وجدت =====
            if (video.thumbnail) {
                await sock.sendMessage(chatId, {
                    image: { url: video.thumbnail },
                    caption: msgText
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: msgText
                }, { quoted: msg });
            }

            // ===== تفاعل نجاح =====
            await sock.sendMessage(chatId, {
                react: { text: "✅", key: msg.key }
            });

        } catch (err) {
            console.error("❌ خطأ في رابط:", err);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حصل خطأ أثناء البحث\n\n📌 السبب:\n${err.message}`
            }, { quoted: msg });

            await sock.sendMessage(msg.key.remoteJid, {
                react: { text: "❌", key: msg.key }
            });
        }
    }
};
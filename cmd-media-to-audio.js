// لصوت.js - تحويل الفيديو إلى صوت (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');

// ===== ملف النقاط =====
const dir = path.join(require('os').tmpdir(), 'phantom-tmp');
const pointsFile = path.join(__dirname, 'db-points.json');

function loadPoints() {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (!fs.existsSync(pointsFile)) {
            fs.writeFileSync(pointsFile, JSON.stringify({}, null, 2));
        }

        const data = JSON.parse(fs.readFileSync(pointsFile));

        for (let id in data) {
            if (data[id] < 0) data[id] = 0;
        }

        return data;
    } catch (err) {
        console.error('loadPoints error:', err);
        fs.writeFileSync(pointsFile, JSON.stringify({}, null, 2));
        return {};
    }
}

function savePoints(data) {
    fs.writeFileSync(pointsFile, JSON.stringify(data, null, 2));
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🎵 تـحـويـل الـفـيـديـو 🎵\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'لصوت',
    category: 'وسائط',
    description: '🎵 تحويل فيديو إلى صوت مقابل نقاط',
    price: 50,

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const commandPrice = 50;

        // ===== النقاط =====
        const points = loadPoints();
        const userPoints = points[sender] || 0;

        // منع الاستخدام لو الرصيد غير كافي
        if (userPoints < commandPrice || userPoints <= 0) {
            await sendMessage(sock, chatId, [
                '❌ نقاطك غير كافية',
                `💰 السعر: ${commandPrice} نقطة`,
                `🪙 رصيدك: ${userPoints < 0 ? 0 : userPoints} نقطة`,
                `💔 تحتاج: ${commandPrice - userPoints} نقطة إضافية`
            ], msg, [sender]);
            return;
        }

        // ===== استخراج الفيديو =====
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted || !quoted.videoMessage) {
            await sendMessage(sock, chatId, [
                '⚠️ لازم ترد على فيديو',
                '',
                '📝 مثال: رد على فيديو واكتب .لصوت'
            ], msg);
            return;
        }

        let videoPath;
        let audioPath;

        try {
            await sock.sendMessage(chatId, {
                react: { text: "⏳", key: msg.key }
            });

            await sendMessage(sock, chatId, [
                '📥 جاري تحميل الفيديو...'
            ], msg);

            // تحميل الفيديو
            const stream = await downloadContentFromMessage(quoted.videoMessage, 'video');
            let buffer = Buffer.from([]);

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            videoPath = path.join(dir, `${Date.now()}.mp4`);
            audioPath = path.join(dir, `${Date.now()}.mp3`);

            fs.writeFileSync(videoPath, buffer);

            // تحويل صوت
            await new Promise((resolve, reject) => {
                exec(
                    `ffmpeg -y -i "${videoPath}" -vn -ar 44100 -ac 2 -b:a 192k "${audioPath}"`,
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // خصم النقاط بعد النجاح فقط
            points[sender] = Math.max(0, userPoints - commandPrice);
            savePoints(points);

            // تفاعل نجاح
            await sock.sendMessage(chatId, {
                react: { text: "✅", key: msg.key }
            });

            // إرسال الصوت
            await sock.sendMessage(chatId, {
                audio: { url: audioPath },
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: msg });

            // رسالة التأكيد
            await sendMessage(sock, chatId, [
                '🎵 *تم تحويل الفيديو إلى صوت*',
                '',
                `💰 الخصم: -${commandPrice} نقطة`,
                `📊 رصيدك الجديد: ${points[sender]} نقطة`
            ], msg, [sender]);

        } catch (err) {
            console.error('❌ خطأ لصوت:', err);
            await sendMessage(sock, chatId, [
                '❌ فشل التحويل ولم يتم خصم نقاط',
                `📌 ${err.message || 'خطأ غير معروف'}`
            ], msg);
        } finally {
            if (videoPath && fs.existsSync(videoPath)) {
                try { fs.unlinkSync(videoPath); } catch (e) {}
            }
            if (audioPath && fs.existsSync(audioPath)) {
                try { fs.unlinkSync(audioPath); } catch (e) {}
            }
        }
    }
};
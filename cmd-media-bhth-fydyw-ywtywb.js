// فيديو.js - تحميل فيديو من يوتيوب (يدعم البحث والرابط) مع نقاط

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const pointsPath = path.join(__dirname, 'db-points.json');
const videoPrice = 250;

function loadPoints() {
    if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, '{}');
    return JSON.parse(fs.readFileSync(pointsPath));
}

function savePoints(data) {
    fs.writeFileSync(pointsPath, JSON.stringify(data, null, 2));
}

// دالة للتحقق إذا كان الرابط يوتيوب
function isYouTubeLink(text) {
    return /https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\/\S+/i.test(text);
}

// ========== دالة تنسيق الرسالة ==========
function formatMessage(lines) {
    let msg = `🎞️ تـحـمـيـل الـفـيـديـو 🎞️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    return msg;
}

// ========== دالة الإرسال المنسقة ==========
async function sendFormatted(sock, chatId, lines, quoted = null, mentions = []) {
    const text = formatMessage(lines);
    await sock.sendMessage(chatId, { text, mentions }, { quoted });
}

module.exports = {
    command: 'فيديو',
    category: 'وسائط',
    description: '🎞️ يحمل فيديو من يوتيوب حسب اسم البحث أو الرابط.\n💰 السعر: 250 نقطة.',
    usage: '.فيديو [اسم الفيديو أو الرابط]',
price: videoPrice,

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        const body = msg.message?.extendedTextMessage?.text || msg.message?.conversation || '';
        const args = body.trim().split(/\s+/).slice(1);
        const query = args.join(' ');

        if (!query) {
            await sendFormatted(sock, chatId, [
                '❌ الرجاء كتابة اسم الفيديو أو الرابط.',
                '',
                '📌 مثال: `.فيديو أغنية حزينة`',
                '📌 أو: `.فيديو https://youtu.be/xxxxx`'
            ], msg);
            return;
        }

        let pointsData = loadPoints();
        let userPoints = pointsData[sender] || 0;

        if (userPoints < videoPrice) {
            await sendFormatted(sock, chatId, [
                '❌ *رصيد غير كافٍ*',
                '',
                `💰 سعر التحميل: *${videoPrice} نقطة*`,
                `💰 رصيدك الحالي: *${userPoints} نقطة*`,
                `💰 المتبقي: *${videoPrice - userPoints} نقطة*`,
                '',
                '📌 يمكنك كسب النقاط عبر:',
                '   • الفوز في المعارك ⚔️',
                '   • هزيمة الوحوش 🐉',
                '   • المشاركة في الفعاليات 🎯'
            ], msg);
            return;
        }

        // رسالة جاري البحث
        await sock.sendMessage(chatId, {
            text: `🔍 *جاري البحث عن:* ${query}\n⏳ قد يستغرق هذا بعض الوقت...`
        }, { quoted: msg });

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-'));
        const outPath = path.join(tmpDir, 'video.%(ext)s');

        // التحقق إذا كان الرابط
        const isLink = isYouTubeLink(query);

        let ytCommand;
        if (isLink) {
            // تحميل مباشر من الرابط
            ytCommand = `yt-dlp "${query}" -f "best[ext=mp4]" -o "${outPath}" --quiet --no-warnings`;
        } else {
            // بحث عن الفيديو
            ytCommand = `yt-dlp "ytsearch1:${query}" -f "best[ext=mp4]" -o "${outPath}" --quiet --no-warnings`;
        }

        console.log('📌 أمر yt-dlp:', ytCommand);

        exec(ytCommand, async (error, stdout, stderr) => {
            console.log('yt-dlp stdout:', stdout);
            console.log('yt-dlp stderr:', stderr);

            try {
                if (error) {
                    console.error('❌ خطأ في yt-dlp:', error);
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                    await sendFormatted(sock, chatId, [
                        '❌ *حدث خطأ أثناء تحميل الفيديو*',
                        '',
                        `📝 ${error.message || 'خطأ غير معروف'}`,
                        '',
                        '💡 لم يتم خصم نقاط'
                    ], msg);
                    return;
                }

                const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.mp4'));
                if (files.length === 0) {
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                    await sendFormatted(sock, chatId, [
                        '⚠️ *لم يتم العثور على فيديو مناسب*',
                        '',
                        `📌 لم نجد نتائج لـ "${query}"`,
                        '',
                        '💡 جرب كلمات بحث مختلفة'
                    ], msg);
                    return;
                }

                // خصم النقاط
                pointsData[sender] = userPoints - videoPrice;
                savePoints(pointsData);

                const videoPath = path.join(tmpDir, files[0]);
                const videoSize = fs.statSync(videoPath).size;

                // التحقق من حجم الفيديو (حد أقصى 16MB للواتساب)
                if (videoSize > 16 * 1024 * 1024) {
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                    await sendFormatted(sock, chatId, [
                        '⚠️ *الفيديو كبير جداً*',
                        '',
                        `📦 حجم الفيديو: ${(videoSize / (1024 * 1024)).toFixed(2)} MB`,
                        `📦 الحد الأقصى: 16 MB`,
                        '',
                        '💡 جرب فيديو آخر أو استخدم رابط مباشر',
                        '💡 تم استرجاع نقاطك'
                    ], msg);
                    return;
                }

                // بناء الكابتشن المنسق
                const caption = formatMessage([
                    '✅ *تم تحميل الفيديو بنجاح!*',
                    '',
                    `🎬 *العنوان:* ${query}`,
                    `📦 *الحجم:* ${(videoSize / (1024 * 1024)).toFixed(2)} MB`,
                    `💰 *تم خصم:* ${videoPrice} نقطة`,
                    `📉 *الرصيد المتبقي:* ${pointsData[sender]} نقطة`,
                    ''
                ]);

                await sock.sendMessage(chatId, {
                    video: fs.readFileSync(videoPath),
                    mimetype: 'video/mp4',
                    fileName: `${query.replace(/[<>:"/\\|?*]/g, '_')}.mp4`,
                    caption: caption
                }, { quoted: msg });

                fs.rmSync(tmpDir, { recursive: true, force: true });

            } catch (err) {
                console.error('❌ خطأ غير متوقع:', err);
                // استرجاع النقاط في حالة الفشل
                try {
                    pointsData[sender] = (pointsData[sender] || 0) + videoPrice;
                    savePoints(pointsData);
                } catch (saveError) {
                    console.error('Points restoration error:', saveError);
                }
                fs.rmSync(tmpDir, { recursive: true, force: true });
                await sendFormatted(sock, chatId, [
                    '❌ *حدث خطأ غير متوقع*',
                    '',
                    `📝 ${err.message || 'خطأ غير معروف'}`,
                    '',
                    '💡 تم استرجاع نقاطك'
                ], msg);
            }
        });
    }
};
// سجن.js - حبس عضو رمزي مع خصم نقاط عشوائية وإضافتها للقاضي (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(path.dirname(pointsPath))) fs.mkdirSync(path.dirname(pointsPath), { recursive: true });
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

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🔒 نـظـام الـسـجـن 🔒\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'سجن',
    description: '🔒 حبس عضو بشكل رمزي مع خصم نقاط عشوائية (5-20) وإضافتها للقاضي',
    category: 'تسلية',
    usage: '.سجن @العضو سبب السجن (أو رد على رسالته)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const senderId = msg.key.participant || msg.key.remoteJid;

            if (!chatId.endsWith('@g.us')) {
                await sendMessage(sock, chatId, [
                    '❌ هذا الأمر يعمل داخل المجموعات فقط.'
                ], msg);
                return;
            }

            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const parts = fullText.trim().split(/\s+/);
            const rest = parts.slice(1);

            const context = msg.message?.extendedTextMessage?.contextInfo || {};
            const mentionedJids = context.mentionedJid || [];
            let targetId = null;
            let reason = '';

            // تحديد السجين
            if (mentionedJids.length > 0) {
                targetId = mentionedJids[0];
                const mentionIndex = rest.findIndex(word => word.startsWith('@'));
                if (mentionIndex !== -1) {
                    const reasonParts = rest.slice(mentionIndex + 1);
                    reason = reasonParts.join(' ') || 'بدون سبب محدد';
                } else {
                    reason = 'بدون سبب محدد';
                }
            } else if (context.participant) {
                targetId = context.participant;
                reason = rest.join(' ') || 'بدون سبب محدد';
            }

            if (!targetId) {
                await sendMessage(sock, chatId, [
                    '❌ رد على رسالة الشخص أو اكتب .سجن @المنشن سبب السجن.',
                    '',
                    '📝 مثال: .سجن @منشن شتم'
                ], msg);
                return;
            }

            if (targetId === senderId) {
                await sendMessage(sock, chatId, [
                    '❌ لا يمكنك حبس نفسك!'
                ], msg);
                return;
            }

            if (targetId === sock.user.id) {
                await sendMessage(sock, chatId, [
                    '❌ لا يمكنك حبس البوت!'
                ], msg);
                return;
            }

            const points = loadPoints();
            const senderPoints = points[senderId] || 0;
            const targetPoints = points[targetId] || 0;

            const deduction = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
            const actualDeduction = Math.min(deduction, targetPoints);
            const newTargetPoints = targetPoints - actualDeduction;
            const newSenderPoints = senderPoints + actualDeduction;

            points[senderId] = newSenderPoints;
            points[targetId] = newTargetPoints;
            savePoints(points);

            // قائمة أسباب السجن المضحكة
            const funnyReasons = [
                'التحدث بصوت عالٍ',
                'النظر إلى القاضي بشكل مستفز',
                'التثاؤب أثناء المحاكمة',
                'أكل الفول في مكان غير مخصص',
                'الضحك بدون سبب',
                'تقليد صوت القاضي',
                'الاستماع للأغاني بصوت مرتفع',
                'الحديث عن السياسة',
                'إرسال ملصقات مزعجة',
                'التخلف عن الركب',
                'عدم الالتزام بالقوانين العرفية',
                'التباهي بنقاطه'
            ];

            const finalReason = reason || funnyReasons[Math.floor(Math.random() * funnyReasons.length)];

            const lines = [
                '🔒 *تم تنفيذ الحكم!*',
                '',
                `🚔 السجين: @${targetId.split('@')[0]}`,
                `📛 التهمة: ${finalReason}`,
                `💰 الغرامة: ${actualDeduction} نقطة`,
                `💰 القاضي (@${senderId.split('@')[0]}) حصل على ${actualDeduction} نقطة`,
                `⏳ مدة الحبس: غير محددة`,
                `👮‍♂️ القاضي: @${senderId.split('@')[0]}`,
                '',
                '🚨 أي محاولة هروب = تشديد العقوبة 🥶'
            ];

            await sendMessage(sock, chatId, lines, msg, [targetId, senderId]);

        } catch (err) {
            console.error('❌ خطأ أمر سجن:', err);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حصل خطأ أثناء تنفيذ أمر السجن.'
            ], msg);
        }
    }
};
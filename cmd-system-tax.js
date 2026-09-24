// ضريبة.js - نظام خصم نقاط من اللاعبين (للمطورين فقط) - نسخة محسنة ومتوافقة مع النظام الجديد
// الآن يمكن خصم الضريبة من أي لاعب حتى لو لم يكن لديه مملكة (يخصم من النقاط والبنك فقط)
const fs = require('fs');
const path = require('path');
const hay = require('./lib-roles');

const pointsPath = path.join(__dirname, 'db-points.json');
const kingdomPath = path.join(__dirname, 'db-kingdom.json');
const bankPath = path.join(__dirname, 'db-bank.json');

// التأكد من وجود الملفات
if (!fs.existsSync(path.dirname(pointsPath))) fs.mkdirSync(path.dirname(pointsPath), { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(kingdomPath)) fs.writeFileSync(kingdomPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(bankPath)) fs.writeFileSync(bankPath, JSON.stringify({}, null, 2));

function loadJSON(file) {
    if (!fs.existsSync(file)) return {};
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}
function saveJSON(file, data) {
    try {
        // نسخة احتياطية
        if (fs.existsSync(file)) {
            fs.writeFileSync(file + '.bak', fs.readFileSync(file));
        }
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('❌ فشل حفظ الملف:', file, e.message);
        return false;
    }
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `💰 نـظـام الـضـريـبة 💰\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'ضريبة',
    category: 'نظام',
    description: 'خصم نقاط من شخص (بالرد، المنشن أو الرقم يدويًا) - فقط للمطور',
    usage: '.ضريبة @منشن [المبلغ] أو .ضريبة رقم [المبلغ] أو رد على رسالة',

    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;
            const sender = m.key.participant || m.key.remoteJid;

            if (!sender || !chatId) return;

            const senderLid = hay.toLid(sender);

            // تحقق من كون المرسل مطور
            if (!(hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid))) {
                await sendMessage(sock, chatId, [
                    '🚫 هذا الأمر مخصص للمطور فقط.'
                ], m, [sender]);
                return;
            }

            const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = text.trim().split(/\s+/);
            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const quoted = m.message?.extendedTextMessage?.contextInfo?.participant || null;

            // استخراج الهدف
            let targetId = null;

            if (quoted) {
                targetId = quoted;
            } else if (mentioned.length > 0) {
                targetId = mentioned[0];
            } else if (args.length >= 2) {
                // محاولة استخراج رقم من النص
                const raw = args[1].replace(/\D/g, '');
                if (raw) targetId = `${raw}@s.whatsapp.net`;
            }

            // استخراج المبلغ (آخر معامل رقمي)
            let amount = 0;
            for (let i = args.length - 1; i >= 0; i--) {
                const num = parseInt(args[i]);
                if (!isNaN(num) && num > 0) {
                    amount = num;
                    break;
                }
            }

            if (!targetId || amount <= 0) {
                await sendMessage(sock, chatId, [
                    '❌ الصيغة غير صحيحة.',
                    '✅ مثال:',
                    '.ضريبة @منشن 1000',
                    '.ضريبة 2010XXXXXXXX 1000',
                    'أو رد على رسالة ثم .ضريبة 1000'
                ], m, [sender]);
                return;
            }

            if (targetId === sender) {
                await sendMessage(sock, chatId, [
                    '❌ لا يمكنك فرض ضريبة على نفسك.'
                ], m, [sender]);
                return;
            }

            const targetLid = hay.toLid(targetId);

            // التحقق من الصلاحيات
            const isSenderFounder = hay.isFounder(senderLid);
            const isSenderOwnerbot = hay.isOwnerbot(senderLid);
            const isSenderDeveloper = hay.isDeveloper(senderLid);

            const isTargetFounder = hay.isFounder(targetLid);
            const isTargetOwnerbot = hay.isOwnerbot(targetLid);
            const isTargetDeveloper = hay.isDeveloper(targetLid);

            // تطبيق قيود الصلاحيات
            if (isSenderFounder) {
                // الاونر يقدر يفرض ضريبة على أي أحد
            } else if (isSenderOwnerbot) {
                if (isTargetFounder) {
                    await sendMessage(sock, chatId, [
                        '🚫 لا يمكن فرض ضريبة على الاونر.'
                    ], m, [sender, targetId]);
                    return;
                }
            } else if (isSenderDeveloper) {
                if (isTargetFounder || isTargetOwnerbot || isTargetDeveloper) {
                    await sendMessage(sock, chatId, [
                        '🚫 لا يمكن فرض ضريبة على مطور أو أونر بوت.'
                    ], m, [sender, targetId]);
                    return;
                }
            }

            // تحميل البيانات
            const points = loadJSON(pointsPath);
            const bankData = loadJSON(bankPath);

            // ===== نعم للخصم حتى لو لم يكن لديه مملكة =====
            // نخصم من النقاط والبنك فقط، بغض النظر عن وجود مملكة

            const targetPoints = points[targetId] || 0;
            const targetBank = bankData[targetId]?.deposit || 0;

            // تطبيق الضريبة (خصم من النقاط أولاً، ثم من البنك إذا لم يكفِ)
            let remaining = amount;
            let deductedFromPoints = 0;
            let deductedFromBank = 0;

            if (targetPoints > 0) {
                if (targetPoints >= remaining) {
                    deductedFromPoints = remaining;
                    points[targetId] = targetPoints - remaining;
                    remaining = 0;
                } else {
                    deductedFromPoints = targetPoints;
                    points[targetId] = 0;
                    remaining -= targetPoints;
                }
            }

            if (remaining > 0 && targetBank > 0) {
                if (targetBank >= remaining) {
                    deductedFromBank = remaining;
                    bankData[targetId].deposit = targetBank - remaining;
                    remaining = 0;
                } else {
                    deductedFromBank = targetBank;
                    bankData[targetId].deposit = 0;
                    remaining -= targetBank;
                }
            }

            // حفظ التغييرات
            saveJSON(pointsPath, points);
            saveJSON(bankPath, bankData);

            // رسالة النتيجة
            const newBalance = points[targetId] || 0;
            const newBank = bankData[targetId]?.deposit || 0;

            const lines = [
                `💸 تم خصم *${amount}* نقطة من @${targetId.split('@')[0]} كضريبة.`,
                ...(deductedFromPoints > 0 ? [`💰 من النقاط: -${deductedFromPoints}`] : []),
                ...(deductedFromBank > 0 ? [`🏦 من البنك: -${deductedFromBank}`] : []),
                ...(remaining > 0 ? [`⚠️ متبقي غير مسدد: ${remaining} نقطة (رصيد غير كافٍ)`] : []),
                `📊 رصيده الحالي: ${newBalance} نقطة`,
                `🏦 وديعته الحالية: ${newBank} نقطة`,
                ...(newBalance < 0 ? [`⚠️ رصيد سالب: ${newBalance}`] : [])
            ];

            await sendMessage(sock, chatId, lines, m, [sender, targetId]);

        } catch (err) {
            console.error('❌ خطأ في أمر ضريبة:', err);
            await sendMessage(sock, m.key.remoteJid, [
                `❌ حدث خطأ أثناء تنفيذ الأمر: ${err.message}`,
                '📌 حاول مرة أخرى لاحقاً.'
            ], m);
        }
    }
};
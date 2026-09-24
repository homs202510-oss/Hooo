// تغير.js - تغيير اسم المملكة (مرة مجانية، ثم 500 نقطة) - نسخة متوافقة مع نظام التخزين المنفصل
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');

// ===== التأكد من وجود جميع الملفات =====
if (!fs.existsSync(MAIN_PATH)) fs.writeFileSync(MAIN_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}
function saveJSON(file, data) {
    try {
        if (fs.existsSync(file)) fs.writeFileSync(file + '.bak', fs.readFileSync(file));
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('❌ فشل حفظ الملف:', file, e.message);
        return false;
    }
}

// ========== دوال التخزين المنفصل ==========
function loadUserData(jid) {
    const main = loadJSON(MAIN_PATH)[jid] || {};
    return {
        level: main.level || 1,
        prosperity: main.prosperity || 0,
        lands: main.lands || 0,
        gold: main.gold || 0,
        name: main.name || `مملكة @${jid.split('@')[0]}`,
        owner: main.owner || jid,
        nameChangesUsed: main.nameChangesUsed || 0,
        lastActive: Date.now()
    };
}

function saveUserData(jid, data) {
    const main = loadJSON(MAIN_PATH);
    main[jid] = {
        level: data.level || 1,
        prosperity: data.prosperity || 0,
        lands: data.lands || 0,
        gold: data.gold || 0,
        name: data.name || `مملكة @${jid.split('@')[0]}`,
        owner: data.owner || jid,
        nameChangesUsed: data.nameChangesUsed || 0
    };
    saveJSON(MAIN_PATH, main);
}

function userExists(jid) {
    const main = loadJSON(MAIN_PATH);
    return !!main[jid];
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🏷️ تـغـيـيـر اسـم الـمـمـلـكـة 🏷️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['تغير', 'غير'],
    description: '🏷️ تغيير اسم المملكة (مرة مجانية، ثم 500 نقطة)',
    category: 'مملكة',
    usage: '.تغير [الاسم الجديد]',
    example: '.تغير مملكة النور',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            const body = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
            const args = body.split(/\s+/).slice(1);
            const newName = args.join(' ');

            // ===== عرض المساعدة =====
            if (!newName) {
                const points = loadJSON(pointsPath);
                const userPoints = points[sender] || 0;

                let nameInfo = '';
                if (userExists(sender)) {
                    const user = loadUserData(sender);
                    const freeChanges = 1;
                    const used = user.nameChangesUsed || 0;
                    const remaining = Math.max(0, freeChanges - used);
                    nameInfo = `📊 التغييرات المجانية المتبقية: ${remaining}`;
                    if (remaining === 0) {
                        nameInfo += `\n💰 تكلفة التغيير: 500 نقطة`;
                    }
                }

                const lines = [
                    '📖 *تغيير اسم المملكة*',
                    '',
                    '📌 الاستخدام:',
                    '.تغير [الاسم الجديد]',
                    '',
                    '📝 مثال:',
                    '.تغير مملكة النور',
                    '',
                    '💰 *السياسة:*',
                    '• التغيير الأول مجاني',
                    '• كل تغيير بعد ذلك بـ 500 نقطة',
                    nameInfo ? nameInfo : '',
                    '',
                    `🪙 رصيدك الحالي: ${userPoints} نقطة`
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== التحقق من طول الاسم =====
            if (newName.length < 3) {
                await sendMessage(sock, chatId, [
                    '❌ الاسم قصير جداً (يجب أن يكون 3 أحرف على الأقل).'
                ], msg, [sender]);
                return;
            }

            if (newName.length > 30) {
                await sendMessage(sock, chatId, [
                    '❌ الاسم طويل جداً (الحد الأقصى 30 حرفاً).'
                ], msg, [sender]);
                return;
            }

            // ===== التحقق من وجود مملكة =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    '📌 استخدم .لاعب جديد لتأسيس مملكتك.'
                ], msg, [sender]);
                return;
            }

            let user = loadUserData(sender);
            const freeChanges = 1;
            const cost = 500;

            if (user.nameChangesUsed === undefined || user.nameChangesUsed === null) user.nameChangesUsed = 0;

            // ===== التحقق من التغييرات المجانية =====
            if (user.nameChangesUsed >= freeChanges) {
                const points = loadJSON(pointsPath);
                const currentPoints = points[sender] || 0;

                if (currentPoints < cost) {
                    await sendMessage(sock, chatId, [
                        `❌ لا تملك ${cost} نقطة لتغيير الاسم.`,
                        `💰 رصيدك الحالي: ${currentPoints}`,
                        `💔 تحتاج: ${cost - currentPoints} نقطة إضافية`,
                        '',
                        '📌 يمكنك كسب النقاط من الألعاب والفعاليات.'
                    ], msg, [sender]);
                    return;
                }

                points[sender] = currentPoints - cost;
                saveJSON(pointsPath, points);

                await sendMessage(sock, chatId, [
                    `💰 تم خصم ${cost} نقطة من رصيدك.`
                ], msg, [sender]);
            } else {
                const remaining = freeChanges - user.nameChangesUsed;
                await sendMessage(sock, chatId, [
                    `✅ استخدمت التغيير المجاني (متبقي ${remaining} تغيير مجاني).`
                ], msg, [sender]);
            }

            // ===== تحديث الاسم =====
            const oldName = user.name;
            user.name = newName;
            user.nameChangesUsed = (user.nameChangesUsed || 0) + 1;
            user.lastActive = Date.now();
            saveUserData(sender, user);

            const remaining = Math.max(0, freeChanges - user.nameChangesUsed);
            const lines = [
                `✅ تم تغيير اسم مملكتك!`,
                '',
                `📝 الاسم القديم: ${oldName}`,
                `📝 الاسم الجديد: *${newName}*`,
                `📊 التغييرات المجانية المتبقية: ${remaining}`,
                user.nameChangesUsed > freeChanges ? `💰 تكلفة التغيير القادم: ${cost} نقطة` : ''
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر تغير:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تغيير الاسم.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};
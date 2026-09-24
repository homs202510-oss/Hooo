// سرقة.js - نظام سرقة النقاط (نسخة محسنة مع حماية البنك ودعم المعاهدات)
const fs = require('fs');
const path = require('path');
const hay = require('./lib-roles');

const pointsPath = path.join(__dirname, 'db-points.json');
const logsPath = path.join(__dirname, 'db-stealLogs.json');
const hiddenPath = path.join(__dirname, 'db-hidden-points.json');
const treatiesPath = path.join(__dirname, 'db-treaties.json');

if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, '{}');
if (!fs.existsSync(logsPath)) fs.writeFileSync(logsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(hiddenPath)) fs.writeFileSync(hiddenPath, JSON.stringify([], null, 2));
if (!fs.existsSync(treatiesPath)) fs.writeFileSync(treatiesPath, JSON.stringify({}, null, 2));

const cooldown = new Map();
const COOLDOWN_TIME = 8 * 1000; // 60 ثانية
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function loadJSON(file, fallback = {}) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return fallback; }
}
function saveJSON(file, data) {
    try {
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
function getNumber(jid) { return jid ? jid.toString().replace(/[^0-9]/g, '') : ''; }

// ========== دوال المعاهدات ==========
function loadTreaties() { return loadJSON(treatiesPath, {}); }

function getActiveTreaty(jid1, jid2, treaties) {
    for (const [key, treaty] of Object.entries(treaties)) {
        if (treaty.status === 'accepted') {
            if ((treaty.party1 === jid1 && treaty.party2 === jid2) ||
                (treaty.party1 === jid2 && treaty.party2 === jid1)) {
                return treaty;
            }
        }
    }
    return null;
}

// ========== دوال الإخفاء ==========
function getHidden() { return loadJSON(hiddenPath, []); }
function isHidden(user) { return getHidden().includes(user); }

// ========== دوال الرتب ==========
function isFounder(jid) {
    try { const lid = hay.toLid(jid); return hay.isFounder(lid); } catch { return false; }
}
function isOwnerbot(jid) {
    try { const lid = hay.toLid(jid); return hay.isOwnerbot(lid); } catch { return false; }
}
function isDeveloper(jid) {
    try { const lid = hay.toLid(jid); return hay.isDeveloper(lid); } catch { return false; }
}

// ========== هرم الصلاحيات ==========
function canSteal(actor, target) {
    const actorIsFounder = isFounder(actor);
    const actorIsOwner = isOwnerbot(actor);
    const actorIsDev = isDeveloper(actor);

    const targetIsFounder = isFounder(target);
    const targetIsOwner = isOwnerbot(target);
    const targetIsDev = isDeveloper(target);

    if (actorIsFounder) return true;
    if (actorIsOwner) {
        if (targetIsFounder) return false;
        return true;
    }
    if (actorIsDev) {
        if (targetIsFounder || targetIsOwner) return false;
        return true;
    }
    if (targetIsFounder || targetIsOwner || targetIsDev) return false;
    return true;
}

function getLevel(points) {
    if (points >= 1000000000) return '👑 DEVELOPER';
    if (points >= 100000000) return '🌀 KING OF POINTS';
    if (points >= 10000000) return '💀 BIG BOSS';
    if (points >= 1000000) return '🔥 WTF';
    if (points >= 100000) return '🔪 KILLER';
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '⚡ ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    if (points < -10) return '🪫 NOOB';
    return '🐣 NEWBIE';
}

function logSteal(sender, target, amount, success) {
    const logs = loadJSON(logsPath, {});
    const key = `${sender}_${target}_${Date.now()}`;
    logs[key] = { sender, target, amount, success, date: new Date().toISOString() };
    saveJSON(logsPath, logs);
}

// ========== مراحل السرقة ==========
const combinedSteps = [
    { emoji: '🔴', text: 'جار التسلل إلى الخزنة...', num: 5 },
    { emoji: '🟠', text: 'تجاوز أنظمة الحماية...', num: 4 },
    { emoji: '🟡', text: 'اقتراب من الخزنة...', num: 3 },
    { emoji: '🟢', text: 'كسر القفل...', num: 2 },
    { emoji: '🟩', text: 'جمع النقود...', num: 1 },
    { emoji: '🟦', text: 'الهروب من المكان...', num: 0 }
];

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `💀 عـمـلـيـة سـرقـة 💀\n`;
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
    command: 'سرقة',
    description: '💀 سرقة نقاط من عضو (مع حماية البنك ودعم المعاهدات)',
    category: 'عام',
    usage: '.سرقة (رد على رسالة الضحية أو @منشن)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            const context = msg.message?.extendedTextMessage?.contextInfo || {};
            const targetJid = context.mentionedJid?.[0] || context.participant;

            // التحقق من وجود ضحية
            if (!targetJid) {
                await sendMessage(sock, chatId, [
                    '❌ يجب المنشن أو الرد على الضحية',
                    '',
                    '📝 استخدم: .سرقة (رد على رسالة الضحية)',
                    '📝 أو: .سرقة @منشن'
                ], msg, [sender]);
                return;
            }

            // لا يمكن سرقة النفس
            if (getNumber(sender) === getNumber(targetJid)) {
                await sendMessage(sock, chatId, [
                    '❌ لا يمكنك سرقة نفسك!'
                ], msg, [sender]);
                return;
            }

            // ========== التحقق من المعاهدة ==========
            const treaties = loadTreaties();
            const activeTreaty = getActiveTreaty(sender, targetJid, treaties);
            if (activeTreaty) {
                await sendMessage(sock, chatId, [
                    '🤝 لا يمكنك سرقة حليفك!',
                    `📌 هناك معاهدة سلام بينك وبين @${getNumber(targetJid)}.`,
                    '❌ السرقة ممنوعة في وجود معاهدة.'
                ], msg, [sender, targetJid]);
                return;
            }

            // ========== التحقق من صلاحية السرقة ==========
            if (!canSteal(sender, targetJid)) {
                let roleName = '';
                if (isFounder(targetJid)) roleName = 'المالك';
                else if (isOwnerbot(targetJid)) roleName = 'مالك البوت';
                else if (isDeveloper(targetJid)) roleName = 'المطور';
                else roleName = 'هذا الشخص';

                await sendMessage(sock, chatId, [
                    `🚫 لا يمكنك سرقة ${roleName}`
                ], msg, [sender]);
                return;
            }

            // كولداون
            if (cooldown.has(sender)) {
                const timeLeft = cooldown.get(sender) - Date.now();
                if (timeLeft > 0) {
                    const sec = Math.ceil(timeLeft / 1000);
                    await sendMessage(sock, chatId, [
                        `⏳ انتظر ${sec} ثانية قبل المحاولة مرة أخرى.`
                    ], msg, [sender]);
                    return;
                }
            }

            // تحميل البيانات
            const points = loadJSON(pointsPath, {});

            // التأكد من وجود رصيد للسارق والضحية
            if (!points[sender]) points[sender] = 50;
            if (!points[targetJid]) points[targetJid] = 50;

            const senderNum = getNumber(sender);
            const targetNum = getNumber(targetJid);

            // ========== رسالة البداية ==========
            const startMsg = await sock.sendMessage(chatId, {
                text: `💀 عـمـلـيـة سـرقـة 💀\n━━━━━━━━━━━━━━━━━━━━\n🎯 عملية سرقة\n👤 السارق: @${senderNum}\n👤 الضحية: @${targetNum}\n⏳ جارٍ التحميل...\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`,
                mentions: [sender, targetJid]
            }, { quoted: msg });

            // ========== المراحل ==========
            for (let i = 0; i < combinedSteps.length; i++) {
                const step = combinedSteps[i];
                await sleep(500);

                await sock.sendMessage(chatId, {
                    text: `💀 عـمـلـيـة سـرقـة 💀\n━━━━━━━━━━━━━━━━━━━━\n🎯 عملية سرقة\n👤 السارق: @${senderNum}\n👤 الضحية: @${targetNum}\n⏳ ${step.emoji} ${step.num}    ${step.text}\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`,
                    edit: startMsg.key,
                    mentions: [sender, targetJid]
                }).catch(() => {});
            }

            // ========== تنفيذ السرقة ==========
            const isSuccess = Math.random() < 0.45; // 45% فرصة نجاح
            let amount = 0;
            let senderPoints = points[sender];
            let targetPoints = points[targetJid];

            if (isSuccess) {
                // ===== نجاح السرقة: نقل نقاط من الضحية إلى السارق =====
                // المبلغ المسروق = كل نقاط الضحية (أو جزء كبير) ولكن نضع حداً أقصى 10000 لمنع التضخم
                const maxSteal = Math.min(targetPoints, 10000); // حد أقصى 10000 نقطة
                amount = Math.max(1, Math.floor(Math.random() * maxSteal) + 1);
                if (amount > targetPoints) amount = targetPoints;

                senderPoints += amount;
                targetPoints -= amount;

                logSteal(sender, targetJid, amount, true);
            } else {
                // ===== فشل السرقة: نقل نقاط من السارق إلى الضحية =====
                const maxLoss = Math.min(senderPoints, 10000);
                amount = Math.max(1, Math.floor(Math.random() * maxLoss) + 1);
                if (amount > senderPoints) amount = senderPoints;

                senderPoints -= amount;
                targetPoints += amount;

                logSteal(sender, targetJid, amount, false);
            }

            // حفظ التغييرات
            points[sender] = senderPoints;
            points[targetJid] = targetPoints;
            saveJSON(pointsPath, points);

            cooldown.set(sender, Date.now() + COOLDOWN_TIME);

            // ========== النتيجة النهائية ==========
            const icon = isSuccess ? '🎉' : '💥';
            const title = isSuccess ? 'نـجـاح الـسـرقـة' : 'فـشـل الـسـرقـة';
            const resultText = isSuccess ? `💰 سرقت ${amount} نقطة` : `💸 خسرت ${amount} نقطة`;

            const targetIsHidden = isHidden(targetJid);
            const senderRank = getLevel(senderPoints);
            const targetRank = targetIsHidden ? '🔒 مخفي' : getLevel(targetPoints);
            const targetPointsDisplay = targetIsHidden ? '🔒 مخفي' : `${targetPoints} نقطة`;

            await sock.sendMessage(chatId, {
                text: `💀 عـمـلـيـة سـرقـة 💀\n━━━━━━━━━━━━━━━━━━━━\n${icon} ${title} ${icon}\n👤 السارق: @${senderNum}\n👤 الضحية: @${targetNum}\n📊 ${resultText}\n💰 رصيد السارق: ${senderPoints} نقطة\n🎖️ رتبته: ${senderRank}\n💰 رصيد الضحية: ${targetPointsDisplay}\n🎖️ رتبته: ${targetRank}\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`,
                edit: startMsg.key,
                mentions: [sender, targetJid]
            }).catch(() => {});

        } catch (error) {
            console.error('✗ خطأ في أمر سرقة:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};
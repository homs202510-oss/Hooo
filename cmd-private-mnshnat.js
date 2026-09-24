// منشنات.js - عمل منشن لشخص بعدد معين (نسخة مطورة)
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, 'db-mentionsSettings.json');

if (!fs.existsSync(path.dirname(settingsPath))) fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

const activeSpams = global.activeSpams || new Map();
global.activeSpams = activeSpams;

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `📢 الـمـنـشـنـات 📢\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== دالة التحقق من الصلاحيات ==========
function hasPermission(senderId) {
    try {
        const devManager = require('./lib-roles');
        return devManager.isFounder(senderId) || devManager.isOwnerbot(senderId) || devManager.isDeveloper(senderId);
    } catch {
        return false;
    }
}

// ========== دالة استخراج الهدف ==========
function getTargetJid(msg) {
    try {
        if (!msg?.message) return null;
        const message = msg.message;

        const ctx = message.extendedTextMessage?.contextInfo;
        if (ctx?.mentionedJid?.length) return ctx.mentionedJid[0];
        if (ctx?.participant) return ctx.participant;
        if (ctx?.quotedMessage?.participant) return ctx.quotedMessage.participant;
        if (ctx?.quotedMessage?.extendedTextMessage?.contextInfo?.participant) 
            return ctx.quotedMessage.extendedTextMessage.contextInfo.participant;

        if (msg.mentionedJid?.length) return msg.mentionedJid[0];
        if (msg.quoted?.sender) return msg.quoted.sender;
        if (msg.quotedMessage?.sender) return msg.quotedMessage.sender;
        if (msg.key?.participant) return msg.key.participant;

        return null;
    } catch (e) {
        return null;
    }
}

// ========== إحصائيات الاستخدام ==========
function updateStats(settings, userId) {
    const today = new Date().toDateString();
    if (!settings[userId]) {
        settings[userId] = { total: 0, lastReset: today, usage: [] };
    }
    if (settings[userId].lastReset !== today) {
        settings[userId].total = 0;
        settings[userId].lastReset = today;
        settings[userId].usage = [];
    }
    settings[userId].total++;
    settings[userId].usage.push({ time: Date.now(), count: settings[userId].total });
    return settings;
}

module.exports = {
    category: 'خاصة',
    command: 'منشنات',
    description: '📢 عمل منشن لشخص بعدد معين (الحد 50) - للمطورين فقط',

    execute: async (sock, m, args) => {
        try {
            const from = m.key?.remoteJid || m.chat || 'unknown';
            const senderId = m.key.participant || m.key.remoteJid;
            
            // ===== التحقق من الصلاحيات =====
            if (!hasPermission(senderId)) {
                await sendMessage(sock, from, [
                    '❌ هذا الأمر متاح فقط للمطورين ومالك البوت.'
                ], m);
                return;
            }

            const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const argsList = body.trim().split(/\s+/).slice(1);
            
            // ===== عرض المساعدة =====
            if (argsList.length === 0) {
                const lines = [
                    '⚙️ *طريقة استخدام أمر المنشنات:*',
                    '',
                    '📝 *الطريقة الأولى (رد على رسالة):*',
                    '   `.منشنات 10`',
                    '   - ترد على رسالة الشخص',
                    '   - تكتب .منشنات ثم الرقم (1-50)',
                    '   - سيتم عمل 10 منشنات للشخص',
                    '',
                    '📝 *الطريقة الثانية (منشن مباشر):*',
                    '   `.منشنات @الشخص 15`',
                    '   - تعمل منشن للشخص',
                    '   - تكتب .منشنات ثم الرقم (1-50)',
                    '   - سيتم عمل 15 منشنات للشخص',
                    '',
                    '📊 *الإحصائيات:*',
                    '   `.منشنات احصائيات` - عرض إحصائيات استخدامك',
                    '',
                    '🛑 *لإيقاف المنشنات:*',
                    '   `.منشنات توقف`',
                    '',
                    '⚠️ *تحذيرات أمنية:*',
                    '• الحد الأقصى: 50 منشن',
                    '• الفاصل بين كل منشن: 1 ثانية',
                    '• الاستخدام المفرط قد يؤدي إلى حظر الرقم',
                    '• الحد الأقصى اليومي: 500 منشن',
                    '',
                    '🎯 *أمثلة:*',
                    '   `.منشنات 5` (رد على رسالة)',
                    '   `.منشنات @user 10`'
                ];
                await sendMessage(sock, from, lines, m);
                return;
            }

            // ===== إحصائيات =====
            if (argsList[0].toLowerCase() === 'احصائيات' || argsList[0].toLowerCase() === 'stats') {
                const settings = loadJSON(settingsPath);
                const userStats = settings[senderId] || { total: 0, lastReset: new Date().toDateString(), usage: [] };
                const today = new Date().toDateString();
                const isToday = userStats.lastReset === today;
                
                const lines = [
                    `📊 *إحصائيات المنشنات*`,
                    '',
                    `👤 @${senderId.split('@')[0]}`,
                    `📌 إجمالي المنشنات اليوم: ${isToday ? userStats.total : 0}`,
                    `📌 الحد الأقصى اليومي: 500`,
                    `📌 آخر استخدام: ${userStats.usage.length > 0 ? new Date(userStats.usage[userStats.usage.length - 1].time).toLocaleString('ar') : 'لا يوجد'}`,
                    `📌 عدد مرات الاستخدام: ${userStats.usage.length}`,
                    '',
                    `📊 *آخر 5 استخدامات:*`
                ];
                
                const lastFive = userStats.usage.slice(-5).reverse();
                if (lastFive.length > 0) {
                    lastFive.forEach((u, i) => {
                        const time = new Date(u.time).toLocaleTimeString('ar');
                        lines.push(`   ${i+1}. ${time} - ${u.count} منشن`);
                    });
                } else {
                    lines.push('   لا يوجد استخدامات سابقة');
                }
                
                await sendMessage(sock, from, lines, m, [senderId]);
                return;
            }

            // ===== إيقاف السبام =====
            const firstArg = (argsList[0] || '').toLowerCase();
            if (['توقف', 'stop', 'وقف', 'ايقاف', 'انهاء'].includes(firstArg)) {
                if (activeSpams.has(from)) {
                    clearInterval(activeSpams.get(from));
                    activeSpams.delete(from);
                    await sendMessage(sock, from, [
                        '✋ تم إيقاف المنشنات.'
                    ], m);
                } else {
                    await sendMessage(sock, from, [
                        'ℹ️ ما في عملية منشنات شغالة حالياً.'
                    ], m);
                }
                return;
            }

            // ===== تحديد الهدف =====
            const targetJid = getTargetJid(m);
            if (!targetJid) {
                await sendMessage(sock, from, [
                    '❌ لازم تعمل منشن للشخص أو ترد على رسالة الشخص.',
                    '',
                    '📝 اكتب `.منشنات` بدون أي إضافات لرؤية التعليمات الكاملة.'
                ], m);
                return;
            }

            // ===== تحديد العدد =====
            let count = 0;

            // التحقق من وجود رد (quoted)
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const hasQuoted = !!quoted;

            if (hasQuoted) {
                // حالة الرد على رسالة
                for (let a of argsList) {
                    const n = parseInt(a.replace(/\D/g, ''), 10);
                    if (!isNaN(n) && n > 0) {
                        count = n;
                        break;
                    }
                }
                if (count === 0) {
                    count = 5; // القيمة الافتراضية في حالة الرد
                }
            } else {
                // حالة منشن مباشر
                if (argsList.length >= 2) {
                    const n = parseInt(argsList[1].replace(/\D/g, ''), 10);
                    if (!isNaN(n) && n > 0) count = n;
                }
                if (count === 0) {
                    await sendMessage(sock, from, [
                        '❌ يجب تحديد عدد المنشنات بعد المنشن',
                        '📝 مثال: `.منشنات @user 10`'
                    ], m);
                    return;
                }
            }

            // ===== التحقق من الحدود =====
            // الحد الأقصى 50
            if (count > 50) {
                count = 50;
                await sendMessage(sock, from, [
                    '⚠️ تم تحديد العدد إلى 50 (الحد الأقصى المسموح)'
                ], m);
            }

            if (count < 1) {
                await sendMessage(sock, from, [
                    '❌ الرقم يجب أن يكون بين 1 و 50'
                ], m);
                return;
            }

            // ===== التحقق من الحد اليومي =====
            const settings = loadJSON(settingsPath);
            const userStats = settings[senderId] || { total: 0, lastReset: new Date().toDateString(), usage: [] };
            const today = new Date().toDateString();
            
            if (userStats.lastReset !== today) {
                userStats.total = 0;
                userStats.lastReset = today;
                userStats.usage = [];
            }
            
            if (userStats.total + count > 500) {
                const remaining = 500 - userStats.total;
                await sendMessage(sock, from, [
                    `❌ تجاوزت الحد اليومي (500 منشن).`,
                    `📌 المتبقي لك اليوم: ${remaining} منشن`,
                    `📌 حاول مرة أخرى غداً.`
                ], m);
                return;
            }

            // ===== بدء المنشنات =====
            if (activeSpams.has(from)) {
                clearInterval(activeSpams.get(from));
                activeSpams.delete(from);
            }

            // تحديث الإحصائيات
            updateStats(settings, senderId);
            saveJSON(settingsPath, settings);

            const shortName = targetJid.split('@')[0];
            let done = 0;
            const intervalTime = 1000; // 1 ثانية

            // رسالة البداية
            await sendMessage(sock, from, [
                `🚀 بدأنا منشن لـ @${shortName}`,
                `📊 العدد: ${count}`,
                `⏱️ الفاصل: 1 ثانية بين كل منشن`,
                `🛑 للإيقاف: .منشنات توقف`,
                `📊 المتبقي اليوم: ${500 - (userStats.total + count)} منشن`,
                '',
                '⚠️ الاستخدام المفرط قد يؤدي إلى حظر الرقم'
            ], m, [targetJid]);

            const spammer = setInterval(async () => {
                try {
                    if (done >= count) {
                        clearInterval(spammer);
                        activeSpams.delete(from);
                        
                        // تحديث الإحصائيات النهائية
                        const finalSettings = loadJSON(settingsPath);
                        if (finalSettings[senderId]) {
                            finalSettings[senderId].usage.push({ 
                                time: Date.now(), 
                                count: count,
                                target: shortName 
                            });
                            saveJSON(settingsPath, finalSettings);
                        }
                        
                        await sendMessage(sock, from, [
                            `✅ انتهينا من ${count} منشنات لـ @${shortName}`,
                            `📊 المتبقي اليوم: ${500 - (userStats.total + count)} منشن`,
                            '',
                            '⚠️ لا تستخدم الأمر بكثرة للحفاظ على أمان الرقم'
                        ], m, [targetJid]);
                        return;
                    }
                    done++;
                    await sock.sendMessage(from, {
                        text: `👀 @${shortName} (${done}/${count})`,
                        mentions: [targetJid]
                    });
                } catch (err) {
                    clearInterval(spammer);
                    activeSpams.delete(from);
                    console.error('❌ منشنات: خطأ أثناء الإرسال:', err);
                    try {
                        await sendMessage(sock, from, [
                            '❌ حصل خطأ أثناء إرسال المنشنات، أوقفت العملية.',
                            '📌 قد يكون بسبب قيود واتساب.'
                        ], m);
                    } catch (e) {}
                }
            }, intervalTime);

            activeSpams.set(from, spammer);

        } catch (err) {
            console.error('❌ خطأ في منشنات.js:', err);
            try {
                const from = m.key?.remoteJid || m.chat || '';
                if (from) {
                    await sendMessage(sock, from, [
                        '❌ حصل خطأ في الأمر.',
                        '📌 تأكد من الصلاحيات والمعلومات المدخلة.'
                    ], m);
                }
            } catch (e) {}
        }
    }
};
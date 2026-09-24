// انذار.js - نظام الإنذارات المتكامل (للمطورين، الأونر، المؤسس، والمشرفين فقط)
// مع النشر التلقائي في جروبات الإعلانات (نفس الرسالة مفخمة)

const fs = require('fs');
const path = require('path');
const hay = require('./lib-roles');

// ========== استيراد دوال نظام التبادل ==========
let loadData, getGroupName;
try {
    const exchangeModule = require('./cmd-guilds-exchange');
    loadData = exchangeModule.loadData;
    getGroupName = exchangeModule.getGroupName;
} catch (e) {
    console.error('❌ فشل استيراد دوال التبادل:', e.message);
    loadData = () => ({});
    getGroupName = async (sock, jid) => jid.split('@')[0];
}

const WARNINGS_FILE = path.join(__dirname, 'db-warnings.json');

// ========== دوال بناء الرسائل ==========
function buildMessageText(lines) {
    let msg = `⚠️ نـظـام الإنـذارات ⚠️\n`;
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

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    const text = buildMessageText(lines);
    await sock.sendMessage(chatId, { text, mentions }, { quoted: quoted });
}

// ========== دوال الإنذارات ==========
function loadWarnings() {
    if (!fs.existsSync(WARNINGS_FILE)) {
        fs.writeFileSync(WARNINGS_FILE, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(WARNINGS_FILE));
}

function saveWarnings(data) {
    fs.writeFileSync(WARNINGS_FILE, JSON.stringify(data, null, 2));
}

function pureNum(jid) {
    return String(jid).split('@')[0];
}

// ========== دالة استخراج النص ==========
function extractText(msg) {
    if (msg.message?.conversation) {
        return msg.message.conversation;
    }
    if (msg.message?.extendedTextMessage?.text) {
        return msg.message.extendedTextMessage.text;
    }
    return '';
}

// ========== دالة حساب الوقت المتبقي ==========
function getRemainingTime(timestamps) {
    if (!timestamps || timestamps.length === 0) return '0 ساعة';
    const now = Date.now();
    const oldest = Math.min(...timestamps);
    const elapsed = now - oldest;
    const remaining = 24 * 60 * 60 * 1000 - elapsed;
    if (remaining <= 0) return 'منتهي';
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours} ساعة ${minutes} دقيقة`;
}

// ========== دالة التحقق من صلاحيات المستخدم ==========
async function checkPermissions(sock, chatId, sender) {
    const senderLid = hay.toLid(sender);
    const isFounder = hay.isFounder(senderLid);
    const isOwnerbot = hay.isOwnerbot(senderLid);
    const isDeveloper = hay.isDeveloper(senderLid);

    let isAdmin = false;
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participant = groupMetadata.participants.find(p => p.id === sender);
        isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch (error) {
        console.error('خطأ في التحقق من المشرفين:', error);
    }

    return {
        isFounder,
        isOwnerbot,
        isDeveloper,
        isAdmin,
        hasAccess: isFounder || isOwnerbot || isDeveloper || isAdmin
    };
}

// ========== دالة التحقق من صلاحيات المستهدف ==========
function checkTargetPermissions(target) {
    const targetLid = hay.toLid(target);
    return {
        isTargetFounder: hay.isFounder(targetLid),
        isTargetOwnerbot: hay.isOwnerbot(targetLid),
        isTargetDeveloper: hay.isDeveloper(targetLid)
    };
}

// ========== دالة التحقق من الإنذارات المنتهية ==========
function checkExpiredWarnings() {
    const warnings = loadWarnings();
    const now = Date.now();
    let modified = false;

    for (const groupId in warnings) {
        for (const userId in warnings[groupId]) {
            const userWarnings = warnings[groupId][userId];
            if (userWarnings.timestamps) {
                const validWarnings = [];
                const validReasons = [];
                for (let i = 0; i < userWarnings.timestamps.length; i++) {
                    const timeDiff = now - userWarnings.timestamps[i];
                    if (timeDiff < 24 * 60 * 60 * 1000) {
                        validWarnings.push(userWarnings.timestamps[i]);
                        validReasons.push(userWarnings.reasons[i]);
                    }
                }
                if (validWarnings.length !== userWarnings.timestamps.length) {
                    userWarnings.timestamps = validWarnings;
                    userWarnings.reasons = validReasons;
                    userWarnings.count = validWarnings.length;
                    modified = true;
                }
                if (userWarnings.count === 0) {
                    delete warnings[groupId][userId];
                }
            } else {
                userWarnings.timestamps = new Array(userWarnings.count).fill(Date.now());
                modified = true;
            }
        }
        if (Object.keys(warnings[groupId]).length === 0) {
            delete warnings[groupId];
        }
    }

    if (modified) {
        saveWarnings(warnings);
    }
    return warnings;
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'انذار',
    category: 'ادارة',
    description: '⚠️ نظام الإنذارات المتكامل - إعطاء، عرض، وإزالة الإنذارات',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            if (!chatId.endsWith('@g.us')) {
                await sendMessage(sock, chatId, [
                    '❌ *هذا الأمر يعمل فقط في المجموعات.*'
                ], msg);
                return;
            }

            const permissions = await checkPermissions(sock, chatId, sender);
            if (!permissions.hasAccess) {
                await sendMessage(sock, chatId, [
                    '🚫 *غير مصرح*',
                    '',
                    '🔒 هذا الأمر للمشرفين، والمطورين، فقط.'
                ], msg);
                return;
            }

            checkExpiredWarnings();

            const text = extractText(msg);
            const args = text.trim().split(/\s+/);
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

            // ===== عرض الإنذارات =====
            if (args[1]?.toLowerCase() === 'عرض') {
                if (mentioned.length > 0 || quoted) {
                    return await showUserWarnings(sock, msg, chatId);
                }
                return await showWarnings(sock, msg, chatId);
            }

            // ===== فك الإنذار =====
            if (args[1]?.toLowerCase() === 'فك' || args[1]?.toLowerCase() === 'remove') {
                return await removeWarning(sock, msg, chatId);
            }

            // ===== إضافة إنذار =====
            if (mentioned.length > 0 || quoted) {
                return await addWarning(sock, msg, chatId);
            }

            // ===== عرض المساعدة =====
            return await showHelp(sock, msg, chatId);

        } catch (error) {
            console.error('✗ خطأ في نظام الإنذارات:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};

// ========== دالة عرض المساعدة ==========
async function showHelp(sock, msg, chatId) {
    const lines = [
        '📋 *طريقة استخدام نظام الإنذارات*',
        '',
        '⚠️ *إعطاء إنذار*',
        '   `.انذار @المستخدم`',
        '   `.انذار @المستخدم السبب`',
        '',
        '📊 *عرض الإنذارات*',
        '   `.انذار عرض`',
        '   `.انذار عرض @المستخدم`',
        '',
        '🗑️ *إزالة الإنذارات*',
        '   `.انذار فك @المستخدم`',
        '   `.انذار فك @المستخدم كل`',
        '   `.انذار فك @المستخدم 2`',
        '',
        '⏰ *ملاحظة*',
        '   الإنذارات تنتهي تلقائياً بعد 24 ساعة',
        '   الطرد التلقائي عند 4 إنذارات',
        '',
        '🔒 *الصلاحيات:* المشرفين، المطورين، الأونر،'
    ];

    await sendMessage(sock, chatId, lines, msg);
}

// ========== دالة عرض إنذارات المجموعة ==========
async function showWarnings(sock, msg, chatId) {
    const warnings = loadWarnings();

    if (!warnings[chatId] || Object.keys(warnings[chatId]).length === 0) {
        await sendMessage(sock, chatId, [
            '🎉 *لا توجد إنذارات في هذه المجموعة*'
        ], msg);
        return;
    }

    const lines = ['📋 *إنذارات المجموعة*', ''];
    const mentions = [];

    for (const [userId, data] of Object.entries(warnings[chatId])) {
        if (data.count > 0) {
            lines.push(`👤 @${pureNum(userId)}`);
            lines.push(`   ⚠️ العدد: ${data.count}`);
            lines.push(`   ⏰ المتبقي: ${getRemainingTime(data.timestamps)}`);
            if (data.reasons.length > 0) {
                lines.push(`   📝 الأسباب:`);
                data.reasons.forEach((reason, index) => {
                    lines.push(`      ${index + 1}. ${reason}`);
                });
            }
            lines.push('');
            mentions.push(userId);
        }
    }

    lines.push(`📊 الإجمالي: ${Object.keys(warnings[chatId]).length} عضو`);

    await sendMessage(sock, chatId, lines, msg, mentions);
}

// ========== دالة عرض إنذارات عضو معين ==========
async function showUserWarnings(sock, msg, chatId) {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
    let target = mentioned[0] || quoted;

    if (!target) {
        await sendMessage(sock, chatId, [
            '❌ الرجاء المنشن أو الرد على العضو لعرض إنذاراته.'
        ], msg);
        return;
    }

    const warnings = loadWarnings();

    if (!warnings[chatId] || !warnings[chatId][target] || warnings[chatId][target].count === 0) {
        await sendMessage(sock, chatId, [
            `🎉 @${pureNum(target)} لا يمتلك أي إنذارات`
        ], msg, [target]);
        return;
    }

    const userWarnings = warnings[chatId][target];
    const lines = [
        `📋 *إنذارات العضو*`,
        '',
        `👤 @${pureNum(target)}`,
        `⚠️ العدد: ${userWarnings.count}`,
        `⏰ المتبقي: ${getRemainingTime(userWarnings.timestamps)}`,
        '',
        `📝 *الأسباب:*`
    ];

    userWarnings.reasons.forEach((reason, index) => {
        lines.push(`   ${index + 1}. ${reason}`);
    });

    await sendMessage(sock, chatId, lines, msg, [target]);
}

// ========== دالة إضافة إنذار ==========
async function addWarning(sock, msg, chatId) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
    let target = mentioned[0] || quoted;

    if (!target) {
        await sendMessage(sock, chatId, [
            '❌ الرجاء المنشن أو الرد على العضو لإعطاء إنذار.'
        ], msg);
        return;
    }

    // التحقق من صلاحيات المستهدف
    const targetPerms = checkTargetPermissions(target);
    const senderPerms = await checkPermissions(sock, chatId, sender);

    // التدرج الهرمي:
    // مالك  > الأونر > المطور > المشرف
    if (senderPerms.isFounder) {
        // مالك البوت يستطيع إنذار أي شخص
    } else if (senderPerms.isOwnerbot) {
        if (targetPerms.isTargetFounder) {
            await sendMessage(sock, chatId, [
                '🚫 لا يمكن إعطاء إنذار المالك.'
            ], msg);
            return;
        }
    } else if (senderPerms.isDeveloper) {
        if (targetPerms.isTargetFounder || targetPerms.isTargetOwnerbot) {
            await sendMessage(sock, chatId, [
                '🚫 لا يمكن إعطاء إنذار لهذا الشخص.'
            ], msg);
            return;
        }
    } else if (senderPerms.isAdmin) {
        if (targetPerms.isTargetFounder || targetPerms.isTargetOwnerbot || targetPerms.isTargetDeveloper) {
            await sendMessage(sock, chatId, [
                '🚫 لا يمكن إعطاء إنذار لهذا الشخص.'
            ], msg);
            return;
        }
    }

    // استخراج السبب
    const text = extractText(msg);
    let reason = text.replace(/^\.?انذار\s*/i, '').trim();

    if (mentioned.length > 0) {
        const mentionPattern = new RegExp(`@${pureNum(target)}`, 'g');
        reason = reason.replace(mentionPattern, '').trim();
    }
    reason = reason || 'لم يتم تحديد السبب';

    const warnings = loadWarnings();
    if (!warnings[chatId]) warnings[chatId] = {};
    if (!warnings[chatId][target]) {
        warnings[chatId][target] = { count: 0, reasons: [], timestamps: [] };
    }

    warnings[chatId][target].count++;
    warnings[chatId][target].reasons.push(reason);
    warnings[chatId][target].timestamps.push(Date.now());
    saveWarnings(warnings);

    const count = warnings[chatId][target].count;
    const remaining = getRemainingTime(warnings[chatId][target].timestamps);

    // ===== بناء رسالة الإنذار =====
    const lines = [
        '⚠️ *تم إصدار إنذار جديد!*',
        '',
        `👤 المستهدف: @${pureNum(target)}`,
        `📝 السبب: ${reason}`,
        `📊 العدد: ${count}/4`,
        `⏰ المتبقي: ${remaining} لازاله الانذار تلقائي`,
        `👮‍♂️ بواسطة: @${pureNum(sender)}`,
        '',
        '⚠️ عند الوصول إلى 4 إنذارات سيتم الطرد تلقائياً.'
    ];

    // ===== إرسال في الجروب الحالي =====
    await sendMessage(sock, chatId, lines, msg, [target, sender]);

    // ===== نشر نفس الرسالة في جروبات الإعلانات =====
    try {
        const exchangeData = loadData();
        // بحث عن أي نوع يحتوي على كلمة إعلانات
        const adTypes = ['إعلانات', 'الاعلانات', 'الإعلانات', 'اعلانات'];
        let adGroups = [];
        for (const type of adTypes) {
            if (exchangeData[type] && Array.isArray(exchangeData[type])) {
                adGroups = adGroups.concat(exchangeData[type]);
            }
        }
        // إزالة التكرارات
        adGroups = [...new Set(adGroups)];

        if (adGroups.length > 0) {
            const groupName = await getGroupName(sock, chatId);
            // بناء نفس الرسالة مع إضافة سطر المصدر
            const adLines = [
                ...lines,
                '',
                `📌 *المصدر:* ${groupName || chatId}`
            ];
            const adText = buildMessageText(adLines);

            for (const adGroup of adGroups) {
                try {
                    await sock.sendMessage(adGroup, {
                        text: adText,
                        mentions: [target, sender]
                    });
                    console.log(`✅ نشر الإنذار في جروب الإعلانات: ${adGroup}`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (e) {
                    console.error(`❌ فشل نشر الإنذار في ${adGroup}:`, e.message);
                }
            }
        }
    } catch (e) {
        console.error('❌ خطأ في نشر الإنذار في جروبات الإعلانات:', e.message);
    }

    // الطرد التلقائي بعد 4 إنذارات
    if (count >= 4) {
        const reasonsList = warnings[chatId][target].reasons.map((r, i) => `   ${i + 1}. ${r}`).join('\n');

        await sendMessage(sock, chatId, [
            '🚫 *تم طرد العضو بعد 4 إنذارات!*',
            '',
            `👤 @${pureNum(target)}`,
            `📋 الأسباب:\n${reasonsList}`,
            '',
            '✅ تمت إعادة ضبط الإنذارات بعد الطرد.'
        ], msg, [target]);

        try {
            await sock.groupParticipantsUpdate(chatId, [target], 'remove');
            delete warnings[chatId][target];
            if (Object.keys(warnings[chatId]).length === 0) delete warnings[chatId];
            saveWarnings(warnings);
        } catch (err) {
            await sendMessage(sock, chatId, [
                `❌ فشل الطرد: ${err.message}`
            ], msg);
        }
    }
}

// ========== دالة إزالة الإنذار ==========
async function removeWarning(sock, msg, chatId) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
    let target = mentioned[0] || quoted;

    if (!target) {
        await sendMessage(sock, chatId, [
            '❌ الرجاء المنشن أو الرد على العضو لإزالة الإنذار.'
        ], msg);
        return;
    }

    // التحقق من صلاحيات المستهدف
    const targetPerms = checkTargetPermissions(target);
    const senderPerms = await checkPermissions(sock, chatId, sender);

    // نفس التدرج الهرمي
    if (senderPerms.isFounder) {
      // مالك البوت يستطيع إزالة إنذار أي شخص
    } else if (senderPerms.isOwnerbot) {
        if (targetPerms.isTargetFounder) {
            await sendMessage(sock, chatId, [
                '🚫 لا يمكن إزالة إنذار المالك.'
            ], msg);
            return;
        }
    } else if (senderPerms.isDeveloper) {
        if (targetPerms.isTargetFounder || targetPerms.isTargetOwnerbot) {
            await sendMessage(sock, chatId, [
                '🚫 لا يمكن إزالة إنذار لهذا الشخص.'
            ], msg);
            return;
        }
    } else if (senderPerms.isAdmin) {
        if (targetPerms.isTargetFounder || targetPerms.isTargetOwnerbot || targetPerms.isTargetDeveloper) {
            await sendMessage(sock, chatId, [
                '🚫 لا يمكن إزالة إنذار لهذا الشخص.'
            ], msg);
            return;
        }
    }

    const warnings = loadWarnings();

    if (!warnings[chatId] || !warnings[chatId][target] || warnings[chatId][target].count === 0) {
        await sendMessage(sock, chatId, [
            `✅ @${pureNum(target)} لا يمتلك أي إنذارات`
        ], msg, [target]);
        return;
    }

    const userWarnings = warnings[chatId][target];
    const text = extractText(msg);
    const args = text.trim().split(/\s+/);

    let removeAll = false;
    let removeIndex = -1;

    for (let i = 2; i < args.length; i++) {
        if (args[i].toLowerCase() === 'كل') {
            removeAll = true;
            break;
        } else if (!isNaN(args[i]) && args[i] !== '') {
            removeIndex = parseInt(args[i]) - 1;
            break;
        }
    }

    let lines = [];
    const targetTag = `@${pureNum(target)}`;

    if (removeAll) {
        const removed = userWarnings.count;
        delete warnings[chatId][target];
        lines = [
            '✅ *تم حذف جميع الإنذارات*',
            '',
            `👤 ${targetTag}`,
            `🗑️ العدد المحذوف: ${removed}`
        ];
    } else if (removeIndex >= 0) {
        if (removeIndex >= 0 && removeIndex < userWarnings.reasons.length) {
            const removedReason = userWarnings.reasons.splice(removeIndex, 1)[0];
            userWarnings.timestamps.splice(removeIndex, 1);
            userWarnings.count--;

            lines = [
                '✅ *تم حذف إنذار*',
                '',
                `👤 ${targetTag}`,
                `📝 الإنذار المحذوف: ${removedReason}`,
                `📊 المتبقي: ${userWarnings.count}`
            ];
        } else {
            await sendMessage(sock, chatId, [
                `❌ رقم الإنذار غير صحيح! الرجاء اختيار بين 1 و ${userWarnings.reasons.length}`
            ], msg);
            return;
        }
    } else {
        const removedReason = userWarnings.reasons.pop();
        userWarnings.timestamps.pop();
        userWarnings.count--;
        lines = [
            '✅ *تم حذف آخر إنذار*',
            '',
            `👤 ${targetTag}`,
            `📝 الإنذار المحذوف: ${removedReason}`,
            `📊 المتبقي: ${userWarnings.count}`
        ];
    }

    if (userWarnings.count <= 0) {
        delete warnings[chatId][target];
        if (Object.keys(warnings[chatId]).length === 0) delete warnings[chatId];
    }

    saveWarnings(warnings);

    await sendMessage(sock, chatId, lines, msg, [target]);
}
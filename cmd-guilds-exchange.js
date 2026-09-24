// تبادل.js - نظام إدارة التبادلات وإعادة توجيه الرسائل مع منشن مخفي

const fs = require('fs');
const path = require('path');
const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');
const { isElite } = require('./lib-roles');

// ============================================================
// 📁 إعدادات الملفات
// ============================================================
const exchangeFile = path.join(__dirname, 'db-exchange.json');
const defaultData = {};

// ============================================================
// 📊 دوال تحميل وحفظ البيانات
// ============================================================
function loadData() {
    const dataDir = path.dirname(exchangeFile);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    if (!fs.existsSync(exchangeFile)) {
        fs.writeFileSync(exchangeFile, JSON.stringify(defaultData, null, 2));
        return { ...defaultData };
    }

    try {
        const rawData = fs.readFileSync(exchangeFile, 'utf8');
        const data = JSON.parse(rawData);
        for (const key in data) {
            if (!Array.isArray(data[key])) data[key] = [];
        }
        return data;
    } catch (error) {
        console.error('❌ خطأ في تحميل بيانات التبادل:', error);
        fs.writeFileSync(exchangeFile, JSON.stringify(defaultData, null, 2));
        return { ...defaultData };
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(exchangeFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ خطأ في حفظ بيانات التبادل:', error);
    }
}

// ============================================================
// 🔐 دوال الصلاحيات
// ============================================================
// ✅ صلاحية عامة للمطور، الأونر، النخبة، والمشرفين
async function hasGeneralPermission(sock, senderLid, senderNumber, chatId) {
    try {
        // المطور، الأونر، النخبة
        if (isFounder(senderLid) || 
            isOwnerbot(senderLid) || 
            isDeveloper(senderLid) ||
            isElite(senderNumber)) {
            return true;
        }

        // المشرفين في الجروب
        if (chatId && chatId.endsWith('@g.us')) {
            const groupMetadata = await sock.groupMetadata(chatId);
            const participant = groupMetadata.participants.find(p => p.id === senderLid);
            if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
                return true;
            }
        }

        return false;
    } catch {
        return false;
    }
}

// ✅ صلاحية خاصة للنشر - فقط المطور، الأونر، والنخبة (المشرفين ممنوعين)
async function hasPublishPermission(senderLid, senderNumber) {
    try {
        return isFounder(senderLid) || 
               isOwnerbot(senderLid) || 
               isDeveloper(senderLid) ||
               isElite(senderNumber);
    } catch {
        return false;
    }
}

// ============================================================
// 🛡️ دالة التحقق من وجود نقطة في النص
// ============================================================
function containsDot(text) {
    if (!text) return false;
    return text.includes('.');
}

// كاش لأسماء الجروبات
const groupNameCache = {};
async function getGroupName(sock, jid) {
    if (groupNameCache[jid]) return groupNameCache[jid];
    try {
        const meta = await sock.groupMetadata(jid);
        groupNameCache[jid] = meta.subject || jid.split('@')[0];
        return groupNameCache[jid];
    } catch {
        return jid.split('@')[0];
    }
}

// ============================================================
// 📤 دالة الإرسال الموحدة
// ============================================================
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `📊 نـظـام الـتـبـادل 📊\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ============================================================
// 📋 الأمر الرئيسي
// ============================================================
module.exports = {
    command: 'تبادل',
    description: '📊 نظام متقدم لإدارة التبادلات وإعادة توجيه الرسائل مع منشن مخفي',
    category: 'نقابات',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNumber = sender.split('@')[0];
        const isGroup = chatId && chatId.endsWith('@g.us');

        // ============================================================
        // 📂 استخراج النص والوسائط
        // ============================================================
        const fullText = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || 
                         '';
        const parts = fullText.trim().split(/\s+/);
        const args = parts.slice(1);

        const hay = require('./lib-roles');
        const lid = hay.toLid(sender);
        const canManage = await hasGeneralPermission(sock, lid, senderNumber, chatId);
        const canPublish = await hasPublishPermission(lid, senderNumber);
        const senderName = msg.pushName || senderNumber;

        // ============================================================
        // 📖 عرض المساعدة
        // ============================================================
        if (!args || args.length === 0) {
            const data = loadData();
            const types = Object.keys(data);
            const typeList = types.length > 0 ? types.join('، ') : 'لا توجد أنواع بعد';

            const helpLines = [
                '📖 *أوامر نظام التبادل*',
                '',
                '🔹 *الصلاحيات:*',
                '• 👑 المطور، الأونر، النخبة: كل الأوامر',
                '• 👥 مشرفي الجروبات: اضف، حذف، قائمة فقط (داخل جروبهم)',
                '• ❌ ممنوع على المشرفين: أمر النشر',
                '',
                '📌 *الأوامر:*',
                '• `.تبادل اضف [نوع]` ➕ إضافة الجروب الحالي',
                '• `.تبادل حذف [نوع]` ➖ حذف الجروب الحالي',
                '• `.تبادل حذف [نوع] [رقم]` ➖ حذف برقم',
                '• `.تبادل قائمة` 📋 عرض الكل',
                '• `.تبادل قائمة [نوع]` 📋 عرض نوع محدد',
                '• `.تبادل نشر [نوع]` 📤 إعادة توجيه (للأونر والمطور والنخبة فقط)',
                '• `.تبادل نشر [نوع] منشن` 📤 + منشن مخفي',
                '',
                `📌 *الأنواع:* ${typeList}`,
                '',
                '💡 *أمثلة:*',
                '• `.تبادل اضف ملصقات`',
                '• `.تبادل حذف اعلانات 2`',
                '• (رد) `.تبادل نشر صحيفة منشن`'
            ];

            await sendMessage(sock, chatId, helpLines, msg);
            return;
        }

        // ============================================================
        // 📂 قراءة الأمر
        // ============================================================
        const subCommand = args[0].toLowerCase();
        const type = args[1]?.toLowerCase() || '';
        const thirdArg = args[2] || '';
        const restArgs = args.slice(2).join(' ');
        const hasMention = restArgs.includes('منشن') || args.includes('منشن');

        // ============================================================
        // 🔹 .تبادل اضف [نوع]
        // ============================================================
        if (subCommand === 'اضف' || subCommand === 'add') {
            if (!canManage) {
                await sendMessage(sock, chatId, [
                    '❌ *غير مصرح*',
                    '',
                    '🔒 هذا الأمر مخصص للمطور، الأونر، النخبة، ومشرفي الجروب.'
                ], msg);
                return;
            }

            if (!isGroup) {
                await sendMessage(sock, chatId, [
                    '❌ *هذا الأمر يعمل داخل المجموعات فقط*'
                ], msg);
                return;
            }

            if (!type) {
                await sendMessage(sock, chatId, [
                    '❌ *يرجى تحديد النوع*',
                    '',
                    '📝 مثال: `.تبادل اضف صحيفة`'
                ], msg);
                return;
            }

            // 🛡️ منع استخدام النقطة في النوع
            if (containsDot(type)) {
                await sendMessage(sock, chatId, [
                    '🛡️ *تم منع الإضافة*',
                    '',
                    '⚠️ لا يمكن استخدام نقطة (.) في النوع.',
                    '📌 النقطة محظورة لمنع استغلال النظام.'
                ], msg);
                return;
            }

            const data = loadData();
            
            // ✅ التحقق من وجود الجروب في أي نوع آخر
            let foundInType = null;
            for (const [key, list] of Object.entries(data)) {
                if (list && Array.isArray(list) && list.includes(chatId)) {
                    foundInType = key;
                    break;
                }
            }

            if (foundInType) {
                const groupName = await getGroupName(sock, chatId);
                await sendMessage(sock, chatId, [
                    'ℹ️ *هذا الجروب مضاف مسبقاً*',
                    '',
                    `📌 الجروب: ${groupName}`,
                    `📌 موجود في: ${foundInType}`,
                    `📌 لا يمكن إضافته إلى ${type} لأنه موجود بالفعل.`
                ], msg);
                return;
            }

            // إذا لم يكن موجوداً في أي نوع، نضيفه
            if (!data[type]) data[type] = [];
            data[type].push(chatId);
            saveData(data);

            const groupName = await getGroupName(sock, chatId);

            await sendMessage(sock, chatId, [
                '✅ *تمت الإضافة بنجاح*',
                '',
                `📌 النوع: ${type}`,
                `📌 الجروب: ${groupName}`,
                `📊 العدد الإجمالي: ${data[type].length}`
            ], msg);
            return;
        }

        // ============================================================
        // 🔹 .تبادل حذف [نوع] أو .تبادل حذف [نوع] [رقم]
        // ============================================================
        if (subCommand === 'حذف' || subCommand === 'delete' || subCommand === 'del') {
            if (!canManage) {
                await sendMessage(sock, chatId, [
                    '❌ *غير مصرح*',
                    '',
                    '🔒 هذا الأمر مخصص للمطور، الأونر، النخبة، ومشرفي الجروب.'
                ], msg);
                return;
            }

            if (!type) {
                await sendMessage(sock, chatId, [
                    '❌ *يرجى تحديد النوع*',
                    '',
                    '📝 مثال: `.تبادل حذف صحيفة`',
                    '📝 أو `.تبادل حذف استقبال 2`'
                ], msg);
                return;
            }

            // 🛡️ منع استخدام النقطة في النوع
            if (containsDot(type)) {
                await sendMessage(sock, chatId, [
                    '🛡️ *تم منع الحذف*',
                    '',
                    '⚠️ لا يمكن استخدام نقطة (.) في النوع.',
                    '📌 النقطة محظورة لمنع استغلال النظام.'
                ], msg);
                return;
            }

            const data = loadData();
            if (!data[type] || data[type].length === 0) {
                await sendMessage(sock, chatId, [
                    `📭 *لا توجد جروبات في ${type}*`
                ], msg);
                return;
            }

            // حذف برقم (من أي شات)
            if (!isNaN(thirdArg) && thirdArg !== '') {
                const index = parseInt(thirdArg) - 1;
                if (index < 0 || index >= data[type].length) {
                    await sendMessage(sock, chatId, [
                        '❌ *الرقم غير صحيح*',
                        '',
                        `📌 العدد المتاح: 1 - ${data[type].length}`
                    ], msg);
                    return;
                }

                const removedJid = data[type][index];
                const removedName = await getGroupName(sock, removedJid);
                data[type].splice(index, 1);
                saveData(data);

                await sendMessage(sock, chatId, [
                    '✅ *تم الحذف بنجاح*',
                    '',
                    `📌 تم حذف الجروب رقم ${thirdArg} من ${type}`,
                    `📌 الجروب: ${removedName}`,
                    `📊 العدد المتبقي: ${data[type].length}`
                ], msg);
                return;
            }

            // حذف الجروب الحالي (داخل الجروب نفسه)
            if (!isGroup) {
                await sendMessage(sock, chatId, [
                    '❌ *هذا الأمر يعمل داخل المجموعات فقط*',
                    '',
                    '📌 أو استخدم: `.تبادل حذف [نوع] [رقم]` من أي شات.'
                ], msg);
                return;
            }

            if (!data[type].includes(chatId)) {
                await sendMessage(sock, chatId, [
                    `ℹ️ *هذا الجروب غير موجود في قائمة ${type}*`
                ], msg);
                return;
            }

            data[type] = data[type].filter(jid => jid !== chatId);
            saveData(data);

            await sendMessage(sock, chatId, [
                '✅ *تم الحذف بنجاح*',
                '',
                `📌 تم حذف هذا الجروب من ${type}`,
                `📊 العدد المتبقي: ${data[type].length}`
            ], msg);
            return;
        }

        // ============================================================
        // 🔹 .تبادل قائمة [نوع]
        // ============================================================
        if (subCommand === 'قائمة' || subCommand === 'list') {
            if (!canManage) {
                await sendMessage(sock, chatId, [
                    '❌ *غير مصرح*',
                    '',
                    '🔒 هذا الأمر مخصص للمطور، الأونر، النخبة، ومشرفي الجروب.'
                ], msg);
                return;
            }

            const data = loadData();

            if (type) {
                // 🛡️ منع استخدام النقطة في النوع
                if (containsDot(type)) {
                    await sendMessage(sock, chatId, [
                        '🛡️ *تم منع العرض*',
                        '',
                        '⚠️ لا يمكن استخدام نقطة (.) في النوع.',
                        '📌 النقطة محظورة لمنع استغلال النظام.'
                    ], msg);
                    return;
                }

                const list = data[type] || [];
                if (list.length === 0) {
                    await sendMessage(sock, chatId, [
                        `📭 *لا توجد جروبات في ${type}*`
                    ], msg);
                    return;
                }

                const lines = [
                    `📋 *جروبات ${type}* (${list.length})`,
                    ''
                ];
                for (let i = 0; i < list.length; i++) {
                    const name = await getGroupName(sock, list[i]);
                    lines.push(`   ${i+1}. ${name}`);
                }
                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            const types = Object.keys(data);
            if (types.length === 0) {
                await sendMessage(sock, chatId, [
                    '📭 *لا توجد أي أنواع مضافة بعد*'
                ], msg);
                return;
            }

            const lines = ['📊 *قائمة جروبات التبادل*', ''];
            for (const t of types) {
                const list = data[t] || [];
                lines.push(`📌 *${t}* (${list.length})`);
                if (list.length > 0) {
                    for (let i = 0; i < Math.min(list.length, 10); i++) {
                        const name = await getGroupName(sock, list[i]);
                        lines.push(`   ${i+1}. ${name}`);
                    }
                    if (list.length > 10) {
                        lines.push(`   ... و ${list.length - 10} أخرى`);
                    }
                } else {
                    lines.push(`   (فارغ)`);
                }
                lines.push('');
            }
            await sendMessage(sock, chatId, lines, msg);
            return;
        }

        // ============================================================
        // 🔹 .تبادل نشر [نوع] [منشن اختياري]
        // ============================================================
        if (subCommand === 'نشر' || subCommand === 'send') {
            // ✅ صلاحية النشر فقط للمطور، الأونر، والنخبة (المشرفين ممنوعين)
            if (!canPublish) {
                await sendMessage(sock, chatId, [
                    '❌ *غير مصرح*',
                    '',
                    '🔒 أمر النشر مخصص للمطور، الأونر، والنخبة فقط.',
                    '👥 المشرفين ليس لديهم صلاحية للنشر.'
                ], msg);
                return;
            }

            if (!type) {
                await sendMessage(sock, chatId, [
                    '❌ *يرجى تحديد النوع*',
                    '',
                    '📝 مثال: `.تبادل نشر صحيفة`'
                ], msg);
                return;
            }

            // 🛡️ منع استخدام النقطة في النوع
            if (containsDot(type)) {
                await sendMessage(sock, chatId, [
                    '🛡️ *تم منع النشر*',
                    '',
                    '⚠️ لا يمكن استخدام نقطة (.) في النوع.',
                    '📌 النقطة محظورة لمنع استغلال النظام.'
                ], msg);
                return;
            }

            const data = loadData();
            const targetGroups = data[type] || [];

            if (targetGroups.length === 0) {
                await sendMessage(sock, chatId, [
                    `❌ *لا توجد جروبات في ${type}*`,
                    '',
                    `📌 أضف جروبات أولاً: .تبادل اضف ${type}`
                ], msg);
                return;
            }

            // الحصول على الرسالة المقتبسة
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
            const quoted = contextInfo?.quotedMessage;
            const quotedMsgKey = contextInfo?.stanzaId;
            const quotedParticipant = contextInfo?.participant;

            if (!quoted || !quotedMsgKey) {
                await sendMessage(sock, chatId, [
                    '❌ *يرجى الرد على الرسالة المراد إعادة توجيهها*',
                    '',
                    '📝 مثال: (رد على رسالة) `.تبادل نشر صحيفة منشن`'
                ], msg);
                return;
            }

            // 🛡️ منع إعادة توجيه الأوامر (الرسائل التي تحتوي على نقطة)
            const quotedText = quoted?.conversation || 
                               quoted?.extendedTextMessage?.text || 
                               quoted?.imageMessage?.caption || 
                               quoted?.videoMessage?.caption || 
                               '';

            if (containsDot(quotedText)) {
                await sendMessage(sock, chatId, [
                    '🛡️ *تم منع إعادة التوجيه*',
                    '',
                    '⚠️ لا يمكن إعادة توجيه رسائل تحتوي على نقطة (.)',
                    '📌 النقطة محظورة لمنع استغلال النظام وإعادة توجيه الأوامر.'
                ], msg);
                return;
            }

         // رسالة "جاري النشر"
            const waitLines = [
                `📤 *جاري إعادة التوجيه...*`,
                '',
                `📌 النوع: ${type}`,
                `📌 عدد الجروبات: ${targetGroups.length}`,
                `${hasMention ? '👥 مع منشن مخفي' : ''}`
            ];
            await sendMessage(sock, chatId, waitLines, msg);

            let successCount = 0;
            let failCount = 0;
            let failDetails = [];

            // النشر في جميع الجروبات
            for (const groupJid of targetGroups) {
                try {
                    const forwardMsg = {
                        key: {
                            remoteJid: groupJid,
                            fromMe: false,
                            id: quotedMsgKey,
                            participant: quotedParticipant,
                        },
                        message: quoted
                    };

                    if (hasMention) {
                        const metadata = await sock.groupMetadata(groupJid);
                        const mentions = metadata.participants.map(p => p.id);
                        await sock.sendMessage(groupJid, {
                            forward: forwardMsg,
                            mentions: mentions
                        });
                    } else {
                        await sock.sendMessage(groupJid, {
                            forward: forwardMsg
                        });
                    }

                    successCount++;

                } catch (err) {
                    failCount++;
                    const name = await getGroupName(sock, groupJid);
                    failDetails.push(`❌ ${name}: ${err.message?.substring(0, 30) || 'خطأ'}`);
                    console.error(`فشل النشر في ${groupJid}:`, err.message);
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // تقرير النشر
            const reportLines = [
                '📊 *تقرير إعادة التوجيه*',
                '',
                `📌 النوع: ${type}`,
                `✅ نجح: ${successCount} جروب`,
                `❌ فشل: ${failCount} جروب`,
                hasMention ? '👥 منشن مخفي: تم' : ''
            ];
            if (failDetails.length > 0) {
                reportLines.push('');
                reportLines.push('📋 *التفاصيل:*');
                for (let i = 0; i < Math.min(failDetails.length, 5); i++) {
                    reportLines.push(`   ${failDetails[i]}`);
                }
                if (failDetails.length > 5) {
                    reportLines.push(`   ... و ${failDetails.length - 5} أخرى`);
                }
            }
            await sendMessage(sock, chatId, reportLines, msg);
            return;
        }

        // ============================================================
        // ❌ أمر غير معروف
        // ============================================================
        await sendMessage(sock, chatId, [
            '❌ *أمر غير معروف*',
            '',
            '📌 استخدم `.تبادل` لعرض المساعدة.'
        ], msg);
    }
};

// ============================================================
// 📤 تصدير الدوال للاستخدام في ملفات أخرى
// ============================================================
module.exports.loadData = loadData;
module.exports.saveData = saveData;
module.exports.getGroupName = getGroupName;
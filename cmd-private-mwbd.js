// مؤبد.js - نظام الحظر المؤبد الفاخر (نسخة محسنة بدون خطوط) مع النشر في جروبات الإعلانات
const fs = require('fs');
const path = require('path');
const { jidDecode } = require('@whiskeysockets/baileys');
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
    getGroupName = async () => 'جروب غير معروف';
}

// ===================== دوال مساعدة =====================
// تحويل أي JID إلى صيغة @lid
const decode = jid =>
    (jidDecode(jid)?.user || jid.split('@')[0]) + '@lid';

// مسار ملف الحظر
const banFile = path.join(__dirname, 'db-ban.json');

function loadBans() {
    if (!fs.existsSync(banFile)) {
        fs.writeFileSync(banFile, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(banFile));
}

function saveBans(data) {
    fs.writeFileSync(banFile, JSON.stringify(data, null, 2));
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🚫 نـظـام الـحـظـر الـمـؤبـد 🚫\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// استخراج الهدف من الأمر (منشن، رد، أو رقم هاتف)
function extractTarget(msg, args) {
    const context = msg.message?.extendedTextMessage?.contextInfo;
    // منشن أو رد
    if (context?.participant) return context.participant;
    if (context?.mentionedJid?.[0]) return context.mentionedJid[0];
    // رقم هاتف (مثل +<الرقم> أو <الرقم>)
    const possibleNumber = args[1]?.match(/^(\+?\d{10,15})$/);
    if (possibleNumber) {
        let number = possibleNumber[0];
        if (!number.startsWith('+')) number = '+' + number;
        return number.includes('@') ? number : number + '@s.whatsapp.net';
    }
    return null;
}

// البحث عن العضو في المجموعات
async function findMemberInGroups(sock, targetJid) {
    try {
        const groups = await sock.groupFetchAllParticipating();
        const found = [];
        for (const groupId of Object.keys(groups)) {
            const group = groups[groupId];
            const member = group.participants.find(p => p.id === targetJid);
            if (member) {
                found.push(groupId);
            }
        }
        return found;
    } catch (e) {
        console.log('خطأ في البحث عن العضو:', e);
        return [];
    }
}

// طرد العضو من جميع المجموعات
async function kickFromAllGroups(sock, targetJid) {
    try {
        const groups = await sock.groupFetchAllParticipating();
        let kickedCount = 0;
        for (const groupId of Object.keys(groups)) {
            const group = groups[groupId];
            const isInGroup = group.participants.some(p => p.id === targetJid);
            if (!isInGroup) continue;
            try {
                await sock.sendMessage(groupId, {
                    text: `🚫 @${targetJid.split('@')[0]}، عليك مؤبد 😉`,
                    mentions: [targetJid]
                });
                await sock.groupParticipantsUpdate(groupId, [targetJid], 'remove');
                kickedCount++;
                await new Promise(r => setTimeout(r, 500));
            } catch (e) {
                console.log(`فشل طرد من ${groupId}`);
            }
        }
        return kickedCount;
    } catch (e) {
        console.log('خطأ في طرد العضو:', e);
        return 0;
    }
}

// ===================== الأمر الرئيسي =====================
module.exports = {
    category: 'خاصة',
    command: "مؤبد",
    description: "🚫 نظام الحظر المؤبد الفاخر (حظر، فك، عرض، تنظيف) مع هرم الصلاحيات والنشر في الإعلانات",

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderLid = hay.toLid(sender);
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/);

            // استخراج الأمر الفرعي
            const subCommand = args[1]?.toLowerCase();
            const knownCommands = ['عرض', 'تنظيف', 'فك', 'اعفاء', 'شرح'];

            // التحقق من الصلاحية
            const isFounder = hay.isFounder(senderLid);
            const isOwner = hay.isOwnerbot(senderLid);
            const isDev = hay.isDeveloper(senderLid);

            if (!(isFounder || isOwner || isDev)) {
                await sendMessage(sock, chatId, [
                    '🚫 ذل من لا صلاحيات له 😂🫵'
                ], msg);
                return;
            }

            // ===================== شرح الأوامر =====================
            if (subCommand === 'شرح') {
                const lines = [
                    '📖 *شرح أوامر المؤبد*',
                    '',
                    '🚫 *أمر الحظر:*',
                    '   .مؤبد @منشن',
                    '   .مؤبد +<الرقم>',
                    '   → حظر العضو مؤبداً وطرده من كل الجروبات',
                    '',
                    '📋 *عرض المحظورين:*',
                    '   .مؤبد عرض',
                    '   → عرض قائمة المحظورين مع منشناتهم',
                    '',
                    '🧹 *تنظيف:*',
                    '   .مؤبد تنظيف',
                    '   → فحص وطرد المحظورين من الجروبات',
                    '',
                    '✅ *إعفاء فرد:*',
                    '   .مؤبد اعفاء @منشن',
                    '   .مؤبد فك @منشن',
                    '   → إلغاء حظر شخص معين',
                    '',
                    '✅ *إعفاء الكل:*',
                    '   .مؤبد اعفاء كل',
                    '   .مؤبد فك كل',
                    '   → إلغاء حظر جميع المحظورين',
                    '',
                    '📖 *هذا الشرح:*',
                    '   .مؤبد شرح',
                    '',
                    '🔐 *هرم الصلاحيات:*',
                    '   • المالك: يتحكم بالكل',
                    '   • المطور: يتحكم بالأعضاء فقط'
                ];
                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            // ===================== عرض القائمة =====================
            if (subCommand === 'عرض') {
                const bans = loadBans();
                const entries = Object.entries(bans);
                if (entries.length === 0) {
                    await sendMessage(sock, chatId, [
                        '📋 لا يوجد أعضاء محظورين حالياً.'
                    ], msg);
                    return;
                }
                
                const lines = [
                    '📋 *قائمة المحظورين مؤبداً*',
                    ''
                ];
                const mentions = [];
                
                for (const [lid, data] of entries) {
                    const date = new Date(data.date).toLocaleString('ar-EG');
                    const by = data.by ? `بواسطة: @${data.by.split('@')[0]}` : 'نظام البوت';
                    const userName = lid.split('@')[0];
                    lines.push(`👤 @${userName}`);
                    lines.push(`📅 ${date}`);
                    lines.push(`🔧 ${by}`);
                    lines.push('');
                    mentions.push(lid);
                }
                
                await sendMessage(sock, chatId, lines, msg, mentions);
                return;
            }

            // ===================== تنظيف (فحص وطرد المحظورين) =====================
            if (subCommand === 'تنظيف') {
                const bans = loadBans();
                const bannedIds = Object.keys(bans);
                if (bannedIds.length === 0) {
                    await sendMessage(sock, chatId, [
                        '🧹 لا يوجد أعضاء محظورين حالياً.'
                    ], msg);
                    return;
                }
                
                const groups = await sock.groupFetchAllParticipating();
                let totalKicked = 0;
                const report = [];
                
                for (const groupId of Object.keys(groups)) {
                    const group = groups[groupId];
                    let kickedInGroup = 0;
                    for (const member of group.participants) {
                        const memberLid = hay.toLid(member.id);
                        if (bannedIds.includes(memberLid)) {
                            try {
                                await sock.sendMessage(groupId, {
                                    text: `🚫 @${member.id.split('@')[0]}، أنت محظور مؤبداً من البوت! تم طردك 😂🫵.`,
                                    mentions: [member.id]
                                });
                                await sock.groupParticipantsUpdate(groupId, [member.id], 'remove');
                                totalKicked++;
                                kickedInGroup++;
                                await new Promise(r => setTimeout(r, 500));
                            } catch (e) {
                                console.log(`فشل طرد ${member.id} في ${groupId}`);
                            }
                        }
                    }
                    if (kickedInGroup > 0) {
                        report.push(`🏠 ${groupId.split('@')[0]} : ${kickedInGroup} عضو`);
                    }
                }
                
                const lines = [
                    '🧹 *تقرير تنظيف المحظورين*',
                    '',
                    `✅ تم طرد ${totalKicked} عضواً محظوراً.`,
                    '',
                    ...(report.length > 0 ? report : ['لم يتم العثور على محظورين في أي مجموعة.'])
                ];
                
                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            // ===================== إعفاء / فك الحظر =====================
            if (subCommand === 'اعفاء' || subCommand === 'فك') {
                // التحقق إذا كان "كل"
                if (args[2]?.toLowerCase() === 'كل') {
                    if (!(isFounder || isOwner)) {
                        await sendMessage(sock, chatId, [
                            '❌ فقط المالك يمكنه إعفاء جميع المحظورين.'
                        ], msg);
                        return;
                    }
                    const bans = loadBans();
                    const count = Object.keys(bans).length;
                    if (count === 0) {
                        await sendMessage(sock, chatId, [
                            '📭 لا يوجد محظورين لإعفائهم.'
                        ], msg);
                        return;
                    }
                    saveBans({});
                    await sendMessage(sock, chatId, [
                        `✅ تم إعفاء جميع المحظورين (${count} شخص).`
                    ], msg);
                    return;
                }

                // إعفاء فرد
                const target = extractTarget(msg, args);
                if (!target) {
                    await sendMessage(sock, chatId, [
                        '❌ يجب المنشن، الرد على العضو، أو كتابة رقم الهاتف.',
                        '📝 مثال: .مؤبد اعفاء +<الرقم>'
                    ], msg);
                    return;
                }
                
                const decodedTarget = decode(target);
                const targetLid = hay.toLid(decodedTarget);
                const bans = loadBans();
                
                if (!bans[targetLid]) {
                    await sendMessage(sock, chatId, [
                        `⚠️ @${target.split('@')[0]} ليس عليه حظر مؤبد.`
                    ], msg, [target]);
                    return;
                }
                
                delete bans[targetLid];
                saveBans(bans);
                
                await sendMessage(sock, chatId, [
                    `✅ تم إعفاء @${target.split('@')[0]} من الحظر المؤبد.`
                ], msg, [target]);
                return;
            }

            // ===================== الحظر المؤبد (الأمر الرئيسي) =====================
            const target = extractTarget(msg, args);
            if (!target) {
                await sendMessage(sock, chatId, [
                    '❌ يجب المنشن، الرد على العضو، أو كتابة رقم الهاتف.',
                    '📝 مثال: .مؤبد +<الرقم>',
                    '',
                    '📖 للشرح: .مؤبد شرح'
                ], msg);
                return;
            }

            const decodedTarget = decode(target);
            const targetLid = hay.toLid(decodedTarget);

            // التأكد من أن العضو موجود في الجروبات
            const groupsFound = await findMemberInGroups(sock, decodedTarget);
            if (groupsFound.length === 0) {
                await sendMessage(sock, chatId, [
                    `⚠️ العضو @${target.split('@')[0]} غير موجود في أي مجموعة.`
                ], msg, [target]);
                return;
            }

            // رتبة المستهدف
            const isTargetFounder = hay.isFounder(targetLid);
            const isTargetOwner = hay.isOwnerbot(targetLid);
            const isTargetDev = hay.isDeveloper(targetLid);

            // ========== هرم الصلاحيات ==========
            let canBan = false;
            if (isFounder) {
                canBan = true;
            } else if (isOwner) {
                if (!isTargetFounder) canBan = true;
            } else if (isDev) {
                if (!(isTargetFounder || isTargetOwner)) canBan = true;
            }

            if (!canBan) {
                await sendMessage(sock, chatId, [
                    '🚫 لا يمكنك حظر هذا الشخص.'
                ], msg);
                return;
            }

            // إضافة الحظر
            const bans = loadBans();
            bans[targetLid] = {
                reason: 'permanent ban',
                date: Date.now(),
                by: senderLid
            };
            saveBans(bans);

            // طرد من جميع المجموعات
            const kickedCount = await kickFromAllGroups(sock, decodedTarget);

            // ========== بناء رسالة الحظر ==========
            const banLines = [
                `☠️ تم حظر @${target.split('@')[0]}`,
                `✅ تم طرده من ${kickedCount} مجموعة.`
            ];

            // ========== إرسال في الجروب الحالي ==========
            await sendMessage(sock, chatId, banLines, msg, [target]);

            // ========== نشر الحظر في جروبات الإعلانات ==========
            try {
                const exchangeData = loadData();
                // أنواع الإعلانات المختلفة
                const adTypes = ['إعلانات', 'الاعلانات', 'الإعلانات', 'اعلانات'];
                let adGroups = [];
                for (const type of adTypes) {
                    if (exchangeData[type] && Array.isArray(exchangeData[type])) {
                        adGroups = adGroups.concat(exchangeData[type]);
                    }
                }
                adGroups = [...new Set(adGroups)];

                if (adGroups.length > 0) {
                    const groupName = await getGroupName(sock, chatId);
                    const senderName = msg.pushName || sender.split('@')[0];
                    
                    // رسالة مخصصة للإعلانات مع منشن المستهدف والمنفذ
                    const adLines = [
                        `🚫 *حظر مؤبد جديد*`,
                        '',
                        `👤 المستهدف: @${target.split('@')[0]}`,
                        `👮‍♂️ المنفذ: ${senderName}`,
                        `📌 المصدر: ${groupName || chatId}`,
                        `📊 عدد الجروبات المطرود منها: ${kickedCount}`
                    ];

                    for (const adGroup of adGroups) {
                        try {
                            await sendMessage(sock, adGroup, adLines, null, [target, sender]);
                            console.log(`✅ نشر الحظر المؤبد في جروب الإعلانات: ${adGroup}`);
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } catch (e) {
                            console.error(`❌ فشل نشر الحظر في ${adGroup}:`, e.message);
                        }
                    }
                }
            } catch (e) {
                console.error('❌ خطأ في نشر الحظر في جروبات الإعلانات:', e.message);
            }

        } catch (err) {
            console.error('❌ خطأ:', err);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};
// نخب.js - عرض مجموعات النخبة (نسخة محسنة ومطورة)
const eliteNumbers = require('./lib-roles').eliteNumbers;
const hay = require('./lib-roles');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, 'db-eliteSettings.json');

if (!fs.existsSync(path.dirname(settingsPath))) fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, JSON.stringify({}, null, 2));

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `👑 قـائـمـة الـنـخـبـة 👑\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== دالة الحصول على اسم العضو ==========
async function getParticipantName(sock, groupId, jid) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const participant = metadata.participants.find(p => p.id === jid);
        if (participant && participant.name) return participant.name;
        return jid.split('@')[0];
    } catch {
        return jid.split('@')[0];
    }
}

module.exports = {
    command: ['النخبة','نخب'],
    description: '👑 يعرض كل المجموعات التي فيها البوت، مرتبة حسب الحجم، مع منشن النخبة في كل مجموعة (للمطور فقط).',
    category: 'نقابات',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const senderLid = hay.toLid(senderJid);
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/);

            // السماح للمطور والأونر بوت
            const hasAccess = hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid);
            
            if (!hasAccess) {
                await sendMessage(sock, chatId, [
                    '🚫 هذا الأمر مخصص للمطورين فقط.'
                ], msg);
                return;
            }

            // تحميل الإعدادات
            const settings = loadJSON(settingsPath);
            const action = args[1]?.toLowerCase();

            // ===== أوامر الإعدادات =====
            if (action === 'اعدادات' || action === 'settings') {
                const lines = [
                    '⚙️ إعدادات النخبة',
                    ``,
                    `📊 عدد النخبة المسجلين: ${eliteNumbers.length}`,
                    `🔒 إخفاء الأرقام: ${settings.hideNumbers ? '✅ مفعل' : '❌ معطل'}`,
                    `📌 عرض التفاصيل: ${settings.showDetails ? '✅ مفعل' : '❌ معطل'}`,
                    ``,
                    '📌 الأوامر:',
                    '.نخب عرض - عرض القائمة',
                    '.نخب تفاصيل - عرض مع التفاصيل',
                    '.نخب اخفاء - إخفاء الأرقام',
                    '.نخب اظهار - إظهار الأرقام'
                ];
                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            // ===== تفعيل/تعطيل إخفاء الأرقام =====
            if (action === 'اخفاء' || action === 'hide') {
                settings.hideNumbers = true;
                saveJSON(settingsPath, settings);
                await sendMessage(sock, chatId, [
                    '🔒 تم إخفاء أرقام النخبة.',
                    '📌 سيتم عرض الأسماء بدلاً من الأرقام.'
                ], msg);
                return;
            }

            if (action === 'اظهار' || action === 'show') {
                settings.hideNumbers = false;
                saveJSON(settingsPath, settings);
                await sendMessage(sock, chatId, [
                    '🔓 تم إظهار أرقام النخبة.'
                ], msg);
                return;
            }

            // ===== تفعيل/تعطيل عرض التفاصيل =====
            if (action === 'تفاصيل' || action === 'details') {
                settings.showDetails = !settings.showDetails;
                saveJSON(settingsPath, settings);
                await sendMessage(sock, chatId, [
                    settings.showDetails ? '✅ تم تفعيل عرض التفاصيل' : '❌ تم تعطيل عرض التفاصيل'
                ], msg);
                return;
            }

            // ===== جلب المجموعات =====
            const allChats = await sock.groupFetchAllParticipating();
            const groupsArray = Object.values(allChats);

            // ترتيب المجموعات من الأكبر إلى الأصغر حسب عدد الأعضاء
            groupsArray.sort((a, b) => b.participants.length - a.participants.length);

            // إحصائيات
            let totalGroups = 0;
            let totalElite = 0;
            let totalMembers = 0;

            const groupLines = [];
            const allMentions = [];

            for (const group of groupsArray) {
                const groupName = group.subject || 'بدون اسم';
                const groupId = group.id;
                const participants = group.participants || [];
                totalGroups++;
                totalMembers += participants.length;

                const eliteInGroup = participants
                    .filter(p => eliteNumbers.includes(p.id.split('@')[0]))
                    .map(p => p.id);

                if (eliteInGroup.length > 0) {
                    totalElite += eliteInGroup.length;
                    
                    let eliteText = '';
                    const eliteNames = [];
                    
                    for (const jid of eliteInGroup) {
                        const name = settings.hideNumbers ? 
                            await getParticipantName(sock, groupId, jid) : 
                            jid.split('@')[0];
                        eliteNames.push(name);
                        allMentions.push(jid);
                    }
                    
                    eliteText = eliteNames.map(n => `@${n}`).join(' ');
                    
                    let groupLine = `💠 *${groupName}* [${participants.length} عضو]`;
                    if (settings.showDetails) {
                        groupLine += ` | نخبة: ${eliteInGroup.length}`;
                    }
                    groupLine += `\n   ${eliteText}`;
                    groupLines.push(groupLine);
                }
            }

            // ===== بناء الرسالة =====
            if (groupLines.length === 0) {
                await sendMessage(sock, chatId, [
                    '😕 لا يوجد نخبة في أي مجموعة حالياً.',
                    `📊 عدد المجموعات: ${totalGroups}`,
                    `👥 إجمالي الأعضاء: ${totalMembers}`
                ], msg);
                return;
            }

            const lines = [
                `📊 *إحصائيات النخبة*`,
                ``,
                `📌 عدد المجموعات: ${totalGroups}`,
                `👥 إجمالي الأعضاء: ${totalMembers}`,
                `👑 عدد النخبة: ${totalElite}`,
                ``,
                `📋 *قائمة مجموعات النخبة:*`,
                ``
            ];

            lines.push(...groupLines);

            // ===== إضافة معلومات إضافية =====
            if (settings.showDetails) {
                const eliteList = eliteNumbers.map(num => {
                    const found = allMentions.some(j => j.includes(num));
                    return found ? `✅ ${num}` : `❌ ${num}`;
                });
                lines.push(``);
                lines.push(`📋 *قائمة النخبة:*`);
                lines.push(eliteList.join(' | '));
            }

            // ===== إرسال الرسالة =====
            await sendMessage(sock, chatId, lines, msg, allMentions);

        } catch (err) {
            console.error('❌ خطأ في أمر نخب:', err);
            await sendMessage(sock, msg.key.remoteJid, [
                `❌ حدث خطأ أثناء تنفيذ الأمر:`,
                err.message || err.toString()
            ], msg);
        }
    }
};
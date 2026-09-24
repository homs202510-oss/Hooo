// مسح.js - حذف مملكة مستخدم بالكامل مع إزالته من الفريق (للمطورين فقط) - نسخة محسّنة مع تأكيد أقوى
// ✅ لا يمسح النسخ الاحتياطية (يحتفظ بـ .bak)
const fs = require('fs');
const path = require('path');
const hay = require('./lib-roles');

const kingdomPath = path.join(__dirname, 'db-kingdom.json');
const pointsPath = path.join(__dirname, 'db-points.json');
const bankPath = path.join(__dirname, 'db-bank.json');
const loansPath = path.join(__dirname, 'db-loans.json');
const teamsPath = path.join(__dirname, 'db-teams.json');

if (!fs.existsSync(path.dirname(kingdomPath))) fs.mkdirSync(path.dirname(kingdomPath), { recursive: true });
if (!fs.existsSync(kingdomPath)) fs.writeFileSync(kingdomPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(bankPath)) fs.writeFileSync(bankPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(loansPath)) fs.writeFileSync(loansPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(teamsPath)) fs.writeFileSync(teamsPath, JSON.stringify({}, null, 2));

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}

function saveJSON(file, data) {
    try {
        // ✅ عمل نسخة احتياطية فقط إذا كان الملف موجوداً، ولا نمسحها أبداً
        if (fs.existsSync(file)) {
            // نتحقق من وجود النسخة الاحتياطية، وإن لم توجد ننشئها
            if (!fs.existsSync(file + '.bak')) {
                fs.writeFileSync(file + '.bak', fs.readFileSync(file));
            }
        }
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('❌ فشل حفظ الملف:', file, e.message);
        return false;
    }
}

// ========== دوال مساعدة ==========
function getCleanJid(jid) {
    if (!jid) return '';
    if (jid.includes('@')) return jid.split('@')[0].replace(/[^0-9]/g, '');
    return jid.replace(/[^0-9]/g, '');
}

function extractMentions(msg) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
    const mentioned = [];

    if (contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
        for (let jid of contextInfo.mentionedJid) {
            if (jid && !mentioned.includes(jid)) mentioned.push(jid);
        }
    }

    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const mentionMatches = text.match(/@(\d+)/g);
    if (mentionMatches) {
        for (const match of mentionMatches) {
            const num = match.replace('@', '');
            const jid = `${num}@lid`;
            if (!mentioned.includes(jid)) mentioned.push(jid);
        }
    }

    if (contextInfo.participant) {
        let participant = contextInfo.participant;
        if (participant && !mentioned.includes(participant)) mentioned.push(participant);
    }

    return mentioned;
}

// ========== دالة حذف بيانات المستخدم ==========
function deleteUserData(jid) {
    let deleted = { kingdom: false, points: 0, bank: 0, loans: 0, team: null };

    const kingdom = loadJSON(kingdomPath);
    if (kingdom[jid]) { deleted.kingdom = true; delete kingdom[jid]; saveJSON(kingdomPath, kingdom); }

    const points = loadJSON(pointsPath);
    if (points[jid] !== undefined) { deleted.points = points[jid]; delete points[jid]; saveJSON(pointsPath, points); }

    const bank = loadJSON(bankPath);
    if (bank[jid]) { deleted.bank = bank[jid].deposit || 0; delete bank[jid]; saveJSON(bankPath, bank); }

    const loans = loadJSON(loansPath);
    if (loans[jid]) { deleted.loans = loans[jid].remaining || 0; delete loans[jid]; saveJSON(loansPath, loans); }

    const teams = loadJSON(teamsPath);
    for (const [teamName, teamData] of Object.entries(teams)) {
        if (teamData.leader === jid) {
            delete teams[teamName];
            deleted.team = { name: teamName, action: 'deleted' };
            saveJSON(teamsPath, teams);
            break;
        } else if (teamData.members && teamData.members.includes(jid)) {
            teamData.members = teamData.members.filter(m => m !== jid);
            deleted.team = { name: teamName, action: 'removed' };
            saveJSON(teamsPath, teams);
            break;
        }
    }
    return deleted;
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🗑️ مـسـح مـمـلـكـة 🗑️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) msg += `${line}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['مسح', 'امسح'],
    description: '🗑️ حذف مملكة مستخدم بالكامل + إزالته من الفريق (للمطورين فقط)',
    category: 'مملكة',
    usage: '.مسح @منشن',
    example: '.مسح @منشن',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            const senderLid = hay.toLid(sender);
            if (!(hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid))) {
                return await sendMessage(sock, chatId, ['🚫 هذا الأمر مخصص للمطورين فقط.'], msg, [sender]);
            }

            const mentioned = extractMentions(msg);
            const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant || null;
            let target = null;

            if (mentioned.length > 0) {
                target = mentioned[0];
            } else if (quotedSender) {
                target = quotedSender;
            } else {
                return await sendMessage(sock, chatId, [
                    '❌ يجب منشن الشخص أو الرد على رسالته.',
                    '📝 مثال: .مسح @منشن'
                ], msg, [sender]);
            }

            if (!target.includes('@')) target = `${target}@lid`;
            if (target === sender) {
                return await sendMessage(sock, chatId, ['❌ لا يمكنك مسح مملكتك بنفسك.'], msg, [sender]);
            }

            const kingdom = loadJSON(kingdomPath);
            if (!kingdom[target]) {
                return await sendMessage(sock, chatId, [`❌ @${getCleanJid(target)} ليس لديه مملكة.`], msg, [sender, target]);
            }

            // ===== تأكيد أقوى: يطلب كتابة اسم المستخدم المستهدف =====
            const targetNum = getCleanJid(target);
            await sendMessage(sock, chatId, [
                `⚠️ *تحذير!* أنت على وشك حذف مملكة @${targetNum} نهائياً.`,
                `📌 سيتم حذف: النقاط، البنك، القروض، وجميع البيانات المرتبطة.`,
                `📌 إذا كان قائد فريق، سيتم حذف الفريق بالكامل.`,
                `📌 إذا كان عضواً، سيتم إخراجه من الفريق.`,
                '',
                `🔐 لتأكيد الحذف، اكتب: \`تأكيد حذف ${targetNum}\``,
                `📌 خلال 30 ثانية.`
            ], msg, [sender, target]);

            // ===== معالج التأكيد =====
            const confirmHandler = async ({ messages }) => {
                for (const m of messages) {
                    const from = m.key.participant || m.participant || m.key.remoteJid;
                    if (from !== sender) continue;
                    const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                    if (txt.trim() === `تأكيد حذف ${targetNum}`) {
                        const deleted = deleteUserData(target);
                        const lines = [
                            `✅ تم حذف مملكة @${targetNum} بنجاح.`,
                            '',
                            '📊 *البيانات المحذوفة:*'
                        ];
                        if (deleted.kingdom) lines.push('   🏰 المملكة: تم الحذف');
                        if (deleted.points !== undefined) lines.push(`   💰 النقاط: ${deleted.points}`);
                        if (deleted.bank !== undefined) lines.push(`   🏦 البنك: ${deleted.bank}`);
                        if (deleted.loans !== undefined) lines.push(`   📉 القروض: ${deleted.loans}`);
                        if (deleted.team) {
                            if (deleted.team.action === 'deleted') {
                                lines.push(`   🏴 الفريق "${deleted.team.name}": تم حذفه بالكامل (لأن المستخدم كان قائداً)`);
                            } else {
                                lines.push(`   🏴 الفريق "${deleted.team.name}": تم إخراج المستخدم منه`);
                            }
                        } else {
                            lines.push('   🏴 الفريق: المستخدم ليس في أي فريق');
                        }
                        lines.push('', '📌 يمكن للمستخدم إنشاء مملكة وفريق جديد متى شاء.');
                        await sendMessage(sock, chatId, lines, m, [sender, target]);
                        sock.ev.off('messages.upsert', confirmHandler);
                        return;
                    } else {
                        await sendMessage(sock, chatId, ['❌ تم إلغاء عملية المسح.'], m, [sender]);
                        sock.ev.off('messages.upsert', confirmHandler);
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', confirmHandler);
            setTimeout(() => {
                sock.ev.off('messages.upsert', confirmHandler);
            }, 30000);

        } catch (error) {
            console.error('✗ خطأ في أمر مسح:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};
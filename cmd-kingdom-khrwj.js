// خروج.js - الخروج من الفريق (عضو عادي يطلب موافقة القائد، القائد يحذف الفريق بتأكيد، أو طرد عضو بالمنشن) - نسخة متوافقة مع نظام التخزين المنفصل
const fs = require('fs');
const path = require('path');

const teamsPath = path.join(__dirname, 'db-teams.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');

// ===== التأكد من وجود جميع الملفات =====
if (!fs.existsSync(MAIN_PATH)) fs.writeFileSync(MAIN_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(teamsPath)) fs.writeFileSync(teamsPath, JSON.stringify({}, null, 2));

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

// ========== دوال الفرق ==========
function loadTeams() { return loadJSON(teamsPath); }
function saveTeams(data) { saveJSON(teamsPath, data); }

function getTeamNameByMember(jid, teams) {
    for (const [teamName, teamData] of Object.entries(teams)) {
        if (teamData.leader === jid || (teamData.members && teamData.members.includes(jid))) {
            return teamName;
        }
    }
    return null;
}

function getTeam(teamName, teams) {
    return teams[teamName] || null;
}

// ========== دالة الحصول على رقم المستخدم النظيف للعرض ==========
function getCleanJid(jid) {
    if (!jid) return '';
    if (jid.includes('@')) {
        return jid.split('@')[0];
    }
    return jid.replace(/[^0-9]/g, '');
}

// ========== دالة استخراج المنشن بشكل موحد ==========
function extractMentions(msg) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
    const mentioned = [];

    if (contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
        for (const jid of contextInfo.mentionedJid) {
            if (!jid.includes('@')) {
                mentioned.push(`${jid}@s.whatsapp.net`);
            } else {
                mentioned.push(jid);
            }
        }
    }

    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const mentionMatches = text.match(/@(\d+)/g);
    if (mentionMatches) {
        for (const match of mentionMatches) {
            const num = match.replace('@', '');
            const jid = `${num}@s.whatsapp.net`;
            if (!mentioned.includes(jid)) {
                mentioned.push(jid);
            }
        }
    }

    if (contextInfo.participant) {
        let participant = contextInfo.participant;
        if (!participant.includes('@')) {
            participant = `${participant}@s.whatsapp.net`;
        }
        if (!mentioned.includes(participant)) {
            mentioned.push(participant);
        }
    }

    return mentioned;
}

// ========== دالة تصحيح بيانات المستخدم ==========
function sanitizeUser(user) {
    if (!user) return null;
    if (user.level === undefined || user.level === null) user.level = 1;
    if (user.prosperity === undefined || user.prosperity === null) user.prosperity = 0;
    if (user.lands === undefined || user.lands === null) user.lands = 0;
    if (user.gold === undefined || user.gold === null) user.gold = 0;
    if (user.monstersDefeated === undefined || user.monstersDefeated === null) user.monstersDefeated = 0;
    if (user.pvpWins === undefined || user.pvpWins === null) user.pvpWins = 0;
    if (user.pvpLosses === undefined || user.pvpLosses === null) user.pvpLosses = 0;
    if (user.name === undefined || user.name === null) user.name = `مملكة @${user.owner?.split('@')[0] || 'غير معروف'}`;
    if (user.nameChangesUsed === undefined || user.nameChangesUsed === null) user.nameChangesUsed = 0;
    if (!user.resources) user.resources = { wood: 0, stone: 0, iron: 0 };
    if (user.resources.wood === undefined || user.resources.wood === null) user.resources.wood = 0;
    if (user.resources.stone === undefined || user.resources.stone === null) user.resources.stone = 0;
    if (user.resources.iron === undefined || user.resources.iron === null) user.resources.iron = 0;
    if (!user.buildings) user.buildings = { barracks: { level: 0 }, quarry: { level: 0 }, lumberMill: { level: 0 }, ironMine: { level: 0 } };
    if (user.buildings.barracks === undefined) user.buildings.barracks = { level: 0 };
    if (user.buildings.quarry === undefined) user.buildings.quarry = { level: 0 };
    if (user.buildings.lumberMill === undefined) user.buildings.lumberMill = { level: 0 };
    if (user.buildings.ironMine === undefined) user.buildings.ironMine = { level: 0 };
    if (user.buildings.barracks.level === undefined || user.buildings.barracks.level === null) user.buildings.barracks.level = 0;
    if (user.buildings.quarry.level === undefined || user.buildings.quarry.level === null) user.buildings.quarry.level = 0;
    if (user.buildings.lumberMill.level === undefined || user.buildings.lumberMill.level === null) user.buildings.lumberMill.level = 0;
    if (user.buildings.ironMine.level === undefined || user.buildings.ironMine.level === null) user.buildings.ironMine.level = 0;
    if (!user.soldiers) user.soldiers = {};
    const soldierTypes = ['normal', 'knight', 'archer', 'eliteGuard', 'dragonSpearman', 'legendaryCommander'];
    for (const t of soldierTypes) if (user.soldiers[t] === undefined || user.soldiers[t] === null) user.soldiers[t] = 0;
    if (!user.weapons) user.weapons = {};
    const weaponTypes = ['ironSword', 'goldenShield', 'legendaryBow', 'lightningSword', 'giantHammer', 'deathBow', 'destructionAxe', 'heroSword', 'timeBow', 'eternalBlade', 'fireShield', 'godShield'];
    for (const t of weaponTypes) if (user.weapons[t] === undefined || user.weapons[t] === null) user.weapons[t] = 0;
    if (!user.accessories) user.accessories = {};
    const accessoryTypes = ['powerRing', 'protectionRing', 'kingsCrown', 'shadowMask', 'heroMask'];
    for (const t of accessoryTypes) if (user.accessories[t] === undefined || user.accessories[t] === null) user.accessories[t] = 0;
    if (!user.potions) user.potions = {};
    const potionTypes = ['smallHeal', 'largeHeal', 'energyPotion', 'craftedHeal'];
    for (const t of potionTypes) if (user.potions[t] === undefined || user.potions[t] === null) user.potions[t] = 0;
    if (!user.soulBook) user.soulBook = { pages: 0, spirits: [] };
    if (user.soulBook.pages === undefined || user.soulBook.pages === null) user.soulBook.pages = 0;
    if (!user.soulBook.spirits) user.soulBook.spirits = [];
    if (!user.companion) user.companion = null;
    if (!user.owner) user.owner = user.owner || null;
    if (!user.spellsUsed) user.spellsUsed = {};
    user.lastActive = Date.now();
    return user;
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🚪 الـخـروج مـن الـفـريـق 🚪\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// تخزين طلبات الخروج النشطة (للأعضاء العاديين)
const activeLeaveRequests = new Map();

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'خروج',
    description: '🚪 الخروج من الفريق (للعضو: يطلب موافقة القائد، للقائد: حذف الفريق، أو طرد عضو بالمنشن)',
    category: 'مملكة',
    usage: '.خروج (للعضو) | .خروج @منشن (للقائد لطرد عضو)',
    example: '.خروج  أو  .خروج @منشن',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            // استخراج المنشن إن وجد
            const mentioned = extractMentions(msg);
            const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant || null;
            let target = null;

            if (mentioned.length > 0) {
                target = mentioned[0];
            } else if (quotedSender) {
                if (!quotedSender.includes('@')) {
                    target = `${quotedSender}@s.whatsapp.net`;
                } else {
                    target = quotedSender;
                }
            }

            // تحميل البيانات
            const teams = loadTeams();

            // ===== التحقق من وجود مملكة للمستخدم =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${getCleanJid(sender)}، ليس لديك مملكة.`,
                    `📌 استخدم .لاعب جديد لتأسيس مملكتك.`
                ], msg, [sender]);
                return;
            }

            let user = loadUserData(sender);
            user = sanitizeUser(user);
            saveUserData(sender, user);

            // ===== التحقق من أن المستخدم في فريق =====
            const userTeamName = getTeamNameByMember(sender, teams);
            if (!userTeamName) {
                await sendMessage(sock, chatId, [
                    `❌ @${getCleanJid(sender)}، أنت لست في أي فريق.`,
                    `📌 استخدم .فريق جديد لإنشاء فريق.`
                ], msg, [sender]);
                return;
            }

            const teamData = getTeam(userTeamName, teams);
            if (!teamData) {
                await sendMessage(sock, chatId, [
                    `❌ حدث خطأ: الفريق غير موجود.`
                ], msg, [sender]);
                return;
            }

            const isLeader = teamData.leader === sender;

            // ============================================================
            // الحالة 1: هناك منشن أو رد → عملية طرد (يجب أن يكون المرسل قائداً)
            // ============================================================
            if (target) {
                if (!isLeader) {
                    await sendMessage(sock, chatId, [
                        `❌ @${getCleanJid(sender)}، فقط قائد الفريق يمكنه طرد الأعضاء.`
                    ], msg, [sender]);
                    return;
                }

                if (target === sender) {
                    await sendMessage(sock, chatId, [
                        `❌ لا يمكنك طرد نفسك. استخدم .خروج بدون منشن للخروج.`
                    ], msg, [sender]);
                    return;
                }

                if (!teamData.members.includes(target)) {
                    await sendMessage(sock, chatId, [
                        `❌ @${getCleanJid(target)} ليس عضواً في فريقك.`
                    ], msg, [sender, target]);
                    return;
                }

                teamData.members = teamData.members.filter(m => m !== target);
                saveTeams(teams);

                let targetUser = loadUserData(target);
                if (targetUser) {
                    targetUser = sanitizeUser(targetUser);
                    saveUserData(target, targetUser);
                }

                await sendMessage(sock, chatId, [
                    `✅ @${getCleanJid(sender)} قام بطرد @${getCleanJid(target)} من فريق *${userTeamName}*.`
                ], msg, [sender, target]);
                return;
            }

            // ============================================================
            // الحالة 2: لا يوجد منشن → المستخدم يريد الخروج
            // ============================================================
            if (isLeader) {
                await sendMessage(sock, chatId, [
                    `⚠️ @${getCleanJid(sender)}، أنت قائد فريق *${userTeamName}*.`,
                    `📌 إذا خرجت، سيتم حذف الفريق بالكامل.`,
                    `📌 هل أنت متأكد؟ اكتب \`تأكيد\` خلال 30 ثانية.`
                ], msg, [sender]);

                const confirmHandler = async ({ messages }) => {
                    for (const m of messages) {
                        const from = m.key.participant || m.participant || m.key.remoteJid;
                        if (from !== sender) continue;
                        const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                        if (txt.trim().toLowerCase() === 'تأكيد') {
                            delete teams[userTeamName];
                            saveTeams(teams);

                            let leaderUser = loadUserData(sender);
                            if (leaderUser) {
                                leaderUser = sanitizeUser(leaderUser);
                                saveUserData(sender, leaderUser);
                            }

                            await sendMessage(sock, chatId, [
                                `🗑️ تم حذف فريق *${userTeamName}* بواسطة القائد @${getCleanJid(sender)}.`,
                                `📌 يمكنك إنشاء فريق جديد متى شئت.`
                            ], m, [sender]);
                            return;
                        } else {
                            await sendMessage(sock, chatId, [
                                `❌ تم إلغاء العملية.`
                            ], m, [sender]);
                            return;
                        }
                    }
                };
                sock.ev.on('messages.upsert', confirmHandler);
                setTimeout(() => {
                    sock.ev.off('messages.upsert', confirmHandler);
                }, 30000);
                return;
            } else {
        // عضو عادي يريد الخروج
                const existingRequest = activeLeaveRequests.get(chatId);
                if (existingRequest && existingRequest.member === sender && existingRequest.status === 'pending') {
                    await sendMessage(sock, chatId, [
                        `⏳ لديك طلب خروج معلق بالفعل. انتظر رد القائد.`
                    ], msg, [sender]);
                    return;
                }

                const leaderJid = teamData.leader;
                const requestId = Date.now().toString();

                const requestData = {
                    id: requestId,
                    member: sender,
                    leader: leaderJid,
                    teamName: userTeamName,
                    status: 'pending',
                    timestamp: Date.now()
                };

                activeLeaveRequests.set(chatId, requestData);

                await sendMessage(sock, chatId, [
                    `📨 @${getCleanJid(sender)} يطلب الخروج من فريق *${userTeamName}*.`,
                    ``,
                    `⚠️ *للقائد @${getCleanJid(leaderJid)}*:`,
                    `📌 اكتب \`موافق\` لقبول خروج العضو.`,
                    `📌 اكتب \`رفض\` لرفض خروج العضو.`,
                    ``,
                    `⏳ الطلب ينتهي بعد 5 دقائق.`
                ], msg, [sender, leaderJid]);

                const handler = async ({ messages }) => {
                    for (const m of messages) {
                        const from = m.key.participant || m.participant || m.key.remoteJid;
                        if (from === sock.user.id) continue;
                        if (m.key.remoteJid !== chatId) continue;

                        const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                        if (!txt.trim()) continue;
                        const content = txt.trim().toLowerCase();

                        const request = activeLeaveRequests.get(chatId);
                        if (!request || request.status !== 'pending') continue;

                        if (from !== request.leader) {
                            if (from === request.member) {
                                await sendMessage(sock, chatId, [
                                    `⏳ @${getCleanJid(from)}، انتظر رد القائد.`
                                ], m, [from, request.leader]);
                            }
                            continue;
                        }

                        if (content === 'موافق') {
                            const currentTeams = loadJSON(teamsPath);
                            const team = getTeam(request.teamName, currentTeams);
                            if (team) {
                                team.members = team.members.filter(m => m !== request.member);
                                saveTeams(currentTeams);
                            }

                            let memberUser = loadUserData(request.member);
                            if (memberUser) {
                                memberUser = sanitizeUser(memberUser);
                                saveUserData(request.member, memberUser);
                            }

                            activeLeaveRequests.delete(chatId);

                            await sendMessage(sock, chatId, [
                                `✅ @${getCleanJid(request.leader)} وافق على خروج @${getCleanJid(request.member)}.`,
                                ``,
                                `🚪 @${getCleanJid(request.member)} غادر فريق *${request.teamName}*.`,
                                `📌 يمكنه الانضمام لفريق آخر أو إنشاء فريق جديد.`
                            ], m, [request.leader, request.member]);
                            sock.ev.off('messages.upsert', handler);
                            return;
                        }

                        if (content === 'رفض') {
                            activeLeaveRequests.delete(chatId);

                            await sendMessage(sock, chatId, [
                                `❌ @${getCleanJid(request.leader)} رفض خروج @${getCleanJid(request.member)}.`,
                                ``,
                                `📌 @${getCleanJid(request.member)} لا يزال عضواً في فريق *${request.teamName}*.`
                            ], m, [request.leader, request.member]);
                            sock.ev.off('messages.upsert', handler);
                            return;
                        }
                    }
                };

                sock.ev.on('messages.upsert', handler);

                setTimeout(() => {
                    const request = activeLeaveRequests.get(chatId);
                    if (request && request.status === 'pending') {
                        activeLeaveRequests.delete(chatId);
                        sock.ev.off('messages.upsert', handler);
                        sendMessage(sock, chatId, [
                            `⏰ انتهت صلاحية طلب الخروج (5 دقائق).`,
                            `📌 أرسل طلباً جديداً إذا أردت.`
                        ], null, [request.member, request.leader]);
                    }
                }, 5 * 60 * 1000);
            }

        } catch (error) {
            console.error('✗ خطأ في أمر خروج:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};
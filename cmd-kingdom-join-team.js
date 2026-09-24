// انضمام.js - طلب الانضمام إلى فريق (يرسل طلباً للقائد، يوافق أو يرفض) - نسخة متوافقة مع نظام التخزين المنفصل
const fs = require('fs');
const path = require('path');

const teamsPath = path.join(__dirname, 'db-teams.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');

// ===== التأكد من وجود جميع الملفات =====
if (!fs.existsSync(MAIN_PATH)) fs.writeFileSync(MAIN_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(ACTIVE_PATH)) fs.writeFileSync(ACTIVE_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(teamsPath)) fs.writeFileSync(teamsPath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
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
    const active = loadJSON(ACTIVE_PATH)[jid] || {};

    return {
        level: main.level || 1,
        prosperity: main.prosperity || 0,
        lands: main.lands || 0,
        gold: main.gold || 0,
        name: main.name || `مملكة @${jid.split('@')[0]}`,
        owner: main.owner || jid,
        nameChangesUsed: main.nameChangesUsed || 0,
        lastActive: active.lastActive || Date.now()
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

    const active = loadJSON(ACTIVE_PATH);
    active[jid] = {
        lastActive: data.lastActive || Date.now()
    };
    saveJSON(ACTIVE_PATH, active);
}

function userExists(jid) {
    const main = loadJSON(MAIN_PATH);
    return !!main[jid];
}

// ========== دوال الفرق ==========
function loadTeams() { return loadJSON(teamsPath); }
function saveTeams(data) { saveJSON(teamsPath, data); }

function getTeam(teamName, teams) {
    return teams[teamName] || null;
}

function getTeamNameByMember(jid, teams) {
    for (const [teamName, teamData] of Object.entries(teams)) {
        if (teamData.leader === jid || (teamData.members && teamData.members.includes(jid))) {
            return teamName;
        }
    }
    return null;
}

function isPlayerInTeam(jid, teams) {
    return getTeamNameByMember(jid, teams) !== null;
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
    let msg = `📩 طـلـب انـضـمـام 📩\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// تخزين طلبات الانضمام النشطة
const activeJoinRequests = new Map();

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'انضمام',
    description: '📩 طلب الانضمام إلى فريق (يرسل طلباً للقائد، يوافق أو يرفض)',
    category: 'مملكة',
    usage: '.انضمام [اسم الفريق]',
    example: '.انضمام قلب الأسد',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/);

            if (args.length < 2) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}`,
                    `📌 استخدم: .انضمام [اسم الفريق]`,
                    `📝 مثال: .انضمام قلب الأسد`
                ], msg, [sender]);
                return;
            }

            const teamName = args.slice(1).join(' ').trim();
            if (!teamName) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، الرجاء كتابة اسم الفريق.`,
                    `📝 مثال: .انضمام قلب الأسد`
                ], msg, [sender]);
                return;
            }

            // تحميل البيانات
            const teams = loadTeams();

            // ===== التحقق من وجود مملكة للطالب =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    `📌 استخدم .لاعب جديد لتأسيس مملكتك.`
                ], msg, [sender]);
                return;
            }

            let user = loadUserData(sender);
            user = sanitizeUser(user);
            saveUserData(sender, user);

            // ===== التحقق من أن الطالب ليس في فريق =====
            if (isPlayerInTeam(sender, teams)) {
                await sendMessage(sock, chatId, [
                    `⚠️ @${sender.split('@')[0]}، أنت بالفعل عضو في فريق.`,
                    `📌 لا يمكنك طلب الانضمام لفريق آخر.`
                ], msg, [sender]);
                return;
            }

            // ===== التحقق من وجود الفريق المطلوب =====
            const teamData = getTeam(teamName, teams);
            if (!teamData) {
                await sendMessage(sock, chatId, [
                    `❌ لا يوجد فريق باسم "${teamName}".`,
                    `📌 تأكد من الاسم وحاول مرة أخرى.`
                ], msg, [sender]);
                return;
            }

            const leaderJid = teamData.leader;

            // ===== التحقق من وجود مملكة للقائد =====
            if (!userExists(leaderJid)) {
                await sendMessage(sock, chatId, [
                    `❌ قائد الفريق ليس لديه مملكة (خطأ في البيانات).`,
                    `📌 لا يمكن إكمال الطلب.`
                ], msg, [sender]);
                return;
            }

            let leaderUser = loadUserData(leaderJid);
            leaderUser = sanitizeUser(leaderUser);
            saveUserData(leaderJid, leaderUser);

            // ===== التحقق من وجود طلب سابق معلق =====
            for (const [key, request] of activeJoinRequests) {
                if (request.teamName === teamName && request.member === sender && request.status === 'pending') {
                    await sendMessage(sock, chatId, [
                        `⏳ لديك طلب انضمام معلق إلى فريق "${teamName}" بالفعل.`,
                        `📌 انتظر رد القائد.`
                    ], msg, [sender]);
                    return;
                }
            }

            // ===== إنشاء طلب جديد =====
            const requestId = Date.now().toString();
            const requestData = {
                id: requestId,
                teamName: teamName,
                member: sender,
                leader: leaderJid,
                status: 'pending',
                timestamp: Date.now()
            };

            activeJoinRequests.set(requestId, requestData);

            // ===== إرسال طلب للقائد =====
            await sendMessage(sock, chatId, [
                `📨 @${sender.split('@')[0]} يطلب الانضمام إلى فريق *${teamName}*.`,
                ``,
                `👑 القائد: @${leaderJid.split('@')[0]}`,
                `👥 عدد الأعضاء الحالي: ${teamData.members.length + 1}`,
                ``,
                `⚠️ *للقائد @${leaderJid.split('@')[0]}*:`,
                `📌 اكتب \`موافق\` لقبول الطلب.`,
                `📌 اكتب \`رفض\` لرفض الطلب.`,
                ``,
                `⏳ الطلب ينتهي بعد 5 دقائق.`
            ], msg, [sender, leaderJid]);

            // ===== مراقبة رد القائد =====
            const handler = async ({ messages }) => {
                for (const m of messages) {
                    const from = m.key.participant || m.participant || m.key.remoteJid;
                    if (from === sock.user.id) continue;
                    if (m.key.remoteJid !== chatId) continue;

                    const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                    if (!txt.trim()) continue;
                    const content = txt.trim().toLowerCase();

                    const request = activeJoinRequests.get(requestId);
                    if (!request || request.status !== 'pending') continue;

                    // التأكد أن المرسل هو القائد
                    if (from !== request.leader) {
                        if (from === request.member) {
                            await sendMessage(sock, chatId, [
                                `⏳ @${from.split('@')[0]}، انتظر رد القائد @${request.leader.split('@')[0]}.`
                            ], m, [from, request.leader]);
                        }
                        continue;
                    }

                    // قبول الطلب
                    if (content === 'موافق') {
                        // إضافة العضو إلى الفريق
                        const currentTeams = loadJSON(teamsPath);
                        const team = getTeam(request.teamName, currentTeams);
                        if (team) {
                            if (!team.members.includes(request.member)) {
                                team.members.push(request.member);
                                saveTeams(currentTeams);
                            }
                        }

                        // تحديث lastActive للعضو
                        let memberUser = loadUserData(request.member);
                        if (memberUser) {
                            memberUser = sanitizeUser(memberUser);
                            saveUserData(request.member, memberUser);
                        }

                        // حذف الطلب
                        activeJoinRequests.delete(requestId);

                        await sendMessage(sock, chatId, [
                            `✅ @${request.leader.split('@')[0]} وافق على طلب @${request.member.split('@')[0]}.`,
                            ``,
                            `🎉 انضم @${request.member.split('@')[0]} إلى فريق *${request.teamName}*.`,
                            `👥 عدد الأعضاء الآن: ${team ? team.members.length + 1 : 'غير معروف'}`,
                            ``,
                            `📌 استخدم .فريقي لعرض معلومات فريقك.`
                        ], m, [request.leader, request.member]);
                        sock.ev.off('messages.upsert', handler);
                        return;
                    }

                    // رفض الطلب
                    if (content === 'رفض') {
                        // حذف الطلب
                        activeJoinRequests.delete(requestId);

                        await sendMessage(sock, chatId, [
                            `❌ @${request.leader.split('@')[0]} رفض طلب @${request.member.split('@')[0]}.`,
                            ``,
                            `📌 يمكن للعضو @${request.member.split('@')[0]} إرسال طلب جديد لاحقاً.`
                        ], m, [request.leader, request.member]);
                        sock.ev.off('messages.upsert', handler);
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', handler);

            // انتهاء المهلة
            setTimeout(() => {
                const request = activeJoinRequests.get(requestId);
                if (request && request.status === 'pending') {
                    activeJoinRequests.delete(requestId);
                    sock.ev.off('messages.upsert', handler);
                    sendMessage(sock, chatId, [
                        `⏰ انتهت صلاحية طلب الانضمام (5 دقائق).`,
                        `📌 أرسل طلباً جديداً إذا أردت.`
                    ], null, [request.member, request.leader]);
                }
            }, 5 * 60 * 1000);

        } catch (error) {
            console.error('✗ خطأ في أمر انضمام:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};
// معاهدة.js - نظام المعاهدات بين الممالك (سلام، كسر المعاهدة يعاقب بخسارة كل شيء، إلغاء المعاهدة بموافقة الطرفين) - نسخة متوافقة مع نظام التخزين المنفصل
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const bankPath = path.join(__dirname, 'db-bank.json');
const treatiesPath = path.join(__dirname, 'db-treaties.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const RESOURCES_PATH = path.join(dataDir, 'kd-resources.json');
const SOLDIERS_PATH = path.join(dataDir, 'kd-soldiers.json');
const WEAPONS_PATH = path.join(dataDir, 'kd-weapons.json');
const ACCESSORIES_PATH = path.join(dataDir, 'kd-accessories.json');
const POTIONS_PATH = path.join(dataDir, 'kd-potions.json');
const SOULBOOK_PATH = path.join(dataDir, 'kd-soulbook.json');
const COMPANION_PATH = path.join(dataDir, 'kd-companion.json');
const STATS_PATH = path.join(dataDir, 'kd-stats.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');

// ===== التأكد من وجود جميع الملفات =====
const allPaths = [MAIN_PATH, RESOURCES_PATH, SOLDIERS_PATH, WEAPONS_PATH, ACCESSORIES_PATH, POTIONS_PATH, SOULBOOK_PATH, COMPANION_PATH, STATS_PATH, ACTIVE_PATH];
for (const p of allPaths) {
    if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(bankPath)) fs.writeFileSync(bankPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(treatiesPath)) fs.writeFileSync(treatiesPath, JSON.stringify({}, null, 2));

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
    const resources = loadJSON(RESOURCES_PATH)[jid] || {};
    const soldiers = loadJSON(SOLDIERS_PATH)[jid] || {};
    const weapons = loadJSON(WEAPONS_PATH)[jid] || {};
    const accessories = loadJSON(ACCESSORIES_PATH)[jid] || {};
    const potions = loadJSON(POTIONS_PATH)[jid] || {};
    const soulBook = loadJSON(SOULBOOK_PATH)[jid] || {};
    const companion = loadJSON(COMPANION_PATH)[jid] || null;
    const stats = loadJSON(STATS_PATH)[jid] || {};
    const active = loadJSON(ACTIVE_PATH)[jid] || {};

    return {
        level: main.level || 1,
        prosperity: main.prosperity || 0,
        lands: main.lands || 0,
        gold: main.gold || 0,
        name: main.name || `مملكة @${jid.split('@')[0]}`,
        owner: main.owner || jid,
        nameChangesUsed: main.nameChangesUsed || 0,
        resources: resources,
        soldiers: soldiers,
        weapons: weapons,
        accessories: accessories,
        potions: potions,
        soulBook: soulBook,
        companion: companion,
        pvpWins: stats.pvpWins || 0,
        pvpLosses: stats.pvpLosses || 0,
        monstersDefeated: stats.monstersDefeated || 0,
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

    const resources = loadJSON(RESOURCES_PATH);
    resources[jid] = data.resources || { wood: 0, stone: 0, iron: 0 };
    saveJSON(RESOURCES_PATH, resources);

    const soldiers = loadJSON(SOLDIERS_PATH);
    soldiers[jid] = data.soldiers || {};
    saveJSON(SOLDIERS_PATH, soldiers);

    const weapons = loadJSON(WEAPONS_PATH);
    weapons[jid] = data.weapons || {};
    saveJSON(WEAPONS_PATH, weapons);

    const accessories = loadJSON(ACCESSORIES_PATH);
    accessories[jid] = data.accessories || {};
    saveJSON(ACCESSORIES_PATH, accessories);

    const potions = loadJSON(POTIONS_PATH);
    potions[jid] = data.potions || {};
    saveJSON(POTIONS_PATH, potions);

    const soulBook = loadJSON(SOULBOOK_PATH);
    soulBook[jid] = data.soulBook || { pages: 0, spirits: [] };
    saveJSON(SOULBOOK_PATH, soulBook);

    const companion = loadJSON(COMPANION_PATH);
    companion[jid] = data.companion || null;
    saveJSON(COMPANION_PATH, companion);

    const stats = loadJSON(STATS_PATH);
    stats[jid] = {
        pvpWins: data.pvpWins || 0,
        pvpLosses: data.pvpLosses || 0,
        monstersDefeated: data.monstersDefeated || 0
    };
    saveJSON(STATS_PATH, stats);

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

// ========== دوال المعاهدات ==========
function loadTreaties() { return loadJSON(treatiesPath); }
function saveTreaties(data) { saveJSON(treatiesPath, data); }

function getTreaty(jid1, jid2, treaties) {
    for (const [key, treaty] of Object.entries(treaties)) {
        if ((treaty.party1 === jid1 && treaty.party2 === jid2) ||
            (treaty.party1 === jid2 && treaty.party2 === jid1)) {
            return treaty;
        }
    }
    return null;
}

// ========== دالة نقل كل الممتلكات (عقوبة كسر المعاهدة) ==========
function transferAllAssets(loserJid, winnerJid) {
    const points = loadJSON(pointsPath);
    const bank = loadJSON(bankPath);

    // تحميل بيانات الخاسر والفائز من النظام المنفصل
    const loser = loadUserData(loserJid);
    const winner = loadUserData(winnerJid);

    if (!loser || !winner) return { success: false, reason: 'أحد الطرفين ليس لديه مملكة' };

    // 1. نقل النقاط
    const loserPoints = points[loserJid] || 0;
    points[loserJid] = 0;
    points[winnerJid] = (points[winnerJid] || 0) + loserPoints;

    // 2. نقل رصيد البنك
    const loserBank = bank[loserJid] || { deposit: 0 };
    const loserDeposit = loserBank.deposit || 0;
    if (loserDeposit > 0) {
        bank[loserJid] = { deposit: 0, lastInterest: Date.now() };
        bank[winnerJid] = bank[winnerJid] || { deposit: 0, lastInterest: Date.now() };
        bank[winnerJid].deposit = (bank[winnerJid].deposit || 0) + loserDeposit;
    }

    // 3. نقل الموارد
    const resources = ['wood', 'stone', 'iron'];
    for (const res of resources) {
        const loserRes = loser.resources?.[res] || 0;
        if (loserRes > 0) {
            loser.resources[res] = 0;
            if (!winner.resources) winner.resources = { wood: 0, stone: 0, iron: 0 };
            winner.resources[res] = (winner.resources[res] || 0) + loserRes;
        }
    }

    // 4. نقل الأسلحة (بما فيها الدروع)
    const weaponKeys = ['ironSword', 'goldenShield', 'legendaryBow', 'lightningSword', 'giantHammer',
        'deathBow', 'destructionAxe', 'heroSword', 'timeBow', 'eternalBlade',
        'fireShield', 'godShield'];
    for (const key of weaponKeys) {
        const count = loser.weapons?.[key] || 0;
        if (count > 0) {
            loser.weapons[key] = 0;
            if (!winner.weapons) winner.weapons = {};
            winner.weapons[key] = (winner.weapons[key] || 0) + count;
        }
    }

    // 5. نقل الجنود
    const soldierKeys = ['normal', 'knight', 'archer', 'eliteGuard', 'dragonSpearman', 'legendaryCommander'];
    for (const key of soldierKeys) {
        const count = loser.soldiers?.[key] || 0;
        if (count > 0) {
            loser.soldiers[key] = 0;
            if (!winner.soldiers) winner.soldiers = {};
            winner.soldiers[key] = (winner.soldiers[key] || 0) + count;
        }
    }

    // 6. نقل الإكسسوارات
    const accessoryKeys = ['powerRing', 'protectionRing', 'kingsCrown', 'shadowMask', 'heroMask'];
    for (const key of accessoryKeys) {
        const count = loser.accessories?.[key] || 0;
        if (count > 0) {
            loser.accessories[key] = 0;
            if (!winner.accessories) winner.accessories = {};
            winner.accessories[key] = (winner.accessories[key] || 0) + count;
        }
    }

    // 7. نقل الجرعات
    const potionKeys = ['smallHeal', 'largeHeal', 'energyPotion', 'craftedHeal'];
    for (const key of potionKeys) {
        const count = loser.potions?.[key] || 0;
        if (count > 0) {
            loser.potions[key] = 0;
            if (!winner.potions) winner.potions = {};
            winner.potions[key] = (winner.potions[key] || 0) + count;
        }
    }

    // 8. نقل الرفيق
    if (loser.companion) {
        winner.companion = loser.companion;
        loser.companion = null;
    }

    // 9. نقل صفحات الروح والأرواح
    const loserPages = loser.soulBook?.pages || 0;
    const loserSpirits = loser.soulBook?.spirits || [];
    if (loserPages > 0 || loserSpirits.length > 0) {
        if (!winner.soulBook) winner.soulBook = { pages: 0, spirits: [] };
        winner.soulBook.pages = (winner.soulBook.pages || 0) + loserPages;
        winner.soulBook.spirits = [...(winner.soulBook.spirits || []), ...loserSpirits];
        loser.soulBook.pages = 0;
        loser.soulBook.spirits = [];
    }

    // حفظ التغييرات
    saveUserData(loserJid, loser);
    saveUserData(winnerJid, winner);
    saveJSON(pointsPath, points);
    saveJSON(bankPath, bank);

    return {
        success: true,
        transferred: {
            points: loserPoints,
            bank: loserDeposit,
            resources: { wood: loser.resources?.wood || 0, stone: loser.resources?.stone || 0, iron: loser.resources?.iron || 0 },
            weapons: weaponKeys.filter(k => loser.weapons?.[k] > 0).length,
            soldiers: soldierKeys.filter(k => loser.soldiers?.[k] > 0).length,
            accessories: accessoryKeys.filter(k => loser.accessories?.[k] > 0).length,
            potions: potionKeys.filter(k => loser.potions?.[k] > 0).length,
            companion: !!loser.companion,
            soulPages: loserPages
        }
    };
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🤝 الـمـعـاهـدة 🤝\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== دوال مساعدة ==========
function extractMentions(msg) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
    if (contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
        return contextInfo.mentionedJid;
    }
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const mentionMatch = text.match(/@(\d+)/);
    if (mentionMatch) {
        return [`${mentionMatch[1]}@s.whatsapp.net`];
    }
    if (contextInfo.participant) {
        return [contextInfo.participant];
    }
    return [];
}

function getMessageText(msg) {
    try {
        if (msg.message?.conversation) return msg.message.conversation;
        if (msg.message?.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
        if (msg.message?.imageMessage?.caption) return msg.message.imageMessage.caption;
        if (msg.message?.videoMessage?.caption) return msg.message.videoMessage.caption;
        if (msg.message?.documentMessage?.caption) return msg.message.documentMessage.caption;
        if (msg.message?.buttonsResponseMessage?.selectedDisplayText)
            return msg.message.buttonsResponseMessage.selectedDisplayText;
        if (msg.message?.listResponseMessage?.singleSelectReply?.selectedDisplayText)
            return msg.message.listResponseMessage.singleSelectReply.selectedDisplayText;
        for (const key of Object.keys(msg.message || {})) {
            if (msg.message[key]?.text) return msg.message[key].text;
            if (msg.message[key]?.caption) return msg.message[key].caption;
        }
        return '';
    } catch {
        return '';
    }
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'معاهدة',
    description: '🤝 إنشاء معاهدة سلام مع مملكة أخرى أو إلغاء معاهدة قائمة (كسر المعاهدة يعاقب بخسارة كل الممتلكات)',
    category: 'مملكة',
    usage: '.معاهدة @منشن (إنشاء) | .معاهدة حذف @منشن (إلغاء)',
    example: '.معاهدة @منشن  أو  .معاهدة حذف @منشن',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            const fullText = getMessageText(msg);
            const args = fullText.trim().split(/\s+/);
            const subCommand = args.length > 1 ? args[1].toLowerCase() : '';

            // ===== استخراج الهدف =====
            const mentioned = extractMentions(msg);
            const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant || null;
            let target = null;

            if (mentioned.length > 0) {
                target = mentioned[0];
            } else if (quotedSender) {
                target = quotedSender;
            } else {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}`,
                    `📌 يجب منشن الشخص أو الرد على رسالته.`,
                    `📝 مثال: .معاهدة @منشن  أو  .معاهدة حذف @منشن`
                ], msg, [sender]);
                return;
            }

            if (target === sender) {
                await sendMessage(sock, chatId, [
                    `❌ لا يمكنك عمل معاهدة مع نفسك!`
                ], msg, [sender]);
                return;
            }

            // ===== تحميل البيانات =====
            const treaties = loadTreaties();

            // ===== التحقق من وجود مملكة للمرسل والهدف =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    `📌 استخدم .لاعب جديد لتأسيس مملكتك.`
                ], msg, [sender]);
                return;
            }
            if (!userExists(target)) {
                await sendMessage(sock, chatId, [
                    `❌ @${target.split('@')[0]}، ليس لديه مملكة.`,
                    `📌 لا يمكن عمل معاهدة مع شخص ليس لديه مملكة.`
                ], msg, [target]);
                return;
            }

            // تحديث بيانات المستخدمين
            let senderUser = loadUserData(sender);
            let targetUser = loadUserData(target);
            senderUser.lastActive = Date.now();
            targetUser.lastActive = Date.now();
            saveUserData(sender, senderUser);
            saveUserData(target, targetUser);

            // ===== التحقق من وجود معاهدة حالية =====
            const existing = getTreaty(sender, target, treaties);

            // ===== حالة: حذف معاهدة =====
            if (subCommand === 'حذف' || subCommand === 'delete' || subCommand === 'إلغاء') {
                if (!existing || existing.status !== 'accepted') {
                    await sendMessage(sock, chatId, [
                        `❌ لا توجد معاهدة قائمة بينك وبين @${target.split('@')[0]}.`
                    ], msg, [sender, target]);
                    return;
                }

                await sendMessage(sock, chatId, [
                    `📨 @${sender.split('@')[0]} يطلب إلغاء المعاهدة مع @${target.split('@')[0]}`,
                    ``,
                    `📜 *المعاهدة الحالية:*`,
                    `📅 تاريخ الإنشاء: ${new Date(existing.createdAt).toLocaleString()}`,
                    ``,
                    `⚠️ *للمستلم:* اكتب \`موافق\` لقبول إلغاء المعاهدة`,
                    `⚠️ *للمستلم:* اكتب \`رفض\` لرفض الإلغاء`,
                    ``,
                    `⏳ الطلب ينتهي بعد 5 دقائق`
                ], msg, [sender, target]);

                const treatyId = existing.id;
                const handler = async ({ messages }) => {
                    for (const m of messages) {
                        const senderMsg = m.key.participant || m.participant || m.key.remoteJid;
                        if (senderMsg === sock.user.id) continue;
                        if (m.key.remoteJid !== chatId) continue;

                        const txt = getMessageText(m);
                        if (!txt) continue;
                        const content = txt.trim().toLowerCase();

                        if (senderMsg !== target) {
                            if (senderMsg === sender) {
                                await sendMessage(sock, chatId, [
                                    `⏳ @${senderMsg.split('@')[0]}، انتظر رد @${target.split('@')[0]}.`
                                ], m, [senderMsg, target]);
                            }
                            continue;
                        }

                        const currentTreaties = loadTreaties();
                        const currentTreaty = currentTreaties[treatyId];
                        if (!currentTreaty || currentTreaty.status !== 'accepted') {
                            sock.ev.off('messages.upsert', handler);
                            return;
                        }

                        if (content === 'موافق') {
                            delete currentTreaties[treatyId];
                            saveTreaties(currentTreaties);
                            sock.ev.off('messages.upsert', handler);

                            await sendMessage(sock, chatId, [
                                `✅ @${target.split('@')[0]} وافق على إلغاء المعاهدة!`,
                                ``,
                                `🤝 تم إلغاء المعاهدة بين @${sender.split('@')[0]} و @${target.split('@')[0]}`,
                                ``,
                                `📌 الآن يمكن لكل طرف مهاجمة الآخر دون عقوبة.`
                            ], m, [sender, target]);
                            return;
                        }

                        if (content === 'رفض') {
                            sock.ev.off('messages.upsert', handler);
                            await sendMessage(sock, chatId, [
                                `❌ @${target.split('@')[0]} رفض إلغاء المعاهدة.`,
                                ``,
                                `📌 المعاهدة لا تزال سارية المفعول.`
                            ], m, [sender, target]);
                            return;
                        }
                    }
                };

                sock.ev.on('messages.upsert', handler);

                setTimeout(() => {
                    const currentTreaties = loadTreaties();
                    if (currentTreaties[treatyId]) {
                        sock.ev.off('messages.upsert', handler);
                        sendMessage(sock, chatId, [
                            `⏰ انتهت صلاحية طلب إلغاء المعاهدة (5 دقائق).`,
                            `📌 المعاهدة لا تزال سارية.`
                        ], null, [sender, target]);
                    }
                }, 5 * 60 * 1000);

                return;
            }

        // ===== حالة: إنشاء معاهدة جديدة =====
            if (existing && existing.status === 'accepted') {
                await sendMessage(sock, chatId, [
                    `⚠️ هناك معاهدة قائمة بينكما بالفعل.`,
                    `📌 تاريخ الإنشاء: ${new Date(existing.createdAt).toLocaleString()}`,
                    `📌 استخدم .معاهدة حذف @منشن لإلغائها.`
                ], msg, [sender, target]);
                return;
            }

            if (existing && existing.status === 'pending') {
                await sendMessage(sock, chatId, [
                    `⏳ هناك طلب معاهدة معلق بينكما.`,
                    `📌 انتظر رد @${target.split('@')[0]}.`
                ], msg, [sender, target]);
                return;
            }

            const treatyId = Date.now().toString();
            const treatyData = {
                id: treatyId,
                party1: sender,
                party2: target,
                status: 'pending',
                createdAt: Date.now(),
                expiresAt: Date.now() + (5 * 60 * 1000)
            };

            treaties[treatyId] = treatyData;
            saveTreaties(treaties);

            await sendMessage(sock, chatId, [
                `📨 @${sender.split('@')[0]} يطلب عقد معاهدة سلام مع @${target.split('@')[0]}`,
                ``,
                `📜 *بنود المعاهدة:*`,
                `• لا يجوز لأي من الطرفين مهاجمة الآخر.`,
                `• من يهاجم الآخر يُعتبر كاسراً للمعاهدة.`,
                `• عقوبة كسر المعاهدة: خسارة *جميع* الممتلكات (نقاط، موارد، أسلحة، جنود، إكسسوارات، جرعات، رفيق، دروع، رصيد البنك)`,
                `  وتنتقل جميعها للطرف الآخر.`,
                ``,
                `⚠️ *للمستلم:* اكتب \`موافق\` لقبول المعاهدة`,
                `⚠️ *للمستلم:* اكتب \`رفض\` لرفض المعاهدة`,
                ``,
                `⏳ الطلب ينتهي بعد 5 دقائق`
            ], msg, [sender, target]);

            const handler = async ({ messages }) => {
                for (const m of messages) {
                    const senderMsg = m.key.participant || m.participant || m.key.remoteJid;
                    if (senderMsg === sock.user.id) continue;
                    if (m.key.remoteJid !== chatId) continue;

                    const txt = getMessageText(m);
                    if (!txt) continue;
                    const content = txt.trim().toLowerCase();

                    if (senderMsg !== target) {
                        if (senderMsg === sender) {
                            await sendMessage(sock, chatId, [
                                `⏳ @${senderMsg.split('@')[0]}، انتظر رد @${target.split('@')[0]}.`
                            ], m, [senderMsg, target]);
                        }
                        continue;
                    }

                    const currentTreaties = loadTreaties();
                    const currentTreaty = currentTreaties[treatyId];
                    if (!currentTreaty || currentTreaty.status !== 'pending') {
                        sock.ev.off('messages.upsert', handler);
                        return;
                    }

                    if (content === 'موافق') {
                        currentTreaty.status = 'accepted';
                        currentTreaty.acceptedAt = Date.now();
                        saveTreaties(currentTreaties);

                        sock.ev.off('messages.upsert', handler);

                        await sendMessage(sock, chatId, [
                            `✅ @${target.split('@')[0]} وافق على المعاهدة!`,
                            ``,
                            `🤝 تم عقد معاهدة سلام بين @${sender.split('@')[0]} و @${target.split('@')[0]}`,
                            ``,
                            `📜 *البنود سارية المفعول:*`,
                            `• أي هجوم من أحد الطرفين على الآخر يُعتبر كسراً للمعاهدة.`,
                            `• العقوبة: خسارة *جميع* الممتلكات لصالح الطرف الآخر.`,
                            ``,
                            `🛡️ عِش في سلام، أو ادفع الثمن!`
                        ], m, [sender, target]);
                        return;
                    }

                    if (content === 'رفض') {
                        currentTreaty.status = 'rejected';
                        saveTreaties(currentTreaties);
                        sock.ev.off('messages.upsert', handler);

                        await sendMessage(sock, chatId, [
                            `❌ @${target.split('@')[0]} رفض المعاهدة.`,
                            ``,
                            `📌 يمكنك المحاولة مرة أخرى لاحقاً.`
                        ], m, [sender, target]);
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', handler);

            setTimeout(() => {
                const currentTreaties = loadTreaties();
                const currentTreaty = currentTreaties[treatyId];
                if (currentTreaty && currentTreaty.status === 'pending') {
                    currentTreaty.status = 'expired';
                    saveTreaties(currentTreaties);
                    sock.ev.off('messages.upsert', handler);
                    sendMessage(sock, chatId, [
                        `⏰ انتهت صلاحية طلب المعاهدة (5 دقائق).`,
                        `📌 أرسل طلباً جديداً إذا أردت.`
                    ], null, [sender, target]);
                }
            }, 5 * 60 * 1000);

        } catch (error) {
            console.error('✗ خطأ في أمر معاهدة:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                `❌ حدث خطأ أثناء تنفيذ الأمر.`,
                `📌 حاول مرة أخرى لاحقاً.`
            ], msg);
        }
    }
};
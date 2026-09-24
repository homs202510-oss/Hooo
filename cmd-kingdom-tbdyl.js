// تبديل.js - تبادل المنتجات بين اللاعبين (مع موافق/رفض كرسائل) - نسخة متوافقة مع نظام التخزين المنفصل
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const tradesPath = path.join(__dirname, 'db-trades.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const SOLDIERS_PATH = path.join(dataDir, 'kd-soldiers.json');
const WEAPONS_PATH = path.join(dataDir, 'kd-weapons.json');
const ACCESSORIES_PATH = path.join(dataDir, 'kd-accessories.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');

// ===== التأكد من وجود جميع الملفات =====
const allPaths = [MAIN_PATH, SOLDIERS_PATH, WEAPONS_PATH, ACCESSORIES_PATH, ACTIVE_PATH];
for (const p of allPaths) {
    if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(tradesPath)) fs.writeFileSync(tradesPath, JSON.stringify({}, null, 2));

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
    const soldiers = loadJSON(SOLDIERS_PATH)[jid] || {};
    const weapons = loadJSON(WEAPONS_PATH)[jid] || {};
    const accessories = loadJSON(ACCESSORIES_PATH)[jid] || {};
    const active = loadJSON(ACTIVE_PATH)[jid] || {};

    return {
        level: main.level || 1,
        prosperity: main.prosperity || 0,
        lands: main.lands || 0,
        gold: main.gold || 0,
        name: main.name || `مملكة @${jid.split('@')[0]}`,
        owner: main.owner || jid,
        nameChangesUsed: main.nameChangesUsed || 0,
        soldiers: soldiers,
        weapons: weapons,
        accessories: accessories,
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

    const soldiers = loadJSON(SOLDIERS_PATH);
    soldiers[jid] = data.soldiers || {};
    saveJSON(SOLDIERS_PATH, soldiers);

    const weapons = loadJSON(WEAPONS_PATH);
    weapons[jid] = data.weapons || {};
    saveJSON(WEAPONS_PATH, weapons);

    const accessories = loadJSON(ACCESSORIES_PATH);
    accessories[jid] = data.accessories || {};
    saveJSON(ACCESSORIES_PATH, accessories);

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

// ========== دالة تصحيح بيانات المستخدم (شاملة) ==========
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
    if (user.upgradeCountToday === undefined || user.upgradeCountToday === null) user.upgradeCountToday = 0;
    if (user.lastUpgradeReset === undefined || user.lastUpgradeReset === null) user.lastUpgradeReset = 0;
    if (user.upgradeRestStage === undefined || user.upgradeRestStage === null) user.upgradeRestStage = 0;
    if (user.upgradeRestStartTime === undefined || user.upgradeRestStartTime === null) user.upgradeRestStartTime = 0;
    if (user.upgradeCountSinceRest === undefined || user.upgradeCountSinceRest === null) user.upgradeCountSinceRest = 0;
    if (user.lastDaily === undefined || user.lastDaily === null) user.lastDaily = 0;
    if (user.lastAttack === undefined || user.lastAttack === null) user.lastAttack = 0;
    if (user.attacksToday === undefined || user.attacksToday === null) user.attacksToday = 0;
    if (user.lastAttackReset === undefined || user.lastAttackReset === null) user.lastAttackReset = 0;
    if (user.attackRestStage === undefined || user.attackRestStage === null) user.attackRestStage = 0;
    if (user.attackRestStartTime === undefined || user.attackRestStartTime === null) user.attackRestStartTime = 0;
    if (user.attackCountSinceRest === undefined || user.attackCountSinceRest === null) user.attackCountSinceRest = 0;
    if (user.lastMonsterFight === undefined || user.lastMonsterFight === null) user.lastMonsterFight = 0;
    if (user.monsterFightCount === undefined || user.monsterFightCount === null) user.monsterFightCount = 0;
    if (user.restStage === undefined || user.restStage === null) user.restStage = 0;
    if (user.restStartTime === undefined || user.restStartTime === null) user.restStartTime = 0;
    user.lastActive = Date.now();
    return user;
}

// ========== قائمة المنتجات ==========
const fullProductsList = [
    // أسلحة
    { id: 1, name: 'سيف حديدي', type: 'weapon', key: 'ironSword', cost: 150 },
    { id: 2, name: 'درع ذهبي', type: 'weapon', key: 'goldenShield', cost: 250 },
    { id: 3, name: 'قوس أسطوري', type: 'weapon', key: 'legendaryBow', cost: 300 },
    { id: 4, name: 'سيف البرق', type: 'weapon', key: 'lightningSword', cost: 400 },
    { id: 5, name: 'مطرقة العمالقة', type: 'weapon', key: 'giantHammer', cost: 550 },
    { id: 6, name: 'قوس الموت', type: 'weapon', key: 'deathBow', cost: 700 },
    { id: 7, name: 'فأس الدمار', type: 'weapon', key: 'destructionAxe', cost: 900 },
    { id: 8, name: 'سيف الأبطال', type: 'weapon', key: 'heroSword', cost: 500 },
    { id: 9, name: 'قوس الزمن', type: 'weapon', key: 'timeBow', cost: 850 },
    { id: 10, name: 'نصل الأبدية', type: 'weapon', key: 'eternalBlade', cost: 1500 },
    { id: 11, name: 'درع النار', type: 'weapon', key: 'fireShield', cost: 450 },
    { id: 12, name: 'درع ملك', type: 'weapon', key: 'godShield', cost: 800 },
    // جنود
    { id: 13, name: 'جندي عادي', type: 'soldier', key: 'normal', cost: 30 },
    { id: 14, name: 'فارس', type: 'soldier', key: 'knight', cost: 80 },
    { id: 15, name: 'رامٍ', type: 'soldier', key: 'archer', cost: 50 },
    { id: 16, name: 'حارس النخبة', type: 'soldier', key: 'eliteGuard', cost: 150 },
    { id: 17, name: 'منشق التنين', type: 'soldier', key: 'dragonSpearman', cost: 300 },
    { id: 18, name: 'قائد أسطوري', type: 'soldier', key: 'legendaryCommander', cost: 600 },
    // إكسسوارات
    { id: 34, name: 'خاتم القوة', type: 'accessory', key: 'powerRing', cost: 200 },
    { id: 35, name: 'خاتم الحماية', type: 'accessory', key: 'protectionRing', cost: 200 },
    { id: 36, name: 'تاج الملوك', type: 'accessory', key: 'kingsCrown', cost: 900 },
    { id: 37, name: 'قناع الظل', type: 'accessory', key: 'shadowMask', cost: 400 },
    { id: 38, name: 'قناع البطل', type: 'accessory', key: 'heroMask', cost: 700 }
];

// ========== دالة البحث عن المنتج ==========
function findProduct(searchText) {
    const searchLower = searchText.toLowerCase().trim();
    
    const id = parseInt(searchText);
    if (!isNaN(id) && id > 0) {
        const product = fullProductsList.find(p => p.id === id);
        if (product) return product;
    }
    
    let product = fullProductsList.find(p => p.name.toLowerCase() === searchLower);
    if (product) return product;
    
    product = fullProductsList.find(p => p.name.toLowerCase().includes(searchLower));
    if (product) return product;
    
    return null;
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🔄 تبادل 🔄\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== دالة تنظيف رقم الجوال ==========
function cleanPhoneNumber(number) {
    let clean = number.toString()
        .replace(/@s\.whatsapp\.net/g, '')
        .replace(/@g\.us/g, '')
        .replace(/\+/g, '')
        .replace(/[^0-9]/g, '');
    if (clean.startsWith('00')) clean = clean.substring(2);
    if (clean.startsWith('0')) clean = clean.substring(1);
    return clean;
}

// ========== دالة استخراج المنشن ==========
function extractMentions(msg) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
    const mentioned = [];
    
    if (contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
        for (const jid of contextInfo.mentionedJid) {
            mentioned.push(jid);
        }
    }
    
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const mentionMatches = text.match(/@(\d+)/g);
    if (mentionMatches) {
        for (const match of mentionMatches) {
            const num = match.replace('@', '');
            mentioned.push(`${num}@s.whatsapp.net`);
        }
    }
    
    if (contextInfo.participant) {
        mentioned.push(contextInfo.participant);
    }
    
    return mentioned;
}

// ========== دالة استخراج اسم المنتج والعدد والهدف ==========
function extractProductAndQuantity(args, mentioned, quotedSender) {
    let cleanArgs = [];
    let target = quotedSender || null;
    let targetFound = false;
    
    if (mentioned && mentioned.length > 0) {
        for (const m of mentioned) {
            if (m.includes('@')) {
                target = m;
                targetFound = true;
                break;
            }
        }
    }
    
    for (const arg of args) {
        if (arg.includes('@')) continue;
        if (target && targetFound) {
            const targetNum = target.split('@')[0];
            if (arg.includes(targetNum) || cleanPhoneNumber(arg) === cleanPhoneNumber(targetNum)) {
                continue;
            }
        }
        cleanArgs.push(arg);
    }

    let productName = '';
    let quantity = 1;
    
    if (cleanArgs.length >= 2) {
        const lastArg = cleanArgs[cleanArgs.length - 1];
        if (!isNaN(parseInt(lastArg)) && parseInt(lastArg) > 0) {
            quantity = parseInt(lastArg);
            productName = cleanArgs.slice(1, -1).join(' ');
        } else {
            productName = cleanArgs.slice(1).join(' ');
        }
    }

    return { productName, quantity, target };
}

const activeTrades = new Map();

module.exports = {
    command: 'تبديل',
    description: '🔄 تبادل المنتجات مع لاعب آخر',
    category: 'مملكة',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/);

            if (args.length < 2) {
                await sendMessage(sock, chatId, [
                    `⚠️ @${sender.split('@')[0]}`,
                    `📌 استخدم: .تبديل [اسم المنتج] [العدد] @منشن`,
                    `📝 مثال: .تبديل درع ذهبي 2 @منشن`,
                    `📝 مثال: .تبديل سيف 1 (رد على رسالة الشخص)`
                ], msg, [sender]);
                return;
            }

            const mentioned = extractMentions(msg);
            const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant || null;
            const { productName, quantity, target: extractedTarget } = extractProductAndQuantity(args, mentioned, quotedSender);
            
            let target = extractedTarget;

            if (!target) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، يجب منشن الشخص أو الرد على رسالته.`,
                    `📌 مثال: .تبديل درع ذهبي 2 @منشن`
                ], msg, [sender]);
                return;
            }

            if (!target.includes('@')) {
                target = `${target}@s.whatsapp.net`;
            }

            if (target === sender) {
                await sendMessage(sock, chatId, [
                    `❌ لا يمكنك التبديل مع نفسك!`
                ], msg, [sender]);
                return;
            }

            if (!productName) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، يجب تحديد اسم المنتج.`,
                    `📌 مثال: .تبديل درع ذهبي 2 @منشن`
                ], msg, [sender]);
                return;
            }

            const product = findProduct(productName);
            if (!product) {
                await sendMessage(sock, chatId, [
                    `❌ لا يوجد منتج باسم "${productName}".`,
                    `📌 استخدم .متجر لعرض المنتجات المتاحة.`
                ], msg, [sender]);
                return;
            }

            // تحميل البيانات
            const trades = loadJSON(tradesPath);
            
            // ===== التحقق من وجود مملكة للمرسل والمستلم =====
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
                    `📌 يجب أن يكون لديه مملكة للتبديل.`
                ], msg, [sender, target]);
                return;
            }

            // ===== تحميل بيانات المستخدمين =====
            let senderUser = loadUserData(sender);
            let targetUser = loadUserData(target);

            senderUser = sanitizeUser(senderUser);
            targetUser = sanitizeUser(targetUser);
            saveUserData(sender, senderUser);
            saveUserData(target, targetUser);

     // ===== التحقق من امتلاك المرسل للمنتج =====
            let senderHas = 0;
            if (product.type === 'weapon') senderHas = senderUser.weapons?.[product.key] || 0;
            else if (product.type === 'soldier') senderHas = senderUser.soldiers?.[product.key] || 0;
            else if (product.type === 'accessory') senderHas = senderUser.accessories?.[product.key] || 0;
            else {
                await sendMessage(sock, chatId, [
                    `❌ هذا المنتج غير قابل للتبديل.`,
                    `📌 يمكن تبديل الأسلحة والجنود والإكسسوارات فقط.`
                ], msg, [sender]);
                return;
            }

            if (senderHas < quantity) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك ${quantity} × ${product.name}.`,
                    `📌 لديك: ${senderHas} فقط.`
                ], msg, [sender]);
                return;
            }

            if (activeTrades.has(chatId)) {
                await sendMessage(sock, chatId, [
                    `⚠️ هناك طلب تبادل نشط بالفعل.`,
                    `📌 انتظر حتى يتم الرد عليه.`
                ], msg, [sender]);
                return;
            }

            const tradeId = Date.now().toString();
            const tradeData = {
                id: tradeId,
                from: sender,
                to: target,
                product: product,
                quantity: quantity,
                status: 'pending',
                timestamp: Date.now()
            };

            trades[tradeId] = tradeData;
            saveJSON(tradesPath, trades);

            activeTrades.set(chatId, tradeData);

            await sendMessage(sock, chatId, [
                `📨 @${sender.split('@')[0]} يريد تبديل *${quantity} × ${product.name}* مع @${target.split('@')[0]}`,
                ``,
                `📋 المنتج: ${product.name}`,
                `📊 العدد: ${quantity}`,
                `💰 القيمة: ${product.cost * quantity} نقطة`,
                ``,
                `⚠️ *للمستلم:* اكتب \`موافق\` لقبول التبادل`,
                `⚠️ *للمستلم:* اكتب \`رفض\` لرفض التبادل`,
                ``,
                `⏳ الطلب ينتهي بعد 5 دقائق`
            ], msg, [sender, target]);

            const messageHandler = async ({ messages }) => {
                for (const m of messages) {
                    const senderMsg = m.key.participant || m.participant || m.key.remoteJid;
                    if (senderMsg === sock.user.id) continue;
                    if (m.key.remoteJid !== chatId) continue;

                    const trade = activeTrades.get(chatId);
                    if (!trade) continue;

                    const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                    if (!txt.trim()) continue;
                    const content = txt.trim().toLowerCase();

                    if (senderMsg !== trade.to) {
                        if (senderMsg === trade.from) {
                            await sendMessage(sock, chatId, [
                                `⏳ @${senderMsg.split('@')[0]}، انتظر رد @${trade.to.split('@')[0]}.`
                            ], m, [senderMsg, trade.to]);
                        }
                        continue;
                    }

                    if (content === 'موافق') {
                        let fromUser = loadUserData(trade.from);
                        let toUser = loadUserData(trade.to);
                        const product2 = trade.product;

                        fromUser = sanitizeUser(fromUser);
                        toUser = sanitizeUser(toUser);

                        let senderHas2 = 0;
                        if (product2.type === 'weapon') senderHas2 = fromUser.weapons?.[product2.key] || 0;
                        else if (product2.type === 'soldier') senderHas2 = fromUser.soldiers?.[product2.key] || 0;
                        else if (product2.type === 'accessory') senderHas2 = fromUser.accessories?.[product2.key] || 0;

                        if (senderHas2 < trade.quantity) {
                            await sendMessage(sock, chatId, [
                                `❌ فشل التبادل: @${trade.from.split('@')[0]} لم يعد لديه ${trade.quantity} × ${product2.name}.`,
                                `📌 لديه: ${senderHas2} فقط.`
                            ], m, [trade.from, trade.to]);
                            
                            if (trade.messageHandlerOff) trade.messageHandlerOff();
                            activeTrades.delete(chatId);
                            const trades2 = loadJSON(tradesPath);
                            trades2[trade.id].status = 'failed';
                            saveJSON(tradesPath, trades2);
                            return;
                        }

                        // تنفيذ التبادل
                        if (product2.type === 'weapon') fromUser.weapons[product2.key] -= trade.quantity;
                        else if (product2.type === 'soldier') fromUser.soldiers[product2.key] -= trade.quantity;
                        else if (product2.type === 'accessory') fromUser.accessories[product2.key] -= trade.quantity;

                        if (product2.type === 'weapon') toUser.weapons[product2.key] = (toUser.weapons[product2.key] || 0) + trade.quantity;
                        else if (product2.type === 'soldier') toUser.soldiers[product2.key] = (toUser.soldiers[product2.key] || 0) + trade.quantity;
                        else if (product2.type === 'accessory') toUser.accessories[product2.key] = (toUser.accessories[product2.key] || 0) + trade.quantity;

                        // تحديث lastActive للمستخدمين
                        fromUser.lastActive = Date.now();
                        toUser.lastActive = Date.now();

                        saveUserData(trade.from, fromUser);
                        saveUserData(trade.to, toUser);

                        const trades2 = loadJSON(tradesPath);
                        trades2[trade.id].status = 'accepted';
                        saveJSON(tradesPath, trades2);

                        if (trade.messageHandlerOff) trade.messageHandlerOff();
                        activeTrades.delete(chatId);

                        await sendMessage(sock, chatId, [
                            `✅ @${trade.to.split('@')[0]} وافق على التبادل!`,
                            ``,
                            `🔄 تم تبديل *${trade.quantity} × ${product2.name}*`,
                            `👤 من: @${trade.from.split('@')[0]}`,
                            `👤 إلى: @${trade.to.split('@')[0]}`,
                            ``,
                            `📌 استخدم .مخزن لعرض مقتنياتك`
                        ], m, [trade.from, trade.to]);
                        return;
                    }

                    if (content === 'رفض') {
                        const trades2 = loadJSON(tradesPath);
                        trades2[trade.id].status = 'rejected';
                        saveJSON(tradesPath, trades2);

                        if (trade.messageHandlerOff) trade.messageHandlerOff();
                        activeTrades.delete(chatId);

                        await sendMessage(sock, chatId, [
                            `❌ @${trade.to.split('@')[0]} رفض طلب التبادل.`,
                            ``,
                            `📋 المنتج: ${trade.product.name}`,
                            `📊 العدد: ${trade.quantity}`,
                            `👤 من: @${trade.from.split('@')[0]}`
                        ], m, [trade.from, trade.to]);
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', messageHandler);
            tradeData.messageHandlerOff = () => sock.ev.off('messages.upsert', messageHandler);

            setTimeout(() => {
                const trade = activeTrades.get(chatId);
                if (trade && trade.status === 'pending') {
                    const trades2 = loadJSON(tradesPath);
                    if (trades2[trade.id]) {
                        trades2[trade.id].status = 'expired';
                        saveJSON(tradesPath, trades2);
                    }
                    if (trade.messageHandlerOff) trade.messageHandlerOff();
                    activeTrades.delete(chatId);
                    sendMessage(sock, chatId, [
                        `⏰ انتهت صلاحية طلب التبادل (5 دقائق).`,
                        `📌 اطلب من @${trade.from.split('@')[0]} إرسال طلب جديد.`
                    ], null, [trade.from, trade.to]);
                }
            }, 5 * 60 * 1000);

        } catch (error) {
            console.error('✗ خطأ في أمر تبديل:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                `❌ حدث خطأ أثناء التبادل.`,
                `📌 حاول مرة أخرى لاحقاً.`
            ], msg);
        }
    }
};
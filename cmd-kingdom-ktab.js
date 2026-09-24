// كتاب.js - كتاب الأرواح (نسخة متوافقة مع نظام التخزين المنفصل)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const SOULBOOK_PATH = path.join(dataDir, 'kd-soulbook.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');

// ===== التأكد من وجود الملفات =====
if (!fs.existsSync(MAIN_PATH)) fs.writeFileSync(MAIN_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(SOULBOOK_PATH)) fs.writeFileSync(SOULBOOK_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(ACTIVE_PATH)) fs.writeFileSync(ACTIVE_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) {
    try {
        if (fs.existsSync(file)) fs.writeFileSync(file + '.bak', fs.readFileSync(file));
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('❌ فشل حفظ:', file, e.message);
        return false;
    }
}

// ========== دوال التخزين المنفصل ==========
function loadUserData(jid) {
    const main = loadJSON(MAIN_PATH)[jid] || {};
    const soulBook = loadJSON(SOULBOOK_PATH)[jid] || {};
    const active = loadJSON(ACTIVE_PATH)[jid] || {};

    return {
        level: main.level || 1,
        prosperity: main.prosperity || 0,
        lands: main.lands || 0,
        gold: main.gold || 0,
        name: main.name || `مملكة @${jid.split('@')[0]}`,
        owner: main.owner || jid,
        nameChangesUsed: main.nameChangesUsed || 0,
        soulBook: soulBook,
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

    const soulBook = loadJSON(SOULBOOK_PATH);
    soulBook[jid] = data.soulBook || { pages: 0, spirits: [] };
    saveJSON(SOULBOOK_PATH, soulBook);

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

// ========== قائمة الأرواح بدرجاتها ==========
const spiritsList = {
    نادرة: [
        { name: '🐉 روح التنين الأسطوري', power: 50, desc: 'يزيد الهجوم 50%' },
        { name: '👑 روح الملك المقدس', power: 45, desc: 'يزيد الدفاع 45%' },
        { name: '🌌 روح الفضاء الأزلي', power: 40, desc: 'يزيد الصحة 40%' },
        { name: '⚡ روح البرق الإلهي', power: 35, desc: 'يزيد السرعة 35%' },
        { name: '🌑 روح الظلام الأبدي', power: 30, desc: 'يزيد القوة 30%' }
    ],
    متوسطة: [
        { name: '🔥 روح النار المتقدة', power: 25, desc: 'هجوم +25' },
        { name: '💧 روح الماء المتدفق', power: 20, desc: 'دفاع +20' },
        { name: '🌬️ روح الرياح العاتية', power: 18, desc: 'سرعة +18' },
        { name: '🌍 روح الأرض الصلبة', power: 15, desc: 'صحة +15' },
        { name: '🌿 روح الطبيعة الخضراء', power: 12, desc: 'شفاء +12' },
        { name: '🔮 روح الكريستال', power: 10, desc: 'سحر +10' }
    ],
    عادية: [
        { name: '🧊 روح الثلج', power: 8, desc: 'تبطئ العدو' },
        { name: '💫 روح النجم', power: 6, desc: 'تزيد الحظ' },
        { name: '🍃 روح النسيم', power: 5, desc: 'تزيد الخفة' },
        { name: '💎 روح الجوهرة', power: 4, desc: 'تزيد القيمة' },
        { name: '🕊️ روح السلام', power: 3, desc: 'تزيد الهدوء' },
        { name: '🌙 روح القمر', power: 2, desc: 'تزيد الرؤية' }
    ]
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `📖 كـتـاب الأرواح 📖\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['كتاب', 'ارواحي'],
    description: '📖 استدعاء روح من كتاب الأرواح أو عرض أرواحك',
    category: 'مملكة',
    usage: '.كتاب [استدعاء|أرواحي]',
    example: '.كتاب استدعاء  أو  .كتاب أرواحي',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/);
            const subCommand = args.length > 1 ? args[1].toLowerCase() : '';

            const points = loadJSON(pointsPath);

            // ===== التحقق من وجود مملكة =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    '📌 استخدم .لاعب جديد لتأسيس مملكتك.'
                ], msg, [sender]);
                return;
            }

            // ===== تحميل بيانات المستخدم =====
            let user = loadUserData(sender);
            // تحديث وقت النشاط
            user.lastActive = Date.now();

            // ===== عرض الأرواح الموجودة =====
            if (subCommand === 'ارواحي' || subCommand === 'عرض' || subCommand === 'list') {
                const spirits = user.soulBook?.spirits || [];
                if (spirits.length === 0) {
                    await sendMessage(sock, chatId, [
                        `📖 @${sender.split('@')[0]}، ليس لديك أي أرواح بعد.`,
                        '',
                        '📌 استخدم .كتاب استدعاء لاستدعاء روح جديدة.'
                    ], msg, [sender]);
                    return;
                }

                const lines = [
                    `📖 *أرواح @${sender.split('@')[0]}*`,
                    `📊 عدد الأرواح: ${spirits.length}`,
                    `📊 صفحات متبقية: ${user.soulBook.pages || 0}`,
                    ''
                ];

                // تجميع الأرواح حسب الفئة
                const categories = { نادرة: [], متوسطة: [], عادية: [] };
                for (const spirit of spirits) {
                    let found = false;
                    for (const [cat, list] of Object.entries(spiritsList)) {
                        if (list.some(s => s.name === spirit.name)) {
                            categories[cat].push(spirit);
                            found = true;
                            break;
                        }
                    }
                    if (!found) categories.عادية.push(spirit);
                }

                for (const [cat, list] of Object.entries(categories)) {
                    if (list.length === 0) continue;
                    const emoji = cat === 'نادرة' ? '🌟' : cat === 'متوسطة' ? '⭐' : '📌';
                    lines.push(`${emoji} *${cat} (${list.length})*`);
                    for (const sp of list) {
                        lines.push(`   ${sp.name} (قوة ${sp.power})`);
                    }
                    lines.push('');
                }

                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== استدعاء روح جديدة =====
            if (subCommand === 'استدعاء' || subCommand === '' || !subCommand) {
                const pages = user.soulBook.pages || 0;

                if (pages <= 0) {
                    await sendMessage(sock, chatId, [
                        `⚠️ @${sender.split('@')[0]}، ليس لديك صفحات روح.`,
                        '',
                        '📌 يمكنك شراء صفحات الروح من .متجر',
                        '📌 أو كسبها من المهام والفعاليات'
                    ], msg, [sender]);
                    return;
                }

                // تحديد نوع الروح حسب الحظ
                const random = Math.random();
                let spiritCategory = 'عادية';
                let spirit = null;

                if (random < 0.05) { // 5% روح نادرة
                    spiritCategory = 'نادرة';
                    const list = spiritsList.نادرة;
                    spirit = list[Math.floor(Math.random() * list.length)];
                } else if (random < 0.25) { // 20% روح متوسطة
                    spiritCategory = 'متوسطة';
                    const list = spiritsList.متوسطة;
                    spirit = list[Math.floor(Math.random() * list.length)];
                } else { // 75% روح عادية
                    const list = spiritsList.عادية;
                    spirit = list[Math.floor(Math.random() * list.length)];
                }

                // خصم صفحة وإضافة الروح
                user.soulBook.pages--;
                if (!user.soulBook.spirits) user.soulBook.spirits = [];
                user.soulBook.spirits.push(spirit);

                // مكافأة إضافية للروح النادرة
                let bonus = '';
                if (spiritCategory === 'نادرة') {
                    points[sender] = (points[sender] || 0) + 100;
                    bonus = '🎉 *روح نادرة!* مكافأة +100 نقطة!';
                } else if (spiritCategory === 'متوسطة') {
                    points[sender] = (points[sender] || 0) + 30;
                    bonus = '✨ *روح متوسطة!* مكافأة +30 نقطة!';
                }

                // تحديث وقت النشاط
                user.lastActive = Date.now();

                // حفظ البيانات
                saveJSON(pointsPath, points);
                saveUserData(sender, user);

                // تحديد الإيموجي حسب الفئة
                const categoryEmoji = {
                    'نادرة': '🌟',
                    'متوسطة': '⭐',
                    'عادية': '📌'
                };

                const lines = [
                    `📖 @${sender.split('@')[0]} استخدم صفحة روح!`,
                    ``,
                    `${categoryEmoji[spiritCategory]} *${spirit.name}*`,
                    `📊 القوة: ${spirit.power}`,
                    `📝 التأثير: ${spirit.desc}`,
                    `🏷️ الفئة: ${spiritCategory}`,
                    ``,
                    bonus ? `${bonus}` : '',
                    `📊 تبقى ${user.soulBook.pages} صفحة.`,
                    `📊 عدد الأرواح: ${user.soulBook.spirits.length}`
                ];

                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== أمر غير معروف =====
            await sendMessage(sock, chatId, [
                `❌ @${sender.split('@')[0]}، أمر غير معروف.`,
                '',
                '📌 استخدم `.كتاب استدعاء` لاستدعاء روح جديدة.',
                '📌 استخدم `.كتاب أرواحي` لعرض أرواحك.'
            ], msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر كتاب:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};
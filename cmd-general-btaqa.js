// بطاقة.js - عرض أو تسجيل أو حذف بطاقة المستخدم مع الصورة والرصيد

const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const hay = require('./lib-roles');

// ========== المسارات ==========
const profilesPath = path.join(__dirname, 'db-profiles.json');
const imagesFolder = path.join(__dirname, 'db-profiles_images');
const pointsPath = path.join(__dirname, 'db-points.json');
const hiddenPath = path.join(__dirname, 'db-hidden-points.json');
const loansPath = path.join(__dirname, 'db-loans.json');

// ========== التأكد من وجود الملفات والمجلدات ==========
if (!fs.existsSync(profilesPath)) fs.writeFileSync(profilesPath, '{}');
if (!fs.existsSync(imagesFolder)) fs.mkdirSync(imagesFolder, { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, '{}');
if (!fs.existsSync(hiddenPath)) fs.writeFileSync(hiddenPath, '[]');
if (!fs.existsSync(loansPath)) fs.writeFileSync(loansPath, '{}');

// ========== دوال التحميل والحفظ ==========
function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function loadProfiles() {
    try { return JSON.parse(fs.readFileSync(profilesPath)); } catch { return {}; }
}

function saveProfiles(data) {
    fs.writeFileSync(profilesPath, JSON.stringify(data, null, 2));
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🪪 بـطـاقـة الـمـسـتـخـدم 🪪\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== نظام الرتب ==========
function getRank(jid) {
    if (hay.isFounder(jid)) return 4;
    if (hay.isOwnerbot(jid)) return 3;
    if (hay.isDeveloper(jid)) return 2;
    return 0;
}

function getRankEmoji(rank) {
    if (rank === 4) return '👑';
    if (rank === 3) return '💎';
    if (rank === 2) return '💠';
    return '👤';
}

function getRankName(rank) {
    if (rank === 4) return 'المالك';
    if (rank === 3) return 'مالك البوت';
    if (rank === 2) return 'مطور';
    return 'عضو';
}

function getRankDisplay(rank) {
    if (rank === 4) return 'المالك 👑';
    if (rank === 3) return 'مالك البوت 💎';
    if (rank === 2) return 'مطور 💠';
    return null;
}

function getMentionText(jid, rank) {
    if (rank >= 2) {
        return getRankDisplay(rank);
    }
    const number = jid.split('@')[0];
    return `@${number}`;
}

function isHiddenUser(user) {
    const hidden = loadJSON(hiddenPath);
    return hidden.includes(user);
}

// ========== تنسيق الأرقام ==========
function formatPoints(points, rank) {
    if (points === undefined || points === null) return '0';
    if (typeof points !== 'number') points = Number(points);
    if (isNaN(points)) return '0';

    if (rank >= 2) {
        if (points >= 1e15) return '💰 ثروة خرافية 💰';
        if (points >= 1e12) return '💰 ثروة خيالية 💰';
        if (points >= 1e9) return '💰 ملياردير 💰';
        if (points >= 1e6) return '💰 مليونير 💰';
        return '💰 غني جداً 💰';
    }

    const num = points;
    if (num >= 1e15) return (num / 1e15).toFixed(2) + ' كوادريليون';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + ' تريليون';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + ' مليار';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' مليون';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + ' ألف';
    return num.toString();
}

function getLevel(points) {
    if (points >= 1e9) return '👑 DEVELOPER';
    if (points >= 1e8) return '🌀 KING OF POINTS';
    if (points >= 1e7) return '💀 BIG BOSS';
    if (points >= 1e6) return '🔥 WTF';
    if (points >= 1e5) return '🔪 KILLER';
    if (points >= 1e4) return '🦁 LEGEND';
    if (points >= 1e3) return '💎 PRO';
    if (points >= 500) return '⚡ ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    return '🐣 NEWBIE';
}

function getLevelBar(points) {
    const maxPoints = 10000;
    let percent = Math.min(100, (points / maxPoints) * 100);
    const filled = Math.floor(percent / 10);
    const empty = 10 - filled;
    return '▰'.repeat(filled) + '▱'.repeat(empty);
}

// ========== دوال الديون ==========
function getLoanInfo(jid) {
    const loans = loadJSON(loansPath);
    return loans[jid] || null;
}

function getOverdueDays(dueDate) {
    const now = Date.now();
    const due = new Date(dueDate).getTime();
    const diff = now - due;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDaysRemaining(dueDate) {
    const now = Date.now();
    const due = new Date(dueDate).getTime();
    const diff = due - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(date) {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// ========== دالة تحديث النقاط ==========
function updatePoints(jid, amount) {
    const points = loadJSON(pointsPath);
    points[jid] = (points[jid] || 0) + amount;
    saveJSON(pointsPath, points);
    return points[jid];
}

// ========== دالة استخراج المنشن ==========
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

// ========== دالة عرض البطاقة مع الصورة ==========
async function sendCard(sock, chatId, target, quoted = null) {
    const profiles = loadProfiles();
    if (!profiles[target]) {
        await sendMessage(sock, chatId, [
            `❌ @${target.split('@')[0]} لم يسجل بطاقته بعد.`,
            '',
            `📝 استخدم .بطاقة تسجيل / لتسجيلها.`
        ], quoted, [target]);
        return;
    }

    const { nickname, age, gender, image } = profiles[target];
    const points = loadJSON(pointsPath);
    const userPoints = points[target] || 0;
    const targetRank = getRank(target);
    const rank = getLevel(userPoints);
    const levelBar = getLevelBar(userPoints);
    const rankEmoji = getRankEmoji(targetRank);
    const rankName = getRankName(targetRank);
    const formattedPoints = formatPoints(userPoints, targetRank);
    const hidden = isHiddenUser(target);
    const hiddenStatus = hidden ? '🔒 مخفي' : '🔓 ظاهر';
    const sender = quoted?.key?.participant || quoted?.participant || chatId;
    const senderRank = getRank(sender);

    const loanInfo = getLoanInfo(target);
    let debtLine = '';
    let debtDetails = [];

    if (loanInfo && loanInfo.remaining > 0) {
        const overdueDays = getOverdueDays(loanInfo.dueDate);
        const daysRemaining = getDaysRemaining(loanInfo.dueDate);
        let statusMsg = '';
        if (overdueDays > 0) {
            statusMsg = `🔴 متأخر ${overdueDays} يوم`;
        } else {
            statusMsg = `🟢 متبقي ${daysRemaining} يوم`;
        }
        debtLine = `💸 مديون: ${loanInfo.remaining} نقطة`;
        debtDetails = [
            `   📉 المتبقي: ${loanInfo.remaining} نقطة`,
            `   📅 الاستحقاق: ${formatDate(loanInfo.dueDate)}`,
            `   ⏳ الحالة: ${statusMsg}`,
            `   ⚠️ الغرامة: ${loanInfo.dailyPenalty || 0} نقطة/يوم`
        ];
    }

    let pointsLine = `💰 الرصيد: ${formattedPoints}`;
    if (hidden && target !== sender && senderRank < 2) {
        pointsLine = '🔒 الرصيد: مخفي';
    }

    const cardLines = [
        `👤 @${target.split('@')[0]}`,
        '',
        `📝 اللقب: ${nickname}`,
        `🎂 العمر: ${age}`,
        `⚧️ النوع: ${gender}`,
        `👑 الرتبة: ${rankEmoji} ${rankName}`,
        pointsLine,
        `🏆 المستوى: ${rank}`,
        `📊 التقدم: ${levelBar}`,
        `🔒 الخصوصية: ${hiddenStatus}`
    ];

    if (debtLine) {
        cardLines.push('');
        cardLines.push(debtLine);
        cardLines.push(...debtDetails);
    } else {
        cardLines.push('');
        cardLines.push('✅ لا يوجد ديون');
    }

    const lines = cardLines;

    if (image && fs.existsSync(image)) {
        const imageBuffer = fs.readFileSync(image);
        let msg = `🪪 بـطـاقـة الـمـسـتـخـدم 🪪\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━\n`;
        for (const line of lines) {
            if (line && line.trim()) {
                msg += `${line}\n`;
            }
        }
        msg += `━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: msg,
            mentions: [target]
        }, { quoted: quoted });
    } else {
        await sendMessage(sock, chatId, lines, quoted, [target]);
    }
}

// ========== دالة عرض الشرح ==========
async function showHelp(sock, chatId, quoted = null) {
    const helpLines = [
        '📖 *شرح أمر البطاقة*',
        '',
        '📌 `.بطاقة` - يعرض بطاقتك الشخصية مع الصورة',
        '📌 `.بطاقة @منشن` - يعرض بطاقة الشخص المنشون',
        '📌 `.بطاقة` (رداً على رسالة شخص) - يعرض بطاقته',
        '📌 `.بطاقة تسجيل` - يسجل بطاقتك الشخصية',
        '📌 `.بطاقة تسجيل @منشن` - يسجل بطاقة الشخص المنشون',
        '📌 `.بطاقة تسجيل` (رداً على رسالة شخص) - يسجل بطاقته',
        '📌 `.بطاقة حذف` - يحذف بطاقتك الشخصية',
        '📌 `.بطاقة حذف @منشن` - يحذف بطاقة الشخص (للمطورين فقط)',
        '',
        '💰 *نظام النقاط:*',
        '🏆 التسجيل يحصل على 100 نقطة',
        '💔 حذف البطاقة يخصم 50 نقطة'
    ];
    await sendMessage(sock, chatId, helpLines, quoted);
}

// ========== دالة إرسال سؤال مع منشن ==========
async function askQuestion(sock, chatId, question, target) {
    const msg = `📝 @${target.split('@')[0]} ${question}`;
    return await sock.sendMessage(chatId, {
        text: msg,
        mentions: [target]
    });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['بطاقة', 'هويتي'],
    category: 'عام',
    description: '🪪 عرض أو تسجيل أو حذف بطاقة المستخدم مع الصورة والرصيد',
    usage: '.بطاقة [تسجيل|حذف] [@منشن]',

    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;
            const sender = m.key.participant || m.key.remoteJid;

            const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
            const args = body.split(/\s+/).slice(1);
            const command = args[0] || '';

            const isMentionCommand = args.length > 0 && args[0].startsWith('@');

            let mentionedJids = extractMentions(m);
            const quotedSender = m.message?.extendedTextMessage?.contextInfo?.participant || null;

            if (isMentionCommand && mentionedJids.length === 0) {
                const mentionText = args[0].replace('@', '');
                if (mentionText.match(/\d+/)) {
                    mentionedJids = [`${mentionText}@s.whatsapp.net`];
                }
            }

            // ===== عرض الشرح =====
            if (command === 'شرح' || command === 'help') {
                return showHelp(sock, chatId, m);
            }

            // ===== تحديد الهدف =====
            let target = null;
            let isRegister = false;
            let isDelete = false;

            if (command === 'تسجيل' || command === 'register') {
                isRegister = true;
                if (mentionedJids.length > 0) {
                    target = mentionedJids[0];
                } else if (quotedSender) {
                    target = quotedSender;
                } else {
                    target = sender;
                }
            } else if (command === 'حذف' || command === 'delete') {
                isDelete = true;
                if (mentionedJids.length > 0) {
                    target = mentionedJids[0];
                } else if (quotedSender) {
                    target = quotedSender;
                } else {
                    target = sender;
                }
            } else if (mentionedJids.length > 0) {
                target = mentionedJids[0];
            } else if (quotedSender) {
                target = quotedSender;
            } else {
                target = sender;
            }

            // ===== معالجة الأخطاء =====
            if (!isRegister && !isDelete && command !== '' && command !== 'بطاقة' && !isMentionCommand) {
                return showHelp(sock, chatId, m);
            }

            // ===== عرض البطاقة =====
            if (!isRegister && !isDelete) {
                return await sendCard(sock, chatId, target, m);
            }

            // ===== حذف البطاقة =====
            if (isDelete) {
                const profiles = loadProfiles();

                if (target === sender) {
                    if (!profiles[target]) {
                        await sendMessage(sock, chatId, [
                            '❌ *ليس لديك بطاقة مسجلة*',
                            '',
                            '📌 استخدم `.بطاقة تسجيل` لتسجيل بطاقتك'
                        ], m, [target]);
                        return;
                    }

                    if (profiles[target].image && fs.existsSync(profiles[target].image)) {
                        try {
                            fs.unlinkSync(profiles[target].image);
                        } catch (e) {}
                    }

                    delete profiles[target];
                    saveProfiles(profiles);

                    const newPoints = updatePoints(target, -50);

                    await sendMessage(sock, chatId, [
                        '✅ *تم حذف بطاقتك بنجاح!*',
                        '',
                        `💰 تم خصم 50 نقطة (رصيدك الآن: ${newPoints})`
                    ], m, [target]);
                    return;
                }

                const senderLid = hay.toLid(sender);

                if (!(hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid))) {
                    await sendMessage(sock, chatId, [
                        '❌ *غير مصرح*',
                        '',
                        '🔒 هذا الأمر مخصص للمطورين فقط.'
                    ], m);
                    return;
                }

                const targetLid = hay.toLid(target);

                if (hay.isFounder(targetLid) || hay.isOwnerbot(targetLid) || hay.isDeveloper(targetLid)) {
                    await sendMessage(sock, chatId, [
                        '🚫 *لا يمكن حذف بطاقة مطور آخر*'
                    ], m);
                    return;
                }

                if (!profiles[target]) {
                    await sendMessage(sock, chatId, [
                        '⚠️ *لا توجد بطاقة محفوظة لهذا الشخص*'
                    ], m);
                    return;
                }

                if (profiles[target].image && fs.existsSync(profiles[target].image)) {
                    try {
                        fs.unlinkSync(profiles[target].image);
                    } catch (e) {}
                }

                delete profiles[target];
                saveProfiles(profiles);

                const newPoints = updatePoints(target, -50);

                await sendMessage(sock, chatId, [
                    '✅ *تم حذف البطاقة بنجاح!*',
                    '',
                    `📌 @${target.split('@')[0]} تم حذف بطاقته`,
                    `💰 تم خصم 50 نقطة (رصيده الآن: ${newPoints})`
                ], m, [target]);
                return;
            }

       // ===== تسجيل البطاقة =====
            if (isRegister) {
                const profiles = loadProfiles();
                if (profiles[target]) {
                    await sendMessage(sock, chatId, [
                        `⚠️ @${target.split('@')[0]} لديه بطاقة مسجلة بالفعل.`,
                        '',
                        `📝 استخدم .بطاقة @${target.split('@')[0]} لعرضها.`
                    ], m, [target]);
                    return;
                }

                if (target === sender) {
                    await sendMessage(sock, chatId, [
                        `📝 *بدء تسجيل بطاقتك @${sender.split('@')[0]}*`,
                        '',
                        '✍️ سأرسل لك الأسئلة واحداً تلو الآخر.'
                    ], m, [sender]);
                } else {
                    await sendMessage(sock, chatId, [
                        `📝 *بدء تسجيل بطاقة @${target.split('@')[0]}*`,
                        '',
                        '✍️ سأرسل له الأسئلة واحداً تلو الآخر.'
                    ], m, [target]);
                }

                const ask = async (question, expectImage = false) => {
                    await askQuestion(sock, chatId, question, target);

                    return new Promise((resolve) => {
                        const handler = async ({ messages }) => {
                            for (const msg of messages) {
                                const from = msg.key.participant || msg.key.remoteJid;
                                
                                if (from === sock.user.id) continue;
                                if (from !== target) continue;
                                
                                sock.ev.off('messages.upsert', handler);

                                const message = msg.message;

                                if (expectImage && message?.imageMessage) {
                                    const buffer = await downloadMediaMessage(msg, 'buffer', {}, { reuploadRequest: sock });
                                    const filename = `profile_${randomBytes(4).toString('hex')}.jpg`;
                                    const filePath = path.join(imagesFolder, filename);
                                    fs.writeFileSync(filePath, buffer);
                                    resolve(filePath);
                                } else {
                                    const text =
                                        message?.conversation ||
                                        message?.extendedTextMessage?.text || '';
                                    resolve(text.trim());
                                }
                            }
                        };
                        sock.ev.on('messages.upsert', handler);
                    });
                };

                try {
                    const nickname = await ask("ما هو لقب أو اسم مستعار؟");
                    const age = await ask("كم عمرك؟");
                    const gender = await ask("ما هو جنسك؟ (اكتب: ذكر أو أنثى)");
                    const image = await ask("أرسل صورة شخصية (صورة فقط)", true);

                    profiles[target] = {
                        nickname,
                        age,
                        gender,
                        image
                    };

                    saveProfiles(profiles);

                    const newPoints = updatePoints(target, 100);

                    await sendMessage(sock, chatId, [
                        '✅ *تم تسجيل البطاقة بنجاح!*',
                        '',
                        `📌 @${target.split('@')[0]}`,
                        `📝 اللقب: ${nickname}`,
                        `🎂 العمر: ${age}`,
                        `⚧️ النوع: ${gender}`,
                        '',
                        `💰 +100 نقطة! (رصيده: ${newPoints})`
                    ], null, [target]);

                } catch (error) {
                    console.error('❌ خطأ في تسجيل البطاقة:', error);
                    await sendMessage(sock, chatId, [
                        '❌ *حدث خطأ أثناء التسجيل*',
                        '',
                        '📝 حاول مرة أخرى باستخدام `.بطاقة تسجيل`'
                    ], m, [target]);
                }
                return;
            }

        } catch (error) {
            console.error('❌ خطأ في أمر بطاقة:', error);
            await sendMessage(sock, m.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], m);
        }
    }
};
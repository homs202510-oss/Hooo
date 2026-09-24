// خمن.js - لعبة تخمين شخصية الأنمي

const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const games = new Map(); // لمنع التكرار

if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, '{}');

// ========== دوال مساعدة ==========
function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } 
    catch { return {}; }
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function clean(text) {
    return text.toLowerCase().replace(/\s+/g, '').trim();
}

function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    num = Math.floor(num);
    if (num >= 1e15) return '∞';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + ' تريليون';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + ' مليار';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' مليون';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + ' ألف';
    return num.toString();
}

// ========== دالة الإرسال بتنسيق موحد ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎭 لـعـبـة الـتـخـمـيـن 🎭\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    
    await sock.sendMessage(chatId, { 
        text: msg, 
        mentions 
    }, { 
        quoted: quoted 
    });
}

// ========== قائمة الشخصيات ==========
const characters = [
    { name: 'كتاكوري', file: 'كتا.jpg' },
    { name: 'جمليكوبتر', file: 'جمليكوبتر.jpg' },
    { name: 'ساسكي', file: 'ساسكي.jpg' },    
    { name: 'راينر', file: 'راينر.jpg' },    
    { name: 'كورابيكا', file: 'كورابيكا.jpg' },
    { name: 'ماكيما', file: 'ماكيما.jpg' },
    { name: 'تانجيرو', file: 'تان.jpg' },
    { name: 'هيمينو', file: 'هيمينو.jpg' },
    { name: 'هيناتا', file: 'هيناتا.jpg' },
    { name: 'اشيلاد', file: 'اشيلاد.jpg' },
    { name: 'شانكس', file: 'شانكس.jpg' },
    { name: 'سونغ', file: 'سونغ.jpg' },
    { name: 'الاستور', file: 'الاستور.jpg' },
    { name: 'ايلومي', file: 'ايلومي.jpg' },
    { name: 'كرولو', file: 'كرولو.jpg' },
    { name: 'اوسوب', file: 'اوسوب.jpg' },
    { name: 'موزان', file: 'موزان.jpg' },
    { name: 'فيفي', file: 'فيفي.jpg' },
    { name: 'هانكوك', file: 'هانكوك.jpg' },
    { name: 'زينيتسو', file: 'زينيتسو.jpg' },
    { name: 'زورو', file: 'زورو.jpg' },
    { name: 'توكيتو', file: 'توكيتو.jpg' },
    { name: 'مايكي', file: 'مايكي.jpg' },
    { name: 'ميدوريا', file: 'ميدوريا.jpg' },
    { name: 'غوكو', file: 'غوكو.jpg' },
    { name: 'ثورز', file: 'ثورز.jpg' },
    { name: 'سانيمي', file: 'سانيمي.jpg' },
    { name: 'ميكاسا', file: 'ميكاسا.jpg' },
    { name: 'غينيا', file: 'غينيا.jpg' },
    { name: 'ايزن', file: 'ايزن.jpg' },
    { name: 'استا', file: 'استا.jpg' },
    { name: 'كونان', file: 'كونان.jpg' },
    { name: 'ايتاتشي', file: 'ايتاتشي.jpg' },
    { name: 'كيلوا', file: 'كي.jpg' },
    { name: 'ساكورا', file: 'ام.jpg' },
    { name: 'يامي', file: 'يا.jpg' },
    { name: 'لايت', file: 'لا.jpg' },
    { name: 'ايرين', file: 'اي.jpg' },
    { name: 'روبين', file: 'رو.jpg' },
    { name: 'لوفي', file: 'لو.jpg' }
];

const ASSETS_DIR = __dirname; // الصور: anime-<الاسم>.jpg جنب الملفات
const REWARD = 100;
const PENALTY = 50;
const TIME_LIMIT = 20000; // 20 ثانية

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['خمن', 'احزر'],
    description: '🎭 لعبة تخمين شخصية الأنمي (صور محلية)',
    category: 'فعاليات',
    usage: '.خمن',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderNum = sender.split('@')[0];

            // ===== التحقق من عدم وجود لعبة نشطة =====
            if (games.has(chatId)) {
                await sendMessage(sock, chatId, [
                    '⚠️ *يوجد لعبة نشطة*',
                    '',
                    '📌 انتظر حتى تنتهي اللعبة الحالية',
                    '📌 أو اكتب "انسحب" للانسحاب'
                ], msg);
                return;
            }

            // ===== التحقق من وجود صور =====
            const validCharacters = [];
            for (const char of characters) {
                const filePath = path.join(ASSETS_DIR, 'anime-' + char.file);
                if (fs.existsSync(filePath)) {
                    validCharacters.push({ ...char, filePath });
                } else {
                    console.log(`⚠️ الصورة غير موجودة: ${char.file}`);
                }
            }

            if (validCharacters.length === 0) {
                await sendMessage(sock, chatId, [
                    '❌ *لا توجد صور متاحة*',
                    '',
                    '📌 يرجى التأكد من وجود الصور في المجلد:',
                    `📁 ${ASSETS_DIR}`
                ], msg);
                return;
            }

            // ===== اختيار شخصية عشوائية =====
            const character = validCharacters[Math.floor(Math.random() * validCharacters.length)];
            const answer = clean(character.name);

            let ended = false;
            let timer = null;

            // ===== تسجيل اللعبة =====
            games.set(chatId, { active: true, sender });

            // ===== إرسال الصورة =====
            try {
                const imageBuffer = fs.readFileSync(character.filePath);
                
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: `🖼️ *خمن شخصية الأنمي!*\n━━━━━━━━━━━━━━━━━━━━\n⏳ لديك ${TIME_LIMIT / 1000} ثانية\n💰 المكافأة: +${REWARD} نقطة\n⚠️ العقاب: -${PENALTY} نقطة`
                }, { quoted: msg });
            } catch (err) {
                await sendMessage(sock, chatId, [
                    '❌ *فشل إرسال الصورة*',
                    '',
                    `📝 ${err.message || 'خطأ غير معروف'}`
                ], msg);
                games.delete(chatId);
                return;
            }

            // ===== مستمع الإجابات =====
            const handler = async ({ messages }) => {
                for (const m of messages) {
                    if (ended) return;
                    if (m.key.remoteJid !== chatId) continue;
                    if (m.key.fromMe) continue;

                    const txt = m.message?.conversation || 
                               m.message?.extendedTextMessage?.text || '';
                    if (!txt) continue;

                    const guess = clean(txt);

                    // ===== انسحاب =====
                    if (guess === 'انسحب' || guess === 'انسحاب') {
                        const participant = m.key.participant || m.key.remoteJid;
                        if (participant === sender) {
                            ended = true;
                            clearTimeout(timer);
                            sock.ev.off('messages.upsert', handler);
                            games.delete(chatId);

                            const points = loadJSON(pointsPath);
                            const penaltyAmount = Math.min(PENALTY, points[sender] || 0);
                            points[sender] = (points[sender] || 0) - penaltyAmount;
                            saveJSON(pointsPath, points);

                            await sendMessage(sock, chatId, [
                                '🚪 *انسحبت من اللعبة*',
                                '',
                                `📌 تم خصم ${penaltyAmount} نقطة`,
                                `📊 رصيدك: ${formatNumber(points[sender] || 0)} نقطة`
                            ], m, [sender]);
                            return;
                        } else {
                            await sendMessage(sock, chatId, [
                                '⚠️ *صاحب اللعبة فقط*',
                                '',
                                '📌 يمكن لصاحب اللعبة فقط الانسحاب'
                            ], m);
                            continue;
                        }
                    }

                    // ===== التحقق من الإجابة =====
                    if (guess === answer) {
                        ended = true;
                        clearTimeout(timer);
                        sock.ev.off('messages.upsert', handler);
                        games.delete(chatId);

                        const winner = m.key.participant || m.key.remoteJid;
                        const points = loadJSON(pointsPath);
                        points[winner] = (points[winner] || 0) + REWARD;
                        saveJSON(pointsPath, points);

                        await sendMessage(sock, chatId, [
                            '🎉 *إجابة صحيحة!* 🎉',
                            '',
                            `🏆 *الفائز:* @${winner.split('@')[0]}`,
                            `🧠 *الشخصية:* ${character.name}`,
                            `💰 *المكافأة:* +${REWARD} نقطة`,
                            `📊 *رصيدك:* ${formatNumber(points[winner] || 0)} نقطة`
                        ], m, [winner]);
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', handler);

            // ===== مؤقت الوقت =====
            timer = setTimeout(async () => {
                if (ended) return;
                ended = true;
                sock.ev.off('messages.upsert', handler);
                games.delete(chatId);

                const points = loadJSON(pointsPath);
                const penaltyAmount = Math.min(PENALTY, points[sender] || 0);
                points[sender] = (points[sender] || 0) - penaltyAmount;
                saveJSON(pointsPath, points);

                await sendMessage(sock, chatId, [
                    '⏰ *انتهى الوقت!*',
                    '',
                    `❌ *الإجابة:* ${character.name}`,
                    `➖ تم خصم ${penaltyAmount} نقطة`,
                    `📊 رصيدك: ${formatNumber(points[sender] || 0)} نقطة`
                ], null, [sender]);

            }, TIME_LIMIT);

        } catch (error) {
            console.error('❌ خطأ في لعبة خمن:', error);
            games.delete(msg.key.remoteJid);
            
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};
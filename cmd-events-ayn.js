// plugins/عين.js - لعبة تخمين العين (نسخة ملكية فرعونية)

const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const games = new Map();

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

    let msg = `👁️ لـعـبـة الـتـخـمـيـن 👁️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`;
    
    await sock.sendMessage(chatId, { 
        text: msg, 
        mentions 
    }, { 
        quoted: quoted 
    });
}

// ========== قائمة العيون ==========
const eyes = [
    { name: 'شانكس', file: 'شانكس.jpg' },
    { name: 'ساسكي', file: 'ساسكي.jpg' },
    { name: 'فريزر', file: 'فريزر.jpg' },
    { name: 'لوفي', file: 'لوفي.jpg' },
    { name: 'نيجي', file: 'نيجي.jpg' },
    { name: 'ناروتو', file: 'ناروتو.jpg' },
    { name: 'ليفاي', file: 'ليفاي.jpg' },
    { name: 'ثورفين', file: 'ثورفين.jpg' },
    { name: 'ماش', file: 'ماش.jpg' },
    { name: 'يوتا', file: 'يوتا.jpg' },
    { name: 'هيستوريا', file: 'هيستوريا.jpg' },
    { name: 'يوميكو', file: 'يوميكو.jpg' },
    { name: 'كيلوا', file: 'كيلوا.jpg' },
    { name: 'نامي', file: 'نامي.jpg' },
    { name: 'دوما', file: 'دوما.jpg' },
    { name: 'ميلدوس', file: 'ميلدوس.jpg' },
    { name: 'يامي', file: 'يامي.jpg' },
    { name: 'تسونادي', file: 'تسونادي.jpg' },
    { name: 'كيراري', file: 'كيراري.jpg' },
    { name: 'انيا', file: 'انيا.jpg' },
    { name: 'بيتو', file: 'بيتو.jpg' },
    { name: 'اكازا', file: 'اكازا.jpg' },
    { name: 'ايساغي', file: 'ايساغي.jpg' },
    { name: 'فايوليت', file: 'فايوليت.jpg' },
    { name: 'غارا', file: 'غارا.jpg' },
    { name: 'غيو', file: 'غيو.jpg' },
    { name: 'ايرين', file: 'ايرين.jpg' },
    { name: 'هيمينو', file: 'هيمينو.jpg' },
    { name: 'تشيساكي', file: 'تشيساكي.jpg' },
    { name: 'سارادا', file: 'سارادا.jpg' },
    { name: 'بوروتو', file: 'بوروتو.jpg' },
    { name: 'ميتسوري', file: 'ميتسوري.jpg' },
    { name: 'غوكو', file: 'غوكو.jpg' },
    { name: 'رينغو', file: 'رينغو.jpg' },
    { name: 'ديكو', file: 'ديكو.jpg' },
    { name: 'استا', file: 'استا.jpg' },
    { name: 'ماكيما', file: 'ماكيما.jpg' },
    { name: 'كانيكي', file: 'كانيكي.jpg' },
    { name: 'ايتشيغو', file: 'ايتشيغو.jpg' },
    { name: 'داكي', file: 'داكي.jpg' },
    { name: 'رين', file: 'رين.jpg' },
    { name: 'تودوروكي', file: 'تودوروكي.jpg' },
    { name: 'هيماواري', file: 'هيماواري.jpg' },
    { name: 'باور', file: 'باور.jpg' }
];

const ASSETS_DIR = __dirname; // الصور: eyes-<الاسم>.jpg جنب الملفات
const REWARD = 100;
const PENALTY = 50;
const TIME_LIMIT = 20000; // 20 ثانية

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['عين', 'عيون'],
    description: '👁️ لعبة تخمين العين (صور محلية)',
    category: 'فعاليات',
    usage: '.عين',

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
            const validEyes = [];
            for (const eye of eyes) {
                const filePath = path.join(ASSETS_DIR, 'eyes-' + eye.file);
                if (fs.existsSync(filePath)) {
                    validEyes.push({ ...eye, filePath });
                } else {
                    console.log(`⚠️ الصورة غير موجودة: ${eye.file}`);
                }
            }

            if (validEyes.length === 0) {
                await sendMessage(sock, chatId, [
                    '❌ *لا توجد صور متاحة*',
                    '',
                    '📌 يرجى التأكد من وجود الصور في المجلد:',
                    `📁 ${ASSETS_DIR}`
                ], msg);
                return;
            }

            // ===== اختيار عين عشوائية =====
            const eye = validEyes[Math.floor(Math.random() * validEyes.length)];
            const answer = clean(eye.name);

            let ended = false;
            let timer = null;

            // ===== تسجيل اللعبة =====
            games.set(chatId, { active: true, sender });

            // ===== إرسال الصورة =====
            try {
                const imageBuffer = fs.readFileSync(eye.filePath);
                
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: `👁️ *خمن صاحب هذه العين!*\n━━━━━━━━━━━━━━━━━━━━\n⏳ لديك ${TIME_LIMIT / 1000} ثانية\n💰 المكافأة: +${REWARD} نقطة\n⚠️ العقاب: -${PENALTY} نقطة`
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
                            `👁️ *العين:* ${eye.name}`,
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
                    `❌ *الإجابة:* ${eye.name}`,
                    `➖ تم خصم ${penaltyAmount} نقطة`,
                    `📊 رصيدك: ${formatNumber(points[sender] || 0)} نقطة`
                ], null, [sender]);

            }, TIME_LIMIT);

        } catch (error) {
            console.error('❌ خطأ في لعبة عين:', error);
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
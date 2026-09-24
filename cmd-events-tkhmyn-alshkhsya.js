// شخصية.js - لعبة تخمين شخصية الأنمي

const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, '{}');

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getLevel(points) {
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '🔥 ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    return '🙂 BEGINNER';
}

// ========== دالة الإرسال بتنسيق موحد ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎭 تـخـمـيـن الـشـخـصـيـة 🎭\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    
    await sock.sendMessage(chatId, { 
        text: msg, 
        mentions 
    }, { 
        quoted: quoted 
    });
}

// ========== قاعدة بيانات الشخصيات ==========
const charactersDB = [
    // ون بيس
    { name: 'لوفي', anime: 'ون بيس', gender: 'ذكر', hair: 'اسود' },
    { name: 'زورو', anime: 'ون بيس', gender: 'ذكر', hair: 'اخضر' },
    { name: 'نامي', anime: 'ون بيس', gender: 'انثى', hair: 'برتقالي' },
    { name: 'سانجي', anime: 'ون بيس', gender: 'ذكر', hair: 'اصفر' },
    { name: 'كايدو', anime: 'ون بيس', gender: 'ذكر', hair: 'اسود' },
    { name: 'نيني', anime: 'ون بيس', gender: 'انثى', hair: 'وردي' },
    { name: 'بوجي', anime: 'ون بيس', gender: 'ذكر', hair: 'برتقالي' },
    { name: 'شانكس', anime: 'ون بيس', gender: 'ذكر', hair: 'احمر' },
    
    // ناروتو
    { name: 'ناروتو', anime: 'ناروتو', gender: 'ذكر', hair: 'اصفر' },
    { name: 'ساسكي', anime: 'ناروتو', gender: 'ذكر', hair: 'اسود' },
    { name: 'ساكورا', anime: 'ناروتو', gender: 'انثى', hair: 'وردي' },
    { name: 'كاكاشي', anime: 'ناروتو', gender: 'ذكر', hair: 'ابيض' },
    { name: 'هيناتا', anime: 'ناروتو', gender: 'انثى', hair: 'اسود' },
    { name: 'تسونادي', anime: 'ناروتو', gender: 'انثى', hair: 'اصفر' },
    { name: 'جيرايا', anime: 'ناروتو', gender: 'ذكر', hair: 'ابيض' },
    { name: 'نيجي', anime: 'ناروتو', gender: 'ذكر', hair: 'اسود' },
    { name: 'غارا', anime: 'ناروتو', gender: 'ذكر', hair: 'احمر' },
    { name: 'ايتاشي', anime: 'ناروتو', gender: 'ذكر', hair: 'اسود' },
    { name: 'مادارا', anime: 'ناروتو', gender: 'ذكر', hair: 'اسود' },
    { name: 'اوروشيمارو', anime: 'ناروتو', gender: 'ذكر', hair: 'اسود' },
    
    // دراغون بول
    { name: 'غوكو', anime: 'دراغون بول', gender: 'ذكر', hair: 'اسود' },
    { name: 'فيجيتا', anime: 'دراغون بول', gender: 'ذكر', hair: 'اسود' },
    { name: 'بيكولو', anime: 'دراغون بول', gender: 'ذكر', hair: 'اصلع' },
    { name: 'فريزر', anime: 'دراغون بول', gender: 'ذكر', hair: 'ابيض' },
    { name: 'بيروس', anime: 'دراغون بول', gender: 'ذكر', hair: 'بنفسجي' },
    { name: 'غوهان', anime: 'دراغون بول', gender: 'ذكر', hair: 'اسود' },
    { name: 'ترانكس', anime: 'دراغون بول', gender: 'ذكر', hair: 'بنفسجي' },
    { name: 'بولا', anime: 'دراغون بول', gender: 'انثى', hair: 'ازرق' },
    
    // هجوم العمالقة
    { name: 'ايرين', anime: 'هجوم العمالقة', gender: 'ذكر', hair: 'اسود' },
    { name: 'ميكاسا', anime: 'هجوم العمالقة', gender: 'انثى', hair: 'اسود' },
    { name: 'ارمين', anime: 'هجوم العمالقة', gender: 'ذكر', hair: 'اصفر' },
    { name: 'ليفاي', anime: 'هجوم العمالقة', gender: 'ذكر', hair: 'اسود' },
    { name: 'اروين', anime: 'هجوم العمالقة', gender: 'ذكر', hair: 'اصفر' },
    { name: 'هيستوريا', anime: 'هجوم العمالقة', gender: 'انثى', hair: 'اصفر' },
    { name: 'راينر', anime: 'هجوم العمالقة', gender: 'ذكر', hair: 'اصفر' },
    { name: 'غابي', anime: 'هجوم العمالقة', gender: 'انثى', hair: 'بني' },
    
    // هنتر
    { name: 'غون', anime: 'هنتر', gender: 'ذكر', hair: 'اخضر' },
    { name: 'كيلوا', anime: 'هنتر', gender: 'ذكر', hair: 'ابيض' },
    { name: 'ليوريو', anime: 'هنتر', gender: 'ذكر', hair: 'اسود' },
    { name: 'كورابيكا', anime: 'هنتر', gender: 'ذكر', hair: 'اصفر' },
    { name: 'هيسوكا', anime: 'هنتر', gender: 'ذكر', hair: 'ازرق' },
    { name: 'بيسكي', anime: 'هنتر', gender: 'انثى', hair: 'اصفر' },
    { name: 'نيترو', anime: 'هنتر', gender: 'ذكر', hair: 'اصلع' },
    { name: 'الوكا', anime: 'هنتر', gender: 'انثى', hair: 'اسود' },
    { name: 'ايلومي', anime: 'هنتر', gender: 'ذكر', hair: 'اسود' },
    { name: 'بيتو', anime: 'هنتر', gender: 'انثى', hair: 'ابيض' },
    { name: 'كرولو', anime: 'هنتر', gender: 'ذكر', hair: 'اسود' },
    
    // رجل المنشار
    { name: 'ماكيما', anime: 'رجل المنشار', gender: 'انثى', hair: 'احمر' },
    { name: 'هيمينو', anime: 'رجل المنشار', gender: 'انثى', hair: 'اصفر' },
    { name: 'باور', anime: 'رجل المنشار', gender: 'انثى', hair: 'احمر' },
    { name: 'دينجي', anime: 'رجل المنشار', gender: 'ذكر', hair: 'اصفر' },
    { name: 'آكي', anime: 'رجل المنشار', gender: 'ذكر', hair: 'اسود' },
    
    // ديث نوت
    { name: 'لايت', anime: 'ديث نوت', gender: 'ذكر', hair: 'بني' },
    { name: 'إل', anime: 'ديث نوت', gender: 'ذكر', hair: 'اسود' },
    { name: 'ميسا', anime: 'ديث نوت', gender: 'انثى', hair: 'اصفر' },
    { name: 'ريم', anime: 'ديث نوت', gender: 'انثى', hair: 'ابيض' },
    
    // فينلاند ساغا
    { name: 'ثورفين', anime: 'فينلاند ساغا', gender: 'ذكر', hair: 'اصفر' },
    { name: 'ثوركيل', anime: 'فينلاند ساغا', gender: 'ذكر', hair: 'اصفر' },
    { name: 'ثورز', anime: 'فينلاند ساغا', gender: 'ذكر', hair: 'اسود' },
    { name: 'كنوت', anime: 'فينلاند ساغا', gender: 'ذكر', hair: 'اصفر' },
    { name: 'اشيلاد', anime: 'فينلاند ساغا', gender: 'ذكر', hair: 'اصفر' }
];

// ========== دالة الإجابة على الأسئلة ==========
function answerQuestion(question, character) {
    const q = question.toLowerCase();
    
    // سؤال عن الأنمي
    if (q.includes('من انمي') || q.includes('انمي')) {
        const animeName = q.replace(/من انمي|انمي/g, '').trim();
        if (animeName && character.anime.toLowerCase().includes(animeName)) {
            return '✅ نعم';
        }
        return '❌ لا';
    }
    
    // سؤال عن لون الشعر
    if (q.includes('لون الشعر') || q.includes('شعره') || q.includes('شعرها') || q.includes('شعر')) {
        const hairColor = q.replace(/لون الشعر|شعره|شعرها|شعر/g, '').trim();
        if (hairColor && character.hair.toLowerCase().includes(hairColor)) {
            return '✅ نعم';
        }
        return '❌ لا';
    }
    
    // سؤال عن الجنس
    if (q.includes('ذكر') || q.includes('انثى')) {
        if (character.gender === 'ذكر' && q.includes('ذكر')) return '✅ نعم';
        if (character.gender === 'انثى' && q.includes('انثى')) return '✅ نعم';
        return '❌ لا';
    }
    
    // سؤال عام
    return '❓ اسأل بـ "من انمي ...؟" أو "لون الشعر ...؟" أو "ذكر/انثى؟"';
}

// ========== التحقق من أن النص هو اسم شخصية ==========
function isCharacterName(text, character) {
    const name = text.trim().toLowerCase();
    return name === character.name.toLowerCase();
}

const activeGames = new Map();

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['شخصية'],
    description: '🎭 تخمين شخصية الأنمي عن طريق الأسئلة',
    category: 'فعاليات',
    
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        if (activeGames.has(chatId)) {
            await sendMessage(sock, chatId, [
                '⚠️ *يوجد لعبة نشطة*',
                '',
                '📌 انتظر حتى تنتهي اللعبة الحالية',
                '📌 أو اكتب "انسحب" للانسحاب'
            ], msg);
            return;
        }

        const points = loadJSON(pointsPath);
        const character = charactersDB[Math.floor(Math.random() * charactersDB.length)];
        
        let finished = false;
        let participants = [];
        let startTime = Date.now();
        let gameTimeout;

        // ===== رسالة البداية =====
        const startLines = [
            `🎭 *فعالية تخمين الشخصية* 🎭`,
            ``,
            `🕵️ *لدي شخصية أنمي في ذهني...*`,
            `📌 اكتشف من هي!`,
            ``,
            `📝 *قواعد اللعبة:*`,
            `• اكتب \`انضم\` خلال 30 ثانية للمشاركة`,
            `• اسأل أسئلة مثل:`,
            `  "من انمي ناروتو؟"`,
            `  "لون الشعر اصفر؟"`,
            `  "ذكر؟"`,
            `• اكتب اسم الشخصية مباشرة للتخمين`,
            `• أول من يخمن correctly يفوز بـ *500 نقطة*`,
            ``,
            `⏳ *فترة التسجيل:* 30 ثانية`,
            `⏰ *مدة اللعبة:* 3 دقائق`,
            `💰 *الجائزة:* 500 نقطة`,
            `⚠️ *الخسارة:* -50 نقطة عند انتهاء الوقت`
        ];

        await sendMessage(sock, chatId, startLines, msg);
        activeGames.set(chatId, true);

        const mainHandler = async ({ messages }) => {
            if (finished) return;
            for (const m of messages) {
                if (m.key.remoteJid !== chatId) continue;
                const senderMsg = m.key.participant || m.participant || m.key.remoteJid;
                if (senderMsg === sock.user.id) continue;
                
                const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                if (!txt.trim()) continue;

                const lower = txt.trim().toLowerCase();
                const original = txt.trim();

                // ===== مرحلة التسجيل =====
                if (Date.now() - startTime < 30000) {
                    if (lower === 'انضم') {
                        if (!participants.includes(senderMsg)) {
                            participants.push(senderMsg);
                            await sendMessage(sock, chatId, [
                                `✅ @${senderMsg.split('@')[0]} انضم للعبة!`,
                                `👥 عدد المشاركين: ${participants.length}`
                            ], m, [senderMsg]);
                        } else {
                            await sendMessage(sock, chatId, [
                                `⚠️ @${senderMsg.split('@')[0]} مسجل بالفعل`
                            ], m, [senderMsg]);
                        }
                    }
                    continue;
                }

                // ===== بدء اللعبة =====
                if (Date.now() - startTime >= 30000 && !finished && participants.length > 0 && !gameTimeout) {
                    await sendMessage(sock, chatId, [
                        `🎬 *بدأت اللعبة!*`,
                        ``,
                        `👥 المشاركون: ${participants.length}`,
                        `⏳ المدة: 3 دقائق`,
                        `💡 اطرح أسئلتك أو خمن مباشرة`,
                        `📝 اكتب اسم الشخصية للتخمين`
                    ]);
                    
                    gameTimeout = setTimeout(async () => {
                        if (finished) return;
                        finished = true;
                        sock.ev.off('messages.upsert', mainHandler);
                        
                        const lines = [
                            `⏰ *انتهى الوقت!*`,
                            ``,
                            `💡 الشخصية كانت: *${character.name}*`,
                            `🎭 من انمي: *${character.anime}*`,
                            `👤 الجنس: ${character.gender}`,
                            `🦱 لون الشعر: ${character.hair}`,
                            ``,
                            `📉 *تم خصم 50 نقطة من كل مشارك:*`
                        ];
                        
                        for (const p of participants) {
                            points[p] = (points[p] || 0) - 50;
                            lines.push(`   @${p.split('@')[0]} → ${points[p] || 0} نقطة`);
                        }
                        
                        saveJSON(pointsPath, points);
                        await sendMessage(sock, chatId, lines, null, participants);
                        activeGames.delete(chatId);
                    }, 180000);
                }

                // ===== مرحلة اللعبة =====
                if (Date.now() - startTime >= 30000 && !finished) {
                    
                    // ===== انضمام متأخر =====
                    if (!participants.includes(senderMsg)) {
                        if (lower === 'انضم') {
                            participants.push(senderMsg);
                            await sendMessage(sock, chatId, [
                                `✅ @${senderMsg.split('@')[0]} انضم متأخراً!`,
                                `👥 عدد المشاركين: ${participants.length}`
                            ], m, [senderMsg]);
                        }
                        continue;
                    }

                    // ===== انسحاب =====
                    if (lower === 'انسحب' || lower === 'انسحاب') {
                        participants = participants.filter(p => p !== senderMsg);
                        await sendMessage(sock, chatId, [
                            `🚪 @${senderMsg.split('@')[0]} انسحب`,
                            `👥 المتبقي: ${participants.length}`
                        ], m, [senderMsg]);
                        
                        if (participants.length === 0) {
                            finished = true;
                            clearTimeout(gameTimeout);
                            sock.ev.off('messages.upsert', mainHandler);
                            await sendMessage(sock, chatId, ['❌ لم يبق أي مشارك، تم إنهاء اللعبة.']);
                            activeGames.delete(chatId);
                        }
                        continue;
                    }

                    // ===== تخمين مباشر (أي كلمة يكتبها = تخمين) =====
                    // التحقق من أن النص ليس سؤالاً
                    const isQuestion = lower.includes('من انمي') || 
                                      lower.includes('انمي') || 
                                      lower.includes('لون الشعر') || 
                                      lower.includes('شعر') || 
                                      lower.includes('ذكر') || 
                                      lower.includes('انثى') ||
                                      lower.includes('؟');
                    
                    if (!isQuestion) {
                        // أي نص غير سؤال يعتبر تخمين
                        const guess = original.trim();
                        
                        if (guess.toLowerCase() === character.name.toLowerCase()) {
                            finished = true;
                            clearTimeout(gameTimeout);
                            sock.ev.off('messages.upsert', mainHandler);
                            
                            points[senderMsg] = (points[senderMsg] || 0) + 500;
                            saveJSON(pointsPath, points);
                            
                            const winLines = [
                                `🎉 *إجابة صحيحة!* 🎉`,
                                ``,
                                `🏆 *الفائز:* @${senderMsg.split('@')[0]}`,
                                `💡 *الشخصية:* ${character.name}`,
                                `🎭 *الانمي:* ${character.anime}`,
                                `👤 *الجنس:* ${character.gender}`,
                                `🦱 *لون الشعر:* ${character.hair}`,
                                ``,
                                `⭐ *المكافأة:* +500 نقطة`,
                                `📊 *رصيدك:* ${points[senderMsg]} نقطة`,
                                `🎖️ *رتبتك:* ${getLevel(points[senderMsg])}`,
                                ``,
                                `🥳 تهانينا!`
                            ];
                            
                            await sendMessage(sock, chatId, winLines, m, [senderMsg]);
                            activeGames.delete(chatId);
                            return;
                        } else {
                            // تخمين خاطئ
                            await sendMessage(sock, chatId, [
                                `❌ @${senderMsg.split('@')[0]}، تخمين خاطئ!`,
                                `💡 "${guess}" ليست الشخصية الصحيحة`,
                                `📝 حاول مرة أخرى`
                            ], m, [senderMsg]);
                            continue;
                        }
                    }

                    // ===== أسئلة =====
                    const answer = answerQuestion(lower, character);
                    await sendMessage(sock, chatId, [
                        `🤖 @${senderMsg.split('@')[0]} ${answer}`
                    ], m, [senderMsg]);
                }
            }
        };

        sock.ev.on('messages.upsert', mainHandler);

        // ===== إلغاء الفعالية إذا لم ينضم أحد =====
        setTimeout(async () => {
            if (finished) return;
            if (participants.length === 0) {
                finished = true;
                sock.ev.off('messages.upsert', mainHandler);
                await sendMessage(sock, chatId, ['❌ لم ينضم أي لاعب، تم إلغاء الفعالية.']);
                activeGames.delete(chatId);
            }
        }, 30000);
    }
};
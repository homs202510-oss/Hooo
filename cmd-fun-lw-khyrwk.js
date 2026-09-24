// لو.js - لعبة لو خيروك مع نسب ثابتة تظهر بعد الاختيار
const fs = require('fs');
const path = require('path');

const answeredMap = new Map();

// ========== قائمة الأسئلة مع الخيارات والنسب الثابتة ==========
const questions = [
    {
        q: "لو خيروك تعيش 100 عام بسعادة أو 200 عام بحزن؟",
        options: ["100 عام بسعادة", "200 عام بحزن"],
        percentage: [80, 20]
    },
    {
        q: "لو خيروك تكون غنياً لكن وحيداً أو فقيراً لكن محبوباً؟",
        options: ["غني ووحيد", "فقير ومحبوب"],
        percentage: [30, 70]
    },
    {
        q: "لو خيروك تعرف الحقيقة كاملة أو تعيش في سعادة جهل؟",
        options: ["معرفة الحقيقة", "سعادة الجهل"],
        percentage: [45, 55]
    },
    {
        q: "لو خيروك تكون مشهوراً عالمياً أو تعيش حياة هادئة؟",
        options: ["شهرة عالمية", "حياة هادئة"],
        percentage: [25, 75]
    },
    {
        q: "لو خيروك تمتلك القدرة على الطيران أو القراءة في العقول؟",
        options: ["الطيران", "قراءة العقول"],
        percentage: [60, 40]
    },
    {
        q: "لو خيروك تكون أذكى شخص في العالم أو أقوى شخص في العالم؟",
        options: ["أذكى شخص", "أقوى شخص"],
        percentage: [55, 45]
    },
    {
        q: "لو خيروك تسافر للماضي وتغير شيء أو تسافر للمستقبل وترى ماذا سيحدث؟",
        options: ["السفر للماضي", "السفر للمستقبل"],
        percentage: [70, 30]
    },
    {
        q: "لو خيروك تعيش في عالم ناروتو أو عالم ون بيس؟",
        options: ["عالم ناروتو", "عالم ون بيس"],
        percentage: [55, 45]
    },
    {
        q: "لو خيروك تكون بطلًا في أنمي أو تستمتع بمشاهدته فقط؟",
        options: ["بطل أنمي", "مشاهد فقط"],
        percentage: [65, 35]
    },
    {
        q: "لو خيروك تأكل طعامك المفضل كل يوم أو تأكل طعاماً صحياً فقط？",
        options: ["طعامي المفضل", "طعام صحي"],
        percentage: [80, 20]
    },
    {
        q: "لو خيروك تكون محبوب من الجميع أو تكون ناجح في عملك؟",
        options: ["محبوب من الجميع", "ناجح في العمل"],
        percentage: [50, 50]
    },
    {
        q: "لو خيروك تضحي بحياتك لإنقاذ عائلة أو تضحي بعائلتك لإنقاذ العالم؟",
        options: ["التضحية بالنفس", "التضحية بالعائلة"],
        percentage: [75, 25]
    },
    {
        q: "لو خيروك تعيش في سلام داخلي أو تعيش في رخاء مادي؟",
        options: ["سلام داخلي", "رخاء مادي"],
        percentage: [60, 40]
    },
    {
        q: "لو خيروك تكون صادق دائماً أو تكون ناجح دائماً？",
        options: ["الصدق الدائم", "النجاح الدائم"],
        percentage: [45, 55]
    },
    {
        q: "لو خيروك تعيش في عالم سحري أو عالم تكنولوجي متقدم؟",
        options: ["عالم سحري", "عالم تكنولوجي"],
        percentage: [50, 50]
    },
    {
        q: "لو خيروك تكون ملكاً أو تكون ساحراً عظيماً？",
        options: ["ملك", "ساحر عظيم"],
        percentage: [40, 60]
    },
    {
        q: "لو خيروك تمتلك قلعة أو تمتلك جزيرة خاصة؟",
        options: ["قلعة", "جزيرة خاصة"],
        percentage: [35, 65]
    },
    {
        q: "لو خيروك تقابل شخصيات تاريخية أو شخصيات خيالية？",
        options: ["شخصيات تاريخية", "شخصيات خيالية"],
        percentage: [45, 55]
    },
    {
        q: "لو خيروك تكون لاعب كرة قدم شهير أو لاعب كرة سلة محترف？",
        options: ["كرة قدم", "كرة سلة"],
        percentage: [75, 25]
    },
    {
        q: "لو خيروك تربح الميدالية الذهبية الأولمبية أو كأس العالم؟",
        options: ["ميدالية أولمبية", "كأس العالم"],
        percentage: [35, 65]
    },
    {
        q: "لو خيروك تكون مدرب فريق أحلامك أو تكون لاعب في الفريق؟",
        options: ["مدرب", "لاعب"],
        percentage: [30, 70]
    },
    {
        q: "لو خيروك تأكل بيتزا كل يوم أو تأكل شوكولاتة كل يوم؟",
        options: ["بيتزا", "شوكولاتة"],
        percentage: [50, 50]
    },
    {
        q: "لو خيروك تشرب قهوة أو تشاي كل يوم？",
        options: ["قهوة", "شاي"],
        percentage: [60, 40]
    },
    {
        q: "لو خيروك تسافر إلى الفضاء أو تسافر إلى أعماق المحيط؟",
        options: ["الفضاء", "أعماق المحيط"],
        percentage: [55, 45]
    },
    {
        q: "لو خيروك تزور الأهرامات أو تزور سور الصين العظيم؟",
        options: ["الأهرامات", "سور الصين"],
        percentage: [50, 50]
    },
    {
        q: "لو خيروك تكون ابن وحيد أو يكون لديك 10 أخوات؟",
        options: ["ابن وحيد", "10 أخوات"],
        percentage: [25, 75]
    },
    {
        q: "لو خيروك تكون أقرب لأمك أو لأبيك？",
        options: ["أقرب لأمي", "أقرب لأبي"],
        percentage: [65, 35]
    },
    {
        q: "لو خيروك تربي 5 أطفال أو تربي 5 قطط؟",
        options: ["5 أطفال", "5 قطط"],
        percentage: [40, 60]
    },
    {
        q: "لو خيروك تضحك طوال اليوم أو تبكي طوال اليوم؟",
        options: ["ضحك طوال اليوم", "بكاء طوال اليوم"],
        percentage: [95, 5]
    },
    {
        q: "لو خيروك تنام 12 ساعة يومياً أو تنام 4 ساعات فقط？",
        options: ["12 ساعة نوم", "4 ساعات نوم"],
        percentage: [85, 15]
    },
    {
        q: "لو خيروك تعيش في فيلم رعب أو فيلم كوميدي？",
        options: ["فيلم رعب", "فيلم كوميدي"],
        percentage: [15, 85]
    },
    {
        q: "لو خيروك تكون ممثل مشهور أو مخرج مشهور؟",
        options: ["ممثل", "مخرج"],
        percentage: [50, 50]
    },
    {
        q: "لو خيروك تكتب كتاب أو ترسم لوحة فنية？",
        options: ["كتابة كتاب", "رسم لوحة"],
        percentage: [45, 55]
    },
    {
        q: "لو خيروك تغني أمام جمهور كبير أو تلقي خطاب أمام عالم؟",
        options: ["الغناء أمام جمهور", "إلقاء خطاب"],
        percentage: [40, 60]
    },
    {
        q: "لو خيروك تمتلك الشارينغان أو الجيتسو الضوئي؟",
        options: ["الشارينغان", "الجيتسو الضوئي"],
        percentage: [55, 45]
    },
    {
        q: "لو خيروك تقاتل بجانب ناروتو أو بجانب لوفي؟",
        options: ["ناروتو", "لوفي"],
        percentage: [50, 50]
    },
    {
        q: "لو خيروك تكون رئيس قراصنة أو نينجا خارق？",
        options: ["رئيس قراصنة", "نينجا خارق"],
        percentage: [45, 55]
    },
    {
        q: "لو خيروك تمتلك عين شيطانية أو قلب تنين؟",
        options: ["عين شيطانية", "قلب تنين"],
        percentage: [55, 45]
    },
    {
        q: "لو خيروك تقاتل مع إيتاتشي أو مع مادارا？",
        options: ["إيتاتشي", "مادارا"],
        percentage: [70, 30]
    },
    {
        q: "لو خيروك تمتلك فاكهة شيطان أو تقنية نينجا؟",
        options: ["فاكهة شيطان", "تقنية نينجا"],
        percentage: [45, 55]
    },
    {
        q: "لو خيروك تكون سايان أو تكون نينجا？",
        options: ["سايان", "نينجا"],
        percentage: [40, 60]
    },
    {
        q: "لو خيروك تمتلك سيف الزانباكوتو أو الروح الشيطانية؟",
        options: ["زانباكوتو", "روح شيطانية"],
        percentage: [50, 50]
    },
    {
        q: "لو خيروك تعيش بلا إنترنت أو بلا كهرباء？",
        options: ["بلا إنترنت", "بلا كهرباء"],
        percentage: [55, 45]
    },
    {
        q: "لو خيروك تفقد الذاكرة أو تفقد البصر？",
        options: ["فقدان الذاكرة", "فقدان البصر"],
        percentage: [60, 40]
    },
    {
        q: "لو خيروك تكون بلا مشاعر أو بلا ذكريات？",
        options: ["بلا مشاعر", "بلا ذكريات"],
        percentage: [45, 55]
    },
    {
        q: "لو خيروك تعيش في منزل كبير مع عائلة صغيرة أو منزل صغير مع عائلة كبيرة？",
        options: ["منزل كبير وعائلة صغيرة", "منزل صغير وعائلة كبيرة"],
        percentage: [30, 70]
    },
    {
        q: "لو خيروك تسافر حول العالم كله أو تشتري منزل أحلامك？",
        options: ["السفر حول العالم", "منزل الأحلام"],
        percentage: [55, 45]
    }
];

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🌀 لـو خـيـروك 🌀\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== دالة بناء شريط النسب ==========
function buildBar(percent, length = 20) {
    const filled = Math.round((percent / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '▒'.repeat(empty);
}

module.exports = {
    command: 'لو',
    description: '🌀 لعبة لو خيروك - اختر 1 أو 2 وشاهد النسبة',
    usage: '.لو',
    category: 'تسلية',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {

            if (!chatId.endsWith('@g.us')) {
                await sendMessage(sock, chatId, [
                    '❌ هذا الأمر يعمل فقط في المجموعات.'
                ], msg);
                return;
            }

            // اختيار سؤال عشوائي
            const questionData = questions[Math.floor(Math.random() * questions.length)];
            const questionId = Date.now().toString();

            // تخزين السؤال
            answeredMap.set(questionId, {
                question: questionData,
                answered: false,
                chatId: chatId
            });

            // إرسال السؤال
            const lines = [
                `📋 *${questionData.q}*`,
                ``,
                `1️⃣ ${questionData.options[0]}`,
                `2️⃣ ${questionData.options[1]}`,
                ``,
                `📌 اكتب 1 أو 2 لمعرفة النسبة`
            ];

            await sendMessage(sock, chatId, lines, msg);

            // ===== مراقبة الردود =====
            const handler = async ({ messages }) => {
                for (const m of messages) {
                    if (m.key.remoteJid !== chatId) continue;
                    const sender = m.key.participant || m.participant || m.key.remoteJid;
                    const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                    if (!txt.trim()) continue;

                    const content = txt.trim();
                    const data = answeredMap.get(questionId);
                    if (!data || data.answered) continue;

                    if (data.chatId !== chatId) continue;

                    let choice = 0;
                    if (content === '1') choice = 1;
                    else if (content === '2') choice = 2;
                    else continue;

                    // منع التكرار
                    data.answered = true;
                    answeredMap.set(questionId, data);

                    // إيقاف الاستماع
                    sock.ev.off('messages.upsert', handler);

                    // النسبة الخاصة بالخيار
                    const percent = data.question.percentage[choice - 1];
                    const selectedOption = data.question.options[choice - 1];
                    const otherOption = data.question.options[choice === 1 ? 1 : 0];
                    const otherPercent = data.question.percentage[choice === 1 ? 1 : 0];

                    // بناء شريط النسب
                    const bar1 = buildBar(percent);
                    const bar2 = buildBar(otherPercent);

                    const resultLines = [
                        `✅ @${sender.split('@')[0]} اختار: ${selectedOption}`,
                        ``,
                        `📊 *نسبة اختيارك:*`,
                        ``,
                        `📌 ${selectedOption}`,
                        `   👤 ${percent}% من الناس اختاروا هذا`,
                        `   ${bar1}`,
                        ``,
                        `📌 ${otherOption}`,
                        `   👤 ${otherPercent}% من الناس اختاروا هذا`,
                        `   ${bar2}`,
                        ``,
                        `📝 أنت ضمن الـ ${percent}% 🎯`
                    ];

                    await sendMessage(sock, chatId, resultLines, m, [sender]);

                    // حذف السؤال بعد 10 ثواني
                    setTimeout(() => {
                        answeredMap.delete(questionId);
                    }, 10000);
                }
            };

            sock.ev.on('messages.upsert', handler);

            // مهلة 30 ثانية
            setTimeout(() => {
                const data = answeredMap.get(questionId);
                if (data && !data.answered) {
                    data.answered = true;
                    sock.ev.off('messages.upsert', handler);
                    
                    sendMessage(sock, chatId, [
                        '⏰ انتهى الوقت!',
                        '📊 لم يختر أحد.',
                        '📌 حاول مرة أخرى مع .لو'
                    ], msg);
                    
                    answeredMap.delete(questionId);
                }
            }, 30000);

        } catch (error) {
            console.error('✗ خطأ في أمر لو:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};
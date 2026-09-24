// تنمر.js - إرسال تنمر لشخص تم منشنه أو الرد عليه (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['تنمر'],
    description: '🫣 إرسال تنمر لشخص تم منشنه أو الرد عليه',
    usage: '.تنمر @منشن | .تنمر (رد على رسالة)',
    category: 'تسلية',

    async execute(sock, msg) {
        try {
            // تفاعل أولي
            await sock.sendMessage(msg.key.remoteJid, {
                react: { text: '🫣', key: msg.key }
            });

            const roastLines = [
                "🫣 العالم كله كان يمثل أن هناك مرض اسمه كورونا لكي تغطي وجهك القبيح.",
                "🫣 وجهك عامل زي الغيمة… كل ما يظهر، الشمس تختفي والناس تتخبّى.",
                "🫣 لو كان القبح فيروس، العالم كله كان هينقرض من زمان وانت السبب.",
                "🫣 الناس محتاجين تطبيق جديد… يحذرهم قبل ما يشوفوا وجهك.",
                "🫣 وجهك عامل زي ظلام الليل… كل ما يظهر، النور يختفي.",
                "🫣 لو كانت الابتسامة قاتلة، ابتسامتك هتكون نهاية البشرية كلها.",
                "🫣 وجهك عامل زي فيلم رعب… كل ما يظهر، الأطفال يبكوا والكل يهرب.",
                "🫣 مش محتاج ماسك ضد الأمراض، محتاج درع واقي من نظرات الناس اللي شايفة وجهك.",
                "🫣 لو كان القبح مهارة، كنت هتكون معلم عالمي… والناس تجي تتعلم منك كل يوم.",
                "🫣 لو الغباء له شكل… غالباً بيكون صورتك الشخصية.",
                "🫣 وجودك يخلي الواي فاي يفصل من الإحراج.",
                "🫣 حتى المراية تستأذن قبل ما تعكسك.",
                "🫣 لما تتكلم أحس زر كتم الصوت اختراع عظيم.",
                "🫣 شكلك يخلي الفلاتر تستقيل.",
                "🫣 أنت دليل حي إن الصدفة أحياناً تكون خطأ.",
                "🫣 حتى الظل تبعك يحاول يبعد عنك.",
                "🫣 حضورك يخلّي الصمت خيار فاخر.",
                "🫣 لو في بطولة للإحراج… أنت الكأس والملعب.",
                "🫣 وجهك يحتاج تحديث إصدار عاجل.",
                "🫣 شكلك يخلي الليل يطلب إضاءة إضافية.",
                "🫣 صوتك زي المنبه… الكل يريد يسكته بسرعة.",
                "🫣 أنت مو غريب… أنت إصدار تجريبي فاشل.",
                "🫣 حتى الحظ لما يشوفك يغير الطريق.",
                "🫣 لو النظرات تقتل كان خلصت نفسك.",
                "🫣 أنت سبب اختراع التجاهل.",
                "🫣 وجودك يخلّي الصدف تتحول كوابيس.",
                "🫣 دماغك واضح عليه إجازة مفتوحة.",
                "🫣 لو كان التخلف رياضة، كنت بطل العالم.",
                "🫣 أنت مثل الجدار، ثابت بس ما له فايدة.",
                "🫣 وجودك في المجموعة مثل الإعلانات، ما حد يطلبه.",
                "🫣 أنت مثل كابلات الشاحن، طولك كبير بس ما تشحن.",
                "🫣 حضورك مثل فخ، يدخل الواحد ويفقد مزاجه.",
                "🫣 أنت مثل ورق التواليت، كل ما نحتاجك نندم.",
                "🫣 حتى الحزن يبتعد عنك لأنه يقول: هذا كثير."
            ];

            let targetJid = null;
            let quotedMessageId = null;

            const context = msg.message?.extendedTextMessage?.contextInfo;

            // تحديد الهدف
            if (context?.quotedMessage) {
                targetJid = context.participant;
                quotedMessageId = context.stanzaId;
            } else if (context?.mentionedJid?.length > 0) {
                targetJid = context.mentionedJid[0];
            } else {
                // التحقق من وجود منشن في النص
                const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                const mentionMatch = fullText.match(/@(\d+)/);
                if (mentionMatch) {
                    targetJid = `${mentionMatch[1]}@s.whatsapp.net`;
                }
            }

            if (!targetJid) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: "❌ لازم تمنشن شخص أو ترد على رسالة.\n📝 مثال: .تنمر @منشن"
                }, { quoted: msg });
                return;
            }

            // التأكد من صيغة الـ JID
            if (!targetJid.includes('@')) {
                targetJid = `${targetJid}@s.whatsapp.net`;
            }

            const randomRoast = roastLines[Math.floor(Math.random() * roastLines.length)];

            // ===== إرسال الرسالة =====
            if (quotedMessageId) {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    { text: randomRoast },
                    {
                        quoted: {
                            key: {
                                remoteJid: msg.key.remoteJid,
                                id: quotedMessageId,
                                participant: targetJid
                            },
                            message: { conversation: "Original Message" }
                        }
                    }
                );
            } else {
                const lines = [
                    '🫣 *تنمر*',
                    '',
                    `@${targetJid.split('@')[0]} ${randomRoast}`
                ];

                let msgText = `🫣 تـنـمـر 🫣\n`;
                msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
                for (const line of lines) {
                    msgText += `${line}\n`;
                }
                msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
                msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text: msgText,
                        mentions: [targetJid]
                    },
                    { quoted: msg }
                );
            }

        } catch (error) {
            console.error('❌ خطأ في أمر تنمر:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ صار خطأ: ${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};
// ذل.js - يذل الشخص المذكور أو الشخص الذي تم الرد على رسالته (مزاح) - نسخة محسنة
module.exports = {
    command: ['ذل', 'اهانه', 'اهانة'],
    category: 'تحرش',
    description: '😅 يذل الشخص المذكور أو الشخص الذي تم الرد على رسالته (مزاح)',
    usage: '.ذل @منشن | .ذل (رد على رسالة)',

    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;

            if (!chatId.endsWith('@g.us')) {
                await sock.sendMessage(chatId, {
                    text: '🚫 هذا الأمر يعمل فقط في المجموعات!'
                }, { quoted: m });
                return;
            }

            // الحصول على الشخص الممنشن
            const mentionedJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            // إذا كان الرد على رسالة، نحدد صاحب الرسالة
            const repliedJid = m.message?.extendedTextMessage?.contextInfo?.participant;

            let target;

            if (mentionedJids.length > 0) {
                target = mentionedJids[0];
            } else if (repliedJid) {
                target = repliedJid;
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ استخدم الأمر مع منشن أو رد على رسالة شخص!\n📝 مثال: .ذل @الشخص أو رد على رسالته'
                }, { quoted: m });
                return;
            }

            // التأكد من صيغة الـ JID
            if (!target.includes('@')) {
                target = `${target}@s.whatsapp.net`;
            }

            const insults = [
                "😅 ياخي لو كانت الغباء رياضة، كنت بطل العالم.",
                "🫠 وجودك في المجموعة مثل الإعلانات، ما حد يطلبه.",
                "🧱 أنت مثل الجدار، ثابت بس ما له فايدة.",
                "🫢 كل ما تتكلم تزيد الضوضاء، ما تزيد الفائدة.",
                "🫨 مو أنت المشكلة، المشكلة إنك موجود.",
                "🤦‍♂️ أنت مثل كابلات الشاحن، طولك كبير بس ما تشحن.",
                "🪫 وجودك يطفي جو المكان بسرعة.",
                "🧊 أنت بارد لدرجة يذوب الثلج من حولك.",
                "😴 كلامك ينام عليه الناس قبل ما ينتهي.",
                "🪤 حضورك مثل فخ، يدخل الواحد ويفقد مزاجه.",
                "🧻 أنت مثل ورق التواليت، كل ما نحتاجك نندم.",
                "🧟‍♂️ لو كان في زحمة ذبابة، أنت بتكون مديرها.",
                "🧿 حتى الحزن يبتعد عنك لأنه يقول: هذا كثير.",
                "🧨 أنت مثل الفتيل، تنفجر بس ما تسوي شي مفيد.",
                "🐌 أنت بطيء حتى في التهكم.",
                "🪞 أنت تعكس شي واحد: الخيبة.",
                "🧯 أنت مثل طفاية الحريق، موجود بس ما تنفع.",
                "🧩 أنت قطعة ناقصة من لغز ما ينحل.",
                "🧠 عندك ذكاك... بس في النوم فقط.",
                "🧨 وجودك يسبب فوضى بدون سبب.",
                "🧊 أنت مثل الثلج، بارد ومزعج.",
                "🌪️ لو كان في عاصفة، أنت بتكون الهوا فقط.",
                "📌 أنت مثل الدبوس، بس ما تثبت شي.",
                "🦗 صوتك يزعج مثل صرصر الليل.",
                "🧶 أنت مثل الخيط الممزق، ما يثبت شي.",
                "🧠 إذا كان عندك عقل، فهذيه غلطة المصنع.",
                "🧟‍♀️ أنت نسخة مكررة من فشل واحد.",
                "🪑 أنت مثل الكرسي الفارغ، محد يبغى يقعد جنبك.",
                "📺 أنت مثل التلفاز القديم، صورة بس بدون فائدة.",
                "🧊 أنت أبرد من ثلج القطب الجنوبي.",
                "🪁 أنت مثل الطائرة الورقية، تطير بس ما توصل.",
                "🕳️ أنت مثل الحفرة، كل ما تقرب منها تزيد الطين بلة."
            ];

            const randomInsult = insults[Math.floor(Math.random() * insults.length)];

            const lines = [
                '',
                '',
                `⚠️ @${target.split('@')[0]}، ${randomInsult}`
            ];

            let msgText = ``;
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            for (const line of lines) {
                msgText += `${line}\n`;
            }
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

            await sock.sendMessage(chatId, {
                text: msgText,
                mentions: [target]
            }, { quoted: m });

        } catch (error) {
            console.error('❌ خطأ في أمر ذل:', error);
            await sock.sendMessage(m.key.remoteJid, {
                text: '❌ حدث خطأ أثناء تنفيذ الأمر.'
            }, { quoted: m });
        }
    }
};
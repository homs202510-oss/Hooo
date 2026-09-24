// تهكير.js - أمر ترفيهي لمحاكاة عملية اختراق مع تعديل الرسائل

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `👾 تـهـكـيـر 👾\n`;
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

// ========== دالة استخراج الهدف ==========
function getTargetJid(msg) {
    try {
        if (!msg?.message) return null;
        const message = msg.message;

        const ctx = message.extendedTextMessage?.contextInfo;
        if (ctx?.mentionedJid?.length) return ctx.mentionedJid[0];
        if (ctx?.participant) return ctx.participant;
        if (ctx?.quotedMessage?.participant) return ctx.quotedMessage.participant;
        if (ctx?.quotedMessage?.extendedTextMessage?.contextInfo?.participant) 
            return ctx.quotedMessage.extendedTextMessage.contextInfo.participant;

        if (msg.mentionedJid?.length) return msg.mentionedJid[0];
        if (msg.quoted?.sender) return msg.quoted.sender;
        if (msg.quotedMessage?.sender) return msg.quotedMessage.sender;
        if (msg.key?.participant) return msg.key.participant;

        return null;
    } catch (e) {
        return null;
    }
}

// ========== دالة استخراج الرقم من الـ JID ==========
function extractNumber(jid) {
    try {
        let num = jid.split('@')[0];
        if (num.startsWith('lid:')) num = num.replace('lid:', '');
        if (num.startsWith('0:')) num = num.replace('0:', '');
        const match = num.match(/(\d+)/);
        return match ? match[0] : num;
    } catch {
        return jid;
    }
}

// ========== دالة تنسيق الرقم ==========
function formatNumber(jid) {
    try {
        let num = extractNumber(jid);
        if (num.startsWith('20')) return `+20 ${num.slice(2)}`;
        else if (num.startsWith('966')) return `+966 ${num.slice(3)}`;
        else if (num.startsWith('971')) return `+971 ${num.slice(3)}`;
        else if (num.startsWith('30')) return `+30 ${num.slice(2)}`;
        else if (num.startsWith('90')) return `+90 ${num.slice(2)}`;
        else if (num.startsWith('34')) return `+34 ${num.slice(2)}`;
        else if (num.startsWith('44')) return `+44 ${num.slice(2)}`;
        else if (num.startsWith('1')) return `+1 ${num.slice(1)}`;
        else if (num.startsWith('91')) return `+91 ${num.slice(2)}`;
        else if (num.startsWith('92')) return `+92 ${num.slice(2)}`;
        else if (num.startsWith('55')) return `+55 ${num.slice(2)}`;
        else if (num.startsWith('33')) return `+33 ${num.slice(2)}`;
        else return `+${num}`;
    } catch {
        return jid;
    }
}

module.exports = {
    command: ['تهكير', 'اختراق', 'هكر'],
    description: '👾 محاكاة لعملية اختراق ترفيهية للمستخدمين',
    usage: '.تهكير [منشن | رقم | رد]',
    category: 'نظام',

    async execute(sock, msg, args) {
        try {
            const chatId = msg.key.remoteJid;
            const devID = require('./config').ownerNumber + '@s.whatsapp.net';

            // ===== تحديد الهدف =====
            let targetJid = getTargetJid(msg);
            if (!targetJid) {
                const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                const argsList = body.trim().split(/\s+/).slice(1);
                if (argsList.length > 0) {
                    const cleaned = argsList[0].replace(/\D/g, '');
                    if (cleaned) targetJid = `${cleaned}@s.whatsapp.net`;
                }
            }

            if (!targetJid) {
                await sendMessage(sock, chatId, [
                    '❌ *يرجى تحديد المستهدف*',
                    '',
                    '📝 *طرق الاستخدام:*',
                    '1️⃣ ارد على رسالة الشخص: `.تهكير`',
                    '2️⃣ اكتب مع منشن: `.تهكير @الشخص`',
                    '3️⃣ اكتب الرقم: `.تهكير 123456789`'
                ], msg);
                return;
            }

            if (targetJid === devID) {
                await sendMessage(sock, chatId, [
                    '❌ *ممنوع تهكير المطور* 🛡️',
                    '',
                    '⚠️ لا يمكن تهكير المطور الأساسي!'
                ], msg);
                return;
            }

            const number = extractNumber(targetJid);
            const formattedNumber = formatNumber(targetJid);

            // ===== رسالة البدء (سيتم تعديلها لاحقاً) =====
            const startMsg = await sock.sendMessage(chatId, {
                text: `👾 تـهـكـيـر 👾\n━━━━━━━━━━━━━━━━━━━━\n💣 *تم بدء عملية الاختراق*\n\n🎯 *المستهدف:* @${number}\n📱 *الرقم:* ${formattedNumber}\n\n⏳ جاري تنفيذ الاختراق...\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`,
                mentions: [targetJid]
            }, { quoted: msg });

            // ===== مراحل التحميل (سيتم تعديل النص فيها) =====
            const loadingStages = [
                "📡 *جاري الاتصال بالخادم...*",
                "🔍 *جاري تحديد موقع الهدف...*",
                "🔄 *جاري اختراق الشبكة...* ▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 5%",
                "📁 *جاري تحميل الصور...* ▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒ 15%",
                "📸 *تم تحميل الصور* ▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒ 25%",
                "🎬 *جاري تحميل الفيديوهات...* ▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒ 35%",
                "🎥 *تم تحميل الفيديوهات* ▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒ 45%",
                "🎵 *جاري تحميل الملفات الصوتية...* ▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒ 55%",
                "🔊 *تم تحميل الملفات الصوتية* ▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒ 65%",
                "📄 *جاري تحميل الملفات...* ▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒ 75%",
                "📑 *تم تحميل الملفات* ▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒ 85%",
                "💬 *جاري تحميل محادثات الواتساب...* ▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒ 90%",
                "📨 *تم تحميل المحادثات* ▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒ 93%",
                "🖥️ *جاري رفع البيانات على السيرفر...* ▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒ 95%",
                "🔐 *جاري فك تشفير البيانات...* ▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒ 97%",
                "✅ *اكتمل الاختراق بنجاح* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%",
                "💾 *جاري حفظ بيانات الضحية...* ⌛",
                "✅ *تم حفظ بيانات الضحية بنجاح*"
            ];

            // ===== تعديل الرسالة في كل مرحلة =====
            for (const stage of loadingStages) {
                await new Promise(resolve => setTimeout(resolve, 1200));
                const updatedText = `👾 تـهـكـيـر 👾\n━━━━━━━━━━━━━━━━━━━━\n💣 *تم بدء عملية الاختراق*\n\n🎯 *المستهدف:* @${number}\n📱 *الرقم:* ${formattedNumber}\n\n${stage}\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
                await sock.sendMessage(chatId, {
                    text: updatedText,
                    edit: startMsg.key,
                    mentions: [targetJid]
                });
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            // ===== الرسالة النهائية (مع منشن) =====
            const finalText = `👾 تـهـكـيـر 👾\n━━━━━━━━━━━━━━━━━━━━\n👾 *تم اختراقك بنجاح* ✅\n\n🎯 *الهدف:* @${number}\n📱 *الرقم:* ${formattedNumber}\n\n📁 *البيانات المسروقة:*\n├ 📸 الصور الشخصية\n├ 🎬 الفيديوهات\n├ 🔊 الملفات الصوتية\n├ 📄 الملفات الخاصة\n└ 💬 محادثات الواتساب\n\n🔒 *نصيحة:* حافظ على أمان حسابك\n├ استخدم كلمة مرور قوية\n└ فعّل التحقق بخطوتين\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
            await sock.sendMessage(chatId, {
                text: finalText,
                edit: startMsg.key,
                mentions: [targetJid]
            });

        } catch (error) {
            console.error('❌ خطأ في أمر التهكير:', error);
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
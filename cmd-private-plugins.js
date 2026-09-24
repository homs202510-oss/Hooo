// بلجن.js - نظام إدارة البلجنات (الإضافات) - للأونر فقط

const fs = require('fs');
const path = require('path');
const hay = require('./lib-roles');

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🔌 إدارة الـبـلـجـنـات 🔌\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== دالة حساب التشابه بين الكلمات ==========
function getSimilarity(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) {
        const longer = Math.max(a.length, b.length);
        const shorter = Math.min(a.length, b.length);
        return shorter / longer;
    }
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    let distance = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] !== b[i]) distance++;
    }
    distance += Math.abs(a.length - b.length);
    return 1 - (distance / maxLen);
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['بلجن', 'امر'],
    description: '🔌 نظام إدارة البلجنات - إضافة، حذف، بحث، قائمة',
    category: 'خاصة',
    usage: '.بلجن [اضف|حذف|بحث|قائمة] [الاسم]',

    async execute(sock, m) {
        try {
            const from = m.key.remoteJid;
            const sender = m.key.participant || m.key.remoteJid;
            const senderLid = hay.toLid(sender);

            // ===== التحقق من الصلاحيات (الأونر فقط) =====
            if (!hay.isFounder(senderLid) && !hay.isOwnerbot(senderLid)) {
                await sendMessage(sock, from, [
                    '🚫 *غير مصرح*',
                    '',
                    '🔒 هذا الأمر متاح فقط للأونر.'
                ], m);
                return;
            }

            // ===== استخراج النص والأمر =====
            const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const parts = body.trim().split(/\s+/);
            
            if (parts.length < 2) {
                await showHelp(sock, from, m);
                return;
            }

            const subCommand = parts[1].toLowerCase();
            const pluginName = parts[2] || '';

            // ===== تنفيذ الأوامر الفرعية =====
            switch (subCommand) {
                case 'اضف':
                case 'add':
                    await addPlugin(sock, m, from, pluginName);
                    break;
                
                case 'حذف':
                case 'delete':
                case 'del':
                    await deletePlugin(sock, from, pluginName, m);
                    break;
                
                case 'بحث':
                case 'search':
                    await searchPlugin(sock, from, pluginName, m);
                    break;
                
                case 'قائمة':
                case 'list':
                    await listPlugins(sock, from, m);
                    break;
                
                default:
                    await showHelp(sock, from, m);
            }

        } catch (error) {
            console.error('❌ خطأ في أمر بلجن:', error);
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

// ========== عرض المساعدة ==========
async function showHelp(sock, from, quoted) {
    const lines = [
        '🔌 *نظام إدارة البلجنات*',
        '',
        '📌 *الأوامر المتاحة:*',
        '   `.بلجن اضف [الاسم]` ── إضافة بلجن جديد (رد على رسالة الكود)',
        '   `.بلجن حذف [الاسم]` ── حذف بلجن موجود',
        '   `.بلجن بحث [الاسم]` ── البحث عن بلجن',
        '   `.بلجن قائمة` ── عرض جميع البلجنات',
        '',
        '📝 *أمثلة:*',
        '   `.بلجن اضف وردة` (مع الرد على رسالة الكود)',
        '   `.بلجن حذف وردة`',
        '   `.بلجن بحث وردة`',
        '   `.بلجن قائمة`',
        '',
        '⚠️ *ملاحظة:* هذا الأمر مخصص لمالك البوت فقط.'
    ];

    await sendMessage(sock, from, lines, quoted);
}

// ========== إضافة بلجن جديد ==========
async function addPlugin(sock, m, from, pluginName) {
    if (!pluginName) {
        await sendMessage(sock, from, [
            '❌ *يرجى تحديد اسم البلجن*',
            '',
            '📌 مثال: `.بلجن اضف وردة`'
        ], m);
        return;
    }

    // التحقق من الرد على رسالة
    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) {
        await sendMessage(sock, from, [
            '❌ *يجب الرد على رسالة تحتوي على كود البلجن*',
            '',
            '📌 طريقة الاستخدام:',
            '   1. ابحث عن كود البلجن',
            '   2. رد على الرسالة التي تحتوي على الكود',
            '   3. اكتب `.بلجن اضف [الاسم]`'
        ], m);
        return;
    }

    // استخراج النص من الرسالة المقتبسة
    const codeText =
        quotedMsg.conversation ||
        quotedMsg.extendedTextMessage?.text ||
        '';
    
    if (!codeText) {
        await sendMessage(sock, from, [
            '❌ *الرسالة المقتبسة فارغة*',
            '',
            '📌 تأكد من أن الرسالة تحتوي على كود البلجن'
        ], m);
        return;
    }

    // التحقق من أن النص يحتوي على module.exports
    if (!codeText.includes('module.exports')) {
        await sendMessage(sock, from, [
            '⚠️ *الرسالة لا تحتوي على كود صحيح*',
            '',
            '📌 الكود يجب أن يحتوي على `module.exports`',
            '📌 تأكد من أن الكود صحيح'
        ], m);
        return;
    }

    const pluginFilePath = path.join(__dirname, `cmd-custom-${pluginName}.js`);

    // التحقق من وجود البلجن مسبقاً
    if (fs.existsSync(pluginFilePath)) {
        await sendMessage(sock, from, [
            '⚠️ *البلجن موجود بالفعل*',
            '',
            `📌 "${pluginName}" موجود في النظام`,
            '📌 استخدم اسم آخر أو احذف البلجن أولاً'
        ], m);
        return;
    }

    // كتابة الكود في الملف
    fs.writeFileSync(pluginFilePath, codeText, 'utf-8');
    try { require('./core-loader').reloadPlugins(); } catch (_) {}

    await sendMessage(sock, from, [
        '✅ *تم إضافة البلجن بنجاح*',
        '',
        `📌 *الاسم:* ${pluginName}`,
        `📌 *الموقع:* ${pluginFilePath}`,
        '',
        '📝 يمكنك استخدامه بالأمر:',
        `   .${pluginName}`
    ], m);
}

// ========== حذف بلجن ==========
async function deletePlugin(sock, from, pluginName, quoted) {
    if (!pluginName) {
        await sendMessage(sock, from, [
            '❌ *يرجى تحديد اسم البلجن المراد حذفه*',
            '',
            '📌 مثال: `.بلجن حذف وردة`'
        ], quoted);
        return;
    }

    const pluginFilePath = path.join(__dirname, `cmd-custom-${pluginName}.js`);

    if (!fs.existsSync(pluginFilePath)) {
        await sendMessage(sock, from, [
            '❌ *البلجن غير موجود*',
            '',
            `📌 "${pluginName}" غير موجود في النظام`,
            '📌 استخدم `.بلجن قائمة` لعرض البلجنات الموجودة'
        ], quoted);
        return;
    }

    // حذف الملف
    fs.unlinkSync(pluginFilePath);
    try { require('./core-loader').reloadPlugins(); } catch (_) {}

    // محاولة إزالة الكاش
    try {
        delete require.cache[require.resolve(pluginFilePath)];
    } catch {}

    await sendMessage(sock, from, [
        '✅ *تم حذف البلجن بنجاح*',
        '',
        `📌 تم حذف "${pluginName}"`,
        '📌 لن يكون متاحاً للاستخدام بعد الآن'
    ], quoted);
}

// ========== البحث عن بلجن ==========
async function searchPlugin(sock, from, pluginName, quoted) {
    if (!pluginName) {
        await sendMessage(sock, from, [
            '❌ *يرجى تحديد اسم البلجن للبحث*',
            '',
            '📌 مثال: `.بلجن بحث وردة`'
        ], quoted);
        return;
    }

    // قراءة جميع الملفات في المجلد
    const files = fs.readdirSync(__dirname).filter(f => f.startsWith('cmd-'));
    const pluginFiles = files.filter(file => 
        file.endsWith('.js') && 
        file !== 'بلجن.js' && 
        !file.startsWith('_')
    );

    if (pluginFiles.length === 0) {
        await sendMessage(sock, from, [
            '📭 *لا توجد بلجنات*',
            '',
            '📌 لم يتم العثور على أي بلجنات في النظام'
        ], quoted);
        return;
    }

    // البحث عن مطابقة تامة
    const exactMatch = pluginFiles.find(file => 
        file.toLowerCase() === `${pluginName.toLowerCase()}.js`
    );

    if (exactMatch) {
        await sendMessage(sock, from, [
            '✅ *تم العثور على البلجن*',
            '',
            `📌 *الاسم:* ${path.basename(exactMatch, '.js')}`,
            `📌 *الملف:* ${exactMatch}`,
            '',
            '📝 يمكنك استخدامه بالأمر:',
            `   .${path.basename(exactMatch, '.js')}`
        ], quoted);
        return;
    }

    // البحث عن مطابقات مشابهة
    const similarMatches = [];
    for (const file of pluginFiles) {
        const nameWithoutExt = path.basename(file, '.js');
        const similarity = getSimilarity(pluginName, nameWithoutExt);
        if (similarity > 0.3) {
            similarMatches.push({ name: nameWithoutExt, file, similarity });
        }
    }

    similarMatches.sort((a, b) => b.similarity - a.similarity);

    if (similarMatches.length > 0) {
        const list = similarMatches.map(item => 
            `   • ${item.name} (${Math.round(item.similarity * 100)}%)`
        ).join('\n');

        await sendMessage(sock, from, [
            '🔍 *نتائج البحث*',
            '',
            `📌 لم نجد "${pluginName}"`,
            '',
            '📝 *النتائج المشابهة:*',
            list,
            '',
            '💡 استخدم `.بلجن قائمة` لعرض جميع البلجنات'
        ], quoted);
    } else {
        await sendMessage(sock, from, [
            '🔍 *لم يتم العثور على نتائج*',
            '',
            `📌 لا توجد بلجنات مشابهة لـ "${pluginName}"`,
            '',
            '💡 استخدم `.بلجن قائمة` لعرض جميع البلجنات'
        ], quoted);
    }
}

// ========== عرض قائمة البلجنات ==========
async function listPlugins(sock, from, quoted) {
    // قراءة جميع الملفات في المجلد
    const files = fs.readdirSync(__dirname).filter(f => f.startsWith('cmd-'));
    const pluginFiles = files.filter(file => 
        file.endsWith('.js') && 
        file !== 'بلجن.js' && 
        !file.startsWith('_')
    );

    if (pluginFiles.length === 0) {
        await sendMessage(sock, from, [
            '📭 *لا توجد بلجنات*',
            '',
            '📌 لم يتم العثور على أي بلجنات في النظام'
        ], quoted);
        return;
    }

    const lines = [
        '📋 *قائمة البلجنات*',
        '',
        `📊 *الإجمالي:* ${pluginFiles.length} بلجن`,
        ''
    ];

    pluginFiles.forEach((file, index) => {
        const name = path.basename(file, '.js');
        const emoji = index % 2 === 0 ? '🔹' : '🔸';
        lines.push(`   ${emoji} \`${name}\``);
    });

    lines.push('');
    lines.push('💡 استخدم `.بلجن بحث [الاسم]` للبحث عن بلجن معين');
    lines.push('💡 استخدم `.بلجن حذف [الاسم]` لحذف بلجن');

    await sendMessage(sock, from, lines, quoted);
}
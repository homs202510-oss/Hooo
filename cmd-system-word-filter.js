// حظر.js - نظام حظر الكلمات (يعمل تلقائياً)

const fs = require('fs');
const path = require('path');
const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');
const { isElite } = require('./lib-roles');

const bannedWordsPath = path.join(__dirname, 'db-bannedWords.json');
const warningsPath = path.join(__dirname, 'db-warnings.json');

if (!fs.existsSync(bannedWordsPath)) fs.writeFileSync(bannedWordsPath, JSON.stringify({}));
if (!fs.existsSync(warningsPath)) fs.writeFileSync(warningsPath, JSON.stringify({}));

// ========== دوال مساعدة ==========
function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
function loadWarnings() { return loadJSON(warningsPath); }
function saveWarnings(data) { saveJSON(warningsPath, data); }

// ========== تخزين المستمعين النشطين ==========
const activeListeners = new Map();

// ========== دالة الإرسال بتنسيق موحد ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🚫 حـظـر الـكـلـمـات 🚫\n`;
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

// ========== صلاحيات محسنة ==========
function isProtected(senderNumber) {
    return isFounder(senderNumber) || isOwnerbot(senderNumber) || isDeveloper(senderNumber) || isElite(senderNumber);
}

async function hasPermission(sock, chatId, jid) {
    const senderNum = jid.split('@')[0];
    if (isProtected(senderNum)) return true;
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participant = metadata.participants.find(p => p.id === jid);
        return participant?.admin === 'superadmin' || participant?.admin === 'admin';
    } catch { return false; }
}

// ========== مستمع الكلمات المحظورة ==========
async function setupBannedWordsListener(sock, chatId) {
    const listenerKey = `banned_${chatId}`;
    if (activeListeners.has(listenerKey)) return;
    
    const handler = async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg || msg.key.remoteJid !== chatId) return;
            
            const bannedData = loadJSON(bannedWordsPath);
            if (!bannedData[chatId] || bannedData[chatId].length === 0) return;

            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            if (!body) return;
            
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            if (!sender) return;
            
            const senderNum = sender.split('@')[0];
            if (isProtected(senderNum)) return;

            // التحقق من وجود كلمة محظورة
            const foundWord = bannedData[chatId].find(word => 
                body.toLowerCase().includes(word.toLowerCase())
            );
            
            if (!foundWord) return;

            // حذف الرسالة
            try { await sock.sendMessage(chatId, { delete: msg.key }); } catch (e) {}

            // تسجيل إنذار
            let warnings = loadWarnings();
            if (!warnings[chatId]) warnings[chatId] = {};
            if (!warnings[chatId][sender]) warnings[chatId][sender] = { count: 0, reasons: [] };

            const lastReason = warnings[chatId][sender].reasons.slice(-1)[0];
            const now = Date.now();
            const lastTime = warnings[chatId][sender].lastWarningTime || 0;
            if (lastReason === `كلمة محظورة: ${foundWord}` && (now - lastTime) < 30000) return;

            warnings[chatId][sender].count += 1;
            warnings[chatId][sender].reasons.push(`كلمة محظورة: "${foundWord}"`);
            warnings[chatId][sender].lastWarningTime = now;
            saveWarnings(warnings);

            const count = warnings[chatId][sender].count;
            if (count >= 4) {
                await sendMessage(sock, chatId, [
                    `🚫 @${senderNum} تم طرده بعد ${count} إنذارات (كلمات محظورة).`
                ], msg, [sender]);
                try { await sock.groupParticipantsUpdate(chatId, [sender], 'remove'); } catch (e) {}
                delete warnings[chatId][sender];
                saveWarnings(warnings);
            } else {
                await sendMessage(sock, chatId, [
                    `⚠️ @${senderNum} إنذار ${count}/4 بسبب كلمة محظورة: "${foundWord}"`
                ], msg, [sender]);
            }
        } catch (err) { 
            console.error('✗ خطأ في مستمع الكلمات المحظورة:', err); 
        }
    };

    sock.ev.on('messages.upsert', handler);
    activeListeners.set(listenerKey, { handler, type: 'banned' });
}

// ========== تفعيل المستمع لكل الجروبات ==========
async function startAllListeners(sock) {
    try {
        const bannedData = loadJSON(bannedWordsPath);
        for (const chatId of Object.keys(bannedData)) {
            if (bannedData[chatId] && bannedData[chatId].length > 0) {
                await setupBannedWordsListener(sock, chatId);
                console.log(`✅ تم تفعيل حظر الكلمات في ${chatId} (${bannedData[chatId].length} كلمة)`);
            }
        }
    } catch (err) {
        console.error('✗ خطأ في تفعيل المستمعين:', err);
    }
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['كلمات', 'حظر_كلمات'],
    description: '🚫 نظام حظر الكلمات (يعمل تلقائياً عند وجود كلمات)',
    category: 'نظام',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderNum = sender.split('@')[0];
            const fullText = msg.message?.conversation || 
                           msg.message?.extendedTextMessage?.text || '';
            
            // إزالة الأمر من النص
            const textAfterCommand = fullText.replace(/^[.!،]?(حظر)\s*/i, '').trim();
            
            // تقسيم النص إلى أجزاء
            const args = textAfterCommand.split(/\s+/);
            const action = args[0]?.toLowerCase();

            // ===== التحقق من أن الأمر في مجموعة =====
            if (!chatId.endsWith('@g.us')) {
                await sendMessage(sock, chatId, [
                    '❌ *هذا الأمر يعمل في الجروبات فقط*',
                    '',
                    '📌 يرجى استخدام الأمر في مجموعة'
                ], msg);
                return;
            }

            // ===== التحقق من الصلاحية =====
            const hasPerm = await hasPermission(sock, chatId, sender);
            if (!hasPerm) {
                await sendMessage(sock, chatId, [
                    '🚫 *غير مصرح*',
                    '',
                    '🔒 هذا الأمر للمشرفين والنخبة فقط.',
                    '📌 النخبة: المطورون والمالكون'
                ], msg);
                return;
            }

            let bannedData = loadJSON(bannedWordsPath);
            if (!bannedData[chatId]) bannedData[chatId] = [];

            // ===== إذا لم يكتب أي شيء بعد الأمر =====
            if (!textAfterCommand) {
                const lines = [
                    '📖 *أوامر حظر الكلمات*',
                    '',
                    '➕ `.كلمات كلمة1 كلمة2`  ──  إضافة كلمات محظورة',
                    '➖ `.كلمات فك كلمة`  ──  حذف كلمة من القائمة',
                    '',
                    '📋 `.كلمات قائمة`  ──  عرض الكلمات المحظورة',
                    '📊 `.كلمات حالة`  ──  عرض حالة النظام',
                    '',
                    '💡 *النظام يعمل تلقائياً:*',
                    '   • عند وجود كلمات محظورة يمنعها',
                    '   • يحذف الرسالة ويعطي إنذار',
                    '   • الطرد بعد 4 إنذارات',
                    '',
                    `📝 *الكلمات الحالية:* ${bannedData[chatId].length > 0 ? bannedData[chatId].join('، ') : 'لا توجد'}`
                ];
                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            // ===== إضافة كلمات (.كلمات كلمة1 كلمة2 كلمة3) =====
            if (action !== 'فك' && action !== 'حذف' && action !== 'delete' && action !== 'remove' && 
                action !== 'قائمة' && action !== 'list' && action !== 'عرض' && 
                action !== 'حالة' && action !== 'status') {
                
                // كل الكلمات بعد الأمر تعتبر كلمات للحظر
                const words = args;
                if (words.length === 0) {
                    await sendMessage(sock, chatId, [
                        '⚠️ *يرجى كتابة الكلمات المراد حظرها*',
                        '',
                        '📌 مثال: `.كلمات سبام إعلان روابط`'
                    ], msg);
                    return;
                }

                let added = 0;
                let existing = 0;
                for (const word of words) {
                    if (!bannedData[chatId].includes(word)) {
                        bannedData[chatId].push(word);
                        added++;
                    } else {
                        existing++;
                    }
                }
                saveJSON(bannedWordsPath, bannedData);

                // تفعيل المستمع تلقائياً
                await setupBannedWordsListener(sock, chatId);

                const lines = [
                    '✅ *تم إضافة الكلمات*',
                    '',
                    `📌 تم إضافة ${added} كلمة جديدة`,
                    ...(existing > 0 ? [`📌 ${existing} كلمة موجودة مسبقاً`] : []),
                    `📌 إجمالي الكلمات: ${bannedData[chatId].length}`,
                    '',
                    `📝 الكلمات: ${bannedData[chatId].join('، ')}`
                ];
                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            // ===== حذف كلمة (.كلمات فك كلمة) =====
            if (action === 'فك' || action === 'حذف' || action === 'delete' || action === 'remove') {
                const word = args.slice(1).join(' ');
                if (!word) {
                    await sendMessage(sock, chatId, [
                        '⚠️ *يرجى كتابة الكلمة المراد حذفها*',
                        '',
                        '📌 مثال: `.كلمات فك سبام`'
                    ], msg);
                    return;
                }

                // البحث عن الكلمة
                const index = bannedData[chatId].findIndex(w => w.toLowerCase() === word.toLowerCase());
                if (index === -1) {
                    await sendMessage(sock, chatId, [
                        '❌ *الكلمة غير موجودة*',
                        '',
                        `📌 "${word}" غير موجودة في القائمة`,
                        '',
                        `📝 الكلمات الحالية: ${bannedData[chatId].join('، ') || 'لا توجد كلمات'}`
                    ], msg);
                    return;
                }

                const removedWord = bannedData[chatId][index];
                bannedData[chatId].splice(index, 1);
                saveJSON(bannedWordsPath, bannedData);

                // إذا أصبحت القائمة فارغة، نوقف المستمع
                if (bannedData[chatId].length === 0) {
                    const listenerKey = `banned_${chatId}`;
                    if (activeListeners.has(listenerKey)) {
                        sock.ev.off('messages.upsert', activeListeners.get(listenerKey).handler);
                        activeListeners.delete(listenerKey);
                    }
                }

                await sendMessage(sock, chatId, [
                    '✅ *تم حذف الكلمة*',
                    '',
                    `📌 تم حذف: "${removedWord}"`,
                    `📌 المتبقي: ${bannedData[chatId].length} كلمة`,
                    ...(bannedData[chatId].length > 0 ? [
                        '',
                        `📝 الكلمات المتبقية: ${bannedData[chatId].join('، ')}`
                    ] : [
                        '',
                        '✅ لا توجد كلمات محظورة حالياً'
                    ])
                ], msg);
                return;
            }

            // ===== عرض القائمة (.كلمات قائمة) =====
            if (action === 'قائمة' || action === 'list' || action === 'عرض') {
                if (bannedData[chatId].length === 0) {
                    await sendMessage(sock, chatId, [
                        '📋 *قائمة الكلمات المحظورة*',
                        '',
                        '✅ لا توجد كلمات محظورة',
                        '',
                        '📌 لإضافة كلمات: `.كلمات كلمة1 كلمة2`'
                    ], msg);
                    return;
                }

                const lines = [
                    '📋 *قائمة الكلمات المحظورة*',
                    '',
                    ...bannedData[chatId].map((word, i) => `   ${i+1}. ${word}`),
                    '',
                    `📌 إجمالي: ${bannedData[chatId].length} كلمة`,
                    '',
                    '💡 النظام يعمل تلقائياً'
                ];
                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            // ===== عرض الحالة (.كلمات حالة) =====
            if (action === 'حالة' || action === 'status') {
                const isActive = activeListeners.has(`banned_${chatId}`);
                const lines = [
                    '📊 *حالة نظام حظر الكلمات*',
                    '',
                    `📌 الحالة: ${isActive ? '✅ مفعل' : '❌ معطل'}`,
                    `📌 عدد الكلمات: ${bannedData[chatId].length}`,
                    ...(bannedData[chatId].length > 0 ? [
                        '',
                        '📝 الكلمات:',
                        ...bannedData[chatId].map(w => `   • ${w}`),
                        '',
                        '💡 النظام يعمل تلقائياً'
                    ] : [
                        '',
                        '✅ لا توجد كلمات محظورة',
                        '',
                        '📌 لإضافة كلمات: `.كلمات كلمة1 كلمة2`'
                    ])
                ];
                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            // ===== إذا كان الأمر غير معروف =====
            const lines = [
                '❌ *أمر غير معروف*',
                '',
                `📌 "${textAfterCommand}" ليس أمراً صحيحاً`,
                '',
                '📖 *الأوامر المتاحة:*',
                '➕ `.كلمات كلمة1 كلمة2`  ──  إضافة كلمات محظورة',
                '➖ `.كلمات فك كلمة`  ──  حذف كلمة من القائمة',
                '',
                '📋 `.كلمات قائمة`  ──  عرض الكلمات المحظورة',
                '📊 `.كلمات حالة`  ──  عرض حالة النظام',
                '',
                '💡 *النظام يعمل تلقائياً:*',
                '   • عند وجود كلمات محظورة يمنعها',
                '   • يحذف الرسالة ويعطي إنذار',
                '   • الطرد بعد 4 إنذارات'
            ];
            await sendMessage(sock, chatId, lines, msg);

        } catch (error) {
            console.error('✗ خطأ في أمر حظر:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    },
    startAllListeners
};
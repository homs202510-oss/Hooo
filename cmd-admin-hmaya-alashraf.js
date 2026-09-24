// حماية.js - النسخة النهائية

const fs = require('fs');
const path = require('path');
const { jidDecode } = require('@whiskeysockets/baileys');
const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');

// ========== دوال التحويل ==========
const decode = jid => {
    try {
        const decoded = jidDecode(jid);
        if (decoded?.user) {
            return decoded.user + '@s.whatsapp.net';
        }
    } catch {}

    const str = String(jid);
    const nums = str.replace(/[^0-9]/g, '');
    if (nums) {
        return nums + '@s.whatsapp.net';
    }
    return str;
};

const clean = num => String(num).replace(/[^0-9]/g, '');

// ========== تنظيف الرقم ==========
const cleanNumber = (num) => {
    if (!num) return null;
    return String(num).replace(/[^0-9]/g, '') || null;
};

// ========== استخراج الرقم الحقيقي (لـ lid) ==========
const getRealNumber = (jid) => {
    if (!jid) return null;
    try {
        const decoded = jidDecode(jid);
        if (decoded?.user) {
            return decoded.user;
        }
    } catch {}
    return cleanNumber(jid);
};

// ========== الحصول على الاسم من واتساب ==========
async function getContactName(sock, jid) {
    try {
        const realJid = decode(jid);
        if (!realJid) return null;
        const contact = await sock.contact(realJid);
        if (contact) {
            return contact.verifiedName || contact.name || contact.notify || null;
        }
        return null;
    } catch {
        return null;
    }
}

// ========== الحصول على الاسم للعرض ==========
async function getDisplayName(sock, jid) {
    const num = cleanNumber(jid);
    if (!num) return 'غير معروف';
    const name = await getContactName(sock, num);
    return name || num;
}

// ========== المسارات ==========
const dataDir = __dirname;
const monitorFile = path.join(dataDir, 'monitorState.json');
const adminsCacheFile = path.join(dataDir, 'adminsCache.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(monitorFile)) fs.writeFileSync(monitorFile, JSON.stringify({}));
if (!fs.existsSync(adminsCacheFile)) fs.writeFileSync(adminsCacheFile, JSON.stringify({}));

// ========== دوال التحميل والحفظ ==========
const loadJSON = (file) => {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
};
const saveJSON = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// ========== دوال الصلاحيات ==========
const isPrivileged = (id) => {
    const num = clean(id);
    return isFounder(num) || isOwnerbot(num) || isDeveloper(num);
};

// ========== دوال الحماية ==========
function getState(groupId) {
    const state = loadJSON(monitorFile);
    return state[groupId] || null;
}

function setState(groupId, data) {
    const state = loadJSON(monitorFile);
    if (data) state[groupId] = data;
    else delete state[groupId];
    saveJSON(monitorFile, state);
}

function getPreviousAdmins(groupId) {
    const cache = loadJSON(adminsCacheFile);
    return cache[groupId] || [];
}

function setPreviousAdmins(groupId, admins) {
    const cache = loadJSON(adminsCacheFile);
    cache[groupId] = admins;
    saveJSON(adminsCacheFile, cache);
}

// ========== تحديث الكاش ==========
async function updateAdminsCache(sock, groupId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const currentAdmins = metadata.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => clean(decode(p.id)));
        setPreviousAdmins(groupId, currentAdmins);
        return currentAdmins;
    } catch {
        return [];
    }
}

// ========== المتغيرات العالمية ==========
const processingGroups = new Set();
const lastFixTime = new Map();

// ========== الدالة الرئيسية ==========
async function fixAdmins(sock, groupId, update) {
    // منع التكرار
    const eventKey = `${groupId}_${Date.now()}`;
    if (processingGroups.has(groupId)) return;
    
    const now = Date.now();
    const last = lastFixTime.get(groupId) || 0;
    if (now - last < 3000) return;
    lastFixTime.set(groupId, now);
    
    processingGroups.add(groupId);
    
    try {
        const state = getState(groupId);
        if (!state || !state.active) {
            processingGroups.delete(groupId);
            return;
        }
        
        // ===== جلب بيانات المجموعة الحالية =====
        const metadata = await sock.groupMetadata(groupId);
        const botNumber = clean(decode(sock.user.id));
        
        // ===== استخراج رقم المتلاعب =====
        let authorRealNum = null;
        let authorId = update?.author;

        // محاولة 1: من update.author
        if (authorId) {
            authorRealNum = getRealNumber(authorId);
            console.log('🔍 من author:', authorRealNum);
        }

        // محاولة 2: من update.participants
        if (!authorRealNum && update?.participants && update.participants.length > 0) {
            for (const p of update.participants) {
                const num = getRealNumber(p.id);
                if (num) {
                    authorRealNum = num;
                    console.log('🔍 من participants:', authorRealNum);
                    break;
                }
            }
        }

        // محاولة 3: المقارنة مع المشرفين السابقين
        if (!authorRealNum) {
            const currentAdmins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => clean(decode(p.id)));
            
            const previousAdmins = getPreviousAdmins(groupId);
            const newAdmins = currentAdmins.filter(a => !previousAdmins.includes(a) && a !== botNumber);
            
            if (newAdmins.length > 0) {
                authorRealNum = newAdmins[0];
                console.log('🔍 من المقارنة:', authorRealNum);
            }
        }

        console.log('✅ الرقم النهائي للمتلاعب:', authorRealNum);

        // ===== التحقق من صلاحيات المتلاعب =====
        const isAuthorPrivileged = authorRealNum ? isPrivileged(authorRealNum) : false;

        // ✅ لو المتلاعب من النخبة → نتجاهل
        if (isAuthorPrivileged) {
            console.log(`✅ النخبة ${authorRealNum} يقوم بالتغيير - لا نتدخل`);
            await updateAdminsCache(sock, groupId);
            processingGroups.delete(groupId);
            return;
        }

        // ===== تحديد المطلوب ترقيتهم وإنزالهم =====
        let toPromote = [];
        let toDemote = [];
        
        for (let p of metadata.participants) {
            const num = clean(decode(p.id));
            const isAdmin = p.admin !== null;
            const isPriv = isPrivileged(num);
            
            // ===== الترقية: المطور والمالك =====
            if (isPriv && !isAdmin && num !== botNumber) {
                toPromote.push(p.id);
            }
            
            // ===== الإنزال: كل المشرفين غير النخبة =====
            if (isAdmin && !isPriv && num !== botNumber) {
                toDemote.push(p.id);
            }
        }
        
        toPromote = [...new Set(toPromote)];
        toDemote = [...new Set(toDemote)];
        toDemote = toDemote.filter(j => !toPromote.includes(j));
        
        if (toPromote.length === 0 && toDemote.length === 0) {
            await updateAdminsCache(sock, groupId);
            processingGroups.delete(groupId);
            return;
        }
        
        // ===== الحصول على اسم المتلاعب =====
        const authorDisplay = authorRealNum ? await getDisplayName(sock, authorRealNum) : 'مشرف عادي';
        
        // ===== رسالة التنبيه =====
        let alertText = `🛡️ نـظـام الـحـمـايـة 🛡️\n━━━━━━━━━━━━━━━━━━━━\n`;
        alertText += `🚨 *تم رصد محاولة تلاعب بالإشراف!*\n\n`;
        alertText += `👤 *المخالف:* @${authorDisplay}\n`;
        alertText += `\n*جاري التصحيح...*\n`;
        alertText += `━━━━━━━━━━━━━━━━━━━━\n`;
        alertText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
        
        const alertMentions = authorRealNum ? [authorRealNum + '@s.whatsapp.net'] : [];
        await sock.sendMessage(groupId, {
            text: alertText,
            mentions: alertMentions
        }, { quoted: null });
        
        // ===== تنفيذ =====
        if (toPromote.length > 0) {
            await sock.groupParticipantsUpdate(groupId, toPromote, 'promote');
            await new Promise(r => setTimeout(r, 500));
        }
        
        if (toDemote.length > 0) {
            await sock.groupParticipantsUpdate(groupId, toDemote, 'demote');
            await new Promise(r => setTimeout(r, 500));
        }
        
        // ===== تحديث الكاش بعد التغييرات =====
        await updateAdminsCache(sock, groupId);
        
        // ===== التقرير النهائي =====
        let reportText = `🛡️ نـظـام الـحـمـايـة 🛡️\n━━━━━━━━━━━━━━━━━━━━\n`;
        reportText += `✅ *تم إصلاح الإشراف*\n\n`;
        
        const promoteNames = [];
        for (const id of toPromote) {
            const num = clean(decode(id));
            const name = await getDisplayName(sock, num);
            promoteNames.push(name);
        }
        
        const demoteNames = [];
        for (const id of toDemote) {
            const num = clean(decode(id));
            const name = await getDisplayName(sock, num);
            demoteNames.push(name);
        }
        
        if (promoteNames.length > 0) {
            reportText += `🔺 *تم رفع (${promoteNames.length}):*\n`;
            for (const name of promoteNames) {
                reportText += `👑 @${name}\n`;
            }
            reportText += `\n`;
        }
        
        if (demoteNames.length > 0) {
            reportText += `🔻 *تم إنزال (${demoteNames.length}):*\n`;
            for (const name of demoteNames) {
                reportText += `❌ @${name}\n`;
            }
        }
        
        if (authorRealNum && !isPrivileged(authorRealNum)) {
            reportText += `\n⚠️ *@${authorDisplay}* حاول التلاعب وتم إحباط محاولته.`;
        }
        
        reportText += `\n━━━━━━━━━━━━━━━━━━━━\n`;
        reportText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
        
        const reportMentions = [...toPromote, ...toDemote];
        if (authorRealNum) {
            reportMentions.push(authorRealNum + '@s.whatsapp.net');
        }
        
        await sock.sendMessage(groupId, {
            text: reportText,
            mentions: reportMentions
        }, { quoted: null });
        
    } catch (err) {
        console.error('❌ خطأ:', err);
    } finally {
        // إزالة القفل بعد 3 ثواني
        setTimeout(() => {
            processingGroups.delete(groupId);
        }, 3000);
    }
}

// ========== مستمع الأحداث ==========
function createListener(sock) {
    return async (update) => {
        if (update.action !== 'promote' && update.action !== 'demote') return;
        if (!update.participants || !update.participants.length) return;
        
        const groupId = update.id;
        
        const state = getState(groupId);
        if (!state || !state.active) return;
        
        await fixAdmins(sock, groupId, update);
    };
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'حماية',
    description: '🛡️ نظام حماية الإشراف',
    category: 'ادارة',
    usage: '.حماية تشغيل – تفعيل الحماية\n.حماية ايقاف – إيقاف الحماية\n.حماية حالة – عرض حالة الحماية',

    async execute(sock, msg) {
        try {
            const groupId = msg.key.remoteJid;
            const sender = msg.key.participant || groupId;
            const senderNum = clean(decode(sender));

            if (!groupId.endsWith('@g.us')) {
                return await sock.sendMessage(groupId, {
                    text: '❗ هذا الأمر يعمل داخل المجموعات فقط.'
                }, { quoted: msg });
            }

            const fullText = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
            const args = fullText.split(/\s+/).slice(1);
            const subCommand = (args[0] || '').toLowerCase();

            const state = getState(groupId);
            
            // تخزين المستمعين في الـ sock عشان نقدر نزيلهم
            if (!sock._protectionListeners) sock._protectionListeners = new Map();

            // ===== عرض الحالة =====
            if (subCommand === 'حالة') {
                let text = `🛡️ نـظـام الـحـمـايـة 🛡️\n━━━━━━━━━━━━━━━━━━━━\n`;
                if (!state) {
                    text += `❌ الحماية غير مفعلة حالياً.`;
                } else {
                    text += `📌 *الحالة:* ${state.active ? '🟢 مفعلة' : '🔴 معطلة'}`;
                }
                text += `\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
                
                return await sock.sendMessage(groupId, { text }, { quoted: msg });
            }

            // ===== إيقاف الحماية =====
            if (subCommand === 'إيقاف' || subCommand === 'ايقاف') {
                if (!state) {
                    return await sock.sendMessage(groupId, {
                        text: `⚠️ الحماية غير مفعلة حالياً.`
                    }, { quoted: msg });
                }

                // فقط المطور والمالك 
                if (!isFounder(senderNum) && !isOwnerbot(senderNum) && !isDeveloper(senderNum)) {
                    return await sock.sendMessage(groupId, {
                        text: `⚠️ *أنت لست من الموثوقين!*\nفقط المطور والمالك يمكنهم إيقاف الحماية.`
                    }, { quoted: msg });
                }

                setState(groupId, null);
                
                // إزالة المستمع الخاص بهذه المجموعة
                if (sock._protectionListeners.has(groupId)) {
                    const handler = sock._protectionListeners.get(groupId);
                    sock.ev.off('group-participants.update', handler);
                    sock._protectionListeners.delete(groupId);
                }

                return await sock.sendMessage(groupId, {
                    text: `❎ تم إيقاف الحماية.`
                }, { quoted: msg });
            }

            // ===== تفعيل الحماية =====
            if (subCommand === 'تشغيل') {
                if (state) {
                    return await sock.sendMessage(groupId, {
                        text: `⚠️ الحماية مفعلة بالفعل.\n📌 استخدم .حماية ايقاف أولاً.`
                    }, { quoted: msg });
                }

                // ===== حفظ المشرفين الحاليين كحالة أولية =====
                await updateAdminsCache(sock, groupId);

                setState(groupId, { active: true });

                // إزالة أي مستمع قديم لهذه المجموعة
                if (sock._protectionListeners.has(groupId)) {
                    const oldHandler = sock._protectionListeners.get(groupId);
                    sock.ev.off('group-participants.update', oldHandler);
                    sock._protectionListeners.delete(groupId);
                }

                const handler = createListener(sock);
                sock.ev.on('group-participants.update', handler);
                sock._protectionListeners.set(groupId, handler);

                let text = `🛡️ نـظـام الـحـمـايـة 🛡️\n━━━━━━━━━━━━━━━━━━━━\n`;
                text += `✅ تم تفعيل الحماية.\n`;
                text += `🔻 سيتم إنزال جميع المشرفين غير موثوقين.\n`;
                text += `🔺 سيتم رفع الموثوقين (مطور/مالك).\n`;
                text += `━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

                await sock.sendMessage(groupId, { text }, { quoted: msg });
                return;
            }

            // ===== أمر غير معروف =====
            let text = `🛡️ نـظـام الـحـمـايـة 🛡️\n━━━━━━━━━━━━━━━━━━━━\n`;
            text += `❌ أمر غير معروف.\n\n`;
            text += `📌 .حماية تشغيل – تفعيل الحماية\n`;
            text += `📌 .حماية ايقاف – إيقاف الحماية\n`;
            text += `📌 .حماية حالة – عرض حالة الحماية\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
            
            await sock.sendMessage(groupId, { text }, { quoted: msg });

        } catch (err) {
            console.error('❌ خطأ:', err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ:\n${err.message || err}`
            }, { quoted: msg });
        }
    }
};
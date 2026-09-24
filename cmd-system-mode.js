// مود.js - نسخة معدلة

const fs = require('fs');
const path = require('path');

// مسارات الملفات
const globalModePath = path.join(__dirname, 'db-mode.txt');
const groupModePath = path.join(__dirname, 'db-mode_groups.json');

// تأكد من وجود الملفات
if (!fs.existsSync(globalModePath)) fs.writeFileSync(globalModePath, '[off]');
if (!fs.existsSync(groupModePath)) fs.writeFileSync(groupModePath, '{}');

// ✅ دالة تحويل إلى LID
function getLid(number) {
    if (!number) return null;
    if (number.includes('@lid')) return number;
    if (number.includes('@s.whatsapp.net')) {
        return number.split('@')[0] + '@lid';
    }
    return number + '@lid';
}

// ========== دالة الإرسال بتنسيق موحد ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎛️ نـظـام الـصـلاحـيـات 🎛️\n`;
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

// ========== دالة عرض الوضع الحالي ==========
function getModeText(groupJid) {
    const globalMode = fs.readFileSync(globalModePath, 'utf8').trim();
    const groupModes = JSON.parse(fs.readFileSync(groupModePath, 'utf8'));
    const currentMode = groupModes[groupJid] || globalMode;
    
    const modeNames = {
        '[off]': '🟢 مفتوح (الجميع)',
        '[نخبة]': '🟡 نخبة فما فوق',
        '[مطور]': '🟠 مطورين فما فوق',
        '[اونر]': '🔴 الأونر فقط'
    };
    
    return {
        current: modeNames[currentMode] || currentMode,
        global: modeNames[globalMode] || globalMode,
        raw: currentMode
    };
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['مود', 'وضع'],
    description: '🎛️ تغيير أوضاع الصلاحيات للقروب أو لكل القروبات',
    usage: '.مود [off|نخبة|مطور|اونر] أو .مود [وضع] كل',
    category: 'نظام',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;
            const sender = msg.key.participant || groupJid;
            const senderNumber = sender.split('@')[0];
            const fullText = msg.message?.extendedTextMessage?.text || 
                           msg.message?.conversation || '';
            const args = fullText.trim().split(/\s+/).slice(1);

            // ===== التحقق من الصلاحية =====
            const { isFounder, isOwnerbot } = require('./lib-roles');
            
            // ✅ استخدم getLid بدلاً من toLid
            const senderLid = getLid(senderNumber);
            
            if (!(isFounder(senderLid) || isOwnerbot(senderLid))) {
                await sendMessage(sock, groupJid, [
                    '❌ *غير مصرح*',
                    '',
                    '🔒 هذا الأمر خاص بـ الأونر بوت فقط.',
                    '📌 لا يمكن لأي شخص آخر استخدامه'
                ], msg);
                return;
            }

            // ===== إذا لم يتم إدخال وضع =====
            if (!args[0]) {
                const info = getModeText(groupJid);
                
                const lines = [
                    '📊 *حالة الصلاحيات*',
                    '',
                    `📌 *هذا القروب:* ${info.current}`,
                    `🌍 *الوضع العام:* ${info.global}`,
                    '',
                    '━━━━━━━━━━━━━━━━━━━━',
                    '⚡ *طريقة الاستخدام:*',
                    '',
                    '📝 `.مود [وضع]` → لهذا القروب',
                    '📝 `.مود [وضع] كل` → لكل القروبات',
                    '📝 `.مود حذف` → إزالة وضع القروب',
                    '',
                    '📋 *الأوضاع المتاحة:*',
                    '   🟢 off → الجميع يستخدم',
                    '   🟡 نخبة → النخبة فما فوق',
                    '   🟠 مطور → المطورين فما فوق',
                    '   🔴 اونر → الأونر فقط'
                ];
                
                await sendMessage(sock, groupJid, lines, msg);
                return;
            }

            const mode = args[0].toLowerCase();
            const validModes = ['off', 'نخبة', 'مطور', 'اونر', 'حذف'];
            
            if (!validModes.includes(mode)) {
                const lines = [
                    '❌ *وضع غير صالح*',
                    '',
                    '📋 *الأوضاع المتاحة:*',
                    '   🟢 off → الجميع يستخدم',
                    '   🟡 نخبة → النخبة فما فوق',
                    '   🟠 مطور → المطورين فما فوق',
                    '   🔴 اونر → الأونر فقط',
                    '   🗑️ حذف → إزالة وضع القروب',
                    '',
                    '📝 مثال: `.مود نخبة`',
                    '📝 مثال: `.مود عام كل`'
                ];
                
                await sendMessage(sock, groupJid, lines, msg);
                return;
            }

            const applyAll = args[1]?.toLowerCase() === 'كل';
            const isFounderUser = isFounder(senderLid);

            // ===== حالة الحذف =====
            if (mode === 'حذف') {
                let groupModes = JSON.parse(fs.readFileSync(groupModePath, 'utf8'));
                
                if (groupModes[groupJid]) {
                    delete groupModes[groupJid];
                    fs.writeFileSync(groupModePath, JSON.stringify(groupModes, null, 2));
                    
                    const info = getModeText(groupJid);
                    
                    const lines = [
                        '✅ *تم حذف وضع القروب*',
                        '',
                        `📌 *الوضع الجديد:* ${info.current}`,
                        '📌 *الحالة:* يعتمد على الوضع العام',
                        `👤 *تم بواسطة:* ${isFounderUser ? '👑 ' : '💎 الأونر بوت'}`,
                        '',
                        '💡 القروب الآن يتبع الوضع العام للبوت'
                    ];
                    
                    await sendMessage(sock, groupJid, lines, msg);
                } else {
                    await sendMessage(sock, groupJid, [
                        'ℹ️ *معلومة*',
                        '',
                        '📌 هذا القروب ليس له وضع خاص',
                        '📌 وهو يتبع الوضع العام بالفعل'
                    ], msg);
                }
                return;
            }

            // ===== تغيير الوضع =====
            const modeDisplay = {
                'off': '🟢 مفتوح (الجميع)',
                'نخبة': '🟡 نخبة فما فوق',
                'مطور': '🟠 مطورين فما فوق',
                'اونر': '🔴 الأونر فقط'
            };

            if (applyAll) {
                fs.writeFileSync(globalModePath, `[${mode}]`);
                
                const lines = [
                    '✅ *تم تغيير الوضع العام*',
                    '',
                    `📌 *الوضع الجديد:* ${modeDisplay[mode]}`,
                    '📌 *النطاق:* كل القروبات',
                    `👤 *تم بواسطة:* ${isFounderUser ? '👑 ' : '💎 الأونر بوت'}`,
                    '',
                    '🌍 جميع القروبات الآن تتبع هذا الوضع'
                ];
                
                await sendMessage(sock, groupJid, lines, msg);
            } else {
                let groupModes = JSON.parse(fs.readFileSync(groupModePath, 'utf8'));
                groupModes[groupJid] = `[${mode}]`;
                fs.writeFileSync(groupModePath, JSON.stringify(groupModes, null, 2));
                
                const lines = [
                    '✅ *تم تغيير وضع القروب*',
                    '',
                    `📌 *الوضع الجديد:* ${modeDisplay[mode]}`,
                    '📌 *النطاق:* هذا القروب فقط',
                    `👤 *تم بواسطة:* ${isFounderUser ? '👑 ' : '💎 الأونر بوت'}`,
                    '',
                    '💡 هذا القروب الآن يتبع الوضع الخاص به'
                ];
                
                await sendMessage(sock, groupJid, lines, msg);
            }

        } catch (err) {
            console.error('❌ خطأ في أمر مود:', err);
            
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${err.message || err.toString()}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};
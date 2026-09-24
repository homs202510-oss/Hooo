// zarf.js - نظام تشغيل/إيقاف أوامر الزرف (للمطور والأونر فقط - بدون نخبة)

const fs = require('fs');
const path = require('path');
const hay = require('./lib-roles');
const config = require('./config');
const plugins = require('./lib-plugin-list');

const ZARF_STATUS_FILE = path.join(__dirname, 'db-zarf_state.json');

// ========== دوال الحالة ==========
function getZarfStatus() {
    if (!fs.existsSync(ZARF_STATUS_FILE)) {
        fs.writeFileSync(ZARF_STATUS_FILE, JSON.stringify({ enabled: false }, null, 2));
    }
    return JSON.parse(fs.readFileSync(ZARF_STATUS_FILE));
}

function setZarfStatus(enabled) {
    fs.writeFileSync(ZARF_STATUS_FILE, JSON.stringify({ enabled }, null, 2));
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `⚙️ نـظـام الـزرف ⚙️\n`;
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

module.exports = {
    command: ['zarf'],
    description: '⚙️ تشغيل أو إيقاف أوامر الزرف (للمطور والأونر فقط)',
    category: 'نظام',
    usage: '.zarf on | .zarf off',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderLid = hay.toLid(sender);

            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = body.trim().split(/\s+/).slice(1);

            // ===== التحقق من الصلاحيات (بدون نخبة) =====
            const isAuthorized = hay.isFounder(senderLid) || 
                               hay.isOwnerbot(senderLid) || 
                               hay.isDeveloper(senderLid);

            if (!isAuthorized) {
                await sendMessage(sock, chatId, [
                    '🚫 *غير مصرح*',
                    '',
                    '🔒 هذا الأمر للمطور والأونر فقط.'
                ], msg);
                return;
            }

            // ===== عرض الحالة الحالية =====
            if (!args[0]) {
                const status = getZarfStatus();
                const statusText = status.enabled ? '✅ مفعل' : '❌ معطل';
                
                await sendMessage(sock, chatId, [
                    '📊 *حالة نظام الزرف*',
                    '',
                    `📌 الحالة: ${statusText}`,
                    '',
                    '📝 *الاستخدام:*',
                    '   `.zarf on`  ──  تشغيل النظام',
                    '   `.zarf off` ──  إيقاف النظام'
                ], msg);
                return;
            }

            const action = args[0].toLowerCase();

            // ===== تشغيل النظام =====
            if (action === 'on' || action === 'تشغيل') {
                setZarfStatus(true);
                await plugins.loadPlugins();
                
                await sendMessage(sock, chatId, [
                    '✅ *تم تشغيل نظام الزرف*',
                    '',
                    '📌 أصبحت أوامر الزرف متاحة الآن.',
                    '💡 استخدم `.zarf off` لإيقافها.'
                ], msg);
                return;
            }

            // ===== إيقاف النظام =====
            if (action === 'off' || action === 'ايقاف' || action === 'إيقاف') {
                setZarfStatus(false);
                await plugins.loadPlugins();
                
                await sendMessage(sock, chatId, [
                    '⛔ *تم إيقاف نظام الزرف*',
                    '',
                    '📌 أصبحت أوامر الزرف غير متاحة.',
                    '💡 استخدم `.zarf on` لتشغيلها مرة أخرى.'
                ], msg);
                return;
            }

            // ===== أمر غير معروف =====
            await sendMessage(sock, chatId, [
                '❌ *أمر غير معروف*',
                '',
                '📌 الاستخدام الصحيح:',
                '   `.zarf on`  ──  تشغيل النظام',
                '   `.zarf off` ──  إيقاف النظام',
                '   `.zarf`     ──  عرض الحالة'
            ], msg);

        } catch (error) {
            console.error('❌ خطأ في أمر zarf:', error);
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
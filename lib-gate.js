/**
 * 🚦 PHANTOM — بوابة التشغيل والصلاحيات
 * بتطبّق: bot on/off + تعطيل محادثة (تشغيل) + مود الصلاحيات (مود)
 * كلها ملفات db-*.txt / db-*.json جنب الملفات
 */
const fs = require('fs');
const path = require('path');
const H = require('./lib-roles');

const BOT_FILE = path.join(__dirname, 'db-bot.txt');
const DISABLED_FILE = path.join(__dirname, 'db-disabledChats.json');
const MODE_FILE = path.join(__dirname, 'db-mode.txt');
const GROUP_MODES_FILE = path.join(__dirname, 'db-mode_groups.json');

const readText = f => { try { return fs.readFileSync(f, 'utf8').trim(); } catch (_) { return ''; } };
const readJSON = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { return {}; } };

function shouldIgnore(chatJid, sender, commandName) {
    const owner = H.isFounder(sender) || H.isOwnerbot(sender);
    const dev = owner || H.isDeveloper(sender);
    const mode = readJSON(GROUP_MODES_FILE)[chatJid] || readText(MODE_FILE) || '[off]';

    if (owner) return false;                       // المؤسس والأونر دايماً شغّالين
    if (dev) return mode === '[اونر]';             // المطور شغّال إلا في وضع الأونر فقط

    if (readText(BOT_FILE) === '[off]') return true;   // البوت موقوف
    if (readJSON(DISABLED_FILE)[chatJid]) return true; // المحادثة معطّلة
    return mode !== '[off]';                       // [نخبة] / [مطور] / [اونر] = مقفول على العضو العادي
}

module.exports = { shouldIgnore };

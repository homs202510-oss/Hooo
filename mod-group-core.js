/**
 * 👻 Group Core v2 — الشكل الجديد + MUTE
 */
const state = require('./mod-group-state');
const settings = require('./mod-group-settings');
const permissions = require('./mod-group-permissions');
const mod = require('./mod-group-moderation');
const warnings = require('./mod-group-warnings');
const protection = require('./mod-group-protection');
const logs = require('./mod-group-logs');
const { extractNumber } = require('./mod-jid');
const user = require('./mod-user');
const dev = require('./mod-developer');

function isProtectedUser(jid) {
    try {
        const config = require('./config');
        const dev = require('./mod-developer');
        const num = jid.split('@')[0].split(':')[0];
        if (num === config.ownerNumber) return true;
        if (dev.isDeveloper(jid)) return true;
    } catch (_) {}
    return false;
}

const CONTROL_COMMANDS = ['اشتغل', 'قف', 'قف_هنا', 'قف هنا', 'وقف'];

function isControlCommand(text) {
    if (!text) return false;
    const t = text.trim();
    for (const c of CONTROL_COMMANDS) {
        if (t === '.' + c || t.startsWith('.' + c + ' ')) return true;
    }
    return false;
}

/**
 * شكل رسالة المخالفة — warn
 */
function buildViolationMsg(memberNum, reason, count, max) {
    return `╭━❰ 🚫 مخالفة ❱━╮

⚠️ تم اكتشاف مخالفة.

👤 المخالف:
@${memberNum}

📝 السبب: ${reason}
📊 عدد الإنذارات: ${count}/${max}

📌 نرجو الالتزام بقوانين المجموعة.

╰━❰ 👻 PHANTOM BOT ❱━╯`;
}

/**
 * شكل رسالة المخالفة — mute
 */
function buildMuteMsg(memberNum, reason, count, max, hours) {
    return `╭━❰ 🚫 مخالفة ❱━╮

⚠️ تم اكتشاف مخالفة.

👤 المخالف:
@${memberNum}

📝 السبب: ${reason}
📊 عدد الإنذارات: ${count}/${max}
⏰ المتبقي: ${hours} ساعة

📌 تم كتمك لمدة ${hours} ساعة.
نرجو الالتزام بقوانين المجموعة.

╰━❰ 👻 PHANTOM BOT ❱━╯`;
}

/**
 * حساب الوقت المتبقي بصيغة جميلة
 */
function formatRemaining(seconds) {
    if (seconds <= 0) return '0 دقيقة';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} ساعة ${m} دقيقة`;
    return `${m} دقيقة`;
}

async function check({ sock, msg, text, groupJid, sender, groupMetadata, botJid }) {
    if (!groupJid) return { allow: true, reason: 'private' };

    const isControl = isControlCommand(text);
    const enabled = state.isEnabled(groupJid);

    if (!enabled) {
        if (isControl) return { allow: true, reason: 'control' };
        return { allow: false, reason: 'group_disabled' };
    }

    const s = settings.get(groupJid);
    const isBotAdmin = permissions.isBotAdmin(groupMetadata, botJid);

    // ═══════════════════════════════════════════
    // 1) فحص الكتم
    // ═══════════════════════════════════════════
    if (mod.isMuted(groupJid, sender)) {
        // امسح رسالته
        if (isBotAdmin) {
            try { await sock.sendMessage(groupJid, { delete: msg.key }); } catch (_) {}
        }
        return { allow: false, reason: 'muted' };
    }

    // ═══════════════════════════════════════════
    // 2) فحص الحظر
    // ═══════════════════════════════════════════
    if (mod.isBanned(groupJid, sender)) {
        if (isBotAdmin) {
            try { await sock.groupParticipantsUpdate(groupJid, [sender], 'remove'); } catch (_) {}
        }
        return { allow: false, reason: 'banned' };
    }

    // ═══════════════════════════════════════════
    // 3) فحص الحماية
    // ═══════════════════════════════════════════
    const actorLevel = permissions.level(sender, groupMetadata, botJid);

    // ✅ حماية المطور من الحماية
    if (isProtectedUser(sender)) {
        return { allow: true, reason: 'protected' };
    }
    if (actorLevel === 'member') {
        const violations = protection.check(msg, s);
        if (violations.length > 0) {
            // امسح الرسالة
            if (isBotAdmin) {
                try { await sock.sendMessage(groupJid, { delete: msg.key }); } catch (_) {}
            } else {
                console.log('  ⚠️ Bot cannot delete — not admin?');
            }

            const reason = violations.map(v => v.reason).join(' + ');
            const count = warnings.add(groupJid, sender, reason, botJid);
            const senderNum = extractNumber(sender);

            logs.log(groupJid, 'protection', botJid, sender, reason);

            // ═══════════════════════════════════════
            // عند الوصول للحد الأقصى = كتم 24 ساعة
            // ═══════════════════════════════════════
            if (count >= warnings.MAX_WARNINGS) {
                const expiresAt = Math.floor(Date.now() / 1000) + warnings.MUTE_DURATION_SEC;
                mod.mute(groupJid, sender, reason, botJid, expiresAt);

                logs.log(groupJid, 'mute', botJid, sender, `${warnings.MUTE_DURATION_SEC}s — ${reason}`);

                try {
                    await sock.sendMessage(groupJid, {
                        text: buildMuteMsg(senderNum, reason, count, warnings.MAX_WARNINGS, 24),
                        mentions: [sender],
                    });
                } catch (_) {}

                console.log(`🔇 Muted ${senderNum} (24h) — ${reason}`);
                return { allow: false, reason: 'protection_mute' };
            }

            // ═══════════════════════════════════════
            // تحذير عادي
            // ═══════════════════════════════════════
            try {
                await sock.sendMessage(groupJid, {
                    text: buildViolationMsg(senderNum, reason, count, warnings.MAX_WARNINGS),
                    mentions: [sender],
                });
            } catch (_) {}

            console.log(`⚠️ Warning ${count}/${warnings.MAX_WARNINGS} → ${senderNum} — ${reason}`);
            return { allow: false, reason: 'protection_violation' };
        }
    }

    return { allow: true };
}

module.exports = { isControlCommand, check, buildViolationMsg, buildMuteMsg, formatRemaining };

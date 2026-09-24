const db = require('./core-database');

const WINDOW_MS = 60 * 1000;          // دقيقة
const MAX_MESSAGES = 12;              // 12 رسالة/دقيقة
const COOLDOWN_STEPS = [20, 30, 40, 50, 60, 80]; // ثواني
const MAX_VIOLATIONS = 5;             // حظر بعد 5 مخالفات

// cache للتحذيرات المبعوتة (لتجنب سبام التحذير)
const warnCache = new Map(); // jid → timestamp

function getState(jid) {
    let row = db.prepare('SELECT * FROM antispam WHERE user_jid = ?').get(jid);
    if (!row) {
        db.prepare('INSERT INTO antispam (user_jid, window_start) VALUES (?, ?)').run(jid, Date.now());
        row = db.prepare('SELECT * FROM antispam WHERE user_jid = ?').get(jid);
    }
    return row;
}

/**
 * فحص رسالة جديدة. يرجع:
 * { ok: true } → كمّل
 * { ok: false, reason: 'cooldown'|'banned', remaining, ... }
 */
function check(jid) {
    const now = Date.now();
    const state = getState(jid);

    // حظر دائم
    if (state.banned) {
        return { ok: false, reason: 'banned', violations: state.violations };
    }

    // لو في cooldown نشط
    if (state.cooldown_until > now) {
        const remaining = Math.ceil((state.cooldown_until - now) / 1000);
        return { ok: false, reason: 'cooldown', remaining, violations: state.violations };
    }

    // لو الـ window انتهى → اصفّر
    let windowStart = state.window_start || now;
    let msgCount = state.msg_count || 0;

    if (now - windowStart > WINDOW_MS) {
        windowStart = now;
        msgCount = 0;
    }

    msgCount++;

    if (msgCount > MAX_MESSAGES) {
        // مخالفة
        const newViolations = state.violations + 1;

        if (newViolations >= MAX_VIOLATIONS) {
            db.prepare('UPDATE antispam SET banned = 1, banned_at = ?, violations = ?, ban_reason = ? WHERE user_jid = ?')
              .run(Math.floor(now/1000), newViolations, 'تجاوز Anti-Spam', jid);
            return { ok: false, reason: 'banned_just_now', violations: newViolations };
        }

        const stepIdx = Math.min(newViolations - 1, COOLDOWN_STEPS.length - 1);
        const cooldownSec = COOLDOWN_STEPS[stepIdx];
        const until = now + cooldownSec * 1000;

        db.prepare('UPDATE antispam SET msg_count = 0, window_start = ?, cooldown_until = ?, violations = ?, last_violation = ? WHERE user_jid = ?')
          .run(now, until, newViolations, Math.floor(now/1000), jid);

        return { ok: false, reason: 'cooldown_just_started', remaining: cooldownSec, violations: newViolations };
    }

    // تحديث العداد
    db.prepare('UPDATE antispam SET msg_count = ?, window_start = ? WHERE user_jid = ?')
      .run(msgCount, windowStart, jid);

    return { ok: true };
}

function getRemaining(jid) {
    const state = getState(jid);
    if (state.banned) return { banned: true, violations: state.violations };
    const now = Date.now();
    if (state.cooldown_until > now) {
        return { cooldown: true, remaining: Math.ceil((state.cooldown_until - now) / 1000) };
    }
    return { ok: true };
}

function shouldSendWarning(jid) {
    const last = warnCache.get(jid) || 0;
    const now = Date.now();
    if (now - last < 5000) return false; // ما نبعتش تحذير أكتر من مرة كل 5 ثواني
    warnCache.set(jid, now);
    return true;
}

function isBanned(jid) {
    const s = getState(jid);
    return s.banned === 1;
}

function getViolations(jid) {
    const s = getState(jid);
    return s.violations || 0;
}

module.exports = {
    check, getRemaining, shouldSendWarning, isBanned, getViolations,
    MAX_MESSAGES, COOLDOWN_STEPS, MAX_VIOLATIONS, WINDOW_MS,
};

/**
 * 👻 Unmute Scheduler
 * يفحص كل دقيقة المكتومين اللي وقتهم خلص ويفكهم
 */
const mod = require('./mod-group-moderation');
const state = require('./mod-group-state');
const logs = require('./mod-group-logs');

let intervalId = null;

async function checkExpired(sock) {
    try {
        const groups = state ? require('./core-database').prepare('SELECT group_jid FROM group_states WHERE enabled = 1').all() : [];

        for (const g of groups) {
            const groupJid = g.group_jid;
            const now = Math.floor(Date.now() / 1000);

            // امسح المكتومين اللي خلص وقتهم
            const expired = require('./core-database')
                .prepare('SELECT * FROM group_mutes WHERE group_jid = ? AND expires_at IS NOT NULL AND expires_at <= ?')
                .all(groupJid, now);

            for (const m of expired) {
                mod.unmute(groupJid, m.user_jid);
                logs.log(groupJid, 'auto_unmute', 'system', m.user_jid, null);

                const num = m.user_jid.split('@')[0].split(':')[0];
                try {
                    await sock.sendMessage(groupJid, {
                        text: `✅ *انتهى وقت الكتم*\n\n@${num}\n\nنورت تاني 👻\nياريت تلتزم بقوانين الجروب.`,
                        mentions: [m.user_jid],
                    });
                } catch (_) {}

                console.log(`🔊 Auto-unmuted ${num} in ${groupJid}`);
            }
        }
    } catch (e) {
        console.error('Scheduler error:', e.message);
    }
}

function start(sock) {
    if (intervalId) return;
    // كل دقيقة
    intervalId = setInterval(() => checkExpired(sock), 60 * 1000);
    console.log('✅ Unmute Scheduler started (every 60s)');
}

function stop() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

module.exports = { start, stop, checkExpired };

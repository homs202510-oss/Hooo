const fmt = require('./util-format');
const botProfile = require('./svc-botProfile');
const profileCache = require('./mod-profileCache');

function buildContext(sock, msg, args, extra = {}) {
    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : jid;
    const senderNumber = sender.split('@')[0].split(':')[0];
    const pushName = msg.pushName || 'مجهول';
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    /**
     * إرسال مع صورة البوت (مرة كل 30 دقيقة)
     */
    async function sendWithProfile(text, opts = {}) {
        const force = !!opts.force;
        const hasImg = botProfile.hasImage();
        const should = hasImg && profileCache.shouldShow(sender, force);

        if (should) {
            const img = botProfile.getImageBuffer();
            if (img.ok) {
                try {
                    await sock.sendMessage(jid, {
                        image: img.buffer,
                        caption: text,
                        mentions: opts.mentions || [],
                    }, { quoted: msg });
                    profileCache.markShown(sender);
                    return;
                } catch (_) {
                    // fallback لنص
                }
            }
        }

        // نص عادي
        await sock.sendMessage(jid, {
            text,
            mentions: opts.mentions || [],
        }, { quoted: msg });
    }

    const ctx = {
        sock, msg, jid, sender, senderNumber, pushName, args, isGroup, mentioned,
        ...extra,

        reply: (text, mentions = []) =>
            sock.sendMessage(jid, { text, mentions }, { quoted: msg }),

        send: (text, mentions = []) =>
            sock.sendMessage(jid, { text, mentions }),

        card: async (title, blocks, mentions = [], opts = {}) => {
            const text = fmt.card(title, blocks);
            if (opts.withProfile) {
                return sendWithProfile(text, { mentions, force: opts.forceProfile });
            }
            return sock.sendMessage(jid, { text, mentions }, { quoted: msg });
        },

        success: (text) =>
            sock.sendMessage(jid, { text: fmt.success(text) }, { quoted: msg }),

        error: (text) =>
            sock.sendMessage(jid, { text: fmt.error(text) }, { quoted: msg }),

        welcome: (text) =>
            sock.sendMessage(jid, { text: fmt.welcome(text) }, { quoted: msg }),

        react: (emoji) =>
            sock.sendMessage(jid, { react: { text: emoji, key: msg.key } }),

        mention: (text, jids) =>
            sock.sendMessage(jid, { text, mentions: jids }, { quoted: msg }),

        // ═══ خاص ═══
        sendWithProfile,
        profileCache,
        botProfile,
    };

    return ctx;
}

module.exports = { buildContext };

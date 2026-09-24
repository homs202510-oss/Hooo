/**
 * 👋 Welcome/Goodbye Handler v4 — مع صورة للاتنين
 */
const settings = require('./mod-group-settings');
const state = require('./mod-group-state');
const { extractNumber } = require('./mod-jid');

function getJidFromParticipant(p) {
    if (!p) return null;
    if (typeof p === 'string') return p;
    if (typeof p === 'object') {
        return p.id || p.jid || p.phoneNumber || p.lid || null;
    }
    return null;
}

async function getProfilePic(sock, jid) {
    try {
        const url = await sock.profilePictureUrl(jid, 'image');
        return url || null;
    } catch (_) {
        // جرب بـ @s.whatsapp.net لو LID
        try {
            const num = extractNumber(jid);
            const url = await sock.profilePictureUrl(num + '@s.whatsapp.net', 'image');
            return url || null;
        } catch (_) {
            return null;
        }
    }
}

function buildWelcomeText(groupName, memberNum) {
    return `❛ ━━━━━━･❪ 👻 ❫ ･━━━━━━ ❜

🌷 *أهلاً بيك في جروب:* ${groupName}

❒ ╭┈⊰ 🌷 الــتــرحــيــب 🌷 ⊰┈ ✦
┊˹📯˼┊ أهــلاً وسهــلاً بـك
┊˹👤˼┊ @${memberNum}

╭─═══════『 🎉✨ أهلاً بانضمامك ✨🎉 』══════─╮

🌟 نورت المكان وزاد النور بحضورك
💫 وجودك بيننا إضافة جميلة نفتخر بها
✨ هنا تجد الود، الاحترام، والمتعة
🎊 شاركنا أفكارك، ضحكتك، وكل ما تحب
📖 هذه ليست مجرد مجموعة… بل عائلة
🎈 أيامك معنا مليئة بالضحك والتفاعل
💌 لا تتردد، فمكانك محفوظ بيننا

╰─═══════『 🌷 استمتع معنا 🌷 』══════─╯

> منور الجروب ┊˹✅˼┊
❛ ━━━━━━･❪ 👻 ❫ ･━━━━━━ ❜
*PHANTOM BOT* 🔥`;
}

function buildGoodbyeText(groupName, memberNum) {
    return `❛ ━━━━━━･❪ 👻 ❫ ･━━━━━━ ❜

💔 *وداعاً*

👤 @${memberNum}

خرجت من *${groupName}*.

🤝 ياريت ترجع تاني.
مكانك هيفضل فاضي لحد ما ترجع.

❛ ━━━━━━･❪ 👻 ❫ ･━━━━━━ ❜
*PHANTOM BOT* 🔥`;
}

async function handleParticipantsUpdate(sock, update) {
    const groupJid = update.id;
    const participants = update.participants || [];
    const action = update.action;

    console.log(`📢 participants.update: ${action} — ${participants.length}`);

    if (!state.isEnabled(groupJid)) {
        console.log('  ⏭️ group not enabled');
        return;
    }

    const s = settings.get(groupJid);

    let groupName = 'الجروب';
    try {
        const meta = await sock.groupMetadata(groupJid);
        groupName = meta.subject || groupName;
    } catch (_) {}

    for (const p of participants) {
        const participantJid = getJidFromParticipant(p);
        if (!participantJid) continue;

        const memberNum = extractNumber(participantJid);

        // ═══ إضافة ═══
        if (action === 'add') {
            if (s.welcome === 1) {
                const pic = await getProfilePic(sock, participantJid);
                const text = buildWelcomeText(groupName, memberNum);

                try {
                    if (pic) {
                        await sock.sendMessage(groupJid, {
                            image: { url: pic },
                            caption: text,
                            mentions: [participantJid],
                        });
                        console.log(`  ✅ Welcome (pic) → ${memberNum}`);
                    } else {
                        await sock.sendMessage(groupJid, {
                            text,
                            mentions: [participantJid],
                        });
                        console.log(`  ✅ Welcome (no pic) → ${memberNum}`);
                    }
                } catch (e) {
                    console.error('  ❌ Welcome failed:', e.message);
                    try {
                        await sock.sendMessage(groupJid, { text, mentions: [participantJid] });
                    } catch (_) {}
                }
            }
        }

        // ═══ خروج ═══
        if (action === 'remove' || action === 'leave') {
            if (s.goodbye === 1) {
                const pic = await getProfilePic(sock, participantJid);
                const text = buildGoodbyeText(groupName, memberNum);

                try {
                    if (pic) {
                        await sock.sendMessage(groupJid, {
                            image: { url: pic },
                            caption: text,
                            mentions: [participantJid],
                        });
                        console.log(`  ✅ Goodbye (pic) → ${memberNum}`);
                    } else {
                        await sock.sendMessage(groupJid, {
                            text,
                            mentions: [participantJid],
                        });
                        console.log(`  ✅ Goodbye (no pic) → ${memberNum}`);
                    }
                } catch (e) {
                    console.error('  ❌ Goodbye failed:', e.message);
                    try {
                        await sock.sendMessage(groupJid, { text, mentions: [participantJid] });
                    } catch (_) {}
                }
            }
        }
    }
}

module.exports = { handleParticipantsUpdate, buildWelcomeText, buildGoodbyeText, getProfilePic };

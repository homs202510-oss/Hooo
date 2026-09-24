const config = require('./config');
const logger = require('./svc-logger');
const { getCommand } = require('./core-loader');
const { buildContext } = require('./core-context');
const antispam = require('./mod-antispam');
const blocks = require('./mod-blocks');
const activity = require('./mod-activity');
const user = require('./mod-user');
const conv = require('./mod-conversation');
const router = require('./mod-conversationRouter');
const { extractNumber } = require('./mod-jid');
const { sanitizeResponse, isValidResponse } = require('./util-sanitizer');
const moderation = require('./mod-aiModeration');
const aiQueue = require('./mod-aiQueue');
const waBlock = require('./mod-whatsappBlock');
const groupCore = require('./mod-group-core');

const processedMsgs = new Map();
const DEDUP_TTL_MS = 60 * 1000;
function isDuplicate(msgId) {
    if (!msgId) return false;
    const now = Date.now();
    for (const [id, ts] of processedMsgs.entries()) {
        if (now - ts > DEDUP_TTL_MS) processedMsgs.delete(id);
    }
    if (processedMsgs.has(msgId)) return true;
    processedMsgs.set(msgId, now);
    return false;
}

const BLOCK_DURATION_WEEKS = 1;

module.exports = { handleMessage };

async function handleMessage(sock, msg) {
    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    const msgId = msg.key.id;

    if (isDuplicate(msgId)) return;

    const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        '';
    if (!text) return;

    const sender = isGroup ? msg.key.participant : jid;
    const senderNumber = extractNumber(sender);
    const isOwner = user.isOwner(sender);
    const isDeveloper = require('./mod-developer').isDeveloper(sender);
    const isProtected = isOwner || isDeveloper;
    const realPnJid = msg.key?.participantPn || msg.key?.senderPn || null;

    // Group Core
    let groupMetadata = null;
    if (isGroup) {
        try { groupMetadata = await sock.groupMetadata(jid); } catch (_) {}
        const coreResult = await groupCore.check({
            sock, msg, text, groupJid: jid, sender, groupMetadata, botJid: sock.user?.id,
        });
        if (!coreResult.allow) return;
    }

    // Anti-Spam
    if (!isProtected) {
        const check = antispam.check(sender);
        if (!check.ok) {
            if (check.reason === 'banned' || check.reason === 'banned_just_now') {
                if (antispam.shouldSendWarning(sender)) {
                    try { await sock.sendMessage(jid, { text: `🚫 *حظر استعمال مؤقت*\n\n@${senderNumber}`, mentions: [sender] }); } catch (_) {}
                }
                return;
            }
            if (check.reason === 'cooldown_just_started') {
                if (antispam.shouldSendWarning(sender)) {
                    try { await sock.sendMessage(jid, { text: `⚠️ @${senderNumber}\n⏳ *${check.remaining}* ثانية`, mentions: [sender] }); } catch (_) {}
                }
                return;
            }
            if (check.reason === 'cooldown') return;
        }
    }

    try { activity.trackMessage(sender); } catch (_) {}
    logger.info(`📩 [${isGroup ? 'جروب' : 'خاص'}] ${senderNumber}: ${text.slice(0, 60)}`);

    // Block check
    if (!isProtected) {
        const blockedUntil = moderation.getBlockedUntil(sender);
        const now = Math.floor(Date.now() / 1000);

        if (blockedUntil > now) {
            const daysLeft = Math.ceil((blockedUntil - now) / 86400);
            if (moderation.detectApology(text)) {
                try {
                    await sock.sendMessage(jid, {
                        text: `⏳ *انت محظور*\n\n@${senderNumber}\n\nباقي *${daysLeft} يوم*.`,
                        mentions: [sender],
                    });
                } catch (_) {}
                return;
            }
            return;
        }

        if (blockedUntil > 0 && blockedUntil <= now) {
            moderation.clearAllState(sender);
            blocks.unblock(sender);
            await waBlock.unblockOnWhatsApp(sock, sender);
            try {
                await sock.sendMessage(jid, {
                    text: `👋 @${senderNumber}\n\nخلصت فترة الحظر 🤝`,
                    mentions: [sender],
                });
            } catch (_) {}
            return;
        }
    }

    // اعتذار
    if (!isProtected) {
        if (moderation.detectApology(text)) {
            const state = moderation.getModState(sender);
            if (state.warnings > 0 && !moderation.wasApologyUsed(sender)) {
                moderation.resetWarnings(sender);
                moderation.markApologyUsed(sender);
                try {
                    await sock.sendMessage(jid, {
                        text: `✅ *شكراً لاعتذارك يا @${senderNumber}*\n\nالتحذير اتصفّر 👻`,
                        mentions: [sender],
                    });
                } catch (_) {}
                return;
            }
        }
    }

    if (blocks.isBlocked(sender) && !isProtected) return;

    // Commands
    if (text.startsWith(config.prefix)) {
        try { activity.trackCommand(sender); } catch (_) {}
        const args = text.slice(config.prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();
        if (require('./lib-gate').shouldIgnore(jid, sender, commandName)) return;
        const command = getCommand(commandName);

        if (!command) {
            const ctx = buildContext(sock, msg, []);
            return ctx.error(`الأمر "${commandName}" غير موجود`);
        }
        if (command.adminOnly && !isProtected) {
            const ctx = buildContext(sock, msg, []);
            return ctx.error('الأمر ده للمالك بس');
        }
        if (command.groupOnly && !isGroup) {
            const ctx = buildContext(sock, msg, []);
            return ctx.error('الأمر ده في الجروبات بس');
        }
        if (command.privateOnly && isGroup) {
            const ctx = buildContext(sock, msg, []);
            return ctx.error('الأمر ده في الخاص بس');
        }

        const ctx = buildContext(sock, msg, args, { command, groupMetadata });
        const handler = command.run || command.execute;
        try { await handler(ctx); }
        catch (err) {
            logger.error(`❌ ${commandName}: ${err.message}`);
            try { await ctx.error(`خطأ: ${err.message}`); } catch (_) {}
        }
        return;
    }

    // Silenced
    const silenceCmd = moderation.detectSilenceCmd(text);
    if (silenceCmd === 'silence') {
        moderation.setSilenced(sender, text);
        try { await sock.sendMessage(jid, { text: '🤐 حسناً', quoted: msg }); } catch (_) {}
        return;
    }
    if (silenceCmd === 'unmute') {
        if (moderation.isSilenced(sender)) {
            moderation.unmute(sender);
            try { await sock.sendMessage(jid, { text: '👻 تمام، رجعت', quoted: msg }); } catch (_) {}
            return;
        }
    }

    // شتيمة
    if (!isProtected) {
        const prof = moderation.detectProfanity(text);
        if (prof.level !== 'none') {
            const state = moderation.getModState(sender);
            const hasWarning = state.warnings > 0;
            const usedApology = state.apology_used === 1;

            if (!hasWarning && !usedApology) {
                moderation.bumpWarning(sender);
                try {
                    await sock.sendMessage(jid, {
                        text: `⚠️ *تحذير*\n\n@${senderNumber}\n\nالكلام ده مش حلو.\n🔴 *فرصة وحيدة* — اعتذر أو هتحظر أسبوع.`,
                        mentions: [sender],
                    });
                } catch (_) {}
                return;
            }

            if (hasWarning || usedApology) {
                const until = moderation.logBlock(sender, `شتيمة`, BLOCK_DURATION_WEEKS);
                moderation.setBlockedUntil(sender, until);
                blocks.block(sender, 'شتيمة', 'ai_moderation');
                await waBlock.blockOnWhatsApp(sock, sender);
                try {
                    await sock.sendMessage(jid, {
                        text: `🚫 *تم حظرك ${BLOCK_DURATION_WEEKS} أسبوع*\n\n@${senderNumber}`,
                        mentions: [sender],
                    });
                } catch (_) {}
                return;
            }
        }
    }

    if (moderation.isSilenced(sender)) return;

    // Conversation
    const inConvMode = conv.isActive(sender, isGroup);
    if (isGroup) {
        if (!inConvMode) return;
        const botJids = router.getBotJids(sock);
        const directed = router.checkDirected(msg, botJids);
        if (!directed.directed) return;
        await handleAiReply(sock, msg, jid, sender, senderNumber, directed.cleanText || text, true);
        return;
    }

    aiQueue.enqueue(sender, text, {
        sock, msg, jid, sender, senderNumber, pushName: msg.pushName,
    }, async (allTexts, meta) => {
        const combined = allTexts.length === 1 ? allTexts[0] : allTexts.join('\n');
        await handleAiReply(meta.sock, meta.msg, meta.jid, meta.sender, meta.senderNumber, combined, false, allTexts.length);
    });
}

async function handleAiReply(sock, msg, jid, sender, senderNumber, userText, isGroup, msgCount = 1) {
    const aiState = require('./mod-aiState');
    if (!aiState.isEnabled(sender)) aiState.setEnabled(sender, true);

    const rate = aiState.canRequest(sender);
    if (!rate.ok) return;

    try { await sock.sendPresenceUpdate('composing', jid); } catch (_) {}
    try { activity.trackAiMsg(sender); } catch (_) {}
    aiState.incrementMsg(sender);

    const ai = require('./mod-ai');
    const aiCtx = require('./mod-aiContext');
    const aiMemory = require('./mod-aiMemory');

    aiMemory.addConvo(sender, 'user', userText);

    const intent = ai.detectIntent(userText);
    const history = aiMemory.getConvo(sender, 3);
    const memories = aiMemory.getMemory(sender, 4);

    let fullPrompt = aiCtx.buildPrompt(sender, msg.pushName, userText, {
        aboutBot: intent.aboutBot, memories,
    });
    if (msgCount > 1) {
        fullPrompt = `[ملاحظة] المستخدم بعت ${msgCount} رسائل.\n\n` + fullPrompt;
    }

    let reply = '';
    let aiOk = false;
    const startTime = Date.now();

    try {
        const result = await ai.generate(fullPrompt, {
            history, temperature: intent.aboutBot ? 0.7 : 0.95, maxTokens: 500,
        });
        if (result.ok && result.text) { reply = result.text; aiOk = true; }
        logger.info(`⚡ AI: ${Date.now() - startTime}ms`);
    } catch (e) { logger.error(`❌ AI: ${e.message}`); }

    reply = sanitizeResponse(reply);
    if (!aiOk || !isValidResponse(reply)) {
        reply = ai.fallbackReply(userText);
    }
    if (!reply) return;

    const sig = '\n\n_🤖 رد AI_';
    const finalText = reply + sig;

    aiMemory.addConvo(sender, 'assistant', reply);
    aiState.incrementAiMsg(sender);

    try { await sock.sendPresenceUpdate('paused', jid); } catch (_) {}

    // ✅ صورة البوت مع ردود AI
    const botProfile = require('./svc-botProfile');
    const profileCache = require('./mod-profileCache');
    const hasImg = botProfile.hasImage();
    const should = hasImg && profileCache.shouldShow(sender);

    try {
        if (should) {
            const img = botProfile.getImageBuffer();
            if (img.ok) {
                if (isGroup) {
                    await sock.sendMessage(jid, {
                        image: img.buffer,
                        caption: `👻 @${senderNumber}\n\n${finalText}`,
                        mentions: [sender],
                    });
                } else {
                    await sock.sendMessage(jid, { image: img.buffer, caption: finalText });
                }
                profileCache.markShown(sender);
                return;
            }
        }

        if (isGroup) {
            await sock.sendMessage(jid, {
                text: `👻 @${senderNumber}\n\n${finalText}`,
                mentions: [sender], quoted: msg,
            });
        } else {
            await sock.sendMessage(jid, { text: finalText }, { quoted: msg });
        }
    } catch (e) {
        logger.error('reply failed:', e.message);
    }
}

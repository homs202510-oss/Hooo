const { isElite } = require('./lib-roles');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

const timers = new Map();

module.exports = {
    command: 'فتح',
    description: '🔓 فتح المجموعة مع إمكانية تحديد المدة (مثلاً 1د أو 30ث)',
    usage: '.فتح أو .فتح 2د أو .فتح 30ث',
    category: 'ادارة',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;

            if (!groupJid || !groupJid.endsWith('@g.us')) {
                return await sock.sendMessage(groupJid, {
                    text: '❌ هذا الأمر يعمل فقط داخل المجموعات.'
                }, { quoted: msg });
            }

            const senderJid = msg.key.participant || msg.participant || msg.key.remoteJid;
            const senderLid = senderJid.split('@')[0];
            const decodedSender = decode(senderJid);

            // ===== التحقق من الصلاحيات (النخبة أو مشرف) =====
            let hasPermission = false;

            if (isElite(senderLid)) {
                hasPermission = true;
            }

            if (!hasPermission) {
                try {
                    const groupMetadata = await sock.groupMetadata(groupJid);
                    const participant = groupMetadata.participants.find(p =>
                        p.id === senderJid ||
                        p.id === decodedSender ||
                        p.id === senderJid.split('@')[0] + '@s.whatsapp.net'
                    );
                    if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
                        hasPermission = true;
                    }
                } catch (e) {
                    console.error('خطأ في جلب بيانات المجموعة:', e);
                }
            }

            if (!hasPermission) {
                return await sock.sendMessage(groupJid, {
                    text: 'ذل من لا صلاحيات له 😂🫵.'
                }, { quoted: msg });
            }

            const groupMetadata = await sock.groupMetadata(groupJid);

            // ===== استخراج المدة من النص =====
            let body = msg.message?.extendedTextMessage?.text || msg.message?.conversation || '';
            body = body.trim();
            let args = body.split(/\s+/).slice(1);

            let durationMs = null;

            if (args && args.length > 0) {
                const match = args[0].match(/^(\d+)([دث])$/);
                if (match) {
                    const value = parseInt(match[1]);
                    const unit = match[2];

                    if (isNaN(value) || value <= 0) {
                        return await sock.sendMessage(groupJid, {
                            text: '❌ المدة يجب أن تكون رقمًا أكبر من صفر.'
                        }, { quoted: msg });
                    }

                    durationMs = unit === 'د' ? value * 60 * 1000 : value * 1000;
                } else {
                    return await sock.sendMessage(groupJid, {
                        text: '❌ صيغة المدة غير صحيحة. استخدم مثل: 2د أو 30ث'
                    }, { quoted: msg });
                }
            }

            // ===== التحقق من حالة المجموعة =====
            if (groupMetadata.announce === false) {
                return await sock.sendMessage(groupJid, {
                    text: 'ℹ️ المجموعة مفتوحة بالفعل.'
                }, { quoted: msg });
            }

            // ===== فتح المجموعة =====
            await sock.groupSettingUpdate(groupJid, 'not_announcement');

            if (timers.has(groupJid)) {
                clearTimeout(timers.get(groupJid));
                timers.delete(groupJid);
            }

            // ===== إذا كانت هناك مدة، نغلق تلقائياً بعدها =====
            if (durationMs) {
                const timer = setTimeout(async () => {
                    try {
                        await sock.groupSettingUpdate(groupJid, 'announcement');
                        await sock.sendMessage(groupJid, {
                            text: '🔒 تم قفل المجموعة تلقائياً بعد انتهاء المهلة.'
                        });
                        timers.delete(groupJid);
                    } catch (e) {
                        console.error('❌ فشل القفل التلقائي:', e);
                    }
                }, durationMs);
                timers.set(groupJid, timer);

                await sock.sendMessage(groupJid, {
                    text: `🔓 تم فتح المجموعة لمدة ${args[0]}.`
                });

            } else {
                await sock.sendMessage(groupJid, {
                    text: '🔓 تم فتح المجموعة بدون مدة زمنية.'
                });
            }

        } catch (error) {
            console.error('❌ حدث خطأ أثناء تنفيذ أمر الفتح:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ أثناء تنفيذ الأمر:\n\n${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};
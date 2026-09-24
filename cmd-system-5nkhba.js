// plugins/نخبة.js - إدارة النخبة (نسخة أسطورية عربية)

const {
    eliteNumbers,
    isElite,
    addEliteNumber,
    removeEliteNumber,
    extractPureNumber
} = require('./lib-roles');

const hay = require('./lib-roles');

module.exports = {
    command: 'نخبة',
    description: 'إضافة أو إزالة رقم من قائمة النخبة أو عرض الموجودين حالياً (للنخبة فقط)',
    usage: '.نخبة اضف/ازل/عرض + منشن أو رد أو رقم',
    category: 'نظام',

    async execute(sock, msg) {
        try {
            const senderJid = msg.key.participant || msg.participant || msg.key.remoteJid;
            const senderLid = hay.toLid(senderJid);
            const senderNumber = extractPureNumber(senderJid);

            // التحقق من الصلاحيات الأساسية
            const isSenderFounder = hay.isFounder(senderLid);
            const isSenderOwnerbot = hay.isOwnerbot(senderLid);
            const isSenderDeveloper = hay.isDeveloper(senderLid);
            const isSenderElite = isElite(senderNumber);

            // السماح فقط للنخبة والمطورين
            if (!isSenderElite && !isSenderDeveloper && !isSenderOwnerbot && !isSenderFounder) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ هذا الأمر مخصص للنخبة والمطورين فقط\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
                }, { quoted: msg });
            }

            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const parts = text.trim().split(/\s+/);
            const action = parts[1];

            if (!action || !['اضف', 'ازل', 'عرض'].includes(action)) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n📖 دليل الأوامر\n\n◈ .نخبة اضف + منشن/رد/رقم\n◈ .نخبة ازل + منشن/رد/رقم\n◈ .نخبة عرض\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
                }, { quoted: msg });
            }

            if (action === 'عرض') {
                const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
                const participants = groupMetadata.participants;

                const eliteInGroup = participants
                    .filter(p => eliteNumbers.includes(p.id.split('@')[0]))
                    .map(p => p.id);

                if (eliteInGroup.length === 0) {
                    return await sock.sendMessage(msg.key.remoteJid, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🙁 لا يوجد أحد من النخبة حالياً في الجروب\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
                    }, { quoted: msg });
                }

                let output = `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐄𝐋𝐈𝐓𝐄 👑\n━━━━━━━━━━━━━━━━━━━━\n`;
                output += `◈ فرسان النخبة المتواجدون\n`;
                eliteInGroup.forEach((jid, i) => {
                    output += `┣ ${i + 1}. @${jid.split('@')[0]}\n`;
                });
                output += `\n⚡ العدد: ${eliteInGroup.length}`;
                output += `\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

                return sock.sendMessage(msg.key.remoteJid, {
                    text: output,
                    mentions: eliteInGroup
                }, { quoted: msg });
            }

            // منع النخبة من استخدام اضف وازل
            if (isSenderElite && !isSenderDeveloper && !isSenderOwnerbot && !isSenderFounder) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🚫 النخبة لا يمكنهم إضافة أو إزالة أعضاء من النخبة\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
                }, { quoted: msg });
            }

            let targetJid = null;
            let targetNumber = null;

            const ctx = msg.message?.extendedTextMessage?.contextInfo || {};
            if (ctx?.mentionedJid?.[0]) {
                targetJid = ctx.mentionedJid[0];
            } else if (ctx?.participant) {
                targetJid = ctx.participant;
            }

            if (targetJid) {
                targetNumber = extractPureNumber(targetJid);
            } else if (parts[2] && /^\d{5,}$/.test(parts[2])) {
                targetNumber = extractPureNumber(parts[2]);
                targetJid = `${targetNumber}@s.whatsapp.net`;
            }

            if (!targetNumber) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n📍 استهداف مطلوب\nيجب المنشن أو الرد أو إدخال رقم صحيح\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
                }, { quoted: msg });
            }

            if (targetNumber === senderNumber) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🚫 لا يمكنك تنفيذ هذا الأمر على نفسك\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
                }, { quoted: msg });
            }

            // التحقق من صلاحيات الهدف
            const targetLid = hay.toLid(targetJid);
            const isTargetFounder = hay.isFounder(targetLid);
            const isTargetOwnerbot = hay.isOwnerbot(targetLid);
            const isTargetDeveloper = hay.isDeveloper(targetLid);

            if (action === 'اضف') {
                // منع إضافة المالك والمطورين للنخبة
                if (isTargetFounder || isTargetOwnerbot || isTargetDeveloper) {
                    return sock.sendMessage(msg.key.remoteJid, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🚫 لا يمكن إضافة المالك أو المطورين إلى النخبة\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`,
                        mentions: [targetJid]
                    }, { quoted: msg });
                }

                if (isElite(targetNumber)) {
                    return sock.sendMessage(msg.key.remoteJid, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n⚠️ @${targetNumber} موجود بالفعل في قائمة النخبة\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`,
                        mentions: [targetJid]
                    }, { quoted: msg });
                }

                addEliteNumber(targetNumber);

                return sock.sendMessage(msg.key.remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🎉 تمت الإضافة بنجاح\nتم إضافة @${targetNumber} إلى قائمة النخبة\n💾 تم تحديث الذاكرة والملف\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`,
                    mentions: [targetJid]
                }, { quoted: msg });
            }

            if (action === 'ازل') {
                // منع إزالة المالك والمطورين من النخبة
                if (isTargetFounder || isTargetOwnerbot || isTargetDeveloper) {
                    return sock.sendMessage(msg.key.remoteJid, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🚫 لا يمكن إزالة المالك أو المطورين من النخبة\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`,
                        mentions: [targetJid]
                    }, { quoted: msg });
                }

                if (!isElite(targetNumber)) {
                    return sock.sendMessage(msg.key.remoteJid, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n⚠️ @${targetNumber} غير موجود في قائمة النخبة\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`,
                        mentions: [targetJid]
                    }, { quoted: msg });
                }

                removeEliteNumber(targetNumber);

                return sock.sendMessage(msg.key.remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🗑️ تمت الإزالة بنجاح\nتم إزالة @${targetNumber} من قائمة النخبة\n💾 تم تحديث الذاكرة والملف\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`,
                    mentions: [targetJid]
                }, { quoted: msg });
            }

        } catch (خطأ) {
            console.error('نخبة error:', خطأ);
            return sock.sendMessage(msg.key.remoteJid, {
                text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ خطأ غير متوقع\n${خطأ.message}\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
            }, { quoted: msg });
        }
    }
};
const { isElite } = require('./lib-roles');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

const timers = new Map(); // لتخزين مؤقتات القفل لكل جروب

module.exports = {
  command: 'شات',
  category: 'ادارة',
  description: 'قفل أو فتح الشات مع إمكانية تحديد المدة (مثلاً 1د أو 30ث)',
  usage: '.شات قفل 2د أو .شات فتح 30ث أو .شات قفل',

  async execute(sock, msg) {
    try {
      const groupJid = msg.key.remoteJid;

      if (!groupJid.endsWith('@g.us')) {
        return await sock.sendMessage(groupJid, {
          text: '❗ هذا الأمر يعمل فقط داخل المجموعات.'
        }, { quoted: msg });
      }

      // استخدام senderJid الأصلي بدلاً من decode
      const senderJid = msg.key.participant || msg.participant || msg.key.remoteJid;
      const senderLid = senderJid.split('@')[0];
      const decodedSender = decode(senderJid);

      // ===== التحقق من الصلاحيات (النخبة أو مشرف) =====
      let hasPermission = false;

      // 1. التحقق من النخبة
      if (isElite(senderLid)) {
        hasPermission = true;
      }

      // 2. التحقق من صلاحية المشرف في المجموعة
      if (!hasPermission) {
        try {
          const groupMetadata = await sock.groupMetadata(groupJid);
          // مقارنة مع كلا الصيغتين (الأصلية والمفككة)
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

      let body = msg.message?.extendedTextMessage?.text || msg.message?.conversation || '';
      body = body.trim();
      let args = body.split(/\s+/).slice(1);

      if (args.length < 1) {
        return await sock.sendMessage(groupJid, {
          text: '❌ يرجى كتابة الأمر بهذا الشكل:\n.شات قفل 2د أو .شات فتح 30ث أو .شات قفل'
        }, { quoted: msg });
      }

      const action = args[0].toLowerCase();
      let durationMs = null;

      if (args.length >= 2) {
        const match = args[1].match(/^(\d+)([دث])$/);
        if (!match) {
          return await sock.sendMessage(groupJid, {
            text: '❌ صيغة المدة غير صحيحة. استخدم مثل: 1د أو 30ث'
          }, { quoted: msg });
        }

        const value = parseInt(match[1]);
        const unit = match[2];

        if (isNaN(value) || value <= 0) {
          return await sock.sendMessage(groupJid, {
            text: '❌ المدة يجب أن تكون رقمًا أكبر من صفر.'
          }, { quoted: msg });
        }

        durationMs = unit === 'د' ? value * 60 * 1000 : value * 1000;
      }

      const setGroupMode = async (mode) => {
        await sock.groupSettingUpdate(groupJid, mode);
      };

      if (action === 'قفل') {
        await setGroupMode('announcement');

        if (timers.has(groupJid)) clearTimeout(timers.get(groupJid));

        if (durationMs) {
          const timer = setTimeout(async () => {
            await setGroupMode('not_announcement');
            await sock.sendMessage(groupJid, {
              text: '🔓 تم فتح الشات تلقائياً بعد انتهاء المهلة.'
            });
            timers.delete(groupJid);
          }, durationMs);
          timers.set(groupJid, timer);
        }

        await sock.sendMessage(groupJid, {
          text: durationMs
            ? `🔒 تم قفل الشات لمدة ${args[1]}.`
            : `🔒 تم قفل الشات بدون مدة زمنية.`
        });

      } else if (action === 'فتح') {
        await setGroupMode('not_announcement');

        if (timers.has(groupJid)) clearTimeout(timers.get(groupJid));

        if (durationMs) {
          const timer = setTimeout(async () => {
            await setGroupMode('announcement');
            await sock.sendMessage(groupJid, {
              text: '🔒 تم قفل الشات تلقائياً بعد انتهاء المهلة.'
            });
            timers.delete(groupJid);
          }, durationMs);
          timers.set(groupJid, timer);
        }

        await sock.sendMessage(groupJid, {
          text: durationMs
            ? `🔓 تم فتح الشات لمدة ${args[1]}.`
            : `🔓 تم فتح الشات بدون مدة زمنية.`
        });

      } else {
        await sock.sendMessage(groupJid, {
          text: '❌ الأمر غير مفهوم. استخدم:\n.شات قفل 1د أو .شات فتح 30ث أو .شات قفل'
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('✗ خطأ في أمر شات:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ حدث خطأ أثناء تنفيذ الأمر:\n\n${error.message || error.toString()}`
      }, { quoted: msg });
    }
  }
};
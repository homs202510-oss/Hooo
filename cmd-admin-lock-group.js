const { isElite } = require('./lib-roles');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

const timers = new Map();

module.exports = {
  command: 'قفل',
  category: 'ادارة',
  description: '🔒 قفل المجموعة مع إمكانية تحديد المدة (مثلاً 1د أو 30ث)',
  usage: '.قفل 2د أو .قفل 30ث أو .قفل',

  async execute(sock, msg) {
    try {
      const groupJid = msg.key.remoteJid;

      if (!groupJid.endsWith('@g.us')) {
        return await sock.sendMessage(groupJid, {
          text: '❗ هذا الأمر يعمل فقط داخل المجموعات.'
        }, { quoted: msg });
      }

      // استخدام sender مباشرة بدون decode
      const senderJid = msg.key.participant || msg.participant || msg.key.remoteJid;
      const senderLid = senderJid.split('@')[0];

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
          // مقارنة الـ JID كاملاً
          const participant = groupMetadata.participants.find(p => p.id === senderJid || p.id === decode(senderJid));
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

      // لو مقفولة
      if (groupMetadata.announce === true) {
        return await sock.sendMessage(groupJid, {
          text: 'ℹ️ الجروب مقفول بالفعل.'
        }, { quoted: msg });
      }

      // ===== استخراج الوسائط من النص =====
      let body = msg.message?.extendedTextMessage?.text || msg.message?.conversation || '';
      body = body.trim();
      let args = body.split(/\s+/).slice(1);

      let durationMs = null;

      // تحليل المدة إن وُجدت
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

      // ===== قفل المجموعة =====
      await sock.groupSettingUpdate(groupJid, 'announcement');

      if (timers.has(groupJid)) {
        clearTimeout(timers.get(groupJid));
        timers.delete(groupJid);
      }

      if (durationMs) {
        const timer = setTimeout(async () => {
          try {
            await sock.groupSettingUpdate(groupJid, 'not_announcement');
            await sock.sendMessage(groupJid, {
              text: '🔓 تم فتح المجموعة تلقائياً بعد انتهاء المهلة.'
            });
            timers.delete(groupJid);
          } catch (e) {
            console.error('❌ فشل الفتح التلقائي:', e);
          }
        }, durationMs);
        timers.set(groupJid, timer);
      }

      await sock.sendMessage(groupJid, {
        text: durationMs
          ? `🔒 تم قفل المجموعة لمدة ${args[0]}.`
          : `🔒 تم قفل المجموعة بدون مدة زمنية.`
      });

    } catch (error) {
      console.error('✗ خطأ في أمر قفل:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ حدث خطأ أثناء تنفيذ الأمر:\n\n${error.message || error.toString()}`
      }, { quoted: msg });
    }
  }
};
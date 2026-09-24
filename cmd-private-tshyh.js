const { jidDecode } = require('@whiskeysockets/baileys');
const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';
const clean = num => num.replace(/[^0-9]/g, '');

module.exports = {
  command: 'تصحيح',
  description: 'يرقي الإدارة (مطور/أونر) وينزل أي مشرف غيرهم',
  usage: '.تنظيف_الادارة',
  category: 'خاصة',

  async execute(sock, msg) {
    try {
      const groupJid = msg.key.remoteJid;
      const sender = decode(msg.key.participant || groupJid);
      const senderNum = clean(sender);

      // تأكد أنه جروب
      if (!groupJid.endsWith('@g.us')) {
        return await sock.sendMessage(groupJid, {
          text: '❗ هذا الأمر يعمل داخل المجموعات فقط.'
        }, { quoted: msg });
      }

      // صلاحيات
      if (!isFounder(senderNum) && !isOwnerbot(senderNum) && !isDeveloper(senderNum)) {
        return await sock.sendMessage(groupJid, {
          text: '❗ ذل من لا صلاحيات له 😂🫵.'
        }, { quoted: msg });
      }

      const metadata = await sock.groupMetadata(groupJid);
      const botNumber = clean(decode(sock.user.id));

      let toPromote = [];
      let toDemote = [];

      for (let p of metadata.participants) {
        const num = clean(decode(p.id));
        const isAdmin = p.admin !== null;

        const isStaff = isFounder(num) || isOwnerbot(num) || isDeveloper(num);

        // ترقية الإدارة
        if (isStaff && !isAdmin && num !== botNumber) {
          toPromote.push(p.id);
        }

        // تنزيل غير الإدارة
        if (!isStaff && isAdmin && num !== botNumber) {
          toDemote.push(p.id);
        }
      }

      // تنفيذ العمليات
      if (toPromote.length > 0) {
        await sock.groupParticipantsUpdate(groupJid, toPromote, 'promote');
      }

      if (toDemote.length > 0) {
        await sock.groupParticipantsUpdate(groupJid, toDemote, 'demote');
      }

      // رسالة
      let text = `🛠️ تم تنظيف الإدارة:\n\n`;

      if (toPromote.length > 0) {
        text += `👑 تم ترقية (${toPromote.length}):\n`;
        toPromote.forEach(id => {
          text += `✔️ @${clean(decode(id))}\n`;
        });
      }

      if (toDemote.length > 0) {
        text += `\n⬇️ تم تنزيل (${toDemote.length}):\n`;
        toDemote.forEach(id => {
          text += `❌ @${clean(decode(id))}\n`;
        });
      }

      if (toPromote.length === 0 && toDemote.length === 0) {
        text += `⚠️ كل شيء مرتب بالفعل.`;
      }

      await sock.sendMessage(groupJid, {
        text,
        mentions: [...toPromote, ...toDemote]
      }, { quoted: msg });

    } catch (err) {
      console.error('❌ خطأ:', err);

      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ حدث خطأ:\n${err.message || err}`
      }, { quoted: msg });
    }
  }
};
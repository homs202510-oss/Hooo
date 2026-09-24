const { jidDecode } = require('@whiskeysockets/baileys');
const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');

const decode = (jid) => {
  if (!jid) return '';
  return jidDecode(jid)?.user || jid.split('@')[0];
};

module.exports = {
  command: 'ن',
  description: 'يزيل إشراف الجميع باستثناء المطور، الأونر، وال ويرفعهم إذا لم يكونوا أدمن',
  usage: '.ن',
  category: 'خاصة',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    try {
      const sender = decode(msg.key.participant || msg.key.remoteJid);

      // التحقق من صلاحيات المرسل
      const hasAccess = isFounder(sender) || isOwnerbot(sender) || isDeveloper(sender);
      if (!hasAccess) return;

      if (!chatId.endsWith('@g.us')) return;

      const metadata = await sock.groupMetadata(chatId);
      const botNumber = decode(sock.user.id);

      const toDemote = [];
      const toPromote = [];

      for (const participant of metadata.participants) {
        const user = decode(participant.id);

        if (user === botNumber) continue; // تجاهل البوت نفسه

        const isElite = isFounder(user) || isOwnerbot(user) || isDeveloper(user);

        // إزالة إشراف أي عضو ليس نخبة
        if (participant.admin && !isElite) toDemote.push(participant.id);

        // رفع المطور، الأونر، وال إذا لم يكونوا أدمن
        if (isElite && !participant.admin) toPromote.push(participant.id);
      }

      if (toDemote.length > 0) await sock.groupParticipantsUpdate(chatId, toDemote, 'demote');
      if (toPromote.length > 0) await sock.groupParticipantsUpdate(chatId, toPromote, 'promote');

      // رسالة بسيطة بعد التنفيذ
      await sock.sendMessage(chatId, { text: 'اوف زحلقتك بالغلط 🤧' }, { quoted: msg });

    } catch (err) {
      console.error(err);
    }
  }
};
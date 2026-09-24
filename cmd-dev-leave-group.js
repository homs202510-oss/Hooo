const hay = require('./lib-roles');

module.exports = {
  command: ['اخرج', 'غور', 'غادر'],
  category: 'المطور',
  description: '🚪 يخرج البوت من المجموعة (فقط للمطور)',

  async execute(sock, message) {
    try {
      const sender = message.sender || (message.key && message.key.participant);
      const chatId = message.chat || (message.key && message.key.remoteJid);

      if (!sender || !chatId) return;

      const senderLid = hay.toLid(sender);

      // تحقق من كون المرسل مطور / OwnerBot
      if (!(hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid))) {
        await sock.sendMessage(chatId, {
          text: '❌ هذا الأمر مخصص للمطور فقط.',
        }, { quoted: message });
        return;
      }

      if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, {
          text: '❌ هذا الأمر يعمل فقط داخل المجموعات.',
        }, { quoted: message });
        return;
      }

      // جلب اسم المجموعة (اختياري)
      let groupName = 'المجموعة';
      try {
        const groupMetadata = await sock.groupMetadata(chatId);
        groupName = groupMetadata.subject;
      } catch {}

      // رسالة الوداع مع منشن
      const senderMention = `@${sender.split('@')[0]}`;
      const decoratedText = `بحرمكم مني باي 🫡`;

      await sock.sendMessage(chatId, { 
        text: decoratedText,
        mentions: [sender]
      }, { quoted: message });

      // الخروج من المجموعة
      await sock.groupLeave(chatId);

      console.log(`🚪 تم خروج البوت من ${groupName} بواسطة ${sender.split('@')[0]}`);

    } catch (error) {
      console.error('✗ خطأ في تنفيذ أمر اخرج:', error);
      
      // محاولة إرسال رسالة خطأ
      try {
        await sock.sendMessage(chatId, {
          text: `❌ حدث خطأ: ${error.message || 'خطأ غير معروف'}`
        }, { quoted: message });
      } catch {}
    }
  },
};
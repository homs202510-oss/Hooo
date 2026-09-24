const { jidDecode } = require('@whiskeysockets/baileys');
const hay = require('./lib-roles');

// للحصول على الرقم فقط (للاستخدام الداخلي في التحقق من الرتبة)
const getNumber = jid => (jidDecode(jid)?.user || jid.split('@')[0]);

// التحقق من صلاحية المشرف في المجموعة
async function isGroupAdmin(sock, chatId, jid) {
  try {
    const groupMetadata = await sock.groupMetadata(chatId);
    const participant = groupMetadata.participants.find(p => p.id === jid);
    return participant?.admin === 'superadmin' || participant?.admin === 'admin';
  } catch {
    return false;
  }
}

module.exports = {
  category: 'ادارة',
  command: "طير",
  description: "طرد عضو أو عدة أعضاء من المجموعة دفعة واحدة (بدون قفل المجموعة).",
  usage: ".طير @العضو أو رد على رسالته",

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    try {
      const sender = msg.key.participant || msg.key.remoteJid;

      if (!sender || !chatId) return;

      const senderLid = hay.toLid(sender);

      // صلاحيات المرسل (بدون Elite)
      const isSenderFounder = hay.isFounder(senderLid);
      const isSenderOwnerbot = hay.isOwnerbot(senderLid);
      const isSenderDeveloper = hay.isDeveloper(senderLid);
      const isSenderAdmin = await isGroupAdmin(sock, chatId, sender);

      // التحقق من صلاحيات المرسل (مالك البوت، مطور، أو مشرف)
      if (!(isSenderFounder || isSenderOwnerbot || isSenderDeveloper || isSenderAdmin)) {
        await sock.sendMessage(chatId, {
          text: '❌ هذا الأمر مخصص للمطورين، ومالك البوت، والمشرفين.'
        }, { quoted: msg });
        return;
      }

      if (!chatId.endsWith('@g.us')) {
        return await sock.sendMessage(chatId, { text: '❌ هذا الأمر يعمل فقط داخل المجموعات.' }, { quoted: msg });
      }

      const metadata = await sock.groupMetadata(chatId);

      // تحديد جميع الأعضاء المستهدفين (JIDs الأصلية دون تحويل)
      let targetJids = [];
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targetJids = msg.message.extendedTextMessage.contextInfo.mentionedJid;
      } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJids = [msg.message.extendedTextMessage.contextInfo.participant];
      }

      if (!targetJids.length) {
        return sock.sendMessage(chatId, { text: '❌ لم يتم تحديد أي عضو للطرد.' }, { quoted: msg });
      }

      // تصفية الأهداف الصالحة للطرد
      const validTargets = [];
      for (const targetJid of targetJids) {
        // لا يطرد نفسه أو البوت
        if (targetJid === sock.user.id || targetJid === sender) {
          await sock.sendMessage(chatId, { text: `❌ لا يمكن طرد ${targetJid.split('@')[0]}` }, { quoted: msg });
          continue;
        }

        // التحقق من وجود العضو في المجموعة
        const participant = metadata.participants.find(p => p.id === targetJid);
        if (!participant) continue;

        const targetLid = hay.toLid(targetJid);
        const isTargetFounder = hay.isFounder(targetLid);
        const isTargetOwnerbot = hay.isOwnerbot(targetLid);
        const isTargetDeveloper = hay.isDeveloper(targetLid);
        const isTargetAdmin = participant.admin === 'superadmin' || participant.admin === 'admin';

        // التدرج الهرمي للطرد (بدون Elite)
        let canKick = false;
        if (isSenderFounder) {
          canKick = true; // الاونر يطرد أي شخص
        } else if (isSenderOwnerbot && !isTargetFounder) {
          canKick = true;
        } else if (isSenderDeveloper && !isTargetFounder && !isTargetOwnerbot && !isTargetDeveloper) {
          canKick = true;
        } else if (isSenderAdmin && !isTargetFounder && !isTargetOwnerbot && !isTargetDeveloper && !isTargetAdmin) {
          canKick = true; // المشرف يطرد الأعضاء العاديين فقط
        }

        if (canKick) {
          validTargets.push(targetJid);
        } else {
          await sock.sendMessage(chatId, {
            text: `🚫 لا يمكن طرد ${targetJid.split('@')[0]} (رتبة أعلى أو مساوية)`
          }, { quoted: msg });
        }
      }

      if (validTargets.length === 0) {
        return sock.sendMessage(chatId, { text: '⚠️ لم يتم العثور على أعضاء صالحين للطرد.' }, { quoted: msg });
      }

      // منشن جماعي لكل المستهدفين قبل الطرد
      const mentionsText = validTargets.map(jid => `@${jid.split('@')[0]}`).join(' ');
      await sock.sendMessage(chatId, {
        text: `${mentionsText} شوف تحت 🥰`,
        mentions: validTargets
      }, { quoted: msg });

      // طرد الكل دفعة واحدة
      await sock.groupParticipantsUpdate(chatId, validTargets, 'remove');

    } catch (error) {
      console.error('✗ خطأ في أمر الطرد:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: 'حدث خطأ أثناء تنفيذ الأمر.' }, { quoted: msg });
    }
  }
};
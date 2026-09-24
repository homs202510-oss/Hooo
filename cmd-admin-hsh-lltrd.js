// تحت.js - طرد الأعضاء (نسخة صامتة) مع دعم المشرفين والطرد الجماعي
const { isFounder, isOwnerbot, isDeveloper, isElite } = require('./lib-roles');
const { jidDecode } = require('@whiskeysockets/baileys');

// استخدام toLid بدلاً من decode لتوحيد التنسيق
const { toLid } = require('./lib-roles');

// دالة للتحقق من صلاحية المشرف في المجموعة
async function isGroupAdmin(sock, chatId, jid) {
  try {
    const metadata = await sock.groupMetadata(chatId);
    const participant = metadata.participants.find(p => p.id === jid);
    return participant?.admin === 'superadmin' || participant?.admin === 'admin';
  } catch (error) {
    console.error('❌ فشل في التحقق من المشرف:', error);
    return false;
  }
}

module.exports = {
  category: 'ادارة',
  command: "تحت",
  description: "طرد الأعضاء (صامت) عند منشنهم أو الرد عليهم – للمطور، المالك، والمشرفين",
  usage: "ادارة (جماعي)",

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    try {

      // لا يعمل إلا في المجموعات
      if (!chatId.endsWith('@g.us')) {
        console.log('⛔ ليس مجموعة');
        return;
      }

      // الحصول على رقم المرسل (بدون @s.whatsapp.net)
      const sender = msg.key.participant || chatId;
      const senderNum = sender.split('@')[0];

      console.log(`👤 المرسل: ${senderNum}`);

      // الصلاحيات: ، المالك، المطور، أو مشرف المجموعة
      const isSenderFounder = isFounder(senderNum);
      const isSenderOwner = isOwnerbot(senderNum);
      const isSenderDev = isDeveloper(senderNum);
      const isSenderAdmin = await isGroupAdmin(sock, chatId, sender);

      console.log(`🔹 Founder: ${isSenderFounder}, Owner: ${isSenderOwner}, Dev: ${isSenderDev}, Admin: ${isSenderAdmin}`);

      if (!(isSenderFounder || isSenderOwner || isSenderDev || isSenderAdmin)) {
        console.log('⛔ لا يمتلك الصلاحية');
        return;
      }

      const metadata = await sock.groupMetadata(chatId);

      // جمع جميع المستهدفين (منشنات متعددة أو رد واحد)
      let targets = [];

      // 1. المنشنات المتعددة
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targets = msg.message.extendedTextMessage.contextInfo.mentionedJid;
        console.log(`📌 منشنات: ${targets.length}`);
      }

      // 2. إذا كان هناك رد (ولم توجد منشنات)
      if (targets.length === 0 && msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targets = [msg.message.extendedTextMessage.contextInfo.participant];
        console.log(`📌 رد على: ${targets[0]}`);
      }

      // إذا لم يتم تحديد أي هدف، نخرج
      if (targets.length === 0) {
        console.log('⛔ لا يوجد أهداف');
        return;
      }

      // تصفية الأهداف الصالحة للطرد
      const validTargets = [];

      for (const target of targets) {
        console.log(`🎯 التحقق من: ${target}`);

        // التأكد من وجود العضو في المجموعة
        const participant = metadata.participants.find(p => p.id === target);
        if (!participant) {
          console.log(`⚠️ ${target} ليس في المجموعة`);
          continue;
        }

        // لا يمكن طرد البوت نفسه
        if (target === sock.user.id) {
          console.log('⚠️ لا يمكن طرد البوت');
          continue;
        }

        const targetNum = target.split('@')[0];

        // رتبة الهدف
        const isTargetFounder = isFounder(targetNum);
        const isTargetOwner = isOwnerbot(targetNum);
        const isTargetDev = isDeveloper(targetNum);
        const isTargetElite = isElite ? isElite(targetNum) : false;
        const isTargetAdmin = await isGroupAdmin(sock, chatId, target);

        console.log(`🎯 رتبة الهدف - Founder: ${isTargetFounder}, Owner: ${isTargetOwner}, Dev: ${isTargetDev}, Elite: ${isTargetElite}, Admin: ${isTargetAdmin}`);

        // ========== تطبيق التدرج الهرمي ==========
        let canKick = false;

        if (isSenderFounder) {
          canKick = true; // الاونر يطرد أي شخص
          console.log('✅');
        } else if (isSenderOwner && !isTargetFounder) {
          canKick = true;
          console.log('✅ المالك يطرد');
        } else if (isSenderDev && !isTargetFounder && !isTargetOwner && !isTargetDev) {
          canKick = true;
          console.log('✅ المطور يطرد (ليس أعلى)');
        } else if (isSenderAdmin && !isTargetFounder && !isTargetOwner && !isTargetDev && !isTargetElite && !isTargetAdmin) {
          canKick = true;
          console.log('✅ المشرف يطرد (عضو عادي)');
        } else {
          console.log('');
        }

        if (canKick) {
          validTargets.push(target);
        }
      }

      // إذا لم يوجد أعضاء صالحين، نخرج
      if (validTargets.length === 0) {
        console.log('⛔ لا يوجد أعضاء صالحين للطرد');
        return;
      }

      console.log(`🚀 جاهز لطرد: ${validTargets.length} أعضاء`);

      // تنفيذ الطرد الجماعي دفعة واحدة (صامت)
      await sock.groupParticipantsUpdate(chatId, validTargets, 'remove');
      console.log('✅ تم الطرد بنجاح');

    } catch (error) {
      // تجاهل الخطأ تماماً (لا نرسل أي رسالة)
      console.error('✗ خطأ في أمر الطرد (صامت):', error);
    }
  }
};
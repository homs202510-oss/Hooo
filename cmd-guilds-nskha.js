const fs = require('fs');
const { join } = require('path');
const fetch = require('node-fetch');

const { isDeveloper, isOwnerbot, isFounder } = require('./lib-roles');

module.exports = {
  command: 'نسخة',
  description: '(حفظ ولصق معلومات الجروب)',
category: 'نقابات',

  async execute(sock, msg) {
    try {
      const groupJid = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;

      if (!groupJid.endsWith('@g.us')) {
        return sock.sendMessage(groupJid,
          { text: "❌ الأمر داخل الجروبات فقط." },
          { quoted: msg }
        );
      }

      // 🔐 صلاحيات المطورين فقط
      const hasAccess = isDeveloper(sender) || isOwnerbot(sender) || isFounder(sender);
      if (!hasAccess) {
        return sock.sendMessage(groupJid,
          { text: '❌ ليس لديك صلاحية.' },
          { quoted: msg }
        );
      }

      const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      const args = body.trim().split(' ');
      const subCommand = args[1];

      const backupDir = join(__dirname, 'db-global-backups');

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // ========== شرح ==========
      if (subCommand === 'شرح' || !subCommand) {
        const helpText = `
📚 **نسخة احتياطي**

◀️ \`.نسخة حفظ\` - حفظ نسخة
◀️ \`.نسخة عرض\` - عرض النسخ
◀️ \`.نسخة استرجاع رقم\` - استرجاع
◀️ \`.نسخة حذف رقم\` - حذف

𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️
`;

        return sock.sendMessage(groupJid,
          { text: helpText },
          { quoted: msg }
        );
      }

      // ========== عرض النسخ ==========
      if (subCommand === 'عرض') {
        const folders = fs.readdirSync(backupDir);
        if (!folders.length) {
          return sock.sendMessage(groupJid,
            { text: "❌ لا توجد نسخ." },
            { quoted: msg }
          );
        }

        let text = "📦 **النسخ:**\n\n";
        folders.sort((a, b) => {
          const n1 = parseInt(a.replace(/\D/g, '')) || 0;
          const n2 = parseInt(b.replace(/\D/g, '')) || 0;
          return n1 - n2;
        }).forEach((name, i) => {
          text += `${i + 1} - ${name}\n`;
        });

        text += `\n.نسخة استرجاع رقم\n.نسخة حذف رقم\n\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

        return sock.sendMessage(groupJid, { text }, { quoted: msg });
      }

      // ========== حفظ نسخة ==========
      if (subCommand === 'حفظ') {
        const meta = await sock.groupMetadata(groupJid);

        const folders = fs.readdirSync(backupDir);
        const count = folders.length + 1;

        const cleanName = meta.subject.replace(/[\\/:*?"<>|]/g, '').trim();
        const folderName = `نسخة ${count} - ${cleanName}`;
        const savePath = join(backupDir, folderName);

        fs.mkdirSync(savePath);

        const admins = meta.participants
          .filter(p => p.admin !== null)
          .map(p => p.id);

        const data = {
          sourceJid: groupJid,
          subject: meta.subject,
          description: meta.desc || "",
          admins: admins,
          createdAt: new Date().toLocaleString('ar-EG')
        };

        fs.writeFileSync(
          join(savePath, 'config.json'),
          JSON.stringify(data, null, 2),
          'utf8'
        );

        try {
          const pfp = await sock.profilePictureUrl(groupJid, 'image');
          const res = await fetch(pfp);
          const buffer = Buffer.from(await res.arrayBuffer());

          if (buffer.length > 0) {
            fs.writeFileSync(join(savePath, 'group.jpg'), buffer);
          }
        } catch (e) {
          console.log("PFP ERROR:", e.message);
        }

        await sock.sendMessage(groupJid,
          {
            text: `✅ تم حفظ النسخة\n📌 ${meta.subject}\n👑 ${admins.length} مشرف\n\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
          },
          { quoted: msg }
        );

        return;
      }

      // ========== حذف نسخة ==========
      if (subCommand === 'حذف') {
        const num = parseInt(args[2]);
        if (!num) {
          return sock.sendMessage(groupJid,
            { text: "❌ .نسخة حذف رقم" },
            { quoted: msg }
          );
        }

        const folders = fs.readdirSync(backupDir);
        if (num < 1 || num > folders.length) {
          return sock.sendMessage(groupJid,
            { text: "❌ رقم غير صحيح." },
            { quoted: msg }
          );
        }

        const targetPath = join(backupDir, folders[num - 1]);
        fs.rmSync(targetPath, { recursive: true, force: true });

        return sock.sendMessage(groupJid,
          { text: `🗑 تم حذف النسخة ${num}\n\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️` },
          { quoted: msg }
        );
      }

      // ========== استرجاع نسخة ==========
      if (subCommand === 'استرجاع') {
        const num = parseInt(args[2]);
        if (!num) {
          return sock.sendMessage(groupJid,
            { text: "❌ .نسخة استرجاع رقم" },
            { quoted: msg }
          );
        }

        const folders = fs.readdirSync(backupDir);
        if (num < 1 || num > folders.length) {
          return sock.sendMessage(groupJid,
            { text: "❌ رقم غير صحيح." },
            { quoted: msg }
          );
        }

        const backupPath = join(backupDir, folders[num - 1]);
        const configPath = join(backupPath, 'config.json');

        if (!fs.existsSync(configPath)) {
          return sock.sendMessage(groupJid,
            { text: "❌ ملف تالف." },
            { quoted: msg }
          );
        }

        const config = JSON.parse(fs.readFileSync(configPath));

        await sock.groupUpdateSubject(groupJid, config.subject);
        await sock.groupUpdateDescription(groupJid, config.description);

        let imgBuffer = null;
        try {
          const imgPath = join(backupPath, 'group.jpg');
          if (fs.existsSync(imgPath)) {
            imgBuffer = fs.readFileSync(imgPath);
            await sock.updateProfilePicture(groupJid, imgBuffer);
          }
        } catch (e) {
          console.log("IMAGE ERROR:", e.message);
        }

        if (imgBuffer) {
          await sock.sendMessage(groupJid, {
            image: imgBuffer,
            caption: `✅ تم الاسترجاع\n\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
          }, { quoted: msg });
        } else {
          await sock.sendMessage(groupJid, {
            text: `✅ تم الاسترجاع (بدون صورة)\n\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
          }, { quoted: msg });
        }

        return;
      }

      // ========== أمر غير معروف ==========
      await sock.sendMessage(groupJid,
        { text: `❌ .نسخة شرح\n\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️` },
        { quoted: msg }
      );

    } catch (err) {
      console.log("BACKUP ERROR:", err);
      await sock.sendMessage(msg.key.remoteJid,
        { text: `❌ ${err.message}\n\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️` },
        { quoted: msg }
      );
    }
  }
};
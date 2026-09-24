module.exports = {
  name: 'قناة',
  command: ['قناة','قناتي'],
  description: 'عرض قناة البوت الرسمية',
  category: 'المطور',

  async execute(sock, msg) {
    try {
      const channelLink =
        'https://whatsapp.com/channel/0029Vb84qzoEKyZPmnwxDQ3d';

      const text = `╭── 📢 *قـنـاة الـبـوت الـرسـمـيـة* ──╮

✨ انضم إلى قناة البوت ليصلك كل جديد

🔗 ${channelLink}

━━━━━━━━━━━━━━━

⚡ 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻 ⚡

╰────────────────╯`;

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text,
          contextInfo: {
            externalAdReply: {
              title: '📢 قناة PHANTOM BOT',
              body: 'اضغط للانضمام إلى القناة',
              mediaType: 2,
              renderLargerThumbnail: true,
              sourceUrl: channelLink,
              mediaUrl: channelLink
            }
          }
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error('خطأ في أمر قناة:', err);

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: '❌ حدث خطأ أثناء عرض القناة.'
        },
        { quoted: msg }
      );
    }
  }
};
module.exports = {
  command: ['استمارة'],
  category: 'نظام',
  description: 'استمارة استقبال أعضاء الجروب',
  group: true,

  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    const form = `
*☠️┇اسـتقبـال┇☠️*_
__⊱═༻【⚡】༺═⊰__
_*◞ إملأ التالي • ╎💀*_
_❅╎لقبك ⬿『      』_
> اختار اسم شخصية من الأنمي أو المانجا أو المانهوا حسب جنسك

_❅╎الطرف ⬿『     』_
> اكتب اسم الحساب اللي لقيت فيه رابط الجروب (أي منصة)

_❅╎صورة ⬿『📷』_
> حط صورة الشخصية اللي اخترتها ✨

_⚠️ إملأ البيانات كاملة **لدخول الجروب الأساسي** ⚠️_
           *𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻*`;

    await sock.sendMessage(from, {
      text: form,
      mentions: [sender]
    }, { quoted: msg });
  }
};
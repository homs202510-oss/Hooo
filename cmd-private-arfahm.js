const { jidDecode } = require('@whiskeysockets/baileys');
const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
command: 'ارفعهم',
description: 'يرفع كل أعضاء المجموعة إلى مشرفين',
usage: '.ارفعهم',
category: 'خاصة',

async execute(sock, msg) {  
    try {  
        const groupJid = msg.key.remoteJid;  
        const sender = decode(msg.key.participant || groupJid);  

        if (!groupJid.endsWith('@g.us'))  
            return await sock.sendMessage(groupJid, { text: '❗ هذا الأمر يعمل فقط داخل المجموعات.' }, { quoted: msg });  

        // ✅ الصلاحيات:  + اونر فقط
        if (!isFounder(sender) && !isOwnerbot(sender))  
            return await sock.sendMessage(groupJid, { text: '❗ ذل من لا صلاحيات له 😂🫵' }, { quoted: msg });  

        const groupMetadata = await sock.groupMetadata(groupJid);  
        const botNumber = decode(sock.user.id);  

        const toPromote = groupMetadata.participants  
            .filter(p => !p.admin && p.id !== botNumber)  
            .map(p => p.id);  

        if (toPromote.length === 0) {  
            return await sock.sendMessage(groupJid, {  
                text: '⚠️ لا يوجد أعضاء يمكن رفعهم.'  
            }, { quoted: msg });  
        }  

        await sock.groupParticipantsUpdate(groupJid, toPromote, 'promote');  

        await sock.sendMessage(groupJid, {  
            text: `✅ تم رفع ${toPromote.length} عضو إلى مشرفين بنجاح! + يستر الله على الجروب 🐦`  
        }, { quoted: msg });  

    } catch (err) {  
        console.error('❌ خطأ في أمر ارفعهم:', err);  
        await sock.sendMessage(msg.key.remoteJid, {  
            text: `❌ حدث خطأ أثناء تنفيذ الأمر:\n\n${err.message || err.toString()}`  
        }, { quoted: msg });  
    }  
}

};
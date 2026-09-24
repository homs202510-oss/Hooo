// plugins/مطور.js - إدارة المطورين (نسخة أسطورية عربية)

const hay = require('./lib-roles');

function استخراج_الرقم(المعرف) {
    if (!المعرف) return null;
    return String(المعرف).split('@')[0].trim();
}

function توحيد_المعرف(المعرف) {
    if (!المعرف) return null;
    const الرقم = استخراج_الرقم(المعرف);
    if (!الرقم) return null;
    return hay.toLid(الرقم);
}

function الحصول_على_الاسم(المعرف, المتجر) {
    try {
        const جهة_الاتصال = المتجر?.جهات_الاتصال?.[المعرف] || {};
        return جهة_الاتصال.إشعار || جهة_الاتصال.الاسم_الظاهر || جهة_الاتصال.الاسم || استخراج_الرقم(المعرف);
    } catch {
        return استخراج_الرقم(المعرف);
    }
}

const المطورون_المحميون = [String(require('./config').ownerNumber)];

module.exports = {
    command: ['مطور', 'مطورين'],
    description: 'إدارة المطورين - إضافة/إزالة/عرض',
    usage: '.مطور اضف/ازل/عرض + منشن أو رد',
    category: 'نظام',

    async execute(sock, msg) {
        try {
            const التحقق = hay.ensureIntegrity();
            if (!التحقق.ok) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n⚠️ ${التحقق.message}\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
                }, { quoted: msg });
            }

            const المرسل = توحيد_المعرف(
                msg.key.fromMe ? msg.key.remoteJid : (msg.key.participant || msg.key.remoteJid)
            );
            if (!المرسل) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ تعذر تحديد هوية المرسل\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
                }, { quoted: msg });
            }

            const معرف_المجموعة = msg.key.remoteJid;
            const النص = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const الاجزاء = النص.trim().split(/\s+/);
            const الاكشن = الاجزاء[1];

            if (!['اضف', 'ازل', 'عرض'].includes(الاكشن)) {
                return sock.sendMessage(معرف_المجموعة, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n📖 دليل الأوامر\n\n◈ .مطور اضف + منشن\n◈ .مطور ازل + منشن\n◈ .مطور عرض\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
                }, { quoted: msg });
            }

            // عرض المطورين
            if (الاكشن === 'عرض') {
                if (!(hay.isFounder(المرسل) || hay.isOwnerbot(المرسل) || hay.isDeveloper(المرسل))) {
                    return sock.sendMessage(معرف_المجموعة, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🚫 صلاحية مرفوضة\nهذا الأمر حصري للمطورين\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
                    }, { quoted: msg });
                }

                const بيانات_المطورين = hay.getDevData();
                const الملاك = بيانات_المطورين.ownerbot || [];
                const المطورون = بيانات_المطورين.developers || [];
                let منشنات = [];

                let الناتج = `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑𝐒 👑\n━━━━━━━━━━━━━━━━━━━━\n`;

                if (الملاك.length > 0) {
                    الناتج += `◈ مالك البوت\n`;
                    الملاك.forEach((مطور, i) => {
                        const الاسم = الحصول_على_الاسم(مطور, sock.store);
                        الناتج += `┣ ${i + 1}. @${الاسم}\n`;
                        منشنات.push(مطور);
                    });
                    الناتج += `\n`;
                }

                الناتج += `◈ فريق المطورين\n`;
                if (المطورون.length > 0) {
                    المطورون.forEach((مطور, i) => {
                        const الاسم = الحصول_على_الاسم(مطور, sock.store);
                        الناتج += `┣ ${i + 1}. @${الاسم}\n`;
                        منشنات.push(مطور);
                    });
                    الناتج += `\n📊 العدد: ${المطورون.length}/5`;
                } else {
                    الناتج += `┗ ⚠️ لا يوجد مطورين`;
                }

                الناتج += `\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

                return sock.sendMessage(معرف_المجموعة, {
                    text: الناتج,
                    mentions: منشنات
                }, { quoted: msg });
            }

            // إضافة / إزالة - OwnerBot فقط
            if (!(hay.isFounder(المرسل) || hay.isOwnerbot(المرسل))) {
                return sock.sendMessage(معرف_المجموعة, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🚫 صلاحية مرفوضة\nهذا الأمر حصري مالك البوت\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
                }, { quoted: msg });
            }

            const السياق = msg.message?.extendedTextMessage?.contextInfo;
            const المستهدف = توحيد_المعرف(السياق?.mentionedJid?.[0] || السياق?.participant);
            if (!المستهدف) {
                return sock.sendMessage(معرف_المجموعة, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n📍 استهداف مطلوب\nيجب المنشن أو الرد على الشخص\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
                }, { quoted: msg });
            }

            const اسم_المستهدف = الحصول_على_الاسم(المستهدف, sock.store);
            const رقم_المستهدف = استخراج_الرقم(المستهدف);

            if (الاكشن === 'اضف') {
                if (hay.isFounder(المستهدف) || hay.isOwnerbot(المستهدف)) {
                    return sock.sendMessage(معرف_المجموعة, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🎯 مستوى أعلى\n@${اسم_المستهدف} لديه صلاحيات أعلى\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`,
                        mentions: [المستهدف]
                    }, { quoted: msg });
                }

                if (hay.isDeveloper(المستهدف)) {
                    return sock.sendMessage(معرف_المجموعة, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n✅ مطور مسبقاً\n@${اسم_المستهدف} موجود بالفعل\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`,
                        mentions: [المستهدف]
                    }, { quoted: msg });
                }

                if (hay.getDevData().developers.length >= 5) {
                    return sock.sendMessage(معرف_المجموعة, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n📊 الحد الأقصى\nوصلت للحد المسموح (5 مطورين)\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
                    }, { quoted: msg });
                }

                const تم = hay.addDeveloper(المستهدف);
                return sock.sendMessage(معرف_المجموعة, {
                    text: تم
                        ? `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🎉 تمت الإضافة بنجاح\nتم ترقية @${اسم_المستهدف} إلى مطور\n💾 تم حفظ البيانات\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
                        : `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ فشل في العملية\nحاول مرة أخرى\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`,
                    mentions: [المستهدف]
                }, { quoted: msg });
            }

            if (الاكشن === 'ازل') {
                if (!hay.isDeveloper(المستهدف)) {
                    return sock.sendMessage(معرف_المجموعة, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n⚠️ غير موجود\n@${اسم_المستهدف} ليس مطوراً\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`,
                        mentions: [المستهدف]
                    }, { quoted: msg });
                }

                if (المطورون_المحميون.includes(رقم_المستهدف)) {
                    return sock.sendMessage(معرف_المجموعة, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🛡️ مطور محمي\nلا يمكن إزالة هذا المطور\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`,
                        mentions: [المستهدف]
                    }, { quoted: msg });
                }

                const تم = hay.removeDeveloper(المستهدف);
                return sock.sendMessage(معرف_المجموعة, {
                    text: تم
                        ? `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🗑️ تمت الإزالة بنجاح\nتم إزالة @${اسم_المستهدف} من المطورين\n💾 تم تحديث النظام\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
                        : `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ فشل في العملية\nحاول مرة أخرى\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`,
                    mentions: [المستهدف]
                }, { quoted: msg });
            }

        } catch (خطأ) {
            console.error('مطور error:', خطأ);
            return sock.sendMessage(msg.key.remoteJid, {
                text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ خطأ غير متوقع\n${خطأ.message}\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
            }, { quoted: msg });
        }
    }
};
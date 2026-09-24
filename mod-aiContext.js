/**
 * 👻 PHANTOM AI Context v3 — يقرأ كل البيانات الحقيقية
 */
const db = require('./core-database');

function buildMinimalContext(jid, pushName = null) {
    const user = require('./mod-user');
    const u = user.getOrCreate(jid, pushName);
    return `[معلومة بسيطة] الاسم: ${u.name || u.push_name || 'مجهول'}`;
}

function buildFullContext(jid, pushName = null) {
    const user = require('./mod-user');
    const kd = require('./mod-kingdom');
    const mil = require('./mod-military');
    const ranks = require('./mod-ranks');
    const ach = require('./mod-achievements');
    const titles = require('./mod-titles');
    const rep = require('./mod-reputation');
    const bank = require('./mod-bank');

    const u = user.getOrCreate(jid, pushName);
    const rank = ranks.getUserRank(jid);
    const title = titles.getActiveTitle(jid);
    const achCount = ach.getUnlockedCount(jid);

    const lines = [];
    lines.push(`[المستخدم]`);
    lines.push(`- الاسم: ${u.name || u.push_name || 'مجهول'}`);
    lines.push(`- الرتبة: ${rank.name}`);
    if (title) lines.push(`- اللقب: ${title}`);
    lines.push(`- المستوى: ${u.level} (XP: ${u.xp})`);
    lines.push(`- الرصيد: ${u.coins} نقطة`);
    lines.push(`- الإنجازات: ${achCount}`);

    // سمعة
    try {
        const r = rep.getTierInfo(jid);
        lines.push(`- السمعة: ${r.score} (${r.tier.name})`);
    } catch (_) {}

    // بنك
    try {
        const b = bank.getAccount(jid);
        if (b && b.balance > 0) lines.push(`- البنك: ${b.balance} نقطة`);
    } catch (_) {}

    // المملكة
    const k = kd.getKingdom(jid);
    if (k) {
        const buildings = kd.getBuildings(k.id);
        const armyCount = mil.getArmyCount(k.id);
        const stats = mil.getArmyStats(k.id);
        const resources = kd.getResources(k.id);
        const rate = kd.getProductionPerHour(k.id);

        lines.push(``);
        lines.push(`[المملكة]`);
        lines.push(`- الاسم: ${k.name} | Lv${k.level} | قوة ${k.power}`);
        lines.push(`- المباني: ${buildings.length}`);
        for (const b of buildings.slice(0, 5)) {
            lines.push(`  • ${b.building_type} × ${b.count}`);
        }
        lines.push(`- الجيش: ${armyCount} جندي (⚔️${stats.attack} 🛡️${stats.defense})`);
        lines.push(`- الموارد: 🪵${resources.wood||0} 🪨${resources.stone||0} ⛓️${resources.iron||0} 🌾${resources.food||0} 🪙${resources.gold||0}`);
        lines.push(`- الإنتاج/ساعة: 🪵${rate.wood||0} 🪨${rate.stone||0} 🌾${rate.food||0}`);
    } else {
        lines.push(``);
        lines.push(`[المملكة]: لسه معندوش مملكة`);
    }

    // المهام
    const missions = db.prepare("SELECT COUNT(*) as c FROM mission_progress WHERE user_jid = ? AND status IN ('completed','claimed')").get(jid).c;
    lines.push(``);
    lines.push(`[المهام]: ${missions} مكتملة`);

    // المهارات
    try {
        const skills = db.prepare('SELECT skill_id, level FROM user_skills WHERE user_jid = ?').all(jid);
        if (skills.length) {
            lines.push(``);
            lines.push(`[المهارات]`);
            for (const s of skills) lines.push(`- ${s.skill_id}: Lv${s.level}`);
        }
    } catch (_) {}

    return lines.join('\n');
}

function buildContextForIntent(jid, pushName, aboutBot) {
    return aboutBot ? buildFullContext(jid, pushName) : buildMinimalContext(jid, pushName);
}

function buildPrompt(jid, pushName, userText, opts = {}) {
    const { aboutBot, memories = [] } = opts;

    let prompt = '';

    if (aboutBot) {
        const ctx = buildFullContext(jid, pushName);
        prompt += `[سياق اللاعب الحقيقي]\n${ctx}\n\n`;
        prompt += `[مهم] دي بيانات حقيقية من قاعدة بيانات البوت. استخدمها للإجابة بدقة.\n`;
        prompt += `لو سألك عن حاجة مش موجودة، متخترعش — قول "مش شايف البيانات دي".\n\n`;
    } else {
        prompt += `[المستخدم] ${pushName || 'مجهول'}\n`;
        prompt += `[ملاحظة] ده كلام عادي مش عن البوت. رد بشكل طبيعي.\n\n`;
    }

    if (memories.length) {
        prompt += `[يعرفه عنك]\n` + memories.slice(0, 5).map(m => `- ${m.fact}`).join('\n') + '\n\n';
    }

    prompt += `[رسالته]\n${userText}`;

    return prompt;
}

module.exports = {
    buildMinimalContext,
    buildFullContext,
    buildContextForIntent,
    buildPrompt,
};

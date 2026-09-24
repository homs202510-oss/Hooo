/**
 * 👻 PHANTOM — Report Service
 */
const kd = require('./mod-kingdom');
const mil = require('./mod-military');
const user = require('./mod-user');
const ranks = require('./mod-ranks');
const ach = require('./mod-achievements');
const rep = require('./mod-reputation');
const db = require('./core-database');

function buildReport(jid) {
    const u = user.getOrCreate(jid);
    const k = kd.getKingdom(jid);
    const rank = ranks.getUserRank(jid);
    const achCount = ach.getUnlockedCount(jid);
    const repInfo = rep.getTierInfo(jid);

    const missions = db.prepare("SELECT COUNT(*) as c FROM mission_progress WHERE user_jid = ? AND status IN ('completed','claimed')").get(jid).c;
    const goalsActive = db.prepare("SELECT COUNT(*) as c FROM user_goals WHERE user_jid = ? AND status = 'active'").get(jid).c;

    let army = 0, attack = 0, defense = 0, buildings = 0, resources = {}, production = {};
    let alliances = 0, wars = 0;
    let projectsActive = 0;
    let unreadNotif = 0;

    if (k) {
        army = mil.getArmyCount(k.id);
        const stats = mil.getArmyStats(k.id);
        attack = stats.attack;
        defense = stats.defense;
        buildings = kd.getBuildings(k.id).reduce((s, b) => s + b.count, 0);
        resources = kd.getResources(k.id);
        production = kd.getProductionPerHour(k.id);

        alliances = db.prepare("SELECT COUNT(*) as c FROM alliances WHERE (kingdom_a = ? OR kingdom_b = ?) AND status = 'active'").get(k.id, k.id).c;
        wars = db.prepare("SELECT COUNT(*) as c FROM wars WHERE (attacker_id = ? OR defender_id = ?) AND status = 'active'").get(k.id, k.id).c;

        try {
            projectsActive = db.prepare("SELECT COUNT(*) as c FROM projects WHERE kingdom_id = ? AND status = 'active'").get(k.id).c;
        } catch (_) {}
    }

    try {
        unreadNotif = db.prepare("SELECT COUNT(*) as c FROM notifications WHERE user_jid = ? AND is_read = 0").get(jid).c;
    } catch (_) {}

    return {
        user: u, kingdom: k, rank, achCount, repInfo,
        missions, goalsActive,
        army, attack, defense, buildings, resources, production,
        alliances, wars,
        projectsActive, unreadNotif,
    };
}

/**
 * اقتراح الخطوة التالية بناءً على الحالة
 */
function getNextSuggestion(report) {
    const { user: u, kingdom: k, missions, buildings, army, achCount } = report;

    if (!k) return { emoji: '🏰', text: 'أنشئ مملكتك الأولى', cmd: '.إنشاء [اسم]' };

    if (buildings === 0) return { emoji: '🏗️', text: 'ابنِ أول مبنى (مزرعة/منجم)', cmd: '.بناء' };

    // لو مفيش ثكنة
    const hasBarracks = kd.getBuildings(k.id).some(b => b.building_type === 'ثكنة');
    if (!hasBarracks) return { emoji: '⚔️', text: 'ابنِ ثكنة لتكوين الجيش', cmd: '.بناء ثكنة' };

    if (army === 0) return { emoji: '🪖', text: 'جنّد أول جندي', cmd: '.تجنيد مشاة 10' };

    if (k.level < 5) return { emoji: '📈', text: `طوّر المملكة لـ Lv5 (حالياً Lv${k.level})`, cmd: '.تطوير' };

    if (missions < 5) return { emoji: '🎯', text: 'أكمل 5 مهام', cmd: '.مهام' };

    if (achCount < 5) return { emoji: '🏆', text: 'افتح 5 إنجازات', cmd: '.إنجازات' };

    return { emoji: '👑', text: 'واصل التقدم — جرّب التحالفات والحروب', cmd: '.حالة' };
}

/**
 * أهم النواقص
 */
function getMissing(report) {
    const misses = [];
    const { user: u, kingdom: k, resources, army } = report;

    if (u.coins < 100) misses.push('💰 النقاط أقل من 100 — اجمع بـ .يومي');
    if (!k) return misses;

    if ((resources.food || 0) < 500) misses.push('🌾 القمح أقل من 500 — ابنِ .بناء مزرعة');
    if ((resources.iron || 0) < 200) misses.push('⛓️ الحديد أقل من 200 — ابنِ .بناء منجم');
    if (army < 20) misses.push('🪖 الجيش أقل من 20 — .تجنيد مشاة 10');

    return misses;
}

module.exports = { buildReport, getNextSuggestion, getMissing };

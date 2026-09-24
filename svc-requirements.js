/**
 * 👻 PHANTOM — Requirements Engine
 * النظام المركزي لفحص كل المتطلبات
 */
const kd = require('./mod-kingdom');
const mil = require('./mod-military');
const user = require('./mod-user');
const db = require('./core-database');

/**
 * الأنواع المدعومة:
 * - has_kingdom
 * - kingdom_level
 * - building (اسم، عدد)
 * - resource (نوع، كمية)
 * - coins (كمية)
 * - army_count (عدد)
 * - army_type (نوع، عدد)
 * - missions_completed
 * - achievements
 * - xp
 * - rank_tier
 */

function getPlayerState(jid) {
    const u = user.getOrCreate(jid);
    const k = kd.getKingdom(jid);
    const kId = k ? k.id : null;

    const buildings = kId ? kd.getBuildings(kId) : [];
    const resources = kId ? kd.getResources(kId) : {};
    const armyCount = kId ? mil.getArmyCount(kId) : 0;

    const missions = db.prepare("SELECT COUNT(*) as c FROM mission_progress WHERE user_jid = ? AND status IN ('completed','claimed')").get(jid).c;
    const achievements = db.prepare("SELECT COUNT(*) as c FROM user_achievements WHERE user_jid = ? AND unlocked = 1").get(jid).c;

    let rankId = 1;
    try {
        const r = db.prepare('SELECT rank_id FROM user_ranks WHERE user_jid = ?').get(jid);
        rankId = r ? r.rank_id : 1;
    } catch (_) {}

    return {
        user: u,
        kingdom: k,
        kingdomId: kId,
        buildings,
        resources,
        armyCount,
        missions,
        achievements,
        rankId,
        coins: u.coins,
        xp: u.xp,
    };
}

function getBuildingCount(buildings, type) {
    const b = buildings.find(x => x.building_type === type);
    return b ? b.count : 0;
}

/**
 * فحص متطلبات
 * @param {string} jid
 * @param {Array} reqs [{ type, value, name? }]
 */
function check(jid, reqs = []) {
    const state = getPlayerState(jid);
    const results = [];
    let allMet = true;

    for (const r of reqs) {
        const res = checkOne(state, r);
        if (!res.met) allMet = false;
        results.push(res);
    }

    return {
        allowed: allMet,
        results,
        state,
    };
}

function checkOne(state, r) {
    const base = { type: r.type, name: r.name || '', met: false, current: 0, required: 0, hint: '' };

    switch (r.type) {
        case 'has_kingdom': {
            const ok = !!state.kingdom;
            return { ...base, met: ok, current: ok ? 1 : 0, required: 1, hint: ok ? '' : 'أنشئ مملكة بـ .إنشاء [اسم]' };
        }
        case 'kingdom_level': {
            const cur = state.kingdom ? state.kingdom.level : 0;
            const ok = cur >= r.value;
            return { ...base, met: ok, current: cur, required: r.value, hint: ok ? '' : `طوّر مملكتك لـ Lv${r.value} بـ .تطوير` };
        }
        case 'building': {
            const cur = getBuildingCount(state.buildings, r.name);
            const ok = cur >= r.value;
            return { ...base, name: r.name, met: ok, current: cur, required: r.value, hint: ok ? '' : `ابني ${r.name} × ${r.value} بـ .بناء ${r.name}` };
        }
        case 'resource': {
            const cur = state.resources[r.name] || 0;
            const ok = cur >= r.value;
            return { ...base, name: r.name, met: ok, current: cur, required: r.value, hint: ok ? '' : `اجمع ${r.value} ${kd.RESOURCE_LABELS[r.name]?.name || r.name}` };
        }
        case 'coins': {
            const ok = state.coins >= r.value;
            return { ...base, met: ok, current: state.coins, required: r.value, hint: ok ? '' : `محتاج ${r.value} نقطة` };
        }
        case 'army_count': {
            const ok = state.armyCount >= r.value;
            return { ...base, met: ok, current: state.armyCount, required: r.value, hint: ok ? '' : `جنّد ${r.value} جندي` };
        }
        case 'army_type': {
            const cur = state.kingdomId ? mil.getArmyCount(state.kingdomId, r.name) : 0;
            const ok = cur >= r.value;
            return { ...base, name: r.name, met: ok, current: cur, required: r.value, hint: ok ? '' : `جنّد ${r.value} ${r.name}` };
        }
        case 'missions_completed': {
            const ok = state.missions >= r.value;
            return { ...base, met: ok, current: state.missions, required: r.value, hint: ok ? '' : `أكمل ${r.value} مهمة` };
        }
        case 'achievements': {
            const ok = state.achievements >= r.value;
            return { ...base, met: ok, current: state.achievements, required: r.value, hint: ok ? '' : `افتح ${r.value} إنجاز` };
        }
        case 'xp': {
            const ok = state.xp >= r.value;
            return { ...base, met: ok, current: state.xp, required: r.value, hint: ok ? '' : `اجمع ${r.value} XP` };
        }
        default:
            return { ...base, met: true };
    }
}

/**
 * بناء رسالة نقص المتطلبات
 */
function buildMissingMessage(checks) {
    const missing = checks.filter(c => !c.met);
    if (!missing.length) return null;

    const lines = missing.map(c => {
        const icon = c.type === 'building' ? '🏗️' : c.type === 'resource' ? '📦' : c.type === 'has_kingdom' ? '🏰' : '⚠️';
        const progress = c.required > 0 ? `${c.current}/${c.required}` : '';
        return `${icon} *${c.name || c.type}*: ${progress}\n   ${c.hint}`;
    }).join('\n\n');

    return lines;
}

module.exports = { check, checkOne, getPlayerState, buildMissingMessage, getBuildingCount };

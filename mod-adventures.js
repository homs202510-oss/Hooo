const db = require('./core-database');
const { getAdventure, getAllAdventures } = require('./data-adventures');
const tracker = require('./mod-tracker');

function getState(jid) {
    return db.prepare('SELECT * FROM adventure_state WHERE user_jid = ?').get(jid);
}

function clearState(jid) {
    db.prepare('DELETE FROM adventure_state WHERE user_jid = ?').run(jid);
}

function startAdventure(jid, advId) {
    const adv = getAdventure(advId);
    if (!adv) return { ok: false, reason: 'not_found' };

    const user = require('./mod-user');
    const kd = require('./mod-kingdom');
    const u = user.getOrCreate(jid);
    const k = kd.getKingdom(jid);
    const playerLevel = Math.floor(Math.sqrt(u.xp / 10)) + 1;
    const kLevel = k ? k.level : 0;

    if (playerLevel < adv.minLevel) return { ok: false, reason: 'level_low', need: adv.minLevel };
    if (kLevel < adv.minKingdomLevel) return { ok: false, reason: 'kingdom_low', need: adv.minKingdomLevel };

    clearState(jid);
    db.prepare('INSERT INTO adventure_state (user_jid, adventure_id, step_index) VALUES (?, ?, 0)').run(jid, advId);

    return { ok: true, adv, step: adv.steps[0], stepIndex: 0 };
}

function chooseOption(jid, choiceIndex) {
    const state = getState(jid);
    if (!state) return { ok: false, reason: 'no_active' };

    const adv = getAdventure(state.adventure_id);
    if (!adv) { clearState(jid); return { ok: false, reason: 'invalid' }; }

    const step = adv.steps[state.step_index];
    if (!step) { clearState(jid); return { ok: false, reason: 'invalid' }; }

    const choice = step.choices[choiceIndex];
    if (!choice) return { ok: false, reason: 'bad_choice' };

    // فحص المتطلبات
    if (choice.require) {
        const kd = require('./mod-kingdom');
        const k = kd.getKingdom(jid);
        if (choice.require.army && k) {
            const mil = require('./mod-military');
            if (mil.getArmyCount(k.id) < choice.require.army) {
                return { ok: false, reason: 'need_army', need: choice.require.army };
            }
        }
    }

    // تحديد النجاح
    const success = choice.chance === undefined ? true : Math.random() < choice.chance;
    const effect = success ? choice.effect : (choice.fail || choice.effect);

    // تطبيق التأثير
    const user = require('./mod-user');
    const kd = require('./mod-kingdom');
    const k = kd.getKingdom(jid);

    const coins = effect.coins ? randInt(effect.coins[0], effect.coins[1]) : 0;
    const xp = effect.xp || 0;
    if (coins) user.addCoins(jid, coins);
    if (xp) user.addXP(jid, xp);

    let itemGained = null;
    if (effect.items && success) {
        for (const [itemId, qty] of effect.items) {
            user.addItem(jid, 'items', itemId, qty);
            itemGained = { id: itemId, qty };
        }
    }

    let armyLost = 0;
    if (effect.loseArmy && k) {
        armyLost = effect.loseArmy;
        const mil = require('./mod-military');
        mil.applyLosses ? mil.applyLosses(k.id, armyLost) : null;
    }

    // التقدم للخطوة التالية
    const nextIndex = state.step_index + 1;
    if (nextIndex >= adv.steps.length) {
        // انتهت المغامرة
        tracker.track(jid, 'adventures_count', 1);
        if (success) tracker.track(jid, 'adventures_won', 1);
        clearState(jid);
        return {
            ok: true, finished: true, adv, success,
            effect: { coins, xp, itemGained, armyLost },
        };
    } else {
        db.prepare('UPDATE adventure_state SET step_index = ? WHERE user_jid = ?').run(nextIndex, jid);
        return {
            ok: true, finished: false, adv, success,
            effect: { coins, xp, itemGained, armyLost },
            nextStep: adv.steps[nextIndex], stepIndex: nextIndex,
        };
    }
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

module.exports = { startAdventure, chooseOption, getState, clearState, getAllAdventures };

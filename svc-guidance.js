/**
 * 👻 PHANTOM — Guidance Service
 * النظام المركزي لإرشاد اللاعب
 */
const req = require('./svc-requirements');
const kd = require('./mod-kingdom');
const mil = require('./mod-military');
const db = require('./core-database');

/**
 * إرشاد عام
 */
function guide(jid, action) {
    const state = req.getPlayerState(jid);
    const paths = getPaths();
    const path = paths[action];

    if (!path) return { allowed: false, reason: 'unknown_action' };

    const checks = req.check(jid, path.requirements);

    return {
        allowed: checks.allowed,
        action,
        title: path.title,
        checks: checks.results,
        missing: checks.results.filter(c => !c.met),
        nextAction: checks.allowed ? path.next : (checks.results.find(c => !c.met)?.hint || ''),
        suggestedCommand: checks.allowed ? path.command : (checks.results.find(c => !c.met)?.type === 'building' ? '.بناء' : '.اوامر'),
        state,
    };
}

/**
 * تعريف المسارات
 */
function getPaths() {
    return {
        'army': {
            title: 'تكوين الجيش',
            requirements: [
                { type: 'has_kingdom' },
                { type: 'building', name: 'ثكنة', value: 1 },
            ],
            next: 'ابدأ التجنيد',
            command: '.تجنيد',
        },
        'build': {
            title: 'بناء مبنى',
            requirements: [{ type: 'has_kingdom' }],
            next: 'اختر مبنى',
            command: '.بناء',
        },
        'upgrade': {
            title: 'تطوير المملكة',
            requirements: [{ type: 'has_kingdom' }],
            next: 'افحص التكلفة',
            command: '.تطوير',
        },
        'market': {
            title: 'الشراء من السوق',
            requirements: [{ type: 'has_kingdom' }],
            next: 'اعرض المتجر',
            command: '.متجر',
        },
        'war': {
            title: 'شن حرب',
            requirements: [
                { type: 'has_kingdom' },
                { type: 'building', name: 'ثكنة', value: 1 },
                { type: 'army_count', value: 50 },
            ],
            next: 'أعلن الحرب',
            command: '.حرب @شخص',
        },
        'explore': {
            title: 'استكشاف',
            requirements: [{ type: 'has_kingdom' }],
            next: 'اختر منطقة',
            command: '.استكشاف',
        },
    };
}

/**
 * بناء رسالة الإرشاد
 */
function buildGuidanceMessage(guidance) {
    if (!guidance.allowed) {
        const missing = guidance.missing.map(m => `❌ ${m.name || m.type}: ${m.current}/${m.required}\n   ${m.hint}`).join('\n\n');
        return {
            title: `🚫 مش جاهز لـ ${guidance.title}`,
            content: missing,
            next: guidance.nextAction,
            command: guidance.suggestedCommand,
        };
    }
    return {
        title: `✅ جاهز لـ ${guidance.title}`,
        content: 'كل المتطلبات متوفرة',
        next: guidance.nextAction,
        command: guidance.suggestedCommand,
    };
}

module.exports = { guide, getPaths, buildGuidanceMessage };

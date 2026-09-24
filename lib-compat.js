/**
 * 🔌 PHANTOM — محوّل الأوامر القديمة
 * أي ملف بصيغة { command, execute(sock, msg, args) } بيتحوّل تلقائي لصيغة PHANTOM { name, aliases, run(ctx) }
 */
function isLegacy(p) {
    return !!p && !p.run && !!p.command && typeof p.execute === 'function';
}

function wrap(mod) {
    const list = [].concat(mod.command).filter(Boolean);
    const out = Object.assign({}, mod);
    out.name = list[0];
    out.aliases = list.slice(1);
    out.arCategory = mod.category || 'أخرى';
    out.legacy = true;
    out.run = (ctx) => mod.execute(ctx.sock, ctx.msg, ctx.args);
    return out;
}

module.exports = { isLegacy, wrap };

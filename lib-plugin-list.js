/**
 * 🔌 PHANTOM — قائمة الأوامر المحمّلة (بديل ../handlers/plugins.js القديم)
 */
function getPlugins() {
    const { getAllCommands } = require('./core-loader');
    const seen = new Set(); const out = [];
    for (const [, p] of getAllCommands()) {
        if (seen.has(p)) continue;
        seen.add(p);
        out.push({
            name: Array.isArray(p.name) ? p.name[0] : p.name,
            command: [].concat(p.name || [], p.aliases || []),
            category: p.arCategory || p.category,
            description: p.description || p.desc || '',
        });
    }
    return out;
}
module.exports = { getPlugins };

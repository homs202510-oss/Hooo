const fs = require('fs');
const path = require('path');
const logger = require('./svc-logger');
const compat = require('./lib-compat');
const { normalize } = require('./util-normalize');

const commands = new Map();

function loadPlugins() {
    // كل الأوامر ملفات بصيغة: cmd-<التصنيف>-<الاسم>.js في نفس الفولدر
    const files = fs.readdirSync(__dirname)
        .filter(f => /^cmd-[^-]+-.+\.js$/.test(f))
        .map(f => ({ file: f, category: f.split('-')[1] }))
        .sort((a, b) => a.category.localeCompare(b.category, 'en') || (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));

    const natives = [];
    const legacy = [];   // أوامر الصيغة القديمة (command/execute) بتتسجّل آخر واحدة وبتغطّي المتكرر

    for (const { file, category } of files) {
        try {
            const filePath = path.join(__dirname, file);
            delete require.cache[require.resolve(filePath)];
            let plugin = require(filePath);

            const wasLegacy = compat.isLegacy(plugin);
            if (wasLegacy) plugin = compat.wrap(plugin);

            const handler = plugin.run || plugin.execute;
            if (!plugin.name || typeof handler !== 'function') {
                logger.warn(`⚠️ plugin غير صالح: ${file}`);
                continue;
            }
            (wasLegacy ? legacy : natives).push({ plugin, category });
        } catch (err) {
            logger.error(`❌ فشل تحميل ${file}: ${err.message}`);
        }
    }

    let total = 0;
    let hidden = 0;
    const categories = new Set();

    for (const { plugin, category } of [...natives, ...legacy]) {
        const names = Array.isArray(plugin.name) ? plugin.name : [plugin.name];
        for (const n of names) {
            commands.set(normalize(n), { ...plugin, category });
        }
        if (Array.isArray(plugin.aliases)) {
            for (const a of plugin.aliases) {
                commands.set(normalize(a), { ...plugin, category });
            }
        }
        categories.add(category);
        if (plugin.hidden === true) hidden++;
        else total++;
    }

    logger.info(`📦 تم تحميل ${total} أمر (+${hidden} مخفي) في ${categories.size} تصنيف`);
}

function reloadPlugins() {
    commands.clear();
    loadPlugins();
}

function getCommand(name) {
    return commands.get(normalize(name));
}

function getAllCommands() {
    return commands;
}

module.exports = { loadPlugins, reloadPlugins, getCommand, getAllCommands, normalize };

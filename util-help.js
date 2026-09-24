const kingdomHelp = require('./data-help-kingdom');
const ALL_HELP = { ...kingdomHelp };

function hasHelp(name) { return !!ALL_HELP[name]; }
function getHelp(name) { return ALL_HELP[name]; }

function buildHelpCard(help) {
    const blocks = [];
    if (help.desc)     blocks.push({ emoji: '📖', title: 'الوصف',     content: help.desc });
    if (help.usage)    blocks.push({ emoji: '💻', title: 'الاستخدام', content: help.usage });
    if (help.example)  blocks.push({ emoji: '📝', title: 'مثال',      content: help.example });
    if (help.shows)    blocks.push({ emoji: '👁️', title: 'بيعرض',    content: help.shows.join('\n') });
    if (help.gives)    blocks.push({ emoji: '🎁', title: 'بيدّي',     content: help.gives.join('\n') });
    if (help.buildings)blocks.push({ emoji: '🏗️', title: 'المباني',  content: help.buildings.join('\n') });
    if (help.soldiers) blocks.push({ emoji: '⚔️', title: 'الجنود',   content: help.soldiers.join('\n') });
    if (help.benefits) blocks.push({ emoji: '✨', title: 'الفوايد',   content: help.benefits.join('\n') });
    if (help.cost)     blocks.push({ emoji: '💸', title: 'التكلفة',  content: help.cost });
    if (help.cooldown) blocks.push({ emoji: '⏱️', title: 'Cooldown', content: help.cooldown });
    if (help.tips)     blocks.push({ emoji: '💡', title: 'نصايح',    content: help.tips.join('\n') });
    return blocks;
}

module.exports = { hasHelp, getHelp, buildHelpCard };

/**
 * 👻 PHANTOM — الرتب (8 مستويات)
 * كل رتبة لها شروط متعددة (وليس XP فقط)
 */

const RANKS = [
    {
        id: 1, name: '👤 مبتدئ', tier: 'beginner',
        requirements: {},
        color: '⚪',
    },
    {
        id: 2, name: '🪵 مستوطن', tier: 'settler',
        requirements: { xp: 500, has_kingdom: 1 },
        color: '🟢',
    },
    {
        id: 3, name: '🛡️ حارس', tier: 'guardian',
        requirements: { xp: 2000, kingdom_level: 3, army_count: 20 },
        color: '🔵',
    },
    {
        id: 4, name: '⚒️ بنّاء', tier: 'builder',
        requirements: { xp: 5000, kingdom_level: 5, buildings_count: 10, missions: 10 },
        color: '🟣',
    },
    {
        id: 5, name: '⚔️ قائد', tier: 'commander',
        requirements: { xp: 15000, kingdom_level: 10, army_count: 100, wins: 5, achievements: 10 },
        color: '🟠',
    },
    {
        id: 6, name: '🏰 حاكم', tier: 'ruler',
        requirements: { xp: 50000, kingdom_level: 20, army_count: 500, missions: 30, achievements: 25, wins: 25 },
        color: '🟠',
    },
    {
        id: 7, name: '👑 ملك', tier: 'king',
        requirements: { xp: 200000, kingdom_level: 35, army_count: 2000, missions: 60, achievements: 40, wins: 100, explorations: 100 },
        color: '🔴',
    },
    {
        id: 8, name: '💎 إمبراطور', tier: 'emperor',
        requirements: { xp: 1000000, kingdom_level: 50, army_count: 10000, missions: 100, achievements: 55, wins: 500, explorations: 500, special_items: 3 },
        color: '👑✨',
    },
];

const RANK_MAP = new Map(RANKS.map(r => [r.id, r]));
const RANK_BY_TIER = new Map(RANKS.map(r => [r.tier, r]));

function getRank(id) { return RANK_MAP.get(id); }
function getRankByTier(tier) { return RANK_BY_TIER.get(tier); }
function getAllRanks() { return RANKS; }
function getNextRank(id) { return id < RANKS.length ? RANK_MAP.get(id + 1) : null; }

module.exports = { RANKS, RANK_MAP, getRank, getRankByTier, getAllRanks, getNextRank };

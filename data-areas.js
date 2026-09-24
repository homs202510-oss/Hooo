const AREAS = [
    { id: 'forest',    emoji: '🌲', name: 'الغابة',           minLevel: 1,  minKingdomLevel: 1, cooldown: 60,   dangers: 1, rewards: { wood: [30,80], food: [20,50], coins: [20,60] }, rareChance: 0.05 },
    { id: 'mountains', emoji: '⛰️', name: 'الجبال',           minLevel: 3,  minKingdomLevel: 2, cooldown: 120,  dangers: 2, rewards: { stone: [40,100], iron: [15,40], coins: [30,90] }, rareChance: 0.08 },
    { id: 'desert',    emoji: '🏜️', name: 'الصحراء',          minLevel: 5,  minKingdomLevel: 3, cooldown: 180,  dangers: 3, rewards: { gold: [20,60], stone: [30,80], coins: [60,180] }, rareChance: 0.10 },
    { id: 'ruins',     emoji: '🏚️', name: 'الأطلال',          minLevel: 8,  minKingdomLevel: 5, cooldown: 300,  dangers: 4, rewards: { gold: [50,150], iron: [30,80], coins: [100,300] }, rareChance: 0.15 },
    { id: 'ice',       emoji: '❄️', name: 'الأراضي الجليدية', minLevel: 12, minKingdomLevel: 8, cooldown: 480,  dangers: 5, rewards: { gold: [80,200], iron: [50,120], coins: [200,600] }, rareChance: 0.20 },
    { id: 'volcano',   emoji: '🌋', name: 'المنطقة البركانية',minLevel: 18, minKingdomLevel: 12,cooldown: 720,  dangers: 7, rewards: { gold: [150,400], iron: [80,200], coins: [400,1200] }, rareChance: 0.25 },
    { id: 'dark',      emoji: '🌑', name: 'المنطقة المظلمة',  minLevel: 25, minKingdomLevel: 18,cooldown: 1200, dangers: 10, rewards: { gold: [300,800], iron: [150,400], coins: [800,2500] }, rareChance: 0.35 },
];

const AREA_MAP = new Map(AREAS.map(a => [a.id, a]));
function getArea(id) { return AREA_MAP.get(id) || null; }
function getAllAreas() { return AREAS; }

module.exports = { AREAS, AREA_MAP, getArea, getAllAreas };

/**
 * 👻 System Status Service
 */
const os = require('os');
const fs = require('fs');

const START_TIME = Date.now();

function getUptime() {
    const ms = Date.now() - START_TIME;
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (d > 0) return `${d}ي ${h}س ${m}د`;
    if (h > 0) return `${h}س ${m}د ${sec}ث`;
    if (m > 0) return `${m}د ${sec}ث`;
    return `${sec}ث`;
}

function getMemory() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return {
        total: (total / 1024 / 1024 / 1024).toFixed(2),
        used: (used / 1024 / 1024 / 1024).toFixed(2),
        percent: Math.floor((used / total) * 100),
        processMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),
    };
}

function getNodeVersion() { return process.version; }

function getBaileysVersion() {
    try {
        const pkg = require('./package.json');
        return pkg.dependencies?.['@whiskeysockets/baileys'] || 'unknown';
    } catch (_) { return 'unknown'; }
}

function getPluginsCount() {
    try {
        const { getAllCommands } = require('./core-loader');
        return getAllCommands().size;
    } catch (_) { return 0; }
}

function getUsersCount() {
    try {
        const db = require('./core-database');
        return db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    } catch (_) { return 0; }
}

function getGroupsCount() {
    try {
        const db = require('./core-database');
        return db.prepare('SELECT COUNT(*) as c FROM group_states WHERE enabled = 1').get().c;
    } catch (_) { return 0; }
}

function isDatabaseOk() {
    try {
        const db = require('./core-database');
        db.prepare('SELECT 1').get();
        return true;
    } catch (_) { return false; }
}

function isAiOk() {
    try {
        const cfg = require('./config');
        return !!(cfg.ai?.geminiKey || process.env.GEMINI_API_KEY);
    } catch (_) { return false; }
}

function isFfmpegOk() {
    try {
        const { execSync } = require('child_process');
        execSync('which ffmpeg', { timeout: 2000 });
        return true;
    } catch (_) { return false; }
}

function getStatus() {
    return {
        uptime: getUptime(),
        memory: getMemory(),
        node: getNodeVersion(),
        baileys: getBaileysVersion(),
        plugins: getPluginsCount(),
        users: getUsersCount(),
        groups: getGroupsCount(),
        dbOk: isDatabaseOk(),
        aiOk: isAiOk(),
        ffmpegOk: isFfmpegOk(),
    };
}

module.exports = { getStatus, getUptime, getMemory, isFfmpegOk, isAiOk, isDatabaseOk };

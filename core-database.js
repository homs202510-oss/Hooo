const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const config = require('./config');

if (!fs.existsSync(config.paths.data)) fs.mkdirSync(config.paths.data, { recursive: true });

const db = new DatabaseSync(path.join(config.paths.data, 'phantom.db'));
db.exec('PRAGMA journal_mode = WAL;');

function safeAddColumn(table, column, def) {
    try {
        const cols = db.prepare(`PRAGMA table_info(${table})`).all();
        if (!cols.find(c => c.name === column)) {
            db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
        }
    } catch (e) { }
}

function initDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            jid TEXT PRIMARY KEY, name TEXT, push_name TEXT,
            coins INTEGER DEFAULT 0, level INTEGER DEFAULT 1, xp INTEGER DEFAULT 0,
            is_banned INTEGER DEFAULT 0, is_premium INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            last_seen INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE TABLE IF NOT EXISTS groups (jid TEXT PRIMARY KEY, name TEXT, welcome_enabled INTEGER DEFAULT 0, antilink_enabled INTEGER DEFAULT 0, antispam_enabled INTEGER DEFAULT 0, created_at INTEGER DEFAULT (strftime('%s','now')));
        CREATE TABLE IF NOT EXISTS memory (id INTEGER PRIMARY KEY AUTOINCREMENT, user_jid TEXT, fact TEXT, category TEXT DEFAULT 'general', created_at INTEGER DEFAULT (strftime('%s','now')));
        CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, user_jid TEXT, role TEXT, content TEXT, created_at INTEGER DEFAULT (strftime('%s','now')));
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, user_jid TEXT, item_type TEXT DEFAULT 'items', item_name TEXT, quantity INTEGER DEFAULT 1, created_at INTEGER DEFAULT (strftime('%s','now')));
        CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_jid);

        CREATE TABLE IF NOT EXISTS kingdoms (
            id INTEGER PRIMARY KEY AUTOINCREMENT, owner_jid TEXT UNIQUE, name TEXT NOT NULL,
            level INTEGER DEFAULT 1, power INTEGER DEFAULT 100, status TEXT DEFAULT 'active',
            last_gather INTEGER DEFAULT 0, created_at INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE INDEX IF NOT EXISTS idx_kingdoms_owner ON kingdoms(owner_jid);

        CREATE TABLE IF NOT EXISTS kingdom_resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT, kingdom_id INTEGER, resource_type TEXT, amount INTEGER DEFAULT 0,
            UNIQUE(kingdom_id, resource_type)
        );
        CREATE INDEX IF NOT EXISTS idx_kr_kingdom ON kingdom_resources(kingdom_id);

        CREATE TABLE IF NOT EXISTS kingdom_buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT, kingdom_id INTEGER, building_type TEXT,
            level INTEGER DEFAULT 1, count INTEGER DEFAULT 1, created_at INTEGER DEFAULT (strftime('%s','now')),
            UNIQUE(kingdom_id, building_type)
        );
        CREATE INDEX IF NOT EXISTS idx_kb_kingdom ON kingdom_buildings(kingdom_id);

        CREATE TABLE IF NOT EXISTS kingdom_army (
            id INTEGER PRIMARY KEY AUTOINCREMENT, kingdom_id INTEGER, soldier_type TEXT,
            count INTEGER DEFAULT 0, experience INTEGER DEFAULT 0, level INTEGER DEFAULT 1, morale INTEGER DEFAULT 100,
            UNIQUE(kingdom_id, soldier_type)
        );
        CREATE INDEX IF NOT EXISTS idx_ka_kingdom ON kingdom_army(kingdom_id);

        CREATE TABLE IF NOT EXISTS alliances (
            id INTEGER PRIMARY KEY AUTOINCREMENT, kingdom_a INTEGER NOT NULL, kingdom_b INTEGER NOT NULL,
            requested_by INTEGER NOT NULL, status TEXT DEFAULT 'pending',
            created_at INTEGER DEFAULT (strftime('%s','now')), accepted_at INTEGER,
            UNIQUE(kingdom_a, kingdom_b)
        );
        CREATE TABLE IF NOT EXISTS challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT, challenger_id INTEGER NOT NULL, challenged_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending', created_at INTEGER DEFAULT (strftime('%s','now')),
            UNIQUE(challenger_id, challenged_id)
        );
        CREATE TABLE IF NOT EXISTS wars (
            id INTEGER PRIMARY KEY AUTOINCREMENT, attacker_id INTEGER NOT NULL, defender_id INTEGER NOT NULL,
            status TEXT DEFAULT 'active', winner_id INTEGER,
            created_at INTEGER DEFAULT (strftime('%s','now')), ended_at INTEGER,
            UNIQUE(attacker_id, defender_id)
        );

        CREATE TABLE IF NOT EXISTS market_meta (key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE IF NOT EXISTS market_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT, refresh_id INTEGER, item_id TEXT, price INTEGER, stock INTEGER,
            UNIQUE(refresh_id, item_id)
        );
        CREATE INDEX IF NOT EXISTS idx_market_refresh ON market_items(refresh_id);
        CREATE TABLE IF NOT EXISTS market_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_jid TEXT, item_id TEXT, action TEXT,
            quantity INTEGER, price INTEGER, total INTEGER, created_at INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE INDEX IF NOT EXISTS idx_market_log_user ON market_log(user_jid);

        CREATE TABLE IF NOT EXISTS mission_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_jid TEXT, mission_id INTEGER,
            status TEXT DEFAULT 'active', progress INTEGER DEFAULT 0, claimed INTEGER DEFAULT 0,
            started_at INTEGER DEFAULT (strftime('%s','now')), completed_at INTEGER, claimed_at INTEGER,
            UNIQUE(user_jid, mission_id)
        );
        CREATE INDEX IF NOT EXISTS idx_mission_user ON mission_progress(user_jid);
        CREATE INDEX IF NOT EXISTS idx_mission_status ON mission_progress(status);

        CREATE TABLE IF NOT EXISTS user_stats (
            user_jid TEXT PRIMARY KEY,
            work_count INTEGER DEFAULT 0, daily_count INTEGER DEFAULT 0, transfer_count INTEGER DEFAULT 0,
            market_buys INTEGER DEFAULT 0, market_sells INTEGER DEFAULT 0,
            train_count INTEGER DEFAULT 0, attack_count INTEGER DEFAULT 0, wins_count INTEGER DEFAULT 0,
            explorations_count INTEGER DEFAULT 0, adventures_count INTEGER DEFAULT 0, adventures_won INTEGER DEFAULT 0,
            areas_visited TEXT DEFAULT '[]',
            created_at INTEGER DEFAULT (strftime('%s','now')), updated_at INTEGER DEFAULT (strftime('%s','now'))
        );

        CREATE TABLE IF NOT EXISTS exploration_cooldowns (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_jid TEXT, area_id TEXT, last_at INTEGER DEFAULT 0,
            UNIQUE(user_jid, area_id)
        );

        CREATE TABLE IF NOT EXISTS adventure_state (
            user_jid TEXT PRIMARY KEY, adventure_id TEXT, step_index INTEGER DEFAULT 0,
            choices TEXT DEFAULT '[]', started_at INTEGER DEFAULT (strftime('%s','now'))
        );

        CREATE TABLE IF NOT EXISTS reward_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_jid TEXT, code TEXT,
            used_at INTEGER DEFAULT (strftime('%s','now')), UNIQUE(user_jid, code)
        );

        CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_jid TEXT, achievement_id TEXT,
            progress INTEGER DEFAULT 0, unlocked INTEGER DEFAULT 0,
            unlocked_at INTEGER, claimed INTEGER DEFAULT 0, claimed_at INTEGER,
            UNIQUE(user_jid, achievement_id)
        );
        CREATE INDEX IF NOT EXISTS idx_ach_user ON user_achievements(user_jid);

        CREATE TABLE IF NOT EXISTS user_ranks (
            user_jid TEXT PRIMARY KEY,
            rank_id INTEGER DEFAULT 1,
            promoted_at INTEGER DEFAULT (strftime('%s','now'))
        );

        CREATE TABLE IF NOT EXISTS user_titles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_jid TEXT, title TEXT,
            unlocked_at INTEGER DEFAULT (strftime('%s','now')),
            UNIQUE(user_jid, title)
        );

        CREATE TABLE IF NOT EXISTS user_active_title (
            user_jid TEXT PRIMARY KEY, title TEXT
        );

        CREATE TABLE IF NOT EXISTS user_rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_jid TEXT, source TEXT, source_id TEXT,
            coins INTEGER DEFAULT 0, xp INTEGER DEFAULT 0,
            claimed_at INTEGER DEFAULT (strftime('%s','now')),
            UNIQUE(user_jid, source, source_id)
        );
        CREATE INDEX IF NOT EXISTS idx_rewards_user ON user_rewards(user_jid);

        CREATE TABLE IF NOT EXISTS antispam (
            user_jid TEXT PRIMARY KEY,
            msg_count INTEGER DEFAULT 0,
            window_start INTEGER DEFAULT 0,
            cooldown_until INTEGER DEFAULT 0,
            violations INTEGER DEFAULT 0,
            last_violation INTEGER DEFAULT 0,
            banned INTEGER DEFAULT 0,
            banned_at INTEGER,
            ban_reason TEXT
        );

        CREATE TABLE IF NOT EXISTS notifications_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_jid TEXT, event_type TEXT, event_key TEXT,
            sent_at INTEGER DEFAULT (strftime('%s','now')),
            UNIQUE(user_jid, event_type, event_key)
        );
        CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications_log(user_jid);

        CREATE TABLE IF NOT EXISTS crafting_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_jid TEXT, recipe_id TEXT,
            output_item TEXT, output_qty INTEGER DEFAULT 1,
            created_at INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE INDEX IF NOT EXISTS idx_craft_user ON crafting_log(user_jid);

        CREATE TABLE IF NOT EXISTS items_used (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_jid TEXT, item_id TEXT, qty INTEGER DEFAULT 1,
            effect TEXT, used_at INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE INDEX IF NOT EXISTS idx_used_user ON items_used(user_jid);

        CREATE TABLE IF NOT EXISTS protection_active (
            user_jid TEXT PRIMARY KEY,
            item_id TEXT, activated_at INTEGER DEFAULT (strftime('%s','now')),
            expires_at INTEGER, strength INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS steal_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thief_jid TEXT, victim_jid TEXT,
            success INTEGER DEFAULT 0,
            coins_stolen INTEGER DEFAULT 0,
            items_stolen TEXT,
            created_at INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE INDEX IF NOT EXISTS idx_steal_thief ON steal_log(thief_jid);
        CREATE INDEX IF NOT EXISTS idx_steal_victim ON steal_log(victim_jid);

        CREATE TABLE IF NOT EXISTS steal_cooldowns (
            thief_jid TEXT PRIMARY KEY,
            last_steal INTEGER DEFAULT 0,
            fail_count INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS gather_cooldowns (
            user_jid TEXT, area TEXT,
            last_gather INTEGER DEFAULT 0,
            UNIQUE(user_jid, area)
        );

        CREATE TABLE IF NOT EXISTS ai_memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_jid TEXT, fact TEXT, category TEXT DEFAULT 'general',
            importance INTEGER DEFAULT 1,
            created_at INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE INDEX IF NOT EXISTS idx_ai_mem_user ON ai_memory(user_jid);

        CREATE TABLE IF NOT EXISTS ai_convos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_jid TEXT, role TEXT, content TEXT,
            created_at INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_convos(user_jid);

        CREATE TABLE IF NOT EXISTS ai_state (
            user_jid TEXT PRIMARY KEY,
            style TEXT DEFAULT 'auto',
            total_msgs INTEGER DEFAULT 0,
            ai_msgs INTEGER DEFAULT 0,
            last_ai_at INTEGER DEFAULT 0,
            enabled INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS ai_blocks (
            user_jid TEXT PRIMARY KEY,
            reason TEXT, blocked_by TEXT,
            blocked_at INTEGER DEFAULT (strftime('%s','now'))
        );

        CREATE TABLE IF NOT EXISTS activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_jid TEXT,
            day TEXT,
            messages INTEGER DEFAULT 0,
            commands INTEGER DEFAULT 0,
            ai_msgs INTEGER DEFAULT 0,
            xp_earned INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            UNIQUE(user_jid, day)
        );
        CREATE INDEX IF NOT EXISTS idx_activity_user ON activity(user_jid);

        CREATE TABLE IF NOT EXISTS ai_cooldown (
            user_jid TEXT PRIMARY KEY,
            last_request INTEGER DEFAULT 0,
            count_today INTEGER DEFAULT 0,
            day TEXT
        );

        CREATE TABLE IF NOT EXISTS developer (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_jid TEXT UNIQUE NOT NULL,
            activated_at INTEGER DEFAULT (strftime('%s','now'))
        );

        CREATE TABLE IF NOT EXISTS developer (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_jid TEXT UNIQUE NOT NULL,
            activated_at INTEGER DEFAULT (strftime('%s','now'))
        );

        CREATE TABLE IF NOT EXISTS developer (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_jid TEXT UNIQUE NOT NULL,
            activated_at INTEGER DEFAULT (strftime('%s','now'))
        );

        CREATE TABLE IF NOT EXISTS conversation_users (
            user_jid TEXT PRIMARY KEY,
            enabled INTEGER DEFAULT 0,
            activated_at INTEGER,
            activated_by TEXT,
            deactivated_at INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_conv_users ON conversation_users(enabled);

        CREATE TABLE IF NOT EXISTS conversation_groups (
            group_jid TEXT PRIMARY KEY,
            enabled INTEGER DEFAULT 0,
            activated_at INTEGER,
            activated_by TEXT,
            deactivated_at INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_conv_groups ON conversation_groups(enabled);

        CREATE TABLE IF NOT EXISTS ai_moderation (
            user_jid TEXT PRIMARY KEY,
            warnings INTEGER DEFAULT 0,
            last_warning INTEGER DEFAULT 0,
            profanity_count INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS ai_silenced (
            user_jid TEXT PRIMARY KEY,
            silenced_at INTEGER DEFAULT (strftime('%s','now')),
            reason TEXT
        );

        CREATE TABLE IF NOT EXISTS pending_blocks (
            user_jid TEXT PRIMARY KEY,
            reason TEXT,
            requested_at INTEGER DEFAULT (strftime('%s','now')),
            expires_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS self_chat_users (
            user_jid TEXT PRIMARY KEY,
            enabled INTEGER DEFAULT 1
        );
    `);

    safeAddColumn('users', 'last_daily', 'INTEGER DEFAULT 0');
    safeAddColumn('users', 'last_work', 'INTEGER DEFAULT 0');
    safeAddColumn('kingdoms', 'last_gather', 'INTEGER DEFAULT 0');
    safeAddColumn('kingdom_army', 'experience', 'INTEGER DEFAULT 0');
    safeAddColumn('kingdom_army', 'level', 'INTEGER DEFAULT 1');
    safeAddColumn('kingdom_army', 'morale', 'INTEGER DEFAULT 100');

    console.log('✅ قاعدة البيانات جاهزة');
}

initDatabase();
module.exports = db;

function register(db, robloxId, discordId) {
    if (!robloxId || !discordId) {
        console.error("Roblox and Discord ID not found during registration of user");

        return;
    }

    const insert = db.prepare(`
    INSERT INTO users (roblox_id, discord_id, verified) VALUES (?, ?, 1) ON CONFLICT(roblox_id) DO UPDATE SET
        discord_id = excluded.discord_id,
        verified = excluded.verified    
    `);

    insert.run(robloxId, discordId, function(err) {
        if (err) {
            console.error("Insert error message", err.message);

            return;
        }
    });

    require("./debug/printUsers.js")(db);
}

module.exports = { register }
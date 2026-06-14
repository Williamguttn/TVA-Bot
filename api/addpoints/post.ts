const { doSql } = require("../../database/doSql");
const { createRobloxClient } = require("../../misc/roblox");

const roblox = createRobloxClient();

module.exports = async function(req, res, db) {
    const body = req.body;

    if (!body.userId || !body.points || typeof body.userId !== "number" || typeof body.points !== "number") {
        return res.status(400).json({ error: "Missing userId or score." });
    }

    if (body.points < 0) {
        return res.status(400).json({ error: "Score cannot be negative." });
    }
    
    if (body.points > 100) {
        return res.status(400).json({ error: "Score cannot be greater than 100." });
    }

    const existingUser = await doSql(
        db,
        "SELECT roblox_id FROM users WHERE roblox_id = ?",
        [body.userId]
    );

    if (existingUser.length <= 0) {
        await doSql(
            db,
            "INSERT INTO users (roblox_id, score) VALUES (?, ?)",
            [body.userId, body.points]
        );
    } else {
        await doSql(
            db,
            "UPDATE users SET score = score + ? WHERE roblox_id = ?",
            [body.points, body.userId]
        );
    }

    try {
        await require("../../misc/pointsPromote")(roblox, null, db, body.userId);
    } catch (error) {
        console.error("Automatic promotion failed after API addpoints:", error);
    }

    res.status(200).json({ message: "Success" });
}

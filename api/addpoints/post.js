const { doSql } = require("../../database/doSql.js");

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

    await doSql(
        db,
        "UPDATE users SET score = score + ? WHERE roblox_id = ?",
        [body.points, body.userId]
    );

    res.status(200).json({ message: "Success" });
}
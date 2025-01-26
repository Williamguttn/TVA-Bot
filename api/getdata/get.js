const { doSql } = require("../../database/doSql.js");

module.exports = async function(req, res, db) {
    const { userId } = req.query;

    if (!/^\d+$/.test(userId)) {
        return res.status(400).json({ error: "Invalid userId." });
    }

    let data = await doSql(
        db,
        "SELECT score FROM users WHERE roblox_id = ?",
        [userId]
    );

    if (data.length === 0) {
        return res.status(404).json({ error: "User not found." });
    }

    data = data[0];
    res.status(200).json(data);
};
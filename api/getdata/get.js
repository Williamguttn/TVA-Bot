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

    // Fetch potential medals

    data[0].medals = [];

    try {
        const medalNames = await doSql(
            db,
            `SELECT name FROM medals 
            JOIN user_medals ON medals.display_order = user_medals.medal_id
            WHERE user_medals.roblox_id = ?`,
            [userId]
        );

        // Push names to medals
        medalNames.forEach(element => element.name && data[0].medals.push(element.name));
    } catch(err) {
        console.error(err);
    }

    data = data[0];
    res.status(200).json(data);
};
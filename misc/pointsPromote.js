const { doSql } = require("../database/doSql.js");
const { fetchUserGroupRank, setGroupRank } = require("../misc/noblox.js");

module.exports = async function(noblox, interaction, db, playerId) {
    if (!db || !playerId) return;

    const data = await doSql(db, "SELECT * FROM users WHERE roblox_id = ?", [playerId]);
    const bindGroups = await doSql(db, "SELECT DISTINCT group_id FROM group_binds");
    // Fetch all group IDs from group_binds
    const groupBinds = await doSql(db, `
        SELECT *
        FROM group_binds
        WHERE points_needed <= ?
        ORDER BY points_needed ASC
    `, [data[0].score]);
    
    // Now get the next row after the maximum points_needed fetched
    const nextRow = await doSql(db, `
        SELECT *
        FROM group_binds
        WHERE points_needed > ?
        ORDER BY points_needed ASC
        LIMIT 1
    `, [data[0].score]);

    const highestRank = await doSql(db, "SELECT * FROM group_binds ORDER BY points_needed DESC LIMIT 1");

    let availableBinds = nextRow ? [...groupBinds, nextRow[0]] : groupBinds;

    if (data.length <= 0 || availableBinds.length <= 0) return;

    const points = data[0].score;

    // Player is an officer, points wont affect their rank
    if (points >= highestRank[0].points_needed && await fetchUserGroupRank(noblox, interaction, +highestRank[0].group_id, +playerId) > highestRank[0].rank) {
        return;
    }

    // Player presumably has the highest rank
    if (availableBinds[availableBinds.length - 1] === undefined) {
        // Last element undefined happens if we can promote to the highest rank.
        // We'll remove the undefined part, since theres no more ranks to promote to.
        availableBinds = availableBinds.slice(0, availableBinds.length - 1);
    } else if (points > availableBinds[availableBinds.length - 1].points_needed)
        return;


    let groupIds = bindGroups.map(g => g.group_id);

    // Leave only the groups that the player is in
    groupIds = groupIds.filter(async g => await fetchUserGroupRank(noblox, interaction, +g.group_id, +playerId) > 0);

    const promotions = [];

    for (let i = 0; i < availableBinds.length; i++) {
        const bind = availableBinds[i];

        if (groupIds.includes(bind.group_id)) {
            if (points < bind.points_needed) {
               // Player can have the previous rank
               const prevBind = availableBinds[i - 1];

               promotions.push({ group_id: bind.group_id, rank: prevBind.rank });
            } else if (points === bind.points_needed || (points > bind.points_needed && i === availableBinds.length - 1)) {
                // Promote if we have the exact rank or if we have more & this is the last rank
               promotions.push({ group_id: bind.group_id, rank: bind.rank });
            }
        }
    }

    if (promotions.length <= 0) return;

    for (const promotion of promotions) {
        let rank = promotion.rank;
        let groupId = promotion.group_id;

        if (availableBinds[availableBinds.length - 1].group_id === groupId)
            if (points > availableBinds[availableBinds.length - 1].points_needed && await fetchUserGroupRank(noblox, interaction, +groupId, +playerId) >= rank)
                // Player has the highest rank
                continue;
        
        // Give the player the rank
        await setGroupRank(noblox, interaction, +groupId, +playerId, rank);
    }
}
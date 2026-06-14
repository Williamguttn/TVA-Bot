// This sets a user's status to the highest status that they can have based on their ranks

const { doSql } = require("../database/doSql");
const { fetchUserGroupRank } = require("./noblox");
const { status } = require("./status");

module.exports = async function(noblox, interaction, db, playerId) {
    if (!db || !playerId) return;

    let highestStatus = status.verified;
    const statusGroups = await doSql(db, "SELECT DISTINCT group_id FROM status_binds");

    if (statusGroups.length <= 0) {
        await doSql(db, "UPDATE users SET status = ? WHERE roblox_id = ?", [highestStatus, playerId]);

        return highestStatus;
    }

    // Parallel fetch of user ranks for all groups
    const groupRanks = await Promise.all(
        statusGroups.map(async (group) => ({
            groupId: group.group_id,
            rank: await fetchUserGroupRank(noblox, interaction, +group.group_id, +playerId)
        }))
    );

    const validGroupRanks = groupRanks.filter((entry) => typeof entry.rank === "number" && entry.rank > 0);

    if (validGroupRanks.length === 0) {
        await doSql(db, "UPDATE users SET status = ? WHERE roblox_id = ?", [highestStatus, playerId]);

        return highestStatus;
    }

    const bindsQuery = `
        SELECT group_id, rank, status 
        FROM status_binds 
        WHERE group_id IN (${validGroupRanks.map(() => '?').join(',')}) 
        ORDER BY status DESC
    `;
    const binds = await doSql(db, bindsQuery, validGroupRanks.map(g => g.groupId));

    if (binds.length <= 0) {
        await doSql(db, "UPDATE users SET status = ? WHERE roblox_id = ?", [highestStatus, playerId]);

        return highestStatus;
    }

    const rankMap = new Map(validGroupRanks.map(entry => [entry.groupId, entry.rank]));

    for (const bind of binds) {
        if (bind.status <= highestStatus) break;

        const userRank = rankMap.get(bind.group_id);
        if (userRank >= bind.rank) {
            highestStatus = bind.status;

            if (highestStatus === status.adminPerms) break;
        }
    }

    await doSql(db, "UPDATE users SET status = ? WHERE roblox_id = ?", [highestStatus, playerId]);

    return highestStatus;
}

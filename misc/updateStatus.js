// This sets a user's status to the highest status that they can have based on their ranks

const { doSql } = require("../database/doSql.js");
const { fetchUserGroupRank } = require("./noblox.js");
const { status } = require("./status.js");

module.exports = async function(noblox, interaction, db, playerId) {
    const statusGroups = await doSql(db, "SELECT DISTINCT group_id FROM status_binds");

    if (!db || !playerId || statusGroups.length <= 0) return;

    let highestStatus = status.verified;

    const groupRanks = await Promise.all(
        statusGroups.map(async (group) => {
            const rank = await fetchUserGroupRank(noblox, interaction, +group.group_id, +playerId);
            return { groupId: group.group_id, rank };
        })
    );

    const validGroupRanks = groupRanks.filter((entry) => entry.rank > 0);

    if (validGroupRanks.length === 0) return;

    const bindsQuery = `SELECT * FROM status_binds WHERE group_id IN (${validGroupRanks.map((g) => '?').join(',')})`;
    const binds = await doSql(db, bindsQuery, validGroupRanks.map((g) => g.groupId));

    if (binds.length <= 0) return;

    const rankMap = new Map(validGroupRanks.map((entry) => [entry.groupId, entry.rank]));

    for (const bind of binds) {
        const rank = rankMap.get(bind.group_id);

        if (rank >= bind.rank && bind.status > highestStatus) {
            highestStatus = bind.status;

            if (highestStatus === status.adminPerms) {
                break;
            }
        }
    }

    await doSql(db, "UPDATE users SET status = ? WHERE roblox_id = ?", [highestStatus, playerId]);
}
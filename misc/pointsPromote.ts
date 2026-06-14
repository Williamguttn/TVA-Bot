const { doSql } = require("../database/doSql");
const { fetchUserGroupRank, setGroupRank } = require("../misc/noblox");

module.exports = async function(noblox, interaction, db, playerId) {
    if (!db || !playerId) return;

    const data = await doSql(db, "SELECT * FROM users WHERE roblox_id = ?", [playerId]);
    if (data.length <= 0) return;

    const points = data[0].score;
    const bindGroups = await doSql(db, "SELECT DISTINCT group_id FROM group_binds");

    if (bindGroups.length <= 0) return;

    const promotions = await Promise.all(
        bindGroups.map(async ({ group_id }) => {
            const binds = await doSql(db, `
                SELECT *
                FROM group_binds
                WHERE group_id = ?
                ORDER BY points_needed ASC
            `, [group_id]);

            if (binds.length <= 0) {
                return null;
            }

            const currentRank = await fetchUserGroupRank(noblox, interaction, +group_id, +playerId);

            if (typeof currentRank !== "number" || currentRank <= 0) {
                return null;
            }

            const highestBind = binds[binds.length - 1];

            // Higher manual/officer ranks should not be affected by the point ladder.
            if (currentRank > highestBind.rank) {
                return null;
            }

            const desiredBind = binds.filter(bind => points >= bind.points_needed).at(-1);

            if (!desiredBind || currentRank === desiredBind.rank) {
                return null;
            }

            return {
                groupId: +group_id,
                rank: desiredBind.rank
            };
        })
    );

    for (const promotion of promotions) {
        if (!promotion) {
            continue;
        }

        await setGroupRank(noblox, interaction, promotion.groupId, +playerId, promotion.rank);
    }
}

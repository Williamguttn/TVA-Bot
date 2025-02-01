const { doSql } = require("../database/doSql.js");
const { fetchIdFromUsername, fetchPlayerGroups, fetchUserGroupRank } = require("./noblox.js");

// Member is who they are in the actual server
async function updateServerRoles(userData, user, interaction, misc, noblox) {
    const guild = interaction.guild;

    // We'll get the binds for this server
    const binds = await doSql(misc.db, "SELECT * FROM rank_binds WHERE server_id = ?", [interaction.guildId]);
    const userGroups = await fetchPlayerGroups(noblox, interaction, userData.roblox_id);

    const member = user;

    if (!member) {
        return [[], []];
    }

    //const userRoleIds = user.roles.cache.map(role => role.id);
    //const allGuildRoleIds = guild.roles.cache.map(role => role.id);
    //const allBindedRoleIds = binds.map(bind => bind.role_id);

    const allUserGroups = userGroups.map(group => ({ id: group.Id, rank: group.Rank }));

    // This will be a list of all binds with a group_id thats also in allUserGroups
    const groupIds = new Set(allUserGroups.map(userGroup => userGroup.id.toString()));
    const matchingBinds = binds.filter(bind => groupIds.has(bind.group_id));

    // Used for quick lookup of the rank in a group
    const userGroupMap = new Map(
        allUserGroups.map(group => [group.id, group.rank])
    );

    let addedRoleIds = []; // We will do an exclusion on allBindedRoleIds later, so that we are left with IDs of roles the player did NOT add
    let removedRoleIds = [];
    let considered = [];

    // If player doesnt have the verified role, add it if they are verified
    if (!member.roles.cache.has("1175961834763862056") && userData.verified) {
        addedRoleIds.push("1175961834763862056");
    }

    // Unverified role
    if (!userData.verified && !member.roles.cache.has("1175961833782399076")) {
        addedRoleIds.push("1175961833782399076");

        if (member.roles.cache.has("1175961834763862056")) {
            removedRoleIds.push("1175961834763862056");
        }
    }

    if (userData.verified && member.roles.cache.has("1175961833782399076")) {
        removedRoleIds.push("1175961834763862056");
    }

    async function addBindRoles() {
        for (const group of matchingBinds) {
            if (considered.includes(group.role_id)) {
                continue;
            }

            considered.push(group.role_id);

            const rank = userGroupMap.get(+group.group_id);
            
            // The rankes that rankInGroup must be within
            const from = group.rank_start;
            const to = group.rank_end;
            const hasRole = await member.roles.cache.has(group.role_id);

            if ((to && from && rank >= from && rank <= to) || (!to && from && rank === from) || (!to && !from)) {
                // User is within right range
                if (!hasRole) {
                    addedRoleIds.push(group.role_id); // We'll add the role later
                }
            } else {
                // Player has the role, even if they are not allowed to have it
                if (hasRole) {
                    removedRoleIds.push(group.role_id); // We'll remove the role later
                }
            }
        }
    }

    await addBindRoles();

    // We now need to finish the list of roles to remove
    // We'll start with a blank paper. All bindable roles possible. Then, find out which ones the player is ALLOWED to have
    // Then, remove all the roles the player has that are not in the list of allowed roles
    
    considered = [];

    let nonMatchingBinds = binds.filter(bind => !addedRoleIds.includes(bind.role_id));

    for (const bind of nonMatchingBinds) {
        if (considered.includes(bind.role_id)) {
            continue;
        }

        considered.push(bind.role_id);

        const hasRole = await member.roles.cache.has(bind.role_id);

        if (!hasRole) {
            continue;
        }

        const rank = userGroupMap.get(+bind.group_id);

        if (rank === undefined || rank === null) {
            // Player is not in the group, so we'll remove the role
            removedRoleIds.push(bind.role_id);

            continue;
        }

        const from = bind.rank_start;
        const to = bind.rank_end;

        if (!((to && from && rank >= from && rank <= to) || (!to && from && rank === from) || (!to && !from))) {
            // Player is not in the right range, so we'll remove the role
            if (hasRole) {
                removedRoleIds.push(bind.role_id);
            }
        }
    }

    // Remove duplicates
    addedRoleIds = [...new Set(addedRoleIds)];
    removedRoleIds = [...new Set(removedRoleIds)];
    
    // Start an asynchronous process to let it continue adding/removing roles
    (async () => {
        // Roles to add
        for (const role of addedRoleIds) {
            const guildRole = await interaction.guild.roles.fetch(role.trim());
            const hasRole = await member.roles.cache.has(role);

            if (!hasRole) {
                await member.roles.add(guildRole).catch(console.error);
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        // Roles to remove
        for (const role of removedRoleIds) {
            const guildRole = await interaction.guild.roles.fetch(role.trim());
            const hasRole = await member.roles.cache.has(role);

            if (hasRole) {
                await member.roles.remove(guildRole).catch(console.error);
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    })();

    return [addedRoleIds, removedRoleIds];
}

module.exports = { updateServerRoles };
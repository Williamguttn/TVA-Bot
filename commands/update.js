const { SlashCommandBuilder } = require("discord.js");
const { fetchIdFromUsername, fetchPlayerGroups, fetchUserGroupRank } = require("../misc/noblox.js");
const { doSql } = require("../database/doSql.js");
const { errorEmbed } = require("../misc/error.js");
const { reply } = require("../misc/reply.js");
const statusUpdate = require("../misc/updateStatus.js");

module.exports = {
    verificationNeeded: true,
    data: new SlashCommandBuilder()
        .setName("update")
        .setDescription("Update your ROBLOX ranks and Discord roles")
        .addStringOption(option => option.setName("username").setDescription("User to update")),
    async execute(noblox, bot, interaction, misc) {
        // Confirm that the player is verified

        const plrArg = interaction.options.getString("username");

        if (/[^a-zA-Z0-9_]/.test(plrArg)) {
            let embed = {
                color: 0xfc0313,
                title: "Not a valid username!",
                description: "This is not a valid ROBLOX username",
                thumbnail: {
                    url: bot.avatarURL
                },
                footer: {
                    text: "verify | TVA Bot"
                }
            };

           reply({ embeds: [embed] });

            return;
        }

        const localData = await doSql(misc.db, "SELECT * FROM users WHERE discord_id = ?", [interaction.user.id]);

        //console.log(interaction)
        const userUpdate = plrArg !== null ? await fetchIdFromUsername(noblox, interaction, plrArg, misc.client) : localData[0].roblox_id; // RBLX ID of user to update
        console.log(userUpdate);

        if (!userUpdate) {
            errorEmbed(misc.client, interaction, "Error occurred!", "Is the username correct?", "idfetch");

            return;
        }

        const updateData = await doSql(misc.db, "SELECT * FROM users WHERE roblox_id = ?", [userUpdate]);

        if (typeof updateData[0] !== "object" || (typeof updateData[0] === "object" && updateData[0].verified <= 0)) {
            errorEmbed(misc.client, interaction, "Error occurred!", "User must be verfied", "updateverify");

            return;
        }

        // Make sure that the user is in this server
        const guild = misc.client.guilds.cache.get(interaction.guildId);
        //const member = guild.members.cache.get(updateData[0].discord_id);
        const member = await interaction.guild.members.fetch(updateData[0].discord_id);

        if (!member) {
            errorEmbed(misc.client, interaction, "Error occurred!", "User must be in this server", "missingmember");

            return;
        }
        
        try {
            interaction.deferReply();
        } catch(e) {console.error(e)}

        // Attempt to update roles
        const playerGroups = await fetchPlayerGroups(noblox, interaction, userUpdate);
        const serverBinds = await doSql(misc.db, "SELECT * FROM rank_binds WHERE server_id = ?", [interaction.guildId]);

        let addRoles = [];
        let removeRoles = [];

        async function bindRanks() {
            // Find relevant server binds
            const groupIds = new Set(playerGroups.map(g => g.Id.toString()));
            const matchingBinds = serverBinds.filter(bind => groupIds.has(bind.group_id)); 
    
            for (const bind of matchingBinds) {
                const rank = await fetchUserGroupRank(noblox, interaction, +bind.group_id, userUpdate);
                const role = await interaction.guild.roles.fetch(bind.role_id.trim());
    
                if (!role) {
                    console.log(`Role with ID ${bind.role_id} not found in server ${interaction.guildId}`);
    
                    continue;
                }
    
                const hasRole = guild.roles.cache.get(role.id).members.some(m => m.id === member.id);
                
                //if (rank >= bind.rank_start && (rank <= bind.rank_end || bind.rank_end === null)) {
    
                const from = bind.rank_start;
                const to = bind.rank_end;
    
                if ((to && from && rank >= from && rank <= to) || (!to && from && rank === from) || (!to && !from)) {
                    if (!hasRole) {
                        member.roles.add(role).catch(console.error);
                        addRoles.push(bind.role_id);
                    }
                } else {
                    // Player does not have the rank, so remove the role
    
                    if (hasRole) {
                        member.roles.remove(role).catch(console.error);
                        removeRoles.push(bind.role_id);
                    }
                }
            }
    
            // Now, remove ranks that the user can no longer have.
            // So, we'll loop over all the binds for this server (Excluding the groups that the player is a part of).
            // Then, if the player has the role, we'll remove it.
            const nonMatchingBinds = serverBinds.filter(bind => !groupIds.has(bind.group_id));
    
            for (const bind of nonMatchingBinds) {
                const role = guild.roles.cache.get(bind.role_id);

                if (!role) {
                    console.log(`Role with ID ${bind.role_id} not found in server ${interaction.guildId}`);
    
                    continue;
                }

                const hasRole = guild.roles.cache.get(role.id).members.some(m => m.id === member.id);
    
                if (role && hasRole) {
                    member.roles.remove(role).catch(console.error);
                    removeRoles.push(bind.role_id);
                }
            }

        }

        if (serverBinds.length > 0) {
            await bindRanks();
        }

        // Embed that lists all roles added, and all roles removed
        let embed = {
            color: 0x11ed23,
            title: "Success!",
            description: `
                Roles added: ${addRoles.length === 0 ? "NONE" : addRoles.map(r => `<@&${r}>`).join(", ")}
                Roles removed: ${removeRoles.length === 0 ? "NONE" : removeRoles.map(r => `<@&${r}>`).join(", ")}
            `,
            footer: {
                text: "update"
            }
        };

        statusUpdate(noblox, interaction, misc.db, userUpdate);
        reply(interaction, { embeds: [embed] });
        //console.log(matchingBinds);
    }
};
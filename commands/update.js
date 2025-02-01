const { SlashCommandBuilder } = require("discord.js");
const { doSql } = require("../database/doSql.js");
const { errorEmbed } = require("../misc/error.js");
const { reply } = require("../misc/reply.js");
const { fetchIdFromUsername, fetchUsernameFromId } = require("../misc/noblox.js");
const { updateServerRoles } = require("../misc/updateServerRoles.js");
const { status } = require("../misc/status.js");
const statusUpdate = require("../misc/updateStatus.js");

module.exports = {
    verificationNeeded: true,
    data: new SlashCommandBuilder()
        .setName("update")
        .setDescription("Update your roles")
        .addStringOption(option => option.setName("username").setDescription("User to update")),
    async execute(noblox, bot, interaction, misc) {
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
        const userUpdate = plrArg !== null ? await fetchIdFromUsername(noblox, interaction, plrArg, misc.client) : localData[0].roblox_id;

        if (!userUpdate) {
            //errorEmbed(misc.client, interaction, "Error occurred!", "Is the username correct?", "idfetch");

            return;
        }

        // This is the data of the player to update
        let updateData;

        if (userUpdate !== localData[0].roblox_id) {
            updateData = await doSql(misc.db, "SELECT * FROM users WHERE roblox_id = ?", [userUpdate]);
        } else {
            updateData = localData;
        }

        updateData = updateData[0];

        if (!updateData || !updateData.verified) {
            errorEmbed(misc.client, interaction, "Error occurred!", "User must be verified", "missingverification");

            return;
        }

        // Make sure that the user is in this server
        const member = await interaction.guild.members.fetch(updateData.discord_id);

        if (!member) {
            errorEmbed(misc.client, interaction, "Error occurred!", "User must be in this server", "missingmember");

            return;
        }

        // Defer the reply, this might take some time
        try {
            interaction.deferReply();
        } catch(e) {console.error(e)}

        const [addedRoleIds, removedRoleIds] = await updateServerRoles(updateData, member, interaction, misc, noblox);
        const newStatus = await statusUpdate(noblox, interaction, misc.db, userUpdate);
        const statusUpdated = newStatus !== updateData.status;

        function getStatusKey(value) {
            for (const key in status) {
                if (status[key] === value) {
                    return key;
                }
            }

            return null;
        }

        // Update server name
        if (userUpdate) {
            try {
                const username = await fetchUsernameFromId(noblox, interaction, userUpdate);

                if (username !== null && username !== undefined) {
                    await member.setNickname(username);
                }
            } catch(e) {console.error("Nickname change failed:", e)}
        }

        let embed = {
            color: 0x11ed23,
            title: "Success!",
            description: `
                ${statusUpdated ? `Status: updated to ${getStatusKey(newStatus)}` : "Status: unchanged"}

                Roles added: ${addedRoleIds.length === 0 ? "NONE" : addedRoleIds.map(r => `<@&${r}>`).join(", ")}
                Roles removed: ${removedRoleIds.length === 0 ? "NONE" : removedRoleIds.map(r => `<@&${r}>`).join(", ")}
            `,
            footer: {
                text: "update"
            }
        };

        //statusUpdate(noblox, interaction, misc.db, userUpdate);
        reply(interaction, { embeds: [embed] });
    }
};
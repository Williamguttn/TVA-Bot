const { SlashCommandBuilder } = require("discord.js");
const { doSql } = require("../database/doSql.js");
const { errorEmbed } = require("../misc/error.js");
const { reply } = require("../misc/reply.js");

module.exports = {
    verificationNeeded: true,
    statusReq: 3,
    data: new SlashCommandBuilder()
        .setName("unaward")
        .setDescription("Remove medal from a player")
        .addStringOption(option => option.setName("username").setDescription("Player to remove it from").setRequired(true))
        .addStringOption(option => option.setName("medal").setDescription("ID of medal to remove").setRequired(true)),
    async execute(noblox, bot, interaction, misc) {
        const username = interaction.options.getString("username");
        let medalId = interaction.options.getString("medal");

        if (/[^a-zA-Z0-9_]/.test(username)) {
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

        if (!(/^-?\d+$/.test(medalId))) {
            errorEmbed(misc.client, interaction, "Type Error", "Medal ID must contain numbers only", "medaltype");

            return;
        }

        medalId = +medalId;

        const userId = await noblox.getIdFromUsername(username);
        
        if (userId === undefined || userId === null) {
            errorEmbed(misc.client, interaction, "Error occurred!", "User does not exist", "usernotfound");

            return;
        }

        try {
            // Remove if player has the medal
            const playerMedal = await doSql(misc.db, "SELECT * FROM user_medals WHERE roblox_id = ? AND medal_id = ?", [userId, medalId]);

            if (playerMedal.length === 0) {
                errorEmbed(misc.client, interaction, "Error occurred!", "User does not have this medal", "nomedal");

                return;
            }

            await doSql(misc.db, "DELETE FROM user_medals WHERE roblox_id = ? AND medal_id = ?", [userId, medalId]);
        } catch(err) {
            errorEmbed(misc.client, interaction, "Error occurred!", "Failed to remove medal from this user!", "medalfetch");
            console.error(err);

            return;
        }

        const robloxUsername = await noblox.getUsernameFromId(userId);

        const embed = {
            color: 0x11ed23,
            title: "Success!",
            description: `Successfully removed medal from ${robloxUsername}`,
            thumbnail: {
                url: bot.avatarURL
            },
            footer: {
                text: "awardmedal | TVA Bot"
            }
        };
        
        reply(interaction, { embeds: [embed] });
    }
}
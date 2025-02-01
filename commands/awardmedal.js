const { SlashCommandBuilder } = require("discord.js");
const { doSql } = require("../database/doSql.js");
const { errorEmbed } = require("../misc/error.js");
const { reply } = require("../misc/reply.js");

module.exports = {
    verificationNeeded: true,
    statusReq: 3, // HICOM,
    data: new SlashCommandBuilder()
        .setName("awardmedal")
        .setDescription("Give medal to player")
        .addStringOption(option => option.setName("username").setDescription("Player you're giving it to").setRequired(true))
        .addStringOption(option => option.setName("medal").setDescription("Medal ID").setRequired(true)),
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
            // Make sure medal exists
            const medal = await doSql(misc.db, "SELECT id FROM medals WHERE display_order = ?", [medalId]);
        
            if (medal.length === 0) {
                errorEmbed(misc.client, interaction, "Error occurred!", "Medal does not exist", "medalnotfound");

                return;
            }

            // Check if user already has it
            const hasMedal = await doSql(misc.db, "SELECT * FROM user_medals WHERE roblox_id = ? AND medal_id = ?", [userId, medalId]);

            if (hasMedal.length !== 0) {
                errorEmbed(misc.client, interaction, "Error occurred!", "User already has this medal", "hasmedal");

                return;
            }

            await doSql(misc.db, "INSERT INTO user_medals (roblox_id, medal_id) VALUES (?, ?)", [userId, medalId]);
        } catch(err) {
            errorEmbed(misc.client, interaction, "Error occurred!", "Failed to award medal to this user!", "awardfailed");

            return;
        }
        
        const robloxUsername = await noblox.getUsernameFromId(userId);

        const embed = {
            color: 0x11ed23,
            title: "Success!",
            description: `Successfully awarded medal to ${robloxUsername}`,
            thumbnail: {
                url: bot.avatarURL
            },
            footer: {
                text: "awardmedal | TVA Bot"
            }
        };
        
        reply(interaction, { embeds: [embed] });
    }
};
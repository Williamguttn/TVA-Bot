const { SlashCommandBuilder } = require("discord.js");
const { doSql } = require("../database/doSql.js");
const { errorEmbed } = require("../misc/error.js");
const { reply } = require("../misc/reply.js"); 

module.exports = {
    verificationNeeded: true,
    data: new SlashCommandBuilder()
        .setName("checkmedals")
        .setDescription("Check the medals that a user has")
        .addStringOption(option => option.setName("username").setDescription("User to check")),
    async execute(noblox, bot, interaction, misc) {
        const username = interaction.options.getString("username");

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

        let userId;
        
        if (username !== null && username !== undefined) {
            userId = await noblox.getIdFromUsername(username);
        } else {
            // No username, list all medals

            try {
                const medals = await doSql(misc.db, "SELECT * FROM medals ORDER BY display_order", []);
                let replyText = "";

                for (const medal of medals) {
                    replyText += `**${medal.name} (${medal.display_order})**\n`;
                    replyText += `${medal.description}\n\n`;
                }

                const embed = {
                    color: 0x11ed23,
                    title: "Medals",
                    description: `
                    All medals:

                    ${replyText.trim()}
                    `,
                    thumbnail: {
                        url: bot.avatarURL
                    },
                    footer: {
                        text: "checkmedals | TVA Bot"
                    }
                };

                reply(interaction, { embeds: [embed] });

                return;
            } catch(err) {
                errorEmbed(misc.client, interaction, "Error occurred!", "Failed to get medals!", "medalfetch");
                console.error(err);

                return;
            }
        }

        let medals = [];

        try {
            medals = await doSql(
                misc.db,
                `SELECT medals.* FROM medals 
                JOIN user_medals ON medals.display_order = user_medals.medal_id
                WHERE user_medals.roblox_id = ?`,
                [userId]
            );

            if (medals.length === 0) {
                errorEmbed(misc.client, interaction, "No medals", "User has no medals!", "nomedals");

                return;
            }
        } catch (err) {
            errorEmbed(misc.client, interaction, "Error occurred!", "Failed to get medals!", "medalfetch");
            console.error(err);

            return;
        }

        // Convert medals to text output
        let medalsText = medals.map(medal => `**${medal.name} (${medal.display_order})**\n${medal.description}\n\n`).join("");
        const robloxUsername = await noblox.getUsernameFromId(userId);

        const embed = {
            color: 0x11ed23,
            title: "Medals",
            description: `
            Medals for ${robloxUsername}:
            
            ${medalsText.trim()}
            `,
            thumbnail: {
                url: bot.avatarURL
            },
            footer: {
                text: "checkmedals | TVA Bot"
            }
        };

        reply(interaction, { embeds: [embed] })
    }
};
const { SlashCommandBuilder } = require("discord.js");
const { fetchIdFromUsername, fetchUsernameFromId } = require("../misc/noblox.js");
const { reply } = require("../misc/reply.js");
const { doSql } = require("../database/doSql.js");

module.exports = {
    verificationNeeded: true,
    data: new SlashCommandBuilder()
        .setName("points")
        .setDescription("Check a player's points")
        .addStringOption(option => option.setName("username").setDescription("Username of the player")),
    async execute(noblox, bot, interaction, misc) {
        let plrArg = interaction.options.getString("username");

        if (plrArg && /[^a-zA-Z0-9_]/.test(plrArg)) {
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
        const userCheck = plrArg !== null ? await fetchIdFromUsername(noblox, interaction, plrArg, misc.client) : misc.localData.roblox_id; // RBLX ID of user to update

        if (!userCheck) {
            return;
        }

        if (!plrArg) {
            plrArg = await fetchUsernameFromId(noblox, interaction, misc.localData.roblox_id);

            if (!plrArg) return;
        }

        const playerData = await doSql(misc.db, "SELECT score FROM users WHERE roblox_id = ?", [userCheck]);

        if (playerData.length <= 0) {
            const embed = {
                color: 0x00ff00,
                title: "Player Points",
                description: `**${plrArg}** has **0** points`,
                footer: {
                    text: "points | TVA Bot"
                }
            };
    
            reply(interaction, { embeds: [embed] });

            return;
        }

        const embed = {
            color: 0x00ff00,
            title: "Player Points",
            description: `**${plrArg}** has **${playerData[0].score}** points`,
            footer: {
                text: "points | TVA Bot"
            }
        };

        reply(interaction, { embeds: [embed] });
    }
};
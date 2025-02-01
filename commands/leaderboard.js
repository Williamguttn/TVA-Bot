const { SlashCommandBuilder } = require("discord.js");
const { fetchUsernameFromId } = require("../misc/noblox.js");
const { errorEmbed } = require("../misc/error.js");
const { reply } = require("../misc/reply.js");
const { doSql } = require("../database/doSql.js");

module.exports = {
    verificationNeeded: true,
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Check players with most points"),
    async execute(noblox, bot, interaction, misc) {
        const topPlayers = await doSql(misc.db, "SELECT roblox_id, score FROM users ORDER BY score DESC LIMIT 10");

        if (topPlayers.length <= 0) {
            errorEmbed(misc.client, interaction, "No players found in the leaderboard", "No players have any points yet", "nopoint");

            return;
        }

        // List players and their points in embed
        let desc = "";

        for (const player of topPlayers) {
            desc += `**${await fetchUsernameFromId(noblox, interaction, player.roblox_id)}** - ${player.score} points\n`;
        }

        const embed = {
            color: 0x00ff00,
            title: "Leaderboard",
            description: desc,
            footer: {
                text: "leaderboard | TVA Bot"
            }
        };

        reply(interaction, { embeds: [embed] });
    }
}
const { SlashCommandBuilder } = require("discord.js");
const { doSql } = require("../database/doSql.js");
const { errorEmbed } = require("../misc/error.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unverify")
        .setDescription("Disconnect Discord user from Roblox user"),
    async execute(noblox, bot, interaction, misc) {
        const localData = await doSql(misc.db, "SELECT * FROM users WHERE discord_id = ?", [interaction.user.id]);

        if (!localData || !localData[0] || typeof localData[0] !== "object") {
            errorEmbed(misc.client, interaction, "Unable to unverify", "To remove your verification, you must first be verified!", "unverifydilemma");

            return;
        }

        if (localData[0].verified === 0) {
            errorEmbed(misc.client, interaction, "Unable to unverify", "To remove your verification, you must first be verified!", "unverifydilemma");

            return;
        }

        await doSql(misc.db, "UPDATE users SET verified = 0, discord_id = NULL WHERE discord_id = ?", [interaction.user.id]).then(() => {
            const embed = {
                color: 0x11ed23,
                title: "Success!",
                description: `
                    You are now unverified again.
                `,
                footer: {
                    text: "unverifysuccess"
                }
            };

            interaction.reply({ embeds: [embed] });
        });
    }
}
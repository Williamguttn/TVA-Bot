const { SlashCommandBuilder } = require("discord.js");
const { doSql } = require("../database/doSql.js");
const { errorEmbed } = require("../misc/error.js");
const { reply } = require("../misc/reply.js"); 

module.exports = {
    verificationNeeded: true,
    statusReq: 3, // HICOM
    data: new SlashCommandBuilder()
        .setName("removemedal")
        .setDescription("Remove existing medal")
        .addStringOption(option => option.setName("medalid").setDescription("ID of the medal").setRequired(true)),
    async execute(noblox, bot, interaction, misc) {
        let medalId = interaction.options.getString("medalid") ?? "err";

        if (!(/^-?\d+$/.test(medalId))) {
            errorEmbed(misc.client, interaction, "Type Error", "Medal ID must contain numbers only", "medaltype");

            return;
        }

        const medalExists = await doSql(misc.db, "SELECT * FROM medals WHERE display_order = ?", [medalId]);

        if (medalExists.length <= 0) {
            errorEmbed(misc.client, interaction, "Medal Does Not Exist", "This medal does not exist!", "medalmissing");

            return;
        }

        const medal = medalExists[0];

        try {
            // Delete the medal
            await doSql(misc.db, "DELETE FROM medals WHERE display_order = ?", [medalId]);

            // Decrement display_order for medals with higher order
            await doSql(misc.db, "UPDATE medals SET display_order = display_order - 1 WHERE display_order > ?", [medal.display_order]);
        } catch(e) {
            errorEmbed(misc.client, interaction, "Error Removing Medal", "I was unable to remove this medal", "medalremoveerror");
            console.error(e);

            return;
        }

        const embed = {
            color: 0x11ed23,
            title: "Success!",
            description: `Medal **${medal.name}** has been removed!`,
            footer: {
                text: "removemedal"
            }
        };

        reply(interaction, { embeds: [embed] });
    }
};
const { SlashCommandBuilder } = require("discord.js");
const { doSql } = require("../database/doSql.js");
const { errorEmbed } = require("../misc/error.js");
const { reply } = require("../misc/reply.js"); 

module.exports = {
    verificationNeeded: true,
    statusReq: 3, // HICOM
    data: new SlashCommandBuilder()
        .setName("createmedal")
        .setDescription("Create a new medal")
        .addStringOption(option => option.setName("medalname").setDescription("Name of the medal").setRequired(true))
        .addStringOption(option => option.setName("description").setDescription("Description of the medal").setRequired(true)),
    async execute(noblox, bot, interaction, misc) {
        let medalName = interaction.options.getString("medalname") ?? "err";
        let medalDescription = interaction.options.getString("description") ?? "err";

        medalName = medalName.trim();

        // Make sure medal does not exist
        const medalExists = await doSql(misc.db, "SELECT * FROM medals WHERE name = ?", [medalName]);

        if (medalExists.length > 0) {
            errorEmbed(misc.client, interaction, "Medal Already Exists", "A medal with that name already exists", "medalexists");

            return;
        }

        try {
            await doSql(misc.db, `
               INSERT INTO medals (name, description, display_order)
               VALUES (?, ?, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM medals)) 
            `, [medalName, medalDescription]);
        } catch(err) {
            errorEmbed(misc.client, interaction, "Error Creating Medal", "An error occurred while creating the medal", "medalcreateerror");

            return;
        }

        const embed = {
            color: 0x11ed23,
            title: "Success!",
            description: `Medal **${medalName}** has been created!`,
            footer: {
                text: "createmedal"
            }
        };

        reply(interaction, { embeds: [embed] });
    }
};
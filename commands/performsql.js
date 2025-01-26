const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { fetchGroupRoles } = require("../misc/noblox.js");
const { errorEmbed } = require("../misc/error.js");

module.exports = {
    verificationNeeded: true,
    statusReq: 4, // Admin
    data: new SlashCommandBuilder()
        .setName("runsql")
        .setDescription("Dev command")
        .addStringOption(option => option.setName("printresult").setDescription("true/false").setRequired(true))
        .addStringOption(option => option.setName("sql").setDescription("SQL").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(noblox, bot, interaction, misc) {
        let sql = interaction.options.getString("sql") ?? "err";

        misc.db.all(sql, [], (err, rows) => {

            if (interaction.options.getString("printresult") == "true") {
                if (err) {
                    console.error("Query error:", err.message);
                    return;
                }
                
                interaction.reply(JSON.stringify(rows));
            } else {
                interaction.reply("Success");
            }
        });
    }
};
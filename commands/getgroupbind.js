const { SlashCommandBuilder } = require("discord.js");
const { doSql } = require("../database/doSql.js");
const { errorEmbed } = require("../misc/error.js");

module.exports = {
    verificationNeeded: true,
    statusReq: 4, // Admin
    data: new SlashCommandBuilder()
        .setName("getgroupbind")
        .setDescription("Get group binds for this server")
        .addStringOption(option => option.setName("robloxgroup").setDescription("ID of group to get binds from").setRequired(true)),
    async execute(noblox, bot, interaction, misc) {
        const groupId = interaction.options.getString("robloxgroup") ?? "err";

        if (!(/^\d+$/.test(groupId))) {
            errorEmbed(misc.client, interaction, "Type Error", "Group ID must contain numbers only", "GrIDType");

            return;
        }

        const groupBinds = await doSql(misc.db, "SELECT * FROM group_binds WHERE group_id = ?", [groupId]);

        if (groupBinds.length <= 0) {
            errorEmbed(misc.client, interaction, "No binds found", "No binds were found for this group", "nobinds");

            return;
        }

        let json = {};

        for (const bind of groupBinds) {
            json[bind.rank] = bind.points_needed;
        }

        // Order by rank
        json = Object.fromEntries(Object.entries(json).sort((a, b) => a[0] - b[0]));

        interaction.reply({ content: "```json\n" + JSON.stringify(json, null, 4) + "```" });
    }
};
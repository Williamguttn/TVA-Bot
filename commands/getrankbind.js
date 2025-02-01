const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { errorEmbed } = require("../misc/error.js");
const { doSql } = require("../database/doSql.js");
const { reply } = require("../misc/reply.js");

module.exports = {
    verificationNeeded: true,
    statusReq: 4, // Admin
    data: new SlashCommandBuilder()
        .setName("getrankbind")
        .setDescription("Get rank binds for this server")
        .addStringOption(option => option.setName("robloxgroup").setDescription("ID of group to get binds from").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(noblox, bot, interaction, misc) {
        const groupId = interaction.options.getString("robloxgroup") ?? "err";

        if (!(/^\d+$/.test(groupId))) {
            errorEmbed(misc.client, interaction, "Type Error", "Group ID must contain numbers only", "GrIDType");

            return;
        }

        const guildId = interaction.guildId;
        const binds = await doSql(misc.db, "SELECT * FROM rank_binds WHERE group_id = ? AND server_id = ?", [groupId, guildId]);

        if (binds.length <= 0) {
            errorEmbed(misc.client, interaction, "No binds found", "No binds were found for this group", "nobinds");

            return;
        }
        //{"1-255": "1331664453053448235", "254": "1331664483000782953", "255": "1331664527380447405"}
        let json = {};

        for (const bind of binds) {
            const from = bind.rank_start;
            const to = bind.rank_end;
            const roleId = bind.role_id;
        
            const key = to ? `${from}-${to}` : `${from}`;
        
            if (json[key]) {
                if (!Array.isArray(json[key])) {
                    json[key] = [json[key]];
                }

                json[key].push(roleId);
            } else {
                json[key] = roleId;
            }
        }

        reply(interaction, { content: "```json\n" + JSON.stringify(json, null, 4) + "```" });
    }
};
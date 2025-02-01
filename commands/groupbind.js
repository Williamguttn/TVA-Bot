const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { doSql } = require("../database/doSql.js");
const { reply } = require("../misc/reply.js");

module.exports = {
    verificationNeeded: true,
    statusReq: 4, // Admin
    data: new SlashCommandBuilder()
        .setName("groupbind")
        .setDescription("Set up group binds for Roblox group")
        .addStringOption(option => option.setName("robloxgroup").setDescription("ID of group you are binding").setRequired(true))
        .addStringOption(option => option.setName("json").setDescription(`{"rankId": pointsNeeded}`).setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute (noblox, bot, interaction, misc) {
        let groupId = interaction.options.getString("robloxgroup") ?? "err";

        if (!(/^\d+$/.test(groupId))) {
            errorEmbed(misc.client, interaction, "Type Error", "Group ID must contain numbers only", "GrIDType");

            return;
        }

        const JSONInput = interaction.options.getString("json") ?? "err";
        let bindJSON;

        try {
            bindJSON = JSON.parse(JSONInput);
        } catch(err) {
            errorEmbed(misc.client, interaction, "JSON Parsing Failed", "Failed to parse the JSON string. Check for errors", "errorjsonparse");

            return;
        }

        for (let [key, value] of Object.entries(bindJSON)) {
            if (typeof value === "object") {
                errorEmbed(misc.client, interaction, "Type Error", "Value must be a number", "ValType");

                return;
            }

            value = +value;

            await doSql(misc.db, "INSERT INTO group_binds (group_id, rank, points_needed) VALUES (?, ?, ?)", [groupId, key, value]);
        }

        reply(interaction, { content: "Group binds have been set!" });
    }
};
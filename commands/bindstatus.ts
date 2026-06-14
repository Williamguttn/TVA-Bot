const { SlashCommandBuilder } = require("discord.js");
const { doSql } = require("../database/doSql");
const { errorEmbed } = require("../misc/error");
const { reply } = require("../misc/reply");

module.exports = {
    verificationNeeded: true,
    statusReq: 4, // Admin
    data: new SlashCommandBuilder()
        .setName("statusbind")
        .setDescription("Bind groups and respective statuses")
        .addStringOption(option => option.setName("group").setDescription("Group ID").setRequired(true))
        .addStringOption(option => option.setName("json").setDescription(`{"rankId": status}`).setRequired(true)),
    async execute(noblox, bot, interaction, misc) {
        let groupId = interaction.options.getString("group") ?? "err";
        let json = interaction.options.getString("json") ?? "err";

        if (!(/^\d+$/.test(groupId))) {
            errorEmbed(misc.client, interaction, "Type Error", "Group ID must contain numbers only", "GrIDType");

            return;
        }

        groupId = +groupId;

        try {
            json = JSON.parse(json);
        } catch(err) {
            errorEmbed(misc.client, interaction, "JSON Parsing Failed", "Failed to parse the JSON string. Check for errors", "errorjsonparse");

            return;
        }


        const normalizedBinds = [];

        for (const [key, value] of Object.entries(json)) {
            const roleId = key;
            const status = value;

            if (typeof roleId !== "string" || typeof status !== "number" || !Number.isFinite(+roleId)) {
                errorEmbed(misc.client, interaction, "Type Error", "Type error occured in JSON keys or values", "errorjsonparse");

                return;
            }

            normalizedBinds.push([groupId, roleId, +status]);
        }

        await doSql(misc.db, "DELETE FROM status_binds WHERE group_id = ?", [groupId]);

        for (const [normalizedGroupId, roleId, status] of normalizedBinds) {
           await doSql(misc.db, "INSERT INTO status_binds (group_id, rank, status) VALUES (?, ?, ?)", [normalizedGroupId, roleId, status]);
        }

        reply(interaction, { content: "Status binds have been set!" });
    }
};

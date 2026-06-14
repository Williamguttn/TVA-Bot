const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { fetchGroupRoles } = require("../misc/noblox");
const { errorEmbed } = require("../misc/error");
const { reply } = require("../misc/reply");
const { doSql } = require("../database/doSql");

module.exports = {
    verificationNeeded: true,
    statusReq: 4, // Admin
    data: new SlashCommandBuilder()
        .setName("rankbind")
        .setDescription("Set up ranks for this server")
        .addStringOption(option => option.setName("robloxgroup").setDescription("ID of group you are binding").setRequired(true))
        .addStringOption(option => option.setName("json").setDescription("{\"rank1-rank2\": \"roleId\"").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(noblox, bot, interaction, misc) {
        //interaction.deferReply();
        let groupId = interaction.options.getString("robloxgroup") ?? "err";

        if (!(/^\d+$/.test(groupId))) {
            errorEmbed(misc.client, interaction, "Type Error", "Group ID must contain numbers only", "GrIDType");

            return;
        }

        groupId = +groupId;

        const JSONInput = interaction.options.getString("json") ?? "err";
        let rankJSON;

        try {
            rankJSON = JSON.parse(JSONInput);
        } catch(err) {
            errorEmbed(misc.client, interaction, "JSON Parsing Failed", "Failed to parse the JSON string. Check for errors", "errorjsonparse");

            return;
        }

        const guildId = interaction.commandGuildId;
        await fetchGroupRoles(noblox, interaction, groupId);
        const normalizedBinds = [];

        for (const [key, value] of Object.entries(rankJSON)) {
            const splitKey = key.split("-");
            const from = +splitKey[0];
            const to = splitKey[1] ? +splitKey[1] : null;
            const roleIds = Array.isArray(value) ? value : [value];

            if (!Number.isFinite(from) || (to !== null && !Number.isFinite(to)) || roleIds.length <= 0) {
                errorEmbed(misc.client, interaction, "Type Error", "Each bind must use valid ranks and at least one role ID", "errorjsonparse");

                return;
            }

            for (const roleId of roleIds) {
                const normalizedRoleId = `${roleId}`.trim();

                if (!/^\d+$/.test(normalizedRoleId)) {
                    errorEmbed(misc.client, interaction, "Type Error", "Role IDs must contain numbers only", "errorjsonparse");

                    return;
                }

                normalizedBinds.push([String(groupId), String(guildId), from, to, normalizedRoleId]);
            }
        }

        await doSql(misc.db, "DELETE FROM rank_binds WHERE group_id = ? AND server_id = ?", [String(groupId), String(guildId)]);

        for (const [normalizedGroupId, normalizedGuildId, from, to, roleId] of normalizedBinds) {
            await doSql(
                misc.db,
                "INSERT INTO rank_binds (group_id, server_id, rank_start, rank_end, role_id) VALUES (?, ?, ?, ?, ?)",
                [normalizedGroupId, normalizedGuildId, from, to, roleId]
            );
        }

        const embed = {
            color: 0x11ed23,
            title: "Success",
            description: `
            Saved \`\`${JSONInput}\`\` for group \`\`${groupId}\`\` in server \`\`${guildId}\`\`
            `,
            fotter: {
                text: "groupbindsuccess"
            }
        };

        try {
            reply(interaction, { embeds: [embed] });
        } catch(e) {console.error(e)}

        require("../database/debug/printRoleBinds")(misc.db);
        // TODO: fix error.js, make it say something even if no interaction reply yet
        require("../database/debug/printRoleBinds")(misc.db);
        //console.log(roles);
    }
};

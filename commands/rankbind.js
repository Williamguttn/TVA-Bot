const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { fetchGroupRoles } = require("../misc/noblox.js");
const { errorEmbed } = require("../misc/error.js");
const { reply } = require("../misc/reply.js");

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
        const roles = await fetchGroupRoles(noblox, interaction, groupId);

        const insert = misc.db.prepare("INSERT INTO rank_binds (group_id, server_id, rank_start, rank_end, role_id) VALUES (?, ?, ?, ?, ?)");

        for (const [key, value] of Object.entries(rankJSON)) {

            const splitKey = key.split("-");
            const from = +splitKey[0];
            const to = +splitKey[1] ?? null;

            const roleId = value;
            /*if (typeof roleId !== "number" || typeof status !== "number" || typeof from !== "number" || typeof to !== "number") {
                errorEmbed(misc, client, interaction, "Type Error", "Type error occured in JSON keys or values", "errorjsonparse");
                
                return;
            }*/
            if (typeof groupId == "number") groupId.toString();
            if (typeof guildId == "number") guildId.toString();
            if (typeof roleId == "number") roleId.toString();

            if (typeof roleId !== "object") {
                insert.run(groupId, guildId, from, to, roleId, function(err) {
                    if (err) {
                        errorEmbed(misc, misc.client, interaction, "SQL Error", "Failed to write to database", "errorDBwrite");
                        console.error(err);
    
                        return;
                    }
                });
            } else {
                // Roleid is an object, so we need to loop over it
                if (roleId.length > 0) {
                    for (let i = 0; i < roleId.length; i++) {
                        insert.run(groupId, guildId, from, to, roleId[i], function(err) {
                            if (err) {
                                errorEmbed(misc, misc.client, interaction, "SQL Error", "Failed to write to database", "errorDBwrite");
                                console.error(err);

                                return;
                            }
                        });
                    }
                }
            }
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

        require("../database/debug/printRoleBinds.js")(misc.db);
        // TODO: fix error.js, make it say something even if no interaction reply yet
        require("../database/debug/printRoleBinds.js")(misc.db);
        //console.log(roles);
    }
};
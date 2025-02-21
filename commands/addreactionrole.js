const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { errorEmbed } = require("../misc/error.js");
const { doSql } = require("../database/doSql.js");
const { reply } = require("../misc/reply.js");

module.exports = {
    verificationNeeded: true,
    statusReq: 4, // Admin
    data: new SlashCommandBuilder()
        .setName("reactionrole")
        .setDescription("Create a reaction role")
        .addStringOption(option => option.setName("channelid").setDescription("ID of the channel to create the reaction role in").setRequired(true))
        .addStringOption(option => option.setName("roleid").setDescription("ID of role to add when reacted to the message").setRequired(true))
        .addStringOption(option => option.setName("title").setDescription("Title of the reaction role").setRequired(true))
        .addStringOption(option => option.setName("description").setDescription("Description of the reaction role").setRequired(true))
        .addStringOption(option => option.setName("emoji").setDescription("Emoji to use for the reaction role").setRequired(true)),
    async execute(noblox, bot, interaction, misc) {
        const description = interaction.options.getString("description");
        const title = interaction.options.getString("title");
        const channelid = interaction.options.getString("channelid");
        const roleid = interaction.options.getString("roleid");
        const emoji = interaction.options.getString("emoji");

        const channel = await misc.client.channels.fetch(channelid);
        const role = await interaction.guild.roles.cache.get(roleid);
        
        if (!channel) {
            errorEmbed(misc.client, interaction, "Channel not found", "The channel was not found", "channelnotfound");
            return;
        }
        if (!role) {
            errorEmbed(misc.client, interaction, "Role not found", "The role was not found", "rolenotfound");
            return;
        }

        const embed = {
            title: title,
            description: description,
            color: 0xb3afaf,
            footer: {
                text: "reactionrole | TVA Bot"
            }
        };

        const message = await channel.send({ embeds: [embed] });
        await message.react(emoji);

        // Store it
        await doSql(misc.db, "INSERT INTO reaction_roles (message_id, role_id, emoji) VALUES (?, ?, ?)", [message.id, roleid, emoji]);
        await interaction.reply({ content: "Reaction role created" });
    }
};
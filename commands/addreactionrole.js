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
        .addStringOption(option => option.setName("description").setDescription("Description of the reaction role").setRequired(true)),
    async execute(noblox, bot, interaction, misc) {
        const channelid = interaction.options.getString("channelid");
        const description = interaction.options.getString("description");
        const channel = await bot.channels.fetch(channelid);
   
        
    }
};
const { SlashCommandBuilder } = require('discord.js');
const { fetchIdFromUsername } = require("../misc/noblox.js");
const { errorEmbed } = require("../misc/error.js");
const { doSql } = require("../database/doSql.js");
const { reply } = require("../misc/reply.js");

module.exports = {
    verificationNeeded: true,
    statusReq: 2, // Officer
    data: new SlashCommandBuilder()
        .setName('addpoints')
        .setDescription('Add points to a user')
        .addStringOption(option => option.setName('username').setDescription('User to add points to').setRequired(true))
        .addIntegerOption(option => option.setName('points').setDescription('Amount of points to add').setRequired(true)),
    async execute(noblox, bot, interaction, misc) {
        const username = interaction.options.getString('username') ?? "e r";
        let points = interaction.options.getInteger('points') ?? 0;

        if (/[^a-zA-Z0-9_]/.test(username)) {
            errorEmbed(misc.client, interaction, "Not a valid username!", "This is not a valid ROBLOX username", "invaliduser");

            return;
        }

        // Make sure points can only be a number
        if (!(/^-?\d+$/.test(points))) {
            errorEmbed(misc.client, interaction, "Type Error", "Points must contain numbers only", "pointstype");

            return;
        }

        points = +points;

        if (points === 0) {
            errorEmbed(misc.client, interaction, "Invalid Points", "You cannot give 0 points to someone", "invalidpoints");

            return;
        }

        let playerId = await fetchIdFromUsername(noblox, interaction, username);

        if (!playerId) return;

        // Check if player exists in the database
        const playerData = await doSql(misc.db, "SELECT * FROM users WHERE roblox_id = ?", [playerId]);

        if (playerData.length <= 0) {
            // They will be remembered forever when they get points
            await doSql(misc.db, "INSERT INTO users (roblox_id, score) VALUES (?, ?)", [playerId, points]);
        } else {
            try {
                await doSql(misc.db, "UPDATE users SET score = score + ? WHERE roblox_id = ?", [points, playerId]);
            } catch(e) {
                errorEmbed(misc.client, interaction, "Error occurred!", "Check the username", "addpoints");
    
                return;
            }
        }

        // Check for promotion
        require("../misc/pointsPromote.js")(noblox, interaction, misc.db, playerId);

        const embed = {
            color: 0x00ff00,
            title: "Points Added",
            description: `Added **${points}** points to **${username}**`,
            footer: {
                text: "addpoints | TVA Bot"
            }
        };

        reply(interaction, { embeds: [embed] });
    }
};
const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { fetchIdFromUsername, fetchPlayerInfo } = require("../misc/noblox.js");
const { errorEmbed } = require("../misc/error.js");
const { getUserDB } = require("../database/getUserFromDB.js");
const { doSql } = require("../database/doSql.js");
//const { BuildEmbed } = require("../misc/embeds.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Verify your ROBLOX account")
        .addStringOption(option => option.setName("username").setDescription("Name of your account").setRequired(true)),
    async execute(noblox, bot, interaction, misc) {
        const username = interaction.options.getString("username") ?? "err";

        if (/[^a-zA-Z0-9_]/.test(username)) {
            let embed = {
                color: 0xfc0313,
                title: "Not a valid username!",
                description: "This is not a valid ROBLOX username",
                thumbnail: {
                    url: bot.avatarURL
                },
                footer: {
                    text: "verify | TVA Bot"
                }
            };

            await interaction.reply({ embeds: [embed] });

            return;
        }

        let playerId = await fetchIdFromUsername(noblox, interaction, username);
        
        if (!playerId) return;

        // Check if player is verified
        const dbData = await getUserDB(misc.db, playerId);

        console.log(dbData, typeof interaction.user.id);

        if (dbData[0] && typeof dbData[0] === "object") {
            if (dbData[0].roblox_id == playerId && dbData[0].verified > 0) {
                errorEmbed(misc.client, interaction, "Again?", `User already verified on <@${dbData[0].discord_id}>!`, "alreadyverify");
    
                return;
            }
        }

        const localData = await doSql(misc.db, "SELECT * FROM users WHERE discord_id = ?", [interaction.user.id]);

        if (localData[0] && typeof localData[0] === "object") {
            if (localData[0].verified && localData[0].verified > 0) {
                errorEmbed(misc.client, interaction, "Again?", `You are already verified on this account. Run \`\`/unverify\`\` to unverify!`, "alreadyverifyacc");
    
                return;
            }
        }

        let strings = ["apple", "banana", "red", "dolphin", "elephant", "flower", "garden", "happy", "island", "jungle", "kite", "lemon", "mango", "nest", "orange"];
        let verificationString = "";

        for (let i = 0; i <= 10; i++) {
            switch(i) {
                case 4:
                    verificationString += "VIETNAM ";
                    continue;
                case 8:
                    verificationString += "VERIFICATION ";
                    continue;
                default:
                    verificationString += strings[Math.floor(Math.random() * strings.length)] + " ";
            }
        }

        verificationString = verificationString.trim();

        let embed = {
            color: 0xbfbcb2,
            title: "Verify",
            description: `
                Go to [your profile](https://roblox.com/users/${playerId}/profile), and add the following string to your **About** section:\n\n**${verificationString}**
            `,
            footer: {
                text: "verify | TVA Bot"
            }
        };

        const done = new ButtonBuilder()
            .setCustomId("done")
            .setLabel("Done")
            .setStyle(ButtonStyle.Success);

        const cancel = new ButtonBuilder()
            .setCustomId("cancel")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(cancel, done);

        const response = await interaction.reply({ embeds: [embed], components: [row], withResponse: true });
        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

            if (confirmation.customId === "done") {
                await confirmation.update({ content: "Looking...", components: [] });
            }

            if (confirmation.customId === 'cancel') {
                await confirmation.update({ content: 'Verification cancelled', components: [] });

                return;
            }
        } catch {
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });

            return;
        }


        const playerInfo = await fetchPlayerInfo(noblox, interaction, playerId);

        if (playerInfo !== undefined && playerInfo !== null) {
            if (!playerInfo.blurb || typeof playerInfo.blurb !== "string") {
                errorEmbed(misc.client, interaction, "Unable to find blurb!", "An issue occured when fetching your **About Me**. Try again.", "blurbmissing");

                return;
            }
    
            if (!playerInfo.blurb.includes(verificationString)) {
                errorEmbed(misc.client, interaction, "Where?", "I was unable to find the string in your **About Me**. Please run ``verify`` again", "verificationmissed");

                return;
            }
        }

        //console.log(verificationString);

        const successEmbed = {
            color: 0x11ed23,
            title: "Success!",
            description: `
                You are now verified! Run \`\`update\`\` to update your roles
            `,
            footer: {
                text: "verifysuccess"
            }
        };

        await interaction.editReply({ embeds: [successEmbed] });

        require("../database/registerUser.js").register(misc.db, playerId, interaction.user.id);
    }
};
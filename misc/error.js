const { reply } = require("./reply.js");

async function errorEmbed(client, interaction, title, reason, footer) {
    let embed ={
        color: 0xfc0313,
        title: title,
        description: reason,
        footer: {
            text: footer
        }
    };

    /*try {
        await interaction.deferReply();
    } catch(e) {
        console.error(e);
    }*/
    
    try {
        reply(interaction, { embeds: [embed] });
        /*if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [embed] });
        } else {
            try {await interaction.reply({ embeds: [embed] });} catch(e) {
                console.error(e);
            }
        }*/
    } catch (err) {
        console.error("Error sending the interaction response:", err);
    }
}

module.exports = { errorEmbed };
const { EmbedBuilder } = require("discord.js");

function BuildEmbed(args) {
    let embed = new EmbedBuilder();

    for (const [key, value] of Object.entries(args)) {
        
        let property = embed[`set${key.charAt(0).toUpperCase() + key.slice(1)}`];
        
        if (property == null || property == undefined) {
            continue;
        }

        property(value);
    }

    return embed;
}

module.exports = { BuildEmbed };
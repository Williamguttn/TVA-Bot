require("dotenv").config();

const TOKEN = process.env.TOKEN;
const { GatewayIntentBits, Client, Events, Routes, REST, Collection, MessageFlags, Partials } = require("discord.js");
const fs = require("fs");

//const GUILD_ID = "1175959487035744348";
const GUILD_ID = "882602677152927744";
const BOT_ID = "1333146044707377153";

//const client =  new Discord.Client({ intents: [7796] });

const client = new Client({
    intents: Object.values(GatewayIntentBits),
    partials: [Partials.Message, Partials.Reaction, Partials.User],
});

const db = require("./database/verifydb.js")();
const { doSql } = require("./database/doSql.js");
const { errorEmbed } = require("./misc/error.js");

const noblox = require("noblox.js");

noblox.setCookie(process.env.BOT_COOKIE).then(function() {
    console.log("Roblox bot logged in");
}).catch(function(err) {
    console.error("Unable to log in:", err);
});

// Start the api

client.commands = new Collection();

client.login(TOKEN);

require("./api/api.js")(db, client);

const botWIP = false; // Disables the bot 
const wipList = [ // Discord ID of people allowed to use bot while in WIP mode
    "724590883915431957", "683750424007802916", "1030159828548599948"
];

// Each file in commands will export data for that command
const commandsPath = __dirname + "/commands";
const commandsFolder = fs.readdirSync(commandsPath);

let commands = [];

for (const file of commandsFolder) {
    if (!file.endsWith(".js")) {
        continue;
    }

    const module = require(`${commandsPath}/${file}`);

    if ("data" in module && "execute" in module) {
        commands.push(module.data.toJSON());
        client.commands.set(module.data.name, module);
    }
}

const rest = new REST().setToken(TOKEN);

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.log(`Command ${interaction.commandName} not found`);

        return;
    }

    try {
        if (botWIP && !wipList.includes(interaction.user.id)) {
            errorEmbed(client, interaction, "Bot is WIP", "The bot is currently in WIP mode. Please try again later.", "wip");

            return;
        }

        let localData = null;
        
        if (command.verificationNeeded) {
            localData = await doSql(db, "SELECT * FROM users WHERE discord_id = ?", [interaction.user.id]);

            if (typeof localData[0] !== "object" || localData[0].verified <= 0 || !localData[0].roblox_id) {
                errorEmbed(client, interaction, "Not verified", "You are not verified. Run \`\`/verify\`\` to verify your account.", "notverified");
    
                return;
            }

            // If the rank needs a status check then you must also be verified
            if (command.statusReq && localData[0].status < command.statusReq) {
                console.log(command.statusReq, localData[0].status)
                errorEmbed(client, interaction, "Status too low", "You do not have the required permissions to run this command", "statuslow");
    
                return;
            }
        }

        await command.execute(noblox, client.user, interaction, {
            client,
            db,
            localData: localData !== null ? localData[0] : null
        });
    } catch(error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
    }
});

client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    if (reaction.message.partial) {
        try {
            await reaction.message.fetch();
        } catch (error) {
            console.error('Error fetching message:', error);
            return;
        }
    }

    const storedReaction = await doSql(db, "SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?", [reaction.message.id, reaction.emoji.name]);
    if (!storedReaction[0]) return;

    const roleId = storedReaction[0].role_id;
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    const role = guild.roles.cache.get(roleId);
    
    if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch((e) => console.error(e));
        await member.send("Role successfully added!");
    }
});

client.on("messageReactionRemove", async (reaction, user) => {

    if (user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    if (reaction.message.partial) {
        try {
            await reaction.message.fetch();
        } catch (error) {
            console.error('Error fetching message:', error);
            return;
        }
    }

    const storedReaction = await doSql(db, "SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?", [reaction.message.id, reaction.emoji.name]);
    if (!storedReaction[0]) return;

    const roleId = storedReaction[0].role_id;
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    const role = guild.roles.cache.get(roleId);
    if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role).catch((e) => console.error(e));
        await member.send("Role successfully removed!");
    }
});

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(BOT_ID),
            { body: commands }
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch(error) {
        console.error(error);
    }
})();
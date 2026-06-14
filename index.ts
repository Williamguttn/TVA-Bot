require("dotenv").config();

const fs = require("fs");
const {
    GatewayIntentBits,
    Client,
    Events,
    Routes,
    REST,
    Collection,
    MessageFlags,
    Partials
} = require("discord.js");

const { createRobloxClient } = require("./misc/roblox");
const createDatabase = require("./database/verifydb");
const { doSql } = require("./database/doSql");
const { errorEmbed } = require("./misc/error");

const TOKEN = process.env.TOKEN;
const BOT_ID = "1333146044707377153";

const client = new Client({
    intents: Object.values(GatewayIntentBits),
    partials: [Partials.Message, Partials.Reaction, Partials.User]
});

client.commands = new Collection();

const db = createDatabase();
const roblox = createRobloxClient();

roblox.verifyLogin()
    .then((user: any) => {
        console.log(`Roblox bot logged in as ${user.name} (${user.id})`);
    })
    .catch((err: Error) => {
        console.error("Unable to validate Roblox cookie:", err.message);
    });

client.login(TOKEN);

require("./api/api")(db, client);

const botWIP = true;
const wipList = [
    "724590883915431957",
    "683750424007802916",
    "1030159828548599948"
];

const commandsPath = `${__dirname}/commands`;
const commandsFolder = fs.readdirSync(commandsPath);
const commands = [];

for (const file of commandsFolder) {
    if (!file.endsWith(".js")) {
        continue;
    }

    const commandModule = require(`${commandsPath}/${file}`);

    if ("data" in commandModule && "execute" in commandModule) {
        commands.push(commandModule.data.toJSON());
        client.commands.set(commandModule.data.name, commandModule);
    }
}

const rest = new REST().setToken(TOKEN);

client.on(Events.InteractionCreate, async (interaction: any) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = client.commands.get(interaction.commandName);

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
                errorEmbed(client, interaction, "Not verified", "You are not verified. Run ``/verify`` to verify your account.", "notverified");
                return;
            }

            if (command.statusReq && localData[0].status < command.statusReq) {
                errorEmbed(client, interaction, "Status too low", "You do not have the required permissions to run this command", "statuslow");
                return;
            }
        }

        await command.execute(roblox, client.user, interaction, {
            client,
            db,
            localData: localData !== null ? localData[0] : null
        });
    } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "There was an error while executing this command!",
                flags: MessageFlags.Ephemeral
            });
        } else {
            await interaction.reply({
                content: "There was an error while executing this command!",
                flags: MessageFlags.Ephemeral
            });
        }
    }
});

client.on("messageReactionAdd", async (reaction: any, user: any) => {
    if (user.bot) {
        return;
    }

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error("Error fetching reaction:", error);
            return;
        }
    }

    if (reaction.message.partial) {
        try {
            await reaction.message.fetch();
        } catch (error) {
            console.error("Error fetching message:", error);
            return;
        }
    }

    const storedReaction = await doSql(db, "SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?", [
        reaction.message.id,
        reaction.emoji.name
    ]);

    if (!storedReaction[0]) {
        return;
    }

    const roleId = storedReaction[0].role_id;
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);

    if (!member) {
        return;
    }

    const role = guild.roles.cache.get(roleId);

    if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch((err: Error) => console.error(err));
        await member.send("Role successfully added!").catch((err: Error) => console.error(err));
    }
});

client.on("messageReactionRemove", async (reaction: any, user: any) => {
    if (user.bot) {
        return;
    }

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error("Error fetching reaction:", error);
            return;
        }
    }

    if (reaction.message.partial) {
        try {
            await reaction.message.fetch();
        } catch (error) {
            console.error("Error fetching message:", error);
            return;
        }
    }

    const storedReaction = await doSql(db, "SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?", [
        reaction.message.id,
        reaction.emoji.name
    ]);

    if (!storedReaction[0]) {
        return;
    }

    const roleId = storedReaction[0].role_id;
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);

    if (!member) {
        return;
    }

    const role = guild.roles.cache.get(roleId);

    if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role).catch((err: Error) => console.error(err));
        await member.send("Role successfully removed!").catch((err: Error) => console.error(err));
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
    } catch (error) {
        console.error(error);
    }
})();

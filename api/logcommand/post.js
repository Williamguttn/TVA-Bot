module.exports = async function(req, res, db, client) {
    const body = req.body;

    if (!body.userName || !body.command) {
        return res.status(400).json({ error: "Missing body elements" });
    }

    const logChannel = process.env.COMMAND_LOG_CHANNEL;

    if (!logChannel) {
        return res.status(500).json({ error: "Missing channel" });
    }

    const channel = client.channels.cache.get(logChannel);

    if (!channel) {
        return res.status(500).json({ error: "Missing channel" });
    }

    const embed = {
        title: "Command Log",
        description: `**User:** ${body.userName}\n**Command:** \`\`\`${body.command}\`\`\``,
        color: 0x00ff00
    };

    channel.send({ embeds: [embed]});

    res.status(200).json({ message: "Success" });
}
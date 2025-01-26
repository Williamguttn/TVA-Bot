async function reply(interaction, response) {
    try {
        // Check if interaction is valid
        if (!interaction) throw new Error("Invalid interaction provided.");

        // Attempt to reply normally
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply(response);
        } else if (interaction.deferred) {
            // If already deferred, use followUp
            await interaction.followUp(response);
        } else if (interaction.replied) {
            // If already replied, send followUp as well
            await interaction.followUp(response);
        }
    } catch (error) {
        console.error("Error handling interaction reply:", error);

        // Try to handle specific error cases
        if (error.message.includes("InteractionAlreadyReplied")) {
            try {
                await interaction.followUp(response);
            } catch (followUpError) {
                console.error("Failed to follow up:", followUpError);
                fallbackSend(interaction, response);
            }
        } else {
            // If it isn't an "already replied" error, use fallback method
            fallbackSend(interaction, response);
        }
    }
}

// Fallback method for cases where interaction cannot be replied to directly
async function fallbackSend(interaction, response) {
    try {
        // If the interaction has a channel, send a direct message
        if (interaction.channel) {
            await interaction.channel.send(response);
        } else if (interaction.user) {
            // If channel fails, try sending a DM to the user
            await interaction.user.send(response);
        } else {
            console.error("No valid method to send fallback response.");
        }
    } catch (fallbackError) {
        console.error("Failed to send fallback response:", fallbackError);
    }
}

module.exports = { reply };
const { errorEmbed } = require("./error.js");

async function fetchIdFromUsername(noblox, interaction, username, client) {
    let id;

    try {
        id = await noblox.getIdFromUsername(username).catch(function() {
            errorEmbed(null, interaction, "Error occurred!", "Is the username correct?", "idfetch");
        });

        if (!id) {
            errorEmbed(client, interaction, "Error occurred!", "Is the username correct?", "idfetch"); 
        }
    } catch(err) {
        errorEmbed(null, interaction, "Error occurred!", "Is the username correct?", "idfetch");
    }

    return id;
}

async function fetchPlayerInfo(noblox, interaction, id) {
    let playerInfo;

    try {
        playerInfo = await noblox.getPlayerInfo({ userId: id });
    } catch(err) {
        errorEmbed(null, interaction, "Error occurred!", "Unable to fetch player info", "infofetch");
    }

    return playerInfo;
}

async function fetchThumbnail(noblox, interaction, id) {
    let thumbnail;

    try {
        thumbnail = await noblox.getPlayerThumbnail(id, "100x100", "png", false, "Headshot");
    } catch(err) {
        errorEmbed(null, interaction, "Error occurred!", "Unable to fetch parts of player", "thumbnailfetch");
    }

    return thumbnail;
}

async function fetchGroupRoles(noblox, interaction, id) {
    let roles;

    try {
        roles = await noblox.getRoles(id);
    } catch(err) {
        errorEmbed(null, interaction, "Error occurred", "Unable to fetch group roles", "rolefetch");
    }

    return roles;
}

async function fetchPlayerGroups(noblox, interaction, id) {
    let groups;

    try {
        groups = await noblox.getGroups(id);
    } catch(err) {
        errorEmbed(null, interaction, "Error occurred", "Unable to fetch player groups", "groupfetch");
    }

    return groups;
}

async function fetchUserGroupRank(noblox, interaction, groupId, userId) {
    let rank;

    try {
        rank = await noblox.getRankInGroup(groupId, userId);
    } catch(err) {
        // This implies that we KNOW the user is in the group, but we can't fetch the rank
        errorEmbed(null, interaction, "Error occurred", "Unable to fetch user rank", "rankfetch");
    }

    return rank;
}

async function setGroupRank(noblox, interaction, groupId, userId, rank) {
    try {
        console.log(groupId, userId, rank)
        await noblox.setRank(groupId, userId, rank).catch(function(err) {console.error(err)});
    } catch(err) {
        errorEmbed(null, interaction, "Error occurred", "Unable to set user rank", "rankset");
    }
}

async function fetchUsernameFromId(noblox, interaction, id) {
    let username;

    try {
        username = await noblox.getUsernameFromId(id);
    } catch(err) {
        errorEmbed(null, interaction, "Error occurred", "Unable to fetch username", "usernamefetch");
    }

    return username;
}

module.exports = { fetchIdFromUsername, fetchPlayerInfo, fetchThumbnail, fetchGroupRoles, fetchPlayerGroups, fetchUserGroupRank, setGroupRank, fetchUsernameFromId };
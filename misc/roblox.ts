const { configureServer, fetchApi, isAnyErrorResponse } = require("rozod");
const { getUsersAuthenticated, getUsersUserid, postUsernamesUsers } = require("rozod/lib/endpoints/usersv1");
const { getUsersAvatarHeadshot } = require("rozod/lib/endpoints/thumbnailsv1");
const { getGroupsGroupidRoles, getUsersUseridGroupsRoles, patchGroupsGroupidUsersUserid } = require("rozod/lib/endpoints/groupsv1");
const { errorEmbed } = require("./error");

let configured = false;

function normalizeCookie(cookie: string) {
    return cookie.replace(/^\.ROBLOSECURITY=/, "").trim();
}

function ensureConfigured() {
    if (configured) {
        return;
    }

    const cookie = process.env.BOT_COOKIE;

    if (!cookie) {
        throw new Error("BOT_COOKIE is not set");
    }

    configureServer({
        cookies: normalizeCookie(cookie)
    });

    configured = true;
}

async function fetchOrThrow(endpoint: any, params?: any) {
    ensureConfigured();

    const response = await fetchApi(endpoint, params);

    if (isAnyErrorResponse(response)) {
        throw new Error(response.message || "Roblox request failed");
    }

    return response;
}

async function getIdFromUsername(username: string) {
    const response = await fetchOrThrow(postUsernamesUsers, {
        body: {
            usernames: [username],
            excludeBannedUsers: false
        }
    });

    return response.data[0]?.id ?? null;
}

async function getUsernameFromId(id: number) {
    const response = await fetchOrThrow(getUsersUserid, { userId: id });

    return response.name;
}

async function getPlayerInfo({ userId }: { userId: number }) {
    const response = await fetchOrThrow(getUsersUserid, { userId });

    return {
        userId: response.id,
        username: response.name,
        displayName: response.displayName,
        blurb: response.description,
        created: response.created,
        isBanned: response.isBanned,
        hasVerifiedBadge: response.hasVerifiedBadge
    };
}

async function getPlayerThumbnail(
    userId: number,
    size = "100x100",
    format = "png",
    isCircular = false,
    _type = "Headshot"
) {
    const normalizedFormat = format.charAt(0).toUpperCase() + format.slice(1).toLowerCase();
    const response = await fetchOrThrow(getUsersAvatarHeadshot, {
        userIds: [userId],
        size,
        format: normalizedFormat,
        isCircular
    });

    return response.data;
}

async function getRoles(groupId: number) {
    const response = await fetchOrThrow(getGroupsGroupidRoles, { groupId });

    return response.roles;
}

async function getGroups(userId: number) {
    const response = await fetchOrThrow(getUsersUseridGroupsRoles, { userId });

    return response.data.map((membership: any) => ({
        Id: membership.group.id,
        Name: membership.group.name,
        Rank: membership.role.rank,
        Role: membership.role.name,
        RoleId: membership.role.id,
        group: membership.group,
        role: membership.role
    }));
}

async function getRankInGroup(groupId: number, userId: number) {
    const groups = await getGroups(userId);
    const membership = groups.find((group: any) => group.Id === groupId);

    return membership?.Rank ?? 0;
}

async function setRank(groupId: number, userId: number, rank: number) {
    const [roles, currentRank] = await Promise.all([
        getRoles(groupId),
        getRankInGroup(groupId, userId)
    ]);

    if (currentRank === rank) {
        return;
    }

    const role = roles.find((entry: any) => entry.rank === rank);

    if (!role) {
        throw new Error(`Unable to find roleset for rank ${rank} in group ${groupId}`);
    }

    await fetchOrThrow(patchGroupsGroupidUsersUserid, {
        groupId,
        userId,
        body: {
            roleId: role.id
        }
    });
}

async function verifyLogin() {
    const response = await fetchOrThrow(getUsersAuthenticated);

    return response;
}

function createRobloxClient() {
    ensureConfigured();

    return {
        getIdFromUsername,
        getUsernameFromId,
        getPlayerInfo,
        getPlayerThumbnail,
        getRoles,
        getGroups,
        getRankInGroup,
        setRank,
        verifyLogin
    };
}

async function fetchIdFromUsername(roblox: RobloxClient, interaction: any, username: string, client: any) {
    let id;

    try {
        id = await roblox.getIdFromUsername(username);

        if (!id) {
            errorEmbed(client, interaction, "Error occurred!", "Is the username correct?", "idfetch");
        }
    } catch (err) {
        errorEmbed(client, interaction, "Error occurred!", "Is the username correct?", "idfetch");
    }

    return id;
}

async function fetchPlayerInfo(roblox: RobloxClient, interaction: any, id: number) {
    let playerInfo;

    try {
        playerInfo = await roblox.getPlayerInfo({ userId: id });
    } catch (err) {
        errorEmbed(null, interaction, "Error occurred!", "Unable to fetch player info", "infofetch");
    }

    return playerInfo;
}

async function fetchThumbnail(roblox: RobloxClient, interaction: any, id: number) {
    let thumbnail;

    try {
        thumbnail = await roblox.getPlayerThumbnail(id, "100x100", "png", false, "Headshot");
    } catch (err) {
        errorEmbed(null, interaction, "Error occurred!", "Unable to fetch parts of player", "thumbnailfetch");
    }

    return thumbnail;
}

async function fetchGroupRoles(roblox: RobloxClient, interaction: any, id: number) {
    let roles;

    try {
        roles = await roblox.getRoles(id);
    } catch (err) {
        errorEmbed(null, interaction, "Error occurred", "Unable to fetch group roles", "rolefetch");
    }

    return roles;
}

async function fetchPlayerGroups(roblox: RobloxClient, interaction: any, id: number) {
    let groups;

    try {
        groups = await roblox.getGroups(id);
    } catch (err) {
        errorEmbed(null, interaction, "Error occurred", "Unable to fetch player groups", "groupfetch");
    }

    return groups;
}

async function fetchUserGroupRank(roblox: RobloxClient, interaction: any, groupId: number, userId: number) {
    let rank;

    try {
        rank = await roblox.getRankInGroup(groupId, userId);
    } catch (err) {
        errorEmbed(null, interaction, "Error occurred", "Unable to fetch user rank", "rankfetch");
    }

    return rank;
}

async function setGroupRank(roblox: RobloxClient, interaction: any, groupId: number, userId: number, rank: number) {
    try {
        await roblox.setRank(groupId, userId, rank);
    } catch (err) {
        console.error(err);
        errorEmbed(null, interaction, "Error occurred", "Unable to set user rank", "rankset");
    }
}

async function fetchUsernameFromId(roblox: RobloxClient, interaction: any, id: number) {
    let username;

    try {
        username = await roblox.getUsernameFromId(id);
    } catch (err) {
        errorEmbed(null, interaction, "Error occurred", "Unable to fetch username", "usernamefetch");
    }

    return username;
}

type RobloxClient = ReturnType<typeof createRobloxClient>;

module.exports = {
    createRobloxClient,
    fetchIdFromUsername,
    fetchPlayerInfo,
    fetchThumbnail,
    fetchGroupRoles,
    fetchPlayerGroups,
    fetchUserGroupRank,
    setGroupRank,
    fetchUsernameFromId
};

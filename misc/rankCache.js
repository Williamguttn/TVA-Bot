class GroupRankCache {
    constructor() {
        // Use a Map to store cached ranks
        this.cache = new Map();
    }

    /**
     * Fetch or retrieve cached user group rank
     * @param {function} fetchUserGroupRankFn - The function to fetch user group rank
     * @param {Object} noblox - Noblox client
     * @param {Object} interaction - Discord interaction object
     * @param {number} groupId - Roblox group ID
     * @param {Object} userUpdate - User update object
     * @returns {Promise<number>} Cached or fetched rank
     */
    async getRank(fetchUserGroupRankFn, noblox, interaction, groupId, userUpdate) {
        // Ensure groupId is a number
        const numGroupId = +groupId;

        // Check if rank is already in cache
        if (this.cache.has(numGroupId)) {
            return this.cache.get(numGroupId);
        }

        // Fetch rank if not in cache
        const rank = await fetchUserGroupRankFn(noblox, interaction, numGroupId, userUpdate);

        // Store rank in cache
        this.cache.set(numGroupId, rank);

        return rank;
    }

    /**
     * Clear the entire cache
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Remove a specific group ID from cache
     * @param {number} groupId - Roblox group ID to remove from cache
     */
    clearGroupId(groupId) {
        this.cache.delete(+groupId);
    }
}

module.exports = { GroupRankCache };
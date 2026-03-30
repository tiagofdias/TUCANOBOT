const cache = new Map();
const TTL_TIMEOUTS = new Map();

const CacheManager = {
    get: (key) => cache.get(key),
    
    set: (key, value, ttl = 300000) => { // Default 5 minute TTL for safety
        cache.set(key, value);
        
        // Clear old timeout if exists
        if (TTL_TIMEOUTS.has(key)) {
            clearTimeout(TTL_TIMEOUTS.get(key));
        }
        
        if (ttl > 0) {
            const timeout = setTimeout(() => {
                cache.delete(key);
                TTL_TIMEOUTS.delete(key);
            }, ttl);
            TTL_TIMEOUTS.set(key, timeout);
        }
    },
    
    delete: (key) => {
        cache.delete(key);
        if (TTL_TIMEOUTS.has(key)) {
            clearTimeout(TTL_TIMEOUTS.get(key));
            TTL_TIMEOUTS.delete(key);
        }
    },
    
    clear: () => {
        cache.clear();
        for (const timeout of TTL_TIMEOUTS.values()) {
            clearTimeout(timeout);
        }
        TTL_TIMEOUTS.clear();
    },
    
    async getOrFetch(key, fetchFunction, ttl = 300000) {
        if (cache.has(key)) {
            return cache.get(key);
        }
        
        const data = await fetchFunction();
        // Cache even nulls to avoid repeated db hits for missing configs
        CacheManager.set(key, data, ttl);
        return data;
    },
    
    // Consistent Key Generators
    keys: {
        levelConfig: (guildId) => `levelConfig_${guildId}`,
        levelRoleMultipliers: (guildId) => `levelMultipliers_${guildId}`,
        roleStatus: (guildId, roleType) => `roleStatus_${guildId}_${roleType}`,
        allRoleStatus: (guildId) => `allRoleStatus_${guildId}`,
        activeRolesConfig: (guildId) => `activeRolesConfig_${guildId}`,
        vanityRoles: (guildId) => `vanityRoles_${guildId}`,
        autoRole: (guildId) => `autoRole_${guildId}`,
        persistentRoles: (guildId) => `persistentRoles_${guildId}`,
    }
};

module.exports = CacheManager;

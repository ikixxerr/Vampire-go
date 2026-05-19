const db = require("@common/db");

async function getOwnedDresses(userId) {
    return db.get(`dressing.owned.${userId}`) || [];
}

async function getEquippedDresses(userId) {
    return db.get(`dressing.equipped.${userId}`) || [];
}

async function addDresses(userId, dresses) {
    const existing = db.get(`dressing.owned.${userId}`) || [];

    // Merge without duplicates
    const merged = Array.from(new Set([...existing, ...dresses]));

    db.set(`dressing.owned.${userId}`, merged);
}

async function setEquippedDresses(userId, equippedDresses) {
    db.set(`dressing.equipped.${userId}`, equippedDresses);
}

module.exports = {
    getOwnedDresses,
    getEquippedDresses,
    addDresses,
    setEquippedDresses
};
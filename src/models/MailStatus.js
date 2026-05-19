const db = require("@common/db");

module.exports = class MailStatus {
    constructor(userId) {
        this.userId = userId;
        this.id = 0;
        this.status = 0;
    }

    /** @returns {MailStatus} */
    static fromJson(json) {
        const status = new MailStatus(json.userId || 0);
        status.id = json.id || 0;
        status.status = json.status || 0;
        return status;
    }

    async save() {
        await db.set(`mailStatus.${this.userId}.${this.id}`, {
            id: this.id,
            status: this.status
        });
    }

    static async get(userId, id) {
        const data = await db.get(`mailStatus.${userId}.${id}`);
        if (!data) return null;
        return MailStatus.fromJson({ ...data, userId });
    }

    static async getAll(userId) {
        const all = await db.get(`mailStatus.${userId}`) || {};
        return Object.values(all).map(json => MailStatus.fromJson({ ...json, userId }));
    }

    setId(id) {
        this.id = id;
    }

    getId() {
        return this.id;
    }

    setStatus(status) {
        this.status = status;
    }

    getStatus() {
        return this.status;
    }
}
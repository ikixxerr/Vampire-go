const db = require("@common/db");

module.exports = class Vip {
    constructor(userId) {
        this.userId = userId;
        this.vip = 0;
        this.expireDate = 0;
    }

    /** @returns {Vip} */
    static fromJson(json) {
        const vip = new Vip(json.userId);
        vip.vip = json.vip ?? 0;
        vip.expireDate = json.expireDate ?? 0;
        return vip;
    }

    /** @returns {Promise<Vip>} */
    static async fromUserId(userId) {
        const data = db.get(`vip.${userId}`);
        if (data) return Vip.fromJson(data);
        return new Vip(userId);
    }

    async create() {
    const exists = db.has(`vip.${this.userId}`);
    if (!exists) {
        db.set(`vip.${this.userId}`, {
            userId: this.userId,
            vip: this.vip,
            expireDate: this.expireDate
        });
    }
}

    async save() {
        db.set(`vip.${this.userId}`, {
            userId: this.userId,
            vip: this.vip,
            expireDate: this.expireDate
        });
    }

    response() {
        return {
            vip: this.vip,
            expireDate: this.expireDate
        };
    }

    setUserId(userId) {
        this.userId = userId;
    }

    getUserId() {
        return this.userId;
    }

    setLevel(vip) {
        this.vip = vip;
    }

    getLevel() {
        return this.vip;
    }

    setExpireDate(expireDate) {
        this.expireDate = expireDate;
    }

    getExpireDate() {
        return this.expireDate;
    }
}
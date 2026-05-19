const db = require("@common/db");

module.exports = class Localization {
    constructor(userId) {
        this.userId = userId;
        this.language = "";
        this.country = "";
    }

    /** @returns {Localization} */
    static fromJson(json) {
        const loc = new Localization(json.userId);
        loc.language = json.language || "";
        loc.country = json.country || "";
        return loc;
    }

    /** @returns {Promise<Localization>} */
    static async fromUserId(userId) {
        const data = db.get(`user_locale.${userId}`);
        if (data) return Localization.fromJson(data);
        return new Localization(userId);
    }

    async create() {
        db.set(`user_locale.${this.userId}`, this.toJson());
    }

    async save() {
        db.set(`user_locale.${this.userId}`, this.toJson());
    }

    toJson() {
        return {
            userId: this.userId,
            language: this.language,
            country: this.country
        };
    }

    setUserId(userId) {
        this.userId = userId;
    }

    getUserId() {
        return this.userId;
    }

    setLanguage(language) {
        this.language = language;
    }

    getLanguage() {
        return this.language;
    }

    setCountry(country) {
        this.country = country;
    }

    getCountry() {
        return this.country;
    }
};
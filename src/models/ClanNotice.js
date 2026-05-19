const db = require("@common/db");

module.exports = class ClanNotice {
    constructor(clanId) {
        this.clanId = clanId;
        this.content = "";
    }

    static fromJson(json) {
        const notice = new ClanNotice(json.clanId);
        notice.content = json.content ?? "";
        return notice;
    }

    toJson() {
        return {
            clanId: this.clanId,
            content: this.content
        };
    }

    /** @returns {Promise<ClanNotice>} */
    static async fromClanId(clanId) {
        const data = db.get(`clan_notice.${clanId}`);
        return data ? ClanNotice.fromJson(data) : new ClanNotice(clanId);
    }

    async save() {
        db.set(`clan_notice.${this.clanId}`, this.toJson());
    }

    response() {
        return {
            content: this.content
        };
    }

    setClanId(clanId) {
        this.clanId = clanId;
    }

    getClanId() {
        return this.clanId;
    }

    setContent(content) {
        this.content = content;
    }

    getContent() {
        return this.content;
    }
};
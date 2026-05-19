const db = require("@common/db");
const Page = require("@models/Page");

module.exports = class ClanMessage {
    constructor(userId) {
        this.messageId = null;
        this.userId = userId;
        this.clanId = 0;
        this.authorityId = 0;
        this.message = "";
        this.picUrl = "";
        this.nickName = "";
        this.type = 0;
        this.status = 0;
        this.creationTime = 0;
    }

    static fromJson(json) {
        const m = new ClanMessage(json.userId);
        Object.assign(m, json);
        return m;
    }

    toJson() {
        return {
            messageId: this.messageId,
            userId: this.userId,
            clanId: this.clanId,
            authorityId: this.authorityId,
            message: this.message,
            picUrl: this.picUrl,
            nickName: this.nickName,
            type: this.type,
            status: this.status,
            creationTime: this.creationTime
        };
    }

    /**
     * List clan messages filtered by a predicate function, with pagination.
     * @param {function} filterFn A function that takes a ClanMessage JSON and returns true/false.
     * @param {number} pageNo Page number (0-based).
     * @param {number} pageSize Number of entries per page.
     * @returns {Page} A Page object containing paginated clan messages.
     */
    static async listFromFilter(filterFn, pageNo, pageSize) {
        if (typeof filterFn !== "function") {
            throw new TypeError("filterFn must be a function");
        }

        const allEntries = Object.entries(db.all());
        const all = allEntries
            .filter(([key]) => key.startsWith("clan_message."))
            .map(([key, value]) => value)
            .filter(filterFn);

        const totalSize = all.length;
        const startIndex = Page.getStartIndex(pageNo, pageSize);
        const pageData = all
            .sort((a, b) => b.creationTime - a.creationTime)
            .slice(startIndex, startIndex + pageSize)
            .map(ClanMessage.fromJson)
            .map(m => m.response());

        return new Page(pageData, totalSize, pageNo, pageSize);
    }

    static async findFirst(userId, type, status) {
        const allEntries = Object.entries(db.all());
        const messages = allEntries
            .filter(([key]) => key.startsWith("clan_message."))
            .map(([key, value]) => value)
            .filter(m => m.userId === userId && m.type === type && m.status === status);

        return messages.length ? ClanMessage.fromJson(messages[0]) : new ClanMessage(userId);
    }

    async save() {
        const keyBase = `clan_message`;
        if (!this.messageId) {
            const allEntries = Object.entries(db.all());
            const existing = allEntries
                .filter(([key]) => key.startsWith(`${keyBase}.`))
                .map(([key]) => parseInt(key.split(".")[1]))
                .filter(id => !isNaN(id));

            this.messageId = existing.length ? Math.max(...existing) + 1 : 1;
        }

        this.creationTime = this.creationTime || Date.now();
        db.set(`${keyBase}.${this.messageId}`, this.toJson());
    }

    async delete() {
        if (this.messageId) {
            db.delete(`clan_message.${this.messageId}`);
        }
    }

    response() {
        return {
            clanId: this.clanId,
            headPic: this.picUrl,
            id: this.messageId,
            nickName: this.nickName,
            status: this.status,
            type: this.type,
            userId: this.userId,
            msg: this.message
        };
    }

    // Getters and setters...

    getMessageId() { return this.messageId; }
    setUserId(userId) { this.userId = userId; }
    getUserId() { return this.userId; }
    setClanId(clanId) { this.clanId = clanId; }
    getClanId() { return this.clanId; }
    setAuthorityId(authorityId) { this.authorityId = authorityId; }
    getAuthorityId() { return this.authorityId; }
    setMessage(message) { this.message = message; }
    getMessage() { return this.message; }
    setProfilePic(picUrl) { this.picUrl = picUrl; }
    getProfilePic() { return this.picUrl; }
    setNickname(nickName) { this.nickName = nickName; }
    getNickname() { return this.nickName; }
    setType(type) { this.type = type; }
    getType() { return this.type; }
    setStatus(status) { this.status = status; }
    getStatus() { return this.status; }
    setCreationTime(creationTime) { this.creationTime = creationTime; }
    getCreationTime() { return this.creationTime; }
};
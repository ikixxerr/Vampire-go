const db = require("@common/db");

module.exports = class Mail {
    constructor() {
        this.id = 0;
        this.title = "";
        this.content = "";
        this.sendDate = 0;
        this.status = 0;
        this.type = 0;
        this.attachment = [];
        this.extra = "";
    }

    /** @returns {Mail} */
    static fromJson(json) {
        const mail = new Mail();
        mail.id = json.id || 0;
        mail.title = json.title || "";
        mail.content = json.content || "";
        mail.sendDate = json.sendDate || 0;
        mail.status = json.status || 0;
        mail.type = json.type || 0;
        mail.attachment = json.attachment || [];
        mail.extra = json.extra || "";
        return mail;
    }

    /** @returns {Promise<Mail>} */
    static async fromId(id) {
        const data = await db.get(`mail.${id}`);
        if (!data) return null;
        return Mail.fromJson(data);
    }

    async create() {
        await db.set(`mail.${this.id}`, this.toJson());
    }

    async save() {
        await this.create(); // overwrite
    }

    toJson() {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            sendDate: this.sendDate,
            status: this.status,
            type: this.type,
            attachment: this.attachment,
            extra: this.extra
        };
    }

    // Getters & setters remain the same
    setId(id) { this.id = id; }
    getId() { return this.id; }

    setTitle(title) { this.title = title; }
    getTitle() { return this.title; }

    setContent(content) { this.content = content; }
    getContent() { return this.content; }

    sendSentDate(sentDate) { this.sendDate = sentDate; }
    getSentDate() { return this.sendDate; }

    setStatus(status) { this.status = status; }
    getStatus() { return this.status; }

    setType(type) { this.type = type; }
    getType() { return this.type; }

    setAttachments(attachments) { this.attachment = attachments; }
    getAttachments() { return this.attachment; }

    setExtra(extra) { this.extra = extra; }
    getExtra() { return this.extra; }
};
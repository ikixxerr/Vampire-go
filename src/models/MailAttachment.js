const db = require("@common/db");

module.exports = class MailAttachment {
    constructor(userId, mailId) {
        this.userId = userId;
        this.mailId = mailId;

        this.name = "";
        this.qty = 0;
        this.icon = "";
        this.itemId = "";
        this.type = 0;

        this.vipLevel = 0;
        this.vipDuration = 0; // in days
    }

    /** @returns {MailAttachment} */
    static fromJson(json) {
        const attachment = new MailAttachment(json.userId || 0, json.mailId || 0);
        attachment.name = json.name || "";
        attachment.qty = json.qty || 0;
        attachment.icon = json.icon || "";
        attachment.itemId = json.itemId || "";
        attachment.type = json.type || 0;
        attachment.vipLevel = json.vipLevel || 0;
        attachment.vipDuration = json.vipDuration || 0;
        return attachment;
    }

    async save() {
        await db.set(`mailAttachments.${this.userId}.${this.mailId}`, {
            name: this.name,
            qty: this.qty,
            icon: this.icon,
            itemId: this.itemId,
            type: this.type,
            vipLevel: this.vipLevel,
            vipDuration: this.vipDuration
        });
    }

    static async get(userId, mailId) {
        const data = await db.get(`mailAttachments.${userId}.${mailId}`);
        if (!data) return null;
        return MailAttachment.fromJson({ ...data, userId, mailId });
    }

    static async getAll(userId) {
        const all = await db.get(`mailAttachments.${userId}`) || {};
        return Object.entries(all).map(([mailId, json]) => 
            MailAttachment.fromJson({ ...json, userId, mailId })
        );
    }

    setName(name) { this.name = name; }
    getName() { return this.name; }

    setQuantity(quantity) { this.qty = quantity; }
    getQuantity() { return this.qty; }

    setIcon(icon) { this.icon = icon; }
    getIcon() { return this.icon; }

    setItemId(itemId) { this.itemId = itemId; }
    getItemId() { return this.itemId; }

    setType(type) { this.type = type; }
    getType() { return this.type; }

    setVipLevel(vipLevel) { this.vipLevel = vipLevel; }
    getVipLevel() { return this.vipLevel; }

    setVipDuration(vipDuration) { this.vipDuration = vipDuration; }
    getVipDuration() { return this.vipDuration; }
}
const db = require("@common/db");
const Page = require("@models/Page");

module.exports = class Transaction {
    constructor(data = {}) {
        this.userId = data.userId ?? 0;
        this.created = data.created ?? "";
        this.currency = data.currency ?? 0;
        this.inoutType = data.inoutType ?? 0;
        this.orderId = data.orderId ?? "";
        this.qty = data.quantity ?? 0;
        this.status = data.status ?? 0;
        this.transactionType = data.transactionType ?? 0;
    }

    static fromJson(json) {
        return new Transaction(json);
    }

    toJson() {
        return {
            userId: this.userId,
            created: this.created,
            currency: this.currency,
            inoutType: this.inoutType,
            orderId: this.orderId,
            quantity: this.qty,
            status: this.status,
            transactionType: this.transactionType
        };
    }

    static async fromUserId(userId, pageNo, pageSize) {
        const allTransactions = db.get(`wealth_record.${userId}`) || [];

        const totalSize = allTransactions.length;
        const startIndex = Page.getStartIndex(pageNo, pageSize);
        const paged = allTransactions
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(startIndex, startIndex + pageSize)
            .map(t => Transaction.fromJson(t));

        return new Page(paged, totalSize, pageNo, pageSize);
    }

    async save() {
        const key = `wealth_record.${this.userId}`;
        const list = db.get(key) || [];
        list.push(this.toJson());
        db.set(key, list);
    }
};
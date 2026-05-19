const db = require("@common/db");
const Page = require("@models/Page");

module.exports = class FriendRequest {
    constructor() {
        this.requestId = null; // Auto increment (you’ll handle this in logic)
        this.userId = 0;
        this.friendId = 0;
        this.message = "";
        this.picUrl = "";
        this.nickName = "";
        this.sex = 0;
        this.country = "";
        this.language = "";
        this.status = 0;
        this.creationTime = 0;
    }

    static fromJson(json) {
        const f = new FriendRequest();
        Object.assign(f, json);
        return f;
    }

    toJson() {
        return {
            requestId: this.requestId,
            userId: this.userId,
            friendId: this.friendId,
            message: this.message,
            picUrl: this.picUrl,
            nickName: this.nickName,
            sex: this.sex,
            country: this.country,
            language: this.language,
            status: this.status,
            creationTime: this.creationTime
        };
    }

    static async listFromUserId(userId, pageNo, pageSize) {
        const all = db.get(`friend_requests.${userId}`) || [];
        const sorted = all.sort((a, b) => b.creationTime - a.creationTime);

        const totalSize = sorted.length;
        const startIndex = Page.getStartIndex(pageNo, pageSize);
        const pageData = sorted.slice(startIndex, startIndex + pageSize).map(FriendRequest.fromJson).map(r => r.response());

        return new Page(pageData, totalSize, pageNo, pageSize);
    }

    static async fromFriendId(userId, friendId) {
        const requests = db.get(`friend_requests.${userId}`) || [];
        const request = requests.find(r => r.friendId === friendId);
        return request ? FriendRequest.fromJson(request) : null;
    }

    async save() {
        const key = `friend_requests.${this.userId}`;
        const existing = db.get(key) || [];

        this.creationTime = Date.now();

        const index = existing.findIndex(r => r.friendId === this.friendId);
        if (index >= 0) {
            existing[index] = this.toJson();
        } else {
            this.requestId = existing.length ? existing[existing.length - 1].requestId + 1 : 1;
            existing.push(this.toJson());
        }

        db.set(key, existing);
    }

    response() {
        return {
            msg: this.message,
            nickName: this.nickName,
            picUrl: this.picUrl,
            requestId: this.requestId,
            status: this.status,
            userId: this.friendId,
            language: this.language,
            country: this.country,
            sex: this.sex
        };
    }

    setRequestId(requestId) { this.requestId = requestId; }
    getRequestId() { return this.requestId; }

    setUserId(userId) { this.userId = userId; }
    getUserId() { return this.userId; }

    setFriendId(friendId) { this.friendId = friendId; }
    getFriendId() { return this.friendId; }

    setMessage(message) { this.message = message; }
    getMessage() { return this.message; }

    setProfilePic(picUrl) { this.picUrl = picUrl; }
    getProfilePic() { return this.picUrl; }

    setNickname(nickName) { this.nickName = nickName; }
    getNickname() { return this.nickName; }

    setSex(sex) { this.sex = sex; }
    getSex() { return this.sex; }

    setCountry(country) { this.country = country; }
    getCountry() { return this.country; }

    setLanguage(language) { this.language = language; }

    setStatus(status) { this.status = status; }
    getStatus() { return this.status; }

    setCreationTime(creationTime) { this.creationTime = creationTime; }
    getCreationTime() { return this.creationTime; }
};
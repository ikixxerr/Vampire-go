const db = require("@common/db");

module.exports = class User {
    constructor(userId) {
        this.userId = userId;
        this.nickName = "";
        this.sex = 0;
        this.picUrl = "";
        this.details = "";
        this.birthday = "";
        this.isFreeNickname = true;
    }

    /** @returns {User|null} */
    static fromUserId(userId) {
        const data = db.get(`user.${userId}.profile`);
        if (!data) return null;

        const user = new User(userId);
        Object.assign(user, data);
        return user;
    }

    static exists(userId) {
        return db.has(`user.${userId}.profile`);
    }

    create() {
        this.save();
    }

    save() {
        db.set(`user.${this.userId}.profile`, {
            nickName: this.nickName,
            sex: this.sex,
            picUrl: this.picUrl,
            details: this.details,
            birthday: this.birthday,
            isFreeNickname: this.isFreeNickname
        });
    }

    response() {
        return {
            userId: this.userId,
            nickName: this.nickName,
            sex: this.sex,
            picUrl: this.picUrl,
            details: this.details,
            birthday: this.birthday
        };
    }

    setUserId(userId) { this.userId = userId; }
    getUserId() { return this.userId; }

    setNickname(nickName) { this.nickName = nickName; }
    getNickname() { return this.nickName; }

    setSex(sex) { this.sex = sex; }
    getSex() { return this.sex; }

    setProfilePic(picUrl) { this.picUrl = picUrl; }
    getProfilePic() { return this.picUrl; }

    setDetails(details) { this.details = details; }
    getDetails() { return this.details; }

    setBirthday(birthday) { this.birthday = birthday; }
    getBirthday() { return this.birthday; }

    setIsFreeNickname(isFreeNickname) { this.isFreeNickname = isFreeNickname; }
    getIsFreeNickname() { return this.isFreeNickname; }

    /**
     * Checks if a nickname is already used by any user
     * @param {string} nickname
     * @returns {boolean}
     */
    static nicknameExists(nickname) {
        const allKeys = db.all(); // returns all key-value pairs

        return Object.entries(allKeys)
            .filter(([key]) => key.endsWith(".profile"))
            .some(([, data]) => data.nickName === nickname);
    }
removeCurrency(currencyType, amount) {
        const key = `user.${this.userId}.currencies.${currencyType}`;
        const current = db.get(key) || 0;

        if (current < amount) {
            return { success: false };
        }

        const newAmount = current - amount;
        db.set(key, newAmount);
        return { success: true, newAmount };
    }
};
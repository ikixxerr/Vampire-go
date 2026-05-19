const db = require("@common/db");

module.exports = class Account {
    constructor(userId) {
        this.userId = userId;
        this.email = "";
        this.password = "";
        this.creationTime = 0;
        this.accessToken = "";
        this.loginTime = 0;
    }

    /** @returns {Account|null} */
    static fromUserId(userId) {
        const data = db.get(`user.${userId}.account`);
        if (!data) return null;

        const account = new Account(userId);
        Object.assign(account, data);
        return account;
    }

   create() {
     db.set(`user.${this.userId}.account`, {
      userId: this.userId,
      accessToken: this.accessToken,
      creationTime: this.creationTime
    });
}

   
    save() {
        db.set(`user.${this.userId}.account`, {
            email: this.email,
            password: this.password,
            creationTime: this.creationTime,
            accessToken: this.accessToken,
            loginTime: this.loginTime
        });
    }

    response() {
        return {
            userId: this.userId,
            accessToken: this.accessToken,
            hasPassword: this.password != null
        };
    }

    setUserId(userId) { this.userId = userId; }
    getUserId() { return this.userId; }

    setEmail(email) { this.email = email; }
    getEmail() { return this.email; }

    setPassword(password) { this.password = password; }
    getPassword() { return this.password; }

    setCreationTime(creationTime) { this.creationTime = creationTime; }
    getCreationTime() { return this.creationTime; }

    setAccessToken(accessToken) { this.accessToken = accessToken; }
    getAccessToken() { return this.accessToken; }

    setLoginTime(loginTime) { this.loginTime = loginTime; }
    getLoginTime() { return this.loginTime; }
};
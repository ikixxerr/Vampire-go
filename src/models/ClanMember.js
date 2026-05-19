const db = require("@common/db");
const ClanRoles = require("@constants/ClanRoles");
const User = require("@models/User");
const Vip = require("@models/Vip");

module.exports = class ClanMember {
    constructor(userId) {
        this.userId = userId;
        this.clanId = 0;
        this.role = ClanRoles.INVALID;
        this.experience = 0;
    }

    static fromJson(json) {
        const m = new ClanMember(json.userId);
        Object.assign(m, json);
        return m;
    }

    toJson() {
        return {
            userId: this.userId,
            clanId: this.clanId,
            role: this.role,
            experience: this.experience
        };
    }

    static async fromUserId(userId) {
        const data = db.get(`clan_member.${userId}`);
        return data ? ClanMember.fromJson(data) : new ClanMember(userId);
    }

    async getInfo() {
        if (!this.clanId) return null;

        const user = await User.fromUserId(this.userId);
        const vip = await Vip.fromUserId(this.userId);

        return {
            userId: this.userId,
            clanId: this.clanId,
            role: this.role,
            experience: this.experience,
            expireDate: vip.getExpireDate(),
            headPic: user.getProfilePic(),
            nickName: user.getNickname(),
            vip: vip.getLevel()
        };
    }

    addExperience(experience) {
        this.experience += experience;
    }

    async save() {
        db.set(`clan_member.${this.userId}`, this.toJson());
    }

    async delete() {
        db.delete(`clan_member.${this.userId}`);
    }

    response() {
        return {
            userId: this.userId,
            clanId: this.clanId,
            role: this.role
        };
    }

    setUserId(userId) {
        this.userId = userId;
    }

    getUserId() {
        return this.userId;
    }

    setClanId(clanId) {
        this.clanId = clanId;
    }

    getClanId() {
        return this.clanId;
    }

    setRole(role) {
        this.role = role;
    }

    getRole() {
        return this.role;
    }

    setExperience(experience) {
        this.experience = experience;
    }

    getExperience() {
        return this.experience;
    }
};
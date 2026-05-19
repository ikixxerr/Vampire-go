const db = require("@common/db");

const util = require("util");
const constants = require("@common/constants");
const clanConfig = require("@config/clan");
const Currencies = require("@constants/Currencies");
const Clan = require("@models/Clan");
const Page = require("@models/Page");
const Vip = require("@models/Vip");

module.exports = class ClanDonation {
    constructor(userId) {
        this.userId = userId;
        this.clanId = 0;
        this.nickName = "";
        this.type = 0;
        this.amount = 0;
        this.expReward = 0;
        this.clanGoldReward = 0;
        this.creationTime = 0;
    }

    static fromJson(json) {
        const d = new ClanDonation(json.userId);
        d.clanId = json.clanId ?? 0;
        d.nickName = json.nickName ?? "";
        d.type = json.type ?? 0;
        d.amount = json.amount ?? 0;
        d.expReward = json.expReward ?? 0;
        d.clanGoldReward = json.clanGoldReward ?? 0;
        d.creationTime = json.creationTime ?? 0;
        return d;
    }

    toJson() {
        return {
            userId: this.userId,
            clanId: this.clanId,
            nickName: this.nickName,
            type: this.type,
            amount: this.amount,
            expReward: this.expReward,
            clanGoldReward: this.clanGoldReward,
            creationTime: this.creationTime
        };
    }

    static async historyFromClanId(clanId, pageNo, pageSize) {
        const all = db.get(`clan_donation.${clanId}`) || [];
        const sorted = all.sort((a, b) => b.creationTime - a.creationTime);

        const totalSize = sorted.length;
        const startIndex = Page.getStartIndex(pageNo, pageSize);

        const pageData = sorted
            .slice(startIndex, startIndex + pageSize)
            .map(ClanDonation.fromJson)
            .map(d => d.response());

        return new Page(pageData, totalSize, pageNo, pageSize);
    }

    async getInfo() {
        if (this.clanId === 0) return;

        const vip = await Vip.fromUserId(this.userId);
        const clan = await Clan.fromClanId(this.clanId);
        const clanLevelConfig = clanConfig.levels[clan.level];

        const goldKey = util.format(constants.CACHE_USER_DONATION_CURRENCY, this.userId, Currencies.GOLD);
        const diamondKey = util.format(constants.CACHE_USER_DONATION_CURRENCY, this.userId, Currencies.DIAMOND);
        const taskKey = util.format(constants.CACHE_USER_DONATION_TASK, this.userId);

        const currentGold = db.get(goldKey) || 0;
        const currentDiamonds = db.get(diamondKey) || 0;
        const currentTasks = db.get(taskKey) || 0;

        return {
            currentGold,
            currentDiamond: currentDiamonds,
            currentTask: currentTasks,
            currentExperience: clan.experience,
            clanId: clan.clanId,
            level: clan.level,
            maxDiamond: clanLevelConfig.maxDiamondDonate * clanConfig.vipBoosts[vip.getLevel()].maxDiamondDonate,
            maxExperience: clanLevelConfig.upgradeExperience,
            maxGold: clanLevelConfig.maxGoldDonate * clanConfig.vipBoosts[vip.getLevel()].maxGoldDonate,
            maxTask: clanLevelConfig.personalTaskCount + clanLevelConfig.clanTaskCount
        };
    }

    async save() {
        const key = util.format(constants.CACHE_USER_DONATION_CURRENCY, this.userId, this.type);
        db.set(key, this.amount);

        const historyKey = `clan_donation.${this.clanId}`;
        const existing = db.get(historyKey) || [];

        this.creationTime = Date.now();
        existing.push(this.toJson());

        db.set(historyKey, existing);
    }

    response() {
        return {
            date: this.creationTime,
            experienceGot: this.expReward,
            nickName: this.nickName,
            quantity: this.amount,
            tribeCurrencyGot: this.clanGoldReward,
            type: this.type,
            userId: this.userId
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

    setNickname(nickName) {
        this.nickName = nickName;
    }

    getNickname() {
        return this.nickName;
    }

    setType(type) {
        this.type = type;
    }

    getType() {
        return this.type;
    }

    setAmount(amount) {
        this.amount = amount;
    }

    getAmount() {
        return this.amount;
    }

    setExpReward(expReward) {
        this.expReward = expReward;
    }

    getExpReward() {
        return this.expReward;
    }

    setClanGoldReward(clanGoldReward) {
        this.clanGoldReward = clanGoldReward;
    }

    getClanGoldReward() {
        return this.clanGoldReward;
    }

    setCreationTime(creationTime) {
        this.creationTime = creationTime;
    }

    getCreationTime() {
        return this.creationTime;
    }
};
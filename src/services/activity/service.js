const constants = require("@common/constants");
const logger = require("@common/logger");
const mariadb = require("@common/mariadb");
const responses = require("@common/responses");
const luckyWheelConfig = require("@config/luckywheel");
const db = require("@common/db");
const signInConfig = require("@config/signin.json");
const Wealth = require("@models/wealth");

async function getSignInActivity(userId) {
    const today = new Date().toISOString().split("T")[0];

    const lastClaimed = db.get(`signin.lastClaimed.${userId}`);
    const streak = db.get(`signin.streak.${userId}`) || 0;

    const hasClaimedToday = lastClaimed === today;
    const currentStreak = hasClaimedToday ? streak : streak + 1;
    const cappedStreak = currentStreak > 7 ? 1 : currentStreak;

    const rewardKey = Object.keys(signInConfig)[cappedStreak - 1];
    const rewardInfo = signInConfig[rewardKey];

    return responses.success({
        hasClaimedToday,
        currentDay: cappedStreak,
        reward: rewardInfo
    });
}



async function getSignInReward(userId) {
    const today = new Date().toISOString().split("T")[0];

    const lastClaimed = db.get(`signin.lastClaimed.${userId}`);
    const hasClaimedToday = lastClaimed === today;
    let streak = db.get(`signin.streak.${userId}`) || 0;

    if (hasClaimedToday) {
        return responses.error("You have already claimed today's reward.");
    }

    streak = streak + 1;
    if (streak > 7) streak = 1;

    // Get reward
    const rewardKey = Object.keys(signInConfig)[streak - 1];
    const reward = signInConfig[rewardKey];

    // Load & update wealth
    const wealth = await Wealth.fromUserId(userId);
    if (reward.type === "gold") {
        wealth.setGold(wealth.getGold() + reward.quantity);
    } else if (reward.type === "diamond") {
        wealth.setDiamonds(wealth.getDiamonds() + reward.quantity);
    }
    await wealth.save();

    // Save sign-in status
    db.set(`signin.lastClaimed.${userId}`, today);
    db.set(`signin.streak.${userId}`, streak);

    return responses.success({
        message: "Reward claimed successfully!",
        reward: reward,
        wealth: {
            golds: wealth.getGold(),
            diamonds: wealth.getDiamonds(),
            clanGolds: wealth.getClanGolds()
        }
    });
}

async function getActivityList(userId) {
    const activities = [
        {
            id: "currency_frenzy",
            title: "Currency Frenzy",
            icon: "icon_currency.png",
            description: "Infinite Money for Beta Testers",
            action: "open_currency_tab",
            isCompleted: false,
            rewards: {
                gems: 9999,
                coins: 9999
            }
        },
        {
            id: "login_gift",
            title: "Login Gift",
            icon: "icon_gift.png",
            description: "Login daily to collect your gift!",
            action: "open_login_gift",
            isCompleted: false
        },
        {
            id: "spin_wheel",
            title: "Prize Wheel",
            icon: "icon_wheel.png",
            description: "Spin the wheel to win exclusive items!",
            action: "open_prize_wheel",
            isCompleted: false,
            luckValue: 10
        }
    ];

    return responses.success({ activities });
}

async function getActivityTaskList(userId, activityType) {
    const taskMap = {
        daily_sign_in: [
            { taskId: 1, description: "Sign in today", isDone: false, reward: { type: "gold", amount: 100 } }
        ],
        spin_wheel: [
            { taskId: 1, description: "Spin once", isDone: false, reward: { type: "diamond", amount: 1 } },
            { taskId: 2, description: "Spin 3 times", isDone: false, reward: { type: "vip", amount: 1 } }
        ]
    };

    if (!taskMap[activityType]) {
        return responses.error("Invalid activity type.");
    }

    return responses.success({
        activityType,
        tasks: taskMap[activityType]
    });
}

async function getActivityFreeWheelStatus(userId) {
    try {
        const query = `SELECT ${constants.DB_FIELD_FREE_WHEEL} FROM ${constants.DB_TABLE_ACTIVITY_STATUS} WHERE ${constants.DB_FIELD_USER_ID} = ?`;
        const result = await mariadb.query(query, [userId]);

        const freeWheel = result[0] ? result[0][constants.DB_FIELD_FREE_WHEEL] : null;
        return responses.success({ isFree: freeWheel == null ? 1 : 0 });
    } catch (error) {
        logger.error("Error getting free wheel status:", error);
        return responses.innerError();
    }
}

async function getActivityWheelInfo(userId, type) {
        if (type != "gold" && type != "diamond") {
        return responses.invalidType();
    }

    const activityInfo = { ...luckyWheelConfig[type] };
    activityInfo.activityDesc = luckyWheelConfig.activityDesc;

    try {
        const query = `SELECT ${constants.DB_FIELD_FREE_WHEEL} FROM ${constants.DB_TABLE_ACTIVITY_STATUS} WHERE ${constants.DB_FIELD_USER_ID} = ?`;
        const result = await mariadb.query(query, [userId]);

        const freeWheel = result[0] ? result[0][constants.DB_FIELD_FREE_WHEEL] : null;
        activityInfo.isFree = (freeWheel == null && type !== constants.TYPE_DIAMOND ? 1 : 0);

        return responses.success(activityInfo);
    } catch (error) {
        logger.error("Error getting wheel info:", error);
        return responses.innerError();
    }
}

async function playActivityWheel(userId, type, isMultiplePlay) {
    return responses.success({
        rewardId: 4,
        rewardType: "diamond",
        rewardName: "1",
        pic: "http://static.sandboxol.com/sandbox/activity/treasurebox/Bcubes.png",
        userLuckyValue: 0,
        isTransform: 0,
        luckyValue: 0,
        before: null,
        now: null
    });
}

async function getActivityWheelShopInfo(userId, type) {
    return responses.success({
        userBlock: 10,
        exchangeEndTime: "",
        tips: "",
        remainingTime: 9999,
        blockShopRewardInfoList: [
            { rewardId: 0, rewardName: "", rewardType: "", needBlock: 0, pic: "", exchangeUpperLimit: 0 }
        ]
    });
}

module.exports = {
    getSignInActivity: getSignInActivity,
    getSignInReward: getSignInReward,
    getActivityList: getActivityList,
    getActivityTaskList: getActivityTaskList,
    getActivityFreeWheelStatus: getActivityFreeWheelStatus,
    getActivityWheelInfo: getActivityWheelInfo,
    getActivityWheelShopInfo: getActivityWheelShopInfo,
    playActivityWheel: playActivityWheel
};

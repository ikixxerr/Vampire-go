const constants = require("@common/constants");
const database = require("@common/database");
const logger = require("@common/logger");
const responses = require("@common/responses");
const nickNameConfig = require("@config/nickname");
const Localization = require("@models/Localization");
const User = require("@models/User");
const Vip = require("@models/Vip");
const { default: axios } = require('axios');
const db = require('@common/db');
const { discordConfig } = require('@config/discord');
const Wealth = require("@models/Wealth");
const payServiceBase = require("@pay-service/base");
const path = require("path");
const signinConfig = require("@config/signin.json");
const rewardKeys = Object.keys(signinConfig); // ['first', 'second', ..., 'seventh'] 

const currencyTypeMap = {
  gold: 2,
  diamond: 1
};

function getTodayString() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function dateDiffInDays(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

async function getConfigFile(configFile) {
  const config = database.getKey(constants.DB_APP_CONFIG_TABLE, configFile, true);
  return responses.success(config || {});
}

async function getUserInfo(userId) {
  const user = await User.fromUserId(userId);
  const vip = await Vip.fromUserId(userId);

  return responses.success({
    ...user.response(),
    ...vip.response()
  });
}

async function setUserInfo(userId, picUrl, birthday, details) {
  const user = await User.fromUserId(userId);

  if (picUrl != null) user.setProfilePic(picUrl);
  if (birthday != null) user.setBirthday(birthday);
  if (details != null) user.setDetails(details);
  await user.save();

  return responses.success(user);
}

async function createProfile(userId, nickName, sex) {
  const isUserExists = await User.exists(userId);
  if (isUserExists) {
    return responses.profileExists();
  }

  const user = new User(userId);

  if (!nickName || !sex) {
    return responses.missingRegisterParams();
  }

  if (sex != 1 && sex != 2) {
    return responses.invalidSex();
  }

  user.setNickname(nickName);
  user.setSex(sex);
  await user.create();

  const vip = new Vip(userId);
  await vip.create();

  const userLocale = new Localization(userId);
  await userLocale.create();

  return responses.success({
    ...user.response(),
    ...vip.response()
  });
}

async function changeNickName(userId, newNickname) {
  const user = await User.fromUserId(userId);

  const nickname = newNickname?.trim();
  const isValid = typeof nickname === 'string'
    && nickname.length >= 3
    && nickname.length <= 20
    && /^[a-zA-Z0-9_]+$/.test(nickname);

  if (!isValid) {
    return responses.invalidNicknameFormat();
  }

  if (user.nickName === nickname) {
    return user.getIsFreeNickname()
      ? responses.success(user)
      : responses.sameNickname();
  }

  const takenBy = await db.get(`nicknames.${nickname.toLowerCase()}`);
  if (takenBy && takenBy !== userId) {
    return responses.nicknameAlreadyUsed();
  }

  if (user.getIsFreeNickname()) {
    user.setIsFreeNickname(false);
  } else {
    const quantity = nickNameConfig.quantity;
    const result = await payServiceBase.removeCurrency(userId, 1, quantity, 3);
    if (result.hasFailed) {
      return responses.insufficientCurrency();
    }
  }

  const oldNickname = user.nickName?.toLowerCase();
  if (oldNickname) {
    await db.delete(`nicknames.${oldNickname}`);
  }

  user.setNickname(nickname);
  await db.set(`nicknames.${nickname.toLowerCase()}`, userId);
  await user.save();

  return responses.success(user);
}

async function isChangingNameFree(userId) {
  const user = await User.fromUserId(userId);

  return responses.success({
    currencyType: nickNameConfig.currencyType,
    quantity: nickNameConfig.quantity,
    free: user.getIsFreeNickname()
  });
}

async function setUserLanguage(userId, language) {
  const locale = await Localization.fromUserId(userId);

  locale.setLanguage(language);
  await locale.save();

  return responses.success();
}

async function getUserVipInfo(userId) {
  const vip = await Vip.fromUserId(userId);
  return responses.success(vip.response());
}

// === Daily Reward Logic ===

async function getDailyRewardInfo(userId) {
  try {
    const userKey = `signin.${userId}`;
    let userData = await db.get(userKey);

    if (!userData || typeof userData !== 'object') {
      userData = { lastClaimDate: null, currentDay: 0 };
      await db.set(userKey, userData);
    }

    const today = getTodayString();
    let currentDay = userData.currentDay;

    if (!userData.lastClaimDate) {
      currentDay = 1;
    } else {
      const diff = dateDiffInDays(userData.lastClaimDate, today);
      if (diff === 0) {
        currentDay = userData.currentDay;
      } else if (diff === 1) {
        currentDay = (userData.currentDay % 7) + 1;
      } else {
        currentDay = 1;
      }
    }

    const rewardKey = rewardKeys[currentDay - 1];
    const reward = signinConfig[rewardKey];

    return responses.success({
      currentDay,
      claimed: userData.lastClaimDate === today,
      reward: {
        type: reward.type,
        typeId: currencyTypeMap[reward.type],
        quantity: reward.quantity,
        url: reward.url
      }
    });

  } catch (err) {
    logger.error("getDailyRewardInfo failed", err);
    return responses.innerError();
  }
}

async function receiveDailyReward(userId) {
  const userKey = `signin.${userId}`;
  const today = getTodayString();

  const userData = await db.get(userKey) || {
    lastClaimDate: null,
    currentDay: 0
  };

  if (userData.lastClaimDate === today) {
    return responses.custom("Reward already claimed today.");
  }

  let newDay = 1;
  if (userData.lastClaimDate) {
    const diff = dateDiffInDays(userData.lastClaimDate, today);
    if (diff === 1) {
      newDay = (userData.currentDay % 7) + 1;
    } else {
      newDay = 1; // reset streak
    }
  }

  const rewardKey = rewardKeys[newDay - 1];
  const reward = signinConfig[rewardKey];
  const currencyType = currencyTypeMap[reward.type];

  const result = await payServiceBase.addCurrency(userId, currencyType, reward.quantity, 4);

  if (result.hasFailed) {
    return responses.custom("Failed to deliver reward.");
  }

  await db.set(userKey, {
    lastClaimDate: today,
    currentDay: newDay
  });

  return responses.success({
    day: newDay,
    reward: {
      type: reward.type,
      typeId: currencyType,
      quantity: reward.quantity,
      url: reward.url
    },
    balance: result.balance
  });
}

// === Stubs for unimplemented functions ===

async function getDailyTasksAdConfig(userId) {
  logger.warn("GetDailyTasksAdConfig: Implementation needed");
  return responses.success();
}

async function reportUser(userId) {
  logger.warn("reportUser: Implementation needed");
  return responses.innerError();
}

async function getUserInfoReward(userId) {
  logger.warn("GetUserInfoReward: Implementation needed");
  return responses.innerError();
}

module.exports = {
  getConfigFile,
  createProfile,
  changeNickName,
  isChangingNameFree,
  setUserInfo,
  getUserInfo,
  setUserLanguage,
  getUserVipInfo,
  getDailyRewardInfo,
  receiveDailyReward,
  getDailyTasksAdConfig,
  reportUser,
  getUserInfoReward
};
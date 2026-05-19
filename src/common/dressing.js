const multer = require("@common/multer");
const constants = require("@common/constants");
const logger = require("@common/logger");
const config = require("@config/host");
const db = require("@common/db"); // Replace with your DB module

const dressingTypes = {
  "2": "hair",
  "3": "glasses",
  "4": "face",
  "5": "idle",
  "6": "skin",
  "7": "background",
  "8": "tops",
  "9": "pants",
  "10": "shoes",
  "11": "hat",
  "13": "scarf",
  "14": "wing",
  "15": "crown"
};

const dressesCategory = {
  "8": 1,
  "9": 1,
  "10": 1,
  "2": 2,
  "11": 3,
  "13": 3,
  "14": 3,
  "15": 3,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7
};

const dressesGameType = {
  "2": "custom_hair",
  "3": "custom_glasses",
  "4": "custom_face",
  "5": "animation_idle",
  "6": "skin_color",
  "8": "clothes_tops",
  "9": "clothes_pants",
  "10": "custom_shoes",
  "11": "custom_hat",
  "13": "custom_scarf",
  "14": "custom_wing",
  "15": "custom_crown"
};

const decorationCategories = {};

function init() {
  for (const typeId of Object.keys(dressesCategory)) {
    const categoryId = dressesCategory[typeId];
    const filePath = `${constants.DECORATION_PATH}/${dressingTypes[typeId]}.json`;
    const response = multer.getFile(filePath);

    if (response.status !== 200) {
      logger.error(`DRESSING ERROR: FAILED AT OBJECT '${dressingTypes[typeId]}'`);
      continue;
    }

    decorationCategories[categoryId] ??= [];

    try {
      const data = JSON.parse(response.content);
      for (let i = 0; i < data.length; i++) {
        data[i].iconUrl = data[i].iconUrl.replace(
          "{base}",
          `${config.baseHost}:${config.apiPort}/database/files/icons`
        );
      }

      decorationCategories[categoryId].push(...data);
    } catch (err) {
      logger.error(`DRESSING PARSE ERROR: ${err.message}`);
    }
  }
}

function getDresses(options) {
  const categoryItems = decorationCategories[options.categoryId];
  if (!categoryItems) return [];

  const userId = options.userId;

  return categoryItems.filter((item) => {
    item.status = 0;
    item.IsFree = item.currency === 0 ? 1 : 0;
    item.hasPurchase = 0;

    // Auto-give free item to inventory if not present
    if (item.IsFree === 1 && userId) {
      const invKey = `dressing.owned.${userId}`;
      const owned = db.get(invKey) || [];

      if (!owned.includes(item.id)) {
        owned.push(item.id);
        db.set(invKey, owned);
      }

      // Only show free items in owned view
      if (options.ownerType !== 1) return false;
    }

    const isOwned = options.ownerFilter?.includes(item.id);

    if (options.usingFilter?.includes(item.id)) {
      item.status = 1;
      return true;
    }

    if (options.ownerFilter && options.ownerType === 1) {
      return isOwned;
    }

    if (options.hideClanDresses && item.clanLevel > 0) return false;

    if (options.hideFreeDresses && item.IsFree === 1) return false;

    const validSex = item.sex === options.sex || item.sex === 0;
    const validCurrency = item.currency === options.currency || options.currency === 0;

    if (isOwned && options.ownerType === 2) {
      item.hasPurchase = 1;
    }

    return validSex && validCurrency;
  });
}

function getDressInfo(decorationId) {
  if (!decorationId) return null;

  decorationId = decorationId.toString();
  if (decorationId.length <= 5) return null;

  const dressTypeId = decorationId.substring(0, decorationId.length - 5);
  const categoryId = dressesCategory[dressTypeId];

  return decorationCategories[categoryId]?.find(item => item.id.toString() === decorationId) || null;
}

function getGameDresses(decorationIds) {
  const skin = {};

  for (let i = 0; i < decorationIds.length; i++) {
    const dressInfo = getDressInfo(decorationIds[i]);
    if (!dressInfo || !dressesGameType[dressInfo.typeId]) continue;

    if (dressInfo.typeId == 6) {
      skin["skin_color"] = dressInfo.resourceId;
    } else {
      const splitRes = dressInfo.resourceId.split('.');
      skin[dressesGameType[dressInfo.typeId]] = splitRes.length > 1 ? splitRes[1] : splitRes[0];
    }
  }

  return skin;
}

module.exports = {
  init,
  getDresses,
  getDressInfo,
  getGameDresses
};
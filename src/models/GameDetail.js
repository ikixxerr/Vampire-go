const db = require("@common/db");

module.exports = class GameDetail {
  constructor() {
    this.gameId = "";
    this.bannerUrl = "";
    this.gameDetail = "";
    this.featuredPlay = [];
  }

  static async fromGameId(gameId) {
    const data = await db.get(`game_detail.${gameId}`);
    if (!data) return null;

    const instance = new GameDetail();
    instance.gameId = data.gameId || "";
    instance.bannerUrl = data.bannerUrl || "";
    instance.gameDetail = data.gameDetail || "";
    instance.featuredPlay = data.featuredPlay || [];
    return instance;
  }
};
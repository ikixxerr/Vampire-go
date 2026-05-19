const db = require('@common/db');

class Page {
  constructor(items, total, pageNo, pageSize) {
    this.items = items;
    this.total = total;
    this.pageNo = pageNo;
    this.pageSize = pageSize;
  }

  static getStartIndex(pageNo, pageSize) {
    return (pageNo - 1) * pageSize;
  }
}

module.exports = class Game {
  constructor() {
    this.gameId = "";
    this.gameName = "";
    this.iconUrl = "";
    this.isRecommended = false;
    this.gameTypes = [];
    this.likeCount = 0;
    this.shopEnabled = 0;
    this.rankEnabled = 0;
    this.partyEnabled = 0;
    this.authorId = 0;
    this.creationTime = 0;
  }

  static async fromGameId(gameId) {
    const gameData = await db.get(`game.${gameId}`);
    if (!gameData) return null;

    const game = new Game();
    Object.assign(game, gameData);
    return game;
  }

  static async listGames(pageNo, pageSize) {
    const allGames = await db.get('game') || {};
    const allGameIds = Object.keys(allGames);

    const totalSize = allGameIds.length;
    const startIndex = Page.getStartIndex(pageNo, pageSize);

    const pageGameIds = allGameIds.slice(startIndex, startIndex + pageSize);
    const games = pageGameIds.map(id => {
      const g = new Game();
      Object.assign(g, allGames[id]);
      return g.response();
    });

    return new Page(games, totalSize, pageNo, pageSize);
  }

  static async listPartyGames() {
    const allGames = await db.get('game') || {};
    const partyGames = [];

    for (const gameId in allGames) {
      const gameData = allGames[gameId];
      if (gameData.partyEnabled === 1) {
        const g = new Game();
        Object.assign(g, gameData);
        partyGames.push(g);
      }
    }

    return partyGames;
  }

  response() {
    return {
      gameId: this.gameId,
      gameTitle: this.gameName,
      gameCoverPic: this.iconUrl,
      gameTypes: this.gameTypes,
      praiseNumber: this.likeCount,
    };
  }

  async save() {
    // Save this game object under key `game.<gameId>`
    await db.set(`game.${this.gameId}`, {
      gameId: this.gameId,
      gameName: this.gameName,
      iconUrl: this.iconUrl,
      isRecommended: this.isRecommended,
      gameTypes: this.gameTypes,
      likeCount: this.likeCount,
      shopEnabled: this.shopEnabled,
      rankEnabled: this.rankEnabled,
      partyEnabled: this.partyEnabled,
      authorId: this.authorId,
      creationTime: this.creationTime,
    });
  }

  async incrementLikeCount() {
    this.likeCount++;
    await this.save();
  }

  async decrementLikeCount() {
    if (this.likeCount > 0) {
      this.likeCount--;
      await this.save();
    }
  }

  // Setters and Getters (optional if you want to keep the same interface)
  setGameId(val) { this.gameId = val; }
  getGameId() { return this.gameId; }

  setGameName(val) { this.gameName = val; }
  getGameName() { return this.gameName; }

  setIconUrl(val) { this.iconUrl = val; }
  getIconUrl() { return this.iconUrl; }

  setIsRecommended(val) { this.isRecommended = val; }
  getIsRecommended() { return this.isRecommended; }

  setGameTypes(val) { this.gameTypes = val; }
  getGameTypes() { return this.gameTypes; }

  setLikeCount(val) { this.likeCount = val; }
  getLikeCount() { return this.likeCount; }

  setShopEnabled(val) { this.shopEnabled = val; }
  getShopEnabled() { return this.shopEnabled; }

  setRankEnabled(val) { this.rankEnabled = val; }
  getRankEnabled() { return this.rankEnabled; }

  setPartyEnabled(val) { this.partyEnabled = val; }
  getPartyEnabled() { return this.partyEnabled; }

  setAuthorId(val) { this.authorId = val; }
  getAuthorId() { return this.authorId; }

  setCreationTime(val) { this.creationTime = val; }
  getCreationTime() { return this.creationTime; }
};
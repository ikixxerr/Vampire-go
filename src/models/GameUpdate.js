const db = require("@common/db");

module.exports = class GameUpdate {
  constructor(gameId) {
    this.gameId = gameId;
    this.version = 0;
    this.content = "";
  }

  static async fromGameId(gameId) {
    const data = await db.get(`game_update.${gameId}`);
    if (data) {
      const instance = new GameUpdate(gameId);
      instance.version = data.version || 0;
      instance.content = data.content || "";
      return instance;
    }

    return new GameUpdate(gameId);
  }

  response() {
    return {
      count: this.version,
      content: this.content,
    };
  }

  setGameId(gameId) {
    this.gameId = gameId;
  }

  getGameId() {
    return this.gameId;
  }

  setVersion(version) {
    this.version = version;
  }

  getVersion() {
    return this.version;
  }

  setContent(content) {
    this.content = content;
  }

  getContent() {
    return this.content;
  }

  async save() {
    await db.set(`game_update.${this.gameId}`, {
      version: this.version,
      content: this.content,
    });
  }
};
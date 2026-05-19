const db = require('@common/db');


module.exports = class GameLike {
  constructor(userId) {
    this.userId = userId;
    this.games = []; // liked games array
  }

  static async fromUserId(userId) {
    const gamesJson = await db.get(`game_like.${userId}.games`);
    const instance = new GameLike(userId);
    if (gamesJson) {
      instance.setGames(gamesJson);
    }
    return instance;
  }

  response(gameId) {
    return {
      appreciate: this.games.includes(gameId),
    };
  }

  setUserId(userId) {
    this.userId = userId;
  }

  getUserId() {
    return this.userId;
  }

  setGames(games) {
    this.games = games;
  }

  getGames() {
    return this.games;
  }

  async save() {
    await db.set(`game_like.${this.userId}.games`, this.games);
  }

  addGame(gameId) {
    if (!this.games.includes(gameId)) {
      this.games.push(gameId);
    }
  }

  removeGame(gameId) {
    this.games = this.games.filter((id) => id !== gameId);
  }
};
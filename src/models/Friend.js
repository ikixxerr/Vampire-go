const db = require("@common/db");


const Clan = require("@models/Clan");
const ClanMember = require("@models/ClanMember");
const Page = require("@models/Page");
const User = require("@models/User");
const Vip = require("@models/Vip");

module.exports = class Friend {
  constructor() {
    this.userId = 0;
    this.friendId = 0;
    this.alias = "";
  }

  /** @returns {Promise<Friend>} */
  static async fromUserId(userId, friendId) {
    const friends = (await db.get(`friends.${userId}`)) || [];
    const friendData = friends.find(f => f.friendId === friendId);
    if (friendData) {
      const f = new Friend();
      f.userId = userId;
      f.friendId = friendId;
      f.alias = friendData.alias || "";
      return f;
    }
    return null;
  }

  static async listFromUserId(userId, pageNo, pageSize) {
    const friends = (await db.get(`friends.${userId}`)) || [];
    const totalSize = friends.length;

    const startIndex = Page.getStartIndex(pageNo, pageSize);
    const pageFriends = friends.slice(startIndex, startIndex + pageSize);

    const friendInstances = pageFriends.map(f => {
      const friend = new Friend();
      friend.userId = userId;
      friend.friendId = f.friendId;
      friend.alias = f.alias || "";
      return friend;
    });

    return new Page(friendInstances, totalSize, pageNo, pageSize);
  }

  static async listIdsFromUserId(userId) {
    const friends = (await db.get(`friends.${userId}`)) || [];
    return friends.map(f => Number(f.friendId));
  }

  static async search(userId, query, excludeList, pageNo, pageSize) {
    if (!excludeList || excludeList.length === 0) {
      excludeList = ["0"];
    }
    if (!Array.isArray(excludeList)) excludeList = excludeList.toString().split(",");

    excludeList = excludeList.map(String);
    excludeList.push(String(userId)); // exclude self

    const allUsers = (await db.get("users")) || [];

    const filtered = allUsers.filter(
      u => u.nickName && u.nickName.startsWith(query) && !excludeList.includes(String(u.userId))
    );

    const totalSize = filtered.length;
    const startIndex = Page.getStartIndex(pageNo, pageSize);
    const pageUsers = filtered.slice(startIndex, startIndex + pageSize);

    return new Page(pageUsers, totalSize, pageNo, pageSize);
  }

  static async getInfo(userId) {
    const user = await User.fromUserId(userId);
    const vip = await Vip.fromUserId(userId);

    let clanInfo = {};
    const clanMember = await ClanMember.fromUserId(userId);
    if (clanMember && clanMember.clanId != 0) {
      const clan = await Clan.fromClanId(clanMember.clanId);
      clanInfo = {
        clanId: clan.clanId,
        clanName: clan.name,
        role: clanMember.role,
      };
    }

    return {
      ...user.response(),
      ...vip.response(),
      ...clanInfo,
    };
  }

  static async isFriend(userId, friendId) {
    const userFriends = (await db.get(`friends.${userId}`)) || [];
    const friendFriends = (await db.get(`friends.${friendId}`)) || [];

    const hasUserToFriend = userFriends.some(f => f.friendId === friendId);
    const hasFriendToUser = friendFriends.some(f => f.friendId === userId);

    return hasUserToFriend && hasFriendToUser;
  }

  static async addFriend(userId, friendId) {
    let userFriends = (await db.get(`friends.${userId}`)) || [];
    if (!userFriends.some(f => f.friendId === friendId)) {
      userFriends.push({ friendId, alias: "" });
      await db.set(`friends.${userId}`, userFriends);
    }

    let friendFriends = (await db.get(`friends.${friendId}`)) || [];
    if (!friendFriends.some(f => f.friendId === userId)) {
      friendFriends.push({ friendId: userId, alias: "" });
      await db.set(`friends.${friendId}`, friendFriends);
    }
  }

  static async removeFriend(userId, friendId) {
    let userFriends = (await db.get(`friends.${userId}`)) || [];
    userFriends = userFriends.filter(f => f.friendId !== friendId);
    await db.set(`friends.${userId}`, userFriends);

    let friendFriends = (await db.get(`friends.${friendId}`)) || [];
    friendFriends = friendFriends.filter(f => f.friendId !== userId);
    await db.set(`friends.${friendId}`, friendFriends);
  }

  async save() {
    let userFriends = (await db.get(`friends.${this.userId}`)) || [];
    const index = userFriends.findIndex(f => f.friendId === this.friendId);
    if (index >= 0) {
      userFriends[index].alias = this.alias;
      await db.set(`friends.${this.userId}`, userFriends);
    }
  }

  setUserId(userId) {
    this.userId = userId;
  }

  getUserId() {
    return this.userId;
  }

  setFriendId(friendId) {
    this.friendId = friendId;
  }

  getFriendId() {
    return this.friendId;
  }

  setAlias(alias) {
    this.alias = alias;
  }

  getAlias() {
    return this.alias;
  }
};
const db = require('@common/db');
const clanConfig = require("@config/clan");
const ClanRoles = require("@constants/ClanRoles");
const Model = require("@models/Model");
const ClanMember = require("@models/ClanMember");
const Page = require("@models/Page");

module.exports = class Clan extends Model {
  constructor(clanId) {
    super();
    this.clanId = clanId;
    this.name = "";
    this.picUrl = "";
    this.tags = [];
    this.details = "";
    this.experience = 0;
    this.level = 1;
    this.memberCount = 0;
    this.freeVerify = 0;
    this.language = "";
    this.creationTime = 0;
  }

  /** @returns {Promise<Clan|null>} */
  static async fromClanId(clanId) {
    const clanData = db.get(`clans.${clanId}`);
    if (clanData) return Model.fromJson(Clan, clanData);
    return null;
  }

  /** @returns {Promise<Page>} */
  static async search(clanId, query, pageNo, pageSize) {
    // Get all clan entries
    const allClans = db.get("clans") || {};
    const filteredClans = Object.values(allClans)
      .filter(c => c.name.startsWith(query) && c.clanId !== clanId);

    const totalSize = filteredClans.length;

    // Paginate
    const startIndex = Page.getStartIndex(pageNo, pageSize);
    const pagedClans = filteredClans.slice(startIndex, startIndex + pageSize)
      .map(c => Model.fromJson(Clan, c).response());

    return new Page(pagedClans, totalSize, pageNo, pageSize);
  }

  /** @returns {Promise<Boolean>} */
  static async exists(clanId) {
    return db.has(`clans.${clanId}`);
  }

  async addMember(userId, role) {
    const clanMember = new ClanMember(userId);
    clanMember.setClanId(this.clanId);
    clanMember.setRole(role);
    await clanMember.save();

    this.memberCount++;
    await this.save();
  }

  async removeMember(userId) {
    const clanMember = await ClanMember.fromUserId(userId);
    if (!clanMember || clanMember.getClanId() !== this.clanId) return false;

    await clanMember.delete();

    this.memberCount = Math.max(0, this.memberCount - 1);
    await this.save();

    return true;
  }

  /** @returns {Promise<Array>} */
async getMembers(onlyAuthorities) {
  const allClanMembers = db.get("clan_members") || {};
  
  const filtered = Object.values(allClanMembers).filter(m => {
    // Ensure clan match
    if (m.clanId !== this.clanId) return false;

    // Convert role to number if needed
    const role = typeof m.role === "string" ? parseInt(m.role) : m.role;

    // Authority check
    if (onlyAuthorities) return role > ClanRoles.MEMBER;

    return true;
  });

  const result = [];
  for (const m of filtered) {
    const memberObj = Model.fromJson(ClanMember, m);
    const memberInfo = await memberObj.getInfo();
    if (memberInfo) result.push(memberInfo); // Prevent null entries
  }

  return result;
}

  /** @returns {Promise<Number>} */
  async getElderCount() {
    const allClanMembers = db.get("clan_members") || {};
    return Object.values(allClanMembers)
      .filter(m => m.clanId === this.clanId && m.role === ClanRoles.ELDER).length;
  }

  addExperience(experience) {
    this.experience += experience;

    const clanLevelConfig = clanConfig.levels[this.level];
    if (clanLevelConfig?.upgradeExperience != null && this.experience >= clanLevelConfig.upgradeExperience) {
      this.level++;
    }
  }

  async create() {
    db.set(`clans.${this.clanId}`, this);
  }

  async save() {
    db.set(`clans.${this.clanId}`, this);
  }

  async delete() {
    db.delete(`clans.${this.clanId}`);
    // TODO: also remove clan members and related keys
  }

  response(shownMembers) {
    return {
      clanId: this.clanId,
      currentCount: this.memberCount,
      details: this.details,
      experience: this.experience,
      headPic: this.picUrl,
      level: this.level,
      name: this.name,
      maxCount: clanConfig.levels[this.level]?.maxCount || 0,
      clanMembers: shownMembers,
      tags: this.tags,
      freeVerify: this.freeVerify,
    };
  }

  // Getters and setters (unchanged)
  setClanId(clanId) { this.clanId = clanId; }
  getClanId() { return this.clanId; }
  setName(name) { this.name = name; }
  getName() { return this.name; }
  getMemberCount() { return this.memberCount; }
  setDetails(details) { this.details = details; }
  getDetails() { return this.details; }
  setExperience(exp) { this.experience = exp; }
  getExperience() { return this.experience; }
  setProfilePic(picUrl) { this.picUrl = picUrl; }
  getProfilePic() { return this.picUrl; }
  setLevel(level) { this.level = level; }
  getLevel() { return this.level; }
  setTags(tags) { this.tags = tags; }
  getTags() { return this.tags; }
  setVerification(freeVerify) { this.freeVerify = freeVerify; }
  getVerification() { return this.freeVerify; }
  setCreationTime(creationTime) { this.creationTime = creationTime; }
  getCreationTime() { return this.creationTime; }
};
const db = require("@common/db");

module.exports = class Wealth {
constructor(userId) {
this.userId = userId;
this.golds = 0;
this.diamonds = 0;
this.clanGolds = 0;
}

/** @returns {Wealth} */  
static fromJson(json) {  
    const wealth = new Wealth(json.userId);  
    wealth.golds = json.golds ?? 0;  
    wealth.diamonds = json.diamonds ?? 0;  
    wealth.clanGolds = json.clanGolds ?? 0;  
    return wealth;  
}  

/** @returns {Promise<Wealth>} */  
static async fromUserId(userId) {  
    const data = db.get(`wealth.${userId}`);  
    if (data) return Wealth.fromJson(data);  
    return new Wealth(userId);  
}  
 
async save() {  
    db.set(`wealth.${this.userId}`, {  
        userId: this.userId,  
        golds: this.golds,  
        diamonds: this.diamonds,  
        clanGolds: this.clanGolds  
    });  
}  

setGold(gold) {  
    this.golds = gold;  
}  

getGold() {  
    return this.golds;  
}  

setDiamonds(diamonds) {  
    this.diamonds = diamonds;  
}  

getDiamonds() {  
    return this.diamonds;  
}  

setClanGolds(clanGold) {  
    this.clanGolds = clanGold;  
}  

getClanGolds() {  
    return this.clanGolds;  
}

}

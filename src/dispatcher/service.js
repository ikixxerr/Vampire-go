const dressing = require("@common/dressing");
const responses = require("@common/responses");
const webtoken = require("@common/webtoken");
const hostConfig = require("@config/host");
const GameAccount = require("@models/GameAccount");
const User = require("@models/User");
const Vip = require("@models/Vip");
const ServerUser = require("@models/ServerUser");
const decorationServiceBase = require("@decoration-service/base");
const RoomController = require("@room/controller");

async function dispatchUser(userId, gameToken) {
    if (!userId || !gameToken) {
        return responses.requiresUserAuthParams();    
    }

    const user = await User.fromUserId(userId);
    if (user == null) {
        return responses.profileNotExists();
    }

    const gameAccount = await GameAccount.fromUserId(userId);
    if (gameAccount == null) {
        return responses.dispatchAuthFailed();
    }

    const { isValid } = webtoken.verify(gameToken, gameAccount.getAccessToken());
    if (!isValid) {
        return responses.dispatchAuthFailed();
    }

    const vip = await Vip.fromUserId(userId);

    const userDresses = await decorationServiceBase.getEquippedDresses(userId);
    const gameSkinData = dressing.getGameDresses(userDresses);

    // TODO: Select random server or start server automatically
    const serverIp = `${hostConfig.gameHost}:${hostConfig.gamePort}`;
    
    RoomController.sendUserToServer(serverIp, new ServerUser({
        userId: user.getUserId(),
        sex: user.getSex(),
        vip: vip.getLevel(),
        skin: gameSkinData
    }));

    // TODO: Map
    return responses.success({
        gaddr: serverIp,
        name: "m_1008",
        mname: "m_1008",
        downurl: `${hostConfig.cdnHost}/m1008.zip`,
        mid: "m_1008"
    });
}

module.exports = {
    dispatchUser: dispatchUser
  }

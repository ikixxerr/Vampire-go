const logger = require("@common/logger");
const responses = require("@common/responses");
const friendConfig = require("@config/friend");
const RequestStatuses = require("@constants/RequestStatuses");
const Friend = require("@models/Friend");
const FriendRequest = require("@models/FriendRequest");
const GameStatus = require("@models/GameStatus");
const Localization = require("@models/Localization");
const Page = require("@models/Page");
const User = require("@models/User");
const db = require("@common/db"); // <-- Make sure this is imported here

async function getFriendList(userId, pageNo, pageSize) {
    const friends = await Friend.listFromUserId(userId, pageNo, pageSize);
    return responses.success(friends);
}

async function getFriendRequestList(userId, pageNo, pageSize) {
    const friendRequests = await FriendRequest.listFromUserId(userId, pageNo, pageSize);
    return responses.success(friendRequests);
}

async function searchFriendByNickname(userId, nickName, pageNo, pageSize) {
    if (!nickName) {
        return responses.success(Page.empty());
    }

    const excludeList = await Friend.listIdsFromUserId(userId);
    const results = await Friend.search(userId, nickName, excludeList, pageNo, pageSize);
    return responses.success(results);
}

async function searchFriendById(userId, friendId) {
    if (userId == friendId) {
        return responses.success();
    }

    const hasFriend = await Friend.isFriend(userId, friendId);
    if (hasFriend) {
        return responses.success();
    }

    const isFriendExists = await User.exists(friendId);
    if (!isFriendExists) {
        return responses.success();
    }

    return getFriendInfo(userId, friendId);
}

async function sendFriendRequest(userId, friendId, message) {
    const hasFriend = await Friend.isFriend(userId, friendId);
    if (hasFriend) {
        return responses.alreadyFriend();
    }

    const user = await User.fromUserId(userId);
    const userLocale = await Localization.fromUserId(userId);

    const request = new FriendRequest();
    request.setUserId(friendId); // receiver
    request.setFriendId(userId); // sender
    request.setMessage(message);
    request.setProfilePic(user.getProfilePic());
    request.setNickname(user.getNickname());
    request.setSex(user.getSex());
    request.setCountry(userLocale.getCountry());
    request.setLanguage(userLocale.getLanguage());
    request.setCreationTime(Date.now());
    await request.save(); // added await for save

    // TODO: Replace the content of the request if exists

    return responses.success();
}

async function deleteFriend(userId, friendId) {
    const hasFriend = await Friend.isFriend(userId, friendId);
    if (!hasFriend) {
        return responses.notValidUser();
    }

    await Friend.removeFriend(userId, friendId);  // added await   
    return responses.success();
}

async function addFriendAlias(userId, friendId, alias) {
    const friend = await Friend.fromUserId(userId, friendId);
    if (!friend) {
        return responses.notValidUser();
    }

    if (alias) {
        friend.setAlias(alias);
        await friend.save();
    }

    return responses.success();
}

async function deleteFriendAlias(userId, friendId) {
    const friend = await Friend.fromUserId(userId, friendId);
    if (!friend) {
        return responses.notValidUser();
    }

    if (friend.getAlias()) {
        friend.setAlias(null);
        await friend.save();
    }

    return responses.success();
}

async function acceptFriendRequest(userId, friendId) {
    const isFriendExists = await User.exists(friendId);
    if (userId == friendId || !isFriendExists) {
        return responses.notValidUser();
    }

    const friendRequest = await FriendRequest.fromFriendId(userId, friendId);
    if (!friendRequest) {
        return responses.notValidUser();
    }

    friendRequest.setStatus(RequestStatuses.ACCEPTED);
    await friendRequest.save();

    await Friend.addFriend(userId, friendId); // added await
    return responses.success();
}

async function rejectFriendRequest(userId, friendId) {
    const isFriendExists = await User.exists(friendId);
    if (userId == friendId || !isFriendExists) {
        return responses.notValidUser();
    }

    const friendRequest = await FriendRequest.fromFriendId(userId, friendId);
    if (!friendRequest) {
        return responses.notValidUser();
    }

    friendRequest.setStatus(RequestStatuses.REFUSED);
    await friendRequest.save();

    return responses.success();
}

async function getFriendInfo(userId, friendId) {
    const isFriendExists = await User.exists(friendId);
    if (!isFriendExists) {
        return responses.userNotExists();
    }

    const friendInfo = await Friend.getInfo(friendId);
    const friend = await Friend.fromUserId(userId, friendId);

    if (friend) {
        friendInfo.friend = true;
        friendInfo.alias = friend.getAlias();
    }

    return responses.success(friendInfo);
}

async function getFriendStatus(userId) {
    const userFriendList = await Friend.listIdsFromUserId(userId);
    const data = {
        curFriendCount: userFriendList.length,
        maxFriendCount: friendConfig.maxFriends,
        status: []
    };

    for (let i = 0; i < userFriendList.length; i++) {
        const friendGameStatus = new GameStatus(userFriendList[i]);
        data.status.push(friendGameStatus);
    }

    return responses.success(data);
}

async function getFriendRecommendation(userId) {
  // 1. Get all profiles with keys ending ".profile"
  const profiles = db.find('.profile');

  // 2. Get current friend IDs as an array (assuming this returns array of user IDs)
  const currentFriendIds = await Friend.listIdsFromUserId(userId);

  // 3. Create a set of userIds to exclude (friends + yourself)
  const excludeSet = new Set(currentFriendIds.concat(userId));

  // 4. Filter profiles to exclude those userIds
  const recommended = profiles
    .filter(profile => !excludeSet.has(profile.userId))
    .map(profile => ({
      userId: profile.userId,
      sex: profile.sex === 1 ? 'male' : 'female',
      nickName: profile.nickName,
    }));
   console.log(recommended);
  // 5. Return success response with recommended list
  return responses.success(recommended);
}

module.exports = {
    getFriendList,
    getFriendRequestList,
    searchFriendByNickname,
    searchFriendById,
    sendFriendRequest,
    deleteFriend,
    addFriendAlias,
    deleteFriendAlias,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendInfo,
    getFriendStatus,
    getFriendRecommendation
}
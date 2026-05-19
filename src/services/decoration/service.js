const dressing = require("@common/dressing");
const responses = require("@common/responses");
const DressOwnerTypes = require("@constants/DressOwnerTypes");
const base = require("@decoration-service/base");
const DressOptions = require("@models/DressOptions");
const Page = require("@models/Page");

async function getDressListByType(userId, categoryId, pageNo, pageSize) {
    const ownedDresses = await base.getOwnedDresses(userId);
    const usingDresses = await base.getEquippedDresses(userId);

    if (ownedDresses.length == 0) {
        responses.success([]);
    }
    
    const filteredDresses = dressing.getDresses(new DressOptions({
        categoryId: categoryId,
        ownerFilter: ownedDresses,
        usingFilter: usingDresses,
        ownerType: DressOwnerTypes.STRICT,
    }));

    const data = new Page(filteredDresses, filteredDresses.length, pageNo, pageSize);
    return responses.success(data);
}

async function getEquippedDresses(targetId) {
    const equippedDressesInfo = [];

    const equippedDresses = await base.getEquippedDresses(targetId);
    for (var i = 0; i < equippedDresses.length; i++) {
        const dressInfo = dressing.getDressInfo(equippedDresses[i]);
        if (dressInfo == null) continue;

        dressInfo.status = 1;
        equippedDressesInfo.push(dressInfo);
    }

    return responses.success(equippedDressesInfo);
}

async function useDress(userId, decorationId) {
    const ownedDresses = await base.getOwnedDresses(userId);
    if (!ownedDresses.includes(decorationId)) {
        return responses.dressNotOwned();
    }

    const equippedDresses = await base.getEquippedDresses(userId);
    const dressInfo = dressing.getDressInfo(decorationId);
    if (equippedDresses.includes(decorationId)) {
        return responses.success(dressInfo);
    }

    for (var i = 0; i < equippedDresses.length; i++) {
        let typeId = decorationId.toString().substring(0, decorationId.toString().length - 5);
        if (equippedDresses[i].toString().startsWith(typeId)) {
            equippedDresses.splice(i, 1);
        }
    }

    equippedDresses.push(decorationId);
    await base.setEquippedDresses(userId, equippedDresses);

    return responses.success(dressInfo);
}

async function removeDress(userId, decorationId) {
    const ownedDresses = await base.getOwnedDresses(userId);
    if (!ownedDresses.includes(decorationId)) {
        return responses.dressNotOwned();
    }

    const equippedDresses = await base.getEquippedDresses(userId);
    if (!equippedDresses.includes(decorationId)) {
        return responses.success();
    }

    for (var i = 0; i < equippedDresses.length; i++) {
        if (equippedDresses[i] == decorationId) {
            equippedDresses.splice(i, 1);
        }
    }

    await base.setEquippedDresses(userId, equippedDresses);
    return responses.success();
}

module.exports = {
    getDressListByType: getDressListByType,
    getEquippedDresses: getEquippedDresses,
    useDress: useDress,
    removeDress: removeDress
}
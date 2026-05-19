const service = require("@dispatcher/service");

async function dispatchUser(request) {
    return await service.dispatchUser(request.headers["x-shahe-uid"], request.headers["x-shahe-token"]);
}

module.exports = [
    {
        "path": "/v1/dispatch",
        "methods": ["POST"],
        "functions": [dispatchUser]
    }
]
const service = require("@account-service/service");

async function appAuthToken(request) {
    return await service.appAuthToken(request.getUserId());
}

async function appRenew(request) {
    return await service.appRenew();
}

async function appSetPassword(request) {
    return await service.appSetPassword(request.getUserId(), request.body.password);
}

async function appLogin(request) {
    return await service.appLogin(request.body.uid, request.body.password);
}

async function userLogout(request) {
    return await service.userLogout(request.getUserId());
}

async function modifyPassword(request) {
    return await service.modifyPassword(request.getUserId(), request.body.oldPassword, request.body.newPassword);
}

async function sendEmailBind(request) {
    return await service.sendEmailBind(
        request.getUserId(),
        request.headers["access-token"],
        request.body.email,
        parseInt(request.query?.bindType ?? "0", 10)
    );
}

async function emailBind(request) {
    return await service.emailBind(
        request.getUserId(),
        request.headers["access-token"],
        request.query.verifyCode
    );
}

async function unbindEmail(request) {
    return await service.unbindEmail(
        request.getUserId(),
        request.headers["access-token"]
    );
}

module.exports = [
    {
        path: "/user/api/v1/app/auth-token",
        methods: ["GET"],
        functions: [appAuthToken]
    },
    {
        path: "/user/api/v1/app/renew",
        methods: ["POST"],
        functions: [appRenew]
    },
    {
        path: "/user/api/v1/app/set-password",
        methods: ["POST"],
        functions: [appSetPassword]
    },
    {
        path: "/user/api/v1/app/login",
        methods: ["POST"],
        functions: [appLogin]
    },
    {
        path: "/user/api/v1/login-out",
        methods: ["PUT"],
        functions: [userLogout]
    },
    {
        path: "/user/api/v1/user/password/modify",
        methods: ["POST"],
        functions: [modifyPassword]
    },
    {
        path: "/user/api/v1/email/send",
        methods: ["POST"],
        functions: [sendEmailBind]
    },
    {
        path: "/user/api/v1/email/bind",
        methods: ["POST", "DELETE"],
        functions: [emailBind, unbindEmail]
    }
];
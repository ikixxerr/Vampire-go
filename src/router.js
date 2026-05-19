const express = require("express");

const logger = require("@common/logger");
const responses = require("@common/responses");
const multer = require("@common/multer");
const middlewares = require("@common/middlewares");
const modules = require("@config/modules");
const requirements = require("@config/requirements");

function init(app) {
    app.use(express.json());

    // Dispatcher controller endpoints
    const dispEndpoints = require("@dispatcher/controller");
    for (var i = 0; i < dispEndpoints.length; i++) {
        createEndpoint(app, dispEndpoints[i]);
    }

    // Static endpoints (e.g., file uploads)
    createStaticEndpoints(app);

    // Module service endpoints
    for (var i = 0; i < modules.length; i++) {
        const endpoints = require(`@${modules[i]}-service/controller`);
        for (var j = 0; j < endpoints.length; j++) {
            createEndpoint(app, endpoints[j]);
        }
    }

    // Add the loader endpoint for checking active endpoints
    createLoaderEndpoint(app);

    // Catch-all for undefined routes
    app.all("*", (req, res) => {
        const notFound = responses.notFound();
        logger.warn(`Endpoint may not be implemented: [${req.method}] ${req.url}`);
        logger.warn(`Endpoint headers: ${JSON.stringify(req.headers, null, 4)}`);
        logger.warn(`Endpoint body: ${JSON.stringify(req.body, null, 4)}`);
        res.status(notFound.status).json(notFound.content);
    });
}

function createStaticEndpoints(app) {
    app.all("/", (req, res) => {
        res.send("Hello World");
    });

    app.all("/user/api/v1/file", multer.upload.any(), (req, res) => {
        if (req.files == undefined || req.files.length == 0) {
            const innerError = responses.innerError();
            res.status(innerError.status).json(innerError.content);
            return;
        }

        const fullPath = multer.getFullPath(req.files[0].filename);
        const success = responses.success(fullPath);
        res.status(success.status).send(success.content);
    });

    app.all("/database/files/*", (req, res) => {
        const response = multer.getFile(req.params[0]);
        if (response.status != 200) {
            res.status(response.status).json(response.content);
            return;
        }

        res.send(response.content);
    });
}

function createEndpoint(app, endpoint) {
    app.all(endpoint.path, async (req, res) => {
        try {
            var startTime = Date.now();
            if (!endpoint.methods.includes(req.method)) {
                const methodNotAllowed = responses.methodNotAllowed();
                logger.warn(`Warning for API: ${req.url}`);
                logger.warn(`Endpoint method (${req.method}) may not be implemented: ${req.url}`);
                logger.warn("Did an endpoint-collision occur?");

                res.status(methodNotAllowed.status).json(methodNotAllowed.content);
                return;
            }

            if (!requirements.bypassAuthCheck.includes(endpoint.path)) {
                const { hasSucceeded, response } = await middlewares.userAuthentication(req);
                if (!hasSucceeded) {
                    res.status(response.status).json(response.content);
                    return;
                }

                if (!requirements.bypassProfileCheck.includes(endpoint.path)) {
                    const { hasProfile, response } = await middlewares.checkForUserProfile(req);
                    if (!hasProfile) {
                        res.status(response.status).json(response.content);
                        return;
                    }
                }
            }

            const response = await endpoint.functions[endpoint.methods.indexOf(req.method)](req);
            res.status(response.status).json(response.content);

            var stopTime = Date.now();
            logger.info(`[${req.url}] Sent ${req.method}: ${response.status}. Operation took ${stopTime - startTime}ms`);

            if (response.status == 500) {
                logger.error(`Response error: ${JSON.stringify(response.content)}`);
            }
        } catch (e) {
            logger.error(`Error occurred with API: ${req.url}`);
            logger.error(e);

            const innerError = responses.innerError();
            res.status(innerError.status).json(innerError.content);
        }
    });
}

function getActiveEndpoints(app) {
    const routes = [];

    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            const methods = Object.keys(middleware.route.methods).map(method => method.toUpperCase());
            routes.push({ path: middleware.route.path, methods });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    const methods = Object.keys(handler.route.methods).map(method => method.toUpperCase());
                    routes.push({ path: handler.route.path, methods });
                }
            });
        }
    });

    return routes;
}

function createLoaderEndpoint(app) {
    app.get("/loader/endpoints", (req, res) => {
        const activeEndpoints = getActiveEndpoints(app);
        const success = responses.success(activeEndpoints);
        logger.info(`Loader endpoint accessed: returning ${activeEndpoints.length} active endpoints.`);
        res.status(success.status).json(success.content);
    });
}

module.exports = init;
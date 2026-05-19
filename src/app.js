require("module-alias/register");

const express = require("express");
const app = express();
require("./router")(app);
const path = require("path");
const database = require("@common/database");
const dressing = require("@common/dressing");
//const redis = require("@common/redis");


database.init();
dressing.init();
//redis.init();

require("@dispatcher/room")();  // Uncomment if necessary

const logger = require("@common/logger");
const config = require("@config/host");

// Middleware to explicitly set Keep-Alive header
app.use((req, res, next) => {
    res.setHeader('Connection', 'keep-alive');
    next();
});

// Start Express.js server
const server = app.listen(config.apiPort, "0.0.0.0", () => {
    const port = config.apiPort;
    const pid = process.pid;

    const banner = `
╔══════════════════════════════════════╗
║ 🚀 API Server Started Successfully!  ║
╠══════════════════════════════════════╣
║ 📡 Listening on    : 0.0.0.0:${port}    ║
║ 🆔 Worker PID      : ${pid}           ║
╚══════════════════════════════════════╝
`;

    logger.info(banner);
});

// Load keepAlive settings from the new file
require('./KeepAlive')(server, logger);

const network = require("net");
const hostConfig = require("@config/host");
const logger = require("@common/logger");
const controller = require("@room/controller");
const ServerManager = require("@room/ServerManager");

const server = network.createServer((socket) => {
  socket.on("data", (data) => {
      controller.handleResponse(socket, data);
  });

  socket.on("error", (err) => {
    if (err.message.includes("ECONNRESET")) {
      logger.error("Server disconnected unexpectedly: Did the server crash?");
    } else {
      logger.error(err);
    }
  });

  socket.on("close", () => {
    logger.info("Server disconnected from room");
    ServerManager.removeServer(socket);
  });
});

module.exports = () => {
  hostConfig.roomPort ??= 9100;
  server.listen(hostConfig.roomPort, () => {
    logger.info(`Room server started PORT=${hostConfig.roomPort}`);
  });
}
const servers = new Map();

function addServer(serverSocket, serverAddr) {
  servers.set(serverSocket, {
    socket: serverSocket,
    serverAddr: serverAddr,
    connectedClients: new Set(),
  });
}

function removeServer(socket) {
  const serverData = servers.get(socket);
  if (serverData) {
    for (const clientSocket of serverData.connectedClients) {
      clientSocket.end(); // Disconnect connected clients
    }
    servers.delete(socket);
  }
}

function removeServerByAddr(serverAddr) {
  for (const [socket, server] of servers) {
    if (server.serverAddr === serverAddr) {
      removeServer(socket);
      break;
    }
  }
}

function getServerSocket(serverAddr) {
  for (const server of servers.values()) {
    if (server.serverAddr === serverAddr) {
      return server.socket;
    }
  }
  return null; // Return null if not found
}

function getAllServers() {
  return Array.from(servers.values());
}

function serverExists(serverAddr) {
  return getServerSocket(serverAddr) !== null;
}

function getServerCount() {
  return servers.size;
}

function clearServers() {
  for (const [socket, server] of servers) {
    removeServer(socket);
  }
}

function iterateServers(callback) {
  for (const server of servers.values()) {
    callback(server);
  }
}

async function iterateServersAsync(callback) {
  for (const server of servers.values()) {
    await callback(server);
  }
}

function getRandomServer() {
  const serversArray = Array.from(servers.values());
  const randomIndex = Math.floor(Math.random() * serversArray.length);
  return serversArray[randomIndex];
}

function broadcastToAllClients(data) {
  for (const server of servers.values()) {
    for (const clientSocket of server.connectedClients) {
      clientSocket.write(data);
    }
  }
}

function broadcastToClientsByServerAddr(serverAddr, data) {
  const server = getServerSocket(serverAddr);
  if (server) {
    for (const clientSocket of server.connectedClients) {
      clientSocket.write(data);
    }
  }
}

function getConnectedClients(serverAddr) {
  const server = getServerSocket(serverAddr);
  if (server) {
    return Array.from(server.connectedClients);
  }
  return [];
}

module.exports = {
  addServer: addServer,
  removeServer: removeServer,
  removeServerByAddr: removeServerByAddr,
  getServerSocket: getServerSocket,
  getAllServers: getAllServers,
  serverExists: serverExists,
  getServerCount: getServerCount,
  clearServers: clearServers,
  iterateServers: iterateServers,
  iterateServersAsync: iterateServersAsync,
  getRandomServer: getRandomServer,
  broadcastToAllClients: broadcastToAllClients,
  broadcastToClientsByServerAddr: broadcastToClientsByServerAddr,
  getConnectedClients: getConnectedClients,
};

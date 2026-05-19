module.exports = function (server, logger) {
    // Set the keepAliveTimeout directly on the server
    server.keepAliveTimeout = 60000;  // 60 seconds for keep-alive
    server.headersTimeout = 62000;    // Slightly longer to allow headers to finish
    
    // Log if keepAlive is enabled
    if (server.keepAliveTimeout) {
        logger.info("keepAlive is enabled with timeout: " + server.keepAliveTimeout + " ms");
    }
};

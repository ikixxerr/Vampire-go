const cluster = require('cluster');
const os = require('os');
const logger = require("./common/logger");
const numCPUs = os.cpus().length;  // Get number of CPU cores

if (cluster.isMaster) {
    logger.info(`Master process is running with PID ${process.pid}`);

    // Fork workers based on CPU cores
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();  // Create a worker process
    }

    // Restart a worker if it dies
    cluster.on('exit', (worker, code, signal) => {
        logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });

} else {
    // Worker process: Set up your Express server here
    require('./app');  // Import your existing Express server code
}

const path = require('path');
const SQLiteDB = require('./sqlite'); // Your SQLiteDB class file (the big class you posted)

// Create and export a single shared instance:
const dbFile = path.resolve(__dirname, 'database.db');
const db = new SQLiteDB(dbFile);

module.exports = db;
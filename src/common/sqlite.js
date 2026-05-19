const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

class SQLiteDB {
  constructor(file = 'database.db') {
    this.file = file;
    this.db = null;
    this.SQL = null;
    this.ready = this._init();
  }

  async _init() {
    this.SQL = await initSqlJs();

    // Load existing DB file or create new DB
    if (fs.existsSync(this.file)) {
      const fileBuffer = fs.readFileSync(this.file);
      this.db = new this.SQL.Database(fileBuffer);
    } else {
      this.db = new this.SQL.Database();
      this.db.run(`
        CREATE TABLE IF NOT EXISTS kv (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
      await this._save();
    }
  }

  // Save the database to the file
  async _save() {
    const data = this.db.export();
    fs.writeFileSync(this.file, Buffer.from(data));
  }

  _serialize(value) {
    return JSON.stringify(value);
  }

  _deserialize(value) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  _getNested(obj, path) {
    return path.split('.').reduce((o, k) => (o || {})[k], obj);
  }

  _setNested(obj, path, value) {
    const keys = path.split('.');
    let ref = obj;
    while (keys.length > 1) {
      const key = keys.shift();
      if (typeof ref[key] !== 'object' || ref[key] === null) ref[key] = {};
      ref = ref[key];
    }
    ref[keys[0]] = value;
    return obj;
  }

  async set(key, value) {
    await this.ready;
    const [base, ...nested] = key.split('.');
    if (!nested.length) {
      const val = this._serialize(value);
      // Upsert query in sql.js style
      this.db.run(`INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)`, [base, val]);
      await this._save();
      return value;
    }

    const data = (await this.get(base)) || {};
    const updated = this._setNested(data, nested.join('.'), value);
    return this.set(base, updated);
  }

  async get(key) {
    await this.ready;
    const [base, ...nested] = key.split('.');
    const stmt = this.db.prepare(`SELECT value FROM kv WHERE key = ?`);
    stmt.bind([base]);
    if (!stmt.step()) {
      stmt.free();
      return undefined;
    }
    const row = stmt.getAsObject();
    stmt.free();

    const data = this._deserialize(row.value);
    return nested.length ? this._getNested(data, nested.join('.')) : data;
  }

  async has(key) {
    const data = await this.get(key);
    return data !== undefined && data !== null;
  }

  async delete(key) {
    await this.ready;
    const [base, ...nested] = key.split('.');
    if (!nested.length) {
      this.db.run(`DELETE FROM kv WHERE key = ?`, [base]);
      await this._save();
      return true;
    }

    const data = await this.get(base);
    if (!data) return false;

    const keys = nested.join('.').split('.');
    let ref = data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (typeof ref !== 'object' || !(keys[i] in ref)) return false;
      ref = ref[keys[i]];
    }
    if (!(keys.at(-1) in ref)) return false;

    delete ref[keys.at(-1)];
    await this.set(base, data);
    return true;
  }

  async push(key, value) {
    const arr = await this.get(key);
    if (!Array.isArray(arr)) {
      return this.set(key, [value]);
    }
    arr.push(value);
    return this.set(key, arr);
  }

  async pull(key, value) {
    const arr = await this.get(key);
    if (!Array.isArray(arr)) return false;
    const newArr = arr.filter(v => v !== value);
    if (newArr.length === arr.length) return false;
    await this.set(key, newArr);
    return true;
  }

  async all(prefix = '') {
    await this.ready;
    const stmt = this.db.prepare(`SELECT key, value FROM kv WHERE key LIKE ?`);
    stmt.bind([`${prefix}%`]);
    const result = {};
    while (stmt.step()) {
      const row = stmt.getAsObject();
      result[row.key] = this._deserialize(row.value);
    }
    stmt.free();
    return result;
  }

  async clear() {
    await this.ready;
    this.db.run(`DELETE FROM kv`);
    await this._save();
  }
}

module.exports = SQLiteDB;
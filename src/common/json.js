const fs = require('fs');
const path = require('path');

class JSONdb {
  constructor(fileName = 'database.json') {
    this.filePath = path.resolve(__dirname, fileName);
    this.data = {};
    this._isDirty = false;
    this._isWriting = false;
    this._flushPromise = Promise.resolve();
    this._load();
    this._setupAutoFlush();

    process.on('uncaughtException', (err) => {
      try {
        this.flushSync();
      } catch (e) {
        console.error('Failed to flush DB on uncaughtException:', e);
      }
      console.error('Uncaught exception:', err);
      process.exit(1);
    });

    process.on('exit', () => this.flushSync());
    process.on('SIGINT', () => {
      this.flushSync();
      process.exit();
    });
  }

  _load() {
    if (fs.existsSync(this.filePath)) {
      try {
        this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      } catch {
        this.data = {};
      }
    } else {
      this.flushSync(); // Ensure file is created
    }
  }

  async _writeToDisk(data) {
    const dir = path.dirname(this.filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    return fs.promises.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  _writeToDiskSync(data) {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  _setupAutoFlush() {
    this._flushInterval = setInterval(() => this._scheduleFlush(), 5000);
  }

  _scheduleFlush() {
    if (!this._isDirty) return;
    this._flushPromise = this._flushPromise.then(() => {
      if (!this._isDirty) return;
      this._isWriting = true;
      return this._writeToDisk(this.data)
        .catch(console.error)
        .finally(() => {
          this._isWriting = false;
          this._isDirty = false;
        });
    });
  }

  _markDirty() {
    this._isDirty = true;
  }

  _parseKey(key) {
    return key.split('.');
  }

  _resolve(key) {
    const keys = this._parseKey(key);
    let obj = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    return [obj, keys[keys.length - 1]];
  }

  set(key, value) {
    const [parent, lastKey] = this._resolve(key);
    parent[lastKey] = value;
    this._markDirty();
    return value;
  }

  get(key) {
    const keys = this._parseKey(key);
    let result = this.data;
    for (const k of keys) {
      if (result == null || typeof result !== 'object') return undefined;
      result = result[k];
    }
    return result;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  delete(key) {
    const [parent, lastKey] = this._resolve(key);
    const exists = lastKey in parent;
    if (exists) {
      delete parent[lastKey];
      this._markDirty();
    }
    return exists;
  }

  push(key, value) {
    let arr = this.get(key);
    if (!Array.isArray(arr)) arr = [];
    arr.push(value);
    this.set(key, arr);
    return arr;
  }

  pull(key, value) {
    let arr = this.get(key);
    if (!Array.isArray(arr)) return false;
    const filtered = arr.filter(item => item !== value);
    if (filtered.length !== arr.length) {
      this.set(key, filtered);
      return true;
    }
    return false;
  }

  all() {
    return this.data;
  }

  clear() {
    this.data = {};
    this._markDirty();
  }

  async flush() {
    if (!this._isDirty) return;
    await this._writeToDisk(this.data);
    this._isDirty = false;
  }

  flushSync() {
    if (!this._isDirty) return;
    this._writeToDiskSync(this.data);
    this._isDirty = false;
  }

  stop() {
    if (this._flushInterval) {
      clearInterval(this._flushInterval);
      this._flushInterval = null;
    }
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  createCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
      this._markDirty();
      return true;
    }
    return false;
  }

  insert(collectionName, doc) {
    if (!this.data[collectionName]) this.createCollection(collectionName);

    const now = new Date().toISOString();
    const newDoc = {
      _id: this.generateUUID(),
      createdAt: now,
      updatedAt: now,
      ...doc,
    };
    this.data[collectionName].push(newDoc);
    this._markDirty();
    return newDoc;
  }

  // ✅ FIXED: use this.all()
  find(collectionKeyPrefix, filter = {}) {
  const allEntries = Object.entries(this.all())
    .filter(([key]) => key.startsWith(collectionKeyPrefix + '.'));

  const filterEntries = Object.entries(filter);

  return allEntries
    .map(([key, data]) => ({ key, data }))
    .filter(({ data }) =>
      filterEntries.every(([k, v]) => data[k] === v)
    )
    .map(({ key, data }) => {
      const userId = key.split('.')[1];
      return { userId, ...data };
    });
}

  // ✅ FIXED: use this.find()
  findOne(collectionKeySuffix, filter = {}) {
    return this.find(collectionKeySuffix, filter)[0] || null;
  }

  deleteMany(collectionName, filter = {}) {
    if (!this.data[collectionName]) return 0;

    const entries = Object.entries(filter);
    const originalLength = this.data[collectionName].length;

    this.data[collectionName] = this.data[collectionName].filter(
      doc => !entries.every(([key, val]) => doc[key] === val)
    );

    const deletedCount = originalLength - this.data[collectionName].length;
    if (deletedCount > 0) this._markDirty();
    return deletedCount;
  }
}

module.exports = JSONdb;
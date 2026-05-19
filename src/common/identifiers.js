const db = require("@common/db");

module.exports.getNextUserId = async () => {
  const current = await db.get('nextUserId') ?? 1000;
  const next = current + 16;
  await db.set('nextUserId', next);
  return next;
};

module.exports.getNextClanId = async () => {
  const current = await db.get('nextClanId') ?? 500;
  const next = current + 4;
  await db.set('nextClanId', next);
  return next;
};
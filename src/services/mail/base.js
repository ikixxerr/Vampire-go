const db = require("@common/db");
const MailStatuses = require("@constants/MailStatuses");
const Mail = require("@models/Mail");
const MailStatus = require("@models/MailStatus");

/** @returns {Promise<Mail[]>} */
async function getMailboxByUserId(userId, removeReadMails) {
    const userMails = (await db.get(`mailbox.${userId}`)) || [];
    const globalMails = (await db.get(`mailbox.0`)) || [];

    const mails = userMails.concat(globalMails).map(Mail.fromJson);

    const readMails = ((await db.get(`mailbox_record.${userId}`)) || []).map(MailStatus.fromJson);

    for (let mail of mails) {
        for (let read of readMails) {
            if (mail.getId() === read.getId()) {
                mail.setStatus(read.getStatus());
            }
        }
    }

    const filtered = [];
    for (let mail of mails) {
        const status = mail.getStatus();
        if (status === MailStatuses.DELETE) continue;
        if (removeReadMails && status === MailStatuses.READ) continue;
        filtered.push(mail);
    }

    return filtered;
}

module.exports = {
    getMailboxByUserId
};
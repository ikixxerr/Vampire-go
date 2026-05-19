const responses = require("@common/responses");
const MailAttachmentTypes = require("@constants/MailAttachmentTypes");
const MailStatuses = require("@constants/MailStatuses");
const MailAttachment = require("@models/MailAttachment");
const MailStatus = require("@models/MailStatus");
const Mail = require("@models/Mail");
const base = require("@mail-service/base");
const payServiceBase = require("@pay-service/base");
const decorationServiceBase = require("@decoration-service/base");
const userServiceBase = require("@user-service/base");
const db = require("@common/db");

async function getMailList(userId) {
    const mails = await base.getMailboxByUserId(userId);
    return responses.success(mails);
}

async function setMailStatus(userId, mailIds, targetStatus) {
    if (targetStatus < MailStatuses.READ || targetStatus > MailStatuses.DELETE) {
        return responses.invalidMailStatus();
    }

    const mails = await base.getMailboxByUserId(userId);
    if (mails.length === 0) {
        return responses.success();
    }

    const statuses = [];
    for (let mail of mails) {
        if (!mailIds.includes(mail.id)) continue;

        // Can't set status if mail isn't read
        if (mail.status === MailStatuses.UNREAD && targetStatus === MailStatuses.DELETE) continue;

        // Can't set status if attachments aren't claimed 
        if (
            mail.status === MailStatuses.UNREAD &&
            mail.getAttachments().length > 0 &&
            targetStatus > MailStatuses.UNREAD
        ) continue;

        statuses.push({ id: mail.id, status: targetStatus });
    }

    db.set(`mailbox_record.${userId}`, statuses);
    return responses.success();
}

async function receiveMailAttachment(userId, mailId) {
    const mails = await base.getMailboxByUserId(userId, true);
    let targetMail = mails.find(mail => mail.id === mailId);

    if (!targetMail) {
        return responses.mailNotFound();
    }

    const mailAttachments = targetMail.getAttachments();
    if (!mailAttachments || mailAttachments.length === 0) {
        return responses.mailHasNoAttachments();
    }

    for (let rawAttachment of mailAttachments) {
        const attachment = MailAttachment.fromJson(rawAttachment);

        switch (attachment.getType()) {
            case MailAttachmentTypes.CURRENCY:
                await payServiceBase.addCurrency(userId, attachment.getItemId(), attachment.getQuantity());
                break;
            case MailAttachmentTypes.DRESS:
                await decorationServiceBase.addDresses(userId, [attachment.getItemId()]);
                break;
            case MailAttachmentTypes.VIP:
                await userServiceBase.addVip(userId, attachment.getVipLevel(), attachment.getVipDuration());
                break;
        }
    }

    const mailStatus = new MailStatus();
    mailStatus.setId(targetMail.getId());
    mailStatus.setStatus(MailStatuses.READ);

    const existing = db.get(`mailbox_record.${userId}`) || [];
    const updated = existing.filter(status => status.id !== mailStatus.getId());
    updated.push({ id: mailStatus.getId(), status: mailStatus.getStatus() });

    db.set(`mailbox_record.${userId}`, updated);
    return responses.success();
}

async function hasNewMail(userId) {
    const mails = await base.getMailboxByUserId(userId);
    const hasNew = mails.some(mail => mail.getStatus() === MailStatuses.UNREAD);
    return responses.success(hasNew);
}

module.exports = {
    getMailList,
    setMailStatus,
    receiveMailAttachment,
    hasNewMail
};
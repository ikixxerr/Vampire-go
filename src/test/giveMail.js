const MailAttachmentType = require("@constants/MailAttachmentTypes");
const MailStatuses = require("@constants/MailStatuses");
const MailAttachment = require("@models/MailAttachment");
const MailStatus = require("@models/MailStatus");
const Mail = require("@models/Mail");
let MAIL_ID_COUNTER = Date.now(); // Replace with persistent counter in production

/**
 * Give mail to a user with optional attachments.
 * @param {string} userId - ID of the recipient user.
 * @param {Object} options
 * @param {string} options.title - Mail title.
 * @param {string} options.content - Mail content/body.
 * @param {number} [options.type=0] - Optional mail type.
 * @param {Array<Object>} [options.attachments=[]] - Array of attachment objects.
 * @returns {Promise<Mail>}
 */
async function giveMail(userId, {
  title,
  content,
  type = 0,
  attachments = []
}) {
  const mailId = MAIL_ID_COUNTER++;
  const now = Date.now();

  // Create the mail
  const mail = new Mail();
  mail.setId(mailId);
  mail.setTitle(title);
  mail.setContent(content);
  mail.sendSentDate(now);
  mail.setStatus(MailStatuses.UNREAD);
  mail.setType(type);
  mail.setAttachments(attachments);
  await mail.create();

  // Track mail status for this user
  const mailStatus = new MailStatus(userId);
  mailStatus.setId(mailId);
  mailStatus.setStatus(MailStatuses.UNREAD);
  await mailStatus.save();

  // Save each attachment
  for (const att of attachments) {
    const attachment = MailAttachment.fromJson({
      userId,
      mailId,
      name: att.name,
      qty: att.qty,
      icon: att.icon,
      itemId: att.itemId,
      type: att.type,
      vipLevel: att.vipLevel || 0,
      vipDuration: att.vipDuration || 0
    });
    await attachment.save();
  }

  return mail;
}

module.exports = giveMail;
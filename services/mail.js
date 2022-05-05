const nodemailer = require("nodemailer");
const config = require("config");

const sendMail = async (receiverEmailId, subjectOfMail, textOfmail) => {
  const transporter = nodemailer.createTransport({
    service: config.get("mailserverhost"),
    port: 2525,
    auth: {
      type: "OAuth2",
      user: config.get("mailserverid"),
      pass: config.get("mailserverpassword"),
      clientId: config.get("clientId"),
      clientSecret: config.get("clientSecret"),
      refreshToken:
        "1//04M09DEIdl9BvCgYIARAAGAQSNwF-L9IrPjSb6PFFO9JZdKwPZeCIshPDTRiZCxeyilkAP5hjfBDQTyhdlsM1cf6c-5CEthkv6w0",
    },
  });

  const mailOptions = {
    from: config.get("mailserverid"),
    to: receiverEmailId,
    subject: subjectOfMail,
    text: textOfmail,
  };
  await transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = sendMail;

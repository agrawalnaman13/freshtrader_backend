const nodemailer = require("nodemailer");
const config = require("config");

const sendMail = async (to, subject, body) => {
  const transporter = nodemailer.createTransport({
    host: config.get("mailserverhost"),
    port: 587,
    secure: false,
    // console: true,
    // ignoreTLS: false,
    requireTLS: true,
    auth: {
      user: config.get("mailserverid"),
      pass: config.get("mailserverpassword"),
    },
  });

  console.debug("From " + config.get("mailserverid"));
  console.debug("To " + to);
  console.debug("Subject " + subject);
  console.debug("Body " + body);

  var mailOptions = {
    from: config.get("mailserverid"),
    to: to,
    subject: subject,
    text: body,
    html: body,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error("Exception", error);
      // return res.status(500).json({
      //   code: "SERVER_ERROR",
      //   description: "something went wrong, Please try again",
      //   error: error,
      // });
    } else {
      console.info("Email sent: " + info.response);
      // return res.status(200).json({
      //   message: "Notification sent by mail successfully",
      //   data: info.response,
      // });
    }
  });
};

module.exports = sendMail;

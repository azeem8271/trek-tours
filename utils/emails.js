const nodemailer = require('nodemailer');

const sendMail = async (options) => {
  // 1.) Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // 2.) Define Email options
  const mailOptions = {
    from: 'Azeem Khan <azeem@khan.com>', // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: options.message, // plain text body
    // html: '<b>Hello world?</b>', // html body
  };
  // 3.) Send Mail
  await transporter.sendMail(mailOptions);
};

module.exports = sendMail;

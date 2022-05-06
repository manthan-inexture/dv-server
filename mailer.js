var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'digitalvalidator@gmail.com',
    pass: 'vyeS]7jM'
  }
});

// send Welcome mail to user
const sendWelcomeMail = (email, name) => {
  var mailOptions = {
    from: 'digitalvalidator@gmail.com',
    to: email,
    subject: 'Thank you for Joining in!',
    text: `Welcome to Digital Validator, ${name}.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

// send Event Registration mail to user
const sendEventRegistrationMail = (name, email, event_name, QRImage) => {
  var mailOptions = {
    from: 'digitalvalidator@gmail.com',
    to: email,
    subject: 'Event Registration',
    text: `Here is your QR Code for event`,
    html: `<p>Hi <strong>${name}</strong>,</p>
    <p>We are happy to have you here</p>
    <p>You have registered for <strong>${event_name}</strong> event</p>
    <p>Here is your qr code</p>
    <a href='cid:qr-code' download><img src='cid:qr-code' alt='qr-code' /></a>`,
    attachments: [
      {
        path: QRImage,
        cid: "qr-code"
      }
    ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

module.exports = {
  sendWelcomeMail,
  sendEventRegistrationMail
}

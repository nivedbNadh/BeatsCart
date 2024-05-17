const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

const { EMAIL_USERNAME, EMAIL_PASSWORD } = process.env;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USERNAME,
        pass: EMAIL_PASSWORD
    }
});

function generateOTP() {
    const timestamp = Date.now();
    const otp = Math.floor(1000 + Math.random() * 9000);
    return { otp, timestamp };
  }

function isOTPExpired(otp) {
    return otp.expiry < Date.now();
}

const otp1 = async function (req, res) {
    try {
        const existingUser = await User.findOne({
            email: { $regex: new RegExp("^" + req.body.email, "i") }
        });
        if (existingUser) {
            return res.redirect("/signup?error=User%20already%20exists");
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const email = req.body.email;
        req.session.user = {
            name: req.body.name,
            email: email,
            password: hashedPassword
        };

        const { otp, timestamp } = generateOTP();
        req.session.otp = { value: otp, expiry: timestamp + 2 * 60 * 1000 };

        const mailOptions = {
            to: email,
            subject: "Otp for registration is: ",
            html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>"
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
            res.redirect("/otp");
        });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).send("Internal Server Error");
    }
};

const otpVeify = async (req, res) => {
    try {
        const { otp1, otp2, otp3, otp4 } = req.body;
        const enteredOtp = otp1 + otp2 + otp3 + otp4;

        if (!req.session.otp || isOTPExpired(req.session.otp)) {
            req.flash('error', 'Time expired');
            return res.redirect('/otp');         }

        if (enteredOtp === req.session.otp.value.toString()) {
            const { name, email, password } = req.session.user;
            const hashedPassword = password;
            const newUser = new User({
                name: name,
                email: email,
                password: hashedPassword
            });

            console.log("newUser",newUser)
            await newUser.save();

          return res.redirect('/login');
        } else {
            req.flash('error', 'Invalid OTP');
            return res.redirect('/otp');        }

    } catch (error) {
        console.error("Error verifying OTP:", error);
        req.flash('error',"verifying otp" );
        return res.redirect('/otp');
    }
};

const resendOTP = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.email) {
            return res.status(400).json({ error: "User session not found" });
        }

        const email = req.session.user.email;

        if (!req.session.otp || isOTPExpired(req.session.otp)) {
            const { otp, timestamp } = generateOTP();
            console.log("reeeeeeeeeeeeeeeeeeeeeeeesenddddddddddddddddddddddotp",otp,timestamp)
            req.session.otp = { value: otp, expiry: timestamp + 2 * 60 * 1000 };
        }

        const mailOptions = {
            to: email,
            subject: "Otp for registration is: ",
            html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + req.session.otp.value + "</h1>"
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
            res.redirect("/otp");
        });

    } catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    otp1,
    otpVeify,
    resendOTP
};

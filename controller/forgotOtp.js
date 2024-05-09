
const User = require('../models/userModel');
const bcrypt=require('bcrypt')


const nodemailer=require('nodemailer')
const {EMAIL_USERNAME,EMAIL_PASSWORD}=process.env



const transporte=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:EMAIL_USERNAME,
        pass:EMAIL_PASSWORD
    }

})





function generateOtp(){
    const timestamp=Date.now()
    const otp=Math.floor(1000+Math.random()*9000)
    return {otp,timestamp}

}
function isOTPExpired(otp){
    return otp.expiry < Date.now()
}


const postEmail=(req,res)=>{
try{
    req.session.mail=req.body.email
    console.log("userrrrrrrrrrrrrrrrrrrrrrrrrrrrrr",req.session.mail)
    const {otp,timestamp}=generateOtp()
    req.session.otp={value:otp,expiry:timestamp + 2*60*1000}
    console.log("otp.....................",req.session.otp)
    const email = req.body.email
     console.log(otp)
    const mailOptions={
        to:email,
        subject:"Password Reset OTP",
        html: "<h3>Your OTP for password reset is:</h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>"
    }



    transporte.sendMail(mailOptions,(error,info)=>{
        if(error){
            return console.log(error)
        }
        console.log("Message sent:%s",info.messageId)
        console.log("Preview URL: %s",nodemailer.getTestMessageUrl(info))
        res.redirect("/forgotOtp")
    })


}catch (error){
    console.error("error sending otp:",error)
    res.status(500).status("Internal server error")

}
    
}



const postVerify =(req,res)=>{
  try {

   
    const {otp1,otp2,otp3,otp4}=req.body
    const enteredOtp=otp1+otp2+otp3+otp4
    console.log("enteredOtp",enteredOtp)



    if(enteredOtp===req.session.otp.value.toString()){
        res.redirect('/resetPassword')
    }else{
        req.flash("error","Invalid otp ")
        return res.redirect('/forgotOtp')
    }
  } catch (error) {
    console.error('error',"Verifying Otp")
    return res.redirect('/forgotOtp')
    
  }

}



const resendForgotOtp = (req, res) => {
    try {
        const email = req.session.mail;
        const { otp, timestamp } = generateOtp();
        console.log("otp",otp)
        console.log("timestamp",timestamp)
        req.session.otp = { value: otp, expiry: timestamp + 2 * 60 * 1000 };

        sendOtpEmail(email, otp)
        console.log("email,otp",email,otp)
            .then(() => {
                console.log("OTP resent successfully");
                res.sendStatus(200);
            })
            .catch(error => {
                console.error("Error resending OTP:", error);
                res.status(500).send("Failed to resend OTP. Please try again.");
            });
    } catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).send("Internal server error");
    }
};






const resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const email = req.session.mail;

        if (!email) {
            return res.status(404).json({ error: "Email not found in the session" });
        }

        const resetUser = await User.findOne({ email: email });

        if (!resetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        const resetHashedPassword = await bcrypt.hash(password, 10);

        resetUser.password = resetHashedPassword;
        await resetUser.save();

        // Set success message for password reset
        req.flash('success', 'Password changed successfully');

        // Redirect to login page
        return res.redirect('/login');
    } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};




module.exports={
    postEmail,
    postVerify,
    resendForgotOtp,
    resetPassword
}


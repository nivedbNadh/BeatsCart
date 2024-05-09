const express=require('express')
const path=require('path')
const userRoute = express();
const passport=require('passport')
const {userExit} = require("../middleware/userAuth")
require('../passport')


userRoute.use(passport.initialize())
userRoute.use(passport.session())



const userController=require('../controller/userController')
const otpController=require('../controller/otpController');
const forgotOtp=require('../controller/forgotOtp')
const { router } = require('./userRoute');


userRoute.set('views',path.join(__dirname,'..',"views","user"))


userRoute.use(express.json())
userRoute.use(express.urlencoded({extended:true}))


userRoute.get('/',userExit,userController.loadHome)
userRoute.get('/login',userController.loadLogin)
userRoute.get('/signup',userController.signup)
userRoute.post('/signup',userController.createUser)
userRoute.post('/login',userController.createLogin)
userRoute.get('/otp',userController.loadOtp);
userRoute.post('/otpsending',otpController.otp1)
userRoute.post('/verifyOtp',otpController.otpVeify)
userRoute.post('/resend-otp',otpController.resendOTP)
userRoute.get('/logout',userController.userLogout)
// userRoute.get('/productDetails',userController.loadProductDetails)
userRoute.get('/products',userExit,userController.products)
userRoute.get('/productDetails/:productId',userExit, userController.productDetails);


//forgot password 

userRoute.get('/forgot',userController.loadForgot) 
userRoute.post('/forgot-password',forgotOtp.postEmail)                                     
userRoute.get('/forgotOtp',userController.loadForgotOtp)
userRoute.get('/resetPassword',userController.loadResetPassword)
userRoute.post('/otp-verifying',forgotOtp.postVerify)
userRoute.post('/resend-Otp',forgotOtp.resendForgotOtp)
userRoute.post('/reset-password',forgotOtp.resetPassword)




//google auth
userRoute.get('/auth',userController.loadAuth)



//Auth
userRoute.get('/auth/google',passport.authenticate('google',{
    scope:['email','profile']
}))

//Auth Callback

userRoute.get('/auth/google/callback',
passport.authenticate('google',{
    successRedirect:'/auth/success',
    failureRedirect:'/auth/failure'
}))

//on success authentication

userRoute.get('/auth/success',userController.userLoginGoogleSuccess_get)

// on failed authentication

userRoute.get('/auth/failure',userController.userLoginGoogleFailed_get)






module.exports=userRoute
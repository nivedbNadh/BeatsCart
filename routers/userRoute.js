const express = require("express");
const path = require("path");
const userRoute = express();
const passport = require("passport");
const userAuth=require('../middleware/userAuth')
const { userBlock } = require("../middleware/userAuth");
require("../passport");

userRoute.use(passport.initialize());
userRoute.use(passport.session());

const userController = require("../controller/userController");
const otpController = require("../controller/otpController");
const forgotOtp = require("../controller/forgotOtp");
const cartController = require("../controller/cartController")
const checkController= require("../controller/checkController")



const { router } = require("./userRoute");
userRoute.set("views", path.join(__dirname, "..", "views", "user"));
userRoute.use(express.json());
userRoute.use(express.urlencoded({ extended: true }));


userRoute.get("/",userAuth.userExist, userController.loadHome);
userRoute.get("/home", userAuth.userBlock,userController.loadHome);
userRoute.get("/login", userAuth.userExist, userController.loadLogin);
userRoute.get("/signup", userAuth.userExist, userController.signup);
userRoute.get('/paper',userAuth.value,userController.paperget)


// userRoute.post("/signup", userController.createUser);
userRoute.post("/login", userController.createLogin);
userRoute.get("/otp", userController.loadOtp);
userRoute.post("/otpsending", otpController.otp1);
userRoute.post("/verifyOtp", otpController.otpVeify);
userRoute.post("/resend-otp", otpController.resendOTP);
userRoute.get("/logout", userController.userLogout);
// userRoute.get('/productDetails',userController.loadProductDetails)


userRoute.get("/products", userAuth.authentication,userAuth.userBlock, userController.products);
userRoute.get("/productDetails/:productId",userAuth.authentication,userController.productDetails);

//forgot password
userRoute.get("/forgot", userController.loadForgot);
userRoute.post("/forgot-password", forgotOtp.postEmail);
userRoute.get("/forgotOtp", userController.loadForgotOtp);
userRoute.get("/resetPassword", userController.loadResetPassword);
userRoute.post("/otp-verifying", forgotOtp.postVerify);
userRoute.post("/resend-Otp", forgotOtp.resendForgotOtp);
userRoute.post("/reset-password", forgotOtp.resetPassword);


// errorr page
userRoute.get('/error',userController.loadError)
userRoute.get('/errorfive',userController.errorfivehundred)

//google auth
userRoute.get("/auth", userController.loadAuth);

//Auth
userRoute.get("/auth/google",passport.authenticate("google", {scope: ["email", "profile"],}));

//Auth Callback
userRoute.get("/auth/google/callback",passport.authenticate("google", {successRedirect: "/auth/success",failureRedirect: "/auth/failure",}));

//authentication
userRoute.get("/auth/success", userController.userLoginGoogleSuccess_get);
userRoute.get("/auth/failure", userController.userLoginGoogleFailed_get);

// userProfile route 
userRoute.get("/userProfile",userAuth.authentication,userController.loadUserProfile)
userRoute.post("/change-password",userAuth.authentication,userController.userPasswordChange)
userRoute.post("/save-address",userAuth.authentication,userController.saveAddress)
userRoute.delete('/delete-address/:id', userController.deleteAddress);
userRoute.get('/editAddress/:id',userController.loadEditAddress)
userRoute.post('/submit-address/:id', userController.editAddress);


// cart
userRoute.get("/cart",userAuth.authentication,cartController.cart)
userRoute.post("/addToCart/:productId", userAuth.authentication, cartController.addToCart);
userRoute.delete("/remove-from-cart/:productId",cartController.cartDelete)
userRoute.put('/update-cart-quantity',userAuth.authentication,cartController.updateCartQuantity)



// checkout

userRoute.get('/checkout',userController.loadCheckout)
userRoute.get('/checkAddress',userController.loadCheckoutAddress)
userRoute.post('/addaddresscheckout',checkController.addAddressCheckout)


// order
userRoute.get('/successorder',checkController.successOrder)
userRoute.post('/placeorder',checkController.orderCreate)
userRoute.get('/orderHistory',checkController.loadOrderHistory)
userRoute.post('/cancelOrder',checkController.cancelOrder)







// search

userRoute.get('/search',userController.searchProducts)
userRoute.post('/filter',userController.filterProducts)












module.exports = userRoute; 

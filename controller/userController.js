const { json } = require("body-parser");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const GoogleUser = require("../models/GoogleUser");
const mongoose=require('mongoose')

const bcrypt = require("bcrypt");

// const createUser = async (req, res) => {
//   const { name, email, password, confirmpassword } = req.body;
//   // console.log(req.body);

//   try {
//     // Check if user with same email already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.redirect("/login");
//     }
//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);
//     // Create a new user with hashed password
//     const newUser = new User({ name, email, password: hashedPassword });
//     req.session.tempUser = newUser;


//     // Redirect to otp function page after signup
//     return res.redirect("/otpsending");
//   } catch (error) {
//     console.log(error);
//     return res
//       .status(500)
//       .json({ error: "Failed to create user", details: error });
//   }
// };

const loadHome = async (req, res) => {
  try {
    const email = req.session.curUser;
    // console.log("emailUserController", req.session.curUser )
    // console.log(req.session.curUser, "uuuuuuuuuvvvvvvvvvv uuuuuuuuuuu");
    const products = await Product.find({is_deleted:false});
    const user = await User.findOne({ email: email });

    // console.log(user,"heres sis");

    res.render("home", { error: null, user, products });
  } catch (error) {
    console.log("error occured");
  }
};
// userMail

const loadLogin = async (req, res) => {
  // console.log("req.session.userloggedreq.session.userloggedreq.session.userlogged",req.session.userlogged)

  if(req.session.userlogged){
    return res.redirect("/home")
  }
  try {
      // Render the login page
      res.render("login", { error: null });
  } catch (error) {
      console.log("Error occurred:", error);
      res.status(500).send("Internal server error");
  }
};

const signup = async (req, res) => {
  try {
    const { error } = req;
    const {block}=req.query

    let errorMessage=null
    if(block){
      errorMessage='Your account hasbeen blocked.Please signup another account'
    }
    
    res.render("signup", { error:errorMessage });
  } catch (error) {
    console.log("error occured", error);
  }
};

const loadOtp = async (req, res) => {
  try {
    const { error } = req;
    res.render("otp", { error: null, });
  } catch (error) {
    console.log("error occurred", error);
  }
};

const createLogin = async (req, res) => {
  // console.log("req.body login", req.body);
  const { email, password } = req.body;

  try {
    // console.log(email, "newnwmw  sdfsd");
    const userLog = await User.findOne({ email: email });
    // console.log("userlog", userLog);

    if (!userLog) {
      return res.render("login", { error: "Invalid email or password" });
    }
    // console.log("password", password);
    // console.log("userLog.password", userLog.password);

    const passwordValid = await bcrypt.compare(password, userLog.password);
    // console.log("passwordValid", passwordValid);
    if (!passwordValid) {
      return res.render("login", { error: "Invalid email or password" });
    }
    req.session.userlogged= true;
    // console.log("req.sessionnnnnnnnnnnnnnnnnnnnnnnnnnnnn",req.session.userlogged)
    req.session.curUser = email;
    // console.log(req.session.curUser,"req.session.curUserreq.session.curUserreq.session.curUser")

    res.redirect("/home");
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const loadForgot = async (req, res) => {
  try {
    res.render("forgot");
  } catch (error) {
    console.error("error occured");
  }
};

const loadForgotOtp = async (req, res) => {
  try {
    res.render("forgotOtp");
  } catch (error) {
    console.error("error occured");
  }
};

const loadResetPassword = async (req, res) => {
  try {
    res.render("resetPassword");
  } catch (error) {
    console.error("Error occured");
  }
};

const loadAuth = (req, res) => {
  res.render("auth");
};

const userLoginGoogleSuccess_get = async (req, res) => {
  try {
    const googleId = req.user.sub;
    const displayName = req.user.displayName;
    const email = req.user.email;

    let googleUser = await GoogleUser.findOne({ googleId });

    if (!googleUser) {
      googleUser = await GoogleUser.create({
        googleId,
        displayName,
        email,
      });
    }

    res.redirect("/");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const userLoginGoogleFailed_get = (req, res) => {
  return res.redirect("/login?message=Google, authentication failed");
};

const getProductDetails = async (productId) => {
  try {
    console.log("Fetching product details for productId:", productId);
    const product = await Product.findById(productId);
    console.log("Product details fetched successfully:", product);
    return product;
  } catch (error) {
    console.error("Error fetching product details:", error);
    throw new Error("Failed to fetch product details.");
  }
};

const productDetails = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.redirect('/error')
    } else {
      const product = await Product.findById(productId);
      console.log("pppppppppp", product);
  
     return res.render("productDetails", { product: [product] });
    }
  
  } catch (error) {
    console.error("Error occurred:", error);
    res.render("error", {
      message: "Error occurred while fetching product details.",
    });
  }
};

const products = async (req, res) => {
  try {
    const user = req.session.user;
    const products = await Product.find({is_deleted:false});
    res.render("products", { error: null, user, products});
  } catch (error) {
    console.error("error occured");
  }
};

const userLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Internal server error");
    }
});

res.redirect("/login");
};



const loadError = async (req,res)=>{
  try {
    res.render('error')
    
  } catch (error) {
    console.error("error occured")
    
  }
}



const errorfivehundred = async (req,res)=>{
  try {
    res.render('errorfive')
    
  } catch (error) {
    console.error("error occured")
  }
}



module.exports = {
  loadHome,
  loadLogin,
  signup,
  // createUser,
  createLogin,
  loadOtp,
  loadForgot,
  loadForgotOtp,
  loadResetPassword,
  userLoginGoogleSuccess_get,
  userLoginGoogleFailed_get,
  loadAuth,
  productDetails,
  products,
  userLogout,
  loadError,
  errorfivehundred
};

const { json } = require("body-parser");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Address=require('../models/addressModel')
// const GoogleUser = require("../models/GoogleUser");
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
  const { email, password } = req.body;

  try {
    const userLog = await User.findOne({ email: email });

    if (!userLog) {
      return res.render("login", { error: "Invalid email or password" });
    }

    const passwordValid = await bcrypt.compare(password, userLog.password);
    if (!passwordValid) {
      return res.render("login", { error: "Invalid email or password" });
    }
    req.session.userlogged= true;
    req.session.curUser = email;
    req.session.email = email;
    req.session.userId = userLog._id;

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


// googele Auth

const userLoginGoogleFailed_get = (req, res) => {
  return res.redirect('/user-login?message=Google authentication failed');
};

const userLoginGoogleSuccess_get = async (req, res) => {
  try {
    console.log('req.user:', req.user); 

    const givenName = req.user.name.givenName;
    const email = req.user.email;
    const name = givenName; 
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      req.session.userlogged = true;
      req.session.curUser = email;
      req.session.userGoogleLogged = true;
      req.session.name = name;
      req.session.email = email;
      req.session.userId = existingUser._id;
      return res.redirect('/');
    } else {
      // Generate  secure random password
      const randomPassword = Math.random().toString(36).slice(-8); 
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const createNewUser = await User.create({
        name: name,
        email: email,
        password: hashedPassword, 
        status: true
      });

      req.session.userGoogleLogged = true;
      req.session.name = name;
      req.session.email = email;
      req.session.userId = createNewUser._id;
      return res.redirect('/');
    }
  } catch (error) {
    console.error('Error during Google authentication success handling:', error);
    return res.redirect('/user-login?message=Google authentication failed');
  }
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

      
      // breadcrumbs
      const breadcrumbs=[{name:'home',url:'/'},
        {name:'Products',url:'/products'},
        {name:product.name,url:req.originalUrl}
      ]
     return res.render("productDetails", { product: [product] ,breadcrumbs});
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
    const loggined = req.session.userlogged;
    let user = null
    if(loggined != null){
    const email = req.session.email
     user = await User.findOne({ email: email });
    }
    const products = await Product.find({is_deleted:false});
const breadcrumbs=[
  {name:'Home',url:'/'},
  {name:'Products',url:'/products'}
]
res.render("products", { error: null, user, products,breadcrumbs});




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

res.redirect("/");
};



// error 404

const loadError =  (req,res)=>{
  try {
    res.render('error')
    
  } catch (error) {
    console.error("error occured")
    
  }
}

// error 504


const errorfivehundred =  (req,res)=>{
  try {
    res.render('errorfive')
    
  } catch (error) {
    console.error("error occured")
  }
}

// userProfile 
const loadUserProfile = async (req, res) => {
  try {
    const email = req.session.email;
    console.log(email, 'Email from session');
    
    const user = await User.findOne({ email });
    console.log(user, 'User found');

    if (!user) {
      console.log('User not found');
      return res.status(404).send('User not found');
    }

    // Fetch addresses associated with the user ID
    const addresses = await Address.find({ userId: user._id });
    console.log(addresses, 'Addresses found');

    // Render the user profile with user data and addresses
    res.render('userProfile', { user, addresses });
  } catch (error) {
    console.error('Error occurred while loading user profile:', error);
    res.status(500).send('Internal server error');
  }
};





const userPasswordChange= async (req,res) =>{  
  try {
    const email=req.session.email
    const user=await User.findOne({email})
    if(!user) {
      return res.status(404).json({error:'User not found'})
    }

    const isValidPassword=await bcrypt.compare(req.body.currentPassword,user.password)
    if(!isValidPassword) {
      return res.status(400).json({error:'Invalid current password'})
    }

    const newPassword=req.body.newPassword
    const repeatNewPassword=req.body.repeatNewPassword
    console.log('newPassword',newPassword)
    console.log('repeatNewPassword',repeatNewPassword)
    if(newPassword !== repeatNewPassword) {
      return res.status(400).json({error:'Password do not match '})
    }
    const hashedPassword=await bcrypt.hash(newPassword,10)
    user.password=hashedPassword
    await user.save()
    req.session.destroy()
    res.status(200).json({message:'Password changed successfully'})


    
  } catch (error) {
    console.error('Error changing password:',error)
    res.status(500).json({error:'failed to change password.please try again later'})
    
  }

}



// const saveAddress= async (req,res)=>{
//   try{
//       const userId=req.session.user._id
//       console.log("useriduseriduseriduserid",userId)

//       const {name,mobile,email,pincode,houseName,locality,city,district,state}=req.body
//       console.log("name,mobile,email,pincode,houseName,locality,city,district,state")
//       const newAddress=new Address({
//         userId:userId,
//         name,
//         mobile,
//         email,
//         pincode,
//         houseName,
//         locality,
//         city,
//         district,
//         state

//       })
  

//     } 


//   } catch (error) {
//     console.error('Error:',error)
//     res.status(500).send('Internal server error')
//   }
// }



const saveAddress = async (req,res)=>{
  try{

    console.log('req.body', req.body);
    const userId=req.session.userId
    console.log("useriduseriduseriduserid",userId)

    const {mobile,pincode,houseName,area,city,state,landmark}=req.body
    
    console.log('req.body', req.body)
      const newAddress=new Address({
        userId:userId,
        mobile,
        pincode,
        houseName,
        area,
        city,
        state,
        landmark

      })
      console.log('newAddress',newAddress)
      await newAddress.save();

  }catch(error){
    console.error('Error:',error)
    res.status(500).send('Internal server error')
  }
  }



  const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        console.log(addressId, " addressId addressId addressId addressId");
        const deletedAddress = await Address.findByIdAndDelete(addressId);
        if (!deletedAddress) {
            return res.status(404).send('Address not found');
        }
        const userId = req.session.userId;
        await User.findByIdAndUpdate(userId, { $pull: { addresses: addressId } });
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};




// edit page get


const loadEditAddress = async (req, res) => {
  try {
    const user = req.session.email;
    const addressId = req.params.id;
    console.log(addressId,"addressIdaddressIdaddressIdaddressIdaddressId") 
    if (!addressId) {
      return res.status(400).send('Address ID is required');
    }
    const address = await Address.findById(addressId);
    console.log(address,"kkkkkkkkkkkkkkkkkkkkkkkk")
    if (!address) {
      return res.status(404).send('Address not found');
    }
    res.render('editAddress', { user, address });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send('Internal server error');
  }
};


 
const editAddress = async (req, res) => {
  try {
    const { mobile, pincode, houseName, city, state, landmark,area } = req.body;
    const addressId = req.params.id;
    console.log("addressId",addressId)

    let address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).send('Address not found');
    }

    address.mobile = mobile;
    address.pincode = pincode;
    address.houseName = houseName;
    address.city = city;
    address.state = state;
    address.landmark = landmark;
    address.area= area

    await address.save();
    res.redirect('/userProfile');
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};








// load checkout 
const loadCheckout= async(req,res)=>{
  try {
    const email= req.session.email
    const user = await User.findOne({email})

    if(!user) {
      return res.status(400).json({message:'user not found'})
    }

      res.render('checkout',{user})
      
  } catch (error) {
      console.error('error occured')
      res.status(500).send('internal server error')
      
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
  errorfivehundred,
  loadUserProfile,
  userPasswordChange,
  saveAddress,
  deleteAddress,
  loadEditAddress,
  editAddress,
  loadCheckout
};

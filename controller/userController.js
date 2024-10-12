const { json } = require("body-parser");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");
const brand = require("../models/BrandModel");
const Coupon = require("../models/couponModel");
const Wishlist = require("../models/wishListModel");
const ProductOffer = require("../models/productOfferModel");
const CategoryOffer = require("../models/categoryOfferModel");
const RecentlyViewed = require("../models/recentlyModel");
const crypto = require("crypto");
const Wallet = require("../models/walletModel");
const Order = require("../models/orderModel");

// const GoogleUser = require("../models/GoogleUser");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { categoryOfferSaving } = require("./adminController");

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
    console.log("44444444444444444");
    const email = req.session.email;
    const userId = req.session.userId;
    console.log("555555555555555555", req.session.email, userId);
    const products = await Product.find({ is_deleted: false });
    const user = await User.findOne({ email: email });
    const categories = await Category.find({ is_deleted: false });

    const arrivals = await Product.find({ is_deleted: false }).sort({
      createdAt: -1,
    });

    const newArrivals = arrivals.slice(0, 4);
    // console.log(newArrivals,'newArrivals')

    console.log("66666666666666666666");
    const currentDate = new Date();
    const productOffers = await ProductOffer.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });
    // console.log('productOffershome',productOffers)

    console.log("7777777777777777777777777");
    const categoryOffers = await CategoryOffer.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    console.log("88888888888888888888888");
    const offerMap = new Map();
    // console.log('offerMapofferMap',offerMap)
    productOffers.forEach((offer) => {
      offerMap.set(offer.productId.toString(), offer);
      // console.log('offerMap',offerMap)
      // console.log('offer.productId',offer.productId)
    });

    console.log("99999999999999999999999999999");
    const categoryOfferMap = new Map();
    categoryOffers.forEach((offer) => {
      categoryOfferMap.set(offer.categoryId.toString(), offer);
    });

    const productsWithOffers = products.map((product) => {
      const productId = product._id ? product._id.toString() : null;
      const categoryId = product.categoryId
        ? product.categoryId.toString()
        : null;

      // if(!categoryId){
      //   return {
      //     ...product._doc,
      //     discountedPrice:null,
      //     originalPrice:product.price,
      //     hasOffer:false
      //   }
      // }

      const offer = offerMap.get(product._id.toString());
      // console.log('offer',offer)
      // console.log('product._id......',product._id)
      if (offer) {
        const discountAmount = (product.price * offer.discount) / 100;
        const discountedPrice = product.price - discountAmount;

        // console.log('offerhome',offer)

        return {
          ...product._doc,
          discountedPrice,
          originalPrice: product.price,
          hasOffer: true,
        };
      } else {
        const categoryOffer = categoryOfferMap.get(categoryId);
        if (categoryOffer) {
          const discountAmount = (product.price * categoryOffer.discount) / 100;
          const discountedPrice = product.price - discountAmount;

          // console.log('discountAmount',discountAmount)
          // console.log('discountedPrice',discountedPrice)

          return {
            ...product._doc,
            discountedPrice,
            originalPrice: product.price,
            hasOffer: true,
            offerType: "category",
            categoryDiscount: categoryOffer.discount,
          };
        }
      }

      return {
        ...product._doc,
        discountedPrice: null,
        originalPrice: product.price,
        hasOffer: false,
      };
    });
    console.log("10101010101010101010");
    // console.log('productsWithOffers',productsWithOffers)
    let recentlyViewedProducts = [];
    if (user) {
      const recentlyViewed = await RecentlyViewed.findOne({ userId: user._id });
      if (recentlyViewed && recentlyViewed.products.length > 0) {
        recentlyViewedProducts = await Product.find({
          _id: { $in: recentlyViewed.products },
        }).lean();

        recentlyViewedProducts.sort(
          (a, b) =>
            recentlyViewed.products.indexOf(a._id) -
            recentlyViewed.products.indexOf(b._id)
        );
      }
    }
    console.log("11,11,11,11,11,11,11,11,11");
    // console.log('recentProducts',recentProducts)

    res.render("home", {
      error: null,
      user,
      products: productsWithOffers,
      categories,
      newArrivals,
      recentlyViewedProducts,
    });
  } catch (error) {
    console.log("error occured", error);
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
    const { block } = req.query;

    let errorMessage = null;
    if (block) {
      errorMessage =
        "Your account hasbeen blocked.Please signup another account";
    }

    res.render("signup", { error: errorMessage });
  } catch (error) {
    console.log("error occured", error);
  }
};

const loadOtp = async (req, res) => {
  try {
    const { error } = req;
    res.render("otp", { error: null });
  } catch (error) {
    console.log("error occurred", error);
  }
};

const generateReferralCode = () => {
  return crypto.randomBytes(4).toString("hex");
};

const createLogin = async (req, res) => {
  const { email, password, referralCode } = req.body;

  try {
    const userLog = await User.findOne({ email: email });

    if (!userLog) {
      return res.render("login", { error: "Invalid email or password" });
    }

    const passwordValid = await bcrypt.compare(password, userLog.password);
    if (!passwordValid) {
      return res.render("login", { error: "Invalid email or password" });
    }

    if (referralCode) {
      const referredUser = await User.findOne({ referralCode: referralCode });
      console.log("referredUser", referredUser);

      if (referredUser) {
        let wallet = await Wallet.findOne({ user: referredUser._id });

        if (wallet) {
          wallet.balance += 100;
          wallet.transaction.push({
            transactionType: "credit",
            description: "Referral reward",
            timestamp: new Date(),
          });
          await wallet.save();
        } else {
          await Wallet.create({
            user: referredUser._id,
            balance: 100,
            transaction: [
              {
                transactionType: "credit",
                description: "Referral reward",
                referralDate: new Date(),
                transactionId: generateTransactionId(),
              },
            ],
          });
        }
      }
    }

    if (!userLog.referralCode) {
      let referralCode;
      let referralExists = true;

      do {
        referralCode = generateReferralCode();
        const existingUser = await User.findOne({ referralCode: referralCode });
        if (!existingUser) {
          referralExists = false;
        }
      } while (referralExists);

      userLog.referralCode = referralCode;
      await userLog.save();
    }

    req.session.userlogged = true;
    req.session.curUser = email;
    req.session.email = email;
    req.session.userId = userLog._id;

    res.redirect("/home");
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const generateTransactionId = () => {
  return crypto.randomBytes(16).toString("hex");
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
  return res.redirect("/user-login?message=Google authentication failed");
};

const userLoginGoogleSuccess_get = async (req, res) => {
  try {
    console.log("req.user:", req.user);

    const givenName = req.user.name.givenName;
    const email = req.user.email;
    const name = givenName;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      req.session.userlogged = true;
      req.session.curUser = req.user.email;
      req.session.userGoogleLogged = true;
      req.session.name = name;
      req.session.email = req.user.email;
      req.session.userId = existingUser._id;
      console.log("hooooooooooooooooooooooooooooooooo");
      return res.redirect("/");
    } else {
      // Generate  secure random password
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      console.log("11111111111111111111111111");
      const createNewUser = await User.create({
        name: name,
        email: req.user.email,
        password: hashedPassword,
        status: true,
        // referralCode: ''
      });
      console.log("222222222222222222222222222222");
      req.session.userlogged = true;
      req.session.userGoogleLogged = true;
      req.session.name = name;
      req.session.email = email;
      req.session.userId = createNewUser._id;
      console.log("33333333333333333333333");
      return res.redirect("/");
    }
  } catch (error) {
    console.error(
      "Error during Google authentication success handling:",
      error
    );
    return res.redirect("/user-login?message=Google authentication failed");
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
    const email = req.session.email;
    user = await User.findOne({ email: email });

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.redirect("/error");
    } else {
      const product = await Product.findById(productId);

      const currentDate = new Date();
      const offer = await ProductOffer.findOne({
        productId: productId,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
      });

      let categoryOffer;
      if (product.categoryId) {
        categoryOffer = await CategoryOffer.findOne({
          categoryId: product.categoryId,
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate },
        });
      }

      let finalPrice = product.price;
      if (offer) {
        const discountAmount = (product.price * offer.discount) / 100;
        finalPrice = product.price - discountAmount;
      } else if (categoryOffer) {
        const discountAmount = (product.price * categoryOffer.discount) / 100;
        finalPrice = product.price - discountAmount;
      }

      let recentlyViewed; // Declare outside to ensure it's accessible

      if (user) {
        recentlyViewed = await RecentlyViewed.findOne({ userId: user._id });

        if (!recentlyViewed) {
          recentlyViewed = new RecentlyViewed({
            userId: user._id,
            products: [product._id], // Create with the current product
          });
        } else {
          // Ensure that `recentlyViewed.products` is an array of ObjectIds
          if (!Array.isArray(recentlyViewed.products)) {
            recentlyViewed.products = [];
          }

          // Check if the product is already in the recently viewed list
          const productExists = recentlyViewed.products.some((pId) =>
            pId.equals(product._id)
          );
          if (!productExists) {
            recentlyViewed.products.unshift(product._id);

            // Ensure the array does not exceed the maximum length
            if (recentlyViewed.products.length > 8) {
              // Assuming maximum  length is 8
              recentlyViewed.products.pop(); // Remove from the end
            }

            recentlyViewed.updatedAt = Date.now();
          }
        }

        await recentlyViewed.save();
      }
      console.log(recentlyViewed, "recentlyViewed");

      // breadcrumbs
      const breadcrumbs = [
        { name: "home", url: "/" },
        { name: "Products", url: "/products" },
        { name: product.name, url: req.originalUrl },
      ];
      return res.render("productDetails", {
        product: [product],
        finalPrice,
        breadcrumbs,
        user,
      });
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
    let user = null;
    if (loggined != null) {
      const email = req.session.email;
      user = await User.findOne({ email: email });
    }

    // pagination

    const perPage = 6;
    const page = parseInt(req.query.page) || 1;

    const totalProducts = await Product.countDocuments({ is_deleted: false });

    const products = await Product.find({ is_deleted: false })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const category = await Category.find({ is_deleted: false });
    const brands = await brand.find({ is_deleted: false });
    // console.log(category,"llllllllllllllllllllllll");

    const currentDate = new Date();
    const productOffers = await ProductOffer.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    // console.log('productOffers',productOffers)

    const categoryOffers = await CategoryOffer.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    const offerMap = new Map();
    productOffers.forEach((offer) => {
      offerMap.set(offer.productId.toString(), offer);
      // console.log('offer.productId',offer.productId)
    });

    const categoryOfferMap = new Map();
    categoryOffers.forEach((offer) => {
      categoryOfferMap.set(offer.categoryId.toString(), offer);
    });

    const productWithOffers = products.map((product) => {
      const offer = offerMap.get(product._id.toString());
      // console.log('product._id',product._id)

      // let discount=0
      let discountedPrice = product.price;
      let hasOffer = false;

      if (offer) {
        discountAmount = (product.price * offer.discount) / 100;
        discountedPrice = product.price - discountAmount;
        hasOffer = true;
      }

      if (!hasOffer && product.categoryId) {
        const categoryOffer = categoryOfferMap.get(
          product.categoryId._id.toString()
        );
        if (categoryOffer) {
          discountAmount = (product.price * categoryOffer.discount) / 100;
          discountedPrice = product.price - discountAmount;
          hasOffer = true;
        }
      }
      return {
        ...product._doc,
        discountedPrice,
        originalPrice: product.price,
        hasOffer,
      };
    });
    // console.log('productWithOffers',productWithOffers)

    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Products", url: "/products" },
    ];

    const totalPages = Math.ceil(totalProducts / perPage);

// filter pagination

//after hosting implement below code 

 // Build the queryString from req.query excluding the 'page' parameter
 const queryString = Object.entries(req.query)
 .filter(([key, value]) => key !== 'page' && value)
 .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
 .join('&');

    res.render("products", {
      error: null,
      user,
      products: productWithOffers,
      breadcrumbs,
      category,
      brands,
      currentPage: page,
      totalPages,
      queryString
    });
  } catch (error) {
    console.error("error occured", error);
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

const loadError = (req, res) => {
  try {
    res.render("error");
  } catch (error) {
    console.error("error occured");
  }
};

// error 504

const errorfivehundred = (req, res) => {
  try {
    res.render("errorfive");
  } catch (error) {
    console.error("error occured");
  }
};

// userProfile
const loadUserProfile = async (req, res) => {
  try {
    const email = req.session.email;
    console.log(email, "Email from session");

    const user = await User.findOne({ email });
    console.log(user, "User found");

    if (!user) {
      console.log("User not found");
      return res.status(404).send("User not found");
    }

    // Fetch addresses associated with the user ID
    const addresses = await Address.find({ userId: user._id });
    console.log(addresses, "Addresses found");

    // Render the user profile with user data and addresses
    res.render("userProfile", { user, addresses });
  } catch (error) {
    console.error("Error occurred while loading user profile:", error);
    res.status(500).send("Internal server error");
  }
};

const userPasswordChange = async (req, res) => {
  try {
    const email = req.session.email;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(
      req.body.currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return res.status(400).json({ error: "Invalid current password" });
    }

    const newPassword = req.body.newPassword;
    const repeatNewPassword = req.body.repeatNewPassword;
    // console.log('newPassword',newPassword)
    // console.log('repeatNewPassword',repeatNewPassword)
    if (newPassword !== repeatNewPassword) {
      return res.status(400).json({ error: "Password do not match " });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    req.session.destroy();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ error: "failed to change password.please try again later" });
  }
};

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

const saveAddress = async (req, res) => {
  try {
    // console.log('req.body', req.body);
    const userId = req.session.userId;
    // console.log("useriduseriduseriduserid",userId)

    const { mobile, pincode, houseName, area, city, state, landmark } =
      req.body;

    // console.log('req.body', req.body)

    const newAddress = new Address({
      userId: userId,
      mobile,
      pincode,
      houseName,
      area,
      city,
      state,
      landmark,
    });
    // console.log('newAddress',newAddress)
    await newAddress.save();

    if (newAddress) {
      return res.status(200).json({ message: "address addded succesfully" });
    } else {
      redirect("/userProfile");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const deleteAddress = await Address.findByIdAndDelete(addressId);
    if (!deleteAddress) {
      return res.status(404).send("Address not found");
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};

// edit page get

const loadEditAddress = async (req, res) => {
  try {
    const user = req.session.email;
    const addressId = req.params.id;
    console.log(addressId, "addressIdaddressIdaddressIdaddressIdaddressId");
    if (!addressId) {
      return res.status(400).send("Address ID is required");
    }
    const address = await Address.findById(addressId);
    console.log(address, "kkkkkkkkkkkkkkkkkkkkkkkk");
    if (!address) {
      return res.status(404).send("Address not found");
    }
    res.render("editAddress", { user, address });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send("Internal server error");
  }
};

const editAddress = async (req, res) => {
  try {
    const { mobile, pincode, houseName, city, state, landmark, area } =
      req.body;
    const addressId = req.params.id;
    // console.log("addressId",addressId)

    let address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).send("Address not found");
    }

    address.mobile = mobile;
    address.pincode = pincode;
    address.houseName = houseName;
    address.city = city;
    address.state = state;
    address.landmark = landmark;
    address.area = area;

    await address.save();
    res.redirect("/userProfile");
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// load checkout
const loadCheckout = async (req, res) => {
  try {
    const email = req.session.email;
    if (!email) {
      return res.status(401).json({ message: "User not logged in" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const userId = req.session.userId;
    const cart = await Cart.findOne({ userId }).populate("products.productId");
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const addresses = await Address.find({ userId: user._id });

    const currentDate = new Date();

    // Fetch all active offers for the products in the cart
    const productOffers = await ProductOffer.find({
      // productId: { $in: cart.products.map(p => p.productId._id) },
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    const categoryIds = cart.products
      .map((p) => p.productId.categoryId)
      .filter((categoryId) => categoryId);

    const categoryOffers = await CategoryOffer.find({
      categoryId: { $in: categoryIds },
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    const cartItems = cart.products.map((product) => {
      if (!product.productId) {
        console.error("ProductId is undefined for:", product);
        return {
          productName: "Unknown",
          productImage: "default.jpg",
          price: 0,
          quantity: product.quantity,
        };
      }

      const originalPrice = product.productId.price;

      // Find the offer for the current product
      const offer = productOffers.find(
        (offer) =>
          offer.productId.toString() === product.productId._id.toString()
      );

      const categoryOffer = offer
        ? null
        : categoryOffers.find(
            (offer) =>
              offer.categoryId.toString() ===
              product.productId.categoryId?.toString()
          );

      const productPrice = offer
        ? originalPrice - originalPrice * (offer.discount / 100)
        : categoryOffer
        ? originalPrice - originalPrice * (categoryOffer.discount / 100)
        : originalPrice;

      return {
        productName: product.productId.name,
        productImage: product.productId.image[0],
        price: productPrice,
        quantity: product.quantity,
      };
    });

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    req.session.originalTotal = total;

    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    res.render("checkout", {
      user,
      addresses,
      cartItems,
      subtotal,
      tax,
      total,
      RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send("Internal server error");
  }
};

// checkout address page code
const loadCheckoutAddress = async (req, res) => {
  try {
    const email = req.session.email;
    const user = User.findOne({ email });
    const userId = req.session.userId;
    const addresses = await Address.find();
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    res.render("checkAddress", { user, userId: userId, addresses });
  } catch (error) {
    console.error("error occured");
    res.status(500).send("internal server error");
  }
};

const searchProducts = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    const regex = new RegExp(searchTerm, "i");
    console.log(searchTerm, "searchTerm");
    console.log(regex, "regex");

    const allProducts = await Product.find();
    // console.log(allProducts,"all products")

    const products = await Product.find({
      $or: [
        { name: regex },
        { description: regex },
        { category: regex },
        { brand: regex },
      ],
    });
    console.log(products, "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
    res.json(products);
  } catch (error) {
    console.error("Error during serch:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const paperget = (req, res) => {
  try {
    res.render("paper");
  } catch (error) {
    console.log("error occured", error);
    res.status(500).json({ error: "internal server" });
  }
};

const filterProducts = async (req, res) => {
  try {
    const { price, category, brand, searchResults,page=1 } = req.body;
    const limit=6
    const skip=(page-1) *limit
    // console.log("jssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxjjjjjjjjjjjxj",searchResults);

    let query = {};
    // console.log("queryqueryqueryqueryqueryqueryqueryqueryqueryquery",query);

    if (searchResults && searchResults.length > 0) {
      query._id = { $in: searchResults.map((product) => product._id) };
    }

    if (Array.isArray(category) && category.length > 0) {
      query.category = { $in: category };
    }

    // console.log('categoryquery')
    if (Array.isArray(brand) && brand.length > 0) {
      query.brand = { $in: brand };
    }
    console.log("query", query);

    let products = Product.find(query).skip(skip).limit(limit)
    // console.log("productsproducts1",products)

    if (price) {
      products = products.sort(
        price === "low-to-high" ? { price: 1 } : { price: -1 }
      );
    }
    // console.log("productsproductsproducts",products);

    const totalProducts=await Product.countDocuments(query)
    const totalPages=Math.ceil(totalProducts/limit)
    const result = await products.exec();

    console.log("resultresultresult", result);

    const currentDate = new Date();
    const productsWithFinalPrices = await Promise.all(
      result.map(async (product) => {
        const offer = await ProductOffer.findOne({
          productId: product._id,
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate },
        });

        let categoryOffer;
        if (product.categoryId) {
          categoryOffer = await CategoryOffer.findOne({
            categoryId: product.categoryId,
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate },
          });
        }

        let finalPrice = product.price;
        if (offer) {
          const discountAmount = (product.price * offer.discount) / 100;
          finalPrice = product.price - discountAmount;
        } else if (categoryOffer) {
          const discountAmount = (product.price * categoryOffer.discount) / 100;
          finalPrice = product.price - discountAmount;
        }

        return {
          ...product.toObject(),
          finalPrice,
        };
      })
    );

    const queryString = Object.entries(req.body)
    .filter(([key, value]) => value && key !== "page")
    .map(([key, value]) =>
      Array.isArray(value) ? value.map(v => `${key}[]=${v}`).join("&") : `${key}=${value}`
    )
    .join("&");


    res.json({ products: productsWithFinalPrices,totalPages,currentPage:page,queryString });
  } catch (error) {
    res.status(500).json({ message: "Error filtering products", error });
  }
};

const loadCoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find({ status: true });
    console.log("couponDatacouponDatacouponDatacouponDatacouponData", coupons);
    res.render("coupon", { coupons });
  } catch (error) {
    console.error("error occured");
    res.status(500).json({ message: "internal server error" });
  }
};

const loadWishList = async (req, res) => {
  try {
    const email = req.session.email;
    const userId = req.session.userId;
    const user = User.findOne({ email });

    const wishlistItems = await Wishlist.find({ userId })
      .populate("productId")
      .exec();
    const products = wishlistItems
      .map((item) => item.productId)
      .filter((product) => product !== undefined);

    console.log("wishlistItems", products);
    res.render("wishList", { products, user });
  } catch (error) {
    console.error("error occured", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.session.userId;
    // console.log('productId',productId)
    // console.log('userId',userId)

    // check if the product is already in the wishlist
    const existingWishListItem = await Wishlist.findOne({ userId, productId });
    if (existingWishListItem) {
      return res.status(400).json({ message: "Product already in wish list" });
    }
    // console.log('existingWishListItem',existingWishListItem)
    const newWishlistItem = new Wishlist({
      userId,
      productId,
    });
    await newWishlistItem.save();
    res.status(200).json({ message: "Product added to wishlist" });
  } catch (error) {
    console.error("Error adding product to wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteProductFromWishlist = async (req, res) => {
  const productId = req.params.id.trim();

  console.log("Received Product ID:", productId);

  // Validate the product ID format
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const objectId = new mongoose.Types.ObjectId(productId);

    // find and delete the product from the wishlist
    const result = await Wishlist.findOneAndDelete({ productId: objectId });

    console.log("Delete result:", result);

    if (!result) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Error removing product from wishlist:", error);
    res.status(500).json({ message: "Failed to remove product from wishlist" });
  }
};

const loadWallet = async (req, res) => {
  try {
    const email = req.session.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wallet = await Wallet.findOne({ user: user._id });
    console.log(wallet, "wallet");
    if (!wallet) {
      return res.render("walletHistory", { user, wallet: null });
    }
    console.log("userId", user);

    return res.render("walletHistory", { user, wallet });
  } catch (error) {
    console.error("An error occured", error);
    res.status(500).json({ message: "internal server error" });
  }
};

const loadOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    console.log("orderId", orderId);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid Id format" });
    }

    const order = await Order.findById(orderId)
      .populate("products.product")
      .populate("customer")
      .populate("address");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render("orderDetails", { order });

    // console.log('order',order)
  } catch (error) {
    console.error("an error occured", error);
    res.status(500).json({ message: "Internal servre error" });
  }
};

const generateInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate("products.product")
      .populate("customer")
      .populate("address");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const currentDate = new Date();
    const productOffers = await ProductOffer.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    const offerMap = new Map();
    productOffers.forEach((offer) => {
      offerMap.set(offer.productId.toString(), offer);
    });

    const doc = new PDFDocument({ margin: 50 });
    const invoicePath = path.join(__dirname, "invoice.pdf");
    const stream = fs.createWriteStream(invoicePath);
    doc.pipe(stream);

    doc
      .fontSize(20)
      .text("INVOICE", { align: "right" })
      .moveDown(0.5)
      .fontSize(10)
      .text("BeatsCart", { align: "right" });

    doc
      .moveDown(0.5)
      .text("16501 Collins Ave, Sunny Isles Beach, FL 33160, India", {
        align: "right",
      })
      .text("676503, Cochin, India", { align: "right" });

    doc
      .moveDown()
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, 150)
      .lineTo(550, 150)
      .stroke();

    const user = order.customer;
    doc
      .moveDown()
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(user.name || user.username || user.email, 50, 160)
      .moveDown(0.5)
      .fontSize(10)
      .font("Helvetica")
      .text(
        `${order.address?.street || "Street not available"}, ${
          order.address?.city || "City not available"
        }, ${order.address?.state || "State not available"}, ${
          order.address?.pincode || "Pincode not available"
        }`
      );

    doc
      .moveUp(2)
      .fontSize(10)
      .text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, {
        align: "right",
      });

    doc
      .moveDown()
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, doc.y + 10)
      .lineTo(550, doc.y + 10)
      .stroke();

    const headerY = doc.y + 20;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Products", 50, headerY)
      .text("Quantity", 200, headerY)
      .text("Original Price", 300, headerY)
      .text("Product Offer", 400, headerY)
      .text("Subtotal", 490, headerY);

    doc
      .moveDown(0.5)
      .strokeColor("#dddddd")
      .lineWidth(0.5)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    let currentY = doc.y + 10;
    let subtotal = 0;

    order.products.forEach((item) => {
      const product = item.product;
      const offer = offerMap.get(product._id.toString());

      let originalPrice = product.price;
      let productSubtotal = originalPrice * item.quantity;
      let discountedPrice = null;
      let offerText = "0";

      if (offer) {
        const discountAmount = (originalPrice * offer.discount) / 100;
        discountedPrice = originalPrice - discountAmount;
        productSubtotal = discountedPrice * item.quantity;
        offerText = `₹${discountedPrice.toFixed(2)}`;
      }

      subtotal += productSubtotal;

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(product.name, 50, currentY)
        .text(item.quantity, 200, currentY)
        .text(`₹${originalPrice.toFixed(2)}`, 300, currentY)
        .text(offerText, 400, currentY)
        .text(`₹${productSubtotal.toFixed(2)}`, 490, currentY);

      currentY += 20;
    });

    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    doc
      .moveDown(2)
      .font("Helvetica-Bold")
      .text(`Subtotal: ₹${subtotal.toFixed(2)}`, 400)
      .text(`Tax (5%): ₹${tax.toFixed(2)}`, 400)
      .text(`Total Price: ₹${total.toFixed(2)}`, 400);

    doc.end();

    stream.on("finish", () => {
      res.download(invoicePath, "invoice.pdf", (err) => {
        if (err) {
          console.error("Error sending file", err);
          res.status(500).send("Error generating invoice");
        }
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
};

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
  loadCheckout,
  loadCheckoutAddress,
  searchProducts,
  paperget,
  filterProducts,
  loadCoupon,
  loadWishList,
  addToWishlist,
  deleteProductFromWishlist,
  loadWallet,
  loadOrderDetails,
  generateInvoice,
};

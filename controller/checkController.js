const mongoose = require('mongoose');
const moment = require('moment');
const Cart = require('../models/cartModel');
const Products = require('../models/productModel');
const Order = require('../models/orderModel');
const Address=require('../models/addressModel')
const User=require('../models/userModel')
const { v4: uuidv4 } = require('uuid'); 
const Razorpay = require("razorpay");
const crypto=require('crypto')
const Coupon=require('../models/couponModel')
const ProductOffer=require('../models/productOfferModel')
const CategoryOffer=require('../models/categoryOfferModel')
const Wallet=require('../models/walletModel')
const Return=require('../models/returnModel')

const {RAZORPAY_KEY_SECRET}=process.env
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
console.log("RAZORPAY_KEY_ID",RAZORPAY_KEY_ID);


const razorpay=new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
})
// console.log('razorpayrazorpayrazorpay',razorpay)

const addAddressCheckout= async(req,res)=>{
    try {

        const userId=req.session.userId
        console.log(userId,"user id in checkout page ")
        const {mobile,pincode,houseName,area,city,landmark,state}=req.body
        console.log(req.body,"........................ddddddddddddddddddddddddddd")
        const newAddress=new Address({
            userId,
            mobile,
            pincode,
            houseName,
            area,
            city,
            landmark,
            state

        })
        console.log(newAddress,"dkkdjjjjjjjakdjakjdkxkd9kkzm")

        await newAddress.save()
        res.status(200).json({success:true,message:'Address added successfully'})
        
    } catch (error) {
        console.error('Error adding new address:',error)
        res.status(500).json({success:false,message:'Internal serer error'})
        
    }
}







// success page get

const successOrder= async(req,res)=>{


    try {
        res.render("successorder")

        
    } catch (error) {
        console.error('Error fetching products:',error)
        res.status(500).json({success:false,message:'Internal server error'})
    }

}


// place order 




const orderCreate = async (req, res) => {
    try {
        const orderDate = new Date();
        const deliveryDate = new Date(orderDate);
        deliveryDate.setDate(orderDate.getDate() + 4);
        const userId = req.session.userId;
        const { address, paymentMethod } = req.body;

        const addresses = await Address.findById(address);
        if (!addresses) {
            return res.status(400).json({ success: false, message: "Address not found" });
        }

        const cart = await Cart.findOne({ userId }).populate('products.productId');
        if (!cart) {
            return res.status(400).json({ success: false, message: 'Cart not found' });
        }

        const currentDateTime = new Date();

        // Fetch all active offers for the products in the cart
        const productOffers = await ProductOffer.find({
            productId: { $in: cart.products.map(p => p.productId._id) },
            startDate: { $lte: currentDateTime },
            endDate: { $gte: currentDateTime },
        });


        const categoryIds=cart.products.map(p=>p.productId.categoryId)
        const categoryOffers=await CategoryOffer.find({
            categoryId:{$in:categoryIds},
            startDate:{$lte:currentDateTime},
            endDate:{$gte:currentDateTime}

        })

        const cartItems = cart.products.map(item => {
            const originalPrice = item.productId.price;

            // Find the offer for the current product
            const offer = productOffers.find(
                offer => offer.productId.toString() === item.productId._id.toString()
            );


            const categoryOffer=categoryOffers.find(
                offer=>offer.categoryId.toString()===item.productId.categoryId.toString()
            )

            console.log('categoryOffer',categoryOffer)

            // Calculate the product price considering the offer
            let productPrice = originalPrice

            if(offer){
                productPrice-=(originalPrice*(offer.discount/100))
            }

            if(!offer&& categoryOffer){
                productPrice-=(originalPrice*(categoryOffer.discount/100))
            }

                // ? originalPrice - (originalPrice * (offer.discount / 100))
                // : originalPrice;

            return {
                product: item.productId,
                quantity: item.quantity,
                price: productPrice,
            };
        });

        let totalPrice = 0;
        for (const item of cartItems) {
            totalPrice += item.price * item.quantity;
        }

        const tax = totalPrice * 0.05;
        let totalPriceWithTax = totalPrice + tax;

        let discount = 0;
        if (req.session.discount) {
            discount = req.session.discount.discountAmount;
            totalPriceWithTax = req.session.discount.newTotal;
        }

        const newOrderData = {
            orderID: uuidv4(),
            customer: userId,
            products: cartItems.map(item => ({ product: item.product._id, quantity: item.quantity })),
            address: addresses,
            totals: {
                subtotal: totalPrice,
                discount: discount,
                tax: tax,
                totalprice: totalPriceWithTax,
            },
            orderDate,
            deliveryDate,
            paymentMethod,
        };

        if (paymentMethod === 'razorpay') {
            try {
                const amountInPaise = Math.round(totalPriceWithTax * 100);

                const razorpayOrder = await razorpay.orders.create({
                    amount: amountInPaise,
                    currency: "INR",
                    receipt: newOrderData.orderID
                });

                if (!razorpayOrder || !razorpayOrder.status) {
                    throw new Error('Invalid Razorpay order response');
                }

                newOrderData.razorpayOrderId = razorpayOrder.id;

                for (const item of cartItems) {
                    const product = await Products.findById(item.product._id);
                    if (product.quantity >= item.quantity) {
                        product.quantity -= item.quantity;
                        await product.save();
                    } else {
                        return res.status(400).json({ success: false, message: `Not enough stock for product: ${product.name}` });
                    }
                }

                const newOrder = new Order(newOrderData);
                await newOrder.save();
                console.log('newOrder',newOrder)
                 await Cart.findOneAndDelete({ userId });
                 req.session.discount = null;

            return res.status(200).json({
                    success: true,    
                    razorpayOrderId: razorpayOrder.id,
                    amount: totalPriceWithTax,
                    currency: razorpayOrder.currency,
                });

            } catch (error) {
                console.error('Razorpay Order Creation Error:', error);
                return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
            }
        } else if (paymentMethod === 'cashOnDelivery') {

            if(totalPriceWithTax>1000){
                return res.status(400).json({success:false,message:'Cash on delivery is only available for orders below 1000'})
            }


            for (const item of cartItems) {
                const product = await Products.findById(item.product._id);
                if (product.quantity >= item.quantity) {
                    product.quantity -= item.quantity;
                    await product.save();
                    // console.log('productproductproduct',product)
                } else {
                    return res.status(400).json({ success: false, message: `Not enough stock for product: ${product.name}` });
                }
            }

            const newOrder = new Order(newOrderData);
            await newOrder.save();
        const newCart= await Cart.findOneAndDelete({ userId });
            console.log('newCartnewCartnewCartnewCart',newCart)

            return res.status(200).json({ success: true, message: 'Order placed successfully' });

        } else if(paymentMethod==='Wallet'){

            const wallet=await Wallet.findOne({user:userId})
            if(!wallet || wallet.balance<totalPriceWithTax){
                return res.status(400).json({success:false,message:'Insufficient wallet balance'})
            }

            wallet.balance-=totalPriceWithTax

            wallet.transaction.push({
                transactionType:'debit',
                description:'Bought a product through wallet'
            })
            await wallet.save()

            for(const item of cartItems){
                const product=await Products.findById(item.product._id)
                if(product.quantity>=item.quantity){
                    product.quantity-=item.quantity
                    await product.save()
                } else{
                    return res.status(400).json({success:false,message:`Not enough stock:${product.name}`})
                }
            }

            const newOrder=new Order(newOrderData)
            await newOrder.save()
            await Cart.findOneAndDelete({userId})

            if (req.session.discount) {
                console.log('req.session.discount',req.session.discount)
                const user = await User.findById(userId);
                if (user && !user.appliedCoupons.includes(req.session.discount.couponCode)) {
                    user.appliedCoupons.push(req.session.discount.couponCode);
                    await user.save();
                }
            }
            console.log('user.appliedCoupons',user.appliedCoupons)
            console.log('useruseruser',user)



            res.status(200).json({ success: true, message: 'Order created successfully' });

         } else {
            res.status(400).json({ success: false, message: 'Invalid payment method' });
        }

    } catch (error) {
        console.error('Error in orderCreate:', error);
        res.status(500).json({ success: false, message: 'Failed to create order' });
    }
};


const loadOrderHistory = async (req,res)=>{
    try {
        const email=req.session.email
        const userId=req.session.userId
        // console.log("emailcheckoutpage",email)
        // console.log("userIdcheckoutpage",userId)
        const user=await User.findOne({email})
        // console.log("user in checkout page",user)
        if(!user) {
            return res.status(404).json({message:'User not found'})
        }
        const orders=await Order.find({customer:userId}).populate('products.product').populate('address').sort({_id:-1})

        // console.log("orders in checkout page",orders)


        for(const order of orders)  {
            if(order.address && typeof order.address=== ' string') {
                order.address=await Address.findById(order.address)
            }
        }

        // console.log("user address in order history page", orders.map(order => order.address));

        return res.render('orderHistory',{user,orders})
    } catch (error) {
        console.error('error occured',error)
        return res.status(500).json({ message:'internal serveer error'})
        
    }
}

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const orderData = await Order.findById(orderId);
        if (!orderData) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // console.log('Order Data:', orderData);

        // Only allowing cancellation if  order not  delivered
        if (orderData.status !== 'delivered') {
            orderData.status = 'Cancelled';

            // restore the quantities in the products database
            for (const item of orderData.products) {
                const product = await Products.findById(item.product);
                if (product) {
                    product.quantity += item.quantity;
                    await product.save();
                }
            }

            //checking if the payment method was razorpay
            if(orderData.paymentMethod==='razorpay' || orderData.paymentMethod==='Wallet'){
                // finding wallet
                let userWallet=await Wallet.findOne({user:userId})
                if(!userWallet){
                    userWallet=new Wallet({
                        user:userId,
                        balance:0
                        
                    })
                    await userWallet.save()
                }
               // refund the amount to the users wallet
               const refundAmount=orderData.totals.totalprice
               userWallet.balance+=refundAmount

               userWallet.transaction.push({
                transactionType:'credit',
                description:'Cancel order',
                timestamp:new Date()

               })
               await userWallet.save()
               console.log(`Refunded ₹${refundAmount} to user's wallet:`, userWallet);

            }


            await orderData.save();
            return res.status(200).json({ success: true, message: 'Order cancelled successfully' });
        } else {
            console.log('Order already delivered and cannot be cancelled:', orderId);
            return res.status(400).json({ success: false, message: 'Delivered orders cannot be cancelled' });
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};




const verifyPayment=(req,res)=>{
    const {OrderId,paymentId,signature}=req.body

    console.log('OrderId,paymentId,signature',OrderId,paymentId,signature)

    const generatedSignature=crypto.createHmac('sha256',RAZORPAY_KEY_SECRET)
    .update(`${OrderId}|${paymentId}`)
    .digest('hex')

    console.log('generatedSignature',generatedSignature)

    if(generatedSignature===signature) {
        res.json({success:true})

    } else{
        res.json({success:false})
    }
}



const applyCoupon = async (req, res) => {
    try {
      const { couponCode, total } = req.body;
      const userId=req.session.userId


      const coupon = await Coupon.findOne({ couponCode });
      if (!coupon) {
        return res.json({ success: false, message: 'Invalid coupon code' });
      }

      // checking the user has already applied the coupon
      const user=await User.findById(userId)
      if(user && user.appliedCoupons.includes(couponCode)) {
        return res.json({success:false,message:'Coupon has already applied '})
      }
      console.log(user,'user')

      if(total<coupon.minPurchaseAmount) {
        return res.json({success:false,message:`minimum purchase amount of ₹${coupon.minPurchaseAmount} is required to use this coupon  `})
      }

      let discountAmount=0
      let newTotal=total

      if(total>2000 && coupon.maxDiscountAmount){
        discountAmount=coupon.maxDiscountAmount
        newTotal=total-discountAmount
      } else{
  
      const discountPercentage = coupon.discountAmount;
      if (typeof discountPercentage !== 'number' || isNaN(discountPercentage)) {
        return res.json({ success: false, message: 'Invalid discount percentage' });
      }
  
      discountAmount = (total * discountPercentage) / 100;
      newTotal = total - discountAmount;
    }
      req.session.discount={
        discountAmount:discountAmount,
        newTotal:newTotal,
        couponCode:couponCode
      }
      console.log('req.session.discount', req.session.discount)
  
      res.json({
        success: true,
        discountAmount: discountAmount,
        newTotal: newTotal
      });
  
    } catch (error) {
      console.error('Error applying coupon:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };



  const removeCoupon=async (req,res)=>{
    try {
        

        req.session.discount=null

        const originalTotal=req.session.originalTotal||0

        res.json({success:true,originalTotal:originalTotal.toFixed(2)
        })
        
    } catch (error) {
        console.error('Error removingcoupon',error)
        res.status(500).json({success:false,message:'Server error'})
        
    }
  }
  


const returnOrder=async(req,res)=>{
const {orderId,reason}=req.body
const userId=req.session.userId
console.log('orderId',orderId)
console.log('reason',reason)

try {
    const order=await Order.findById(orderId)
    // console.log(user,'user')

    if(!order){
        return res.status(404).json({success:false,message:'Order not found'})

    }

    const productId=order.products.productId
    console.log(productId,'produtId')

    const returnOrder=new Return({
        userId,
        orderId,
        reason,
        productId
    })

    await returnOrder.save()
    console.log('returnOrder',returnOrder)

    res.json({success:true,message:'Return request sent successfully'})


} catch (error) {
    console.error('Error handling return order:',error)
    res.status(500).json({sucess:false,message:'Internal server error'})
    
}

}





const paymentFailure = async (req, res) => {
    const { orderId } = req.body;

    console.log('Received orderId:', orderId);

    try {
        const order = await Order.findOne({ razorpayOrderId: orderId });
        console.log('orderorderorder', order);

        if (!order) {
            console.log('No order found with razorpayOrderId:', orderId);
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        console.log('Order found:', order);

        order.status = 'PaymentFailed';
        await order.save();

        console.log('Updated order status to:', order.status);

        return res.status(200).json({ success: true, message: 'Order status updated to Payment Failed' });
    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
};


const retryPayment=async (req,res)=>{
    const {orderId}=req.body

    try{
        const order=await Order.findById(orderId)
        if(!order){
            return res.status(404).json({success:false,message:'Order not found'})
        }

        if(order.status==='PaymentFailed'){
            order.status='pending'
            await order.save()
        }

        const razorpay=new Razorpay({
            key_id:process.env.RAZORPAY_KEY_ID,
            key_secret:process.env.RAZORPAY_KEY_SECRET
        })

        const paymentOptions={
            amount:order.totals.totalprice*100,
            currency:'INR',
            receipt:order._id.toString()
        }

        const razorpayOrder=await razorpay.orders.create(paymentOptions)


        res.status(200).json({
            success:true,
            key:process.env.RAZORPAY_KEY_ID,
            order_id:razorpayOrder.id,
            amount:razorpayOrder.amount,
        })
    } catch(error){
        console.error('error creating razorpay order:',error)
        res.status(500).json({success:false,message:'Failed to iniate retey payment' })
    }
}





module.exports={
    addAddressCheckout,
    successOrder,
    orderCreate,
    loadOrderHistory,
    cancelOrder,
    verifyPayment,
    applyCoupon,
    removeCoupon,
    returnOrder,
    paymentFailure,
    retryPayment
}
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
const {RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET}=process.env

const razorpay=new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
})

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
        const orderTime = new Date().toLocaleTimeString();
        const currentDate = moment();
        const orderDate = currentDate.format('DD-MM-YYYY');
        const userId = req.session.userId;
        const { address, paymentMethod } = req.body;

        const addresses = await Address.findById(address)
        if(!addresses) {
            return res.status(400).json({success:false,message:"Address not found"})
        }

       
        const cart = await Cart.findOne({ userId }).populate('products.productId');
        if (!cart) {
            return res.status(400).json({success:false,message:'Cart not found'})
        }

        const cartItems = cart.products.map(item => ({
            product: item.productId,
            quantity: item.quantity,
            price: item.productId.price,
        }));


        let totalPrice=0
        for(const item of cartItems) {
            totalPrice+=item.price * item.quantity
        }

        // let totalPrice = 0;
        // for (const item of cartItems) {
        //     const product = await Products.findById(item.product._id);
        //     totalPrice += item.price * item.quantity;
        // }

        const tax=totalPrice *0.05
        const totalPriceWithTax=totalPrice+tax

        const newOrderData = {
            orderID: uuidv4(),
            customer: userId,
            products: cartItems.map(item => ({ product: item.product._id, quantity: item.quantity})),
            address: addresses,
           
            totals: {
                subtotal: totalPrice,
                tax:tax,
                totalprice: totalPriceWithTax
            },
            orderDate,
            orderTime,
            paymentMethod,
        };



        if (paymentMethod === 'cashOnDelivery' || paymentSuccess) {
            // update product quantities
            for(const item of cartItems) {
                const product=await Products.findById(item.product._id)
                if(product.quantity >= item.quantity) {
                    product.quantity-= item.quantity
                    await product.save()
                } else{
                    return res.status(400).json({success:false,message:`Not enough stock for product:${product.name}`})

                }
            }

            // Save the new order 
            
            const newOrder = new Order(newOrderData);
            await newOrder.save();
            await Cart.findOneAndDelete({ userId });

            res.status(200).json({success:true,message:'Order created successfully'})
        } else{
            res.status(400).json({success:false,message:'Payment failed'})
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
        console.log("emailcheckoutpage",email)
        console.log("userIdcheckoutpage",userId)
        const user=await User.findOne({email})
        // console.log("user in checkout page",user)
        if(!user) {
            return res.status(404).json({message:'User not found'})
        }
        const orders=await Order.find({customer:userId}).populate('products.product').populate('address')

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

        console.log('Order Data:', orderData);

        // Only allow cancellation if the order not  delivered
        if (orderData.status !== 'delivered') {
            console.log('Cancelling order:', orderId);
            orderData.status = 'Cancelled';

            // Restore the quantities in the products database
            for (const item of orderData.products) {
                const product = await Products.findById(item.product);
                if (product) {
                    product.quantity += item.quantity;
                    await product.save();
                }
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




module.exports={
    addAddressCheckout,
    successOrder,
    orderCreate,
    loadOrderHistory,
    cancelOrder
}
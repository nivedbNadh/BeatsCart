const mongoose = require('mongoose');
const moment = require('moment');
const Cart = require('../models/cartModel');
const Products = require('../models/productModel');
const Order = require('../models/orderModel');
const Address=require('../models/addressModel')

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
        const email=req.session.email
        const user=await User.find({email})

        
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
        console.log("address",address);
        console.log("paymentMethod",paymentMethod);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }

        if (!address || !address.state || !address.city || !address.landmark || !address.area || !address.pincode || !address.mobile) {
            return res.status(400).json({ success: false, message: 'Incomplete address details' });
        }

        let totalPrice = 0;
        const cart = await Cart.findOne({ userId: userId }).populate('products.productId');
        const cartItems = cart ? cart.products : [];

        if (!cartItems.length) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        for (const item of cartItems) {
            const product = await Products.findById(item.productId);
            if (!product || product.quantity < item.quantity) {
                console.error(`Insufficient stock for product: ${item.productId}`);
                return res.status(400).json({ success: false, message: 'Insufficient stock for one or more items' });
            }
        }

        for (const item of cartItems) {
            const product = await Products.findById(item.productId);
            if (product && product.price) {
                totalPrice += product.price * item.quantity;
            } else {
                console.log(`Product price not available for product: ${item.productId}`);
            }
        }

        const newOrderId = new mongoose.Types.ObjectId().toString();
        const newOrderData = {
            orderId: newOrderId,
            customer: userId,
            products: cartItems.map(item => ({ product: item.productId, quantity: item.quantity })),
            address: address,
            totals: {
                subtotal: totalPrice,
                totalprice: totalPrice // Ensure this field is populated
            },
            orderDate: orderDate,
            orderTime: orderTime,
            paymentMethod: paymentMethod,
        };

        if (paymentMethod === 'cashOnDelivery') {
            const newOrder = new Order(newOrderData);
            await newOrder.save();
            await Cart.findOneAndDelete({ userId: userId }); // Clear the cart
        }

        res.status(200).json({ success: true, message: 'Order created successfully' });
    } catch (error) {
        console.error('Error in orderCreate:', error);
        res.status(500).json({ success: false, message: 'Failed to create order' });
    }
};

module.exports={
    addAddressCheckout,
    successOrder,
    orderCreate
}
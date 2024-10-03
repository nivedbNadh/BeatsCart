

const mongoose=require("mongoose")
const {objectId}=require("mongoose")
const Schema=mongoose.Schema
const Product=require('./productModel')


const orderSchema=new mongoose.Schema({
    orderID:{
        type:String,
        required:true,
    },
    customer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },

   

    products:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'products',
                required:true,
            },

            quantity:{
                type:Number,
                required:true,
            },
        }
    ],

  address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true,
    },
    totals:{
        subtotal:{
            type:Number,
            required:true
        },
        totalprice:{
            type:Number,
            required:true
        }
    },
    orderDate:{
        type:Date,
        required:true
    },
    deliveryDate:{
        type:Date,
        required:true
    },
    status:{
        type:String,
        enum:['pending','Processing','Shipped','Delivered','Cancelled','PaymentFailed','Pending Payment','Returned'],
        default:"pending"

    },
    paymentMethod:{
        type:String,
        enum:['Wallet','razorpay','cashOnDelivery'],
        required:true
    },



    razorpayOrderId: {  
        type: String
    },
})





const Order=mongoose.model('Order',orderSchema)

module.exports=Order
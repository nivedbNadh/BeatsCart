

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
        type:String,
        required:true
    },
    orderTime:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:['pending','Processing','Shipped','Delivered','Cancelled','PaymentFailed'],
        default:"pending"

    },
    paymentMethod:{
        type:String,
        enum:['Wallet','Razorpay','cashOnDelivery'],
        required:true
    }
})



const Order=mongoose.model('Order',orderSchema)

module.exports=Order
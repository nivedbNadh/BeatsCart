

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
                ref:'Product',
                required:true,
            },

            quantity:{
                type:Number,
                required:true,
            },
        }
    ],
    address:{
        mobile:{
            type:Number,
            required:true
        },
        
        pincode:{
            type:Number,
            required:true
        },

        houseName:{
            type:String,
        },

        area:{
            type:String,
            required:true
        },

        landmark:{
            type:String,
            required:true
        },

        city:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        }
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
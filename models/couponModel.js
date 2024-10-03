
const mongoose=require('mongoose')

const couponSchema=new mongoose.Schema({
    couponName:{
        type:String,
        required:true
    },
    couponCode:{
        type:String,
        required:true
    },
    minPurchaseAmount:{
        type:Number,
        required:true
    },
    discountAmount:{
        type:Number,
        required:true
    },
    maxDiscountAmount:{
        type:'Number',
    },
    startDate:{
        type:Date,
        required:true
    },
    
    expiryDate:{
            type:Date,
            required:true,
            // index: { expireAfterSeconds: 0 },


        },
        status:{
            type:Boolean,
            default:true
        }
    
})

module.exports=mongoose.model("coupon",couponSchema)
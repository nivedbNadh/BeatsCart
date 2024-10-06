
const mongoose=require('mongoose')

const UserSchema=new mongoose.Schema({
   name:{
        type:String,
        required:true

    },
   
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    status:{
        default:true,
        type:Boolean

    },
    appliedCoupons:{
        type:[String],
        default:[]
    },
    referralCode: { 
        type: String,
        unique: true 
    },




    // number:{
    //     type:Number,
    //     required:true
    // }
})

module.exports=mongoose.model('User',UserSchema)
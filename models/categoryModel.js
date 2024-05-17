const mongoose=require('mongoose')


const categorySchema=new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    is_deleted:{
        default:false,
        type:Boolean
    }


})
module.exports=mongoose.model("Category",categorySchema)




const mongoose=require('mongoose')

const brandSchema=new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    is_deleted:{
        default:false,
        type:Boolean
    }

})
module.exports=mongoose.model("Brand",brandSchema)








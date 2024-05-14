const mongoose=require('mongoose')
const Category=require('../models/categoryModel')




const productSchema=new mongoose.Schema({

    name:{
        type:"string",
        required:true
    },

    description:{
        type:"string",
        required:true           

    },
image: {
    type:Array,
    required: true
},

price:{
    type:"number",
    required:true



},

category: {
    type: String,
    required: true
},

quantity:{
    type:Number,
    required:true
},
status:{
    default:true,
    type:Boolean

},

is_deleted:{
    default:false,
    type:Boolean

}


})
module.exports=mongoose.model("products",productSchema)



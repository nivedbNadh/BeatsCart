


const mongoose=require('mongoose')
const returnSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    orderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Order',
        required:true
    },
    productId: { type: mongoose.Schema.Types.ObjectId,
         ref: 'products' 
        },

    reason:{
        type:String,
        required:true,
        enum:['Product damaged','Color change','I found a new Product']
    },
    status:{
        type:String,
        required:true,
        enum:['Request for return','Accept','Reject','Delivered'],
        default:'Request for return'
    }
})

const Return=mongoose.model('Return',returnSchema)
module.exports=Return


const mongoose=require('mongoose')

const productOfferSchema=new mongoose.Schema({
 productId: { type: mongoose.Schema.Types.ObjectId,
ref: 'products'
}, 

startDate:{
    type:Date,
    required:true
},
endDate:{
    type:Date,
    required:true
},
discount:{
    type:Number,
    required:true
}
})
module.exports=mongoose.model("productOffer",productOfferSchema)
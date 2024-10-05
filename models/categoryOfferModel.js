

const mongoose=require('mongoose')

const categoryOfferSchema=new mongoose.Schema({
 categoryId: { type: mongoose.Schema.Types.ObjectId,
ref: 'categories'
}, 

productId: { type: mongoose.Schema.Types.ObjectId,
    ref: 'products'
    }, 

startDate:{
    type:Date,
    required:true
},
endDate:{
    type:Date,
    required:true,
    index: { expireAfterSeconds: 0 },

},
discount:{
    type:Number,
    required:true
}
})
module.exports=mongoose.model("categoryOffer",categoryOfferSchema)
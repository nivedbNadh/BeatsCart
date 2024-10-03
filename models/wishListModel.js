const mongoose=require('mongoose')

const wishListSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products' }, 
  });

module.exports=mongoose.model("wishList",wishListSchema)
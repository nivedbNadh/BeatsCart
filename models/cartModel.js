const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: [
        {
            productId: { type: Schema.Types.ObjectId, ref: 'products', required: true },
            quantity: { type: Number, required: true, default: 1 },
            price:{type:Number,required:true,default:0}
        }
    ],
    totals:{
        total:{
            type:Number,
            default:0
        },
        subtotal:{
            type:Number,
            default:0,

        },
        tax:{
            type:Number,
            default:0
        }
    }
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;

const mongoose=require('mongoose')

const walletSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
        unique:true,
    },
    balance:{
        type:Number,
        default:0,
    },
    transaction: [{
        amount: { type: Number },
        transactionType: { type: String, enum: ['debit', 'credit']},
        timestamp: { type: Date, default: Date.now },
        description: { type: String }
    }]

})

const Wallet=mongoose.model('wallet',walletSchema)

module.exports=Wallet
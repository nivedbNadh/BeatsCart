const mongoose = require('mongoose');
const Cart = require('../models/cartModel');
const Products=require('../models/productModel')
const ProductOffer=require('../models/productOfferModel')
const CategoryOffer=require('../models/categoryOfferModel')




const addToCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Products.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const userId = req.session.userId;
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, products: [],subtotal:0,total:0,tax:0 });
        }

        const existingProductIndex = cart.products.findIndex(p => p.productId.toString() === productId);

        if (existingProductIndex >= 0) {
            cart.products[existingProductIndex].quantity += 1;
        } else {
            cart.products.push({ productId, quantity: 1 });
        }

        await cart.save();

        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.error('Error in addToCart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const cart = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = req.session.email;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let cart = await Cart.findOne({ userId }).populate('products.productId');

        if (!cart) {
            cart = new Cart({ userId, products: [], totals: { subtotal: 0, tax: 0, total: 0 } });
            await cart.save();
        }

        let subtotal = 0;
        const currentDate = new Date();

        for (let product of cart.products) {
            // Fetch any active product offer
            const productOffer = await ProductOffer.findOne({
                productId: product.productId._id,
                startDate: { $lte: currentDate },
                endDate: { $gte: currentDate }
            });

            let categoryOffer
            if(product.productId.categoryId){
                categoryOffer=await CategoryOffer.findOne({
                    categoryId:product.productId.categoryId,
                    startDate:{$lte:currentDate},
                    endDate:{$gte:currentDate}
                })
            }

            if (productOffer) {
                // Apply the discount if an active offer is found
                const discount = (product.productId.price * productOffer.discount) / 100;
                product.discountedPrice = product.productId.price - discount;
            } else  if (categoryOffer){
                const discount=(product.productId.price*categoryOffer.discount)/100
                product.discountedPrice=product.productId.price-discount
               
            }else{
                 // No active offer, use the original price
                 product.discountedPrice = product.productId.price;

            }

            // Add to subtotal
            subtotal += product.quantity * product.discountedPrice;
        }

        const taxRate = 0.1;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        cart.totals.subtotal = subtotal;
        cart.totals.tax = tax;
        cart.totals.total = total;
        await cart.save();

        res.render('cart', { cart, subtotal, user });
    } catch (error) {
        console.error('Error in cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const cartDelete= async (req,res)=>{

    try {

        const productId=req.params.productId
        const userId=req.session.userId

        let cart=await Cart.findOne({userId})

        if(!cart) {
            return res.status(404).json({message:'Cart not found'})
        }
        

        const productIndex=cart.products.findIndex(p => p.productId.toString()===productId)

        if(productIndex === -1) {
            return res.status(404).json({message:'Product not found in cart'})

        }

        cart.products.splice(productIndex,1)
        await cart.save()
        res.status(200).json({message:'Product removed from cart successfully'})
    } catch (error) {
        consol.error('Error in cardDelete:',error)
        res.status(500).json({message:'Internal server error'})
        
    }
}



const updateCartQuantity=async (req,res) =>{
    try {

        const {productId,action}=req.body
        const userId = req.session.userId
        // console.log( userId,"dm    dnej     mmmkiwwensndsm,pqwkjnsd;dniensndpqjpqnsde ")

        let cart=await Cart.findOne({userId})

        if(!cart) {
            return res.status(404).json({message:'Cart not found'})

        }

        const productIndex=cart.products.findIndex(P => P.productId.toString() === productId)

        // fetch product from database to check stock quantity
        const product=await Products.findById(productId)

        if(!product) {
            return res.status(404).json({message:'Product not found '})
        }




        if(action=== 'increment') {
            if(cart.products[productIndex].quantity < product.quantity) {
                cart.products[productIndex].quantity+=1
            }else{
                return res.status(400).json({message:'Cannot increment quantity.stock limit reached '})
            }
        } else if(action=== 'decrement') {
            if(cart.products[productIndex].quantity > 1) {
                cart.products[productIndex].quantity-=1
            } else{
                return res.status(400).json({message:'Quantity cannot be less than 1'})
            }
        }





        // if(productIndex === -1) {
        //     return res.status(404).json({message: 'Product not found in cart'})
        // }

        // if(action === 'increment') {
        //     cart.products[productIndex].quantity += 1
        // } else if( action === 'decrement') {
        //     if(cart.products[productIndex].quantity > 1) {
        //         cart.products[productIndex].quantity -= 1

        //     } else{
        //         return res.status(400).json({message:'Qantity  cannot be less than 1'})
        //     }
        // }

        await cart.save()

        const subtotal= cart.products.reduce((acc,product) => {
            return acc + (product.quantity * product.productId.price)
            
        },0)

        res.status(200).json({message:'Quantity updated successfully',subtotal})
       
        
    } catch (error) {
        console.error('Error in updateCartQuantity:',error)
        res.status(500).json({message:'Internal server error'})

    }
}







module.exports = {
    cart,
    addToCart,
    cartDelete,
    updateCartQuantity
};

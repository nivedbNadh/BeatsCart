// const mongoose = require('mongoose');
// const Cart = require('../models/cartModel');
// const Products=require('../models/productModel')
// const addToCart = async (req, res) => {
//     try {
//         const productId = req.params.productId;
//         const product = await Products.findById(productId);

//         if (!product) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         const userId = req.session.userId;
//         let cart = await Cart.findOne({ userId });

//         if (!cart) {
//             cart = new Cart({ userId, products: [] });
//         }

//         const existingProductIndex = cart.Products.findIndex(p => p.productId.toString() === productId);

//         if (existingProductIndex >= 0) {
//             cart.products[existingProductIndex].quantity += 1;
//         } else {
//             cart.products.push({ productId, quantity: 1 });
//         }

//         await cart.save();

//         res.status(200).json({ message: 'Product added to cart successfully' });
//     } catch (error) {
//         console.error('Error in addToCart:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

// const cart = async (req, res) => {
//     try {
//         const userId = req.session.userId;
//         const cart = await Cart.findOne({ userId }).populate('products.productId');

//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found' });
//         }

//         let subtotal = 0;
//         cart.products.forEach(product => {
//             subtotal += product.quantity * product.productId.price;
//         });

//         res.render('cart', { cart, subtotal });
//     } catch (error) {
//         console.error('Error in cart:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

// module.exports = {
//     cart,
//     addToCart,
// };

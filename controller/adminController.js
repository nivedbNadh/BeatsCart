// const {json}=require('body-parser')
const dotenv=require('dotenv')
dotenv.config()
const bcrypt=require('bcrypt')
const { validationResult } = require('express-validator');
const multer=require('multer')
const User=require('../models/userModel')
const path = require('path');
const sharp = require('sharp');
const fs = require('fs/promises').unlink;
const FS = require('fs');

const Products=require('../models/productModel')
const Category=require('../models/categoryModel')




const adminLoging=async (req,res)=>{
    try {
        res.render('adminlogin')
        
    } catch (error) {
        console.log("error ocured",error);
    }
}


const adminDashBoard=async (req,res)=>{
    try {
        res.render('adminDash')
        
    } catch (error) {
        console.log("error ocured",error);
    }
}


const adminLogingPost = async (req, res) => {
    try {
        const { email, password } = req.body;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        console.log(adminEmail, adminPassword);

        if (adminEmail === email && adminPassword === password) {
            res.redirect('/adminDash');
            const hashedPassword=await bcrypt.hash(password,10)
            console.log();
        } else {
            req.flash('error', 'Invalid email or password');
            res.redirect('/adminlogin');
        }
    } catch (error) {
        console.error('An error occurred:', error);
        req.flash('error', 'An error occurred. Please try again later.');
        res.redirect('/adminlogin');
    }
}

  const loadUserDetails= async (req,res)=>{
    try {
        const users = await User.find()
        console.log('userrrr',users);
        let i = 0;
        res.render('userdetails', { users, i });
        
    } catch (error) {
        console.log("error ocured",error);

        
    }
  }
    
  const blockUser = async (req,res)=>{

    try {
        const userId=req.body.userId
        
        const user = await User.findById(userId)
        console.log(userId)
        if(!user)
      return res.status(404).json({error:"user not found"})


      user. status=false
      await user.save()

      res.redirect('/userdetails?success+=blocked')

    } catch (error) {
        console.log("error unblocking user",error)
        res.status(500).json({error:"internaal server error"})
    }
  }



const userUnBlock = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.status = true; // Set user status to active
        await user.save();
        res.redirect('/userdetails?unblock successfully')

    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const productList = async(req,res)=>{
    try{

        const products = await Products.find()
        // console.log('products',products);

        res.render('productList',{products})

    }catch(error){
        console.error('Error listing products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}



const addProduct = async(req,res)=>{
    try{

        const category = await Category.find()
        console.log('category',category);

        res.render('addProduct',{category})

    }catch(error){
        console.error('Error adding products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


const addAdminProduct = async (req, res) => {
    try {
        const { name, description, price, category, quantity } = req.body;
        console.log('req.file this  is image', req.files);

        // const imagePath = req.file.path; 
        // const imageFilename = req.file.filename; 

        // console.log('imagePath', imagePath);
        // console.log('imageFilename', imageFilename);
        let img=[req.files[0].filename,req.files[1].filename,req.files[2].filename,req.files[3].filename]

        const product = new Products({
            name,
            description,
            price,
            category,
            quantity,
            image: img
        });

        console.log('product,,,,,,,,,',product);

        await product.save();
        
        res.redirect('productList'); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


const categoryList = async(req,res)=>{
    try{

        const category = await Category.find()
        console.log('category',category);

        res.render('categoryList',{category})

    }catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}


const addCategory = async(req,res)=>{
    try{

        
        

        res.render('addCategory')

    }catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}


const addAdminCategory = async(req,res)=>{
    try{
        const {categoryName} = req.body;
        // const newcategory=await category.find()
        // if(newcategory===)
    
        console.log('categoryName',categoryName);
        const category = new Category({
            name:categoryName
        });
        await category.save();
        res.redirect('categoryList'); 
    }catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}





const deleteProducts=async (req,res)=>{
    try {
        const productId=req.params.id
        console.log("productId",productId)
        await Products.findByIdAndDelete(productId)
        console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",productId);

        res.sendStatus(200)

    } catch (error) {
        console.error("Error deleting product:",error)
        res.status(500).send("error deleting product")
        
    }
}



const loadEditProduct= async (req,res)=>{
    try {
        res.render('editProduct')
    } catch (error) {
        console.error(error)
        res.status(500).send("Internal server error")
        
    }
}




const categoryDelete= async (req,res)=>{
    try {
        categoryId=req.params.id
        const deleteCategory=await Category.findByIdAndDelete(categoryId)
        if(!deleteCategory){
            return res.status(400).json({message:"category not found "})

        }
        res.status(200).json({message:"category deleted successfully "})
    } catch (error) {
        console.error("error deleting category :",error)
        res.status(500).json({message:"internal server error"})
        
    }

}





module.exports={
    adminLoging,
    adminLogingPost,
    adminDashBoard,
    loadUserDetails,
    userUnBlock,
    blockUser,
    productList,
    addProduct,
    addAdminProduct,
    categoryList,
    addCategory,
    addAdminCategory,
    deleteProducts,
    loadEditProduct,
    categoryDelete,
    // editCategory
    // productUpdate,
    // editform

}


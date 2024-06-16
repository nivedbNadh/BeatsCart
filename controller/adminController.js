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
const Admin=require('../models/adminModel')
const Order = require('../models/orderModel');





const adminLoging=async (req,res)=>{
    try {
        res.render('adminlogin',{error:null})
        
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
    const { email, password } = req.body;
    console.log(" email, password", email, password)

    try {
        const adminLog=await Admin.findOne({email:email})
        console.log("adminLogadminLogadminLog",adminLog)
        if(!adminLog || adminLog.password !==password) {
            return res.render('adminlogin',{error:'Invalid email or password'})
        }

        req.session.adminLogId=adminLog._id
        req.session.adminlogged=true
        return res.redirect('/adminDash')

 

    } catch (error) {
        res.render('adminlogin',{error:'Server error'})
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
       
        if(!user)
       return res.status(404).json({error:"user not found"})
     let  flag = false;
        if(user.status === true){
            user.status = false;
            flag = true;
        }else{
            user.status = true;
        }

      await user.save()
      if(flag){
      return  res.redirect('/userdetails?success+=blocked')
      }
     return res.redirect('/userdetails?success+=unblock')

    } catch (error) {
        console.log("error unblocking user",error)
        res.status(500).json({error:"internaal server error"})
    }
  }





const productList = async(req,res)=>{
    try{

        const products = await Products.find({is_deleted : false})
        // console.log('products',products);

        res.render('productList',{products})

    }catch(error){
        console.error('Error listing products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}



const addProduct = async(req,res)=>{
    try{

        const category = await Category.find({is_deleted:false})
        console.log('category',category);

        res.render('addProduct', {category})

    }catch(error){
        console.error('Error adding products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


const addAdminProduct = async (req, res) => {
    try {
        const { name, description, price, category, quantity } = req.body;
        // console.log('req.file this  is image', req.files);
        if(req.files.length<1) {
            console.error("Not enough files uploaded");
            res.status(400).send("Not enough files uploaded");
            return 
        }
        
        const img = req.files.map((file) => file.filename); 
        console.log(img)
            
        // const imagePath = req.file.path; 
        // const imageFilename = req.file.filename; 

        // console.log('imagePath', imagePath);
        // console.log('imageFilename', imageFilename);
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

        const category = await Category.find({is_deleted:false})
        // console.log('category',category);

        res.render('categoryList',{category})

    }catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}


const addCategory = async(req,res)=>{
    try{

        
        

      return res.render('addCategory',{error:null})

    }catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}


const addAdminCategory = async (req, res) => {
    try {
        const { categoryName } = req.body;
        console.log('categoryName', categoryName);

        if (typeof categoryName !== 'string') {
            return res.status(400).json({ error: 'Invalid category name' });
        }
        const existingCategory = await Category.findOne({ name: categoryName });
        if (existingCategory) {
            console.log(existingCategory, "existingCategory");
            return res.status(400).json({ error: 'Category already exists' });
        }

        const category = new Category({ name: categoryName });
        await category.save();

        res.status(200).json({ message: 'Category added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};


const deleteProducts= async (req,res)=>{
    try{
        const productId=req.params.id
        console.log("productId",productId)
        const product=await Products.findByIdAndUpdate(productId)
        console.log("productnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn",product)
        if(!product) {
            console.log("product not found")
            return res.status(404).json({message:'Product not found'})
        }

        console.log("product permenently soft deleted successfully")
        res.json({message:'Product permenently soft deleted '})

        product.is_deleted=true
        await product.save()
        // console.log("Product soft deleted successfully","Product soft deleted successfully")
        // res.json({message:'Product soft deleted successfully'})

        
    } catch (error) {
        res.status(500).json({message:error.message})
    }
}




const loadEditProduct= async (req,res)=>{
    try {
        const productId=req.params.id.trim()

        console.log("productId",productId)
        Promise.all([

          Products.findById(productId),
          Category.find({})
        ])
        .then(([product,categories])=>{
            res.render('editProduct',{product,categories})
        })
        
    } catch (error) {
        console.error(error)
        res.status(500).send("Internal server error")
        
    }
}



const categoryDelete = async (req, res) => {
    try {
        const categoryId = req.params.id;
        console.log("categoryId", categoryId);
        
        const category = await Category.findByIdAndUpdate(categoryId);
        console.log("category", category);
        
        if (!category) {
            console.log("Category not found");
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
        category.is_deleted=true
        await category.save()

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: error.message });
    }
}

const editCategory=async (req,res)=>{
    try{
    const categoryId = req.body.categoryId;
    const categoryName = req.body.categoryName;

    console.log('categoryId',categoryId);
    console.log('categoryName',categoryName);

    const category = await Category.findById(categoryId);
    category.name = categoryName;
    await category.save();
    res.status(200).json({ message: "Category updated successfully", category: category });

    }catch (error){
        console.error('Error updating category',error)
        res.status(500).json({error:"internal server error"})

    }
}



const productUpdate = async function (req, res) {
    const productId = req.params.id.trim()
    const { name, description, category, price, quantity } = req.body;
    console.log("name, description, category, price, quantity",name, description, category, price, quantity)
    const deleteExistingImages = req.body;
    console.log("deleteExistingImages",deleteExistingImages)
    const newImages = req.files;
    

    try {
        const currentProduct = await Products.findById(productId);
        if (!currentProduct) {
            console.log("!currentProduct",currentProduct)
            return res.status(404).send('Product not found');
        }
        for (const key in deleteExistingImages) {
            if (key.startsWith('deleteExistingImage')) {
                const index = parseInt(key.replace('deleteExistingImage', ''));
                const imageFilename = deleteExistingImages[key];
                const imagePath = path.join(__dirname, '../public/uploads', imageFilename);
                
                await FS.promises.unlink(imagePath);
                console.log('Image Deleted Successfully:', imageFilename);
                
                currentProduct.image.splice(index, 1);
                
                await Products.deleteOne({ filename: imageFilename });
                console.log('Image deleted from the database:', imageFilename);
            }
        }

        if (newImages && newImages.length > 0) {
            newImages.forEach(async (image) => {
                const imageFilename = image.filename;
                currentProduct.image.push(imageFilename);
                console.log('New image added:', imageFilename);
            });
        }
        currentProduct.name = name;
        currentProduct.description = description;
        currentProduct.category = category;
        currentProduct.price = price;
        currentProduct.quantity = quantity;

        await currentProduct.save();
        res.redirect('/productList');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};








const loadAdminManage= async (req,res)=>{
    try {
        
        const orders=await  Order.find()
        .sort({"orderDate":-1,"orderTime":-1})
        .populate({
            path:'products.product',
            model:'products',
            select:'name price description image',
            paymentMethod:'paymentMethod'
            })
            . exec()
            console.log(orders,"orders in adminController page please check it any problem ..........")
        return res.render('orderManage',{orders})
    } catch (error) {
        console.error('error occured',error)
        return res.status(500).json({error:'internal server error'})
        
    }
}





const updateOrderStatus =async(req,res)=>{
    try {
        const {orderId,newStatus}=req.body
    const result = await Order.findOneAndUpdate({_id:orderId},{$set:{status:newStatus}})
    
        // console.log(req.body,",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,")
        // console.log(result,"resultresultresultresult")
    } catch (error) {
        console.error('error updating status',error)
        res.status(500).send('internal server error')
    }
}




module.exports={
    adminLoging,
    adminLogingPost,
    adminDashBoard,
    loadUserDetails,
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
    editCategory,
    productUpdate,
    loadAdminManage,
    updateOrderStatus

}


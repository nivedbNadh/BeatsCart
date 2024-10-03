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
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');



const Products=require('../models/productModel')
const Category=require('../models/categoryModel')
const Admin=require('../models/adminModel')
const Order = require('../models/orderModel');
const brand=require('../models/BrandModel')
const Coupon=require('../models/couponModel')
const ProductOffer=require('../models/productOfferModel')
const CategoryOffer=require('../models/categoryOfferModel')
const Return=require('../models/returnModel')
const Wallet=require('../models/walletModel')





const adminLoging=async (req,res)=>{
    try {
        res.render('adminlogin',{error:null})
        
    } catch (error) {
        console.log("error ocured",error);
    }
}


const adminDashBoard = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const deliveredOrders = await Order.find({ status: 'delivered' });

        // console.log('Delivered Orders:', deliveredOrders)

        const selectedTimeInterval = req.query.interval || "daily";
        let timeFormat, dateFormat;
        
        if (selectedTimeInterval === "monthly") {
            timeFormat = "%Y-%m";
            dateFormat = "MMMM YYYY";
        } else if (selectedTimeInterval === "yearly") {
            timeFormat = "%Y";
            dateFormat = "YYYY";
        } else {
            timeFormat = "%Y-%m-%d";
            dateFormat = "MMMM DD, YYYY";
        }

        const ordersWithDate = await Order.aggregate([
            { $match: { _id: { $in: deliveredOrders.map(order => order._id) }, orderDate: { $exists: true } } },
            { $addFields: { orderDate: { $toDate: "$orderDate" } } },
            {
                $group: {
                    _id: { $dateToString: { format: timeFormat, date: "$orderDate", timezone: "+0530" } },
                    count: { $sum: 1 }
                }
            },
            { $project: { _id: 0, date: "$_id", count: 1 } },
            { $sort: { date: 1 } }
        ]).exec();

        // console.log('Orders with Date:', ordersWithDate); 

        // top selling products 
        const topSellingProducts=await Order.aggregate([
            {$match:{status:'delivered'}},
            {$unwind:"$products"},
            {
                $group:{
                    _id:"$products.product",
                    totalQuantity:{$sum:"$products.quantity"}
                }
            },
            {$sort:{totalQuantity:-1}},
            {$limit:5},
            {
                $lookup:{
                    from:'products',
                    localField:'_id',
                    foreignField:'_id',
                    as:'productInfo'
                }
            },
            {
                $project:{
                    _id:1,
                    totalQuantity:1,
                    productName:{$arrayElemAt:["$productInfo.name",0]}  // taking product name
                }

            }
        ])
        // console.log('topSellingProducts',topSellingProducts);
        


        // top selling category

        const topSellingCategories = await Order.aggregate([
            { $match: { status: 'delivered' } }, 
            { $unwind: "$products" }, 
            {
                $lookup: {
                    from: 'products', 
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' }, 
            {
                $group: {
                    _id: '$productDetails.category', 
                    totalQuantity: { $sum: '$products.quantity' } 
                }
            },
            { $sort: { totalQuantity: -1 } }, 
            { $limit: 3 }, 
            {
                $lookup: {
                    from: 'categories', 
                    localField: '_id', 
                    foreignField: '_id', 
                    as: 'categoryInfo'
                }
            },
            {
                $project: {
                    _id: 1,
                    totalQuantity: 1,
                    categoryName: { $arrayElemAt: ["$categoryInfo.name", 0] }
                }
            }
        ]);
        
        // console.log('topSellingCategories:', topSellingCategories);





        const topSellingBrands = await Order.aggregate([
            { $match: { status: 'delivered' } }, 
            { $unwind: "$products" }, 
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' }, 
            {
                $group: {
                    _id: '$productDetails.brand', 
                    totalQuantity: { $sum: '$products.quantity' }
                }
            },
            { $sort: { totalQuantity: -1 } }, 
            { $limit: 5 },
            {
                $project: {
                    _id: 0,
                    brandName: '$_id', 
                    totalQuantity: 1
                }
            }
        ]);
        
        // console.log('topSellingBrands', topSellingBrands);
        
        const validOrdersWithDate = ordersWithDate.filter(order => order.date && order.date !== "null");
        const xValues = validOrdersWithDate.map(order => order.date);
        const yValues = validOrdersWithDate.map(order => order.count);

        console.log('xValues:', xValues); 
        console.log('yValues:', yValues); 

        res.render('adminDash', { xValues: JSON.stringify(xValues), yValues ,topSellingProducts,topSellingCategories,topSellingBrands});
    } catch (error) {
        console.log("error occurred", error);
        res.status(500).send("Internal server error");
    }
};



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
        const brands=await brand.find({is_deleted:false})
        console.log(brand,"brandaddtoproduct");
        
        console.log('category',category);

        res.render('addProduct', {category,brands})

    }catch(error){
        console.error('Error adding products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


const addAdminProduct = async (req, res) => {
    try {
        const { name, description, price, category, quantity,brand } = req.body;

        console.log('category',category)


        const categoryDoc=await Category.findOne({name:category})
        console.log('categoryDoc',categoryDoc)

        if(!categoryDoc){
            return res.status(400).send('category not found')
        }
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
            categoryId:categoryDoc._id,
            brand,
            quantity,
            image: img,
        });

        // console.log('product,,,,,,,,,',product);

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



const brandList=async(req,res)=>{
    try{
        const brands=await brand.find({is_deleted:false}) 
        res.render('brandlist',{brand:brands})
    }catch(error) {
        console.error(error)
        res.status(500).send('Internal server error')
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


const addBrand=async(req,res)=>{
    try{
        return res.render('addBrands',{error:null})
    }catch(error) {
        console.error(error)
        res.status(500).send('server error')
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



const addAdminBrand =async( req,res)=>{
    const {brandsName}=req.body
if(typeof brandsName!=='string'){
    return res.status(400).json({error:'invalid brand name'})
}    
const existingBrand=await brand.findOne({name:brandsName})
if(existingBrand){
    console.log(existingBrand,"existingbrand");
    return res.status(400).json({error:'brand name already exist'})
    
}
const brands=new brand({name:brandsName})
await brands.save()
res.status(200).json({message:'Brand added successfully'})
}


const deleteProducts= async (req,res)=>{
    try{
        const productId=req.params.id
        console.log("productId",productId)
        const product=await Products.findByIdAndUpdate(productId)
        // console.log("productnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn",product)
        if(!product) {
            console.log("product not found")
            return res.status(404).json({message:'Product not found'})
        }

        // console.log("product permenently soft deleted successfully")
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


const brandDelete=async (req,res)=>{
try{
    const brandId=req.params.id
    console.log("brandIdbrandIdbrandId",brandId);

    const brands=await brand.findById(brandId)
    console.log("brands",brands)

    if(!brands){
        console.log("brand not found")
        return res.status(404).json({message:'brand not found'})
    }
    brands.is_deleted=true
    await brands.save()
    res.json({message:'Brand deleted successfully'})
} catch(error){
    console.error('Error:',error)
    res.status(500).json({message:error.message})
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
const editBrand=async(req,res)=>{
    try{
        const brandId=req.body.brandId
        const brandName=req.body.brandName

        console.log('brandId',brandId)
        console.log('brandName',brandName)

        const brands=await brand.findById(brandId)
        console.log(brands,"brandsbrandsbrands")
        if(!brands){
           return res.status(404).json({message:'Brand not found'})
        }
        brands.name=brandName
        await brands.save()
        res.status(200).json({message:'brand updated successfully',brand:brands})


    } catch (error){
        console.error('Error updating brand',error)
        res.status(500).json({error:'internal server error'})
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








const loadAdminManage = async (req, res) => {
    try {
      const orders = await Order.aggregate([
        { $sort: { orderDate: -1, orderTime: -1 } },
        { $unwind: '$products' }, 
        {
          $lookup: {
            from: 'products', 
            localField: 'products.product',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $unwind: '$productDetails' },
        {
          $lookup: {
            from: 'users',
            localField: 'customer',
            foreignField: '_id',
            as: 'customerDetails'
          }
        },
        { $unwind: '$customerDetails' },
        {
          $addFields: {
            totalPrice: {
              $multiply: ['$productDetails.price', '$products.quantity'] 
            }
          }
        },
        {
          $project: {
            _id: 1,
            orderDate: 1,
            'products.quantity': 1, 
            'productDetails.name': 1,
            'productDetails.price': 1,
            'productDetails.description': 1,
            'customerDetails.name': 1,
            'customerDetails.email': 1,
            paymentMethod: 1,
            totalPrice: 1, 
            status: 1 
          }
        }
      ]);
  
      console.log(orders, "orders in adminController page after aggregation");
      return res.render('orderManage', { orders });
    } catch (error) {
      console.error('error occurred', error);
      return res.status(500).json({ error: 'internal server error' });
    }
  };
  




const updateOrderStatus =async(req,res)=>{
    try {
        const {orderId,newStatus}=req.body
    const result = await Order.findOneAndUpdate({_id:orderId},{$set:{status:newStatus}})


    if(result){
        res.status(200).json({message:'order status updated successfully'})

    } else{
        res.status(404).json({message:'order not found'})
    }
    
        // console.log(req.body,",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,")
        // console.log(result,"resultresultresultresult")
    } catch (error) {
        console.error('error updating status',error)
        res.status(500).send('internal server error')
    }
}





const loadAddCouponPage= async (req,res)=>{
    try {

        res.render('addCoupon')
    } catch (error) {

        console.error('error occured',error)
        res.status(500).send('internal server error')
        
    }
}
const couponListPage= async (req,res)=>{
    try {

        const coupons=await Coupon.find({status:true})
        // console.log('couponscouponscouponscouponscoupons',coupons)

        return res.render('couponList',{coupons})
        
    } catch (error) {
        console.error('error occured',error)
        res.status(500).send('internal server error')
        
    }
}


const addCouponToDB=async (req,res)=>{
    try {
        console.log('hiiiiiiiiiiiiiiiiiii')
        const {couponName,couponCode,minPurchaseAmount,discountAmount,maxDiscountAmount,startDate,expiryDate}=req.body
        // console.log('couponName,',couponName,couponCode,minPurchaseAmount,discountAmount,startDate,expiryDate)

        const newCoupon=new Coupon({
            couponName,
            couponCode,
            minPurchaseAmount,
            maxDiscountAmount,
            discountAmount,
            startDate,
            expiryDate
        })

        await newCoupon.save()

        return res.status(200).json({message:'coupon created successfully'})
        
    } catch (error) {
        
    }
}


const loadEditCoupon = async(req,res)=>{
    try {
        const couponId=req.params.id.trim()
        const coupon=await Coupon.findById(couponId)
        // console.log(coupon,'coupon')

        res.render('editCoupon',{coupon})
        
    } catch (error) {
        console.error('error occured',error)
        res.status(500).json({message:'internal server'})
    }
}



const updateCoupon = async (req, res) => {
    try {
        const { couponName, couponCode, minPurchaseAmount, discountAmount, startDate, expiryDate } = req.body;
        const couponId = req.params.id;

        const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, {
            couponName,
            couponCode,
            minPurchaseAmount,
            discountAmount,
            startDate,
            expiryDate
        }, { new: true });

        if (!updatedCoupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.status(200).json({ message: 'Coupon updated successfully' });
    } catch (error) {
        console.error('Error updating coupon', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



const couponDelete=async (req,res)=>{
    try {
        const couponId=req.params.id
        const updatedCoupon=await Coupon.findByIdAndUpdate(couponId,{status:false},{new:true})
        if(!updatedCoupon) {
            return res.status(404).json({message:'Coupon not found'})
        }

        res.status(200).json({message:'Coupon deleted successfully'})
        
    } catch (error) {
        console.error('Error deleting coupon',error)
        res.status(500).json({message:'Internal server error'})
        
    }
}






const loadProductOffer=async(req,res)=>{
    try {

        const products=await Products.find({is_deleted:false})
        const productOff=await ProductOffer.find()
        // console.log('products',products)

        res.render('productOffer',{products,productOff})
        
    } catch (error) {
        console.error('An error occcured',error)
        res.status(500).json({message:'Internal serer error'})
        
    }
}

const addProductOffer=async(req,res)=>{
    try{
    const {productId,discount,startDate,endDate}=req.body
    console.log('productId,discount,startDate,endDate',productId,discount,startDate,endDate)

    const productOff=new ProductOffer({
        productId,
        discount,
        startDate,
        endDate
    })
    await productOff.save()
    res.status(200).json({message:'offer added successfully'})

    }catch(error){
        console.error('An error occured',error)
        res.status(500).json({message:'internal server error'})
    }


}


const updateProductOffer=async(req,res)=>{
    try{
        const {productId}=req.params
        const {discount,startDate,endDate}=req.body

        let productOffer=await ProductOffer.findOne({productId})
        if(productOffer){
            productOffer.discount=discount
            productOffer.startDate=new Date(startDate)
            productOffer.endDate=new Date(endDate)
        } else{
            productOffer=new ProductOffer({
                productId,
                discount,
                startDate:new Date(startDate),
                endDate:new Date(endDate)
            })
        }
        await productOffer.save()
        res.json({success:true,message:'Product offer updated successfull'})
    } catch(error){
        console.error('An error occured',error)
        res.status(500).json({success:false,message:'Internal serer error'})
    }
}


const deleteProductOffer=async(req,res)=>{
    try{

        const {productId}=req.params

        const result=await ProductOffer.deleteOne({productId})

        if(result.deletedCount>0){
            res.json({success:true,message:'Product offer deleted successfully'})

        } else{
            res.json({success:false,message:'Product offer not  found '})
        }

    } catch(error){
        console.error('An error occured:',error)
        res.status(500).json({success:false,message:'Internal server error'})
    }
}





const chartPage=async(req,res)=>{
    try {
        res.render('chart')
        
    } catch (error) {
        console.error('an error occured',error)
        
    }
}


const downloadSalesReport = async (req, res) => {
    const { startDate, endDate } = req.body;

    const endDateWithTime = new Date(endDate);
    endDateWithTime.setHours(23, 59, 59, 999);

    try {
        const orders = await Order.find({
            orderDate: { $gte: new Date(startDate), $lte: endDateWithTime },
            status: 'delivered',
        })
        .populate('customer', 'name')
        .populate('products.product', 'name');

        const doc = new PDFDocument({
            size: [1100, 1000], 
            margin: 30 
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.contentType('application/pdf');
            res.setHeader('Content-Disposition', 'attachment;filename=sales_report.pdf');
            res.send(pdfData);
        });

        doc.fontSize(16).text('Sales Report', { align: 'center' });
        doc.moveDown();

        const tableTop = doc.y;
        const columnWidths = [60, 250, 180, 170, 120, 80, 90]; 
        const headers = ['No', 'Order Id', 'Customer', 'Product', 'Date', 'Quantity', 'Total'];
        const rowHeight = 25; 

        headers.forEach((header, i) => {
            const x = 30 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.rect(x, tableTop, columnWidths[i], rowHeight).stroke();
            doc.fontSize(10).text(header, x + 5, tableTop + 5, { width: columnWidths[i] - 10, align: 'left' });
        });
        doc.moveDown();

        let yPosition = tableTop + rowHeight;

        orders.forEach((order, orderIndex) => {
            order.products.forEach((product, productIndex) => {
                const row = [
                    (orderIndex * order.products.length) + (productIndex + 1),
                    order.orderID,
                    order.customer.name,
                    product.product.name,
                    order.orderDate.toISOString().split('T')[0],
                    product.quantity,
                    Math.floor(order.totals.totalprice) 
                ];

                if (yPosition + rowHeight > doc.page.height - 50) {
                    doc.addPage();
                    yPosition = 30; 

                    headers.forEach((header, i) => {
                        const x = 30 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
                        doc.rect(x, yPosition, columnWidths[i], rowHeight).stroke();
                        doc.fontSize(10).text(header, x + 5, yPosition + 5, { width: columnWidths[i] - 10, align: 'left' });
                    });
                    yPosition += rowHeight; 
                }

                row.forEach((cell, i) => {
                    const x = 30 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
                    const width = columnWidths[i];

                    doc.rect(x, yPosition, width, rowHeight).stroke();
                    doc.fontSize(10).text(cell, x + 5, yPosition + 5, { width: width - 10, align: 'left' });
                });

                yPosition += rowHeight; 
            });
        });

        doc.end();
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
};



const salesreportExcell = async (req, res) => {
    const { startDate, endDate } = req.body;

    const endDateWithTime = new Date(endDate);
    endDateWithTime.setHours(23, 59, 59, 999);

    try {
        const orders = await Order.find({
            orderDate: { $gte: new Date(startDate), $lte: endDateWithTime },
            status: 'delivered',
        })
        .populate('customer', 'name')
        .populate('products.product', 'name');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'No', key: 'no', width: 10 },
            { header: 'Order Id', key: 'orderID', width: 40 },
            { header: 'Customer', key: 'customer', width: 30 },
            { header: 'Product', key: 'product', width: 30 },
            { header: 'Date', key: 'orderDate', width: 20 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Total', key: 'total', width: 15 }
        ];

        let rowIndex = 1;

        orders.forEach((order, orderIndex) => {
            order.products.forEach((product, productIndex) => {
                const row = worksheet.addRow({
                    no: (orderIndex * order.products.length) + (productIndex + 1),
                    orderID: order.orderID,
                    customer: order.customer.name,
                    product: product.product.name,
                    orderDate: order.orderDate.toISOString().split('T')[0],
                    quantity: product.quantity,
                    total: Math.floor(order.totals.totalprice)
                });

                // Apply center alignment to each cell in the row
                row.eachCell((cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                });

                rowIndex++;
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

        await workbook.xlsx.write(res);

        res.end();
    } catch (error) {
        console.error('Error generating Excel report:', error);
        res.status(500).send('Failed to generate Excel report');
    }
};



const loadReturManage = async (req, res) => {
  try {
    const returns = await Return.find()
    .populate('userId')
    .populate('productId')
      .exec()
      

    console.log('returnssssssssssssssssssssssssssss', returns);

    res.render('returnManagement', { returns });
  } catch (error) {
    console.error('An error occurred', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



const updateReturnStatus = async (req, res) => {
    try {
      const { returnId, orderId, status } = req.body;
      console.log('returnId,orderId,status', returnId, orderId, status);
  
      const returnItem = await Return.findByIdAndUpdate(returnId, { status: status }, { new: true });
      console.log('returnItem', returnItem);
  
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      if (status === 'accepted') {
        const orderStatus = await Order.findByIdAndUpdate(orderId, { status: 'Returned' });
  
        if (order.paymentMethod === 'razorpay' || order.paymentMethod === 'Wallet') {  // Corrected case
          const userWallet = await Wallet.findOne({ userId: order.customer });
          console.log('userWallet found:', userWallet);
  
          if (!userWallet) {
            const newWallet = new Wallet({
              user: order.customer,
              balance: order.totals.totalprice,
              transaction: [
                {
                //   amount: order.totals.totalprice,
                  transactionType: 'credit',
                  description: 'Return order',
                  timestamp: new Date()
                }
              ]
            });
            await newWallet.save();
            console.log('newWallet created:', newWallet);
          } else {
            userWallet.balance += order.totals.totalprice;
            userWallet.transaction.push({
            //   amount: order.totals.totalprice,
              transactionType: 'credit',
              description: 'Return order',
              timestamp: new Date()
            });
            await userWallet.save();
            console.log('Refund to existing wallet:', order.totals.totalprice);
          }
        }

        for (let item of order.products) {
          const product = await Products.findById(item.product._id);
          if (product) {
            product.stock += item.quantity;
            await product.save();
          }
        }
  
      } else if (status === 'rejected') {
        await Order.findByIdAndUpdate(orderId, { status: 'Delivered' });
      }
  
      res.json({ message: 'Return status updated successfully' });
    } catch (error) {
      console.error('Error updating return status', error);
      res.status(500).json({ message: 'Error updating return status' });
    }
  };
  





const loadCategoryOffer=async(req,res)=>{

    try {

        const category=await Category.find({is_deleted:false})
        const categoryOffer=await CategoryOffer.find()
        console.log('category',category)
        console.log('categoryOffer',categoryOffer)



        res.render('categoryOffer',{category,categoryOffer})
        
    } catch (error) {
        console.error('an error occured',error)
        return res.status(500).json({message:'internal server error'})
    }
}




const categoryOfferSaving=async (req,res)=>{

        const {categoryId,discount,startDate,endDate}=req.body

        console.log('req.body',req.body)

        try{
            const categoryOffer=new CategoryOffer({
                categoryId,
                discount,
                startDate,
                endDate

            })
            await categoryOffer.save()
            res.json({success:true,message:'category offer saved successfully'})
        } catch(error){
            console.error('Error saving category offer',error)
            res.status(500).json({message:'internal server error'})
        }
}



const updateCategoryOffer=async(req,res)=>{
    try{
        const {categoryId}=req.params
        const {discount,startDate,endDate}=req.body

        let categoryOffer=await CategoryOffer.findOne({categoryId})
        if(categoryOffer){
            categoryOffer.discount=discount
            categoryOffer.startDate=new Date(startDate)
            categoryOffer.endDate=new Date(endDate)
        } else{
            categoryOffer=new CategoryOffer({
                categoryId,
                discount,
                startDate:new Date(startDate),
                endDate:new Date(endDate)
            })
        }
        await categoryOffer.save()
        res.json({success:true,message:'Product offer updated successfull'})
    } catch(error){
        console.error('An error occured',error)
        res.status(500).json({success:false,message:'Internal serer error'})
    }
}




const deleteCategoryOffer=async(req,res)=>{
    try{

        const {categoryId}=req.params

        const result=await CategoryOffer.deleteOne({categoryId})

        if(result.deletedCount>0){
            res.json({success:true,message:'category offer deleted successfully'})

        } else{
            res.json({success:false,message:'Category offer not  found '})
        }

    } catch(error){
        console.error('An error occured:',error)
        res.status(500).json({success:false,message:'Internal server error'})
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
    updateOrderStatus,
    addBrand,
    addAdminBrand,
    brandList,
    brandDelete,
    editBrand,
    loadAddCouponPage,
    couponListPage,
    addCouponToDB,
    loadEditCoupon,
    updateCoupon,
    couponDelete,
    loadProductOffer,
    addProductOffer,
    updateProductOffer,
    deleteProductOffer,
    chartPage,
    downloadSalesReport,
    loadReturManage,
    updateReturnStatus,
    loadCategoryOffer,
    categoryOfferSaving,
    updateCategoryOffer,
    salesreportExcell,
    deleteCategoryOffer

}


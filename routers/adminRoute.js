
const express=require('express')
const path = require('path')
const adminRoute = express();
const upload = require('../middleware/multer'); 
const adminController=require('../controller/adminController');
const userRoute = require('./userRoute');
const {adminAuth,adminExist}=require('../middleware/adminAouth')


adminRoute.set("views",path.join(__dirname,'..',"views","admin"));

adminRoute.use(express.json())
adminRoute.use(express.urlencoded({extended:true})) 


adminRoute.get('/adminlogin',adminExist,adminController.adminLoging)
adminRoute.get('/adminDash',adminAuth,adminController.adminDashBoard)
adminRoute.post('/adminLogPost',adminController.adminLogingPost)
adminRoute.get('/userdetails',adminAuth,adminController.loadUserDetails)
adminRoute.post('/blockAndUnblock',adminAuth,adminController.blockUser)
// adminRoute.post('/unBlock',adminController.userUnBlock)
adminRoute.get('/productList',adminAuth,adminController.productList)
adminRoute.get('/addProduct',adminAuth,adminController.addProduct)
adminRoute.post('/adminProduct',adminAuth,upload.array('images', 4),  adminController.addAdminProduct);

adminRoute.get('/categoryList',adminAuth,adminController.categoryList)
adminRoute.get('/addCategory',adminAuth,adminController.addCategory)
adminRoute.post('/adminCategory',adminAuth, adminController.addAdminCategory);
adminRoute.put('/products/:id',adminAuth,adminController.deleteProducts)
adminRoute.get('/editProduct/:id',adminAuth,adminController.loadEditProduct)
adminRoute.put('/category/:id',adminAuth,adminController.categoryDelete)
adminRoute.post('/updateCategory',adminAuth,adminController.editCategory)


adminRoute.post('/updateproduct/:id',adminAuth, upload.array('image'), adminController.productUpdate);
// adminRoute.post('/deleteproduct',adminController.deleteProduct)



module.exports=adminRoute



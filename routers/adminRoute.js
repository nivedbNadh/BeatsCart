
const express=require('express')
const path = require('path')
const adminRoute = express();
const upload = require('../middleware/multer'); 
const adminController=require('../controller/adminController');
const userRoute = require('./userRoute');


adminRoute.set("views",path.join(__dirname,'..',"views","admin"));

adminRoute.use(express.json())
adminRoute.use(express.urlencoded({extended:true}))


adminRoute.get('/adminlogin',adminController.adminLoging)
adminRoute.get('/adminDash',adminController.adminDashBoard)
adminRoute.post('/adminLogPost',adminController.adminLogingPost)
adminRoute.get('/userdetails',adminController.loadUserDetails)
adminRoute.post('/blockAndUnblock',adminController.blockUser)
// adminRoute.post('/unBlock',adminController.userUnBlock)
adminRoute.get('/productList',adminController.productList)
adminRoute.get('/addProduct',adminController.addProduct)
adminRoute.post('/adminProduct',upload.array('images', 4),  adminController.addAdminProduct);

adminRoute.get('/categoryList',adminController.categoryList)
adminRoute.get('/addCategory',adminController.addCategory)
adminRoute.post('/adminCategory', adminController.addAdminCategory);
adminRoute.put('/products/:id',adminController.deleteProducts)
adminRoute.get('/editProduct/:id',adminController.loadEditProduct)
adminRoute.delete('/deleteCategory/:id',adminController.categoryDelete)
adminRoute.post('/updateCategory',adminController.editCategory)


adminRoute.post('/updateproduct/:id', upload.array('image'), adminController.productUpdate);
// adminRoute.post('/deleteproduct',adminController.deleteProduct)



module.exports=adminRoute



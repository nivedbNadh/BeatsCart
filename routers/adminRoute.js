
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
adminRoute.get('/brandList',adminAuth,adminController.brandList)
adminRoute.get('/addCategory',adminAuth,adminController.addCategory)
adminRoute.get('/addBrands',adminAuth,adminController.addBrand)
adminRoute.post('/adminCategory',adminAuth, adminController.addAdminCategory);
adminRoute.post('/adminBrand',adminAuth,adminController.addAdminBrand)
adminRoute.put('/products/:id',adminAuth,adminController.deleteProducts)
adminRoute.get('/editProduct/:id',adminAuth,adminController.loadEditProduct)
adminRoute.put('/category/:id',adminAuth,adminController.categoryDelete)
adminRoute.put('/brand/:id',adminAuth,adminController.brandDelete)
adminRoute.post('/updateCategory',adminAuth,adminController.editCategory)
adminRoute.post('/updateBrand/:id',adminAuth,adminController.editBrand)


adminRoute.post('/updateproduct/:id',adminAuth, upload.array('image'), adminController.productUpdate);
// adminRoute.post('/deleteproduct',adminController.deleteProduct)



// order management 

adminRoute.get('/orderMange',adminAuth,adminController.loadAdminManage)
adminRoute.post('/updateOrderStatus',adminAuth,adminController.updateOrderStatus)



// coupon 

adminRoute.get('/addCoupon', adminAuth, adminController.loadAddCouponPage);
adminRoute.get('/couponList',adminAuth,adminController.couponListPage)
adminRoute.post('/addCoupons',adminAuth,adminController.addCouponToDB)
adminRoute.get('/editCoupon/:id',adminAuth,adminController.loadEditCoupon)
adminRoute.post('/updateCoupon/:id',adminAuth,adminController.updateCoupon)
adminRoute.patch('/deleteCoupon/:id',adminAuth,adminController.couponDelete)



// Product offer
adminRoute.get('/productOffer',adminAuth,adminController.loadProductOffer)
adminRoute.post('/addProductOffers',adminController.addProductOffer)
adminRoute.post('/updateProductOffer/:productId',adminController.updateProductOffer)
adminRoute.delete('/deleteProductOffer/:productId',adminController.deleteProductOffer)


// category offer
adminRoute.get('/categoryOffer',adminAuth,adminController.loadCategoryOffer)
adminRoute.post('/saveCategoryOffer',adminController.categoryOfferSaving)
adminRoute.post('/updateCategoryOffer/:categoryId',adminController.updateCategoryOffer)
adminRoute.delete('/deleteCategoryOffer/:categoryId',adminController.deleteCategoryOffer)


// chart
adminRoute.get('/chart',adminAuth,adminController.chartPage)
// sales report

adminRoute.post('/download-sales-report',adminController.downloadSalesReport)

adminRoute.post('/download-excel-report',adminController.salesreportExcell)


// load retur n page
adminRoute.get('/returnManagement',adminAuth,adminController.loadReturManage)
adminRoute.post('/updateReturnStatus',adminController.updateReturnStatus)


module.exports=adminRoute



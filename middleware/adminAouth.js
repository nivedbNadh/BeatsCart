const Admin=require('../models/adminModel')

const adminAuth=(req,res,next) =>{
    if(req.session && req.session.adminlogged) {
        next()
    } else{
        res.redirect('/adminlogin')
    }
}





const adminExist=(req,res,next)=>{
    if(req.session.adminlogged) {
        return res.redirect('/adminDash')
    } else{
        next()
    }
}






module.exports={
    adminAuth,
    adminExist
}
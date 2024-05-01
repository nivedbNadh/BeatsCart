const User=require('../models/userModel')



const authentication=(req,res,next)=>{
    if(req.session.logged){
        next()

    }else{
        res.redirect('/user/login')
    }
}

const userExit=(req,res,next)=>{
    if(req.session.logged){
        return res.redirect('/')
    }else{
    }
}


module.exports={
    authentication,
    userExit
}

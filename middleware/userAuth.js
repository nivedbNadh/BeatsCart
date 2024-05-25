const User=require('../models/userModel')



const authentication=(req,res,next)=>{
    if(req.session.userlogged){
        next()
    }else{
        return res.redirect('/login')
    }
}

const userExist=(req,res,next)=>{
    if(req.session.userlogged){
        console.log('asdfasdf');
        return res.redirect('/home')
    }else{
        next()
    }
}


const userBlock =async (req,res,next)=>{
    try {
        const userMail=req.session.curUser
        const findUser=await User.findOne({email:userMail})


        if( findUser &&  findUser.status===false) {
            req.session.destroy(err=>{
                if(err){
                    console.err("error session destroy:",err)
                }
                return res.redirect('/signup?block=true')
            })
        }else{
            next()
        }        
    } catch (error) {
        console.error('Error checking if user is blocked:',error)
        return res.status(500).json({error:'Internal server errror'})   
    }
}



module.exports={
    authentication,
    userExist,
    userBlock
}

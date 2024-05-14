const User=require('../models/userModel')



const authentication=(req,res,next)=>{
    console.log(req.session.userlogged,'uuuuuuuuuuuuuuuuuuuuuuerwwwwwwwwwwflsdjfkldsjflsdflkdsf');
    if(req.session.userlogged){
        return res.redirect('/home')
    }else{
        next()

    }
}

const userExist=(req,res,next)=>{
    console.log('userexist is session-1',req.session.userlogged);
    if(req.session.userlogged){
        console.log('asdfasdf');
        return res.redirect('/home')
    }else{
        next()
    }
}

const userBlock = async (req, res, next) => {
    try {
        const userMail = req.session.curUser;
        const findUser = await User.findOne({ email: userMail });

        if (findUser && findUser.status === false) {
            req.session.destroy(err => {
                if (err) {
                    console.error("Error destroying session:", err);
                }
                return res.redirect('/signup?block=true');
            });
        } else {
            next(); // Allow non-blocked users to proceed
        }
    } catch (error) {
        console.error('Error checking if user is blocked:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};



module.exports={
    authentication,
    userExist,
    userBlock
}

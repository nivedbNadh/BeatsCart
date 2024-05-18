//app.js
const express = require('express');
const app = express();
// const morgan=require('morgan')
const userAuth=require('./middleware/userAuth')
const { v4: uuidv4 } = require('uuid');
const dotenv=require('dotenv').config()
const multer=require('multer')

const dbConnect=require("./config/dbConnect");
const flash = require('express-flash')
dbConnect()



const path = require('path');
const userRoute=require('./routers/userRoute');
const adminRoute=require('./routers/adminRoute');





const session = require('express-session');

app.set('view engine', 'ejs');
// app.set('views',path.join(__dirname,'..',"views","user"))

// app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname,"/public")))
// app.use(morgan('tiny'))



app.use(session({
    secret: uuidv4(), // Secret key for session encryption
    resave: false,
    saveUninitialized: false
}));

//clear cache
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); 
  res.setHeader("Pragma", "no-cache"); 
  res.setHeader("Expires", "0");
  next(); 
});

app.use(flash());


app.use('/',userRoute);
app.use('/',adminRoute);

app.use((err, req, res, next) => {
    console.log('error middle ware')
    if (err.status === 404) {
      console.log(err.stack)
      res.status(404).render('error');
    } else {
      console.log(err.stack)
      res.status(500).render('./user/errorfive');
    }
  });
  
  app.all("*",(req,res)=>{
    res.status(404).redirect('error')
  })
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});

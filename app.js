//app.js
const express = require('express');
const app = express();
// const morgan=require('morgan')
const userAuth=require('./middleware/userAuth')
const bodyparser=require('body-parser')
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

app.use(flash());


app.use('/',userRoute);
app.use('/',adminRoute);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});

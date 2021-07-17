var express=require("express");
const route = express.Router()
var {sign_post,login_get,email_activate_get,forgot_password_get,forgot_password_post,reset_password_get,reset_password_post,login_post,logout_get}=require("./controllers/register.js");
var {home,Search,Cooler,Cycle,Iron,Books,Kettle,Image,Cancel,Profile_get,Profile_post,Cart_get,addProduct,delProduct}=require("./controllers/home.js");
var {Sell_post,donate_post,donate_get,Sell_get}=require("./controllers/upload.js");
const { router } = require("websocket");
var {requireAuth,checkUser}=require('./middleware/auth');

route.get('*',checkUser)
route.get('/',home);
route.post("/search",Search);
route.get("/cooler",Cooler);
route.get("/cycle",Cycle);
route.get("/kettle",Kettle);
route.get("/books",Books);
route.get("/iron",Iron);
route.get('/profile/:id',Profile_get)
route.post('/profile/:id',Profile_post);
route.get("/sell",requireAuth,Sell_get);
route.post("/sell",Sell_post);
route.get('/cart',requireAuth,Cart_get);
route.get("/donate",requireAuth,donate_get);
route.post("/donate",donate_post);
route.get("/image/:id",requireAuth,Image);
route.get("/cancel/:id",requireAuth,Cancel);
route.get("/add/product/:id",requireAuth,addProduct);
route.get("/delete/product/:id",requireAuth,delProduct);
route.get('/login',login_get);
route.post("/signup",sign_post);
route.get('/reset-password',reset_password_get)
route.get('/authentication/activate/:token',email_activate_get);
route.get("/forgot-password",forgot_password_get);
route.post("/forgot-password",forgot_password_post);
route.get('/resetPassword/:token',reset_password_get);
route.post('/resetPassword/:token',reset_password_post);
route.post("/signin",login_post);
route.get('/logout',logout_get);

module.exports=route;



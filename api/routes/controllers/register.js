const dotenv=require('dotenv');
dotenv.config({path:'./.env'});
var mysql = require("mysql");
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
var nodemailer = require('nodemailer');
const cookieParser=require('cookie-parser');                           
const mailgun = require("mailgun-js");
const emailValidator = require("email-validator");
const DOMAIN = 'sandboxbc3c3d3d05794be29b12bdc44a87f655.mailgun.org';
const mg = mailgun({apiKey:process.env.MAILGUN_APIKEY, domain:DOMAIN});
dotenv.config({path:'./.env'});
var db=require("./model.js");
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'chanchaltyagi3727',
    pass: 'karmayoga'
  }
});

module.exports.sign_post=(req,res)=>{
    var email=req.body.email;
    var password=req.body.psw;
    var passwordConfirm=req.body.pswconfirm;
      if(!email||!password||!passwordConfirm){
        return res.redirect('/signup',{message:'Please provide an email and password'});
      }
      if(!emailValidator.validate(email))
      {
        return res.redirect('/signup',{message:'Invalid email'});
      }
        db.query('SELECT email FROM `users` WHERE email=?',[email],async (err,results,fields)=>{
          if(err)
          {
            console.log(err);
          }
          if(results.length>0){
            return res.json({message:'The email is already in use'})
          }
          if(password!=passwordConfirm){
            return res.json({message:'Password doesnt match'})
          }
          if(password.length<6)
          return res.json({message: "Password must be at least 6 characters."})

            const token=jwt.sign({email,password},process.env.JWT_SECRET,{
              expiresIn:process.env.JWT_EXPIRES_IN
            });
            var mailOptions = {
              from: 'chanchaltyagi3727@gmail.com',
              to: email,
              subject: 'Account Activation link',
              html: `<h2>Please click on given link to activate your account</h2>
                     <p>${process.env.CLIENT_URL}/api/authentication/activate/${token}</p>
              `
            }
            transporter.sendMail(mailOptions, function(error, info){
               if (error) {
                console.log(error);
               } else {
                console.log('Email sent: ' + info.response);
              }
            });
            return res.json({message:'Email has been sent , kindly activate your account'});
          })
  };

  module.exports.email_activate_get=(req,res)=>{
    const token=req.params.token;
    if(token)
    {
      jwt.verify(token,process.env.JWT_SECRET,function(err,decodedToken){
        if(err){
          return res.status(400).json({error:"Incorrect or Expired link"})
        }
        const {email,password}=decodedToken;
        db.query('SELECT email FROM `users` WHERE email=?',[email],async (err,results,fields)=>{
          if(err)
          {
            console.log(err);
          }
          if(results.length>0){
            return res.status(400).json({message:'The email is already in use'})
          }
          let hashedPassword=await bcrypt.hash(password,8);
          var sql="INSERT INTO `users`(`email`,`psw`) VALUES ('" + email + "','" + hashedPassword + "')";
          db.query(sql,function(err,results){
            if(err){
              console.log("Error in signup while account activation link: ",err);
              return res.status(400).json({error:'Error activating account'})
            }
            else
            res.json({message:"Signup success"}) 
          })
        })
      })
    }else{
      return res.json({error:"Something went wrong"})
    }
  };

  module.exports.forgot_password_get=(req,res)=>{
    return res.render('forgot.pug');
}
  
  module.exports.forgot_password_post=(req,res)=>{
      const email=req.body.email;
      db.query('SELECT * FROM `users` WHERE email=?',[email],async (err,results,fields)=>{
        if(err||results.length<=0)
        {
          return res.send({message:'Email doesnt exists'})
        }
        const token=jwt.sign({id:results[0].id},process.env.JWT_RESET_KEY,{
          expiresIn:process.env.JWT_EXPIRES_IN
        });
    
        var mailOptions = {
          from: 'chanchaltyagi3727@gmail.com',
          to: email,
          subject: 'Reset Password link',
          html: `<h2>Please click on given link to activate your account</h2>
                 <p>${process.env.CLIENT_URL}/api/resetPassword/${token}</p>
          `
        }
        let ans=JSON.parse(JSON.stringify(results))
        console.log(ans[0])
      var sql1="UPDATE `users` SET `resetlink` = '"+ token+"' WHERE `id`='"+ ans[0].id+"'";
      db.query(sql1,function(er,result){
        if(er){
          return res.status(400).json({error:'Reset Password Link error'})
        }
        else
        {
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
             console.log(error);
            } else {
             console.log('Email sent: ' + info.response);
           }
         });
         return res.json({message:'Email has been sent , kindly activate your account'});
        }
      })
    })
    };
    
  module.exports.reset_password_get=(req,res)=>{
      return res.render('reset.pug',{token:req.params.token});
  }

  module.exports.reset_password_post=(req,res)=>{
    const resetLink=req.params.token;
    const newPass=req.body.newPass;
    if(resetLink)
    {
      jwt.verify(resetLink,process.env.JWT_RESET_KEY,function(err,decodedToken){
        if(err){
          return res.status(400).json({error:"Incorrect or Expired link"})
        }
        db.query('SELECT * FROM `users` WHERE `resetlink`=?',[resetLink],async (err,results,fields)=>{
          if(err||results.length<=0)
          {
            return res.status(400).json({message:'The user with this token doesnt exists'})
          }
          if(newPass.length<6)
          return res.json({message: "Password must be at least 6 characters."})

          let hashedPassword=await bcrypt.hash(newPass,8);
          var sql="UPDATE `users` SET `psw` = '"+hashedPassword+"' WHERE `resetlink`='"+resetLink+"'";
          db.query(sql,function(er,result){
            if(er){
              return res.status(400).json({error:'Reset Password Link error'})
            }
            else
            {
                return res.json({message:'Your password has been changed'});
            }
          });
        });
      });
    } 
    else{
      return res.status(401).json({Error:'Authentication error'})
    }
  };

  module.exports.login_post=async (req,res)=>{
    try{
      const email=req.body.email;
      const password=req.body.psw;
      if(!email||!password){
        return res.json({message:'Please provide an email and password'});
      }
      db.query('SELECT * FROM `users` WHERE email=?',[email],async (err,results,fields)=>{
        if(!results||!(await bcrypt.compare(password,results[0].psw))){
          res.json({message:'Email or password is incorrect'})
        }
        else{
          const id=results[0].id;
          const token=jwt.sign({ id },process.env.JWT_SECRET,{
            expiresIn:process.env.JWT_EXPIRES_IN
          });
          const cookieOptions={
            expires: new Date(
              Date.now() + process.env.JWT_COOKIE_EXPIRES*24*60*60*1000
            ),
            httpOnly: true
          }
          res.cookie('jwt',token,cookieOptions);
          res.status(200).redirect('/api/');
        }
      })
    }catch(err){
       console.log(err);
    }
    };
  
const express = require('express');
const router = express.Router();
const db = require('../firebase/connection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const user = db.collection('user');

const secret = "SECRET";



router.get('/login', async(req,res)=>{
    console.log(req.body)
    const id = req.body.email;
    const password = req.body.password;
    const userRef = user.doc(id);
    var userData;
    try{
        userData = await userRef.get();
        userData = userData.data();
        console.log(userData);
    } catch{
        res.send({message:"internal error"});
    }
    if(!userData){
        res.send({messgae:"User doesnot exist"});
    }
        else{
            bcrypt.compare(password, userData.password).then(success =>{
                if(!success){
                    res.send({message:"Invalid Password"});
                } else{
                    const payload = {
                        id: userData.id
                    }
                    jwt.sign(payload, secret, {expiresIn: "100m"}, 
                        (err, token) => {
                            res.send({
                                token: 'Bearer ' + token,
                                success: true
                            })
                        }
                    )
                }
            })
        }
})

router.post('/register', async(req,res)=>{
    const id = req.body.email;

    const userJson = {
        email : req.body.email,
        name : req.body.name,
        password : req.body.password
    }
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(userJson.password, salt, (hashErr, hash) => {
            if (err || hashErr) {
                res.json({ message: 'Error occured hasing', success: false });
                return;
            }
            userJson.password = hash;
            user.doc(id).set(userJson).then(() => {
                res.json({ "message": "User created successfully", "success": true });
            }).catch(er => res.json({ message: er.message, success: false }));
        })
    })
})


module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../firebase/connection');
const user = db.collection('user')

router.post('/add',(req,res)=>{
    user.add(req.body);
    console.log("added");
    res.send({msg:"added"});
})

module.exports = router;
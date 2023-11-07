const express = require('express');
const router = express.Router();
const db = require('../firebase/connection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const checkAuth = require('../middleware/checkAuth');
const casedb = db.collection('case');
const FieldValue = require('firebase-admin').firestore.FieldValue;
const secret = 'SECRET';

router.post('/create', async(req, res)=>{
    try {
        let token = req.headers['authorization'].split(' ')[1];
        const decoded = await jwt.verify(token, secret);
        //console.log(decoded);
        // res.send(decoded);
        const caseJson = {
            title: req.body.title,
            victim: req.body.victim,
            owner: decoded.id,
            suspects: req.body.suspects,
            primarySuspect: req.body.primarySuspect,
            witness: req.body.witness,
            images: [],
            status: true,
            thread: []
        }
        casedb.add(caseJson).then(()=>{
            res.json({ "message": "Case created successfully", "success": true });
        }).catch(er => res.json({ message: er.message, success: false }));
    } 
    catch (er) {
        return res.status(401).json({ "message": "Not authorized" });
    }
    
})

router.put('/access/:id',checkAuth, async(req, res)=>{

        //console.log(req.userData);
    
        const caseRef  = casedb.doc(req.params.id);
        const thisCase = await caseRef.get();
        
        if(thisCase.data()){
            if(req.userData.id != thisCase.data().owner){
                res.json({"message": "Permission denied!!", "success": false })
            } else {
                const unionRes = await caseRef.update({
                    accessList: FieldValue.arrayUnion(req.body.id)
                });
                //console.log(unionRes);
                if(unionRes)
                    res.json({ "message": "Access granted successfully", "success": true });
                else
                    res.json({ "message": "Internal error", "success": false });
            }
        } else{
            res.json({"messgae":"No such case"});
        } 
})

router.put('/revoke/:id', checkAuth, async(req, res)=>{
    
    const caseRef  = casedb.doc(req.params.id);
    const thisCase = await caseRef.get();
    
    if(thisCase.data()){
        if(req.userData.id != thisCase.data().owner){
            res.json({"message": "Permission denied!!", "success": false })
        } else {
            const removeRes = await caseRef.update({
                accessList: FieldValue.arrayRemove(req.body.id)
            });
            //console.log(unionRes);
            if(removeRes)
                res.json({ "message": "Access removed successfully", "success": true });
            else
                res.json({ "message": "Internal error", "success": false });
        }
    } else{
        res.json({"messgae":"No such case"});
    }     

})

module.exports = router;
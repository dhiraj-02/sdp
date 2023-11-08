const express = require('express');
const router = express.Router();
const db = require('../firebase/connection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const checkAuth = require('../middleware/checkAuth');
const casedb = db.collection('case');
const FieldValue = require('firebase-admin').firestore.FieldValue;
const secret = 'SECRET';

router.post('/create',checkAuth, async(req, res)=>{
    try {
        const caseJson = {
            title: req.body.title,
            victim: req.body.victim,
            owner: req.userData.id,
            suspects: req.body.suspects,
            primarySuspect: req.body.primarySuspect,
            witness: req.body.witness,
            images: [],
            accessList:[req.userData.id],
            status: true,
            thread: []
        }
        casedb.add(caseJson).then(()=>{
            res.json({ "message": "Case created successfully", "success": true });
        }).catch(er => res.json({ message: er.message, success: false }));
    } 
    catch (er) {
        return res.status(401).json({ "message": "Operation failed" });
    }
    
})

router.get('/getAllCases', checkAuth, async(req, res)=>{
    const allCases = await casedb.get();
    if(allCases){
        var response = [];
        var caseJson = {
            id: null,
            title: null
        }
        allCases.forEach(doc => {
            //console.log(doc.data());
            caseJson.id = doc.id;
            caseJson.title = doc.data().title;
            response.push(caseJson);
        });
        res.send(response);
    }
    else
    {
        res.json({"message":"Operation failed"})
    }
})

router.get('/getOpenCases', checkAuth, async(req, res)=>{
    const openCases = await casedb.where('status','==',true).get();
    if(openCases){
        var response = [];
        
        openCases.forEach(doc => {
            //console.log(doc.data());
            var caseJson = {
                id: doc.id,
                title: doc.data().title
            }
            response.push(caseJson);
        });
        res.send(response);
    }
    else
    {
        res.json({"message":"Operation failed"})
    }
})


router.get('/getById/:id', checkAuth, async(req, res)=>{
    const caseRef  = casedb.doc(req.params.id);
    const thisCase = await caseRef.get();
    if(thisCase.data()){
        if(req.userData.id in thisCase.data().accessList || req.userData.id == thisCase.data().owner){
            res.send(thisCase.data());
        } else {
            res.json({"message": "Permission denied!!", "success": false })
        }
    } else{
        res.json({"messgae":"Operation failed"});
    } 
})

router.get('/getMyCases', checkAuth, async(req, res)=>{
    const myCases = await casedb.where('owner','==',req.userData.id).get();
    if(myCases){
        var response = [];
        
        myCases.forEach(doc => {
            var caseJson = {
                id: doc.id,
                title : doc.data().title
            }
            //console.log(doc.data());
            response.push(caseJson);
        });
        
        res.send(response);
        
    }
    else
    {
        res.json({"message":"Operation failed"})
    }
    
})

router.put('/witnessAppend/:id', checkAuth, async(req, res)=>{
    const caseRef  = casedb.doc(req.params.id);
    const unionRes = await caseRef.update({
        witness: FieldValue.arrayUnion(req.body.witness)
    });
    if(unionRes)
        res.json({"message":"Added successfully", "success": true});
    else
        res.json({"message":"Operation failed", "success": false});
})

router.put('/witnessRemove/:id', checkAuth, async(req, res)=>{
    const caseRef  = casedb.doc(req.params.id);
    const thisCase = await caseRef.get();

    if(thisCase.data()){
        if(req.userData.id != thisCase.data().owner){
            res.json({"message": "Permission denied!!", "success": false })
        } else {
            const removeRes = await caseRef.update({
                witness: FieldValue.arrayRemove(req.body.witness)
            });

            if(removeRes)
                res.json({ "message": "Witness removed successfully", "success": true });
            else
                res.json({ "message": "Internal error", "success": false });
        }
    } else{
        res.json({"messgae":"Operation failed"});
    } 
})

router.put('/victimAppend/:id', checkAuth, async(req, res)=>{
    const caseRef  = casedb.doc(req.params.id);
    const unionRes = await caseRef.update({
        victim: FieldValue.arrayUnion(req.body.victim)
    });
    if(unionRes)
        res.json({"message":"Added successfully", "success": true});
    else
        res.json({"message":"Operation failed", "success": false});
})

router.put('/victimRemove/:id', checkAuth, async(req, res)=>{
    const caseRef  = casedb.doc(req.params.id);
    const thisCase = await caseRef.get();

    if(thisCase.data()){
        if(req.userData.id != thisCase.data().owner){
            res.json({"message": "Permission denied!!", "success": false })
        } else {
            const removeRes = await caseRef.update({
                victim: FieldValue.arrayRemove(req.body.victim)
            });
            
            if(removeRes)
                res.json({ "message": "Victim removed successfully", "success": true });
            else
                res.json({ "message": "Internal error", "success": false });
        }
    } else{
        res.json({"messgae":"Operation failed"});
    } 
})

router.put('/grantAccess/:id',checkAuth, async(req, res)=>{

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

router.put('/revokeAccess/:id', checkAuth, async(req, res)=>{
    
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

router.put('/thread/:id', checkAuth, async(req, res)=>{
    const caseRef  = casedb.doc(req.params.id);
    const unionRes = await caseRef.update({
        thread: FieldValue.arrayUnion(req.userData.id+"%"+req.body.message)
    });
    if(unionRes)
        res.json({"message":"successfull", "success": true});
    else
        res.json({"message":"Operation failed", "success": false});
})

router.post('/close/:id', checkAuth, async(req, res)=>{
    const caseRef  = casedb.doc(req.params.id);
    const thisCase = await caseRef.get();
    
    if(thisCase.data()){
        if(req.userData.id != thisCase.data().owner){
            res.json({"message": "Permission denied!!", "success": false })
        } else {
            const close = await caseRef.update({
                status: false
            });
            //console.log(unionRes);
            if(close)
                res.json({ "message": "Case closed successfully", "success": true });
            else
                res.json({ "message": "Internal error", "success": false });
        }
    } else{
        res.json({"messgae":"No such case"});
    }     
})

router.post('/reopen/:id', checkAuth, async(req, res)=>{
    const caseRef  = casedb.doc(req.params.id);
    const thisCase = await caseRef.get();
    
    if(thisCase.data()){
        if(req.userData.id != thisCase.data().owner){
            res.json({"message": "Permission denied!!", "success": false })
        } else {
            const reopen = await caseRef.update({
                status: true
            });
            //console.log(unionRes);
            if(reopen)
                res.json({ "message": "Case reopened successfully", "success": true });
            else
                res.json({ "message": "Internal error", "success": false });
        }
    } else{
        res.json({"messgae":"No such case"});
    }     
})

module.exports = router;
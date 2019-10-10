/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect       = require('chai').expect;
let MongoClient  = require('mongodb') ;
let ObjectId     = require('mongodb').ObjectId;

const CONNECTION_STRING = process.env.DB;

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get((req, res)=>{
      // console.log(req.params);
      let board = req.body.board ? req.body.board : req.params.board;
      
      //construct the database search and format the returned docs to match the requirements
      MongoClient.connect(CONNECTION_STRING, (err, db)=>{
        if(err) return console.log(err);
        
        
        db.collection(board).find({}, {reported: 0, delete_password: 0, replies: {$slice: -3} }).sort({bumped_on: -1}).limit(10).toArray((err, result)=>{
          if(err) return console.log(err);
          
          // console.log(result);
          res.send(result);
        });
      });
      
      
    })
  
    .post((req, res)=>{
      let board = req.body.board ? req.body.board : req.params.board;
      // console.log(req);
      MongoClient.connect(CONNECTION_STRING, (err, db)=>{
        if(err) return console.log(err);
        // console.log('Connected to DB for POST');
        
        db.collection(board).insert({
          text: req.body.text,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          delete_password: req.body.delete_password,
          replycount: 0,
          replies: []
          
        }, (err, result)=>{
          if(err) return console.log(err);
          
          res.redirect('/b/'+board+'/');
          console.log('I have sent the post and redirected to its board');
        });
      });
      
    })
    
    .put((req, res)=>{
      // console.log(req);
      let board = req.body.board ? req.body.board : req.params.board;
      let thread_id = req.body.report_id;  //I am not sure why all of sudden they saved the thread_id as report_id in the body but whatever. I do not want to accidently screw up a bunch of tests by changing it to be consistent.
      
    
      if(thread_id.length != 24 && /[0-9a-f]+/i.test(thread_id)){
        res.send('The thread_id is not a valid id. It must be a hexadecimal string 24 characters in length');
      }else{
        MongoClient.connect(CONNECTION_STRING, (err, db)=>{
          if(err) return console.log(err);
      
          db.collection(board).update(
            {_id: ObjectId(thread_id) }, 
            {$set: { reported: true}}, 
            {returnNewDocument: 1},
            (err, cursor)=>{
            if(err) return console.log(err);
            
            // console.log("THis is the result of the update",cursor);
            //check if the update was successful
            if(!cursor.result.n){
              res.send('could not find the thread in the Database');
            }else res.send('success');
          });

        });    
      }
    })
  
    .delete((req, res)=>{
      // console.log(req);
      let board = req.body.board ? req.body.board : req.params.board;;
      let thread_id = req.body.thread_id;
    
      //Check if the thread_id is a valid Mongodb ObjectId()
      if(thread_id.length != 24 && /[0-9a-f]+/i.test(thread_id)){
        res.send('The thread_id is not a valid id. It must be a hexadecimal string 24 characters in length');
      }else{
        MongoClient.connect(CONNECTION_STRING, (err, db)=>{
          if(err) return console.log(err);

          db.collection(board).deleteOne({_id: ObjectId(thread_id), delete_password: req.body.delete_password}, (err, cursor)=>{
            if(err) return console.log(err);
            
            console.log(cursor.deletedCount);
            if(cursor.deletedCount == 0){
              res.send('incorrect password');
            }else res.send('success');
          });

        });      
      }
      
      
    });
    
    
  app.route('/api/replies/:board')
  
    .get((req, res)=>{
      // console.log(req);
      let board = req.params.board;
      let thread_id = req.query.thread_id;
      
      if(thread_id.length != 24 && /[0-9a-f]+/i.test(thread_id) ){
        res.send('The thread_id is not a valid thread_id');
      }else{
        //Get all the data for the specific thread for the specified board
        MongoClient.connect(CONNECTION_STRING, (err, db)=>{
          
          db.collection(board).findOne({_id: ObjectId(thread_id)}, {reported: 0, delete_password: 0 }, (err, result)=>{
            if(err) return console.log(err);
            
            // console.log(result);
            res.send(result);
          });
        });
      }
      
    })
    .post((req, res)=>{
      // console.log(req);
      let board = req.body.board ? req.body.board : req.params.board;
      let thread_id = req.body.thread_id;
      
      if(thread_id.length != 24 && /[a-f0-9]+/i.test(thread_id) ){
        // console.log(thread_id);
        res.send('That is not a valid thread_id');
      }else{
        MongoClient.connect(CONNECTION_STRING, (err, db)=>{
          if(err) return console.log(err);

          db.collection(board).findOneAndUpdate({_id: ObjectId(thread_id)}, {
            $set: { bumped_on: new Date() },
            $inc: { replycount: 1 },
            $push: {replies: {_id: new ObjectId(), text: req.body.text, created_on: new Date(), delete_password: req.body.delete_password, reported: false}}
          }, {returnNewDocument: 1}, (err, result)=>{
            if(err) return console.log(err);
            
            // console.log(result);
            
            res.redirect('/b/'+board+'/'+result.value._id+'/');
          });

        });
      }
    })
  
    .put((req, res)=>{
      // console.log(req);
      let board = req.body.board ? req.body.board : req.params.board;
      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
    
      //Check if the thread_id is a valid Mongodb ObjectId()
      if(thread_id.length != 24 && /[0-9a-f]+/i.test(thread_id)){
        res.send('The thread_id is not a valid id. It must be a hexadecimal string 24 characters in length');
      }else if(reply_id.length != 24 && /[0-9a-f]+/i.test(reply_id)){
        res.send('The reply_id is not a valid id. It must be a hexadecimal string 24 characters in length');
      }else{
        MongoClient.connect(CONNECTION_STRING, (err, db)=>{
          if(err) return console.log(err);
      
          db.collection(board).update(
            {_id: ObjectId(thread_id), 'replies._id': ObjectId(reply_id) }, 
            {$set: {'replies.$.reported': true}}, 
            {returnNewDocument: 1},
            (err, cursor)=>{
            if(err) return console.log(err);
            
            // console.log("THis is the result of the update",cursor);
            //check if the update was successful
            if(!cursor.result.n){
              res.send('could not find the thread in the Database');
            }else res.send('success');
          });

        });      
      }
    })
  
    .delete((req, res)=>{
      // console.log(req);
      let board = req.body.board ? req.body.board : req.params.board;
      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
    
      //Check if the thread_id is a valid Mongodb ObjectId()
      if(thread_id.length != 24 && /[0-9a-f]+/i.test(thread_id)){
        res.send('The thread_id is not a valid id. It must be a hexadecimal string 24 characters in length');
      }else if(reply_id.length != 24 && /[0-9a-f]+/i.test(reply_id)){
        res.send('The reply_id is not a valid id. It must be a hexadecimal string 24 characters in length');
      }else{
        MongoClient.connect(CONNECTION_STRING, (err, db)=>{
          if(err) return console.log(err);
      
          db.collection(board).update(
            {_id: ObjectId(thread_id), 'replies._id': ObjectId(reply_id) }, 
            {$set: {'replies.$.text': '[deleted]'}}, 
            {returnNewDocument: 1},
            (err, cursor)=>{
            if(err) return console.log(err);
            
            // console.log("THis is the result of the update",cursor);
            //check if the update was successful
            if(!cursor.result.n){
              res.send('incorrect password');
            }else res.send('success');
          });

        });      
      }
    });
    
};

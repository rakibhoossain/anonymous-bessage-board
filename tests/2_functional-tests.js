/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  //Multiple threads and replies need to be created in order to properly test the functionality of the app.
  let testingText = 'Chai Feedback';
  let testingId1; 
  let testingId2; 
  let testingId3;
  let testingReplyId1;
  let testingReplyId2;

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('Create a few new threads called on the board: testBoard ', (done)=>{
        chai.request(server)
        .post('/api/threads/testBoard')
        .send({text: 'Testing Thread 1', delete_password: 'mern'})
        .end((err, res)=>{
          assert.equal(res.status, 200);
        });
        
        chai.request(server)
        .post('/api/threads/testBoard')
        .send({text: 'Testing Thread 2', delete_password: 'mern'})
        .end((err, res)=>{
          assert.equal(res.status, 200);
        });
        
        chai.request(server)
        .post('/api/threads/testBoard')
        .send({text: 'Testing Thread 3', delete_password: 'mern'})
        .end((err, res)=>{
          assert.equal(res.status, 200);
        });
      });
      
    });
    
    suite('GET', function() {
      test('GET the all the threads on the testBoard board ', (done)=>{
        chai.request(server)
        .get('/api/threads/testBoard')
        .end((err, res)=>{
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtMost(res.body.length, 10);
          assert.property(res.body[0], 'text');
          assert.property(res.body[0], '_id');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'bumped_on');
          assert.notProperty(res.body[0], 'reported');
          assert.notProperty(res.body[0], 'replies');
          assert.isArray(res.body[0].replies);
          assert.isAtMost(res.body[0].replies.length, 3);
          
          //Store the thread _id's for the next tests.
          testingId1 = res.body[0]._id;
          testingId2 = res.body[1]._id;
          testingId3 = res.body[2]._id;
          done();
        });
      });
    });
    
    suite('DELETE', function() {
      test('Try to delete a thread with an incorrect delete_password on the board: testBoard', (done)=>{
        chai.request(server)
        .delete('/api/threads/testBoard')
        .send({thread_id: testingId1, delete_password: 'wrong_password'})
        .end((err, res)=>{
          assert.equal(res.status, 200);
          assert.equal(res.body, 'incorrect password');
          done();
        });
      });
      test('Delete a thread completely on the board: testBoard', (done)=>{
        chai.request(server)
        .delete('/api/threads/testBoard')
        .send({thread_id: testingId1, delete_password: 'mern'})
        .end((err, res)=>{
          assert.equal(res.status, 200);
          assert.equal(res.body, 'success');
          //testingId1 is no longer useful for other tests as the corresponding thread no long exists
          done();
        });
      });
    });
    
    suite('PUT', function() {
      test('Report the thread', (done)=>{
        chai.request(server)
        .put('/api/threads/testBoard')
        .send({thread_id: testingId2})
        .end((err, res)=>{
          assert.equal(res.status, 200);
          assert.equal(res.body, 'success');
          done();
        });
      });
    });
  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Post two replies on a thread in the testBoard board', (done)=>{
        chai.request(server)
        .post('/api/replies/testBoard')
        .send({thread_id: testingId2, text: 'this is a reply for testingId2 thread - reply1', delete_password: 'mern'})
        .end((err, res)=>{
          assert.equal(res.status, 200);
        });
        
        chai.request(server)
        .post('/api/replies/testBoard')
        .send({thread_id: testingId2, text: 'this is a reply for testingId2 thread- reply2', delete_password: 'mern'})
        .end((err, res)=>{
          assert.equal(res.status, 200);
          done();
        });
      });
    });
    
    suite('GET', function() {
      test('Get all the replies on a thread', (done)=>{
        chai.request(server)
        .get('/api/replies/testBoard')
        .end((err, res)=>{
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, 'text');
          assert.property(res.body, '_id');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'bumped_on');
          assert.notProperty(res.body, 'reported');
          assert.notProperty(res.body, 'replies');
          assert.isArray(res.body.replies);
          assert.notProperty(res.body.replies[0].reported);
          assert.notProperty(res.body.replies[0].delete_password);
          
          //store the replyId for the next tests.
          testingReplyId1 = res.body.replies[0]._id;
          testingReplyId2 = res.body.replies[1]._id;
          done();
        });
      });
    });
    
    suite('PUT', function() {
      test('Send a PUT request to report a reply.', (done)=>{
        chai.request(server)
          .put('/api/replies/testBoard')
          .send({thread_id: testingId2, reply_id: testingReplyId1})
          .end((err, res)=>{
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success');
          });
      });
    });
      
    
    suite('DELETE', function() {
      test('Try to delete a reply with an incorrect delete_password', (done)=>{
        chai.request(server)
          .delete('/api/replies/testBoard')
          .send({thread_id: testingId2, reply_id: testingReplyId1})
          .end((err, res)=>{
            assert.equal(res.status, 200);
            assert.equal(res.body, 'incorrect password');
            done();
        });
      });
      
      test('Try to delete a reply with the correct delete_password', (done)=>{
        chai.request(server)
          .delete('/api/replies/testBoard')
          .send({thread_id: testingId2, reply_id: testingReplyId1})
          .end((err, res)=>{
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success');
            done();
        });
      });
    });
    
  });

});

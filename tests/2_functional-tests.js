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

  //tread
  const thread = {
    text: 'test',
    delete_password: 'test'
  }
  var thread_id;
  var thread_id2 = '5bc1f097c3ce0b12b6dc0c33';
  var reply_id;
  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('POST a thread to a specific message board', (done) => {
        chai.request(server)
        .post('/api/threads/chai-test')
        .send(thread)
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();
        });
      });

      test('POST a thread to a specific message board without req fields', (done) => {
         chai.request(server)
        .post('/api/threads/chai-test')
        .send({text: 'test', delete_password: ''})
        .end((err, res) => {
          assert.equal(res.status, 500);
          assert.property(res.body, 'board');
          assert.property(res.body, 'text');
          assert.property(res.body, 'delete_password');
          assert.equal(res.body.delete_password, 'invalid password');
          done();
        });
      });
    });
    
    suite('GET', function() {
      test('GET an array of the most recent 10 bumped threads', (done) => {
        chai.request(server)
        .get('/api/threads/chai-test')
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], '_id');
          assert.property(res.body[0], 'text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'bumped_on');
          assert.property(res.body[0], 'replies');
          assert.property(res.body[0], 'replycount');
          thread_id = res.body[0]._id;
          done();
        });
      });
    });

    suite('PUT', function() {
      test('Report a thread with id', (done) => {
        chai.request(server)
        .put('/api/threads/chai-test')
        .send({report_id: thread_id})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
      }); 
    });
    
    suite('DELETE', function() {

      test('DELETE a thread completely, without password and thread id', (done) => {
        chai.request(server)
        .delete('/api/threads/chai-test')
        .send({})
        .end((err, res) => {
          assert.equal(res.status, 500);
          assert.equal(res.text, 'invalid input');
          done();
        });

      test('DELETE a thread completely, with password and thread id', (done) => {
        chai.request(server)
        .delete('/api/threads/chai-test')
        .send({thread_id: thread_id, delete_password: thread.delete_password})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
      });

      });
    });

  });
  

  suite('API ROUTING FOR /api/replies/:board', function() {
    
    
    suite('GET', function() {
      test("GET an entire thread with all it's replies", (done) => {
        chai.request(server)
        .get('/api/replies/chai-test?thread_id='+thread_id2)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.property(res.body, 'text');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'bumped_on');
          assert.property(res.body, 'replies');
          assert.isArray(res.body.replies);
          reply_id = res.body.replies[0]._id;
          done();
        });
      });
    });

    suite('POST', function() {
      test('POST a reply to a thead on a specific board', (done) => {
        chai.request(server)
        .post('/api/replies/chai-test')
        .send({thread_id: thread_id2, text: 'test', delete_password: 'test'})
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();
        });
      }); 

      test('POST a reply to a thead on a specific board with req fields', (done) => {
        chai.request(server)
        .post('/api/replies/chai-test')
        .send({})
        .end((err, res) => {
          assert.equal(res.status, 500);
          assert.equal(res.text, 'missing input fields!!');
          done();
        });
      }); 
    });
    
    suite('PUT', function() {
      test("report a reply with reported value of true", (done) => {
        chai.request(server)
        .put('/api/replies/chai-test')
        .send({thread_id: thread_id2, reply_id: reply_id})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
      });

      test("report a reply with with req fields", (done) => {
        chai.request(server)
        .put('/api/replies/chai-test')
        .send({})
        .end((err, res) => {
          assert.equal(res.status, 500);
          assert.equal(res.text, 'invalid board or id');
          done();
        });
      });
    });
    
    suite('DELETE', function() {
      test("delete a post(changing the text to '[deleted]') with wrong password", (done) => {
        chai.request(server)
        .delete('/api/replies/chai-test')
        .send({thread_id: thread_id2, reply_id: reply_id, delete_password: 'test123'})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
      });
      
      test("delete a post(changing the text to '[deleted]')", (done) => {
        chai.request(server)
        .delete('/api/replies/chai-test')
        .send({thread_id: thread_id2, reply_id: reply_id, delete_password: 'test'})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'already deleted');
          done();
        });
      });
    });
    
  });

});

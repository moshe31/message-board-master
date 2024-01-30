/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
const MongoClient = require('mongodb');
const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');

const DB_URL = process.env.DB;

module.exports = function (app) {

  app.route('/api/threads/:board')
    .post((req, res) => {
      const board = req.params.board;
      const body = req.body;
    
      if (!board || !body.text || !body.delete_password) {
        return res.status(500).json({
          board: board || 'invalid board',
          text: body.text || 'invalid text',
          delete_password: body.delete_password || 'invalid password'
        });
      }
      let hashPassword = bcrypt.hashSync(body.delete_password, 10);

      const thread = {
        text: body.text,
        created_on: new Date,
        bumped_on: new Date,
        reported: false,
        delete_password: hashPassword,
        replies: []
      }
      MongoClient.connect(DB_URL, (err, db) => {
        db.collection(board).insertOne(thread, (err, data) => {
          if (err) return res.status(500).send(err);
          //res.status(200).json(thread);
          res.redirect(`/b/${board}/`);
        })
      })
    })

    .get((req, res) => {
      const board = req.params.board;
      if (!board) res.status(500).send('invalid board');

      MongoClient.connect(DB_URL, (err, db) => {
        db.collection(board).find({},
          {
            bumped_on: 1,
            created_on: 1,
            replies: 1,
            text: 1, _id: 1
          })
          .limit(10)
          .sort({ $natural: -1 })
          .toArray((err, data) => {
            if (err) res.status(500).send(err);
            data.map((x) => {
              x.replycount = x.replies.length;
              x.replies = x.replies.length > 3 ? 
              x.replies.slice(x.replies.length - 3, x.replies.length) : x.replies;
              x.replies = x.replies.map((y) => {
                delete y.delete_password;
                delete y.reported;
                return y;
              })
            });
            res.status(200).json(data);
          })
      })
    })

    .put((req, res) => {
      const board = req.params.board;
      const thread = req.body.report_id || req.body.thread_id;

      if (!board || !ObjectID.isValid(thread)) return res.status(500).send('invalid board or id');

      MongoClient.connect(DB_URL, (err, db) => {
        db.collection(board).findAndModify({ "_id": new ObjectID(thread) }, {},
          { $set: { "reported": true } }, { new: true }, (err, data) => {
            if (err) return res.status(500).send(err);
            res.status(200).send('reported');
          })
      })
    })

    .delete((req, res) => {
      const board = req.params.board;
      const threadID = req.body.thread_id;
      const password = req.body.delete_password;

      if (!board || !ObjectID.isValid(threadID) || !password) return res.status(500).send('invalid input');

      MongoClient.connect(DB_URL, (err, db) => {
        db.collection(board).findOne({ "_id": new ObjectID(threadID) },
          (err, data) => {
            if (err) return res.status(500).send(err);

            if (bcrypt.compareSync(password, data.delete_password)) {
              db.collection(board).remove({ "_id": new ObjectID(threadID) }, (err, doc) => {
                if (doc.result.ok) {
                  res.status(200).send('success');
                } else if (err) {
                  res.send('could not delete');
                }
              })
            } else {
              res.status(200).send('incorrect password');
            }
          })
      })
    })

  app.route('/api/replies/:board')
    .post((req, res) => {
      const board = req.params.board;
      const body = req.body;

      if (!board || !body.text ||
          !body.delete_password || !ObjectID.isValid(body.thread_id)) {

        return res.status(500).send("missing input fields!!");
      }
      
      let hashPassword = bcrypt.hashSync(body.delete_password, 10);

      const comment = {
        _id: new ObjectID().toHexString(),
        text: body.text,
        created_on: new Date,
        reported: false,
        delete_password: hashPassword
      }
      MongoClient.connect(DB_URL, (err, db) => {
        db.collection(board).findAndModify({ "_id": new ObjectID(body.thread_id) },
          {}, { $push: { replies: comment }, $set: { "bumped_on": comment.created_on } }, { new: true }, (err, data) => {
            if (err) return res.status(500).send(err);
            res.redirect(`/b/${board}/${body.thread_id}/`);
          })
      })
    })

    .get((req, res) => {
      const board = req.params.board;
      const thread = req.query.thread_id;
      if (!board || !thread) return res.status(500).send('invalid board');

      MongoClient.connect(DB_URL, (err, db) => {
        db.collection(board).findOne({ "_id": new ObjectID(thread) }, (err, data) => {
          if (err) res.status(500).send("could not get thread.");
          delete data.delete_password;
          delete data.reported;
          data.replies.map((x) => {
            delete x.delete_password;
            delete x.reported;
            return x;
          })
          res.status(200).json(data);
        })
      })
    })

    .put((req, res) => {
      const board = req.params.board;
      const reply_id = req.body.reply_id;
      //dont need thread_id, but i will validate it anyways since its *required
      const thread_id = req.body.thread_id;

      if (!board || !ObjectID.isValid(thread_id) || !ObjectID.isValid(reply_id))
        return res.status(500).send('invalid board or id');

      MongoClient.connect(DB_URL, (err, db) => {
        db.collection(board).update({ 'replies._id': reply_id },
          { $set: { 'replies.$.reported': true } }, (e, data) => {
            if (e) return res.status(500).send(err);
            res.status(200).send('success');
          })
      })
    })

    .delete((req, res) => {
      const board = req.params.board;
      const reply_id = req.body.reply_id;
      const password = req.body.delete_password;
      const thread_id = req.body.thread_id;

      if (!board || !ObjectID.isValid(thread_id) || 
      !ObjectID.isValid(reply_id) || !password){
        return res.status(500).send('invalid board or id');
      }


      MongoClient.connect(DB_URL, (err, db) => {

        db.collection(board).findOne({ "_id": ObjectID(thread_id) },
          { "replies": { $elemMatch: { "_id": reply_id } } },
          (err, data) => {
            if (err || data == null) return res.status(500).send(err || 'null');
            
            if (bcrypt.compareSync(password, data.replies[0].delete_password)) {
              
              db.collection(board).update({ 'replies._id': reply_id },
                { $set: { 'replies.$.text': '[deleted]' } }, (e, data) => {

                  if (e) return res.status(500).send(err);
                  if (data.result.n === 1 && data.result.nModified === 1) {
                    res.status(200).send('success');
                  } else if (data.result.n === 1 && data.result.nModified === 0) {
                    res.status(200).send('already deleted');
                  } else {
                    res.status(200).send('invalid id or password');
                  }
                })
            } else {
              res.send('incorrect password');
            }
          })

      })
    })
};

// server.js
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// DB setup
const db = new sqlite3.Database('./db.sqlite');
db.serialize(()=>{
  db.run(`CREATE TABLE IF NOT EXISTS users(
    tgId TEXT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    coins INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_daily INTEGER DEFAULT 0,
    referrer TEXT,
    ip TEXT
  )`);
});

// Helper: Telegram verification
async function verifyTelegram(initData){
  // basic parse
  // for real bot: verify with hash
  try{
    const params = Object.fromEntries(new URLSearchParams(initData));
    return params; 
  } catch(e){ return null; }
}

// API: user info
app.post('/api/user', async (req,res)=>{
  const initData = req.body.initData || '';
  const u = await verifyTelegram(initData);
  if(!u || !u.id) return res.json({success:false,message:'Invalid user'});

  // check or insert
  db.get(`SELECT * FROM users WHERE tgId=?`, [u.id], (err,row)=>{
    if(err) return res.json({success:false,message:err.message});
    if(!row){
      db.run(`INSERT INTO users(tgId,username,first_name,coins) VALUES(?,?,?,0)`, [u.id,u.username,u.first_name]);
      row = {tgId:u.id,username:u.username,first_name:u.first_name,coins:0,streak:0};
    }
    res.json({success:true,user:row});
  });
});

// API: claim coins
app.post('/api/claim', async (req,res)=>{
  const {amount, type, initData} = req.body;
  const u = await verifyTelegram(initData);
  if(!u || !u.id) return res.json({success:false,message:'Invalid user'});

  db.get(`SELECT * FROM users WHERE tgId=?`, [u.id], (err,row)=>{
    if(err) return res.json({success:false,message:err.message});
    if(!row) return res.json({success:false,message:'User not found'});

    // simple cooldown (5s demo)
    db.run(`UPDATE users SET coins=coins+? WHERE tgId=?`, [amount,u.id]);
    db.get(`SELECT coins FROM users WHERE tgId=?`, [u.id], (err2,row2)=>{
      res.json({success:true,coins:row2.coins});
    });
  });
});

// API: daily bonus
app.post('/api/daily', async(req,res)=>{
  const u = await verifyTelegram(req.body.initData||'');
  if(!u || !u.id) return res.json({success:false,message:'Invalid user'});
  const now = Date.now();
  db.get(`SELECT * FROM users WHERE tgId=?`,[u.id],(err,row)=>{
    if(err) return res.json({success:false,message:err.message});
    if(!row) return res.json({success:false,message:'User not found'});
    if(now - row.last_daily < 24*60*60*1000) return res.json({success:false,message:'Daily bonus already claimed'});

    const added = 50; // daily coins
    const streak = row.streak+1;
    db.run(`UPDATE users SET coins=coins+?,streak=?,last_daily=? WHERE tgId=?`,[added,streak,now,u.id]);
    db.get(`SELECT coins FROM users WHERE tgId=?`,[u.id],(err2,row2)=>{
      res.json({success:true,coins:row2.coins,added,streak});
    });
  });
});

// API: leaderboard
app.post('/api/leaderboard',(req,res)=>{
  db.all(`SELECT tgId,username,coins FROM users ORDER BY coins DESC LIMIT 10`,[],(err,rows)=>{
    if(err) return res.json({success:false,message:err.message});
    res.json({success:true,top:rows});
  });
});

// API: withdraw request (demo)
app.post('/api/withdraw',(req,res)=>{
  const {amount, initData} = req.body;
  const u = verifyTelegram(initData);
  if(!u || !u.id) return res.json({success:false,message:'Invalid user'});
  // real: validate min, payout, etc
  res.json({success:true,message:`Requested ${amount} coins for withdraw`});
});

app.listen(PORT,()=>console.log(`Server running on ${PORT}`));

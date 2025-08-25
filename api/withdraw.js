import { getDb } from './_db';
import { verifyTelegram, getUserFromInit } from './_verify';

const MIN_WITHDRAW = 5000; // e.g., 5000 coins

export default async function handler(req, res){
  try{
    if(req.method!=='POST') return res.status(405).json({success:false});
    const { initData, initDataUnsafe, amount } = req.body||{};
    if(!verifyTelegram(initData)) return res.status(401).json({success:false,message:'Auth failed'});

    const amt = Number(amount||0);
    if(amt < MIN_WITHDRAW) return res.json({success:false,message:`Minimum ${MIN_WITHDRAW} coins`});

    const db = await getDb();
    const users = db.collection('users');
    const withdrawals = db.collection('withdrawals');

    const u = getUserFromInit(initDataUnsafe);
    const user = await users.findOne({ tgId: u.tgId });
    if(!user || (user.coins||0) < amt) return res.json({success:false,message:'Insufficient balance'});

    // Deduct & create request
    await users.updateOne({ tgId: u.tgId }, { $inc:{ coins: -amt } });
    await withdrawals.insertOne({ tgId: u.tgId, amount: amt, status:'pending', createdAt: new Date() });

    res.json({success:true,message:'Withdraw request submitted'});
  }catch(e){
    console.error(e);
    res.status(500).json({success:false});
  }
}

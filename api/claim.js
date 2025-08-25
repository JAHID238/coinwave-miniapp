import { getDb } from './_db';
import { verifyTelegram, getUserFromInit } from './_verify';

const COOLDOWN_MS = 20_000; // 20s between claims

export default async function handler(req, res){
  try{
    if(req.method!=='POST') return res.status(405).json({success:false});
    const { initData, initDataUnsafe, amount, type } = req.body||{};
    if(!verifyTelegram(initData)) return res.status(401).json({success:false,message:'Auth failed'});

    const db = await getDb();
    const users = db.collection('users');

    const u = getUserFromInit(initDataUnsafe);
    const user = await users.findOne({ tgId: u.tgId });
    if(!user) return res.status(404).json({success:false,message:'User not found'});

    // cooldown
    const now = Date.now();
    if(now - (user.lastClaimAt||0) < COOLDOWN_MS){
      const wait = Math.ceil((COOLDOWN_MS - (now - (user.lastClaimAt||0)))/1000);
      return res.json({success:false,message:`Please wait ${wait}s before next claim.`});
    }

    const amt = Math.max(1, Math.min(Number(amount||0), 50)); // safety cap
    // Optionally validate 'type' logged for audit
    await users.updateOne({ tgId: u.tgId }, { $inc:{ coins: amt }, $set:{ lastClaimAt: now } });

    const updated = await users.findOne({ tgId: u.tgId });
    return res.json({success:true, coins: updated.coins});
  }catch(e){
    console.error(e);
    return res.status(500).json({success:false,message:'Server error'});
  }
}

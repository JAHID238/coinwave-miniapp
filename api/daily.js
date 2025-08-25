import { getDb } from './_db';
import { verifyTelegram, getUserFromInit } from './_verify';

export default async function handler(req, res){
  try{
    if(req.method!=='POST') return res.status(405).json({success:false});
    const { initData, initDataUnsafe } = req.body||{};
    if(!verifyTelegram(initData)) return res.status(401).json({success:false,message:'Auth failed'});

    const db = await getDb();
    const users = db.collection('users');
    const u = getUserFromInit(initDataUnsafe);
    let user = await users.findOne({ tgId: u.tgId });
    if(!user) return res.status(404).json({success:false,message:'User not found'});

    const today = new Date(); today.setHours(0,0,0,0);
    const last = user.lastDaily ? new Date(user.lastDaily) : null;
    const already = last && last.getTime() === today.getTime();
    if(already) return res.json({success:false,message:'Already claimed today', coins:user.coins, streak:user.streak});

    // streak logic
    let streak = user.streak||0;
    if(last){
      const yday = new Date(today.getTime()-86400000);
      if(last.getTime() === yday.getTime()) streak += 1;
      else streak = 1;
    }else streak = 1;

    const base = 10; // base daily
    const bonus = Math.min(20, streak); // +1 per day up to +20
    const added = base + bonus;

    await users.updateOne({ tgId: u.tgId }, { $inc:{ coins:added }, $set:{ lastDaily: today, streak } });
    user = await users.findOne({ tgId: u.tgId });

    return res.json({success:true, coins:user.coins, streak:user.streak, added});
  }catch(e){
    console.error(e);
    return res.status(500).json({success:false});
  }
}

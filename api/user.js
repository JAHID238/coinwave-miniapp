import { getDb } from './_db';
import { verifyTelegram, getUserFromInit } from './_verify';

export default async function handler(req, res){
  try{
    if(req.method!=='POST') return res.status(405).json({success:false,message:'Method not allowed'});
    const { initData, initDataUnsafe } = req.body||{};
    if(!verifyTelegram(initData)) return res.status(401).json({success:false,message:'Auth failed'});

    const db = await getDb();
    const users = db.collection('users');

    const u = getUserFromInit(initDataUnsafe);
    if(!u.tgId) return res.status(400).json({success:false,message:'User missing'});

    // Referral (only on create)
    const startParam = initDataUnsafe?.start_param || null;

    let user = await users.findOne({ tgId: u.tgId });
    if(!user){
      user = {
        ...u,
        coins: 0,
        streak: 0,
        lastDaily: null,
        lastClaimAt: 0,
        referredBy: null,
        createdAt: new Date()
      };
      if(startParam){ // credit referrer 50 coins
        const refBy = await users.findOne({ tgId: Number(startParam) });
        if(refBy){
          user.referredBy = refBy.tgId;
          await users.updateOne({ tgId: refBy.tgId }, { $inc:{ coins:50 } }, { upsert:false });
        }
      }
      await users.insertOne(user);
    }

    return res.json({success:true,user});
  }catch(e){
    console.error(e);
    return res.status(500).json({success:false,message:'Server error'});
  }
}

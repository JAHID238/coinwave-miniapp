import { getDb } from './_db';
import { verifyTelegram, getUserFromInit } from './_verify';

export default async function handler(req, res){
  try{
    // 1️⃣ HTTP Method check
    if(req.method!=='POST') 
      return res.status(405).json({success:false,message:'Method not allowed'});

    const { initData, initDataUnsafe } = req.body||{};

    // 2️⃣ Telegram signature verification
    if(!verifyTelegram(initData)) 
      return res.status(401).json({success:false,message:'Auth failed'});

    const db = await getDb();
    const users = db.collection('users');

    // 3️⃣ Extract user info
    const u = getUserFromInit(initDataUnsafe);
    if(!u.tgId) 
      return res.status(400).json({success:false,message:'User missing'});

    // 4️⃣ Referral param (sanitize)
    let startParam = initDataUnsafe?.start_param || null;
    if(startParam && isNaN(Number(startParam))) startParam = null;

    // 5️⃣ Find or create user
    let user = await users.findOne({ tgId: u.tgId });
    if(!user){
      user = {
        tgId: u.tgId,
        first_name: u.first_name || '',
        last_name: u.last_name || '',
        username: u.username || '',
        language_code: u.language_code || 'bn',
        coins: 0,
        streak: 0,
        lastDaily: null,
        lastClaimAt: 0,
        referredBy: null,
        createdAt: new Date()
      };

      // 6️⃣ Handle referral (only once)
      if(startParam){
        const refBy = await users.findOne({ tgId: Number(startParam) });
        if(refBy){
          user.referredBy = refBy.tgId;
          // Atomic increment with upsert:false
          await users.updateOne({ tgId: refBy.tgId }, { $inc:{ coins:50 } });
        }
      }

      await users.insertOne(user);
    }

    // 7️⃣ Response
    return res.json({
      success:true,
      user: {
        tgId: user.tgId,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        language_code: user.language_code,
        coins: user.coins,
        streak: user.streak,
        lastDaily: user.lastDaily,
        lastClaimAt: user.lastClaimAt,
        referredBy: user.referredBy
      }
    });

  }catch(e){
    console.error('User API error:', e);
    return res.status(500).json({success:false,message:'Server error'});
  }
}

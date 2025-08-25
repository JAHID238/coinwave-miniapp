import { getDb } from './_db';

export default async function handler(req, res){
  try{
    const db = await getDb();
    const users = db.collection('users');
    const top = await users.find({}, { projection:{ _id:0, tgId:1, username:1, coins:1 } })
                           .sort({ coins:-1 }).limit(10).toArray();
    res.json({success:true, top});
  }catch(e){
    console.error(e);
    res.status(500).json({success:false});
  }
}

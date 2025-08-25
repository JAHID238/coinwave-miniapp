export default function handler(req, res){
  if(req.method === "POST"){
    const { coins, user } = req.body;
    // এখানে MongoDB/Firebase বা অন্য DB এ save করা যাবে
    console.log("Claimed coins:", coins, "by user:", user?.id);
    return res.status(200).json({success:true, coins:coins});
  }
  return res.status(405).json({message:"Method Not Allowed"});
}

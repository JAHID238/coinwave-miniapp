import { MongoClient } from 'mongodb';

let client;
let db;

export async function getDb(){
  if(db) return db;
  const uri = process.env.MONGODB_URI;
  if(!uri) throw new Error('MONGODB_URI missing');
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'coinwave');
  return db;
}

import crypto from 'crypto';

/**
 * Verify Telegram WebApp initData (per Telegram docs)
 * Requires process.env.BOT_TOKEN
 */
export function verifyTelegram(initData){
  const token = process.env.BOT_TOKEN;
  if(!token) throw new Error('BOT_TOKEN missing');

  const urlData = new URLSearchParams(initData);
  const hash = urlData.get('hash');
  urlData.delete('hash');

  // build data_check_string
  const pairs = [];
  for(const [key, value] of urlData.entries()){
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const data_check_string = pairs.join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const calc_hash = crypto.createHmac('sha256', secret).update(data_check_string).digest('hex');

  return calc_hash === hash;
}

/** extract user object safely */
export function getUserFromInit(initDataUnsafe){
  // trust after verifyTelegram()
  const u = initDataUnsafe?.user || {};
  return {
    tgId: u.id,
    first_name: u.first_name,
    last_name: u.last_name || '',
    username: u.username || '',
    language_code: u.language_code || 'en'
  };
}

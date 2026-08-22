import https from 'node:https';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

const base = 'https://hamo236.github.io/neon-guess-game-public/';
const html = await get(base);
const asset = html.body.match(/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0];
const js = asset ? await get(`${base}${asset}`) : { status: 0, body: '' };
const text = js.body;
const databaseUrls = [...text.matchAll(/https:\/\/[^"'\\s]+firebaseio\.com[^"'\\s]*/g)].map((match) => match[0]);
const result = {
  htmlStatus: html.status,
  assetFound: Boolean(asset),
  assetStatus: js.status,
  hasNonPlaceholderDatabaseUrl: databaseUrls.some((url) => !url.includes('your_project_id')),
  databaseUrlCount: databaseUrls.length,
  containsFirebaseSdkInitializer: text.includes('initializeApp'),
  runtimeEnvNamesAreNotRequired: !text.includes('import.meta.env'),
};
console.log(JSON.stringify(result, null, 2));

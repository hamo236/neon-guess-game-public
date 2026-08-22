const ports = [9332, 9333];
async function run(port) {
  const page = (await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json())).find(t=>t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); const p = pending.get(m.id); if (p) { pending.delete(m.id); p(m); } };
  const send = (method, params = {}) => new Promise(resolve => { const requestId = ++id; pending.set(requestId, resolve); ws.send(JSON.stringify({id: requestId, method, params})); });
  await send('Runtime.evaluate', { expression: "[...document.querySelectorAll('button')].find(b=>b.innerText.includes('Join Room'))?.click(); 'clicked'", returnByValue: true });
  await new Promise(r => setTimeout(r, 700));
  const r = await send('Runtime.evaluate', { expression: "({text:document.body.innerText,inputs:[...document.querySelectorAll('input')].map((e,i)=>({i,placeholder:e.placeholder,value:e.value})),buttons:[...document.querySelectorAll('button')].map((b,i)=>({i,text:b.innerText,disabled:b.disabled}))})", returnByValue: true });
  ws.close(); return r.result?.result?.value;
}
const out=[]; for (const p of ports) { try { out.push({port:p,...await run(p)}); } catch(e) { out.push({port:p,error:String(e)}); } }
await import('node:fs/promises').then(fs=>fs.writeFile('qa-join-state.json', JSON.stringify(out,null,2)));

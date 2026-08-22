const ports = [9331, 9332, 9333, 9334];

async function cdp(port) {
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
  const page = targets.find(t => t.type === 'page');
  if (!page?.webSocketDebuggerUrl) throw new Error(`No page target on ${port}`);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const waiter = pending.get(message.id);
    if (waiter) { pending.delete(message.id); waiter(message); }
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    const requestId = ++id;
    pending.set(requestId, resolve);
    ws.send(JSON.stringify({ id: requestId, method, params }));
  });
  const expression = `({url: location.href, title: document.title, text: document.body?.innerText?.slice(0, 5000) || '', inputs: [...document.querySelectorAll('input,textarea,select')].map((e,i)=>({i,tag:e.tagName,type:e.type,placeholder:e.placeholder,value:e.value,disabled:e.disabled})), buttons: [...document.querySelectorAll('button')].map((b,i)=>({i,text:b.innerText,disabled:b.disabled,aria:b.getAttribute('aria-label')})), localStorage: Object.fromEntries(Object.entries(localStorage)), sessionStorage: Object.fromEntries(Object.entries(sessionStorage))})`;
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  ws.close();
  return result.result?.result?.value ?? result;
}

const evidence = [];
for (const port of ports) {
  try { evidence.push({ port, ...(await cdp(port)) }); }
  catch (error) { evidence.push({ port, error: String(error) }); }
}
await import('node:fs/promises').then(fs => fs.writeFile('qa-client-state.json', JSON.stringify(evidence, null, 2)));

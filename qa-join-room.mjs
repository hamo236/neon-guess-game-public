const clients = [{port:9332,name:'1',code:'RKWJ'},{port:9333,name:'2',code:'RKWJ'}];
async function run({port,name,code}) {
  const page=(await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json())).find(t=>t.type==='page');
  const ws=new WebSocket(page.webSocketDebuggerUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});
  let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){pending.delete(m.id);p(m)}};
  const send=(method,params={})=>new Promise(res=>{const i=++id;pending.set(i,res);ws.send(JSON.stringify({id:i,method,params}))});
  const expr=`(()=>{const set=(e,v)=>{const p=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;p.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))};const ins=[...document.querySelectorAll('input')];set(ins[0],${JSON.stringify(name)});set(ins[1],${JSON.stringify(code)});[...document.querySelectorAll('button')].find(b=>b.innerText.includes('Join Room')&&b.innerText.includes('login'))?.click();return 'submitted'})()`;
  await send('Runtime.evaluate',{expression:expr,returnByValue:true}); await new Promise(r=>setTimeout(r,1800));
  const out=await send('Runtime.evaluate',{expression:"({url:location.href,text:document.body.innerText.slice(0,3000),storage:Object.fromEntries(Object.entries(sessionStorage))})",returnByValue:true}); ws.close(); return out.result?.result?.value;
}
const out=[];for(const c of clients){try{out.push({port:c.port,...await run(c)})}catch(e){out.push({port:c.port,error:String(e)})}}await import('node:fs/promises').then(fs=>fs.writeFile('qa-join-result.json',JSON.stringify(out,null,2)));

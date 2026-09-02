/* Private dashboard access gate. Data is served through a password-verified Supabase Edge Function. */
(function(){
  if(window.__privateAccessGateInstalled)return;
  window.__privateAccessGateInstalled=true;
  const SB='https://wsuwnmrbdcorercrtcgy.supabase.co';
  const KEY='sb_publishable_4uTDBH31bP62rvnB59ee1A_iQvnqLEC';
  const PROXY=SB+'/functions/v1/private-dashboard-data';
  const style=document.createElement('style');
  style.textContent=`
    body.private-locked{overflow:hidden;background:#f4f6fa}
    .private-gate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:radial-gradient(circle at 50% 18%,#fff 0,#f7f9fc 36%,#eef2f7 100%);padding:20px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .private-card{width:min(430px,calc(100vw - 36px));background:#fff;border:1px solid #dfe5ee;border-radius:22px;padding:30px;box-shadow:0 22px 70px rgba(23,32,51,.10)}
    .private-icon{width:48px;height:48px;border-radius:14px;background:#172033;color:#fff;display:grid;place-items:center;font-size:22px;margin-bottom:20px}
    .private-eyebrow{font-size:11px;letter-spacing:.11em;font-weight:800;color:#667085;margin-bottom:8px}.private-card h1{font-size:25px;line-height:1.25;color:#172033;margin:0 0 8px}.private-card p{font-size:13px;line-height:1.7;color:#667085;margin:0 0 22px}
    .private-field{display:flex;gap:9px}.private-field input{flex:1;min-width:0;border:1px solid #d0d5dd;border-radius:11px;padding:12px 13px;font-size:14px;color:#172033;outline:none}.private-field input:focus{border-color:#799cf0;box-shadow:0 0 0 3px #eef4ff}
    .private-field button{border:0;border-radius:11px;background:#172033;color:#fff;font-weight:800;font-size:13px;padding:0 18px;cursor:pointer}.private-field button:disabled{opacity:.55;cursor:wait}
    .private-msg{min-height:20px;margin-top:10px;font-size:11px;color:#667085}.private-msg.error{color:#c43228}.private-foot{border-top:1px solid #eef1f5;margin-top:17px;padding-top:14px;font-size:10px!important;color:#98a2b3!important}
    .private-badge{position:fixed;right:18px;bottom:18px;z-index:9999;display:flex;align-items:center;gap:8px;background:#172033;color:#fff;border-radius:999px;padding:8px 11px;font:700 10px/1.2 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 6px 24px rgba(23,32,51,.15)}.private-badge button{border:0;background:transparent;color:#b8c3d9;font:inherit;cursor:pointer;padding:0}.private-badge button:hover{color:#fff}
  `;
  document.head.appendChild(style);
  document.body.classList.add('private-locked');

  const gate=document.createElement('div');
  gate.className='private-gate';
  gate.innerHTML=`<div class="private-card">
    <div class="private-icon">🔒</div>
    <div class="private-eyebrow">PRIVATE MARKET INTELLIGENCE</div>
    <h1>英国站派对类目监控中心</h1>
    <p>请输入访问口令。验证成功后，市场数据将通过 Supabase 私有服务端通道加载。</p>
    <form id="privateAccessForm">
      <div class="private-field"><input id="privatePassword" type="password" autocomplete="current-password" placeholder="输入访问口令" aria-label="访问口令"><button id="privateSubmit" type="submit">进入看板</button></div>
      <div id="privateMsg" class="private-msg"></div>
    </form>
    <p class="private-foot">未通过验证时，看板核心与市场数据均不会加载；重新打开或刷新页面需要再次验证。</p>
  </div>`;
  document.body.appendChild(gate);

  const form=document.getElementById('privateAccessForm'),input=document.getElementById('privatePassword'),submit=document.getElementById('privateSubmit'),msg=document.getElementById('privateMsg');
  const setMsg=(t,error=false)=>{msg.textContent=t||'';msg.className='private-msg'+(error?' error':'')};
  const nativeFetch=window.fetch.bind(window);

  async function proxyRequest(path,password){
    return nativeFetch(PROXY,{
      method:'POST',
      headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json','x-dashboard-password':password},
      body:JSON.stringify({path})
    });
  }

  async function verify(password){
    const r=await proxyRequest('monitor_runs?select=id&source_status=eq.ok&limit=1',password);
    if(r.status===401)return false;
    if(!r.ok)throw new Error('私有数据服务暂时不可用（HTTP '+r.status+'）');
    const rows=await r.json();
    return Array.isArray(rows);
  }

  function installPrivateFetch(password){
    window.__dashboardPassword=password;
    if(window.__privateFetchInstalled)return;
    window.__privateFetchInstalled=true;
    window.fetch=function(resource,options={}){
      const url=typeof resource==='string'?resource:(resource&&resource.url)||'';
      if(url.startsWith(SB+'/rest/v1/')){
        const path=url.slice((SB+'/rest/v1/').length);
        return proxyRequest(path,window.__dashboardPassword||'');
      }
      return nativeFetch(resource,options);
    };
  }

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const existing=[...document.scripts].find(s=>s.src&&s.src.includes(src.split('?')[0]));
      if(existing&&existing.dataset.loaded==='1'){resolve();return;}
      const s=document.createElement('script');s.src=src;s.onload=()=>{s.dataset.loaded='1';resolve()};s.onerror=()=>reject(new Error('模块加载失败：'+src));document.body.appendChild(s);
    });
  }

  async function openDashboard(password){
    installPrivateFetch(password);
    window.__dashboardAuthVerified=true;
    setMsg('验证通过，正在加载市场数据…');
    try{
      if(typeof window.loadCategory!=='function') await loadScript('app-core.js?v=20260902-twice-daily1');
      window.__dashboardAuthorized=true;
      if(!window.__structureLoaderInstalled) await loadScript('structure-select.js?v=20260902-column-headings1');
      gate.remove();
      document.body.classList.remove('private-locked');
      const boot=document.getElementById('privateBootStyle');if(boot)boot.remove();
      setTimeout(()=>{if(typeof window.load==='function')window.load()},350);
      const badge=document.createElement('div');badge.className='private-badge';badge.innerHTML='<span>● 私有访问已验证</span><button type="button">退出</button>';badge.querySelector('button').onclick=()=>location.reload();document.body.appendChild(badge);
    }catch(e){console.error(e);setMsg(e.message||'看板核心加载失败，请刷新重试。',true);}
  }

  async function attempt(password){
    if(!password)return false;
    submit.disabled=true;setMsg('正在验证并测试数据通道…');
    try{
      if(await verify(password)){await openDashboard(password);return true;}
      setMsg('访问口令不正确，请重新输入。',true);input.focus();return false;
    }catch(e){setMsg(e.message||'验证失败，请稍后重试。',true);return false}
    finally{submit.disabled=false}
  }

  form.addEventListener('submit',e=>{e.preventDefault();attempt(input.value.trim())});
  setTimeout(()=>input.focus(),60);
})();

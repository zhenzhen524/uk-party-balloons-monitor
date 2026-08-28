/* Private dashboard access gate. Password is verified in Supabase; no plaintext secret is stored in GitHub. */
(function(){
  const SB='https://wsuwnmrbdcorercrtcgy.supabase.co';
  const KEY='sb_publishable_4uTDBH31bP62rvnB59ee1A_iQvnqLEC';
  const SESSION_KEY='uk-party-dashboard-access';
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

  const gate=document.createElement('div');
  gate.className='private-gate';
  gate.innerHTML=`<div class="private-card">
    <div class="private-icon">🔒</div>
    <div class="private-eyebrow">PRIVATE MARKET INTELLIGENCE</div>
    <h1>英国站派对类目监控中心</h1>
    <p>该看板已设为受保护访问。请输入访问口令后加载 Party Balloons × Party Packs 市场数据。</p>
    <form id="privateAccessForm">
      <div class="private-field"><input id="privatePassword" type="password" autocomplete="current-password" placeholder="输入访问口令" aria-label="访问口令"><button id="privateSubmit" type="submit">进入看板</button></div>
      <div id="privateMsg" class="private-msg"></div>
    </form>
    <p class="private-foot">验证在 Supabase 后端完成；未通过验证时市场数据不会返回到浏览器。本次浏览器会话验证成功后无需重复输入。</p>
  </div>`;
  document.body.appendChild(gate);

  const form=document.getElementById('privateAccessForm'),input=document.getElementById('privatePassword'),submit=document.getElementById('privateSubmit'),msg=document.getElementById('privateMsg');
  const setMsg=(t,error=false)=>{msg.textContent=t||'';msg.className='private-msg'+(error?' error':'')};

  async function verify(password){
    const r=await fetch(SB+'/rest/v1/rpc/dashboard_access_ok',{
      method:'POST',
      headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json','x-dashboard-password':password},
      body:'{}'
    });
    if(!r.ok)throw new Error('验证服务暂时不可用');
    const v=await r.json();
    return v===true;
  }

  function installPrivateFetch(password){
    if(window.__privateFetchInstalled){window.__dashboardPassword=password;return;}
    window.__privateFetchInstalled=true;
    window.__dashboardPassword=password;
    const nativeFetch=window.fetch.bind(window);
    window.fetch=function(resource,options={}){
      let url=typeof resource==='string'?resource:(resource&&resource.url)||'';
      if(url.startsWith(SB+'/rest/v1/')){
        const sourceHeaders=options.headers||(resource instanceof Request?resource.headers:undefined);
        const headers=new Headers(sourceHeaders||{});
        headers.set('x-dashboard-password',window.__dashboardPassword||'');
        options={...options,headers};
        if(resource instanceof Request) resource=new Request(resource,options);
      }
      return nativeFetch(resource,options);
    };
  }

  function loadScript(src){
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('模块加载失败：'+src));document.body.appendChild(s)});
  }

  async function openDashboard(password){
    installPrivateFetch(password);
    sessionStorage.setItem(SESSION_KEY,password);
    gate.remove();
    document.body.classList.remove('private-locked');
    const boot=document.getElementById('privateBootStyle');if(boot)boot.remove();
    try{
      await loadScript('app.js?v=20260823-dual-v1');
      await loadScript('structure-select.js?v=20260827-private1');
      const badge=document.createElement('div');badge.className='private-badge';badge.innerHTML='<span>● 私有访问已验证</span><button type="button">退出</button>';badge.querySelector('button').onclick=()=>{sessionStorage.removeItem(SESSION_KEY);location.reload()};document.body.appendChild(badge);
    }catch(e){console.error(e);alert('看板模块加载失败，请刷新重试。');}
  }

  async function attempt(password,quiet=false){
    if(!password)return false;
    submit.disabled=true;if(!quiet)setMsg('正在验证…');
    try{
      if(await verify(password)){await openDashboard(password);return true;}
      sessionStorage.removeItem(SESSION_KEY);setMsg('访问口令不正确，请重新输入。',true);input.focus();return false;
    }catch(e){setMsg(e.message||'验证失败，请稍后重试。',true);return false}
    finally{submit.disabled=false}
  }

  form.addEventListener('submit',e=>{e.preventDefault();attempt(input.value.trim())});
  const saved=sessionStorage.getItem(SESSION_KEY);
  if(saved){setMsg('正在恢复私有访问…');attempt(saved,true)}else setTimeout(()=>input.focus(),60);
})();

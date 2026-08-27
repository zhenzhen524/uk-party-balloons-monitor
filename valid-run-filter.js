/* Keep partial/incomplete collection runs out of live market and trend calculations. */
(function(){
  if(window.__validRunFilterInstalled)return;
  window.__validRunFilterInstalled=true;
  const originalFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    let url=typeof input==='string'?input:(input&&input.url)||'';
    if(url.includes('/rest/v1/monitor_runs?') && url.includes('category_key=eq.') && !url.includes('source_status=')){
      const sep=url.includes('?')?'&':'?';
      url+=sep+'source_status=eq.ok';
      if(typeof input==='string') input=url;
      else if(input instanceof Request) input=new Request(url,input);
    }
    return originalFetch(input,init);
  };
  async function refresh(){
    try{
      if(typeof loadCategory!=='function'||typeof STORE==='undefined')return;
      const [b,p]=await Promise.all([
        loadCategory('party_balloons').catch(()=>null),
        loadCategory('party_packs').catch(()=>null)
      ]);
      STORE.party_balloons=b;STORE.party_packs=p;
      if(typeof renderDual==='function')renderDual();
      if(document.getElementById('detailPanel')?.classList.contains('active')&&typeof renderDetail==='function')renderDetail(activeKey);
    }catch(e){console.warn('正式批次刷新失败：',e);}
  }
  setTimeout(refresh,250);
  setTimeout(refresh,1200);
})();

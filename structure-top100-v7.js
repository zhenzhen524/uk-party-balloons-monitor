/* Conflict-free enhancement loader for the Top 100 dashboard. */
(function(){
  if(window.__structureLoaderInstalled)return;
  window.__structureLoaderInstalled=true;
  const files=[
    'valid-run-filter.js?v=20260827-valid1',
    'structure-select-base-top100-v7.js',
    'threshold-rule.js?v=20260826-history3',
    'market-panorama.js?v=20260914-de-market1',
    'history-brand-ui.js?v=20260914-de-market1',
    'history-force.js?v=20260914-de-market1',
    'dual-market-panorama-v2.js?v=20260914-de-market1',
    'detail-workbench-cleanup.js?v=20260908-owner1'
  ];
  function load(i){
    if(i>=files.length)return;
    const s=document.createElement('script');s.src=files[i];s.async=false;
    s.onload=()=>load(i+1);
    s.onerror=()=>{console.error('模块加载失败:',files[i]);load(i+1)};
    document.body.appendChild(s);
  }
  function startWhenReady(){
    if(window.__dashboardAuthorized&&typeof window.loadCategory==='function'){load(0);return}
    setTimeout(startWhenReady,120);
  }
  startWhenReady();
})();
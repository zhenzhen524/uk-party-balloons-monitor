/* Dashboard enhancement loader. Wait until private access and core app are ready. */
(function(){
  if(window.__structureLoaderInstalled)return;
  window.__structureLoaderInstalled=true;
  const files=[
    'valid-run-filter.js?v=20260827-valid1',
    'structure-select-base.js?v=20260826-history3',
    'threshold-rule.js?v=20260826-history3',
    'parent-sales-display.js?v=20260826-parent-sales4',
    'market-panorama.js?v=20260826-panorama3',
    'history-brand-ui.js?v=20260902-column-headings1',
    'history-force.js?v=20260826-history-force2',
    'dual-market-panorama-v2.js?v=20260827-market2',
    'market-copy-cleanup.js?v=20260827-copy1',
    'detail-workbench-cleanup.js?v=20260827-workbench1'
  ];
  function load(i){
    if(i>=files.length)return;
    const s=document.createElement('script');
    s.src=files[i];
    s.async=false;
    s.onload=()=>load(i+1);
    s.onerror=()=>{console.error('模块加载失败:',files[i]);load(i+1)};
    document.body.appendChild(s);
  }
  function startWhenReady(){
    if(window.__dashboardAuthorized && typeof window.loadCategory==='function'){
      load(0);
      return;
    }
    setTimeout(startWhenReady,120);
  }
  startWhenReady();
})();

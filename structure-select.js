/* Stable sequential loader for dashboard enhancement modules. */
(function(){
  const files=[
    'valid-run-filter.js?v=20260827-valid1',
    'structure-select-base.js?v=20260826-history3',
    'threshold-rule.js?v=20260826-history3',
    'parent-sales-display.js?v=20260826-parent-sales4',
    'market-panorama.js?v=20260826-panorama3',
    'history-brand-ui.js?v=20260826-history-brand3',
    'history-force.js?v=20260826-history-force2',
    'dual-market-panorama-v2.js?v=20260827-market2'
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
  load(0);
})();
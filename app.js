/* Source-level private bootstrap. The dashboard core never starts before access verification. */
(function(){
  if(window.__privateBootstrapInstalled)return;
  window.__privateBootstrapInstalled=true;
  document.body.classList.add('private-locked');
  if(!document.getElementById('privateBootStyle')){
    const st=document.createElement('style');
    st.id='privateBootStyle';
    st.textContent='body.private-locked{overflow:hidden;background:#f4f6fa}body.private-locked .app-shell{visibility:hidden}';
    document.head.appendChild(st);
  }
  if(window.__privateAccessGateInstalled)return;
  const s=document.createElement('script');
  s.src='private-access.js?v=20260902-scenes-cn1';
  s.onerror=()=>{
    document.body.classList.remove('private-locked');
    document.body.innerHTML='<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:40px;color:#172033"><h2>私有访问模块加载失败</h2><p>请稍后刷新页面重试。</p></div>';
  };
  document.body.appendChild(s);
})();

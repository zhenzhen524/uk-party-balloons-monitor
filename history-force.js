/* Fallback: guarantee history/trend tab exists even if richer trend module fails. */
(function(){
  function ensure(){
    const tabs=document.querySelector('.detail-tabs');
    const detail=document.getElementById('detailPanel');
    if(!tabs||!detail)return;
    let btn=document.getElementById('historyTabButton');
    if(!btn){
      btn=document.createElement('button');
      btn.id='historyTabButton';
      btn.type='button';
      btn.textContent='历史与趋势';
      tabs.appendChild(btn);
    }
    let panel=document.getElementById('detailHistory');
    if(!panel){
      panel=document.createElement('section');
      panel.id='detailHistory';
      panel.className='detail-panel';
      panel.innerHTML='<div class="page-head"><div><h2>历史与趋势</h2><p>原始批次用于查证；近7天、近30天、本季度和自定义时间用于趋势回顾。</p></div></div><div class="history-period-nav"><button data-history-mode="batch">原始批次</button><button data-history-mode="7d">近7天</button><button class="active" data-history-mode="30d">近30天</button><button data-history-mode="quarter">本季度</button><button data-history-mode="custom">自定义</button></div><div style="padding:18px;border:1px solid #e1e6ef;border-radius:12px;background:#fff;color:#667085">历史趋势数据模块正在加载；如果这里持续显示此提示，请刷新一次页面。</div>';
      detail.appendChild(panel);
    }
    if(!btn.dataset.forceBound){
      btn.dataset.forceBound='1';
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.detail-tabs button').forEach(x=>x.classList.remove('active'));
        document.querySelectorAll('#detailPanel > .detail-panel').forEach(x=>x.classList.remove('active'));
        btn.classList.add('active');
        panel.classList.add('active');
      });
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure);else ensure();
  setTimeout(ensure,300);
  setTimeout(ensure,1200);
})();

/* History batch access + stronger brand hierarchy. */
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .product-meta-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:5px}
    .asin-code{font-size:10px;color:#98a2b3;font-weight:600;letter-spacing:.01em}
    .brand-highlight{display:inline-flex;align-items:center;max-width:180px;padding:2px 8px;border:1px solid #c8d8ff;border-radius:999px;background:#eef4ff;color:#245dd8;font-size:11px;font-weight:800;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .history-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px}
    .history-toolbar select{min-width:270px;min-height:40px;border:1px solid #d0d5dd;border-radius:9px;background:#fff;padding:8px 11px;color:#344054;font-size:12px;font-weight:700}
    .history-note{font-size:12px;color:#667085}
    .history-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 14px}
    .history-kpi{border:1px solid #e1e6ef;border-radius:12px;background:#fff;padding:12px 14px}
    .history-kpi span{display:block;color:#667085;font-size:11px;margin-bottom:5px}.history-kpi b{font-size:20px;color:#172033}.history-kpi small{display:block;color:#98a2b3;font-size:10px;margin-top:4px}
    .history-empty{padding:28px;text-align:center;color:#667085}
    @media(max-width:800px){.history-kpis{grid-template-columns:1fr 1fr}.history-toolbar select{min-width:0;width:100%}}
  `;
  document.head.appendChild(style);

  productCell=function(x){
    const link=safe(x.source_url)||`https://www.amazon.co.uk/dp/${encodeURIComponent(x.asin)}`;
    const img=safe(x.image_url);
    return `<div class="product">${img?`<img class="thumb" loading="lazy" src="${esc(img)}" alt="">`:'<div class="ph">暂无<br>主图</div>'}<div><div class="ptitle"><a href="${esc(link)}" target="_blank" rel="noopener">${esc(x.title||'未获取标题')}</a></div><div class="product-meta-row"><span class="asin-code">${esc(x.asin)}</span>${x.brand?`<span class="brand-highlight" title="${esc(x.brand)}">${esc(x.brand)}</span>`:''}</div></div></div>`;
  };

  function ensureHistoryUI(){
    const tabs=document.querySelector('.detail-tabs');
    if(!tabs)return;
    if(!document.getElementById('historyTabButton')){
      const btn=document.createElement('button');
      btn.id='historyTabButton';btn.type='button';btn.textContent='历史批次';
      tabs.appendChild(btn);
      btn.addEventListener('click',async()=>{
        document.querySelectorAll('.detail-tabs button').forEach(x=>x.classList.remove('active'));
        document.querySelectorAll('.detail-panel').forEach(x=>x.classList.remove('active'));
        btn.classList.add('active');document.getElementById('detailHistory')?.classList.add('active');
        await loadHistoryRuns(activeKey);
      });
    }
    if(!document.getElementById('detailHistory')){
      const sec=document.createElement('section');
      sec.id='detailHistory';sec.className='detail-panel';
      sec.innerHTML=`<div class="page-head"><div><h2>历史采集批次</h2><p>每一轮采集都独立保存；这里按时间回看原始快照，不与最新市场全景混算。</p></div><div id="historyRunCount" class="page-count">—</div></div>
        <div class="history-toolbar"><select id="historyRunSelect"><option>正在读取历史批次…</option></select><span id="historyRunNote" class="history-note"></span></div>
        <div id="historyKpis" class="history-kpis"></div>
        <div class="table-wrap"><table class="product-table"><thead><tr><th>商品</th><th>当前排名</th><th>父体销量</th><th>销售额</th><th>变体数量</th><th>上架天数</th></tr></thead><tbody id="historyRows"><tr><td colspan="6" class="history-empty">选择一个批次查看。</td></tr></tbody></table></div>`;
      document.querySelector('#detailPanel main')?.appendChild(sec);
      const parent=document.getElementById('detailPanel');
      if(parent) parent.appendChild(sec);
      const sel=sec.querySelector('#historyRunSelect');
      sel.addEventListener('change',()=>renderHistoryRun(Number(sel.value)));
    }
  }

  let historyRuns=[];
  async function loadHistoryRuns(key){
    ensureHistoryUI();
    const sel=document.getElementById('historyRunSelect');
    const note=document.getElementById('historyRunNote');
    if(!sel)return;
    sel.innerHTML='<option>正在读取…</option>';note.textContent='';
    try{
      historyRuns=await q(`monitor_runs?select=id,collected_at,source,source_status,source_note,is_baseline,data_month&category_key=eq.${key}&order=collected_at.desc&limit=80`);
      document.getElementById('historyRunCount').textContent=`保留 ${historyRuns.length} 个批次`;
      sel.innerHTML=historyRuns.map((r,i)=>`<option value="${r.id}">${i===0?'最新 · ':''}${when(r.collected_at)} · Run ${r.id}${r.data_month?' · '+String(r.data_month).slice(0,7):''}</option>`).join('');
      if(historyRuns.length)await renderHistoryRun(historyRuns[0].id);else document.getElementById('historyRows').innerHTML='<tr><td colspan="6" class="history-empty">暂无历史批次。</td></tr>';
    }catch(e){sel.innerHTML='<option>历史批次读取失败</option>';note.textContent=e.message;}
  }

  async function renderHistoryRun(runId){
    const run=historyRuns.find(r=>Number(r.id)===Number(runId));
    const body=document.getElementById('historyRows'),kpis=document.getElementById('historyKpis'),note=document.getElementById('historyRunNote');
    if(!body||!kpis)return;
    body.innerHTML='<tr><td colspan="6" class="history-empty">正在读取该轮商品…</td></tr>';
    try{
      const rows=await q(`product_snapshots?select=*&run_id=eq.${runId}&order=category_rank.asc.nullslast`);
      const parentCoverage=pct(rows.filter(x=>x.parent_sales_estimate!=null).length,rows.length);
      const revenueCoverage=pct(rows.filter(x=>x.sales_revenue_gbp!=null).length,rows.length);
      const top=rows.filter(x=>x.category_rank!=null&&x.category_rank<=100).length;
      kpis.innerHTML=`<div class="history-kpi"><span>该轮 ASIN</span><b>${fmt(rows.length)}</b><small>原始快照记录</small></div><div class="history-kpi"><span>排名≤100</span><b>${fmt(top)}</b><small>该轮采集结果</small></div><div class="history-kpi"><span>父体销量覆盖</span><b>${parentCoverage.toFixed(1)}%</b><small>卖家精灵字段</small></div><div class="history-kpi"><span>销售额覆盖</span><b>${revenueCoverage.toFixed(1)}%</b><small>该轮字段完整度</small></div>`;
      note.textContent=run?`${when(run.collected_at)} · ${run.source_status||'—'}${run.source_note?' · '+run.source_note:''}`:'';
      body.innerHTML=rows.length?rows.map(x=>`<tr><td>${productCell(x)}</td><td class="rank">${x.category_rank==null?'—':'#'+fmt(x.category_rank)}</td><td>${x.parent_sales_estimate==null?'—':fmt(x.parent_sales_estimate)}</td><td>${x.sales_revenue_gbp==null?'—':money(x.sales_revenue_gbp)}</td><td>${x.variant_count==null?'—':fmt(x.variant_count)}</td><td>${fmt(x.days_since_launch)}</td></tr>`).join(''):'<tr><td colspan="6" class="history-empty">该批次没有商品记录。</td></tr>';
      bindImgs();
    }catch(e){body.innerHTML=`<tr><td colspan="6" class="history-empty">读取失败：${esc(e.message)}</td></tr>`;}
  }

  ensureHistoryUI();
  document.querySelectorAll('.category-tabs button').forEach(b=>{
    b.addEventListener('click',()=>setTimeout(()=>{
      if(document.getElementById('historyTabButton')?.classList.contains('active') && b.dataset.category!=='compare')loadHistoryRuns(b.dataset.category);
    },30));
  });
  setTimeout(()=>{try{if(STORE?.party_balloons||STORE?.party_packs){renderMarketTop();if(document.getElementById('detailPanel')?.classList.contains('active'))renderDetail(activeKey)}}catch(e){}},250);
})();

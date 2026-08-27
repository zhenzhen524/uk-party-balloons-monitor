/* Dual-category market panorama v2. Replaces old technical KPI cards with market/development metrics. */
(function(){
  const compact=n=>{if(n==null||!Number.isFinite(Number(n)))return '—';const v=Number(n),a=Math.abs(v);if(a>=1e6)return(v/1e6).toFixed(a>=1e7?1:2).replace(/\.0+$/,'')+'M';if(a>=1e3)return(v/1e3).toFixed(a>=1e5?0:1).replace(/\.0$/,'')+'K';return Math.round(v).toLocaleString('en-GB')};
  const gbp=n=>n==null||!Number.isFinite(Number(n))?'—':'£'+compact(n);
  const med=a=>{const x=a.filter(v=>v!=null&&Number.isFinite(Number(v))).map(Number).sort((a,b)=>a-b);if(!x.length)return null;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2};
  const norm=s=>String(s||'未知品牌').trim().toLowerCase();
  const pc=(a,b)=>b?100*a/b:0;
  const clean=rows=>(rows||[]).filter(x=>typeof isLowValueOldListing==='function'?!isLowValueOldListing(x):true);
  function pkey(x){return x.parent_asin?'p:'+x.parent_asin:['h',norm(x.brand),x.category_rank??'na',x.parent_sales_estimate??'na',x.variant_count??'na'].join('|')}
  function panorama(data){
    const rows=clean(data?.products||[]),m=new Map();
    for(const x of rows){const k=pkey(x);let g=m.get(k);if(!g){g={brand:x.brand||'未知品牌',rank:x.category_rank??null,sales:null,revs:[],prices:[]};m.set(k,g)}if(x.category_rank!=null&&(g.rank==null||x.category_rank<g.rank))g.rank=x.category_rank;if(x.parent_sales_estimate!=null&&Number.isFinite(Number(x.parent_sales_estimate)))g.sales=Math.max(g.sales??-Infinity,Number(x.parent_sales_estimate));if(x.sales_revenue_gbp!=null&&Number.isFinite(Number(x.sales_revenue_gbp)))g.revs.push(Number(x.sales_revenue_gbp));if(x.price_gbp!=null&&Number.isFinite(Number(x.price_gbp)))g.prices.push(Number(x.price_gbp))}
    const gs=[...m.values()].map(g=>{g.rev=med(g.revs);if(g.rev==null&&g.sales!=null){const p=med(g.prices);if(p!=null)g.rev=g.sales*p}return g}),known=gs.filter(g=>g.sales!=null&&Number.isFinite(g.sales)),rev=gs.filter(g=>g.rev!=null&&Number.isFinite(g.rev));
    const totalSales=known.length?known.reduce((s,g)=>s+g.sales,0):null,totalRev=rev.length?rev.reduce((s,g)=>s+g.rev,0):null,bm=new Map();
    for(const g of known){if(!g.brand||g.brand==='未知品牌')continue;const k=norm(g.brand),o=bm.get(k)||{name:g.brand,sales:0};o.sales+=g.sales;bm.set(k,o)}
    const brands=[...bm.values()].sort((a,b)=>b.sales-a.sales).map(x=>({...x,share:totalSales?100*x.sales/totalSales:0}));
    const top3=brands.slice(0,3),cr3=top3.reduce((s,x)=>s+x.share,0),topSales=known.filter(g=>g.rank!=null&&g.rank<=100).reduce((s,g)=>s+g.sales,0),top=rows.filter(x=>x.category_rank!=null&&x.category_rank<=100),young=top.filter(x=>x.days_since_launch!=null&&x.days_since_launch<=180);
    const prevTop=new Set((data?.prevProducts||[]).filter(x=>x.category_rank!=null&&x.category_rank<=100).map(x=>x.asin)),curTop=new Set(top.map(x=>x.asin)),newIn=top.filter(x=>!prevTop.has(x.asin)).length,out=[...prevTop].filter(a=>!curTop.has(a)).length;
    return {rows,parents:gs.length,totalSales,totalRev,brands,top3,cr3,price:med(rows.map(x=>x.price_gbp)),youngShare:pc(young.length,top.length),topSalesShare:totalSales?pc(topSales,totalSales):0,salesCoverage:pc(known.length,Math.max(1,gs.length)),revenueCoverage:pc(rev.length,Math.max(1,gs.length)),topCount:top.length,midCount:rows.filter(x=>x.category_rank>=200&&x.category_rank<=400).length,asinCount:rows.length,churn:pc(newIn+out,Math.max(1,top.length+prevTop.size)),newIn,out};
  }
  function brandList(p){return p.top3.length?p.top3.map(x=>`<b>${esc(x.name)}</b> ${x.share.toFixed(1)}%`).join('<br>'):'父体销量数据不足'}
  function card(label,value,note,cls=''){return `<div class="mp-card ${cls}"><span>${esc(label)}</span><strong>${value}</strong><small>${note}</small></div>`}
  function renderBoard(key,board){
    const data=STORE?.[key];if(!board)return;
    const old=board.querySelector('.board-metrics');if(old)old.style.display='none';
    let root=board.querySelector('.market-panorama-v2');if(!root){root=document.createElement('div');root.className='market-panorama-v2';(old||board.querySelector('.category-board-head'))?.insertAdjacentElement('afterend',root)}
    if(!data){root.innerHTML='<div class="mp-empty">等待正式完整批次。</div>';return}
    const p=panorama(data),top1=p.brands[0];
    root.innerHTML=`
      <div class="mp-title-row"><div><span class="mp-kicker">市场全景</span><b>市场规模 · 品牌份额 · 新品进入</b></div><span class="mp-run">正式批次 · ${when(data.latest?.collected_at)}</span></div>
      <div class="mp-grid">
        ${card('父体销量总量',`<em>${compact(p.totalSales)}</em>`,`父体去重估算 · 覆盖 ${p.salesCoverage.toFixed(1)}%`,'primary')}
        ${card('父体销售额总量',`<em>${gbp(p.totalRev)}</em>`,`销售额覆盖 ${p.revenueCoverage.toFixed(1)}%`)}
        ${card('有效父体数',`<em>${fmt(p.parents)}</em>`,'父体ASIN待完善 · 当前按父体特征去重')}
        ${card('价格中位数',`<em>${p.price==null?'—':money(p.price)}</em>`,'当前正式样本')}
        ${card('TOP1品牌',`<em class="mp-brand">${top1?esc(top1.name):'—'}</em>`,top1?`市场份额 <b>${top1.share.toFixed(1)}%</b> · 父体销量 ${compact(top1.sales)}`:'父体销量数据不足','brand-card')}
        ${card('TOP3品牌集中度',`<em>${p.top3.length?p.cr3.toFixed(1)+'%':'—'}</em>`,brandList(p),'brands-card')}
        ${card('Top100新品占比',`<em>${p.youngShare.toFixed(1)}%</em>`,'≤180天新品 / Top100样本')}
        ${card('Top100父体销量占比',`<em>${p.topSalesShare.toFixed(1)}%</em>`,'判断销量是否高度集中在头部')}
      </div>
      <div class="mp-activity-title"><span>市场活跃度与数据质量</span><small>用于判断采集覆盖与头部流动，不作为市场规模本身</small></div>
      <div class="mp-activity">
        <div><span>排名≤100</span><b>${fmt(p.topCount)}</b></div>
        <div><span>#200–400</span><b>${fmt(p.midCount)}</b></div>
        <div><span>有效ASIN</span><b>${fmt(p.asinCount)}</b></div>
        <div><span>Top100换手</span><b>${p.churn.toFixed(1)}%</b><small>新进 ${p.newIn} / 退出 ${p.out}</small></div>
        <div><span>父体销量覆盖</span><b>${p.salesCoverage.toFixed(1)}%</b></div>
      </div>`;
    const state=board.querySelector('.board-state');if(state){state.textContent='正式批次';state.className='board-state live'}
  }
  function cleanLegacyScores(){
    document.querySelectorAll('.section-block').forEach(sec=>{const h=sec.querySelector('.section-head h2');if(h&&h.textContent.trim()==='今日类目机会指数')sec.style.display='none'});
    const market=document.querySelector('#marketTopRows')?.closest('table');if(market)market.classList.add('hide-score-col-3');
    const detail=document.querySelector('#detailTopRows')?.closest('table');if(detail)detail.classList.add('hide-score-col-2');
    const mid=document.querySelector('#detailMidRows')?.closest('table');if(mid)mid.classList.add('hide-score-col-9');
  }
  function render(){renderBoard('party_balloons',document.querySelector('.balloons-board'));renderBoard('party_packs',document.querySelector('.packs-board'));cleanLegacyScores()}
  const css=`
    .market-panorama-v2{margin-top:14px}.mp-title-row{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:10px}.mp-title-row>div{display:flex;flex-direction:column;gap:3px}.mp-kicker{font-size:10px;font-weight:850;letter-spacing:.08em;color:#245dd8}.mp-title-row b{font-size:12px;color:#344054}.mp-run{font-size:10px;color:#98a2b3;white-space:nowrap}
    .mp-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.mp-card{min-width:0;background:#f8fafc;border:1px solid #e4e9f1;border-radius:12px;padding:12px 13px}.mp-card span{display:block;font-size:10px;color:#667085;margin-bottom:6px}.mp-card strong{display:block;min-height:28px;color:#172033}.mp-card em{font-style:normal;font-size:21px;font-weight:850;line-height:1.15}.mp-card small{display:block;font-size:9px;color:#98a2b3;line-height:1.45;margin-top:5px}.mp-card small b{color:#245dd8}.mp-card.primary{border-top:2px solid #2f6fed}.mp-brand{color:#174ea6!important;font-size:18px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}.brand-card{background:#f7f9ff}.brands-card small{color:#475467}.brands-card small b{color:#174ea6}
    .mp-activity-title{display:flex;align-items:baseline;gap:8px;margin:14px 0 7px}.mp-activity-title span{font-size:11px;font-weight:850;color:#344054}.mp-activity-title small{font-size:9px;color:#98a2b3}.mp-activity{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.mp-activity>div{background:#fff;border-top:1px solid #edf0f5;padding:8px 3px 2px}.mp-activity span{display:block;color:#98a2b3;font-size:9px}.mp-activity b{display:block;color:#344054;font-size:14px;margin-top:2px}.mp-activity small{font-size:8px;color:#98a2b3}.mp-empty{padding:28px;border:1px dashed #d7deea;border-radius:12px;color:#667085;text-align:center}
    .hide-score-col-3 th:nth-child(3),.hide-score-col-3 td:nth-child(3),.hide-score-col-2 th:nth-child(2),.hide-score-col-2 td:nth-child(2),.hide-score-col-9 th:nth-child(9),.hide-score-col-9 td:nth-child(9){display:none}
    @media(max-width:1100px){.mp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mp-activity{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:680px){.mp-title-row{align-items:flex-start;flex-direction:column}.mp-grid{grid-template-columns:1fr 1fr}.mp-activity{grid-template-columns:1fr 1fr}.mp-card em{font-size:18px}}
  `;
  let s=document.getElementById('dual-market-panorama-v2-style');if(!s){s=document.createElement('style');s.id='dual-market-panorama-v2-style';s.textContent=css;document.head.appendChild(s)}
  const base=typeof renderDual==='function'?renderDual:null;if(base){renderDual=function(){base();render()}}
  setTimeout(render,300);setTimeout(render,1200);setTimeout(render,2500);
})();
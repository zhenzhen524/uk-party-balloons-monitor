/* Display SellerSprite parent sales consistently across the dashboard. */
function parentSalesCell(x){
  return x?.parent_sales_estimate==null?'<span class="flat">—</span>':`<b>${fmt(x.parent_sales_estimate)}</b>`;
}

opportunityReason=function(data,x){
  const d=rankDiff(data,x),arr=[];
  if((d.delta||0)>=20)arr.push(`排名前移${d.delta}位`);
  if(x.category_rank<=100)arr.push('已进入≤100');
  if(x.days_since_launch!=null&&x.days_since_launch<=180)arr.push(`上架${x.days_since_launch}天`);
  if(x.parent_sales_estimate!=null)arr.push(`父体销量${x.parent_sales_estimate}`);
  if(x.review_count!=null&&x.review_count<100)arr.push('评论门槛较低');
  return arr.slice(0,3).join(' · ')||'持续观察排名与父体销量';
};

directOpportunityOrder=function(d,a,b){
  const pa=priority(d,a),pb=priority(d,b),order={P0:0,P1:1,P2:2,P3:3};
  if(order[pa]!==order[pb])return order[pa]-order[pb];
  const da=rankDiff(d,a).delta??-999999,db=rankDiff(d,b).delta??-999999;
  if(db!==da)return db-da;
  if((a.category_rank??999999)!==(b.category_rank??999999))return (a.category_rank??999999)-(b.category_rank??999999);
  return (b.parent_sales_estimate??-1)-(a.parent_sales_estimate??-1);
};

rewriteTableHeaders=function(){
  const market=document.querySelector('#marketTopRows')?.closest('table')?.querySelector('thead tr');
  if(market)market.innerHTML='<th>类目</th><th>商品</th><th>当前排名</th><th>本轮变化</th><th>上架天数</th><th>变体数量</th><th>评论</th><th>父体销量</th><th>值得看原因</th>';
  const top=document.querySelector('#detailTopRows')?.closest('table')?.querySelector('thead tr');
  if(top)top.innerHTML='<th>商品</th><th>机会类型</th><th>当前排名</th><th>本轮变化</th><th>近三轮排名</th><th>上架天数</th><th>变体数量</th><th>评论</th><th>父体销量</th><th>原因</th>';
  const changes=document.querySelector('#detailChangeRows')?.closest('table')?.querySelector('thead tr');
  if(changes)changes.innerHTML='<th>商品</th><th>优先级</th><th>当前排名</th><th>上次排名</th><th>变化</th><th>近三轮排名</th><th>价格</th><th>父体销量</th><th>变体数量</th><th>评分/评论</th><th>标签</th>';
  const mid=document.querySelector('#detailMidRows')?.closest('table')?.querySelector('thead tr');
  if(mid)mid.innerHTML='<th>商品</th><th>优先级</th><th>当前排名</th><th>上次排名</th><th>前移</th><th>近三轮排名</th><th>价格</th><th>父体销量</th><th>上架天数</th><th>变体数量</th><th>判断</th>';
  const struct=document.querySelector('#detailStructRows')?.closest('table')?.querySelector('thead tr');
  if(struct)struct.innerHTML='<th>标签</th><th>数量</th><th>当前占比</th><th>前2轮均值</th><th>变化</th><th>三轮走势</th>';
};

renderMarketTop=function(){
  sanitizeStore();let rows=[];
  for(const d of [STORE.party_balloons,STORE.party_packs].filter(Boolean))rows.push(...d.products.map(x=>({d,x})));
  rows.sort((a,b)=>{
    const oa={P0:0,P1:1,P2:2,P3:3},pa=priority(a.d,a.x),pb=priority(b.d,b.x);
    if(oa[pa]!==oa[pb])return oa[pa]-oa[pb];
    const da=rankDiff(a.d,a.x).delta??-999999,db=rankDiff(b.d,b.x).delta??-999999;
    if(db!==da)return db-da;
    if((a.x.category_rank??999999)!==(b.x.category_rank??999999))return (a.x.category_rank??999999)-(b.x.category_rank??999999);
    return (b.x.parent_sales_estimate??-1)-(a.x.parent_sales_estimate??-1);
  });
  rows=rows.slice(0,10);
  $('marketTopNote').textContent=STORE.party_packs?'双类目按P级与排名动能排序':'当前仅 Party Balloons';
  $('marketTopRows').innerHTML=rows.length?rows.map(o=>`<tr><td>${categoryTag(o.d.key)}</td><td>${productCell(o.x)}</td><td class="rank">#${fmt(o.x.category_rank)}</td><td>${moveCell(o.d,o.x)}</td><td>${fmt(o.x.days_since_launch)}</td><td>${variantCell(o.x)}</td><td>${fmt(o.x.review_count)}</td><td>${parentSalesCell(o.x)}</td><td>${esc(opportunityReason(o.d,o.x))}</td></tr>`).join(''):'<tr><td colspan="9" class="empty">暂无数据。</td></tr>';
  bindImgs();rewriteTableHeaders();
};

renderDetailTop=function(d){
  sanitizeData(d);ensureEnhancementUI();refreshTypeOptions(d);
  const rows=[...d.products].sort((a,b)=>directOpportunityOrder(d,a,b)).slice(0,10);
  $('detailTopNote').textContent=`从 ${d.products.length} 个有效ASIN筛选${d.excludedOldLowValue?` · 已排除 ${d.excludedOldLowValue} 个低价值老链接`:''}`;
  $('detailTopRows').innerHTML=rows.length?rows.map(x=>`<tr><td>${productCell(x)}</td><td>${opportunityType(d,x)}</td><td class="rank">#${fmt(x.category_rank)}</td><td>${moveCell(d,x)}</td><td>${rankHistory(d,x)}</td><td>${fmt(x.days_since_launch)}</td><td>${variantCell(x)}</td><td>${fmt(x.review_count)}</td><td>${parentSalesCell(x)}</td><td>${esc(opportunityReason(d,x))}</td></tr>`).join(''):'<tr><td colspan="10" class="empty">暂无符合条件的商品。</td></tr>';
  bindImgs();rewriteTableHeaders();
};

renderDetailChanges=function(d){
  sanitizeData(d);ensureEnhancementUI();refreshTypeOptions(d);
  const all=d.products.filter(x=>{const rd=rankDiff(d,x);return Math.abs(rd.delta||0)>=20||(x.category_rank<=100&&rd.old!=null&&rd.old>100)}),counts={P0:0,P1:0,P2:0,P3:0};
  all.forEach(x=>counts[priority(d,x)]++);
  let rows=all.filter(x=>{const p=priority(d,x);if(CHANGE_FILTER.priority!=='all'&&p!==CHANGE_FILTER.priority)return false;if(CHANGE_FILTER.type&&x.product_type!==CHANGE_FILTER.type)return false;if(CHANGE_FILTER.term&&!`${x.asin} ${x.title||''} ${x.brand||''}`.toLowerCase().includes(CHANGE_FILTER.term))return false;return true}).sort((a,b)=>directOpportunityOrder(d,a,b));
  $('detailChangeCount').textContent=`${rows.length} / ${all.length} 个异动ASIN`;
  $('detailPriority').innerHTML=['P0','P1','P2','P3'].map((p,i)=>`<article class="priority-card p${i}"><span>${p}${['关键突破','强异动','明显异动','一般波动'][i]}</span><b>${counts[p]}</b></article>`).join('');
  $('detailChangeRows').innerHTML=rows.length?rows.slice(0,150).map(x=>{const rd=rankDiff(d,x),p=priority(d,x);return `<tr><td>${productCell(x)}</td><td>${priorityBadge(p)}</td><td class="rank">#${fmt(x.category_rank)}</td><td>${rd.old==null?'—':'#'+fmt(rd.old)}</td><td>${moveCell(d,x)}</td><td>${rankHistory(d,x)}</td><td>${money(x.price_gbp)}</td><td>${parentSalesCell(x)}</td><td>${variantCell(x)}</td><td>${x.rating??'—'} / ${fmt(x.review_count)}</td><td>${tagCell(x)}</td></tr>`}).join(''):'<tr><td colspan="11" class="empty">当前筛选条件下暂无异动。</td></tr>';
  bindImgs();rewriteTableHeaders();
};

renderDetailMid=function(d){
  sanitizeData(d);ensureEnhancementUI();refreshTypeOptions(d);
  const all=d.products.filter(x=>x.category_rank>=200&&x.category_rank<=400),counts={P0:0,P1:0,P2:0,P3:0};all.forEach(x=>counts[midPriority(d,x)]++);
  let rows=all.filter(x=>{const p=midPriority(d,x);if(MID_FILTER.priority!=='all'&&p!==MID_FILTER.priority)return false;if(MID_FILTER.type&&x.product_type!==MID_FILTER.type)return false;if(MID_FILTER.term&&!`${x.asin} ${x.title||''} ${x.brand||''}`.toLowerCase().includes(MID_FILTER.term))return false;return true});
  rows.sort((a,b)=>{if(MID_FILTER.sort==='rank')return (a.category_rank??999999)-(b.category_rank??999999);if(MID_FILTER.sort==='sales')return (b.parent_sales_estimate??-1)-(a.parent_sales_estimate??-1);if(MID_FILTER.sort==='newest')return (a.days_since_launch??999999)-(b.days_since_launch??999999);if(MID_FILTER.sort==='variants')return (b.variant_count??-1)-(a.variant_count??-1);return (rankDiff(d,b).delta??-999999)-(rankDiff(d,a).delta??-999999)});
  $('detailMidCount').textContent=`${rows.length} / ${all.length} 个ASIN`;
  $('detailMidPriority').innerHTML=['P0','P1','P2','P3'].map((p,i)=>`<article class="priority-card p${i}"><span>${['P0快速前移≥50','P1前移20–49','P2前移1–19','P3持平/后退'][i]}</span><b>${counts[p]}</b></article>`).join('');
  $('detailMidRows').innerHTML=rows.length?rows.map(x=>{const rd=rankDiff(d,x),pr=midPriority(d,x);const judge=pr==='P0'?'优先核查连续突破':pr==='P1'?'重点持续观察':pr==='P2'?'前移观察':'常规观察';return `<tr><td>${productCell(x)}</td><td>${priorityBadge(pr)}</td><td class="rank">#${fmt(x.category_rank)}</td><td>${rd.old==null?'—':'#'+fmt(rd.old)}</td><td>${moveCell(d,x)}</td><td>${rankHistory(d,x)}</td><td>${money(x.price_gbp)}</td><td>${parentSalesCell(x)}</td><td>${fmt(x.days_since_launch)}</td><td>${variantCell(x)}</td><td>${judge}</td></tr>`}).join(''):'<tr><td colspan="11" class="empty">当前筛选条件下暂无 #200–400 商品。</td></tr>';
  bindImgs();rewriteTableHeaders();
};

renderQuality=function(){
  const fill=(id,timeId,d)=>{if(!d)return;$(timeId).textContent=`最近采集 ${when(d.latest.collected_at)}`;const coverage=pct(d.products.filter(x=>x.parent_sales_estimate!=null).length,d.products.length);$(id).innerHTML=`<div><span>父体销量覆盖率</span><b>${coverage.toFixed(1)}%</b></div><div><span>主图覆盖率</span><b>${d.metrics.imageCoverage.toFixed(1)}%</b></div><div><span>评论覆盖率</span><b>${d.metrics.reviewCoverage.toFixed(1)}%</b></div><div><span>不同BSR位置</span><b>${d.metrics.topDistinct}</b></div>`};
  fill('bQuality','bQualityTime',STORE.party_balloons);if(STORE.party_packs){$('pQuality').className='mini-metrics quality-mini';fill('pQuality','pQualityTime',STORE.party_packs)}
};

rewriteTableHeaders();

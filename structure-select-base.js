let STRUCTURE_DIM='product_type';
const STRUCTURE_DIM_LABELS={product_type:'产品类型',colour_style:'颜色风格',pack_size:'数量规格',size_text:'尺寸',occasion:'场景',theme:'主题',age:'年龄',material:'材质'};
const STRUCTURE_FIELDS=['product_type','colour_style','pack_size','size_text','occasion','theme','age','material'];
const CHANGE_FILTER={term:'',type:'',priority:'all'};
const MID_FILTER={term:'',type:'',priority:'all',sort:'move'};

/* 低价值老链接过滤：三项必须同时满足才排除。未知销量/未知上架天数不排除。 */
function isLowValueOldListing(x){
  return Number(x?.days_since_launch)>365 && Number(x?.category_rank)>300 && x?.sales_estimate!=null && Number(x.sales_estimate)<300;
}
function sanitizeData(d){
  if(!d||d.__lowValueFiltered)return d;
  d.__lowValueFiltered=true;
  d.rawProductCount=d.products.length;
  d.excludedOldLowValue=d.products.filter(isLowValueOldListing).length;
  /* 保留原始 prevMap / prev2Map 给三轮排名和排名变化使用；结构基线使用过滤后的历史样本。 */
  d.products=d.products.filter(x=>!isLowValueOldListing(x));
  d.prevProducts=d.prevProducts.filter(x=>!isLowValueOldListing(x));
  d.prev2Products=d.prev2Products.filter(x=>!isLowValueOldListing(x));
  d.metrics=calcMetrics(d);
  d.structureDerived=deriveStructures(d);
  return d;
}
function sanitizeStore(){sanitizeData(STORE?.party_balloons);sanitizeData(STORE?.party_packs)}

function ensureEnhancementUI(){
  const sw=document.getElementById('detailStructDimSwitch');
  if(sw){
    if(!sw.querySelector('[data-dim="theme"]')) sw.insertAdjacentHTML('beforeend','<button data-dim="theme">主题</button>');
    if(!sw.querySelector('[data-dim="age"]')) sw.insertAdjacentHTML('beforeend','<button data-dim="age">年龄</button>');
  }
  const changes=document.getElementById('detailChanges');
  if(changes && !document.getElementById('detailChangeFilters')){
    const grid=changes.querySelector('#detailPriority');
    grid?.insertAdjacentHTML('afterend',`<div id="detailChangeFilters" class="detail-filters">
      <input id="detailChangeSearch" placeholder="搜索 ASIN / 标题 / 品牌">
      <select id="detailChangeType"><option value="">全部产品类型</option></select>
      <select id="detailChangePriority"><option value="all">全部优先级</option><option value="P0">P0关键突破</option><option value="P1">P1强异动</option><option value="P2">P2明显异动</option><option value="P3">P3一般波动</option></select>
    </div>`);
  }
  const mid=document.getElementById('detailMid');
  if(mid && !document.getElementById('detailMidFilters')){
    const grid=mid.querySelector('#detailMidPriority');
    grid?.insertAdjacentHTML('afterend',`<div id="detailMidFilters" class="detail-filters">
      <input id="detailMidSearch" placeholder="搜索 ASIN / 标题 / 品牌">
      <select id="detailMidType"><option value="">全部产品类型</option></select>
      <select id="detailMidPriorityFilter"><option value="all">全部优先级</option><option value="P0">P0快速前移≥50</option><option value="P1">P1前移20–49</option><option value="P2">P2前移1–19</option><option value="P3">P3持平/后退</option></select>
      <select id="detailMidSort"><option value="move">优先：排名前移</option><option value="rank">优先：当前排名</option><option value="sales">优先：销量</option><option value="newest">优先：上架较新</option><option value="variants">优先：变体数量</option></select>
    </div>`);
  }
  rewriteTableHeaders();
  bindEnhancementEvents();
}
function rewriteTableHeaders(){
  const market=document.querySelector('#marketTopRows')?.closest('table')?.querySelector('thead tr');
  if(market)market.innerHTML='<th>类目</th><th>商品</th><th>当前排名</th><th>本轮变化</th><th>上架天数</th><th>变体数量</th><th>评论</th><th>销量</th><th>值得看原因</th>';
  const top=document.querySelector('#detailTopRows')?.closest('table')?.querySelector('thead tr');
  if(top)top.innerHTML='<th>商品</th><th>机会类型</th><th>当前排名</th><th>本轮变化</th><th>近三轮排名</th><th>上架天数</th><th>变体数量</th><th>评论</th><th>销量</th><th>原因</th>';
  const changes=document.querySelector('#detailChangeRows')?.closest('table')?.querySelector('thead tr');
  if(changes)changes.innerHTML='<th>商品</th><th>优先级</th><th>当前排名</th><th>上次排名</th><th>变化</th><th>近三轮排名</th><th>价格</th><th>销量</th><th>变体数量</th><th>评分/评论</th><th>标签</th>';
  const mid=document.querySelector('#detailMidRows')?.closest('table')?.querySelector('thead tr');
  if(mid)mid.innerHTML='<th>商品</th><th>优先级</th><th>当前排名</th><th>上次排名</th><th>前移</th><th>近三轮排名</th><th>价格</th><th>销量</th><th>上架天数</th><th>变体数量</th><th>判断</th>';
  const struct=document.querySelector('#detailStructRows')?.closest('table')?.querySelector('thead tr');
  if(struct)struct.innerHTML='<th>标签</th><th>数量</th><th>当前占比</th><th>前2轮均值</th><th>变化</th><th>三轮走势</th>';
}
function bindEnhancementEvents(){
  const sw=document.getElementById('detailStructDimSwitch');
  if(sw && !sw.dataset.enhBound){sw.dataset.enhBound='1';sw.addEventListener('click',e=>{const b=e.target.closest('button[data-dim]');if(b)setStructureDim(b.dataset.dim);});}
  const cs=document.getElementById('detailChangeSearch');if(cs&&!cs.dataset.b){cs.dataset.b='1';cs.addEventListener('input',()=>{CHANGE_FILTER.term=cs.value.trim().toLowerCase();rerenderChanges()})}
  const ct=document.getElementById('detailChangeType');if(ct&&!ct.dataset.b){ct.dataset.b='1';ct.addEventListener('change',()=>{CHANGE_FILTER.type=ct.value;rerenderChanges()})}
  const cp=document.getElementById('detailChangePriority');if(cp&&!cp.dataset.b){cp.dataset.b='1';cp.addEventListener('change',()=>{CHANGE_FILTER.priority=cp.value;rerenderChanges()})}
  const ms=document.getElementById('detailMidSearch');if(ms&&!ms.dataset.b){ms.dataset.b='1';ms.addEventListener('input',()=>{MID_FILTER.term=ms.value.trim().toLowerCase();rerenderMid()})}
  const mt=document.getElementById('detailMidType');if(mt&&!mt.dataset.b){mt.dataset.b='1';mt.addEventListener('change',()=>{MID_FILTER.type=mt.value;rerenderMid()})}
  const mp=document.getElementById('detailMidPriorityFilter');if(mp&&!mp.dataset.b){mp.dataset.b='1';mp.addEventListener('change',()=>{MID_FILTER.priority=mp.value;rerenderMid()})}
  const msort=document.getElementById('detailMidSort');if(msort&&!msort.dataset.b){msort.dataset.b='1';msort.addEventListener('change',()=>{MID_FILTER.sort=msort.value;rerenderMid()})}
}
function rerenderChanges(){const d=STORE?.[activeKey];if(d)renderDetailChanges(d)}
function rerenderMid(){const d=STORE?.[activeKey];if(d)renderDetailMid(d)}
function refreshTypeOptions(d){
  const types=[...new Set(d.products.map(x=>x.product_type).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'zh-CN'));
  for(const [id,current] of [['detailChangeType',CHANGE_FILTER.type],['detailMidType',MID_FILTER.type]]){const s=document.getElementById(id);if(!s)continue;s.innerHTML='<option value="">全部产品类型</option>'+types.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');s.value=current;}
}
function variantCell(x){return x?.variant_count==null?'<span class="flat">—</span>':`<b>${fmt(x.variant_count)}</b>`}
function rankHistory(data,x){
  const r2=data.prev2Map?.get(x.asin)?.category_rank??null,r1=data.prevMap?.get(x.asin)?.category_rank??x.previous_rank??null,r0=x.category_rank??null;
  const cell=v=>v==null?'—':'#'+fmt(v);return `<span class="rank-history"><span>${cell(r2)}</span><i>→</i><span>${cell(r1)}</span><i>→</i><strong>${cell(r0)}</strong></span>`;
}

function birthdayContext(x){return /birthday|bday|生日/i.test(`${x.title||''} ${x.occasion||''}`)}
function extractAgeLabels(x){
  const raw=`${x.title||''} ${x.occasion||''}`;if(!birthdayContext(x))return[];const s=raw.replace(/[–—]/g,'-'),ages=new Set();
  const ps=[/\b(\d{1,3})(?:st|nd|rd|th)\s+(?:birthday|bday)\b/ig,/\b(?:birthday|bday)\s+(?:party\s+)?(?:decorations?\s+)?(?:for\s+)?(?:age\s*)?(\d{1,3})(?:st|nd|rd|th)?\b/ig,/\bage\s*[:#-]?\s*(\d{1,3})\b/ig,/\b(\d{1,3})\s*(?:years?\s*old|year-old|yo)\b/ig];
  for(const re of ps){let m;while((m=re.exec(s))){const n=Number(m[1]);if(n>=1&&n<=120)ages.add(n)}}return[...ages].sort((a,b)=>a-b).map(n=>`${n}岁`);
}
function extractThemes(x){
  const t=`${x.title||''} ${x.occasion||''}`.toLowerCase(),tags=new Set(),ages=extractAgeLabels(x);if(/birthday|bday|生日/.test(t)){tags.add('生日');for(const a of ages)tags.add(`${a}生日`)}
  const rules=[['Baby Shower',/baby shower/],['Gender Reveal',/gender reveal/],['婚礼',/wedding/],['Hen Party',/hen party|bachelorette/],['Bridal Shower',/bridal shower/],['毕业',/graduation/],['周年',/anniversary/],['订婚',/engagement/],['圣诞',/christmas/],['新年',/new year/],['万圣节',/halloween/],['彩虹',/rainbow/],['公主',/princess/],['恐龙',/dinosaur|dino\b/],['独角兽',/unicorn/],['足球',/football|soccer/],['赛车',/racing|race car|formula\s*1|f1\b/],['游戏',/gaming|gamer|video game/],['太空',/space|astronaut|galaxy/],['海盗',/pirate/],['美人鱼',/mermaid/],['丛林/野生动物',/jungle|safari|wild animal/],['蝴蝶',/butterfl/],['农场',/farm|barnyard/],['工程车',/construction|digger|excavator/],['马戏团',/circus/],['迪斯科',/disco/],['复古',/retro|vintage/],['波西米亚',/boho|bohemian/]];for(const [label,re] of rules)if(re.test(t))tags.add(label);if(!tags.size&&/party/.test(t))tags.add('通用派对');return[...tags];
}
function dimTags(x,dim){if(dim==='theme')return extractThemes(x);if(dim==='age')return extractAgeLabels(x);return splitTags(x?.[dim])}
function dimBaseProducts(list,dim){return dim==='age'?list.filter(birthdayContext):list}
function deriveDimensionRows(data,dim){
  const sets=[data.products||[],data.prevProducts||[],data.prev2Products||[]],bases=sets.map(list=>dimBaseProducts(list,dim));
  const maps=bases.map(list=>{const m=new Map();for(const x of list)for(const tag of dimTags(x,dim))m.set(tag,(m.get(tag)||0)+1);return m});const labels=new Set([...maps[0].keys(),...maps[1].keys(),...maps[2].keys()]),rows=[];
  for(const label of labels){const counts=maps.map(m=>m.get(label)||0),shares=counts.map((n,i)=>pct(n,bases[i].length)),baseline=(shares[1]+shares[2])/2;rows.push({label,count:counts[0],share:shares[0],prevShare:shares[1],prev2Share:shares[2],baseline,delta:shares[0]-baseline,newAppear:counts[0]>0&&counts[1]===0&&counts[2]===0})}return rows;
}
function structureTrendCell(x){return `<span class="share-history"><span>${x.prev2Share.toFixed(1)}%</span><i>→</i><span>${x.prevShare.toFixed(1)}%</span><i>→</i><strong>${x.share.toFixed(1)}%</strong></span>`}
function setStructureDim(dim){if(!STRUCTURE_FIELDS.includes(dim))dim='product_type';STRUCTURE_DIM=dim;document.querySelectorAll('#detailStructDimSwitch button').forEach(b=>b.classList.toggle('active',b.dataset.dim===dim));const d=STORE?.[activeKey];if(d)renderDetailStructure(d)}
renderDetailStructure=function(d){
  sanitizeData(d);ensureEnhancementUI();const r=deriveDimensionRows(d,STRUCTURE_DIM),growth=r.filter(x=>x.delta>0).sort((a,b)=>b.delta-a.delta).slice(0,5),drop=r.filter(x=>x.delta<0).sort((a,b)=>a.delta-b.delta).slice(0,5),main=r.filter(x=>x.count>0).sort((a,b)=>b.share-a.share).slice(0,5),fresh=r.filter(x=>x.newAppear).sort((a,b)=>b.share-a.share).slice(0,5),dimLabel=STRUCTURE_DIM_LABELS[STRUCTURE_DIM]||STRUCTURE_DIM;
  const block=(title,arr)=>`<article class="structure-card"><div class="dimension-tag">${dimLabel}</div><h3>${title}</h3><div class="struct-list">${arr.length?arr.map(x=>`<div class="struct-line"><span>${esc(x.label)}</span><b class="${x.delta>=0?'pos':'neg'}">${x.delta>=0?'+':''}${x.delta.toFixed(1)}pct</b></div>`).join(''):'<div class="pending-text">暂无明显信号</div>'}</div></article>`;
  $('detailStructCards').innerHTML=block('🔥 快速增长',growth)+block('↓ 快速下降',drop)+block('★ 当前主流',main)+block('✦ 新出现',fresh);const hint=$('detailStructHint');if(hint)hint.innerHTML=`当前查看：<span class="structure-current-label">${dimLabel}</span> · 共 ${r.filter(x=>x.count>0).length} 个标签${STRUCTURE_DIM==='age'?' · 以生日主题商品为母体':''}`;
  const visible=r.filter(x=>x.count>0||x.delta<0).sort((a,b)=>b.share-a.share||b.delta-a.delta);$('detailStructRows').innerHTML=visible.length?visible.slice(0,100).map(x=>`<tr><td>${esc(x.label)}</td><td>${x.count}</td><td>${x.share.toFixed(1)}%</td><td>${x.baseline.toFixed(1)}%</td><td class="${x.delta>=0?'up':'down'}">${x.delta>=0?'+':''}${x.delta.toFixed(1)}pct</td><td>${structureTrendCell(x)}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">当前维度暂无结构数据。</td></tr>';
};

function directOpportunityOrder(d,a,b){
  const pa=priority(d,a),pb=priority(d,b),order={P0:0,P1:1,P2:2,P3:3};if(order[pa]!==order[pb])return order[pa]-order[pb];
  const da=rankDiff(d,a).delta??-999999,db=rankDiff(d,b).delta??-999999;if(db!==da)return db-da;
  if((a.category_rank??999999)!==(b.category_rank??999999))return (a.category_rank??999999)-(b.category_rank??999999);
  return (b.sales_estimate??-1)-(a.sales_estimate??-1);
}
renderMarketTop=function(){
  sanitizeStore();let rows=[];for(const d of [STORE.party_balloons,STORE.party_packs].filter(Boolean))rows.push(...d.products.map(x=>({d,x})));rows.sort((a,b)=>directOpportunityOrder(a.d,a.x,b.x));
  /* 跨类目排序先按P级，再按排名前移；同级时优先当前排名和销量。 */
  rows.sort((a,b)=>{const oa={P0:0,P1:1,P2:2,P3:3},pa=priority(a.d,a.x),pb=priority(b.d,b.x);if(oa[pa]!==oa[pb])return oa[pa]-oa[pb];const da=rankDiff(a.d,a.x).delta??-999999,db=rankDiff(b.d,b.x).delta??-999999;if(db!==da)return db-da;return (a.x.category_rank??999999)-(b.x.category_rank??999999)});rows=rows.slice(0,10);
  $('marketTopNote').textContent=STORE.party_packs?'双类目按P级与排名动能排序':'当前仅 Party Balloons';$('marketTopRows').innerHTML=rows.length?rows.map(o=>`<tr><td>${categoryTag(o.d.key)}</td><td>${productCell(o.x)}</td><td class="rank">#${fmt(o.x.category_rank)}</td><td>${moveCell(o.d,o.x)}</td><td>${fmt(o.x.days_since_launch)}</td><td>${variantCell(o.x)}</td><td>${fmt(o.x.review_count)}</td><td>${fmt(o.x.sales_estimate)}</td><td>${esc(opportunityReason(o.d,o.x))}</td></tr>`).join(''):'<tr><td colspan="9" class="empty">暂无数据。</td></tr>';bindImgs();
};
renderDetailTop=function(d){
  sanitizeData(d);ensureEnhancementUI();refreshTypeOptions(d);let rows=[...d.products].sort((a,b)=>directOpportunityOrder(d,a,b)).slice(0,10);$('detailTopNote').textContent=`从 ${d.products.length} 个有效ASIN筛选${d.excludedOldLowValue?` · 已排除 ${d.excludedOldLowValue} 个低价值老链接`:''}`;
  $('detailTopRows').innerHTML=rows.length?rows.map(x=>`<tr><td>${productCell(x)}</td><td>${opportunityType(d,x)}</td><td class="rank">#${fmt(x.category_rank)}</td><td>${moveCell(d,x)}</td><td>${rankHistory(d,x)}</td><td>${fmt(x.days_since_launch)}</td><td>${variantCell(x)}</td><td>${fmt(x.review_count)}</td><td>${fmt(x.sales_estimate)}</td><td>${esc(opportunityReason(d,x))}</td></tr>`).join(''):'<tr><td colspan="10" class="empty">暂无符合条件的商品。</td></tr>';bindImgs();
};
renderDetailChanges=function(d){
  sanitizeData(d);ensureEnhancementUI();refreshTypeOptions(d);const all=d.products.filter(x=>{const rd=rankDiff(d,x);return Math.abs(rd.delta||0)>=20||(x.category_rank<=100&&rd.old!=null&&rd.old>100)}),counts={P0:0,P1:0,P2:0,P3:0};all.forEach(x=>counts[priority(d,x)]++);
  let rows=all.filter(x=>{const p=priority(d,x);if(CHANGE_FILTER.priority!=='all'&&p!==CHANGE_FILTER.priority)return false;if(CHANGE_FILTER.type&&x.product_type!==CHANGE_FILTER.type)return false;if(CHANGE_FILTER.term&&!`${x.asin} ${x.title||''} ${x.brand||''}`.toLowerCase().includes(CHANGE_FILTER.term))return false;return true}).sort((a,b)=>directOpportunityOrder(d,a,b));
  $('detailChangeCount').textContent=`${rows.length} / ${all.length} 个异动ASIN`;$('detailPriority').innerHTML=['P0','P1','P2','P3'].map((p,i)=>`<article class="priority-card p${i}"><span>${p}${['关键突破','强异动','明显异动','一般波动'][i]}</span><b>${counts[p]}</b></article>`).join('');
  $('detailChangeRows').innerHTML=rows.length?rows.slice(0,150).map(x=>{const rd=rankDiff(d,x),p=priority(d,x);return `<tr><td>${productCell(x)}</td><td>${priorityBadge(p)}</td><td class="rank">#${fmt(x.category_rank)}</td><td>${rd.old==null?'—':'#'+fmt(rd.old)}</td><td>${moveCell(d,x)}</td><td>${rankHistory(d,x)}</td><td>${money(x.price_gbp)}</td><td>${fmt(x.sales_estimate)}</td><td>${variantCell(x)}</td><td>${x.rating??'—'} / ${fmt(x.review_count)}</td><td>${tagCell(x)}</td></tr>`}).join(''):'<tr><td colspan="11" class="empty">当前筛选条件下暂无异动。</td></tr>';bindImgs();
};
function midPriority(data,x){const delta=rankDiff(data,x).delta||0;return delta>=50?'P0':delta>=20?'P1':delta>0?'P2':'P3'}
renderDetailMid=function(d){
  sanitizeData(d);ensureEnhancementUI();refreshTypeOptions(d);const all=d.products.filter(x=>x.category_rank>=200&&x.category_rank<=400),counts={P0:0,P1:0,P2:0,P3:0};all.forEach(x=>counts[midPriority(d,x)]++);
  let rows=all.filter(x=>{const p=midPriority(d,x);if(MID_FILTER.priority!=='all'&&p!==MID_FILTER.priority)return false;if(MID_FILTER.type&&x.product_type!==MID_FILTER.type)return false;if(MID_FILTER.term&&!`${x.asin} ${x.title||''} ${x.brand||''}`.toLowerCase().includes(MID_FILTER.term))return false;return true});
  rows.sort((a,b)=>{if(MID_FILTER.sort==='rank')return (a.category_rank??999999)-(b.category_rank??999999);if(MID_FILTER.sort==='sales')return (b.sales_estimate??-1)-(a.sales_estimate??-1);if(MID_FILTER.sort==='newest')return (a.days_since_launch??999999)-(b.days_since_launch??999999);if(MID_FILTER.sort==='variants')return (b.variant_count??-1)-(a.variant_count??-1);return (rankDiff(d,b).delta??-999999)-(rankDiff(d,a).delta??-999999)});
  $('detailMidCount').textContent=`${rows.length} / ${all.length} 个ASIN`;$('detailMidPriority').innerHTML=['P0','P1','P2','P3'].map((p,i)=>`<article class="priority-card p${i}"><span>${['P0快速前移≥50','P1前移20–49','P2前移1–19','P3持平/后退'][i]}</span><b>${counts[p]}</b></article>`).join('');
  $('detailMidRows').innerHTML=rows.length?rows.map(x=>{const rd=rankDiff(d,x),pr=midPriority(d,x);const judge=pr==='P0'?'优先核查连续突破':pr==='P1'?'重点持续观察':pr==='P2'?'前移观察':'常规观察';return `<tr><td>${productCell(x)}</td><td>${priorityBadge(pr)}</td><td class="rank">#${fmt(x.category_rank)}</td><td>${rd.old==null?'—':'#'+fmt(rd.old)}</td><td>${moveCell(d,x)}</td><td>${rankHistory(d,x)}</td><td>${money(x.price_gbp)}</td><td>${fmt(x.sales_estimate)}</td><td>${fmt(x.days_since_launch)}</td><td>${variantCell(x)}</td><td>${judge}</td></tr>`}).join(''):'<tr><td colspan="11" class="empty">当前筛选条件下暂无 #200–400 商品。</td></tr>';bindImgs();
};

/* 第一次异步 load 完成时会调用这里，因此先过滤再让原双类目总览计算和渲染。 */
const __baseRenderDual=renderDual;
renderDual=function(){sanitizeStore();ensureEnhancementUI();__baseRenderDual();rewriteTableHeaders()};

(function initEnhancedUI(){ensureEnhancementUI();setStructureDim('product_type');document.querySelectorAll('.category-tabs button').forEach(b=>{if(!b.dataset.enhCat){b.dataset.enhCat='1';b.addEventListener('click',()=>{if(b.dataset.category!=='compare')setTimeout(()=>{const d=STORE?.[b.dataset.category];if(d){sanitizeData(d);refreshTypeOptions(d);renderDetailStructure(d);rewriteTableHeaders()}},0)})}})})();

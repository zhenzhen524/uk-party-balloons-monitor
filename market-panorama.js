/* Market panorama + product-development summary for Party Balloons / Party Packs detail pages. */
(function(){
  const compact=n=>{
    if(n==null||!Number.isFinite(Number(n)))return '—';
    const v=Number(n),a=Math.abs(v);
    if(a>=1000000)return (v/1000000).toFixed(a>=10000000?1:2).replace(/\.0+$/,'')+'M';
    if(a>=1000)return (v/1000).toFixed(a>=100000?0:1).replace(/\.0$/,'')+'K';
    return Math.round(v).toLocaleString('en-GB');
  };
  const gbpCompact=n=>n==null||!Number.isFinite(Number(n))?'—':'£'+compact(Number(n));
  const norm=s=>String(s||'未知品牌').trim().toLowerCase();
  const med=a=>{
    const x=a.filter(v=>v!=null&&Number.isFinite(Number(v))).map(Number).sort((a,b)=>a-b);
    if(!x.length)return null;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2;
  };

  function parentKey(x){
    if(x.parent_asin)return 'asin:'+x.parent_asin;
    /* Current collector does not yet populate parent_asin. Variants under one parent normally share brand, BSR, parent sales and variant count. */
    return ['heur',norm(x.brand),x.category_rank??'na',x.parent_sales_estimate??'na',x.variant_count??'na'].join('|');
  }
  function buildParentGroups(products){
    const m=new Map();
    for(const x of products){
      const k=parentKey(x);let g=m.get(k);
      if(!g){g={key:k,brand:x.brand||'未知品牌',rank:x.category_rank??null,parentSales:null,revenues:[],prices:[],items:[],hasRealParent:!!x.parent_asin};m.set(k,g)}
      g.items.push(x);
      if(x.category_rank!=null&&(g.rank==null||x.category_rank<g.rank))g.rank=x.category_rank;
      if(x.parent_sales_estimate!=null&&Number.isFinite(Number(x.parent_sales_estimate)))g.parentSales=Math.max(g.parentSales??-Infinity,Number(x.parent_sales_estimate));
      if(x.sales_revenue_gbp!=null&&Number.isFinite(Number(x.sales_revenue_gbp)))g.revenues.push(Number(x.sales_revenue_gbp));
      if(x.price_gbp!=null&&Number.isFinite(Number(x.price_gbp)))g.prices.push(Number(x.price_gbp));
    }
    return [...m.values()].map(g=>{
      g.revenue=med(g.revenues);
      if(g.revenue==null&&g.parentSales!=null){const p=med(g.prices);if(p!=null)g.revenue=g.parentSales*p;}
      return g;
    });
  }
  function panorama(data){
    sanitizeData(data);
    const groups=buildParentGroups(data.products),knownSales=groups.filter(g=>g.parentSales!=null),knownRevenue=groups.filter(g=>g.revenue!=null);
    const totalSales=knownSales.reduce((s,g)=>s+g.parentSales,0),totalRevenue=knownRevenue.reduce((s,g)=>s+g.revenue,0);
    const brand=new Map();
    for(const g of knownSales){if(!g.brand||g.brand==='未知品牌')continue;const k=norm(g.brand),o=brand.get(k)||{name:g.brand,sales:0};o.sales+=g.parentSales;brand.set(k,o)}
    const brands=[...brand.values()].sort((a,b)=>b.sales-a.sales).map(x=>({...x,share:totalSales?pct(x.sales,totalSales):0}));
    const top3=brands.slice(0,3),cr3=top3.reduce((s,x)=>s+x.share,0),top1=top3[0]||null;
    const topSales=knownSales.filter(g=>g.rank!=null&&g.rank<=100).reduce((s,g)=>s+g.parentSales,0);
    return {
      groups,totalSales,totalRevenue,parentCount:groups.length,
      salesCoverage:pct(knownSales.length,Math.max(1,groups.length)),revenueCoverage:pct(knownRevenue.length,Math.max(1,groups.length)),
      top1,top3,cr3,top100SalesShare:totalSales?pct(topSales,totalSales):0,
      priceMedian:med(data.products.map(x=>x.price_gbp)),youngTopShare:data.metrics?.youngShare??0
    };
  }

  function trendText(data,x){
    const r2=data.prev2Map?.get(x.asin)?.category_rank??null,r1=data.prevMap?.get(x.asin)?.category_rank??x.previous_rank??null,r0=x.category_rank??null;
    return [r2,r1,r0].map(v=>v==null?'—':'#'+fmt(v)).join(' → ');
  }
  function developmentOrder(data,a,b){
    const pri={P0:0,P1:1,P2:2,P3:3},pa=priority(data,a),pb=priority(data,b);
    const aYoung=a.days_since_launch!=null&&a.days_since_launch<=365,bYoung=b.days_since_launch!=null&&b.days_since_launch<=365;
    if(aYoung!==bYoung)return aYoung?-1:1;
    if(pri[pa]!==pri[pb])return pri[pa]-pri[pb];
    const da=rankDiff(data,a).delta??-999999,db=rankDiff(data,b).delta??-999999;if(db!==da)return db-da;
    const ar=a.category_rank??999999,br=b.category_rank??999999;if(ar!==br)return ar-br;
    return (b.parent_sales_estimate??-1)-(a.parent_sales_estimate??-1);
  }
  function devSuggestion(x,theme,age){
    const style=x.colour_style?String(x.colour_style).split(/[\/|,;]/)[0]:'';
    const type=x.product_type||'当前产品形态';
    if(age)return `开发上优先验证${age}及相邻年龄段的系列化需求，保留已验证的${style||'视觉'}方向，但不要只换数字，重点通过组件组合、安装效率和拍照呈现建立差异。`;
    if(/arch|garland|kit|set|套装|拱门|花环/i.test(type))return `开发上建议复制它的“场景完整解决方案”逻辑，而不是照搬款式，重点从组件结构、安装便利、颜色层级和可拍照性做下一代差异化。`;
    if(theme&&theme!=='通用派对')return `开发上优先围绕“${theme}”验证相邻人群和场景扩展，并在颜色、数量规格与产品形态上形成明显区隔，避免只做图案替换。`;
    return '开发上优先复制其需求逻辑而非外观，继续验证产品形态、颜色体系、数量规格与使用场景中哪一项真正驱动排名和父体销量。';
  }
  function developmentSummary(data){
    sanitizeData(data);
    const pool=data.products.filter(x=>x.title&&x.category_rank!=null);
    if(!pool.length)return '当前有效样本不足，暂不生成产品开发结论。';
    const x=[...pool].sort((a,b)=>developmentOrder(data,a,b))[0],themes=typeof extractThemes==='function'?extractThemes(x):[],ages=typeof extractAgeLabels==='function'?extractAgeLabels(x):[];
    const specificTheme=themes.find(t=>t!=='生日'&&!/岁生日$/.test(t))||themes.find(t=>/岁生日$/.test(t))||themes[0]||x.occasion||'通用派对';
    const age=ages[0]||'';
    const type=x.product_type||'未识别产品形态',style=x.colour_style?`，${x.colour_style}`:'',pack=x.pack_size?`，${x.pack_size}`:'',sales=x.parent_sales_estimate==null?'父体销量待补':'父体销量 '+fmt(x.parent_sales_estimate);
    const move=rankDiff(data,x).delta;
    const signal=move!=null&&move>0?`本轮前移 ${fmt(move)} 位`:x.category_rank<=100?'当前位于头部':'当前需要持续观察';
    return `最值得关注的是 ${x.brand||'未知品牌'} 的 ${x.asin}：${type}，主题为${specificTheme}${age?'（'+age+'）':''}${style}${pack}，近三轮排名 ${trendText(data,x)}，${sales}，${signal}；${devSuggestion(x,specificTheme,age)}`;
  }

  function ensurePanoramaHead(){
    const k=$('detailKpis');if(!k)return;
    if(!$('marketPanoramaHead'))k.insertAdjacentHTML('beforebegin','<div id="marketPanoramaHead" class="section-head market-panorama-head"><div><h2>市场全景</h2><p>基于今日有效样本；父体销量、销售额和品牌份额按父体去重口径计算。</p></div><div id="marketPanoramaNote" class="section-side">—</div></div>');
    if(!$('marketPanoramaStyle')){
      const s=document.createElement('style');s.id='marketPanoramaStyle';s.textContent='.market-panorama-head{margin:14px 0 10px}.market-panorama-head h2{margin:0 0 4px}.market-panorama-head p{margin:0;color:#667085;font-size:12px}.metric-value.brand-name{font-size:20px;line-height:1.2}.metric-note.brand-list{line-height:1.45}.summary-kicker.dev-kicker{color:#245dd8;font-weight:800}';document.head.appendChild(s);
    }
  }
  function renderPanorama(data){
    const p=panorama(data);ensurePanoramaHead();
    const top3Text=p.top3.length?p.top3.map(x=>`${x.name} ${x.share.toFixed(1)}%`).join(' · '):'父体销量数据不足';
    const cards=[
      ['父体销量总量',compact(p.totalSales),`父体去重估算 · 覆盖 ${p.salesCoverage.toFixed(1)}%`,''],
      ['父体销售额总量',gbpCompact(p.totalRevenue),`父体去重估算 · 覆盖 ${p.revenueCoverage.toFixed(1)}%`,''],
      ['有效父体数',fmt(p.parentCount),'按父体特征去重估算',''],
      ['价格中位数',p.priceMedian==null?'—':money(p.priceMedian),'当前有效样本',''],
      ['TOP1品牌',p.top1?p.top1.name:'—',p.top1?`${p.top1.share.toFixed(1)}% · 父体销量 ${compact(p.top1.sales)}`:'父体销量数据不足','brand-name'],
      ['TOP3品牌集中度',p.top3.length?p.cr3.toFixed(1)+'%':'—',top3Text,''],
      ['Top100新品占比',p.youngTopShare.toFixed(1)+'%','≤180天新品 / Top100样本',''],
      ['Top100父体销量占比',p.top100SalesShare.toFixed(1)+'%','衡量头部销量集中度','']
    ];
    $('detailKpis').innerHTML=cards.map((x,i)=>`<article class="metric-card ${i===0?'accent-blue':''}"><div class="metric-label">${esc(x[0])}</div><div class="metric-value ${x[3]||''}">${esc(x[1])}</div><div class="metric-note ${i===5?'brand-list':''}">${esc(x[2])}</div></article>`).join('');
    const note=$('marketPanoramaNote');if(note)note.textContent=data.products.some(x=>x.parent_asin)?'父体ASIN精确去重':'父体ASIN待采集 · 当前按父体特征去重估算';
    const kicker=document.querySelector('#detailSummary .summary-kicker');if(kicker){kicker.textContent='产品开发结论';kicker.classList.add('dev-kicker')}
    $('detailSummaryText').textContent=developmentSummary(data);
  }

  const baseRenderDetail=renderDetail;
  renderDetail=function(key){
    baseRenderDetail(key);
    const d=STORE?.[key];if(d)renderPanorama(d);
  };
})();

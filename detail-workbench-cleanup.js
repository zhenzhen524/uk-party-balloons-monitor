/* Remove duplicated market panorama from single-category pages and turn them into development workbenches. */
(function(){
  function apply(key){
    const head=document.getElementById('marketPanoramaHead');
    const kpis=document.getElementById('detailKpis');
    if(head)head.style.display='none';
    if(kpis)kpis.style.display='none';

    const firstTab=document.querySelector('.detail-tabs button[data-detail="detailOverview"]');
    if(firstTab)firstTab.textContent='开发总览';

    const title=document.getElementById('detailTitle');
    const sub=document.getElementById('detailSubtitle');
    const name=key==='party_packs'?'Party Packs':'Party Balloons';
    if(title)title.textContent=`${name} 产品开发工作台`;
    if(sub)sub.textContent='聚焦产品开发结论、异动 ASIN、结构变化、#200–400 潜力与历史趋势；市场规模与品牌份额统一在“双类目总览”查看。';

    const radarTitle=document.querySelector('#detailOverview .section-block .section-head h2');
    const radarDesc=document.querySelector('#detailOverview .section-block .section-head p');
    if(radarTitle)radarTitle.textContent='今日开发信号';
    if(radarDesc)radarDesc.textContent='观察排名动能、新品进入、价格带与产品结构变化，辅助确定下一步开发研究方向。';

    const blocks=[...document.querySelectorAll('#detailOverview .section-block')];
    const topBlock=blocks.find(sec=>sec.querySelector('#detailTopRows'));
    if(topBlock){
      const h=topBlock.querySelector('.section-head h2');
      const p=topBlock.querySelector('.section-head p');
      if(h)h.textContent='今日开发关注 Top 10';
      if(p)p.textContent='优先展示排名突破、新品进入与结构信号明显的商品，作为开发拆解对象。';
    }
  }

  const base=typeof renderDetail==='function'?renderDetail:null;
  if(base){
    renderDetail=function(key){base(key);setTimeout(()=>apply(key),0)};
  }

  document.querySelectorAll('.category-tabs button').forEach(btn=>{
    btn.addEventListener('click',()=>setTimeout(()=>{
      if(btn.dataset.category&&btn.dataset.category!=='compare')apply(btn.dataset.category);
    },80));
  });

  setTimeout(()=>{
    try{if(document.getElementById('detailPanel')?.classList.contains('active'))apply(typeof activeKey==='string'?activeKey:'party_balloons')}catch(e){}
  },500);
})();

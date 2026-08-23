let STRUCTURE_DIM='product_type';
const STRUCTURE_DIM_LABELS={product_type:'产品类型',colour_style:'颜色风格',pack_size:'数量规格',size_text:'尺寸',occasion:'场景',material:'材质'};
function setStructureDim(dim){STRUCTURE_DIM=dim;document.querySelectorAll('#detailStructDimSwitch button').forEach(b=>b.classList.toggle('active',b.dataset.dim===dim));const d=STORE?.[activeKey];if(d)renderDetailStructure(d);else{const hint=document.getElementById('detailStructHint');if(hint)hint.textContent=`当前查看：${STRUCTURE_DIM_LABELS[dim]||dim}`}}
renderDetailStructure=function(d){
  const all=d.structureDerived||[];
  const r=all.filter(x=>x.field===STRUCTURE_DIM);
  const growth=r.filter(x=>x.delta>0).sort((a,b)=>b.delta-a.delta).slice(0,5);
  const drop=r.filter(x=>x.delta<0).sort((a,b)=>a.delta-b.delta).slice(0,5);
  const main=[...r].sort((a,b)=>b.share-a.share).slice(0,5);
  const fresh=r.filter(x=>x.newAppear).sort((a,b)=>b.share-a.share).slice(0,5);
  const dimLabel=STRUCTURE_DIM_LABELS[STRUCTURE_DIM]||STRUCTURE_DIM;
  const block=(title,arr)=>`<article class="structure-card"><div class="dimension-tag">${dimLabel}</div><h3>${title}</h3><div class="struct-list">${arr.length?arr.map(x=>`<div class="struct-line"><span>${esc(x.label)}</span><b class="${x.delta>=0?'pos':'neg'}">${x.delta>=0?'+':''}${x.delta.toFixed(1)}pct</b></div>`).join(''):'<div class="pending-text">暂无明显信号</div>'}</div></article>`;
  $('detailStructCards').innerHTML=block('🔥 快速增长',growth)+block('↓ 快速下降',drop)+block('★ 当前主流',main)+block('✦ 新出现',fresh);
  const hint=$('detailStructHint');if(hint)hint.innerHTML=`当前查看：<span class="structure-current-label">${dimLabel}</span> · 共 ${r.length} 个标签`;
  $('detailStructRows').innerHTML=r.length?r.slice(0,100).map(x=>`<tr><td>${esc(x.label)}</td><td>${x.count}</td><td>${x.share.toFixed(1)}%</td><td>${x.prevShare.toFixed(1)}%</td><td class="${x.delta>=0?'up':'down'}">${x.delta>=0?'+':''}${x.delta.toFixed(1)}pct</td><td>${x.newAppear?'<span class="badge info">新出现</span>':x.delta>=1?'<span class="badge good">增长</span>':x.delta<=-1?'<span class="badge bad">下降</span>':'<span class="badge good">稳定</span>'}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">当前维度暂无结构数据。</td></tr>';
};
(function bindStructureSwitch(){const root=document.getElementById('detailStructDimSwitch');if(!root)return;root.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>setStructureDim(b.dataset.dim)));document.querySelectorAll('.category-tabs button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.category!=='compare'){setTimeout(()=>{const d=STORE?.[b.dataset.category];if(d)renderDetailStructure(d);},0)}}));setStructureDim('product_type');})();
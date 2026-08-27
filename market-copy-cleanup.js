/* Copy cleanup after market-panorama upgrade. */
(function(){
  function run(){
    document.querySelectorAll('.section-head h2').forEach(h=>{
      const t=h.textContent.trim();
      if(t==='双类目核心盘面'){
        h.textContent='双类目市场全景';
        const p=h.parentElement?.querySelector('p');if(p)p.textContent='统一看市场规模、父体销量与销售额、品牌份额、新品进入及头部集中度。';
      }
      if(t==='英国 Party Market 今日机会 Top 10'){
        h.textContent='英国 Party Market 今日开发关注 Top 10';
        const p=h.parentElement?.querySelector('p');if(p)p.textContent='跨类目筛选今天最值得进一步拆解的商品；不再使用机会分作为展示指标。';
      }
      if(t==='今日机会 Top 10'){
        h.textContent='今日开发关注 Top 10';
        const p=h.parentElement?.querySelector('p');if(p)p.textContent='按排名动能、新品状态与产品结构信号筛选值得进一步拆解的商品。';
      }
    });
  }
  run();setTimeout(run,500);setTimeout(run,1800);
})();
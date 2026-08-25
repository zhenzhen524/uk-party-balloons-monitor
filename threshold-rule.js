/* Low-value old-listing rule.
   Exclude only when all four conditions are known and true:
   days_since_launch > 365
   category_rank > 300
   parent_sales_estimate < 300
   sales_estimate < 30
   Missing sales fields are treated as data-quality issues, not as zero and not as automatic exclusion.
*/
isLowValueOldListing=function(x){
  const oldTail=Number(x?.days_since_launch)>365 && Number(x?.category_rank)>300;
  if(!oldTail)return false;

  const parentKnown=x?.parent_sales_estimate!=null && Number.isFinite(Number(x.parent_sales_estimate));
  const childKnown=x?.sales_estimate!=null && Number.isFinite(Number(x.sales_estimate));
  if(!parentKnown || !childKnown)return false;

  return Number(x.parent_sales_estimate)<300 && Number(x.sales_estimate)<30;
};

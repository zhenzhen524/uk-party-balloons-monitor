/* Low-value old-listing display rule.
   For listings older than 365 days and still ranked worse than #300:
   keep only when demand is explicitly verified by either
   parent sales >= 300 OR child sales >= 30.
   If both sales fields are missing / below threshold, hide from the effective sample and opportunity views.
*/
isLowValueOldListing=function(x){
  const oldTail=Number(x?.days_since_launch)>365 && Number(x?.category_rank)>300;
  if(!oldTail)return false;

  const parentKnown=x?.parent_sales_estimate!=null && Number.isFinite(Number(x.parent_sales_estimate));
  const childKnown=x?.sales_estimate!=null && Number.isFinite(Number(x.sales_estimate));
  const parentStrong=parentKnown && Number(x.parent_sales_estimate)>=300;
  const childStrong=childKnown && Number(x.sales_estimate)>=30;

  /* 老链接且排名仍>300时，没有明确销量强度证明就不进入展示。 */
  return !(parentStrong || childStrong);
};

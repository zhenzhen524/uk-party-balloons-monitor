/* Final low-value old-listing rule.
   Exclude when BOTH conditions are true:
   1) days_since_launch > 365
   2) parent_sales_estimate < 300
   Category rank and child sales are no longer part of the filtering condition.
   If parent_sales_estimate is missing, keep the listing because low parent sales is not verified.
*/
isLowValueOldListing=function(x){
  const oldEnough=Number(x?.days_since_launch)>365;
  const parentKnown=x?.parent_sales_estimate!=null && Number.isFinite(Number(x.parent_sales_estimate));
  return oldEnough && parentKnown && Number(x.parent_sales_estimate)<300;
};

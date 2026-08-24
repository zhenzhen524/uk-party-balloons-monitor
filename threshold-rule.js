/* Corrected low-value old-listing rule, loaded after structure-select-base.js. */
isLowValueOldListing=function(x){
  return Number(x?.days_since_launch)>365 &&
    Number(x?.category_rank)>300 &&
    x?.parent_sales_estimate!=null && Number(x.parent_sales_estimate)<300 &&
    x?.sales_estimate!=null && Number(x.sales_estimate)<30;
};

/* Final low-value old-listing rule.
   Exclude when BOTH conditions are true:
   1) days_since_launch > 365
   2) category_rank > 300
   Sales fields are no longer part of the filtering condition.
*/
isLowValueOldListing=function(x){
  return Number(x?.days_since_launch)>365 && Number(x?.category_rank)>300;
};

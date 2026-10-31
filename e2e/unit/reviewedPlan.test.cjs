"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {validatePlan,RECIPES}=require("../reviewedPlan.cjs");
const example={format:"reviewed-isolated-plan-v1",reviewedBy:"QA reviewer",
 storyId:"US-017",cases:[{id:"AI-001",decision:"APPROVED",title:"Booking success",recipe:"booking_valid"}]};
test("reviewed recipe plan compiles fixed localhost healthcare scenario only",()=>{
 const plan=validatePlan(example);
 assert.equal(plan.cases[0].category,"positive");
 assert.equal(plan.cases[0].recipe,"booking_valid");
 assert.equal(plan.scope,"ISOLATED_SOURCE_REVIEWED_RECIPE_ONLY");
 assert.ok(Object.keys(RECIPES).length>=10);
});
test("arbitrary source code URLs unmatched stories or unapproved cases are rejected",()=>{
 for(const changes of [
   {cases:[{...example.cases[0],recipe:"javascript:alert(1)"}]},
   {cases:[{...example.cases[0],decision:"REJECTED"}]},
   {cases:[{...example.cases[0],url:"https://example.com"}]},
   {storyId:"US-005"},
   {extraCode:"process.exit(0)"}
 ]) assert.throws(()=>validatePlan({...example,...changes}));
});

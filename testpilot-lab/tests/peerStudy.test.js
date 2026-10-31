"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {validateIndependentReview,compareIndependentReviews,validatePeerSession,hashCases,TASKS}=require("../peerStudy");
const criteria=["User is authorized","Response matches expected state"];
const source=[{id:"AI-001",title:"synthetic"}];
function review(name,ai="covered"){
 return {reviewer:name,caseSetHash:hashCases(source),
   assessments:criteria.map((criterion,i)=>({criterion,ai:i===0?ai:"not_reviewed",
     manual:"covered",evidence:"AI-001 step 1 and TP-011 expected response"}))};
}
test("two distinct human-entered reviews report disagreements, not invented signoff",()=>{
 const a=validateIndependentReview(review("Reviewer A"),criteria);
 const b=validateIndependentReview(review("Reviewer B","not_covered"),criteria);
 const result=compareIndependentReviews(a,b);
 assert.equal(result.agreed,1);
 assert.equal(result.disagreements.length,1);
 assert.equal(result.finalSignOff,false);
 assert.throws(()=>compareIndependentReviews(a,a),/distinct/);
 assert.throws(()=>validateIndependentReview({...review("X"),caseSetHash:"0".repeat(64)},criteria.map(x=>x+" changed")),/criterion|evidence/i);
});
test("missing actual criterion evidence is rejected",()=>{
 const bad=review("A");bad.assessments[0].evidence="";
 assert.throws(()=>validateIndependentReview(bad,criteria),/cite/);
});
test("peer usability requires consent measured duration task status and feedback",()=>{
 const good={consent:true,participant:"P1",browser:"Chrome desktop",
   durationSeconds:240,
   tasks:TASKS.map(task=>({task,result:"completed"})),
   feedback:"Participant was uncertain whether NOT_RUN meant execution failure."};
 const record=validatePeerSession(good);
 assert.equal(record.durationSeconds,240);
 assert.equal(record.identityVerified,false);
 assert.throws(()=>validatePeerSession({...good,consent:false}),/consent/);
 assert.throws(()=>validatePeerSession({...good,durationSeconds:0}),/measured/);
 assert.throws(()=>validatePeerSession({...good,feedback:""}),/participant/);
});

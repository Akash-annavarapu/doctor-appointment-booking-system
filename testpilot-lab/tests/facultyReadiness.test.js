"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {auditExperiments,auditPeerSessions,auditIndependentReviews,evaluate}=require("../facultyReadiness.cjs");
const cases=()=>Array.from({length:4},(_,i)=>({id:"AI-00"+(i+1),steps:["Synthetic fixture"],executionStatus:"NOT_RUN"}));
const records=()=>Array.from({length:10},(_,i)=>({
 iterationId:"synthetic-fixture-"+i,storyId:i<3?"US-001":i<6?"US-005":"US-017",
 promptVariant:"baseline",promptChangeAndReason:"Synthetic fixture (never submitted as model output)",
 timestampUtc:"2026-10-31T08:00:00Z",llmProvider:"MOCK-SYNTHETIC",model:"fake-test-model",
 actualLlmOutput:cases(),elapsedGenerationMs:1,
 humanRatings:{completeness:3,accuracy:4,healthcareRelevance:2},
 reviewerObservation:"Synthetic test only",reviewTimestampUtc:"2026-10-31T08:05:00Z"
}));
test("missing model runs and missing reviewer ratings are NOT complete",()=>{
 assert.equal(auditExperiments({iterations:[]}).ok,false);
 const list=records();list[0].humanRatings.accuracy=null;
 assert.equal(auditExperiments({iterations:list}).ok,false);
});
test("structural audit computes explicit arithmetic only on scored records",()=>{
 const output=auditExperiments({iterations:records()});
 assert.equal(output.ok,true);
 assert.equal(output.means.accuracy,4);
 assert.equal(output.provenanceWarning.includes("cannot authenticate"),true);
});
test("consent and distinct participants are mandatory",()=>{
 const x={participant:"Peer A",consent:true,browser:"Chrome",
 durationSeconds:120,feedback:"Synthetic feedback",
 tasks:Array.from({length:6},(_,i)=>({task:"synthetic-"+i,result:"completed"}))};
 assert.equal(auditPeerSessions({participants:[x,{...x,participant:"Peer B"}]}).ok,true);
 assert.equal(auditPeerSessions({participants:[x,{...x,consent:false,participant:"Peer B"}]}).ok,false);
});
test("unresolved independent review conflicts remain incomplete",()=>{
 const entry=(name,ai="covered")=>({reviewer:name,caseSetHash:"a".repeat(64),
  assessments:[{criterion:"Synthetic condition",ai,manual:"covered",evidence:"AI-001 step 1"}]});
 assert.equal(auditIndependentReviews({reviewers:[entry("A"),entry("B")]}).ok,true);
 const result=auditIndependentReviews({reviewers:[entry("A"),entry("B","not_covered")]});
 assert.equal(result.ok,false);assert.equal(result.disagreements,1);
 assert.equal(evaluate({experiments:null,peers:null,reviews:{}}).evidenceCompleteness,false);
});

"use strict";
// Structural audit of faculty evidence. It does not authenticate real human identities
// or provider signatures, and must never turn a missing score into a number.
const fs=require("node:fs");
const REQ=["US-001","US-005","US-017"];
const isRate=n=>Number.isInteger(n)&&n>=1&&n<=5;
function auditExperiments(doc){
  const rows=doc?.iterations;
  if(!Array.isArray(rows)||rows.length<10)return {ok:false,problem:"Ten actual model-output records not supplied."};
  const stories=new Set(rows.map(x=>x.storyId));
  if(!REQ.every(s=>stories.has(s)))return {ok:false,problem:"Three required stories are not represented."};
  const seen=new Set();
  for(const item of rows){
    if(!item||typeof item.iterationId!=="string"||seen.has(item.iterationId)||
       !REQ.includes(item.storyId)||!["baseline","boundary","authorization","assertions"].includes(item.promptVariant)||
       !Number.isFinite(Date.parse(item.timestampUtc))||
       typeof item.llmProvider!=="string"||!item.llmProvider.trim()||
       typeof item.model!=="string"||!item.model.trim()||
       typeof item.promptChangeAndReason!=="string"||!item.promptChangeAndReason.trim()||
       !Array.isArray(item.actualLlmOutput)||item.actualLlmOutput.length<4||
       item.actualLlmOutput.length>8||item.actualLlmOutput.some(c=>!c.id||!Array.isArray(c.steps)||
         c.executionStatus!=="NOT_RUN")||
       !Object.values(item.humanRatings||{}).length||
       !["completeness","accuracy","healthcareRelevance"].every(k=>isRate(item.humanRatings[k]))||
       typeof item.reviewerObservation!=="string"||!item.reviewerObservation.trim()||
       !Number.isFinite(Date.parse(item.reviewTimestampUtc))||
       !Number.isFinite(item.elapsedGenerationMs)||item.elapsedGenerationMs<0){
      return {ok:false,problem:"At least one run is unscored, duplicate, incomplete, or lacks genuine output fields."};
    }
    seen.add(item.iterationId);
  }
  const means=Object.fromEntries(["completeness","accuracy","healthcareRelevance"].map(k=>
    [k,Math.round(rows.reduce((a,x)=>a+x.humanRatings[k],0)/rows.length*100)/100]));
  return {ok:true,total:rows.length,stories:[...stories],means,
    provenanceWarning:"JSON format cannot authenticate LLM provenance or reviewer identities; verify exports manually."};
}
function auditPeerSessions(doc){
 const rows=doc?.participants;
 if(!Array.isArray(rows)||rows.length<2)return {ok:false,problem:"Two consenting peer sessions are missing."};
 const valid=rows.every(x=>x?.consent===true&&typeof x.participant==="string"&&x.participant.trim()&&
   typeof x.browser==="string"&&x.browser.trim()&&Number.isInteger(x.durationSeconds)&&x.durationSeconds>0&&
   typeof x.feedback==="string"&&x.feedback.trim()&&Array.isArray(x.tasks)&&x.tasks.length===6&&
   x.tasks.every(t=>["completed","blocked","not_attempted"].includes(t.result)));
 if(!valid||new Set(rows.map(x=>x.participant.toLowerCase().trim())).size<2)
   return {ok:false,problem:"Peer evidence needs two different consenting participants, measured tasks and feedback."};
 return {ok:true,recorded:rows.length,identityVerified:false};
}
function auditIndependentReviews(doc){
 const rows=doc?.reviewers;
 if(!Array.isArray(rows)||rows.length<2)
   return {ok:false,problem:"Two independent review records are missing."};
 const [a,b]=rows;
 if(!a||!b||!a.reviewer||!b.reviewer||
    a.reviewer.trim().toLowerCase()===b.reviewer.trim().toLowerCase()||
    !a.caseSetHash||a.caseSetHash!==b.caseSetHash||
    !Array.isArray(a.assessments)||!Array.isArray(b.assessments)||
    a.assessments.length===0||a.assessments.length!==b.assessments.length||
    a.assessments.some((v,i)=>v.criterion!==b.assessments[i].criterion||
      !["covered","not_covered"].includes(v.ai)||!["covered","not_covered"].includes(v.manual)||
      !v.evidence?.trim()||
      !["covered","not_covered"].includes(b.assessments[i].ai)||
      !["covered","not_covered"].includes(b.assessments[i].manual)||!b.assessments[i].evidence?.trim())){
   return {ok:false,problem:"Reviewer identities, source hash, cited criteria, or complete assessments are invalid."};
 }
 const disagreements=a.assessments.filter((v,i)=>v.ai!==b.assessments[i].ai||
  v.manual!==b.assessments[i].manual).length;
 return {ok:disagreements===0,reviewers:[a.reviewer,b.reviewer],disagreements,
  problem:disagreements?"Disagreement resolution and signed acceptance are still required.":null,
  identityVerified:false};
}
function evaluate(doc){
 const exp=auditExperiments(doc.experiments),peer=auditPeerSessions(doc.peers);
 const reviews=Object.fromEntries(REQ.map(id=>[id,auditIndependentReviews(doc.reviews?.[id])]));
 return {experimentStudy:exp,peerSessions:peer,storyReviews:reviews,
  evidenceCompleteness:exp.ok&&peer.ok&&REQ.every(id=>reviews[id].ok),
  facultySignOff:"NOT VERIFIED — requires genuine mentor/team approval",
  caveat:"Format checks alone do not authenticate model output or actual independent participants."};
}
if(require.main===module){
 const manifest=process.argv[2];
 if(!manifest){console.error("Usage: node testpilot-lab/facultyReadiness.cjs path/to/evidence-manifest.json");process.exitCode=2;}
 else try{
  const directory=require("node:path").dirname(require("node:path").resolve(manifest));
  const paths=JSON.parse(fs.readFileSync(manifest,"utf8"));
  const read=file=>file?JSON.parse(fs.readFileSync(require("node:path").resolve(directory,file),"utf8")):null;
  const inputs={experiments:read(paths.experiments),peers:read(paths.peers),
    reviews:Object.fromEntries(REQ.map(id=>[id,read(paths.reviews?.[id])] ))};
  const result=evaluate(inputs);
  console.log(JSON.stringify(result,null,2));
  if(!result.evidenceCompleteness)process.exitCode=2;
 }catch(e){console.error("Faculty evidence incomplete: "+e.message);process.exitCode=2;}
}
module.exports={auditExperiments,auditPeerSessions,auditIndependentReviews,evaluate};

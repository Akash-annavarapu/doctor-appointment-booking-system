"use strict";
// Run ten genuine provider experiments; never fill model output or human scores.
// Usage (from repository root): node testpilot-lab/tenRunStudy.cjs ./real-study.json
// Requires a PRIVATE free-tier GEMINI_API_KEY, quota, and real human scoring afterward.
const fs=require("node:fs"), path=require("node:path"), crypto=require("node:crypto");
const {generateCases,getStory,activeAiConfig}=require("./server");
const stories=require("./user-stories.json");
const STUDY=Object.freeze([
  ["US-001","baseline","Baseline registration coverage"],
  ["US-001","boundary","Check seven/eight-character password edges"],
  ["US-001","assertions","Demand observable registration outcome"],
  ["US-005","baseline","Baseline approved doctor browsing"],
  ["US-005","boundary","Check empty doctor directory"],
  ["US-005","assertions","Require precise doctor-list assertions"],
  ["US-017","baseline","Baseline free-slot appointment booking"],
  ["US-017","boundary","Check missing fields and unavailable slots"],
  ["US-017","authorization","Check anonymous booking denial"],
  ["US-017","assertions","Require persisted booking state and HTTP status"]
]);
function recover(filename){
  if(!fs.existsSync(filename))return [];
  const rows=JSON.parse(fs.readFileSync(filename,"utf8")).iterations;
  if(!Array.isArray(rows)||rows.length>10)throw Error("Invalid prior study evidence.");
  for(let i=0;i<rows.length;i++) {
    if(rows[i].storyId!==STUDY[i][0]||rows[i].promptVariant!==STUDY[i][1]||
       rows[i].kind!=="ACTUAL_LLM_GENERATION_NOT_A_TEST_EXECUTION"||
       !Array.isArray(rows[i].actualLlmOutput)||rows[i].actualLlmOutput.length<4)
       throw Error("Prior study cannot be resumed from unverifiable or reordered records.");
  }
  return rows;
}
function persist(file,iterations){
  const result={specification:"BITS Pilani BSDCH ZC229T",protocol:"ten-real-provider-runs-v1",
    recordedRuns:iterations.length,targetRuns:10,targetDistinctStories:3,iterations,
    notice:"Only genuine provider responses; human quality scores are pending until a real reviewer enters them."};
  fs.writeFileSync(file+".tmp",JSON.stringify(result,null,2),{mode:0o600});
  fs.renameSync(file+".tmp",file);
}
async function main(){
  const filename=path.resolve(process.argv[2]||"./testpilot-real-llm-study.json");
  if(process.env.AI_PROVIDER && process.env.AI_PROVIDER!=="gemini")
    throw Error("Study protocol explicitly requires Gemini.");
  process.env.AI_PROVIDER="gemini";
  const ai=activeAiConfig();
  if(!ai.key?.trim())throw Error("GEMINI_API_KEY is not configured; cannot claim 10 actual model runs.");
  const rows=recover(filename);
  for(let i=rows.length;i<STUDY.length;i++){
    const [storyId,promptVariant,promptChangeAndReason]=STUDY[i];
    const source=stories.find(item=>item.id===storyId);
    if(!source)throw Error("Unknown documented story "+storyId);
    const story=getStory({storyId,storyText:source.story});
    const inspection={page:{title:"Source-grounded healthcare application"},
      publicDoctorCatalog:{available:false,approvedCount:null,specialties:[]},
      evidenceScope:"No live public inspection claimed for offline experiment."};
    const started=performance.now();
    let cases;
    try{cases=await generateCases({story,inspection,promptVariant});}
    catch(err){persist(filename,rows);
      throw Error("Stopped at real model run "+(i+1)+"/10: "+err.message+
        ". Resume with this output file; "+rows.length+" genuine runs retained.");}
    if(cases.some(x=>x.executionStatus!=="NOT_RUN"))
      throw Error("Refusing an AI response containing unmeasured PASS claims.");
    rows.push({iterationId:crypto.randomUUID(),timestampUtc:new Date().toISOString(),
      storyId,userStoryInput:source.story,promptVersion:"proposal-v2-2026-10-31",
      promptVariant,promptChangeAndReason,llmProvider:"Google Gemini",model:ai.model,
      elapsedGenerationMs:Math.round(performance.now()-started),actualLlmOutput:cases,
      humanRatings:{completeness:null,accuracy:null,healthcareRelevance:null},
      reviewerObservation:"",humanReviewElapsedMs:null,reviewTimestampUtc:null,
      kind:"ACTUAL_LLM_GENERATION_NOT_A_TEST_EXECUTION"});
    persist(filename,rows);
    console.log("Recorded real provider response "+rows.length+"/10 for "+storyId);
  }
  console.log("All 10 model responses stored; independent human scoring and peer validation are still required.");
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={STUDY,recover};

"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {STUDY,recover}=require("../tenRunStudy.cjs");
test("ten-run pre-registered protocol covers three source-grounded stories",()=>{
 assert.equal(STUDY.length,10);
 assert.deepEqual([...new Set(STUDY.map(x=>x[0]))],["US-001","US-005","US-017"]);
 assert.equal(STUDY.filter(x=>x[0]==="US-001").length,3);
 assert.equal(STUDY.filter(x=>x[0]==="US-005").length,3);
 assert.equal(STUDY.filter(x=>x[0]==="US-017").length,4);
 assert.ok(STUDY.every(x=>["baseline","boundary","authorization","assertions"].includes(x[1])));
});
test("resumable study starts empty when there is no genuine provider output",()=>{
 const fs=require("node:fs"),path=require("node:path"),os=require("node:os");
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"testpilot-study-"));
 try { assert.deepEqual(recover(path.join(dir,"not-created.json")),[]); }
 finally {fs.rmSync(dir,{recursive:true,force:true});}
});

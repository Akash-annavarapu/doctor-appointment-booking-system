const {validateReport,publicReport}=require("../services/testRunReporting");
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==","base64").toString("base64");
function report(){
 return {runId:"41183060775:1:playwright-chromium",timestamp:new Date().toISOString(),
   suite:"playwright-chromium",engine:"Static-CI",
   summary:{total:1,passed:0,failed:1,skipped:0,durationMs:24},
   testResults:[{id:"TC-0508",title:"Synthetic failure fixture",category:"Edge Case",
     status:"FAIL",executionTime:24,errorLog:"Synthetic assertion failed",
     screenshotBase64:png}]};
}
test("bounded authentic PNG from failed isolated Playwright result is shown to Lab",()=>{
 const verified=validateReport(report());
 expect(verified.testResults[0].screenshotBase64).toBe(png);
 const publicResult=publicReport(verified);
 expect(publicResult.testResults[0].screenshotDataUrl).toBe("data:image/png;base64,"+png);
 expect(publicResult.evidenceRunUrl).toContain("/actions/runs/41183060775");
 expect(publicResult.testResults[0].errorLog).toBeNull();
});
test("reject screenshots on passing, non-browser, or malformed CI results",()=>{
 const passing=report();passing.summary={total:1,passed:1,failed:0,skipped:0,durationMs:5};
 passing.testResults[0].status="PASS";
 expect(()=>validateReport(passing)).toThrow(/Screenshots/);
 const backend=report();backend.suite="backend-jest";
 expect(()=>validateReport(backend)).toThrow(/Screenshots/);
 const invalid=report();invalid.testResults[0].screenshotBase64=Buffer.from("Not PNG").toString("base64");
 expect(()=>validateReport(invalid)).toThrow(/PNG/);
});

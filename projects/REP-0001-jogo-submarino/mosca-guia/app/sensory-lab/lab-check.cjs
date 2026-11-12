const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];const result={};try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.TEST_BASE||'http://127.0.0.1:8774')+'/mosca-guia/sensory-lab/laboratory.html');
 await page.waitForFunction(()=>window.NeuralLab?.ready,{},{timeout:90000});
 assert.match(await page.locator('#verification').innerText(),/471 candidatos/);
 await page.locator('#search').fill('99987');assert.equal(await page.locator('#neuron option').count(),1);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#run').click();await page.waitForFunction(()=>NeuralLab.snapshot()?.samples.length>10);
 await page.locator('#pause').click();await page.waitForTimeout(300);const count=await page.evaluate(()=>NeuralLab.snapshot().samples.length);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>NeuralLab.snapshot().samples.length),count);
 await page.locator('#pause').click();await page.waitForFunction(()=>NeuralLab.snapshot().status==='complete',{},{timeout:90000});
 const record=await page.evaluate(()=>NeuralLab.snapshot());assert.equal(record.samples.length,1600);assert.equal(record.completed.length,16);
 const totals=record.cases.map((c,i)=>record.samples.filter(s=>s.caseIndex===i).reduce((sum,s)=>sum+s.spikes.reduce((a,n,g)=>a+(g===c.group?0:n),0),0));
 assert.equal(totals[0],0);assert.equal(totals[13],0);assert.equal(totals[6],7);
 for(let i=0;i<16;i++){const samples=record.samples.filter(s=>s.caseIndex===i);assert.deepEqual(samples.map(s=>s.step),Array.from({length:100},(_,j)=>j));assert.ok(samples.filter(s=>s.step<10||s.step>=70).every(s=>s.input.current===0));}
 const download=page.waitForEvent('download');await page.locator('#export').click();const exported=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));assert.equal(exported.samples.length,1600);assert.ok(exported.watch.every(n=>typeof n.rootId==='string'));
 fs.writeFileSync(path.join(__dirname,'automatic-results.json'),JSON.stringify(record));
 await page.locator('#run').click();await page.waitForFunction(()=>NeuralLab.snapshot().samples.length>5);await page.locator('#cancel').click();await page.waitForFunction(()=>NeuralLab.snapshot().status==='cancelled');assert.ok(await page.locator('#export').isEnabled());
 await page.screenshot({path:path.join(__dirname,'laboratory-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);
 Object.assign(result,{passed:true,checks:['471 verified identities','mobile layout','pause/resume','16 cases / 1600 synchronized steps','blank and disconnected controls','food downstream total = 7','export includes exact IDs','cancel preserves partial data'],totals,errors});
}finally{fs.writeFileSync(path.join(__dirname,'lab-check.json'),JSON.stringify(result,null,2));await browser.close();}console.log(result);})().catch(e=>{console.error(e);process.exitCode=1;});

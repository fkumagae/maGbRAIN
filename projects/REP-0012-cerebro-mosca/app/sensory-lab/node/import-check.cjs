const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.TEST_BASE||'http://127.0.0.1:8774')+'/cerebro-mosca/sensory-lab/laboratory.html');
 await page.locator('#nodeReport').setInputFiles(path.join(__dirname,'example-report.json'));
 await page.waitForFunction(()=>document.querySelectorAll('#nodeResults tr').length===13);
 const row=page.locator('#nodeResults tr').filter({has:page.getByRole('cell',{name:'odor-3',exact:true})});assert.equal(await row.locator('td').nth(2).innerText(),'7');await row.getByRole('button').click();assert.ok(await page.locator('#nodeDetails').innerText().then(s=>s.includes('99987')));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:path.join(__dirname,'import-mobile.png'),fullPage:true});
 await page.locator('#nodeReport').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"schema":"wrong"}')});await page.waitForFunction(()=>document.getElementById('nodeStatus').textContent.includes('Formato inválido'));assert.equal(await page.locator('#nodeResults tr').count(),0);
 assert.deepEqual(errors,[]);const result={passed:true,base:process.env.TEST_BASE||'local',checks:['13 cases imported','known seven spikes displayed','individual responder inspection','mobile layout','invalid report rejected'],errors};fs.writeFileSync(path.join(__dirname,'import-check.json'),JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

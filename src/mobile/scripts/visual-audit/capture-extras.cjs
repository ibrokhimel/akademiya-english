const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const out=path.resolve(__dirname,'../../.expo/visual-parity/checks/browser');
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,args:['--mute-audio']});
for(const dark of [false,true])for(const kind of ['speech-right','speech-wrong','heard-right','fix-right','gap-right']){
 const ctx=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Tashkent'}),page=await ctx.newPage();
 await page.goto('http://127.0.0.1:8791/src/mobile/scripts/visual-audit/reference.html');await page.addStyleTag({content:'#shell,#phone{height:844px!important}'});await page.waitForFunction(()=>window.AUDIT?.ready);
 const speech=kind.startsWith('speech'),ex=speech?'meet':kind.split('-')[0],name=speech?'speech-result-'+kind.split('-')[1]:'exercise-'+ex+'-checked-right';
 await page.evaluate(({dark,ex,kind,speech})=>{if(speech)window.APP_TEST={say:[kind==='speech-right'?true:'coffee please'],else:true};return window.AUDIT.show('exercise-'+ex,dark);},{dark,ex,kind,speech});
 await page.waitForTimeout(ex==='heard'?6000:2400);
 if(speech)await page.locator('.mic .p3d').click({force:true});
 else{const n=await page.evaluate(ex=>ex==='heard'?window.APP.now.item.right:ex==='fix'?window.APP.now.item.bad:window.APP.now.item.gap,ex);await page.locator(ex==='heard'?`.picture[data-k="${n}"]`:ex==='fix'?`.mword[data-i="${n}"]`:`.gap[data-i="${n}"]`).click({force:true});await page.locator('.check').click({force:true});}
 await page.waitForTimeout(2400);await page.locator('#phone').screenshot({path:path.join(out,name+(dark?'-dark':'-light')+'.png')});console.log('BROWSER CHECK '+name+(dark?'-dark':'-light'));await ctx.close();
}await browser.close();})().catch(error=>{console.error(error);process.exitCode=1});

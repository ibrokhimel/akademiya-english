// Serve the repository locally, then run: node docs/blueprint/build-pdf.cjs
const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    await page.goto(process.env.BLUEPRINT_URL||'http://127.0.0.1:8793/docs/blueprint/reference.html');
    await page.waitForFunction(()=>window.BLUEPRINT);
    await page.evaluate(()=>document.fonts.ready);
    await page.emulateMedia({media:'print'});
    const file=path.join(__dirname,'Akademiya-English-Blueprint.pdf');
    await page.pdf({path:file,format:'A4',preferCSSPageSize:true,printBackground:true,displayHeaderFooter:true,headerTemplate:'<div></div>',footerTemplate:'<div style="font-family:Arial;font-size:8px;color:#777;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span>Akademiya English · Product blueprint · 23 October 2026</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'});
    const data=fs.readFileSync(file);
    if(!data.subarray(0,5).equals(Buffer.from('%PDF-')))throw Error('PDF generation failed');
    console.log(`Created ${file} (${Math.round(data.length/1024)} KB).`);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

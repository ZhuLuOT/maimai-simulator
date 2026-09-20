exports.finishSegments=async page=>{for(let i=0;i<40;i++){const button=page.locator('[data-action="performance-next"], [data-action="curse-choice"]:not([disabled]), [data-action="segment-choice"]').first();if(!await button.count())return;await button.click();}throw Error('Performance did not finish');};
exports.observeBird=async page=>{
 await page.locator('#bird-hold').waitFor();
 await page.evaluate(()=>new Promise((resolve,reject)=>{let previous=null,ticks=0;const timer=setInterval(()=>{
  const frame=document.querySelector('.bird-viewfinder'),target=document.querySelector('.bird-target');
  if(!frame||!target){clearInterval(timer);document.dispatchEvent(new KeyboardEvent('keyup',{key:' '}));resolve();return;}
  if(++ticks>610){clearInterval(timer);reject(Error('Observation did not finish'));return;}
  const position=parseFloat(frame.style.top),velocity=previous===null?0:position-previous;previous=position;
  const held=position+velocity*5>parseFloat(target.style.top);document.dispatchEvent(new KeyboardEvent(held?'keydown':'keyup',{key:' ',bubbles:true}));
 },100);}));
};

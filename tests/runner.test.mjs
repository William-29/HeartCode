import test from 'node:test';
import assert from 'node:assert/strict';

test('worker startup and message failures return a recoverable result instead of stranding the Run button',async()=>{
  const previous=globalThis.Worker;
  const runner=await import('../dist/runner.js');
  try {
    globalThis.Worker=class{constructor(){throw new Error('blocked');}};
    const result=await runner.runPython('print(1)');
    assert.equal(result.passed,false);assert.equal(result.runtimeError,true);assert.match(result.error,/draft is saved/);
    let terminated=0;
    globalThis.Worker=class{terminate(){terminated++;}postMessage(){throw new Error('unavailable');}};
    assert.equal((await runner.runPython('print(2)')).runtimeError,true);assert.equal(terminated,1);
    let worker;
    globalThis.Worker=class{constructor(){worker=this;}terminate(){}postMessage(data){this.data=data;}};
    const recovered=runner.runPython('print(3)');
    worker.onmessage({data:{id:worker.data.id,passed:true,output:'3'}});
    assert.equal((await recovered).output,'3');
  }finally{runner.cancelRun();globalThis.Worker=previous;}
});

test('cancelled workers cannot stop or overwrite a newer run',async()=>{
  const previous=globalThis.Worker,workers=[];
  const runner=await import('../dist/runner.js');
  try{
    globalThis.Worker=class{constructor(){workers.push(this);}terminate(){this.stopped=true;}postMessage(data){this.data=data;}};
    const first=runner.runPython('print(1)'),second=runner.runPython('print(2)');
    assert.equal((await first).cancelled,true);assert.equal(workers[0].stopped,true);
    workers[0].onmessage({data:{id:workers[0].data.id,passed:true,output:'1'}});
    workers[0].onerror();assert.equal(workers[1].stopped,undefined);
    workers[1].onmessage({data:{id:workers[1].data.id,passed:true,output:'2'}});
    assert.equal((await second).output,'2');
  }finally{runner.cancelRun();globalThis.Worker=previous;}
});

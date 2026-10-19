let worker;
let active;
let sequence = 0;
export function cancelRun() {
  if (worker) worker.terminate();
  worker = null;
  if (active) { clearTimeout(active.timer); active.resolve({ passed: false, output: '', error: 'Execution stopped. You can edit your code and run it again.', cancelled: true }); active = null; }
}
export function runPython(code, checks = '', onPhase = () => {}) {
  cancelRun();
  worker = new Worker(new URL('./python-worker.js', import.meta.url));
  return new Promise(resolve => {
    const id = ++sequence;
    const finish = result => { if (active?.id !== id) return; clearTimeout(active.timer); active = null; worker?.terminate(); worker = null; resolve(result); };
    active = { id, resolve, timer: setTimeout(() => { const result = { passed: false, output: '', error: 'Python took too long to load. Check your connection and try again; your code is saved.', runtimeError: true }; finish(result); }, 90000) };
    onPhase('loading');
    worker.onmessage = ({ data }) => {
      if (data.id !== id || active?.id !== id) return;
      if (data.phase === 'running') {
        clearTimeout(active.timer);
        active.timer = setTimeout(() => finish({ passed: false, output: '', error: 'Your code ran for more than 8 seconds and was stopped. Check for an endless loop and try again.' }), 8000);
        onPhase('running'); return;
      }
      finish(data);
    };
    worker.onerror = () => finish({ passed: false, runtimeError: true, output: '', error: 'The Python worker could not start. Check your connection and reload this page. Your code is saved.' });
    worker.postMessage({ id, code, checks });
  });
}

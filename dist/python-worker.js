let python;
let loading;
async function initialize() {
  if (python) return python;
  if (!loading) loading = (async () => {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
    python = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/' });
    const response = await fetch('runtime.py');
    if (!response.ok) throw new Error('The Python quest checker could not be loaded.');
    python.runPython(await response.text());
    return python;
  })();
  return loading;
}
self.onmessage = async ({ data }) => {
  const { id, code, checks = '' } = data;
  try {
    const runtime = await initialize();
    self.postMessage({ id, phase: 'running' });
    const execute = runtime.globals.get('run_source');
    try {
      const result = JSON.parse(execute(code, checks));
      self.postMessage({ id, ...result });
    } finally { execute.destroy(); }
  } catch (error) {
    python = null; loading = null;
    self.postMessage({ id, passed: false, runtimeError: true, output: '', error: 'Python could not start. Check your internet connection and try again. Your code is saved. ' + String(error.message || error).slice(0, 220) });
  }
};

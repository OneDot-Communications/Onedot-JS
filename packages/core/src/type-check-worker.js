const { parentPort } = require('worker_threads');
const ts = require('typescript');

parentPort.on('message', ({ filePath }) => {
  const program = ts.createProgram([filePath], {
    strict: true,
    noImplicitAny: true,
    noEmitOnError: true
  });

  const checker = program.getTypeChecker();
  const diagnostics = ts.getPreEmitDiagnostics(program);

  const errors = diagnostics
    .filter(d => d.category === ts.DiagnosticCategory.Error)
    .map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'));

  parentPort.postMessage({ errors });
});

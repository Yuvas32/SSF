export function parseSpectrumFileName(fileName) {
  // example: Scan_27_PSD_1230000000_delta_f_3333.333.spectrum
  const s = String(fileName || "");

  const m = s.match(/_PSD_(\d+)_delta_f_([0-9.]+)\.spectrum$/i);
  if (!m) {
    const err = new Error(`Invalid spectrum filename format: ${fileName}`);
    err.statusCode = 400;
    throw err;
  }

  const startHz = Number(m[1]);
  const deltaHz = Number(m[2]);

  if (!Number.isFinite(startHz) || startHz <= 0) {
    const err = new Error(`Invalid PSD start frequency in filename: ${fileName}`);
    err.statusCode = 400;
    throw err;
  }
  if (!Number.isFinite(deltaHz) || deltaHz <= 0) {
    const err = new Error(`Invalid delta_f in filename: ${fileName}`);
    err.statusCode = 400;
    throw err;
  }

  return { startHz, deltaHz };
}

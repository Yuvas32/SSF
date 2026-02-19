import { exec } from "child_process";

export function getConnectedDevicesText() {
  const cmd = "pnputil /enum-devices /connected";

  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(String(stderr || err.message || err)));
      }
      resolve(String(stdout || ""));
    });
  });
}

export async function checkRequiredDevices(requiredTokens = ["device", "pssr4"]) {
  const text = (await getConnectedDevicesText()).toLowerCase();
  const missing = requiredTokens.filter((t) => !text.includes(String(t).toLowerCase()));
  return { ok: missing.length === 0, missing };
}

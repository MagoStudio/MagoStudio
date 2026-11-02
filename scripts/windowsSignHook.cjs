// Signs one file with Azure Artifact Signing. @electron/windows-sign calls this
// for every app binary, and again for Squirrel's Setup.exe and Update.exe.
// Azure occasionally fails a single signing request, so each file is retried.
const { execFileSync } = require("node:child_process");

const ATTEMPTS = 4;
const RETRY_DELAY_MS = 5000;

module.exports = async function signFile(file) {
  const signtool = process.env.MAGO_SIGNTOOL_PATH;
  const dlib = process.env.MAGO_SIGNING_DLIB_PATH;
  const metadata = process.env.MAGO_SIGNING_METADATA_PATH;
  const args = [
    "sign",
    "/fd",
    "SHA256",
    "/tr",
    "http://timestamp.acs.microsoft.com",
    "/td",
    "SHA256",
    "/dlib",
    dlib,
    "/dmdf",
    metadata,
    file
  ];

  for (let attempt = 1; ; attempt++) {
    try {
      execFileSync(signtool, args, { stdio: "inherit" });
      return;
    } catch {
      if (attempt === ATTEMPTS) {
        console.error(`Failed to sign ${file} after ${ATTEMPTS} attempts`);
        // windows-sign logs hook errors and carries on, so exit to stop an
        // unsigned binary from being packaged.
        process.exit(1);
      }
      console.warn(
        `Signing ${file} failed (attempt ${attempt}/${ATTEMPTS}), retrying`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, attempt * RETRY_DELAY_MS)
      );
    }
  }
};

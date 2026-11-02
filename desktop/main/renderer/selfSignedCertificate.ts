import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
  X509Certificate
} from "node:crypto";

/**
 * Minimal DER/X.509 writer, enough to mint one self-signed server certificate
 * for the loopback origin the renderer is served from.
 *
 * Electron needs a real https origin so Clerk's cookies behave as they do on the
 * web, and the certificate is generated per install rather than shipped: no
 * private key belongs in this repository or in an installer. Node can generate
 * the key pair but cannot assemble a certificate, and pulling in a
 * general-purpose crypto library for one certificate is not worth the supply
 * chain. Nothing here is a general X.509 implementation and it should not grow
 * into one.
 */

const TAG = {
  boolean: 0x01,
  integer: 0x02,
  bitString: 0x03,
  octetString: 0x04,
  null: 0x05,
  objectIdentifier: 0x06,
  utf8String: 0x0c,
  sequence: 0x30,
  set: 0x31,
  utcTime: 0x17
} as const;

const HIGH_BIT = 0x80;
const BYTE_MASK = 0xff;
const BITS_PER_BYTE = 8;
const BASE_128_MASK = 0x7f;
const BASE_128_SHIFT = 7;
const OID_FIRST_MULTIPLIER = 40;
const LONG_FORM_THRESHOLD = 128;
const CONTEXT_CONSTRUCTED = 0xa0;
const DNS_NAME_TAG = 0x82;
const CERTIFICATE_VERSION_V3 = 2;
/** Certificate extensions live in context-specific slot [3]. */
const EXTENSIONS_CONTEXT_INDEX = 3;
const SERIAL_BYTES = 16;
const PEM_LINE_LENGTH = 64;
const UTC_TIME_PIVOT_YEAR = 2000;

const encodeLength = (length: number): Buffer => {
  if (length < LONG_FORM_THRESHOLD) return Buffer.from([length]);
  const bytes: number[] = [];
  let remaining = length;
  while (remaining > 0) {
    bytes.unshift(remaining & BYTE_MASK);
    remaining >>>= BITS_PER_BYTE;
  }
  return Buffer.from([HIGH_BIT | bytes.length, ...bytes]);
};

const tagged = (tag: number, value: Buffer): Buffer =>
  Buffer.concat([Buffer.from([tag]), encodeLength(value.length), value]);

const sequence = (...values: Buffer[]): Buffer =>
  tagged(TAG.sequence, Buffer.concat(values));

const set = (...values: Buffer[]): Buffer =>
  tagged(TAG.set, Buffer.concat(values));

const contextConstructed = (index: number, value: Buffer): Buffer =>
  tagged(CONTEXT_CONSTRUCTED | index, value);

const stripLeadingZeros = (value: Buffer): Buffer => {
  let index = 0;
  while (index < value.length - 1 && value[index] === 0) index += 1;
  return value.subarray(index);
};

/** DER integers are two's complement, so a leading zero keeps them positive. */
const integer = (value: Buffer | number): Buffer => {
  const raw =
    typeof value === "number" ? Buffer.from([value]) : stripLeadingZeros(value);
  const needsPad = ((raw[0] ?? 0) & HIGH_BIT) !== 0;
  return tagged(
    TAG.integer,
    needsPad ? Buffer.concat([Buffer.from([0]), raw]) : raw
  );
};

const objectIdentifier = (dotted: string): Buffer => {
  const parts = dotted.split(".").map(Number);
  const [first = 0, second = 0, ...rest] = parts;
  const bytes: number[] = [first * OID_FIRST_MULTIPLIER + second];
  for (const part of rest) {
    const chunks: number[] = [part & BASE_128_MASK];
    let remaining = part >>> BASE_128_SHIFT;
    while (remaining > 0) {
      chunks.unshift((remaining & BASE_128_MASK) | HIGH_BIT);
      remaining >>>= BASE_128_SHIFT;
    }
    bytes.push(...chunks);
  }
  return tagged(TAG.objectIdentifier, Buffer.from(bytes));
};

const nullValue = (): Buffer => Buffer.from([TAG.null, 0x00]);

const boolean = (value: boolean): Buffer =>
  tagged(TAG.boolean, Buffer.from([value ? BYTE_MASK : 0x00]));

/** BIT STRING carries a leading count of unused trailing bits. */
const bitString = (value: Buffer, unusedBits = 0): Buffer =>
  tagged(TAG.bitString, Buffer.concat([Buffer.from([unusedBits]), value]));

const twoDigits = (value: number): string => String(value).padStart(2, "0");

const utcTime = (date: Date): Buffer => {
  const text =
    twoDigits(date.getUTCFullYear() - UTC_TIME_PIVOT_YEAR) +
    twoDigits(date.getUTCMonth() + 1) +
    twoDigits(date.getUTCDate()) +
    twoDigits(date.getUTCHours()) +
    twoDigits(date.getUTCMinutes()) +
    twoDigits(date.getUTCSeconds()) +
    "Z";
  return tagged(TAG.utcTime, Buffer.from(text, "ascii"));
};

const OID = {
  commonName: "2.5.4.3",
  sha256WithRsa: "1.2.840.113549.1.1.11",
  subjectAltName: "2.5.29.17",
  basicConstraints: "2.5.29.19",
  keyUsage: "2.5.29.15",
  extendedKeyUsage: "2.5.29.37",
  serverAuth: "1.3.6.1.5.5.7.3.1"
} as const;

const commonNameSequence = (commonName: string): Buffer =>
  sequence(
    set(
      sequence(
        objectIdentifier(OID.commonName),
        tagged(TAG.utf8String, Buffer.from(commonName, "utf8"))
      )
    )
  );

const extension = (oid: string, critical: boolean, value: Buffer): Buffer =>
  critical
    ? sequence(
        objectIdentifier(oid),
        boolean(true),
        tagged(TAG.octetString, value)
      )
    : sequence(objectIdentifier(oid), tagged(TAG.octetString, value));

const KEY_USAGE_SIGNATURE_AND_ENCIPHERMENT = 0xa0;
const KEY_USAGE_UNUSED_BITS = 5;

const extensions = (hostname: string): Buffer =>
  contextConstructed(
    EXTENSIONS_CONTEXT_INDEX,
    sequence(
      extension(
        OID.subjectAltName,
        false,
        sequence(tagged(DNS_NAME_TAG, Buffer.from(hostname, "ascii")))
      ),
      extension(OID.basicConstraints, true, sequence()),
      extension(
        OID.keyUsage,
        true,
        bitString(
          Buffer.from([KEY_USAGE_SIGNATURE_AND_ENCIPHERMENT]),
          KEY_USAGE_UNUSED_BITS
        )
      ),
      extension(
        OID.extendedKeyUsage,
        false,
        sequence(objectIdentifier(OID.serverAuth))
      )
    )
  );

const toPem = (der: Buffer, label: string): string => {
  const body = der.toString("base64");
  const lines: string[] = [];
  for (let index = 0; index < body.length; index += PEM_LINE_LENGTH) {
    lines.push(body.slice(index, index + PEM_LINE_LENGTH));
  }
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----\n`;
};

export interface GeneratedCertificate {
  certificatePem: string;
  privateKeyPem: string;
  /** Base64 SHA-256 of the DER certificate: the value the renderer session pins. */
  fingerprint: string;
  notAfter: Date;
}

export interface GenerateCertificateOptions {
  hostname: string;
  validityDays?: number;
  now?: Date;
}

const DEFAULT_VALIDITY_DAYS = 3650;
const MS_PER_DAY = 86_400_000;
const RSA_MODULUS_LENGTH = 2048;
/** Backdated slightly so small clock skew cannot invalidate a fresh certificate. */
const CLOCK_SKEW_ALLOWANCE_MS = 3_600_000;
const HOSTNAME_PATTERN =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

export const generateSelfSignedCertificate = (
  options: GenerateCertificateOptions
): GeneratedCertificate => {
  const { hostname } = options;
  if (!hostname || !HOSTNAME_PATTERN.test(hostname)) {
    throw new Error(`Refusing to issue a certificate for "${hostname}"`);
  }

  const now = options.now ?? new Date();
  const notBefore = new Date(now.getTime() - CLOCK_SKEW_ALLOWANCE_MS);
  const notAfter = new Date(
    now.getTime() + (options.validityDays ?? DEFAULT_VALIDITY_DAYS) * MS_PER_DAY
  );

  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: RSA_MODULUS_LENGTH
  });

  const algorithm = sequence(objectIdentifier(OID.sha256WithRsa), nullValue());
  const name = commonNameSequence(hostname);
  const tbsCertificate = sequence(
    contextConstructed(0, integer(CERTIFICATE_VERSION_V3)),
    integer(randomBytes(SERIAL_BYTES)),
    algorithm,
    name,
    sequence(utcTime(notBefore), utcTime(notAfter)),
    name,
    publicKey.export({ format: "der", type: "spki" }),
    extensions(hostname)
  );

  const signature = sign("sha256", tbsCertificate, privateKey);
  const der = sequence(tbsCertificate, algorithm, bitString(signature));

  return {
    certificatePem: toPem(der, "CERTIFICATE"),
    privateKeyPem: privateKey
      .export({ format: "pem", type: "pkcs8" })
      .toString(),
    fingerprint: createHash("sha256").update(der).digest("base64"),
    notAfter
  };
};

/** Pin value for a certificate we did not just generate, such as one read from disk. */
export const fingerprintOf = (certificatePem: string): string =>
  createHash("sha256")
    .update(new X509Certificate(certificatePem).raw)
    .digest("base64");

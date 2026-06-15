// Offline license verification for VaultData MCP Pro.
// Public key only — licenses are signed by the holder of the matching private key
// (kept off this repo, used by the fulfillment GitHub Action after on-chain payment).
const PUBLIC_JWK = {"kty":"EC","x":"taTqRG_e_uJ7RanuIpodBAU3Z2FY9b8GxBgZgwaPca0","y":"89bnPA_SLkIPBKLc0TJrvMTcV-jaPPOrm4q_B0I9OwQ","crv":"P-256"};

export const PAY = {
  wallet: "0xe339997037C7e1C81829fA3e110d3e82B4bDd48E",
  chain: "Base",
  token: "USDC",
  price: "9",
  contact: "https://github.com/AlexeySamosadov/vaultdata-mcp/issues/new"
};

function fromB(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return new Uint8Array(Buffer.from(s, "base64"));
}

export async function verifyLicense(str) {
  try {
    const [p, sg] = String(str).trim().split(".");
    if (!p || !sg) return null;
    const key = await crypto.subtle.importKey("jwk", PUBLIC_JWK, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, fromB(sg), fromB(p));
    if (!ok) return null;
    return JSON.parse(new TextDecoder().decode(fromB(p)));
  } catch { return null; }
}

// Reads VAULTDATA_LICENSE from the environment. Returns { pro, reason?, email? }.
export async function licenseStatus() {
  const str = process.env.VAULTDATA_LICENSE;
  if (!str) return { pro: false, reason: "no license set (env VAULTDATA_LICENSE)" };
  const pl = await verifyLicense(str);
  if (!pl) return { pro: false, reason: "invalid license" };
  if (pl.exp && Math.floor(Date.now() / 1000) > pl.exp) return { pro: false, reason: "license expired" };
  if (pl.plan !== "pro") return { pro: false, reason: "license is not a Pro plan" };
  return { pro: true, email: pl.email };
}

export function upgradeMessage(reason) {
  return [
    "🔒 This is a VaultData MCP Pro tool.",
    reason ? `(${reason})` : "",
    "",
    `Unlock all Pro tools — one-time ${PAY.price} ${PAY.token} on ${PAY.chain}, no subscription:`,
    `  1. Send ${PAY.price} ${PAY.token} (${PAY.chain}) to: ${PAY.wallet}`,
    `  2. Open an issue with your tx hash + email: ${PAY.contact}`,
    "  3. You'll receive a license key; set it as the VAULTDATA_LICENSE env var and restart.",
    "",
    "The free tools keep working without a license."
  ].filter(Boolean).join("\n");
}

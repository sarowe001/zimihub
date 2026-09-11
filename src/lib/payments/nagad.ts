// Nagad Payment Gateway ইন্টিগ্রেশন (Checkout API)
//
// ⚠️ গুরুত্বপূর্ণ: Nagad মার্চেন্ট অনবোর্ডিং-এর সময় আপনাকে তাদের নিজস্ব
// ইন্টিগ্রেশন ডকুমেন্ট দেবে (URL/ফিল্ড নাম সংস্করণভেদে সামান্য ভিন্ন হতে পারে)।
// এখানে RSA sign/encrypt সহ সাধারণভাবে ব্যবহৃত ফ্লো অনুযায়ী কোড লেখা হয়েছে —
// লাইভ যাওয়ার আগে আপনার মার্চেন্ট ড্যাশবোর্ডের ডকুমেন্টের সাথে endpoint ও
// পেলোড ফিল্ডগুলো মিলিয়ে নিন।
//
// প্রবাহ: initialize -> (challenge পান) -> complete -> callBackUrl-এ ইউজারকে
// পাঠান -> Nagad merchant callback URL-এ ফেরত পাঠায় -> verifyPayment দিয়ে
// নিশ্চিত করুন।

import crypto from "crypto";

function config() {
  const baseUrl = process.env.NAGAD_BASE_URL;
  const merchantId = process.env.NAGAD_MERCHANT_ID;
  const merchantPrivateKey = process.env.NAGAD_MERCHANT_PRIVATE_KEY;
  const pgPublicKey = process.env.NAGAD_PG_PUBLIC_KEY;

  if (!baseUrl || !merchantId || !merchantPrivateKey || !pgPublicKey) {
    throw new Error(
      "Nagad কনফিগারেশন অসম্পূর্ণ — .env-এ NAGAD_* ভ্যারিয়েবলগুলো সেট করুন"
    );
  }

  return {
    baseUrl,
    merchantId,
    merchantPrivateKey: formatPem(merchantPrivateKey, "PRIVATE"),
    pgPublicKey: formatPem(pgPublicKey, "PUBLIC"),
  };
}

// .env-এ multi-line PEM key এক লাইনে (\n escape করে) রাখা সুবিধাজনক
function formatPem(key: string, kind: "PRIVATE" | "PUBLIC") {
  if (key.includes("BEGIN")) return key.replace(/\\n/g, "\n");
  const label = kind === "PRIVATE" ? "PRIVATE KEY" : "PUBLIC KEY";
  const wrapped = key.match(/.{1,64}/g)?.join("\n") ?? key;
  return `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----`;
}

function sign(plainText: string, privateKey: string) {
  const signer = crypto.createSign("SHA256");
  signer.update(plainText);
  signer.end();
  return signer.sign(privateKey, "base64");
}

function encrypt(plainText: string, publicKey: string) {
  return crypto
    .publicEncrypt(
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(plainText)
    )
    .toString("base64");
}

function decrypt(cipherText: string, privateKey: string) {
  return crypto
    .privateDecrypt(
      { key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(cipherText, "base64")
    )
    .toString("utf-8");
}

function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export async function initializeNagadPayment(params: {
  orderId: string;
  clientIp: string;
}) {
  const { baseUrl, merchantId, merchantPrivateKey, pgPublicKey } = config();
  const dateTime = nowStamp();
  const challenge = crypto.randomBytes(20).toString("hex");

  const plainSensitive = JSON.stringify({
    merchantId,
    datetime: dateTime,
    orderId: params.orderId,
    challenge,
  });

  const body = {
    accountNumber: "",
    dateTime,
    sensitiveData: encrypt(plainSensitive, pgPublicKey),
    signature: sign(plainSensitive, merchantPrivateKey),
  };

  const res = await fetch(
    `${baseUrl}/api/dfs/check-out/initialize/${merchantId}/${params.orderId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-KM-Api-Version": "v-0.2.0",
        "X-KM-IP-V4": params.clientIp,
        "X-KM-Client-Type": "PC_WEB",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error(`Nagad initialize ব্যর্থ হয়েছে: ${res.status}`);
  }

  const data = (await res.json()) as { sensitiveData: string; signature: string };
  const decrypted = JSON.parse(decrypt(data.sensitiveData, merchantPrivateKey)) as {
    paymentReferenceId: string;
    challenge: string;
  };

  return decrypted;
}

export async function completeNagadPayment(params: {
  paymentReferenceId: string;
  orderId: string;
  amountTaka: number;
  challenge: string;
  clientIp: string;
}) {
  const { baseUrl, merchantId, merchantPrivateKey, pgPublicKey } = config();

  const plainSensitive = JSON.stringify({
    merchantId,
    orderId: params.orderId,
    currencyCode: "050",
    amount: params.amountTaka.toFixed(2),
    challenge: params.challenge,
    merchantCallbackURL: process.env.NAGAD_CALLBACK_URL,
  });

  const body = {
    sensitiveData: encrypt(plainSensitive, pgPublicKey),
    signature: sign(plainSensitive, merchantPrivateKey),
    merchantCallbackURL: process.env.NAGAD_CALLBACK_URL,
  };

  const res = await fetch(
    `${baseUrl}/api/dfs/check-out/complete/${params.paymentReferenceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-KM-Api-Version": "v-0.2.0",
        "X-KM-IP-V4": params.clientIp,
        "X-KM-Client-Type": "PC_WEB",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error(`Nagad complete ব্যর্থ হয়েছে: ${res.status}`);
  }

  const data = (await res.json()) as { callBackUrl?: string };
  return data;
}

export async function verifyNagadPayment(paymentReferenceId: string) {
  const { baseUrl } = config();

  const res = await fetch(`${baseUrl}/api/dfs/verify/payment/${paymentReferenceId}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Nagad verify ব্যর্থ হয়েছে: ${res.status}`);
  }

  return (await res.json()) as {
    status: string;
    amount?: string;
    issuerPaymentRefNo?: string;
  };
}

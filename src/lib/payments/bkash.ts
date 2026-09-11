// bKash Tokenized Checkout API ইন্টিগ্রেশন
// ডকুমেন্টেশন ও sandbox credential: https://developer.bka.sh/
//
// প্রবাহ: token নিন -> createPayment (ইউজারকে bkashURL-এ পাঠান)
// -> bKash callbackURL-এ ফেরত পাঠায় -> executePayment দিয়ে নিশ্চিত করুন।

type TokenResponse = {
  id_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

function config() {
  const baseUrl = process.env.BKASH_BASE_URL;
  const appKey = process.env.BKASH_APP_KEY;
  const appSecret = process.env.BKASH_APP_SECRET;
  const username = process.env.BKASH_USERNAME;
  const password = process.env.BKASH_PASSWORD;

  if (!baseUrl || !appKey || !appSecret || !username || !password) {
    throw new Error(
      "bKash কনফিগারেশন অসম্পূর্ণ — .env-এ BKASH_* ভ্যারিয়েবলগুলো সেট করুন"
    );
  }

  return { baseUrl, appKey, appSecret, username, password };
}

async function grantToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const { baseUrl, appKey, appSecret, username, password } = config();

  const res = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      username,
      password,
    },
    body: JSON.stringify({ app_key: appKey, app_secret: appSecret }),
  });

  if (!res.ok) {
    throw new Error(`bKash token গ্রহণ ব্যর্থ হয়েছে: ${res.status}`);
  }

  const data = (await res.json()) as TokenResponse;
  cachedToken = {
    token: data.id_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.id_token;
}

export async function createBkashPayment(params: {
  amountTaka: number;
  merchantInvoiceNumber: string;
  payerReference: string;
}) {
  const { baseUrl, appKey } = config();
  const token = await grantToken();

  const res = await fetch(`${baseUrl}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token,
      "X-App-Key": appKey,
    },
    body: JSON.stringify({
      mode: "0011",
      payerReference: params.payerReference,
      callbackURL: process.env.BKASH_CALLBACK_URL,
      amount: params.amountTaka.toFixed(2),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: params.merchantInvoiceNumber,
    }),
  });

  if (!res.ok) {
    throw new Error(`bKash পেমেন্ট তৈরি ব্যর্থ হয়েছে: ${res.status}`);
  }

  const data = (await res.json()) as {
    paymentID: string;
    bkashURL: string;
    statusCode: string;
    statusMessage: string;
  };

  if (data.statusCode !== "0000") {
    throw new Error(data.statusMessage || "bKash পেমেন্ট তৈরি ব্যর্থ হয়েছে");
  }

  return data;
}

export async function executeBkashPayment(paymentID: string) {
  const { baseUrl, appKey } = config();
  const token = await grantToken();

  const res = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token,
      "X-App-Key": appKey,
    },
    body: JSON.stringify({ paymentID }),
  });

  const data = (await res.json()) as {
    statusCode: string;
    statusMessage: string;
    paymentID: string;
    trxID?: string;
    transactionStatus?: string;
    amount?: string;
  };

  return data;
}

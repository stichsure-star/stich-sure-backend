const axios = require("axios");

const getKoraBaseUrl = () =>
  process.env.KORAPAY_BASE_URL || "https://api.korapay.com/merchant/api/v1";

const getKoraSecretKey = () =>
  process.env.KORA_SECRET_KEY || process.env.KORAPAY_SECRET_KEY || "";

const getKoraHeaders = () => ({
  Authorization: `Bearer ${getKoraSecretKey()}`,
  "Content-Type": "application/json",
});

const getBanks = async (countryCode = "NG") => {
  const response = await axios.get(`${getKoraBaseUrl()}/misc/banks`, {
    params: { countryCode },
    headers: getKoraHeaders(),
  });

  return response.data;
};

const normalizeBankName = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/\bbank\b/g, "")
    .replace(/\bnigeria\b/g, "")
    .replace(/[^a-z0-9]/g, "");

const findBank = async ({ bankName, bankCode, countryCode = "NG" }) => {
  const result = await getBanks(countryCode);
  const banks = result.data || [];

  if (bankCode) {
    const byCode = banks.find(
      (bank) => String(bank.code) === String(bankCode)
    );
    if (byCode) {
      return byCode;
    }
  }

  if (!bankName) {
    return null;
  }

  const normalizedInput = normalizeBankName(bankName);

  const exactMatch = banks.find(
    (bank) => normalizeBankName(bank.name) === normalizedInput
  );
  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = banks.find((bank) => {
    const normalizedBank = normalizeBankName(bank.name);
    return (
      normalizedBank.includes(normalizedInput) ||
      normalizedInput.includes(normalizedBank)
    );
  });

  return partialMatch || null;
};

const resolveWalletBankDetails = async ({
  bankName,
  bankCode,
  accountNumber,
  accountName,
  countryCode = "NG",
}) => {
  const bank = await findBank({ bankName, bankCode, countryCode });

  if (!bank) {
    throw new Error(
      bankName
        ? `Could not find a bank matching "${bankName}". Use GET /designerWallet/banks to see valid bank names.`
        : "Bank name or bank code is required."
    );
  }

  let resolvedAccountName = accountName;

  if (!resolvedAccountName) {
    const resolved = await resolveBankAccount({
      bank: bank.code,
      account: accountNumber,
      currency: "NGN",
    });

    resolvedAccountName =
      resolved.data?.account_name ||
      resolved.data?.accountName ||
      resolved.data?.account_name;

    if (!resolvedAccountName) {
      throw new Error(
        "Could not resolve account name automatically. Please provide accountName."
      );
    }
  }

  return {
    bankName: bank.name,
    bankCode: String(bank.code),
    accountNumber,
    accountName: resolvedAccountName,
  };
};

const resolveBankAccount = async ({ bank, account, currency }) => { 
  const response = await axios.post(
    `${getKoraBaseUrl()}/misc/banks/resolve`,
    { bank, account, currency },                
    { headers: getKoraHeaders() }
  );

  return response.data;
};                                             


const initiateBankPayout = async ({
  reference,
  amount,
  bankCode,
  accountNumber,
  customerName,
  customerEmail,
  narration = "StitchSure designer withdrawal",
}) => {
  const response = await axios.post(
    `${getKoraBaseUrl()}/transactions/disburse`,
    {
      reference,
      destination: {
        type: "bank_account",
        amount,
        currency: "NGN",
        narration,
        bank_account: {
          bank: bankCode,
          account: accountNumber,
        },
        customer: {
          name: customerName,
          email: customerEmail,
        },
      },
    },
    { headers: getKoraHeaders() }
  );

  return response.data;
};

const verifyPayout = async (reference) => {
  const response = await axios.get(
    `${getKoraBaseUrl()}/transactions/${reference}`,
    { headers: getKoraHeaders() }
  );

  return response.data;
};

module.exports = {
  getKoraSecretKey,
  getBanks,
  findBank,
  resolveWalletBankDetails,
  resolveBankAccount,
  initiateBankPayout,
  verifyPayout,
};

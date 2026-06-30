const axios = require("axios");

const getFlwBaseUrl = () =>
    process.env.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";

const getFlwSecretKey = () => process.env.FLUTTERWAVE_SECRET_KEY;

const getFlwHeaders = () => ({
    Authorization: `Bearer ${getFlwSecretKey()}`,
    "Content-Type": "application/json",
});

const getBanks = async (countryCode = "NG") => {
    console.log("Flutterwave key:", getFlwSecretKey()?.slice(0, 15) + "...");
    console.log("Flutterwave URL:", `${getFlwBaseUrl()}/banks/${countryCode}`);

    const response = await axios.get(`${getFlwBaseUrl()}/banks/${countryCode}`, {
        headers: getFlwHeaders(),
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
        const byCode = banks.find((bank) => String(bank.code) === String(bankCode));
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
                ? `Could not find a bank matching "${bankName}".`
                : "Bank name or bank code is required."
        );
    }

    let resolvedAccountName = accountName;

    if (!resolvedAccountName) {
        const resolved = await resolveBankAccount({
            account_bank: bank.code,
            account_number: accountNumber,
        });

        resolvedAccountName = resolved.data?.account_name;

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

const resolveBankAccount = async ({ account_bank, account_number }) => {
    const response = await axios.post(
        `${getFlwBaseUrl()}/accounts/resolve`,
        { account_bank, account_number },
        { headers: getFlwHeaders() }
    );

    return response.data;
};

const initiateBankPayout = async ({
    reference,
    amount,
    bankCode,
    accountNumber,
    narration = "StitchSure designer withdrawal",
}) => {
    const response = await axios.post(
        `${getFlwBaseUrl()}/transfers`,
        {
            account_bank: bankCode,
            account_number: accountNumber,
            amount: amount,
            narration: narration,
            currency: "NGN",
            reference: reference,
        },
        { headers: getFlwHeaders() }
    );

    return response.data;
};

const verifyPayout = async (id) => {
    const response = await axios.get(`${getFlwBaseUrl()}/transfers/${id}`, {
        headers: getFlwHeaders(),
    });

    return response.data;
};

module.exports = {
    getFlwSecretKey,
    getBanks,
    findBank,
    resolveWalletBankDetails,
    resolveBankAccount,
    initiateBankPayout,
    verifyPayout,
};

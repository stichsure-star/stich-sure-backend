const normalizePhoneNumber = (phone) => {
  if (!phone) return null;

  const value = String(phone).trim();
  if (!value) return null;

  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  if (value.startsWith("+234")) return `+${digits}`;
  if (value.startsWith("234")) return `+${digits}`;
  if (value.startsWith("0")) return `+234${digits.slice(1)}`;

  return `+${digits}`;
};

const getDesignerContactDetails = (designerProfile, designer) => {
  const profilePhone = designerProfile?.phoneNumber || designerProfile?.phone;
  const profileAddress = designerProfile?.address;

  return {
    phone: normalizePhoneNumber(profilePhone || designer?.phone || null),
    address: String(profileAddress || designer?.address || "").trim() || null,
  };
};

module.exports = {
  getDesignerContactDetails,
  normalizePhoneNumber,
};

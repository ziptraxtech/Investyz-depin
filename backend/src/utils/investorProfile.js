const INVESTOR_PROFILE_OPTIONS = [
  {
    value: 'domestic',
    label: 'Domestic investor',
    description: 'I am a resident of India investing from within India.',
    paymentMethod: 'gateway',
    paymentLabel: 'Fiat payment',
    paymentHint: 'Use UPI, cards, debit cards, credit cards, and net banking.',
    availability: 'live',
  },
  {
    value: 'international',
    label: 'International investor',
    description: 'I am investing from outside India or as a non-Indian resident.',
    paymentMethod: 'crypto',
    paymentLabel: 'Crypto payment',
    paymentHint: 'International wallet-based payments are being prepared and are not live yet.',
    availability: 'coming_soon',
  },
];

const getInvestorProfileOptions = () => INVESTOR_PROFILE_OPTIONS;

const getInvestorProfileLabel = (value) =>
  INVESTOR_PROFILE_OPTIONS.find((option) => option.value === value)?.label || 'Investor profile';

const getAllowedPaymentMethodForInvestorProfile = (value) => {
  const matched = INVESTOR_PROFILE_OPTIONS.find((option) => option.value === value);
  return matched ? [matched.paymentMethod] : [];
};

module.exports = {
  INVESTOR_PROFILE_OPTIONS,
  getInvestorProfileOptions,
  getInvestorProfileLabel,
  getAllowedPaymentMethodForInvestorProfile,
};

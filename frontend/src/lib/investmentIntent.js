const INVESTMENT_INTENT_KEY = 'investyz_pending_investment';

const canUseSessionStorage = () => typeof window !== 'undefined' && Boolean(window.sessionStorage);

export const saveInvestmentIntent = (intent) => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(INVESTMENT_INTENT_KEY, JSON.stringify(intent));
};

export const getInvestmentIntent = () => {
  if (!canUseSessionStorage()) return null;

  const raw = window.sessionStorage.getItem(INVESTMENT_INTENT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    window.sessionStorage.removeItem(INVESTMENT_INTENT_KEY);
    return null;
  }
};

export const clearInvestmentIntent = () => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(INVESTMENT_INTENT_KEY);
};

export const buildInvestmentReturnPath = ({
  segmentId,
  planId,
  amount,
  resumePayment = false,
}) => {
  const params = new URLSearchParams();

  if (planId) params.set('plan', planId);
  if (amount) params.set('amount', String(amount));
  if (resumePayment) params.set('resumePayment', '1');

  const query = params.toString();
  return `/segments/${segmentId}${query ? `?${query}` : ''}`;
};

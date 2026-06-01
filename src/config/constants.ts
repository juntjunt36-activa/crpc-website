// Pricing formula: V = a × (J − b)^c   (J is the USD-converted point balance)
// Defaults below are the current production values.
// Override via NEXT_PUBLIC_PRICE_PARAM_{A,B,C} env vars without code changes.
// Revision history:
//   2026-05-23: a=6.300788e-3, b=0,     c=0.366768  (initial)
//   2026-05-24: a=6.699e-5,    b=-1e8,  c=0.5215    ($1 floor at J=0)
//   2026-05-24: a=9.215e-6,    b=-1e6,  c=0.5056    (current — sub-dollar curve, $0.01 floor)
export const DEFAULT_PRICE_PARAM_A = 9.215e-6; // 0.000009215
export const DEFAULT_PRICE_PARAM_B = -1e6; // -1,000,000
export const DEFAULT_PRICE_PARAM_C = 0.5056;

export const PRICE_PARAM_A = Number(
  process.env.NEXT_PUBLIC_PRICE_PARAM_A ?? DEFAULT_PRICE_PARAM_A,
);
export const PRICE_PARAM_B = Number(
  process.env.NEXT_PUBLIC_PRICE_PARAM_B ?? DEFAULT_PRICE_PARAM_B,
);
export const PRICE_PARAM_C = Number(
  process.env.NEXT_PUBLIC_PRICE_PARAM_C ?? DEFAULT_PRICE_PARAM_C,
);

export const CRPC_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CRPC_CONTRACT_ADDRESS ??
  '0x61c4d061149fd7a559e021c8dffcfb364ffded1a';

export const CRPC_TOTAL_SUPPLY = 60_000_000_000;

export const DIGIFINEX_SYMBOL = process.env.DIGIFINEX_SYMBOL ?? 'crpc_usdt';

export const ETHERSCAN_BASE_URL = 'https://etherscan.io';

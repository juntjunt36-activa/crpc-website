export const siteConfig = {
  name: 'CRPC',
  title: 'CRPC — Reserve-Backed Self-Adjusting Utility',
  description:
    'CRPC (CryptPointToken) transparency dashboard for global investors. View theoretical price, point balance, and DigiFinex market price in real time.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://crpc.example.com',
  ogImage: '/og.png',
  digifinexTradeUrl: 'https://www.digifinex.com/en-ww/trade/USDT/CRPC',
} as const;

import 'server-only';
import { CRPC_CONTRACT_ADDRESS, ETHERSCAN_BASE_URL } from '@/config/constants';

const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';
const FETCH_TIMEOUT_MS = 5_000;

export const contractUrl = (address: string = CRPC_CONTRACT_ADDRESS) =>
  `${ETHERSCAN_BASE_URL}/address/${address}`;

export const txUrl = (hash: string) => `${ETHERSCAN_BASE_URL}/tx/${hash}`;

// Returns ERC-20 balance (raw integer string in token base units) for a given holder.
// Caller is responsible for decimal scaling.
export async function fetchTokenBalance(params: {
  contract?: string;
  holder: string;
}): Promise<string> {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    throw new Error('ETHERSCAN_API_KEY is not set');
  }

  const url = new URL(ETHERSCAN_API_URL);
  url.searchParams.set('module', 'account');
  url.searchParams.set('action', 'tokenbalance');
  url.searchParams.set(
    'contractaddress',
    params.contract ?? CRPC_CONTRACT_ADDRESS,
  );
  url.searchParams.set('address', params.holder);
  url.searchParams.set('tag', 'latest');
  url.searchParams.set('apikey', apiKey);

  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Etherscan HTTP ${res.status}`);
  }

  const data = (await res.json()) as { status: string; result: string };
  if (data.status !== '1') {
    throw new Error(`Etherscan error: ${data.result}`);
  }
  return data.result;
}

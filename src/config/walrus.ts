import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { getFullnodeUrl } from '@mysten/sui/client';
import { walrus, WalrusFile } from '@mysten/walrus';
import { fromBase64 } from '@mysten/sui/utils';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';

const client = new SuiJsonRpcClient({
  url: getFullnodeUrl('testnet'),
  network: 'testnet',
}).$extend(
  walrus({
    uploadRelay: {
      host: 'https://publisher.walrus-testnet.walrus.space',
      sendTip: { max: 105 }, // ← THIS FIXES EVERYTHING
    },
    wasmUrl: walrusWasmUrl,
    storageNodeClientOptions: {
      timeout: 60_000,
    }
  }),
);

export async function uploadToWalrus(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const walrusFile = WalrusFile.from({
    contents: uint8Array,
    identifier: file.name,
    tags: {
      'content-type': file.type || 'application/octet-stream',
    },
  });

  const PRIVATE_KEY = import.meta.env.VITE_SUI_PRIVATE_KEY;
  if (!PRIVATE_KEY) throw new Error('VITE_SUI_PRIVATE_KEY missing in .env');

  const decodedKey = fromBase64(PRIVATE_KEY);
  const secretKey32 = decodedKey.length > 32 ? decodedKey.slice(0, 32) : decodedKey;
  const keypair = Ed25519Keypair.fromSecretKey(secretKey32);

  const results = await client.walrus.writeFiles({
    files: [walrusFile],
    epochs: 1,
    deletable: true,
    signer: keypair,
  });

  return results[0].blobId;
}

export function getWalrusUrl(blobId: string): string {
  return `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`;
}
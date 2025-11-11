// src/config/networkConfig.ts
import { getFullnodeUrl } from '@mysten/sui/client';
import { createNetworkConfig } from '@mysten/dapp-kit';

const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  mainnet: {
    url: getFullnodeUrl('mainnet'),
    variables: {
      dropforgePackageId: import.meta.env.VITE_DROPFORGE_PACKAGE_ID_MAINNET,
      dropforgeRegistryId: import.meta.env.VITE_DROPFORGE_REGISTRY_ID_MAINNET,
    },
  },
  testnet: {
    url: getFullnodeUrl('testnet'),
    variables: {
      dropforgePackageId: '0x2bd2a7084231947dc4b345739a571eaa2dc5f9b44d9147fcfdcdb7a4e78f06ac',
      dropforgeRegistryId: '0x273580a8680889e08159ea55be20686e13f53b299a37e8b2daa4c676cb0dfe3f',
    },
  },
  devnet: {
    url: getFullnodeUrl('devnet'),
    variables: {
      dropforgePackageId: import.meta.env.VITE_DROPFORGE_PACKAGE_ID_DEVNET,
      dropforgeRegistryId: import.meta.env.VITE_DROPFORGE_REGISTRY_ID_DEVNET,
    },
  },
});

export { useNetworkVariable, useNetworkVariables, networkConfig };
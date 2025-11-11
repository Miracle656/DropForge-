import { motion } from 'framer-motion';
import { useSuiClientQuery, useCurrentAccount } from '@mysten/dapp-kit';
import { useNetworkVariable } from '../config/sui';
import { Loader2, ExternalLink, Copy } from 'lucide-react';
import { useState } from 'react';

export function Collections() {
  const packageId = useNetworkVariable('dropforgePackageId');
  const registryId = useNetworkVariable('dropforgeRegistryId');
  const account = useCurrentAccount();

  const { data, isLoading, isError, error } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      options: { showContent: true, showDisplay: true },
    }
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (isError) return <div>Error: {error?.message}</div>;

  const collections = data?.data?.map((item: any) => item.data) || [];

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); // reset after 2s
  };

  const shortenId = (id: string) => {
    if (!id) return '';
    return `${id.slice(0, 6)}...${id.slice(-6)}`;
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            NFT Collections
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Explore and discover all owned objects on Sui
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
          ) : collections.length === 0 ? (
            <p className="text-center text-gray-500">No objects found.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collections.map((obj: any, index: number) => {
                const collectionName =
                  obj?.display?.data?.name || obj?.content?.data?.name || obj.type || 'Unnamed Object';
                const shortId = shortenId(obj.objectId);

                return (
                  <motion.div
                    key={obj.objectId || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-gray-200 group"
                  >
                    <div className="aspect-square bg-gradient-to-br from-blue-400 to-cyan-400 relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-white/20 backdrop-blur-md rounded-lg p-3">
                          <p className="text-white font-bold text-lg">
                            Object #{index + 1}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 text-gray-900">{collectionName}</h3>

                      <div className="text-gray-600 mb-4 text-sm leading-relaxed flex items-center justify-between">
                        <div>
                          Object ID: <span className="font-mono">{shortId}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(obj.objectId)}
                          className="ml-2 text-gray-500 hover:text-gray-900"
                          title={copiedId === obj.objectId ? 'Copied!' : 'Copy Object ID'}
                        >
                          <Copy className="w-4 h-4 inline-block" />
                        </button>
                      </div>

                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        Version: {obj.version} <br />
                        Public Transfer: {obj.hasPublicTransfer ? 'Yes' : 'No'} <br />
                        Type: {obj.type}
                      </p>

                      <div className="overflow-x-auto bg-gray-50 p-2 rounded-lg mb-4">
                        <pre className="text-xs">
                          {JSON.stringify(obj?.content?.data, null, 2)}
                        </pre>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2">
                          View
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

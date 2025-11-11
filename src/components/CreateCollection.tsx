import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from '../config/sui';
import { Loader2, CheckCircle2 } from 'lucide-react';

const toUtf8Bytes = (str: string): number[] => Array.from(new TextEncoder().encode(str));

export function CreateCollection() {
  const account = useCurrentAccount();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxSupply: '',
    royaltyBps: '',
    baseUri: '',
    mintPrice: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable('dropforgePackageId');
  const registryId = useNetworkVariable('dropforgeRegistryId');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert('Connect wallet');
    if (!registryId) return alert('Registry not loaded');

    // Validate inputs
    if (!formData.name.trim()) return alert('Name is required');
    if (!formData.maxSupply || Number(formData.maxSupply) <= 0) return alert('Max supply must be > 0');
    if (Number(formData.royaltyBps) > 10000) return alert('Royalty max 10000 bps');

    setIsCreating(true);
    setSuccess(false);

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${packageId}::dropforge::create_collection`,
        arguments: [
          tx.object(registryId),
          tx.pure.vector('u8', toUtf8Bytes(formData.name)),
          tx.pure.vector('u8', toUtf8Bytes(formData.description)),
          tx.pure.u64(BigInt(formData.maxSupply)),
          tx.pure.u16(Number(formData.royaltyBps)),
          tx.pure.vector('u8', toUtf8Bytes(formData.baseUri)),
          tx.pure.u64(BigInt(formData.mintPrice)),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await suiClient.waitForTransaction({ digest: result.digest });
            setSuccess(true);
            setFormData({
              name: '', description: '', maxSupply: '', royaltyBps: '', baseUri: '', mintPrice: '',
            });
            setTimeout(() => setSuccess(false), 3000);
          },
          onError: (err) => {
            console.error(err);
            alert('Failed: ' + (err.message || 'Try again'));
          },
        }
      );
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-10"
        >
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Create Collection
          </h2>
          <p className="text-gray-600 mb-8">
            Launch your NFT collection on Sui Testnet
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                placeholder="My Amazing Collection"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                rows={4}
                placeholder="Describe your collection..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Supply
                </label>
                <input
                  type="number"
                  required
                  value={formData.maxSupply}
                  onChange={(e) => setFormData({ ...formData, maxSupply: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Royalty (basis points, max 10000)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="10000"
                  value={formData.royaltyBps}
                  onChange={(e) => setFormData({ ...formData, royaltyBps: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URI
              </label>
              <input
                type="url"
                required
                value={formData.baseUri}
                onChange={(e) => setFormData({ ...formData, baseUri: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                placeholder="https://yourdomain.com/metadata/"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mint Price (MIST)
              </label>
              <input
                type="number"
                required
                value={formData.mintPrice}
                onChange={(e) => setFormData({ ...formData, mintPrice: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                placeholder="1000000000"
              />
              <p className="text-xs text-gray-500 mt-1">1 SUI = 1,000,000,000 MIST</p>
            </div>

            <button
              type="submit"
              disabled={isCreating || !account}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Collection...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Collection Created!
                </>
              ) : (
                'Create Collection'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
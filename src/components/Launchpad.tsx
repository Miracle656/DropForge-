import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from '../config/sui';
import { uploadToWalrus, getWalrusUrl } from '../config/walrus';
import { Loader2, CheckCircle2, Rocket, Upload } from 'lucide-react';

export function Launchpad() {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: '9',
    iconUrl: '',
  });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [success, setSuccess] = useState(false);

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable('dropforgePackageId');

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadIcon = async () => {
    if (!iconFile) return;

    setIsUploading(true);
    try {
      const blobId = await uploadToWalrus(iconFile);
      const iconUrl = getWalrusUrl(blobId);
      setFormData({ ...formData, iconUrl });
      alert('Icon uploaded to Walrus successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload icon to Walrus');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // if (!formData.iconUrl) {
    //   alert('Please upload an icon first');
    //   return;
    // }

    setIsLaunching(true);
    setSuccess(false);

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${packageId}::dropforge::launch_coin`,
        arguments: [
          tx.pure.string(formData.name),
          tx.pure.string(formData.symbol),
          tx.pure.u8(parseInt(formData.decimals)),
          tx.pure.string(formData.iconUrl),
        ],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            await suiClient.waitForTransaction({
              digest: result.digest,
            });
            setSuccess(true);
            setFormData({
              name: '',
              symbol: '',
              decimals: '9',
              iconUrl: '',
            });
            setIconFile(null);
            setIconPreview('');
            setTimeout(() => setSuccess(false), 3000);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('Failed to launch token');
          },
        }
      );
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to launch token');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gradient-to-br from-cyan-50 via-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full mb-6">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Token Launchpad
          </h2>
          <p className="text-xl text-gray-600">
            Launch your own token on Sui blockchain
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl p-10"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Icon
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-cyan-500 transition-colors">
                {iconPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={iconPreview}
                      alt="Icon preview"
                      className="w-32 h-32 rounded-full mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIconFile(null);
                        setIconPreview('');
                        setFormData({ ...formData, iconUrl: '' });
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <Upload className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-2">Upload token icon</p>
                    <p className="text-sm text-gray-400">PNG, JPG recommended 512x512</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {iconFile && !formData.iconUrl && (
                <button
                  type="button"
                  onClick={handleUploadIcon}
                  disabled={isUploading}
                  className="mt-4 w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading to Walrus...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload to Walrus
                    </>
                  )}
                </button>
              )}

              {formData.iconUrl && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-800">✓ Icon uploaded to Walrus</p>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none"
                  placeholder="My Token"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol
                </label>
                <input
                  type="text"
                  required
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none"
                  placeholder="MTK"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decimals (0-18)
              </label>
              <input
                type="number"
                required
                min="0"
                max="18"
                value={formData.decimals}
                onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none"
                placeholder="9"
              />
            </div>

            <button
              type="submit"
              // disabled={isLaunching || !formData.iconUrl}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Launching Token...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Token Launched!
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Launch Token
                </>
              )}
            </button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          {[
            { label: 'Decentralized Storage', value: 'Walrus' },
            { label: 'Network', value: 'Sui' },
            { label: 'Launch Fee', value: 'Gas Only' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <p className="text-gray-500 text-sm mb-2">{stat.label}</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from '../config/sui';
import { uploadToWalrus, getWalrusUrl } from '../config/walrus';
import { Loader2, CheckCircle2, Upload, Image as ImageIcon } from 'lucide-react';

export function MintNFT() {
  const [formData, setFormData] = useState({
    collectionId: '',
    name: '',
    description: '',
    recipient: '',
    mintPrice: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [blobId, setBlobId] = useState<string>('');

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable('dropforgePackageId');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadToWalrus = async () => {
    if (!imageFile) return;

    setIsUploading(true);
    try {
      const blobIdResult = await uploadToWalrus(imageFile);
      setBlobId(blobIdResult);
      alert(`Image uploaded to Walrus! Blob ID: ${blobIdResult}`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image to Walrus');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // if (!blobId) {
    //   alert('Please upload image to Walrus first');
    //   return;
    // }

    setIsMinting(true);
    setSuccess(false);

    try {
      const imageUrl = getWalrusUrl(blobId);
      const tx = new Transaction();

      const [coin] = tx.splitCoins(tx.gas, [parseInt(formData.mintPrice)]);

      tx.moveCall({
        target: `${packageId}::dropforge::mint_nft`,
        arguments: [
          tx.object(formData.collectionId),
          tx.pure.string(formData.name),
          tx.pure.string(formData.description),
          tx.pure.string(imageUrl),
          coin,
          tx.pure.address(formData.recipient),
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
              collectionId: '',
              name: '',
              description: '',
              recipient: '',
              mintPrice: '',
            });
            setImageFile(null);
            setImagePreview('');
            setBlobId('');
            setTimeout(() => setSuccess(false), 3000);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('Failed to mint NFT');
          },
        }
      );
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gradient-to-br from-cyan-50 to-white">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-10"
        >
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Mint NFT
          </h2>
          <p className="text-gray-600 mb-8">
            Upload image to Walrus and mint your NFT
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Upload
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-cyan-500 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setBlobId('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">Click to upload image</p>
                    <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {imageFile && !blobId && (
                <button
                  type="button"
                  onClick={handleUploadToWalrus}
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

              {blobId && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-800">
                    ✓ Image uploaded to Walrus
                  </p>
                  <p className="text-xs text-green-600 mt-1 break-all">
                    Blob ID: {blobId}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection ID
              </label>
              <input
                type="text"
                required
                value={formData.collectionId}
                onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none"
                placeholder="0x..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NFT Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none"
                  placeholder="Cool NFT #1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  required
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none"
                  placeholder="0x..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none resize-none"
                rows={3}
                placeholder="Describe your NFT..."
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
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none"
                placeholder="1000000000"
              />
            </div>

            <button
              type="submit"
              // disabled={isMinting || !blobId}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isMinting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Minting NFT...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  NFT Minted!
                </>
              ) : (
                'Mint NFT'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

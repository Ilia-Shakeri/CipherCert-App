import { useState } from 'react';
import { Heart, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';

// Import your crypto logos from the assets directory
// Adjust the path based on where your assets folder is located
import btcLogo from '../assets/logo.png';
import ethLogo from '../assets/logo.png';
import usdtLogo from '../assets/logo.png';
import xmrLogo from '../assets/logo.png';

/**
 * DonatePage Component
 *
 * To customize crypto logos:
 * 1. Place logo images in the /assets directory
 * 2. Import them at the top of this file
 * 3. Use the imported logo in the logoUrl property
 * 4. Supported formats: PNG, SVG, JPG, WebP
 */

interface DonatePageProps {
  isDark: boolean;
}

interface CryptoCard {
  id: string;
  name: string;
  symbol: string;
  address: string;
  network: string;
  color: string;
  gradient: string;
  logo: string;
  logoType?: 'text' | 'svg' | 'image';
  logoUrl?: string;
}

export function DonatePage({ isDark }: DonatePageProps) {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [copiedCard, setCopiedCard] = useState<string | null>(null);

  const cryptoCards: CryptoCard[] = [
    {
      id: 'btc',
      name: 'Bitcoin',
      symbol: 'BTC',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      network: 'Bitcoin Network',
      color: '#F7931A',
      gradient:
        'linear-gradient(135deg, rgba(247, 147, 26, 0.3), rgba(247, 147, 26, 0.1))',
      logo: '₿',
      logoUrl: btcLogo,
    },
    {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      network: 'ERC-20',
      color: '#627EEA',
      gradient:
        'linear-gradient(135deg, rgba(98, 126, 234, 0.3), rgba(98, 126, 234, 0.1))',
      logo: 'Ξ',
      logoUrl: ethLogo,
    },
    {
      id: 'usdt',
      name: 'Tether',
      symbol: 'USDT',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      network: 'ERC-20',
      color: '#26A17B',
      gradient:
        'linear-gradient(135deg, rgba(38, 161, 123, 0.3), rgba(38, 161, 123, 0.1))',
      logo: '₮',
      logoUrl: usdtLogo,
    },
    {
      id: 'xmr',
      name: 'Monero',
      symbol: 'XMR',
      address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx',
      network: 'Monero Network',
      color: '#FF6600',
      gradient:
        'linear-gradient(135deg, rgba(255, 102, 0, 0.3), rgba(255, 102, 0, 0.1))',
      logo: 'ɱ',
      logoUrl: xmrLogo,
    },
  ];

  const handleCardClick = (cardId: string) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleCopy = async (
    address: string,
    cardId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopiedCard(cardId);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopiedCard(null), 2000);
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="max-w-6xl w-full">
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          {/* Glowing Heart Icon */}
          <motion.div
            className="inline-block mb-6"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div
              className="relative inline-flex items-center justify-center"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(239, 68, 68, 0.6))',
              }}
            >
              <Heart
                className="w-24 h-24"
                style={{
                  color: '#EF4444',
                  fill: '#EF4444',
                }}
              />
              {/* Pulse rings */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              >
                <div
                  className="w-24 h-24 rounded-full border-2"
                  style={{ borderColor: '#EF4444' }}
                />
              </motion.div>
            </div>
          </motion.div>

          <h1
            className="mb-4"
            style={{
              color: isDark ? '#FFFFFF' : '#0F172A',
              fontSize: '48px',
              fontWeight: 'bold',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '-0.02em',
            }}
          >
            Support Development
          </h1>
          <p
            className="text-xl"
            style={{
              color: isDark ? '#94A3B8' : '#64748B',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Your contribution keeps the servers running and development active
          </p>

          {/* Decorative glow */}
          <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(239, 68, 68, 0.15), transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
        </div>

        {/* Crypto Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 perspective-1000">
          {cryptoCards.map((crypto) => (
            <motion.div
              key={crypto.id}
              className="relative h-[420px] cursor-pointer"
              onClick={() => handleCardClick(crypto.id)}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              style={{ perspective: '1000px' }}
            >
              <motion.div
                className="relative w-full h-full"
                animate={{ rotateY: flippedCards.has(crypto.id) ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Front Side */}
                <div
                  className="absolute inset-0 rounded-2xl border overflow-hidden"
                  style={{
                    background: isDark
                      ? 'rgba(15, 23, 42, 0.6)'
                      : 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(20px)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset`,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  {/* Gradient Background */}
                  <div
                    className="absolute inset-0"
                    style={{ background: crypto.gradient }}
                  />

                  {/* Content */}
                  <div className="relative h-full flex flex-col items-center justify-center p-6">
                    {/* Crypto Logo */}
                    {crypto.logoUrl ? (
                      <div className="mb-6">
                        <img
                          src={crypto.logoUrl}
                          alt={`${crypto.name} logo`}
                          className="w-20 h-20 object-contain"
                          style={{
                            filter: `drop-shadow(0 0 20px ${crypto.color}60)`,
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className="mb-6"
                        style={{
                          fontSize: '80px',
                          color: crypto.color,
                          textShadow: `0 0 40px ${crypto.color}80`,
                          fontWeight: 'bold',
                        }}
                      >
                        {crypto.logo}
                      </div>
                    )}

                    {/* Crypto Name */}
                    <h3
                      className="font-bold mb-2"
                      style={{
                        color: isDark ? '#FFFFFF' : '#0F172A',
                        fontSize: '24px',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {crypto.name}
                    </h3>

                    {/* Symbol */}
                    <span
                      className="px-4 py-1 rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: `${crypto.color}20`,
                        color: crypto.color,
                        border: `1px solid ${crypto.color}40`,
                      }}
                    >
                      {crypto.symbol}
                    </span>

                    {/* Hint */}
                    <p
                      className="mt-6 text-sm"
                      style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                    >
                      Click to view address
                    </p>
                  </div>
                </div>

                {/* Back Side */}
                <div
                  className="absolute inset-0 rounded-2xl border overflow-hidden"
                  style={{
                    background: isDark
                      ? 'rgba(15, 23, 42, 0.8)'
                      : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset`,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {/* Darker gradient for back */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{ background: crypto.gradient }}
                  />

                  {/* Content */}
                  <div className="relative h-full flex flex-col items-center justify-center p-6">
                    {/* Network Badge */}
                    <div
                      className="px-3 py-1 rounded-full text-xs font-semibold mb-6"
                      style={{
                        backgroundColor: 'rgba(34, 211, 238, 0.2)',
                        color: '#22D3EE',
                        border: '1px solid rgba(34, 211, 238, 0.3)',
                      }}
                    >
                      {crypto.network}
                    </div>

                    {/* Address Label */}
                    <p
                      className="text-xs mb-3 uppercase tracking-wider"
                      style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                    >
                      Wallet Address
                    </p>

                    {/* Address Box */}
                    <div
                      className="w-full rounded-xl p-4 mb-4"
                      style={{
                        backgroundColor: isDark
                          ? 'rgba(0, 0, 0, 0.4)'
                          : 'rgba(255, 255, 255, 0.6)',
                        border: `1px solid ${crypto.color}40`,
                      }}
                    >
                      <p
                        className="text-xs break-all text-center leading-relaxed"
                        style={{
                          color: isDark ? '#FFFFFF' : '#0F172A',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {crypto.address}
                      </p>
                    </div>

                    {/* QR Code Placeholder */}
                    <div
                      className="w-24 h-24 rounded-lg mb-4 flex items-center justify-center"
                      style={{
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.9)'
                          : '#FFFFFF',
                        border: `2px solid ${crypto.color}60`,
                      }}
                    >
                      <div
                        className="w-20 h-20 rounded"
                        style={{
                          background: `
                            repeating-linear-gradient(0deg, ${crypto.color}20 0px, ${crypto.color}20 2px, transparent 2px, transparent 4px),
                            repeating-linear-gradient(90deg, ${crypto.color}20 0px, ${crypto.color}20 2px, transparent 2px, transparent 4px)
                          `,
                        }}
                      />
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={(e) => handleCopy(crypto.address, crypto.id, e)}
                      className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
                      style={{
                        background:
                          copiedCard === crypto.id
                            ? 'linear-gradient(135deg, #10B981, #059669)'
                            : 'linear-gradient(135deg, #EF4444, #DC2626)',
                        color: '#FFFFFF',
                        boxShadow:
                          copiedCard === crypto.id
                            ? '0 0 20px rgba(16, 185, 129, 0.4)'
                            : '0 0 20px rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      {copiedCard === crypto.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Address
                        </>
                      )}
                    </button>

                    {/* Hint */}
                    <p
                      className="mt-4 text-xs"
                      style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                    >
                      Click again to flip back
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <div
          className="mt-16 text-center rounded-2xl p-6 border"
          style={{
            background: isDark
              ? 'rgba(15, 23, 42, 0.5)'
              : 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(20px)',
            borderColor: isDark
              ? 'rgba(34, 211, 238, 0.2)'
              : 'rgba(8, 145, 178, 0.2)',
          }}
        >
          <p
            className="text-sm mb-2"
            style={{ color: isDark ? '#94A3B8' : '#64748B' }}
          >
            Thank you for supporting open-source development! 🚀
          </p>
          <p
            className="text-xs"
            style={{ color: isDark ? '#64748B' : '#94A3B8' }}
          >
            All donations go directly toward server costs, infrastructure, and
            continued development of CipherCert.
          </p>
        </div>
      </div>
    </div>
  );
}

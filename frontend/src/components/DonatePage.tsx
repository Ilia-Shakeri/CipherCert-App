import React, { useMemo, useState } from 'react';
import { Heart, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';

// Import your crypto logos from the assets directory
// Adjust the path based on where your assets folder is located
import btcLogo from '../assets/bitcoin.png';
import ethLogo from '../assets/ethereum.png';
import usdtLogo from '../assets/tether.png';
import xmrLogo from '../assets/monero.png';

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

  const cryptoCards: CryptoCard[] = useMemo(
    () => [
      {
        id: 'btc',
        name: 'Bitcoin',
        symbol: 'BTC',
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        network: 'Bitcoin Network',
        color: '#F7931A',
        gradient:
          'linear-gradient(135deg, rgba(247, 147, 26, 0.32), rgba(247, 147, 26, 0.12))',
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
          'linear-gradient(135deg, rgba(98, 126, 234, 0.32), rgba(98, 126, 234, 0.12))',
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
          'linear-gradient(135deg, rgba(38, 161, 123, 0.32), rgba(38, 161, 123, 0.12))',
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
          'linear-gradient(135deg, rgba(255, 102, 0, 0.32), rgba(255, 102, 0, 0.12))',
        logo: 'ɱ',
        logoUrl: xmrLogo,
      },
    ],
    []
  );

  const handleCardClick = (cardId: string) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
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
      window.setTimeout(() => setCopiedCard(null), 2000);
    } catch {
      toast.error('Failed to copy address');
    }
  };

  // Layout numbers are tuned to match the provided screenshot.
  const CARD_H = 460; // px
  const CARD_W = 280; // px

  return (
    <div className="min-h-screen px-10 pt-16 pb-10 flex justify-center">
      <div className="w-full max-w-7xl">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 64,
                  height: 64,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.28)',
                  boxShadow: '0 0 40px rgba(239, 68, 68, 0.18)',
                }}
              >
                <Heart
                  className="w-8 h-8"
                  style={{ color: '#EF4444', fill: '#EF4444' }}
                />
              </div>
              <h1
                className="text-4xl font-bold"
                style={{
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '-0.02em',
                }}
              >
                Support CipherCert
              </h1>
            </div>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{
                color: isDark ? '#94A3B8' : '#64748B',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Help us maintain and improve CipherCert. Your donations support
              development, server costs, and new features.
            </p>
          </motion.div>
        </div>

        {/* Crypto Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 place-items-center">
          {cryptoCards.map((crypto, index) => {
            const isFlipped = flippedCards.has(crypto.id);
            const isCopied = copiedCard === crypto.id;

            return (
              <motion.div
                key={crypto.id}
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                className="relative"
                style={{ width: CARD_W }}
              >
                <motion.div
                  className="relative cursor-pointer"
                  style={{ perspective: '1000px' }}
                  onClick={() => handleCardClick(crypto.id)}
                  whileHover={{ scale: 1.015 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="relative w-full"
                    style={{
                      height: `${CARD_H}px`, // Fixed card height (Tailwind utility may be missing)
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.6s',
                    }}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                  >
                    {/* Front Side */}
                    <div
                      className="absolute inset-0 rounded-2xl p-6 border flex flex-col"
                      style={{
                        background: isDark
                          ? 'rgba(15, 23, 42, 0.68)'
                          : 'rgba(255, 255, 255, 0.75)',
                        backdropFilter: 'blur(22px)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(2, 132, 199, 0.18)',
                        backgroundImage: crypto.gradient,
                        backfaceVisibility: 'hidden',
                        boxShadow: isDark
                          ? '0 24px 60px rgba(0,0,0,0.32)'
                          : '0 24px 60px rgba(15,23,42,0.14)',
                      }}
                    >
                      {/* Top chip / network */}
                      <div className="flex items-center justify-between mb-6">
                        <div
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            color: crypto.color,
                            backgroundColor: `${crypto.color}18`,
                            border: `1px solid ${crypto.color}30`,
                          }}
                        >
                          {crypto.network}
                        </div>

                        <p
                          className="text-xs"
                          style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                        >
                          Click to flip
                        </p>
                      </div>

                      {/* Logo */}
                      <div className="flex items-center justify-center mb-6">
                        <div
                          className="rounded-2xl flex items-center justify-center"
                          style={{
                            width: 84,
                            height: 84,
                            backgroundColor: `${crypto.color}14`,
                            border: `1px solid ${crypto.color}2E`,
                            boxShadow: `0 18px 40px ${crypto.color}22`,
                          }}
                        >
                          {crypto.logoUrl ? (
                            <img
                              src={crypto.logoUrl}
                              alt={`${crypto.name} logo`}
                              className="object-contain"
                              style={{ width: 44, height: 44 }}
                            />
                          ) : (
                            <span
                              className="text-3xl font-bold"
                              style={{ color: crypto.color }}
                            >
                              {crypto.logo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name + symbol */}
                      <div className="text-center">
                        <h3
                          className="text-xl font-bold mb-2"
                          style={{
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {crypto.name}
                        </h3>
                        <div
                          className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-semibold"
                          style={{
                            color: crypto.color,
                            backgroundColor: `${crypto.color}14`,
                            border: `1px solid ${crypto.color}2E`,
                          }}
                        >
                          {crypto.symbol}
                        </div>
                      </div>

                      {/* Hint */}
                      <div className="mt-auto text-center">
                        <p
                          className="text-sm"
                          style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                        >
                          Click to view address
                        </p>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div
                      className="absolute inset-0 rounded-2xl p-6 border flex flex-col"
                      style={{
                        background: isDark
                          ? 'rgba(15, 23, 42, 0.86)'
                          : 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(22px)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(2, 132, 199, 0.18)',
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                        boxShadow: isDark
                          ? '0 24px 60px rgba(0,0,0,0.34)'
                          : '0 24px 60px rgba(15,23,42,0.14)',
                      }}
                    >
                      {/* Address Header */}
                      <div className="text-center mb-4">
                        <div
                          className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium mb-3"
                          style={{
                            color: crypto.color,
                            backgroundColor: `${crypto.color}18`,
                            border: `1px solid ${crypto.color}30`,
                          }}
                        >
                          Wallet Address
                        </div>

                        <h4
                          className="text-lg font-bold mb-1"
                          style={{
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {crypto.name}
                        </h4>
                        <p
                          className="text-xs"
                          style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                        >
                          Tap copy to donate
                        </p>
                      </div>

                      {/* Address Box */}
                      <div
                        className="rounded-xl p-4 mb-5 border"
                        style={{
                          backgroundColor: isDark
                            ? 'rgba(0, 0, 0, 0.18)'
                            : 'rgba(248, 250, 252, 0.82)',
                          borderColor: `${crypto.color}30`,
                        }}
                      >
                        <p
                          className="text-xs font-mono"
                          style={{
                            color: isDark ? '#E2E8F0' : '#334155',
                            wordBreak: 'break-all',
                          }}
                        >
                          {crypto.address}
                        </p>
                      </div>

                      {/* Copy Button */}
                      <motion.button
                        onClick={(e) =>
                          handleCopy(crypto.address, crypto.id, e)
                        }
                        className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                        style={{
                          backgroundColor: isCopied
                            ? 'rgba(34, 197, 94, 0.18)'
                            : 'rgba(239, 68, 68, 0.92)',
                          border: `1px solid ${
                            isCopied
                              ? 'rgba(34, 197, 94, 0.42)'
                              : 'rgba(239, 68, 68, 0.35)'
                          }`,
                          color: isCopied ? '#22C55E' : '#FFFFFF',
                          boxShadow: isCopied
                            ? '0 14px 34px rgba(34, 197, 94, 0.16)'
                            : '0 14px 34px rgba(239, 68, 68, 0.24)',
                        }}
                        whileHover={{
                          scale: 1.02,
                          filter: 'brightness(1.05)',
                        }}
                        whileTap={{ scale: 0.985 }}
                      >
                        {isCopied ? (
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
                      </motion.button>

                      {/* Hint */}
                      <p
                        className="mt-auto pt-5 text-xs text-center"
                        style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                      >
                        Click again to flip back
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div
          className="mt-20 text-center rounded-2xl p-8 border w-full"
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

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import { useNotification } from './App';
import { createCoinOnSolana } from './App';

// Funkce pro zkrácení textu
const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const TrendingPage = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Připojení peněženky – pouze signAndSendTransaction se využívá
  const { publicKey, signAndSendTransaction } = useWallet();
  const { addNotification } = useNotification();

  // RPC endpoint
  const endpoint =
    'https://snowy-newest-diagram.solana-mainnet.quiknode.pro/1aca783b369672a2ab65d19717ce7226c5747524';

  // Placeholder ikona
  const blankIcon = 'https://via.placeholder.com/48?text=?';

  // Načtení trending coinů přes proxy
  const fetchTrendingCoins = async () => {
    setLoading(true);
    try {
      const targetUrl = 'https://coinfast.fun/api/proxy-tokens';
      const proxyUrl = `https://api.allorigins.win/get?disableCache=true&url=${encodeURIComponent(
        targetUrl
      )}`;

      const response = await axios.get(proxyUrl);
      const data = JSON.parse(response.data.contents);

      const trendingTokens = data.slice(0, 5).map((coin) => ({
        name: coin.name,
        symbol: coin.symbol,
        address: coin.address || coin.mint || '',
        description: coin.description || '',
        image_uri: coin.image_uri || '',
        website: coin.website || '',
        twitter: coin.twitter || '',
        telegram: coin.telegram || '',
        usd_market_cap: coin.usd_market_cap || 'N/A',
      }));

      setCoins(trendingTokens);
    } catch (err) {
      console.error('Error fetching trending coins:', err);
      if (err.response && err.response.status === 503) {
        addNotification({
          type: 'error',
          message: 'Service unavailable (503). Please try again later.',
        });
      } else {
        addNotification({
          type: 'error',
          message: 'Failed to fetch trending coins.',
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrendingCoins();
  }, []);

  const handleCreateCoin = async (coin) => {
    if (!publicKey) {
      addNotification({ type: 'error', message: 'Please connect your wallet first!' });
      return;
    }

    addNotification({ type: 'info', message: `Creating ${coin.name}...` });

    const decimals = '9';
    const supply = '1000000000';

    try {
      const resultObj = await createCoinOnSolana({
        publicKey,
        endpoint,
        tokenName: coin.name || 'Unnamed',
        tokenSymbol: coin.symbol || '???',
        decimals,
        supply,
        description: coin.description || '',
        imageUri: coin.image_uri || '',
        website: coin.website || '',
        twitter: coin.twitter || '',
        telegram: coin.telegram || '',
        revokeMint: true,
        revokeFreeze: true,
        revokeUpdate: true,
        addNotification,
      });
      setResult(resultObj);

      if (resultObj.success) {
        addNotification({ type: 'success', message: `Coin ${coin.name} created!` });
      } else {
        if (resultObj.message.includes('503')) {
          addNotification({
            type: 'error',
            message:
              'Server error (503): The service might be overloaded. Please try again later.',
          });
        } else {
          addNotification({ type: 'error', message: resultObj.message });
        }
      }
    } catch (error) {
      console.error('Error during coin creation:', error);
      addNotification({
        type: 'error',
        message: 'An unexpected error occurred during coin creation.',
      });
    }
  };

  // =======================================
  // ========== VÝSLEDEK TVORBY ============
  // =======================================
  if (result) {
    return (
      <div className="form-container">
        <div className="trending-container token-result-container">
          {result.success ? (
            <div className="token-result-success">
              {/* Ikona úspěchu */}
              <div className="token-result-header">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="token-result-icon success-icon"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4 -4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                <h2>Token Created Successfully!</h2>
              </div>

              {/* Pole s token address + kopírovací tlačítko */}
              <div className="token-result-address-field">
                <label htmlFor="mintAddress">Token Address</label>
                <div className="token-address-wrapper">
                  <input
                    id="mintAddress"
                    type="text"
                    readOnly
                    value={result.mintAddress}
                    className="token-address-input"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(result.mintAddress)}
                    className="token-address-copy-button"
                    title="Copy Address"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      className="copy-icon"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Odkazy / tlačítka */}
              <div className="token-result-buttons">
                <a
                  href={`https://explorer.solana.com/address/${result.mintAddress}?cluster=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-button"
                >
                  View on Explorer
                </a>
                <a
                  href={`https://solscan.io/token/${result.mintAddress}?cluster=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-button"
                >
                  View on Solscan
                </a>
                <a
                  href="https://raydium.io/liquidity/create-pool/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-button"
                >
                  Create Liquidity Pool
                </a>
              </div>

              <p className="token-result-note">
                Add this token to your wallet using the token address above.
              </p>
            </div>
          ) : (
            <div className="token-result-error">
              {/* Ikona chyby */}
              <div className="token-result-header">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="token-result-icon error-icon"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.29 3.86l-6.63 11.47c-.79 1.36.2 3.07 1.73 3.07h13.26c1.53 0 2.52-1.71 1.73-3.07l-6.63-11.47a2 2 0 00-3.46 0z"
                  />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h2>Token Creation Failed</h2>
              </div>
              <p className="error-message">
                {result.message || 'Error creating token.'}
              </p>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="button back-button"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================================
  // ========== RENDER LIST =========
  // ================================
  return (
    <div className="trending-container">
      <div className="topapp">
        <h2 className="app-title" style={{ textAlign: 'center' }}>
          Copy Trending PumpFun Tokens NOW
        </h2>
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#ccc',
            marginBottom: '1.5rem',
          }}
        >
          Copy trending pump.fun tokens and launch them on Raydium instantly!
          If you create a token it will have all 3 revoke options turned ON automatically.
        </p>
      </div>
      <div className="trending-refresh-row">
        <div className="trending-info">
          Trending tokens with the highest engagement and market caps 🚀
        </div>
        <div>
          {!publicKey ? (
            <WalletMultiButton />
          ) : (
            <button onClick={fetchTrendingCoins} className="trending-button">
              Refresh
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="trending-loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {coins.length === 0 && !loading && (
            <p className="trending-no-coins" style={{ textAlign: 'center', color: '#ccc' }}>
              No coins found or failed to load.
            </p>
          )}
          {coins.map((coin, index) => {
            const marketCapNumber = parseFloat(coin.usd_market_cap) || 0;
            return (
              <div key={index} className="trending-coin-card">
                <div className="trending-coin-left">
                  <img
                    src={coin.image_uri || blankIcon}
                    alt={coin.symbol}
                    className="trending-coin-img"
                  />
                  <div>
                    <div className="trending-coin-name">{coin.name}</div>
                    {coin.description && (
                      <div className="trending-coin-description">
                        {truncateText(coin.description, 100)}
                      </div>
                    )}
                    {coin.symbol && (
                      <div className="trending-coin-symbol-tag">
                        ${coin.symbol.replace('$', '')}
                      </div>
                    )}
                    <div className="trending-coin-links">
                      {coin.website && (
                        <a
                          href={coin.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </a>
                      )}
                      {coin.twitter && (
                        <a
                          href={coin.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                      )}
                      {coin.address && (
                        <button
                          type="button"
                          onClick={() =>
                            window.open(`https://pump.fun/coin/${coin.address}`, '_blank')
                          }
                          className="trending-pump-button"
                        >
                          Pump.fun
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="trending-coin-right">
                  <div className="trending-coin-marketcap">
                    <span className="spansmall">USD Market Cap</span>
                    <br />
                    <span className="trending-coin-marketcap-value">
                      {marketCapNumber > 0
                        ? `$${marketCapNumber.toLocaleString()}`
                        : 'N/A'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateCoin(coin)}
                    className="trending-create-button"
                  >
                    + Create Coin
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default TrendingPage;

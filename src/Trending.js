import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import { useNotification } from './App';         // Notifikační kontext
import { createCoinOnSolana } from './App';        // Funkce pro vytvoření coinu

// Funkce pro zkrácení textu na maximálně maxLength znaků s přidáním "..."
const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const TrendingPage = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Připojení peněženky
  const { publicKey, signAndSendTransaction, signTransaction } = useWallet();
  const { addNotification } = useNotification();

  // RPC endpoint (stejné jako v App.js)
  const endpoint =
    'https://snowy-newest-diagram.solana-mainnet.quiknode.pro/1aca783b369672a2ab65d19717ce7226c5747524';

  // Placeholder ikona
  const blankIcon = 'https://via.placeholder.com/48?text=?';

  // Načtení trending coinů přes proxy s retry při 503
  const fetchTrendingCoins = async () => {
    setLoading(true);
    try {
      const targetUrl = 'https://coinfast.fun/api/proxy-tokens';
      const proxyUrl = `https://api.allorigins.win/get?disableCache=true&url=${encodeURIComponent(targetUrl)}`;

      const response = await axios.get(proxyUrl);
      const data = JSON.parse(response.data.contents);

      // Mapování coinů – použijeme coin.address nebo fallback na coin.mint
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
      // Pokud je chyba 503, zobrazíme speciální hlášení
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

  // Načteme coiny hned po mountu (automatický refresh)
  useEffect(() => {
    fetchTrendingCoins();
  }, []);

  // Vytvoření coinu – po úspěšném vytvoření se zobrazí výsledná obrazovka
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
        signAndSendTransaction,
        signTransaction,
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
            message: 'Server error (503): The service might be overloaded. Please try again later.',
          });
        } else {
          addNotification({ type: 'error', message: resultObj.message });
        }
      }
    } catch (error) {
      console.error('Error during coin creation:', error);
      addNotification({ type: 'error', message: 'An unexpected error occurred during coin creation.' });
    }
  };

  // Otevře pump.fun v novém okně s adresou coinu
  const handlePumpFun = (address) => {
    if (address) {
      window.open(`https://pump.fun/coin/${address}`, '_blank');
    }
  };

  // Pokud je výsledek coin creation nastavený, zobrazíme závěrečnou obrazovku
  if (result) {
    return (
      <form className="form-container">
        <div className="trending-container">
          <div className="trending-header">
            <h2>Coin Creation Result</h2>
          </div>
          {result.success ? (
            <div className="result success">
              <p className="successp">{result.message}</p>
              <p className="successp">
                <strong>Mint Address:</strong> {result.mintAddress}
              </p>
              <div className="result-links">
                <a
                  href={`https://solscan.io/token/${result.mintAddress}?cluster=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-button"
                >
                  Solscan
                </a>
                <a
                  href={`https://explorer.solana.com/address/${result.mintAddress}?cluster=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-button"
                >
                  Explorer
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(result.mintAddress)}
                  className="result-button"
                >
                  Copy Address
                </button>
                <a
                  href={`https://dexscreener.com/solana/${result.mintAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-button"
                >
                  DEX Screener
                </a>
                <a
                  href="https://raydium.io/liquidity/create-pool/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-button"
                >
                  Create Pool
                </a>
              </div>
            </div>
          ) : (
            <div className="result error">
              <p className="errorp">{result.message || 'Error creating token.'}</p>
              <button type="button" onClick={() => setResult(null)} className="button back-button">
                Back
              </button>
            </div>
          )}
        </div>
      </form>
    );
  }

  // Hlavní zobrazení trending coinů
  return (
    <div className="trending-container">
      <div className="topapp">
        <h2 className="app-title" style={{ textAlign: 'center' }}>
        Copy Trending PumpFun Tokens NOW
        </h2>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#ccc', marginBottom: '1.5rem' }}>
          Copy trending pump.fun tokens and launch them on Raydium instantly!
          If you create a token it will have all 3 revoke options turned ON automatically.
        </p>
      </div>
      {/* Sekce pro text a refresh/wallet */}
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
                    {/* Odkazy a Pump.fun tlačítko přesunuty pod symbol tag */}
                    <div className="trending-coin-links">
                      {coin.website && (
                        <a
                          href={coin.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {/* Ikonka připíňáku */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
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
                          {/* Ikonka Twitter */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                      )}
                      {coin.address && (
                        <button
                          type="button"
                          onClick={() => handlePumpFun(coin.address)}
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
                    <span className='spansmall'>USD Market Cap</span>
                    <br />
                    <span className="trending-coin-marketcap-value">
                      {marketCapNumber > 0 ? `$${marketCapNumber.toLocaleString()}` : 'N/A'}
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

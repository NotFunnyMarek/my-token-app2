import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNotification } from './App';

const AffiliateDashboard = () => {
  const { publicKey } = useWallet();
  const { addNotification } = useNotification();
  const [affiliateStats, setAffiliateStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // Krátký affiliate ID (prvních 5 znaků publicKey)
  const shortAffiliateId = publicKey ? publicKey.toBase58().substring(0, 5) : '';
  const affiliateLink = shortAffiliateId
    ? `${window.location.origin}/?af=${shortAffiliateId}`
    : '';

  // Načtení statistik z PHP endpointu
  const fetchAffiliateStats = async () => {
    if (!publicKey) return;
    try {
      const response = await axios.get(
        `https://app.byxbot.com/php/links.php?affiliateId=${shortAffiliateId}`
      );
      setAffiliateStats(response.data);
    } catch (error) {
      console.error('Error fetching affiliate stats:', error);
      addNotification({ type: 'error', message: 'Error fetching affiliate stats.' });
    }
  };

  useEffect(() => {
    fetchAffiliateStats();
  }, [publicKey]);

  // Kopírování odkazu
  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    addNotification({ type: 'success', message: 'Copied!' });
    setTimeout(() => setCopied(false), 3000);
  };

  // Zpracování výběru (withdraw)
  const handleWithdrawal = async () => {
    if (!publicKey) {
      addNotification({
        type: 'error',
        message: 'Please connect your wallet to request withdrawal.'
      });
      return;
    }
    setWithdrawing(true);
    try {
      const walletAddress = publicKey.toBase58();
      const response = await axios.post('https://app.byxbot.com/php/links.php', {
        affiliateId: shortAffiliateId,
        action: 'withdraw',
        walletAddress: walletAddress
      });
      addNotification({ type: 'success', message: response.data.message });
      // Po výběru resetujeme reward v zobrazení
      setAffiliateStats((prev) =>
        prev ? { ...prev, reward: '0.00' } : { coinsCreated: 0, reward: '0.00' }
      );
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      addNotification({ type: 'error', message: 'Error requesting withdrawal.' });
    }
    setWithdrawing(false);
  };

  return (
    <div>
      {/* Horní sekce - "Copy Trending PumpFun Tokens NOW" */}
      <div className="topapp">
        <h2 className="app-title" style={{ textAlign: 'center' }}>
        Your Affiliate Dashboard
        </h2>
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#ccc',
            marginBottom: '1.5rem'
          }}
        >
          As a member of CoinCreate's Ambassador Program, you will receive $8.50 for every coin created through your link! The minimum withdrawal amount is $8.50 and is made using a linked solana wallet.
        </p>
      </div>

      {/* Řádek s informací a tlačítkem (nyní Request Withdrawal) */}
      <div className="trending-refresh-row">
        <div className="trending-info">
        Withdrawals are sent manually after verification within 24 hours<br /> to the linked solana wallet. 🔒
        </div>
        <div>
          {!publicKey ? (
            <WalletMultiButton />
          ) : (
            <button
              className="trending-withdraw-button"
              onClick={handleWithdrawal}
              disabled={withdrawing}
            >
              {withdrawing ? 'Processing...' : 'Request Withdrawal'}
            </button>
          )}
        </div>
      </div>

      {/* Samotná Affiliate sekce */}
      <div className="affiliate-dashboard">

        {!publicKey ? (
          <div style={{ textAlign: 'center' }}>
            <p>Please connect your wallet to view your affiliate dashboard.</p>
            <WalletMultiButton />
          </div>
        ) : (
          <>
            <div className="affiliate-link-section">
              <p>Your affiliate link:</p>
              <input
                type="text"
                readOnly
                value={affiliateLink}
                className="affiliate-link-input"
              />
              <button onClick={handleCopy} className="affiliate-copy-button">
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {affiliateStats ? (
              <div className="affiliate-stats">
                <p>Total Coins Created via Your Link: <span> {affiliateStats.coinsCreated}</span></p>
                <p>Your Reward: <span> ${affiliateStats.reward}</span></p>
                <div class="divider"></div>

                <p>Need help? <a className="afooter" href="https://discord.gg/66eYfa4xYx">
          Contact Us
        </a></p>
              </div>
            ) : (
              <p>Loading affiliate stats...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AffiliateDashboard;

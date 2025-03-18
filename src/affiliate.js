import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNotification } from './App';

const LEVELS = [
  { level: 1, range: "0 - 10", reward: "$4.80" },
  { level: 2, range: "11 - 30", reward: "$7.40" },
  { level: 3, range: "31 - 50", reward: "$9.90" },
  { level: 4, range: "51 - 70", reward: "$11.30" },
  { level: 5, range: "71 - 99", reward: "$12.60" },
  { level: 6, range: "100+", reward: "$14.10" }
];

const getLevelBounds = (level) => {
  switch(level) {
    case 1: return { lower: 0, upper: 10 };
    case 2: return { lower: 10, upper: 30 };
    case 3: return { lower: 30, upper: 50 };
    case 4: return { lower: 50, upper: 70 };
    case 5: return { lower: 70, upper: 99 };
    default: return { lower: 99, upper: 99 }; // Level 6 => 100+
  }
};

const AffiliateProgressBar = ({ coinsCreated, level }) => {
  if (level === 6) {
    return (
      <div className="progress-section">
        <div className="affiliate-progress-bar">
          <div className="affiliate-progress-fill" style={{ width: '100%' }}></div>
        </div>
        <div className="progress-info">Maximum Level Reached</div>
      </div>
    );
  }
  const bounds = getLevelBounds(level);
  const coinsInLevel = coinsCreated - bounds.lower;
  const levelRange = bounds.upper - bounds.lower + 1;
  const progressPercent = (coinsInLevel / levelRange) * 100;
  const coinsRemaining = bounds.upper - coinsCreated + 1;
  return (
    <div className="progress-section">
      <div className="affiliate-progress-bar">
        <div className="affiliate-progress-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>
      <div className="progress-info">
        You need {coinsRemaining} more coin{coinsRemaining > 1 ? 's' : ''} to reach Level {level + 1}
      </div>
    </div>
  );
};

const AffiliateDashboard = () => {
  const { publicKey } = useWallet();
  const { addNotification } = useNotification();
  
  const [affiliateStats, setAffiliateStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showLevels, setShowLevels] = useState(false);

  // Vytvoření affiliate ID – prvních 5 znaků z publicKey
  const shortAffiliateId = publicKey ? publicKey.toBase58().substring(0, 5) : '';
  const affiliateLink = shortAffiliateId
    ? `${window.location.origin}/?af=${shortAffiliateId}`
    : '';

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
    if (publicKey) {
      fetchAffiliateStats();
    }
  }, [publicKey]);

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    addNotification({ type: 'success', message: 'Copied!' });
    setTimeout(() => setCopied(false), 3000);
  };

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
        walletAddress
      });
      addNotification({ type: 'success', message: response.data.message });
      await fetchAffiliateStats();
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      addNotification({ type: 'error', message: 'Error requesting withdrawal.' });
    }
    setWithdrawing(false);
  };

  const toggleLevels = () => {
    setShowLevels(prev => !prev);
  };

  let progressSection = null;
  if (affiliateStats) {
    progressSection = (
      <div className="levels-section">
        <AffiliateProgressBar coinsCreated={affiliateStats.coinsCreated} level={affiliateStats.level} />
        <button className="toggle-levels-button" onClick={toggleLevels}>
          {showLevels ? 'Hide Level Details' : 'Show Level Details'}
        </button>
        <div className={`levels-details ${showLevels ? 'show' : ''}`}>
          {LEVELS.map(item => {
            const unlocked = affiliateStats.level >= item.level;
            return (
              <div
                key={item.level}
                className="level-detail"
              >
                <div className="level-info">
                  <span className="level-title">Level {item.level}</span>
                  <span className="level-range">({item.range})</span>
                  <span className="level-reward">Reward: {item.reward} /coin</span>
                </div>
                <div className={`level-status ${unlocked ? 'unlocked' : 'locked'}`}>
                  {unlocked ? 'Unlocked' : 'Locked'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="topapp">
        <h2 className="app-title" style={{ textAlign: 'center' }}>
          Your Affiliate Dashboard
        </h2>
        <p className="dashboard-subtitle">
          As a member of CoinCreate's Ambassador Program, you earn rewards for each coin created via your link based on our ranking-system level.
        </p>
      </div>

      <div className="trending-refresh-row">
        <div className="trending-info">
          Withdrawals are sent manually after verification within 24 hours<br />to the linked Solana wallet. 🔒
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

      {affiliateStats && progressSection}

      <div className="affiliate-dashboard">
        {!publicKey ? (
          <div style={{ textAlign: 'center' }}>
            <p>Please connect your wallet to view your affiliate dashboard.</p>
            <WalletMultiButton />
          </div>
        ) : (
          <>
            {affiliateStats && (
              <div className="affiliate-stats-card">
                <h3 className="card-title">Your Affiliate Stats</h3>
                <div className="stats-table">
                  <div className="stats-row">
                    <div className="stats-col label">Total Coins Created</div>
                    <div className="stats-col value">{affiliateStats.coinsCreated}</div>
                  </div>
                  <div className="stats-row">
                    <div className="stats-col label">Level</div>
                    <div className="stats-col value">{affiliateStats.level}</div>
                  </div>
                  <div className="stats-row">
                    <div className="stats-col label">Reward per coin</div>
                    <div className="stats-col value">${affiliateStats.currentRewardRate}</div>
                  </div>
                  <div className="stats-row">
                    <div className="stats-col label">Total Reward</div>
                    <div className="stats-col value">${affiliateStats.reward}</div>
                  </div>
                  <div className="stats-row">
                    <div className="stats-col label">Link Opens</div>
                    <div className="stats-col value">{affiliateStats.linkOpens || 0}</div>
                  </div>
                </div>
              </div>
            )}
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
            <div className="divider"></div>
            <div className="affiliate-stats-help">
              <p>
                Need help?{' '}
                <a className="afooter" href="https://discord.gg/66eYfa4xYx">
                  Contact Us
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AffiliateDashboard;

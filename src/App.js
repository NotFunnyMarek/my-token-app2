/* global BigInt */
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Buffer } from 'buffer';
import logo from './Fra6me 5925.png';
import { ReactComponent as UploadIcon } from './upload-icon.svg';
import { customSignAndSendTransaction } from './utils';

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  MintLayout,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  AuthorityType,
} from '@solana/spl-token';
import axios from 'axios';
import {
  createCreateMetadataAccountV3Instruction,
  createUpdateMetadataAccountV2Instruction,
} from '@metaplex-foundation/mpl-token-metadata';

import { createMemoInstruction } from '@solana/spl-memo';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

import TrendingPage from './Trending';
import AffiliateDashboard from './affiliate';
import PhantomNote from './phantom-note';
import '@solana/wallet-adapter-react-ui/styles.css';
import './app.css';

// Nastavení Bufferu pro prohlížeče
window.Buffer = Buffer;

// *******************************
// ***** FEE MODE CONFIGURATION *****
// "SINGLE" – v jedné transakci poplatek 0.1 SOL + token
// "SPLIT"  – dvě transakce, první poplatek 0.1 SOL, druhá token
// "NOFEE"  – žádný poplatek, jen token
// *******************************
const FEE_MODE = "SINGLE"; // Změňte na "SPLIT" nebo "NOFEE" dle potřeby

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

/* ░░░  DISCORD WEBHOOK  ░░░  */
const sendDiscordWebhook = async (tokenName, walletAddress) => {
  try {
    await axios.post(
      'https://discord.com/api/webhooks/1312174539249025044/l6qX5vnpahc5PJAdNprmBIvE8k77znV3fVRjqFUew10JdWg2o4WtI9UbhgmNY5ya26qU',
      {
        content: `New coin created!\nToken Name: ${tokenName}\nWallet: ${walletAddress}`,
      }
    );
  } catch (error) {
    console.error('Error sending Discord webhook:', error);
  }
};

/* ░░░  POMOCNÁ FUNKCE PRO ZÍSKÁNÍ COOKIE  ░░░  */
function getCookie(name) {
  let nameEQ = name + '=';
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/* ░░░  CUSTOM INSTRUCTION: REVOKE AUTHORITY  ░░░  */
function createRevokeAuthorityInstruction(
  account,
  currentAuthority,
  authorityType,
  programId = TOKEN_PROGRAM_ID
) {
  const data = Buffer.from([6, authorityType, 0]);
  const keys = [
    { pubkey: account, isSigner: false, isWritable: true },
    { pubkey: currentAuthority, isSigner: true, isWritable: false },
  ];
  return new TransactionInstruction({ keys, programId, data });
}

/* ░░░  NOTIFIKAČNÍ SYSTÉM  ░░░  */
const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = ({ type, message }) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    // Notifikace se po 3 sekundách odstraní
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <NotificationContainer notifications={notifications} />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications }) => {
  return (
    <div className="notification-container">
      {notifications.map((notif) => (
        <div key={notif.id} className={`notification ${notif.type}`}>
          {notif.message}
        </div>
      ))}
    </div>
  );
};

/* ░░░ WALLET BALANCE ░░░ */
const WalletBalance = () => {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        setLoading(true);
        try {
          const connection = new Connection(
            'https://snowy-newest-diagram.solana-mainnet.quiknode.pro/1aca783b369672a2ab65d19717ce7226c5747524',
            'confirmed'
          );
          const lamports = await connection.getBalance(publicKey);
          setBalance((lamports / LAMPORTS_PER_SOL).toFixed(2));
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
        setLoading(false);
      }
    };
    fetchBalance();
  }, [publicKey]);

  if (!publicKey) return null;

  return (
    <div className="wallet-balance">
      <img
        src="https://cryptologos.cc/logos/solana-sol-logo.png?v=024"
        alt="Solana Logo"
        className="sol-logo"
      />
      <span>{loading ? 'Loading...' : `${balance} SOL`}</span>
    </div>
  );
};

/*  ░░░  HEADER  ░░░  */
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleReload = (e) => {
    e.preventDefault();
    navigate('/');
    window.location.reload();
  };

  return (
    <header className="header">
      <div className="header-top">
        <p className="headerr">
          <Link to="/note" style={{ textDecoration: 'none', color: 'inherit' }}>
            ⚡ OFFICIALLY WHITELISTED BY PHANTOM! ⚡ →
          </Link>
        </p>
      </div>
      <div className="header-inner">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="header-left">
            <img src={logo} alt="Logo" className="logo-img" />
            <span className="brand-name">CoinCreate</span>
          </div>
        </Link>

        {/* Desktop menu */}
        <div className="desktop-menu">
          <nav className="header-nav">
            <a href="#" onClick={handleReload} className="header-button">
              Create Token
            </a>
            <Link to="/trending" className="header-button">
              Trending <span className="new-tag">New</span>
            </Link>
            <Link to="/affiliate" className="header-button">
              Ambasador Program <span className="hot-tag">Popular</span>
            </Link>
            <a
              href="https://raydium.io/liquidity/create-pool/"
              className="header-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              Create Liquidity
            </a>
          </nav>
          <div className="header-right">
            <WalletBalance />
            <WalletMultiButton />
          </div>
        </div>

        {/* Hamburger + balance pro mobil */}
        <div className="mobile-right">
          <WalletBalance />
          <button
            className="hamburger-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobilní menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <nav className="header-nav">
            <a href="#" onClick={handleReload} className="header-button">
              Create Token
            </a>
            <Link
              to="/trending"
              className="header-button"
              onClick={() => setIsMenuOpen(false)}
            >
              Trending <span className="new-tag">New</span>
            </Link>
            <Link
              to="/affiliate"
              className="header-button"
              onClick={() => setIsMenuOpen(false)}
            >
              Ambasador Program <span className="hot-tag">Popular</span>
            </Link>
            <a
              href="https://raydium.io/liquidity/create-pool/"
              className="header-button"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
            >
              Create Liquidity
            </a>
          </nav>
          <div className="header-right">
            <WalletMultiButton />
          </div>
        </div>
      )}
    </header>
  );
};

/* ░░░  INSTRUCTIONS SECTION  ░░░  */
const InstructionsSection = () => {
  return (
    <div className="instructions-section">
      <h2>How to use Solana Token Creator</h2>
      <ol>
        <li>Connect your Solana wallet.</li>
        <li>Write the name you want for your Token.</li>
        <li>Indicate the symbol (max 8 characters).</li>
        <li>Select the decimals quantity (e.g. 6 or 9).</li>
        <li>Write the description you want for your SPL Token.</li>
        <li>Upload the image for your token (PNG, GIF).</li>
        <li>Put the supply of your Token.</li>
        <li>Click on Create, accept the transaction, and wait.</li>
      </ol>
      <p className="border">
        The cost of creating the Token is 0.1 SOL, which includes all fees needed for
        the SPL Token creation.
      </p>
      <p>
        The creation process will start and take some seconds. After that, you will
        receive the total supply of the token in the wallet you chose.
      </p>
    </div>
  );
};

/* ░░░  FAQ SECTION  ░░░  */
const FAQItem = ({ question, answer, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className="faq-item">
      <div className="faq-question" onClick={() => setExpanded(!expanded)}>
        <span>{question}</span>
        <span className="faq-toggle">{expanded ? '−' : '+'}</span>
      </div>
      <div className={`faq-answer-container ${expanded ? 'expanded' : ''}`}>
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
};

const FAQSection = () => {
  return (
    <div className="faq-section">
      <h2 className="faq-title">FAQ</h2>
      <FAQItem
        question="What is CoinCreate?"
        answer="CoinCreate is a user-friendly platform that allows you to create your own token on the Solana blockchain in just a few simple steps. No coding knowledge is required, making it accessible for anyone looking to launch their own cryptocurrency."
        defaultExpanded={true}
      />
      <FAQItem
        question="Do I need SOL to create a token?"
        answer="Yes, you will need a small amount of SOL (approximately 0.118 SOL) to cover the transaction fees on the Solana network. This ensures that your token is properly registered on the blockchain and can be fully functional."
      />
      <FAQItem
        question="Can I revoke token authorities later?"
        answer="Yes, during the token creation process, you have the option to revoke mint, freeze, and update authorities. However, once you choose to revoke these permissions, they cannot be restored. This is an important step to consider for decentralization and security."
      />
    </div>
  );
};

/* ░░░  COIN HISTORY  ░░░  */
const CoinHistory = () => {
  const { publicKey } = useWallet();
  const [history, setHistory] = useState([]);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (publicKey) {
      const historyKey = `coinHistory_${publicKey.toBase58()}`;
      const stored = JSON.parse(localStorage.getItem(historyKey) || '[]');
      setHistory(stored);
    }
  }, [publicKey]);

  if (!publicKey) return null;

  const historyKey = `coinHistory_${publicKey.toBase58()}`;

  const handleCopy = (mintAddress) => {
    navigator.clipboard.writeText(mintAddress);
    addNotification({ type: 'success', message: 'Copied!' });
  };

  const handleDelete = (index) => {
    const updatedHistory = [...history];
    updatedHistory.splice(index, 1);
    setHistory(updatedHistory);
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    addNotification({ type: 'success', message: 'Deleted!' });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(historyKey);
    addNotification({ type: 'success', message: 'Cleared!' });
  };

  return (
    <div className="coin-history">
      <h2>Your Created Coins</h2>
      {history.length === 0 ? (
        <p className="phistory">No coins created yet.</p>
      ) : (
        <>
          <div className="coin-history-list">
            {history.map((coin, index) => (
              <div key={index} className="coin-history-item">
                <img
                  src={coin.imageUri || 'https://via.placeholder.com/50?text=?'}
                  alt={coin.tokenSymbol}
                />
                <div className="coin-details">
                  <strong>{coin.tokenName}</strong> ({coin.tokenSymbol})
                </div>
                <div className="coin-actions">
                  <button
                    type="button"
                    className="copy-button"
                    onClick={() => handleCopy(coin.mintAddress)}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="clear-history-button"
            onClick={handleClearHistory}
          >
            Clear History
          </button>
        </>
      )}
    </div>
  );
};

/* Helper: Format large numbers to human readable (e.g. 1B, 900M, etc.) */
const formatSupplyValue = (value) => {
  const num = Number(value);
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  } else {
    return num;
  }
};

/* ░░░  FUNKCE: CREATE COIN ON SOLANA  ░░░  */
export async function createCoinOnSolana({
  publicKey,
  endpoint,
  tokenName,
  tokenSymbol,
  decimals,
  supply,
  description,
  imageUri,
  website,
  twitter,
  telegram,
  revokeMint,
  revokeFreeze,
  revokeUpdate,
  addNotification,
  sendTransaction,
  signAndSendTransaction,
}) {
  try {
    const walletKey = new PublicKey(publicKey.toString());
    const connection = new Connection(endpoint, 'confirmed');

    if (FEE_MODE !== "NOFEE") {
      const balance = await connection.getBalance(walletKey);
      if (balance < 0.118 * LAMPORTS_PER_SOL) {
        addNotification({
          type: 'error',
          message: 'Insufficient SOL to cover fees (min 0.11 SOL).',
        });
        return { success: false, message: 'Not enough SOL.' };
      }
    }

    const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
    const pinataSecret = process.env.REACT_APP_PINATA_SECRET_API_KEY;
    if (!pinataApiKey || !pinataSecret) {
      addNotification({ type: 'error', message: 'Missing Pinata API keys.' });
      return { success: false, message: 'Missing Pinata API keys.' };
    }

    const metadataJSON = {
      name: tokenName,
      symbol: tokenSymbol,
      description: description,
      image: imageUri,
      external_url: website || '',
      attributes: [
        { trait_type: 'Twitter', value: twitter || '' },
        { trait_type: 'Telegram', value: telegram || '' },
      ],
      properties: {
        category: 'image',
        creators: [
          {
            address: walletKey.toString(),
            share: 100,
          },
        ],
      },
    };

    const metadataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadataJSON,
      {
        headers: {
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecret,
        },
      }
    );
    const metadataHash = metadataResponse.data.IpfsHash;
    const metadataUri = `https://ipfs.io/ipfs/${metadataHash}`;

    const seed =
      tokenSymbol.toLowerCase() + '_' + Date.now().toString().slice(-6);
    const mintPubkey = await PublicKey.createWithSeed(
      walletKey,
      seed,
      TOKEN_PROGRAM_ID
    );

    const lamports = await connection.getMinimumBalanceForRentExemption(
      MintLayout.span
    );
    const transaction = new Transaction();
    transaction.feePayer = walletKey;
    let { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    if (FEE_MODE === "SINGLE") {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletKey,
          toPubkey: new PublicKey('DnGMKFnAh9qtatYpZsLJhwS6NN1G6LC5WtbRyuNX8o4X'),
          lamports: 0.1 * LAMPORTS_PER_SOL,
        })
      );
      transaction.add(
        createMemoInstruction("Fee for token creation: 0.1 SOL")
      );
    } else if (FEE_MODE === "SPLIT") {
      const feeTransaction = new Transaction();
      feeTransaction.feePayer = walletKey;
      const latest = await connection.getLatestBlockhash();
      feeTransaction.recentBlockhash = latest.blockhash;
      feeTransaction.add(
        SystemProgram.transfer({
          fromPubkey: walletKey,
          toPubkey: new PublicKey('DnGMKFnAh9qtatYpZsLJhwS6NN1G6LC5WtbRyuNX8o4X'),
          lamports: 0.1 * LAMPORTS_PER_SOL,
        })
      );
      feeTransaction.add(
        createMemoInstruction("Fee for token creation: 0.1 SOL")
      );
      const feeTxResponse = await customSignAndSendTransaction({
        transaction: feeTransaction,
        connection,
        sendTransaction,
        signAndSendTransaction,
      });
      console.log('Fee transaction sent with txId:', feeTxResponse.signature);
    }

    transaction.add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: walletKey,
        newAccountPubkey: mintPubkey,
        basePubkey: walletKey,
        seed: seed,
        space: MintLayout.span,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      })
    );

    transaction.add(
      createInitializeMintInstruction(
        mintPubkey,
        Number(decimals),
        walletKey,
        walletKey
      )
    );

    const associatedTokenAddress = await getAssociatedTokenAddress(
      mintPubkey,
      walletKey
    );
    transaction.add(
      createAssociatedTokenAccountInstruction(
        walletKey,
        associatedTokenAddress,
        walletKey,
        mintPubkey
      )
    );

    const decimalsNum = Number(decimals);
    const supplyAmount = BigInt(supply) * 10n ** BigInt(decimalsNum);
    transaction.add(
      createMintToInstruction(
        mintPubkey,
        associatedTokenAddress,
        walletKey,
        supplyAmount
      )
    );

    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    const metadataData = {
      name: tokenName,
      symbol: tokenSymbol,
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: [
        {
          address: walletKey,
          verified: true,
          share: 100,
        },
      ],
      collection: null,
      uses: null,
    };

    transaction.add(
      createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataPDA,
          mint: mintPubkey,
          mintAuthority: walletKey,
          payer: walletKey,
          updateAuthority: walletKey,
        },
        {
          createMetadataAccountArgsV3: {
            data: metadataData,
            isMutable: true,
            collectionDetails: null,
          },
        }
      )
    );

    if (revokeMint) {
      transaction.add(
        createRevokeAuthorityInstruction(
          mintPubkey,
          walletKey,
          AuthorityType.MintTokens
        )
      );
    }
    if (revokeFreeze) {
      transaction.add(
        createRevokeAuthorityInstruction(
          mintPubkey,
          walletKey,
          AuthorityType.FreezeAccount
        )
      );
    }
    if (revokeUpdate) {
      transaction.add(
        createUpdateMetadataAccountV2Instruction(
          {
            metadata: metadataPDA,
            updateAuthority: walletKey,
          },
          {
            updateMetadataAccountArgsV2: {
              data: metadataData,
              updateAuthority: null,
              primarySaleHappened: false,
              isMutable: false,
            },
          }
        )
      );
    }

    const txResponse = await customSignAndSendTransaction({
      transaction,
      connection,
      sendTransaction,
      signAndSendTransaction,
    });
    const txId = txResponse.signature;
    const mintAddressStr = mintPubkey.toBase58();

    const affiliateId = getCookie('affiliateId');
    if (affiliateId) {
      axios
        .post('https://app.byxbot.com/php/links.php', {
          affiliateId: affiliateId,
          action: 'coinCreated',
          walletAddress: walletKey.toBase58(),
        })
        .then((response) => {
          console.log('Affiliate updated', response.data);
          document.cookie = 'affiliateId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        })
        .catch((err) => console.error('Error updating affiliate count:', err));
    }

    const historyKey = `coinHistory_${walletKey.toBase58()}`;
    const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
    existingHistory.push({
      mintAddress: mintAddressStr,
      tokenName,
      tokenSymbol,
      imageUri,
      createdAt: Date.now(),
    });
    localStorage.setItem(historyKey, JSON.stringify(existingHistory));

    await sendDiscordWebhook(tokenName, walletKey.toBase58());
    addNotification({ type: 'success', message: 'Token successfully created!' });

    return {
      success: true,
      message: 'Token successfully created!',
      mintAddress: mintAddressStr,
      txId,
    };
  } catch (error) {
    console.error('Error creating token:', error);
    return { success: false, message: 'Error: ' + error.message };
  }
}

/* ░░░  PROGRESS BAR  ░░░  */
const ProgressBar = ({ currentStep, progressPercent }) => {
  const steps = [1, 2, 3, 4, 5];
  return (
    <div className="progress-bar-wrapper">
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      <div className="progress-steps">
        {steps.map((step) => (
          <div
            key={step}
            className={`progress-step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
          >
            <span>{step}</span>
          </div>
        ))}
      </div>
      <div className="progress-text">Step {currentStep} of 5</div>
    </div>
  );
};

/* ░░░  CREATE TOKEN FORM  ░░░  */
const CreateTokenForm = ({ endpoint, onTokenCreated }) => {
  const { publicKey, sendTransaction, signAndSendTransaction } = useWallet();
  const { addNotification } = useNotification();

  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [decimals, setDecimals] = useState('9');
  const [supply, setSupply] = useState('1000000000');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [file, setFile] = useState(null);
  const [imageUri, setImageUri] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  const [revokeMint, setRevokeMint] = useState(true);
  const [revokeFreeze, setRevokeFreeze] = useState(true);
  const [revokeUpdate, setRevokeUpdate] = useState(true);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const progressPercent = ((currentStep - 1) / 4) * 100;

  // Info tooltips text – použijeme custom tlačítko s tooltipem (viz .info-icon)
  const infoTexts = {
    tokenName: "Enter the display name of your token.",
    tokenSymbol: "Enter the symbol (max 10 characters).",
    decimals: "Number of decimals determines token divisibility (0-18). If you don't know, ignore.",
    supply: "Enter the total number of tokens (numeric value). If you don't know, ignore.",
    description: "Provide a brief description of your token.",
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
    if (!allowedTypes.includes(selectedFile.type)) {
      addNotification({
        type: 'error',
        message: 'Invalid file type. Only PNG, JPG, and GIF are allowed.',
      });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      addNotification({
        type: 'error',
        message: 'File size exceeds 5MB limit.',
      });
      return;
    }

    setFile(selectedFile);
    setImageUploadLoading(true);

    const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
    const pinataSecret = process.env.REACT_APP_PINATA_SECRET_API_KEY;
    if (!pinataApiKey || !pinataSecret) {
      addNotification({ type: 'error', message: 'Missing Pinata API keys.' });
      setImageUploadLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxContentLength: 'Infinity',
          headers: {
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecret,
          },
        }
      );
      const ipfsHash = response.data.IpfsHash;
      const uri = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      setImageUri(uri);
      setImagePreviewUrl(uri);
    } catch (error) {
      console.error('Error uploading image:', error);
      addNotification({
        type: 'error',
        message: 'Error uploading image: ' + error.message,
      });
    }
    setImageUploadLoading(false);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!tokenName || !tokenSymbol || !imageUri) {
        addNotification({
          type: 'error',
          message: 'Please fill out token name, symbol and upload image!',
        });
        return;
      }
      if (tokenName.length > 32) {
        addNotification({
          type: 'error',
          message: 'Token name must be at most 32 characters.',
        });
        return;
      }
      if (tokenSymbol.length > 10) {
        addNotification({
          type: 'error',
          message: 'Token symbol must be at most 10 characters.',
        });
        return;
      }
    } else if (currentStep === 2) {
      const decimalsNum = Number(decimals);
      if (isNaN(decimalsNum) || decimalsNum < 0 || decimalsNum > 18) {
        addNotification({
          type: 'error',
          message: 'Decimals must be a number between 0 and 18.',
        });
        return;
      }
      if (!supply) {
        addNotification({ type: 'error', message: 'Supply is required.' });
        return;
      }
    } else if (currentStep === 3) {
      if (!description) {
        addNotification({ type: 'error', message: 'Description is required.' });
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!publicKey) {
      addNotification({ type: 'error', message: 'Please connect your wallet first!' });
      return;
    }
    if (!acceptedTerms) {
      addNotification({ type: 'error', message: 'Please accept the terms and conditions.' });
      return;
    }
    setLoading(true);

    const resultObj = await createCoinOnSolana({
      publicKey,
      endpoint,
      tokenName,
      tokenSymbol,
      decimals,
      supply,
      description,
      imageUri,
      website,
      twitter,
      telegram,
      revokeMint,
      revokeFreeze,
      revokeUpdate,
      addNotification,
      sendTransaction,
      signAndSendTransaction,
    });

    setLoading(false);
    setResult(resultObj);
    if (resultObj.success && onTokenCreated) {
      onTokenCreated(resultObj);
    }
    // Nastavíme currentStep na 5, aby se zobrazil steps bar i ve výsledku
    setCurrentStep(5);
  };

  // Pokud máme výsledek, zobrazíme i ProgressBar nad výsledkovým screenem
  if (result) {
    return (
      <div>
      <ProgressBar currentStep={currentStep} progressPercent={progressPercent} />
      <div className="form-container">
        <div className="trending-container token-result-container">
          {result.success ? (
            <div className="token-result-success">
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
              <div className="token-result-address-field">
                <label className="mintlabel" htmlFor="mintAddress">Token Address</label>
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
              <div className="divider"></div>
              <div className="rating-section">
                <button
                  className="result-rating-button"
                  onClick={() => window.open('https://www.trustpilot.com/review/coincreate.org', '_blank')}
                >
                  Rate your experience on ★ Trustpilot
                </button>
              </div>
            </div>
          ) : (
            <div className="token-result-error">
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
      </div>
    );
  }

  const renderStepContent = () => {
    if (currentStep === 1 && !publicKey) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p className="walletp">Please connect your wallet to continue</p>
          <WalletMultiButton />
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="form-step">
            <div className="name-symbol-container">
              <div className="form-group">
              <div className='name-label'>
                <label htmlFor="tokenName">
                  Token Name
                  <button className="info-icon" data-tooltip={infoTexts.tokenName}>i</button>
                </label>
                </div>
                <input
                  id="tokenName"
                  type="text"
                  className="input-field"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  maxLength={32}
                  placeholder="CoinCreate Token"
                />
              </div>
              <div className="form-group">
                <div className='symbol-label'>
                <label htmlFor="tokenSymbol">
                  Token Symbol
                  <button className="info-icon" data-tooltip={infoTexts.tokenSymbol}>i</button>
                </label>
                </div>
                <input
                  id="tokenSymbol"
                  type="text"
                  className="input-field"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  maxLength={10}
                  placeholder="CRT"
                />
              </div>
            </div>
            <div className="form-group">
              <div
                className="image-upload-container"
                onClick={() => document.getElementById('fileUpload').click()}
              >
                {imageUploadLoading ? (
                  <div className="spinner"></div>
                ) : imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Token preview"
                    className="image-preview"
                  />
                ) : (
                  <div className="upload-content">
                    <UploadIcon className="upload-icon" />
                    <span className="upload-text-main">Click to upload 500 x 500 logo</span>
                    <span className="upload-text-sub">PNG, JPG, GIF up to 5MB</span>
                  </div>
                )}
              </div>
              <input
                id="fileUpload"
                type="file"
                className="input-file"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileChange}
              />
            </div>

            <div className="rating-section2">
                <button
                  className="result-rating-button"
                  onClick={() => window.open('https://www.trustpilot.com/review/coincreate.org', '_blank')}
                >
                  Rate us on ★ Trustpilot
                </button>
              </div>


          </div>
        );
      case 2:
        return (
          <div className="form-step">
            <div className="form-group">
            <div className="decimals-label">
              <label htmlFor="decimals">
                Decimals (0-18)
                <button className="info-icon" data-tooltip={infoTexts.decimals}>i</button>
              </label>
              </div>
              <input
                id="decimals"
                type="number"
                className="input-field"
                value={decimals}
                onChange={(e) => setDecimals(e.target.value)}
                placeholder="0-18"
                min="0"
                max="18"
              />
            </div>
            <div className="form-group">
              {/* supply-label container s fixnutým rozložením */}
              <div className="supply-label">
                <div className="supply-left">
                  <label className="supplytext" htmlFor="supply">Supply</label>
                  <button className="info-icon" data-tooltip={infoTexts.supply}>i</button>
                </div>
                <span className="supply-variable">{formatSupplyValue(supply)}</span>
              </div>
              <input
                id="supply"
                type="number"
                className="input-field"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
                placeholder="1,000,000,000"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="form-step">
            <div className="input-row">
              <div className="form-group input-field-container">
                <label htmlFor="description">
                  Description
                  <button className="info-icon" data-tooltip={infoTexts.description}>i</button>
                </label>
                <textarea
                  id="description"
                  className="input-field"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="1"
                  placeholder="About..."
                />
              </div>
              <div className="form-group input-field-container">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="url"
                  className="input-field"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="URL"
                />
              </div>
            </div>
            <div className="input-row">
              <div className="form-group input-field-container">
                <label htmlFor="twitter">Twitter</label>
                <input
                  id="twitter"
                  type="text"
                  className="input-field"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="URL"
                />
              </div>
              <div className="form-group input-field-container">
                <label htmlFor="telegram">Telegram</label>
                <input
                  id="telegram"
                  type="text"
                  className="input-field"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="URL"
                />
              </div>
            </div>
            <div className={`form-group switch-field ${revokeMint ? 'active' : ''}`}>
              <div className="switch-info">
                <h4 className="switch-title">Revoke Mint</h4>
                <p className="switch-description">
                  Mint Authority allows you to mint more supply of your token.
                </p>
              </div>
              <button
                className="switch-button"
                onClick={() => setRevokeMint(!revokeMint)}
              >
                {revokeMint ? 'Selected' : 'Select to revoke'}
              </button>
            </div>
            <div className={`form-group switch-field ${revokeFreeze ? 'active' : ''}`}>
              <div className="switch-info">
                <h4 className="switch-title">Revoke Freeze</h4>
                <p className="switch-description">
                  Freeze Authority allows you to freeze token accounts of holders.
                </p>
              </div>
              <button
                className="switch-button"
                onClick={() => setRevokeFreeze(!revokeFreeze)}
              >
                {revokeFreeze ? 'Selected' : 'Select to revoke'}
              </button>
            </div>
            <div className={`form-group switch-field ${revokeUpdate ? 'active' : ''}`}>
              <div className="switch-info">
                <h4 className="switch-title">Revoke Update</h4>
                <p className="switch-description">
                  Update Authority allows you to change the token metadata later.
                </p>
              </div>
              <button
                className="switch-button"
                onClick={() => setRevokeUpdate(!revokeUpdate)}
              >
                {revokeUpdate ? 'Selected' : 'Select to revoke'}
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="form-step">
            <div className="summary">
              <div className="summary-row">
                <div className="summary-image-container">
                  {imagePreviewUrl && (
                    <img src={imagePreviewUrl} alt="Token" className="summary-image" />
                  )}
                </div>
                <div className="summary-details">
                  <p>
                    <strong>Name:</strong> {tokenName}
                  </p>
                  <p>
                    <strong>Symbol:</strong> {tokenSymbol}
                  </p>
                  <p>
                    <strong>Decimals:</strong> {decimals}
                  </p>
                  <p>
                    <strong>Supply:</strong> {supply}
                  </p>
                </div>
              </div>
              <p>
                <strong>Description:</strong> {description}
              </p>
              {website && <p><strong>Website:</strong> {website}</p>}
              {twitter && <p><strong>Twitter:</strong> {twitter}</p>}
              {telegram && <p><strong>Telegram:</strong> {telegram}</p>}
              <p>
                <strong>Revoke Mint Authority:</strong> {revokeMint ? 'Yes' : 'No'}
              </p>
              <p>
                <strong>Revoke Freeze Authority:</strong> {revokeFreeze ? 'Yes' : 'No'}
              </p>
              <p>
                <strong>Revoke Update Authority:</strong> {revokeUpdate ? 'Yes' : 'No'}
              </p>
              <p>
                <strong>Estimated Cost:</strong> {FEE_MODE === "NOFEE" ? '0 SOL' : '0.118 SOL'}
              </p>
            </div>
            <div className="terms-container">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <label htmlFor="terms">I Agree to Terms and Conditions</label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <ProgressBar currentStep={currentStep} progressPercent={progressPercent} />
      <form className="form-container" onSubmit={(e) => e.preventDefault()}>
        {renderStepContent()}
        {publicKey && currentStep < 5 && (
          <div className="button-group">
            {currentStep > 1 && (
              <button type="button" onClick={handleBack} className="button back-button">
                Back
              </button>
            )}
            {currentStep < 4 && (
              <button type="button" onClick={handleNext} className="button next-button">
                Next
              </button>
            )}
            {currentStep === 4 && (
              <button
                type="button"
                onClick={handleSubmit}
                className="button submit-button"
                disabled={loading || !acceptedTerms}
              >
                {loading ? 'Creating Token...' : 'Create Token'}
              </button>
            )}
          </div>
        )}
        <div className="mobileonly">
          <h3 className="whiteh3">Try Copying</h3>
          <button className="inderbut">
            <Link to="/trending" className="trendingfet">
              Trending Tokens
            </Link>
            <span className="new-tag2">New</span>
          </button>
        </div>
      </form>
      <CoinHistory />
    </div>
  );
};

/* ░░░  CREATE TOKEN PAGE  ░░░  */
const CreateTokenPage = ({ onTokenCreated }) => {
  const endpoint =
    'https://snowy-newest-diagram.solana-mainnet.quiknode.pro/1aca783b369672a2ab65d19717ce7226c5747524';

  return (
    <div>
      <div className="topapp">
        <h1 className="app-title">Create Your Own Token NOW</h1>
        <p className="app-subtitle">
          Launch your own token on Solana in seconds. No coding required.
        </p>
      </div>
      <CreateTokenForm endpoint={endpoint} onTokenCreated={onTokenCreated} />
      <InstructionsSection />
      <FAQSection />
    </div>
  );
};

/* ░░░  FOOTER  ░░░  */
const Footer = () => {
  return (
    <footer className="footer">
      <p>
        FOLLOW OUR OFFICIAL{' '}
        <a className="afooter" href="https://discord.gg/66eYfa4xYx">
          DISCORD CHANNEL
        </a>{' '}
        FOR UPDATES
      </p>
      <p>
        CoinCreate.org© is a token creation platform that allows users to generate
        Solana-based tokens instantly, with no coding required. CoinCreate.org©
        "CoinCreate©" does not issue, endorse, manage, or provide liquidity for any
        tokens created using our service. We do not provide financial advice,
        investment recommendations, or guarantees of value, price, or returns on any
        tokens. Tokens created on CoinCreate.org© are not securities, and users are
        solely responsible for ensuring compliance with applicable laws and
        regulations in their jurisdiction. CoinCreate.org© does not facilitate token
        trading, fundraising, or liquidity provision. By using CoinCreate.org©, you
        acknowledge that creating and trading tokens carry significant risks,
        including loss of funds, market volatility, and regulatory uncertainty.
        CoinCreate© is provided "as is" without warranties of any kind. We are not
        responsible for any outcomes related to the use of our platform. By using
        CoinCreate.org©, you accept full responsibility for your actions and any
        consequences that may arise. Always conduct your own due diligence before
        engaging with any token or project.
      </p>
      <p>
        © 2025 CoinCreate.org | All Rights Reserved | Support on Discord{' '}
        <a className="afooter" href="https://discord.gg/66eYfa4xYx">
          Support
        </a>{' '}
        | Become an affiliate for{' '}
        <a className="afooter" href="https://discord.gg/66eYfa4xYx">
          CoinCreate.org©
        </a>
      </p>
    </footer>
  );
};

/* ░░░  APP CONTENT  ░░░  */
function AppContent() {
  const [tokenCreationResult, setTokenCreationResult] = useState(null);

  const handleTokenCreated = (result) => {
    setTokenCreationResult(result);
  };

  useEffect(() => {
    // Případná další logika...
  }, []);

  return (
    <div className="app-wrapper">
      <Header />
      <div className="app-container">
        <Routes>
          <Route
            path="/"
            element={<CreateTokenPage onTokenCreated={handleTokenCreated} />}
          />
          <Route
            path="/trending"
            element={<TrendingPage onTokenCreated={handleTokenCreated} />}
          />
          <Route path="/affiliate" element={<AffiliateDashboard />} />
          <Route path="/note" element={<PhantomNote />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

/* ░░░  HLAVNÍ APLIKAČNÍ KOMPONENTA  ░░░  */
export default function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

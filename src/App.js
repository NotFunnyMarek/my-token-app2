/* global BigInt */
import React, { useState, createContext, useContext, useEffect } from 'react';
import { Buffer } from 'buffer';
import logo from './Fra6me 5925.png';
import { ReactComponent as UploadIcon } from './upload-icon.svg';

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

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

import TrendingPage from './Trending';
import AffiliateDashboard from './affiliate';
import PhantomNote from './phantom-note'; // cesta podle umístění souboru
import '@solana/wallet-adapter-react-ui/styles.css';
import './app.css';

// Nastavení Bufferu pro prohlížeče
window.Buffer = Buffer;

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

// Pomocná funkce pro získání cookie
function getCookie(name) {
  let nameEQ = name + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// ================ CUSTOM INSTRUCTION: REVOKE AUTHORITY ================
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

// ================ NOTIFIKAČNÍ SYSTÉM ================
const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

const NotificationProvider = ({ children }) => {
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

// ================ HEADER ================
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleReload = (e) => {
    e.preventDefault();
    navigate('/'); // Přesměrujeme na Create Token stránku
    window.location.reload();
  };

  return (
    <header className="header">
      <div className="header-top">
        <p className='headerr'>
        <Link  to="/note" style={{textDecoration: 'none', color: 'inherit'}}>
        ⚡ OFFICIALLY WHITELISTED BY PHANTOM! "VIEW MORE" ⚡
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
            <WalletMultiButton />
          </div>
        </div>

        {/* Hamburger menu (mobile) */}
        <button
          className="hamburger-menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
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

// ================ INSTRUCTIONS SECTION ================
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

// ================ FAQ SECTION ================
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

// ================ COIN HISTORY ================
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
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(historyKey);
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
          <button type="button" className="clear-history-button" onClick={handleClearHistory}>
            Clear History
          </button>
        </>
      )}
    </div>
  );
};

// ================ FUNKCE: CREATE COIN ON SOLANA ================
export async function createCoinOnSolana({
  publicKey,
  signAndSendTransaction,
  signTransaction,
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
}) {
  try {
    const walletKey = new PublicKey(publicKey.toString());
    const connection = new Connection(endpoint, 'confirmed');

    // Kontrola dostatečného SOL na poplatky
    const balance = await connection.getBalance(walletKey);
    if (balance < 0.118 * LAMPORTS_PER_SOL) {
      addNotification({
        type: 'error',
        message: 'Insufficient SOL to cover fees (min 0.11 SOL).',
      });
      return { success: false, message: 'Not enough SOL.' };
    }

    const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
    const pinataSecret = process.env.REACT_APP_PINATA_SECRET_API_KEY;
    if (!pinataApiKey || !pinataSecret) {
      addNotification({ type: 'error', message: 'Missing Pinata API keys.' });
      return { success: false, message: 'Missing Pinata API keys.' };
    }

    // Vytvoření metadata JSON a nahrání na Pinata
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

    // Derivace mint účtu pomocí createAccountWithSeed
    const seed = tokenSymbol.toLowerCase() + "_" + Date.now().toString().slice(-6);
    const mintPubkey = await PublicKey.createWithSeed(walletKey, seed, TOKEN_PROGRAM_ID);

    const lamports = await connection.getMinimumBalanceForRentExemption(MintLayout.span);
    const transaction = new Transaction();
    transaction.feePayer = walletKey;
    let { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    // Poplatek 0.1 SOL
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: walletKey,
        toPubkey: new PublicKey('DnGMKFnAh9qtatYpZsLJhwS6NN1G6LC5WtbRyuNX8o4X'),
        lamports: 0.1 * LAMPORTS_PER_SOL,
      })
    );

    // Vytvoření mint účtu pomocí createAccountWithSeed
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

    // Inicializace mintu
    transaction.add(
      createInitializeMintInstruction(
        mintPubkey,
        Number(decimals),
        walletKey,
        walletKey
      )
    );

    // Vytvoření Associated Token Account
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

    // Mintnutí tokenů
    const decimalsNum = Number(decimals);
    const supplyAmount = BigInt(supply) * (10n ** BigInt(decimalsNum));
    transaction.add(
      createMintToInstruction(
        mintPubkey,
        associatedTokenAddress,
        walletKey,
        supplyAmount
      )
    );

    // Metaplex on-chain metadata
    const [metadataPDA] = await PublicKey.findProgramAddress(
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

    // Přidání revoke instrukcí
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

    // Odeslání transakce – nejprve pokusíme odeslat pomocí signAndSendTransaction
    let txId;
    if (signAndSendTransaction && typeof signAndSendTransaction === 'function') {
      try {
        const txResponse = await signAndSendTransaction(transaction);
        txId = txResponse.signature;
      } catch (error) {
        if (error.message && error.message.includes('Blockhash not found')) {
          // Pokud blockhash není nalezen, získáme nový a zkusíme transakci znovu
          const latest = await connection.getLatestBlockhash();
          transaction.recentBlockhash = latest.blockhash;
          const txResponse = await signAndSendTransaction(transaction);
          txId = txResponse.signature;
        } else {
          throw error;
        }
      }
    } else if (signTransaction && typeof signTransaction === 'function') {
      const signedTx = await signTransaction(transaction);
      txId = await connection.sendRawTransaction(signedTx.serialize());
    } else {
      throw new Error('No transaction signing method available.');
    }

    const mintAddressStr = mintPubkey.toBase58();

    // Affiliate logika
    const affiliateId = getCookie("affiliateId");
    if (affiliateId) {
      axios.post("https://app.byxbot.com/php/links.php", {
        affiliateId: affiliateId,
        action: "coinCreated",
        walletAddress: walletKey.toBase58()
      })
        .then(response => {
          console.log("Affiliate updated", response.data);
          document.cookie = "affiliateId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        })
        .catch(err => console.error("Error updating affiliate count:", err));
    }

    // Uložení historie vytvořených coinů do localStorage
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

// ================ PROGRESS BAR ================
const ProgressBar = ({ currentStep, progressPercent }) => {
  const steps = [1, 2, 3, 4, 5];
  return (
    <div className="progress-bar-wrapper">
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
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

// ================ CREATE TOKEN FORM ================
const CreateTokenForm = ({ endpoint }) => {
  const { publicKey, signAndSendTransaction, signTransaction } = useWallet();
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

  const progressPercent = ((currentStep - 1) / 4) * 100;

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
    setLoading(true);

    const resultObj = await createCoinOnSolana({
      publicKey,
      signAndSendTransaction,
      signTransaction,
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
    });

    setLoading(false);
    setResult(resultObj);
    setCurrentStep(5);
  };

  if (result) {
    return (
      <form className="form-container">
        <div className="trending-container">
          <div className="trending-header">
            <h2>Result:</h2>
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
              <button type="button" onClick={() => { setResult(null); setCurrentStep(4); }} className="button back-button">
                Back
              </button>
            </div>
          )}
        </div>
      </form>
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
                <label htmlFor="tokenName">Token Name</label>
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
                <label htmlFor="tokenSymbol">Token Symbol</label>
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
                  <img src={imagePreviewUrl} alt="Token preview" className="image-preview" />
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
          </div>
        );
      case 2:
        return (
          <div className="form-step">
            <div className="form-group">
              <label htmlFor="decimals">Decimals (0-18)</label>
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
              <label htmlFor="supply">Supply</label>
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
                <label htmlFor="description">Description</label>
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
                <strong>Estimated Cost:</strong> 0.118 SOL
              </p>
            </div>
          </div>
        );
      case 5:
        return null;
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
                disabled={loading}
              >
                {loading ? 'Creating Token...' : 'Create Token'}
              </button>
            )}
          </div>
        )}
        <div className="mobileonly">
          <h3 className="whiteh3">Try Copying</h3>
          <button className="inderbut">
            <a href="/trending" className="trendingfet">Trending Tokens</a>
            <span className="new-tag2">New</span>
          </button>
        </div>
      </form>
      <CoinHistory />
    </div>
  );
};

const CreateTokenPage = () => {
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
      <CreateTokenForm endpoint={endpoint} />
      <InstructionsSection />
      <FAQSection />
    </div>
  );
};

// ================ FOOTER ================
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
      CoinCreate.org© is a token creation platform that allows users to generate Solana-based tokens instantly, with no coding required. CoinCreate.org© "CoinCreate©" does not issue, endorse, manage, or provide liquidity for any tokens created using our service. We do not provide financial advice, investment recommendations, or guarantees of value, price, or returns on any tokens. Tokens created on CoinCreate.org© are not securities, and users are solely responsible for ensuring compliance with applicable laws and regulations in their jurisdiction. CoinCreate.org© does not facilitate token trading, fundraising, or liquidity provision. By using CoinCreate.org©, you acknowledge that creating and trading tokens carry significant risks, including loss of funds, market volatility, and regulatory uncertainty. CoinCreate© is provided "as is" without warranties of any kind. We are not responsible for any outcomes related to the use of our platform. By using CoinCreate.org©, you accept full responsibility for your actions and any consequences that may arise. Always conduct your own due diligence before engaging with any token or project.
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

export default function App() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const af = urlParams.get('af');
    if (af) {
      document.cookie = `affiliateId=${af}; path=/;`;
    }
    const clearAffiliateCookie = () => {
      document.cookie = "affiliateId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    };
    window.addEventListener('beforeunload', clearAffiliateCookie);
    return () => {
      window.removeEventListener('beforeunload', clearAffiliateCookie);
    };
  }, []);

  return (
    <NotificationProvider>
      <div className="app-wrapper">
        <Header />
        <div className="app-container">
          <Routes>
            <Route path="/" element={<CreateTokenPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/affiliate" element={<AffiliateDashboard />} />
            <Route path="/note" element={<PhantomNote />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </NotificationProvider>
  );
}

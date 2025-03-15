import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Používáme oficiální wallet adaptéry – Phantom, Sollet a Solflare
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolletWalletAdapter } from '@solana/wallet-adapter-sollet';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

import App from './App';
import './app.css';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

const network = WalletAdapterNetwork.Mainnet;
const wallets = [
  new PhantomWalletAdapter(),
  new SolletWalletAdapter({ network }),
  new SolflareWalletAdapter({ network }),
];

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </BrowserRouter>
  </React.StrictMode>
);

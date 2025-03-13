import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Používáme oficiální wallet adaptéry – ujistěte se, že máte verzi podporující signAndSendTransaction (min. v0.11.0)
// (V současnosti použijte aktuální verzi, např. 0.9.24, a fallback řešení, jak je vidět v kódech)
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

import App from './App';
import './app.css';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

const network = WalletAdapterNetwork.Mainnet;
const wallets = [
  new PhantomWalletAdapter(), // Ujistěte se, že používáte aktuální verzi, např. 0.9.24
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

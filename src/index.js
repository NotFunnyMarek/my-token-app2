import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Solana wallet adaptéry
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

import App from './App';
import './app.css'; // váš CSS

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

const network = WalletAdapterNetwork.Mainnet;
const wallets = [new PhantomWalletAdapter()];

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

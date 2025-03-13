import React from 'react';
import './phantom-note.css';
import './app.css';

export default function PhantomNote() {
  return (
    <div className="phantom-note-container">
      {/* Blok s "Great news" a zelenou fajfkou */}
      <div className="phantom-note-alert">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.00039 16.1701L4.83039 12.0001L3.41039 13.4101L9.00039 19.0001L21.0004 7.00012L19.5904 5.59012L9.00039 16.1701Z"
            fill="#34d399"
          />
        </svg>
        <p>
          Exciting announcement: <strong>CoinCreate has been officially added to Phantom's whitelist!</strong>{' '}
          You won't encounter any security warnings during token generation anymore.
        </p>
      </div>

      {/* Hlavní nadpis */}
      <h1>CoinCreate Received Official Whitelist Approval from Phantom!</h1>

      <div className="phantom-note-section">
        <h2>Official Phantom Whitelist Status</h2>
        <p>
          We’re thrilled to share that CoinCreate has secured an official spot on Phantom Wallet’s whitelist, in collaboration with their security partner, Blowfish. After a thorough verification of our authenticity, Phantom recognizes CoinCreate as a reliable and secure solution for token creation on Solana.
        </p>
      </div>

      {/* Nová sekce "How We Achieved Whitelist Status" */}
      <div className="phantom-note-section">
        <h2>How We Achieved Whitelist Status</h2>
        <p>
          Our placement on Phantom’s whitelist reflects our unwavering commitment to security and transparency. Our approach included:
        </p>
        <ul>
          <li>
            Collaborating closely with Phantom’s security team to validate our platform’s authenticity
          </li>
          <li>
            Implementing Phantom’s recommended security measures, including the{' '}
            <strong className="redpink">signAndSendTransaction</strong> method
          </li>
          <li>Providing detailed documentation of our token creation processes</li>
          <li>
            Demonstrating our reliability by successfully assisting over 1,000 users without any security issues
          </li>
        </ul>
      </div>

      <div className="phantom-note-section">
        <h2>Our Growing Community</h2>
        <p>
          Since launching CoinCreate on March 1th, 2025, over 900 users have successfully created tokens on Solana with our help. Our community continues to expand, driven by our dedication to a secure, transparent, and user-friendly token creation experience.
        </p>
      </div>

      <div className="phantom-note-section">
        <h2>Ongoing Security Commitment</h2>
        <p>
          Even as we celebrate this significant milestone, our dedication to security remains steadfast. We will continue collaborating with Phantom and other partners to uphold top-tier security standards and adopt the latest best practices for creating tokens on Solana.
        </p>
      </div>

      <div className="phantom-note-section">
        <h2>Beware of Imposters</h2>
        <p>
          With our platform's growing popularity, we've noticed some imposters trying to capitalize on our success. Always verify that you’re using the authentic CoinCreate platform at <strong className='redpink'>coincreate.org</strong>, and be cautious of counterfeit websites or social media profiles impersonating us.
        </p>
        <p>Remember, our genuine platform:</p>
        <ul>
          <li>Operates exclusively at <strong className='redpink'>coincreate.org</strong></li>
          <li>Never requests your private keys or seed phrases</li>
          <li>Clearly communicates all fees and procedures</li>
          <li>Has received official whitelist approval from Phantom</li>
        </ul>
        <div className="phantom-note-highlight2">
          If you have any inquiries or feedback, feel free to contact our support team at{' '}
          <a href="mailto:coincreate.co@gmail.com">coincreate.co@gmail.com</a>.
        </div>
      </div>

      {/* Blok pro Our Commitment to Security */}
      <div className="phantom-note-highlight">
        <h2>Our Commitment to Security</h2>
        <p>
          At CoinCreate, the security and safety of our users are our top priorities. Our platform:
        </p>
        <ul>
          <li>Does not store your private keys</li>
          <li>Utilizes client-side signing for all transactions</li>
          <li>Adheres to Solana's best practices for token creation</li>
          <li>Provides complete transparency regarding all fees and procedures</li>
        </ul>
      </div>
    </div>
  );
}

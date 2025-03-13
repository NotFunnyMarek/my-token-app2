import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode'; // npm install qrcode
import './TokenClashArena.css';

/**
 * Komponenta TokenClashArena
 * 
 * Props:
 *  - tokenName: Název tokenu
 *  - tokenSymbol: Symbol tokenu
 *  - mintAddress: Mint adresa tokenu
 *  - imageUri: URL obrázku tokenu (nahraného uživatelem)
 *  - coinIndex: Pořadí coinu (např. "#1")
 */
const TokenClashArena = ({ tokenName, tokenSymbol, mintAddress, imageUri, coinIndex }) => {
  const canvasRef = useRef(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [score, setScore] = useState(0);
  
  // Video engagement state
  const [videoLink, setVideoLink] = useState('');
  const [engagement, setEngagement] = useState(null);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  // Načteme aktuální skóre z localStorage
  useEffect(() => {
    const savedScore = localStorage.getItem('tokenClashScore');
    if (savedScore) {
      setScore(parseInt(savedScore, 10));
    }
  }, []);

  // Funkce pro generování obrázku
  const generateImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // Vyplníme pozadí černou
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Vykreslíme levý horní box pro Name & Symbol
    ctx.fillStyle = '#111111';
    ctx.fillRect(20, 20, 360, 120);

    // Vykreslíme dolní box pro Mint Address
    ctx.fillStyle = '#111111';
    ctx.fillRect(20, 660, 760, 100);

    // Vykreslíme střední box pro token obrázek
    ctx.fillStyle = '#222222';
    ctx.fillRect(300, 200, 200, 200);

    // 1) Levý horní box – název a symbol (bílý text)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(tokenName || 'Unknown Token', 40, 60);
    ctx.font = '24px sans-serif';
    ctx.fillText(`(${tokenSymbol || 'SYM'})`, 40, 100);

    // 2) Střed – obrázek tokenu
    if (imageUri) {
      const tokenImg = new Image();
      tokenImg.crossOrigin = 'Anonymous';
      tokenImg.src = imageUri;
      await new Promise((resolve) => {
        tokenImg.onload = resolve;
        tokenImg.onerror = resolve;
      });
      ctx.drawImage(tokenImg, 300, 200, 200, 200);
    }

    // 3) Dolní box – mint adresa
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Mint: ${mintAddress || 'N/A'}`, 40, 720);

    // 4) Namísto "power" zobrazíme identifikační číslo, např. "#1"
    ctx.textAlign = 'right';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#ffdf00';
    ctx.fillText(`#${coinIndex}`, width - 40, height - 40);

    // 5) QR kód pro odkaz na explorer
    const explorerLink = `https://solscan.io/token/${mintAddress}?cluster=devnet`;
    try {
      const qrDataUrl = await QRCode.toDataURL(explorerLink, { margin: 1, width: 150 });
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.onerror = resolve;
      });
      ctx.drawImage(qrImg, width - 200, 20, 150, 150);
    } catch (err) {
      console.error('QR code generation error:', err);
    }

    const dataURL = canvas.toDataURL('image/png');
    setGeneratedImage(dataURL);
  };

  // Rozbalovací menu pro sdílení
  const handleShareClick = () => {
    setShareMenuOpen(!shareMenuOpen);
  };

  const handleSelectShareTarget = async (target) => {
    if (!generatedImage) {
      alert('Please generate the image first!');
      return;
    }
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const filesArray = [
        new File([blob], 'token_clash.png', { type: blob.type }),
      ];
      await navigator.share({
        title: 'Check out my token!',
        text: `I created a token: ${tokenName} (${tokenSymbol}). Shared via ${target}. #CoinCreate`,
        files: filesArray,
      });
      updateScore(5);
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Sharing failed.');
    }
    setShareMenuOpen(false);
  };

  // Stažení obrázku
  const handleDownload = () => {
    if (!generatedImage) {
      alert('Please generate the image first!');
      return;
    }
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'token_clash.png';
    link.click();
  };

  // Aktualizace skóre
  const updateScore = (points) => {
    const newScore = score + points;
    setScore(newScore);
    localStorage.setItem('tokenClashScore', newScore.toString());
  };

  // Funkce pro odeslání video odkazu a správné přičtení bodů
  const handleVideoSubmit = () => {
    if (!videoLink) {
      alert('Please enter the video link.');
      return;
    }
    // Simulace aktuálních metrik
    const currentViews = Math.floor(Math.random() * 1000) + 100;
    const currentLikes = Math.floor(Math.random() * 100) + 10;
    const currentComments = Math.floor(Math.random() * 20) + 1;
    const currentEngagement = { views: currentViews, likes: currentLikes, comments: currentComments };

    const engagementKey = `videoEngagement_${mintAddress}`;
    const storedData = localStorage.getItem(engagementKey);
    let previousEngagement = storedData ? JSON.parse(storedData) : null;
    let diffViews = 0, diffLikes = 0, diffComments = 0;

    if (previousEngagement && previousEngagement.link === videoLink) {
      // Přičítáme pouze rozdíl
      diffViews = Math.max(0, currentViews - previousEngagement.views);
      diffLikes = Math.max(0, currentLikes - previousEngagement.likes);
      diffComments = Math.max(0, currentComments - previousEngagement.comments);
    } else {
      // Pokud není uloženo nebo jde o nové video, použijeme celá čísla
      diffViews = currentViews;
      diffLikes = currentLikes;
      diffComments = currentComments;
    }

    // Výpočet bodů: 1 bod za 10 views, 2 body za like, 3 body za komentář
    const points = Math.floor(diffViews / 10) + diffLikes * 2 + diffComments * 3;

    if (points > 0) {
      updateScore(points);
      // Uložíme aktuální engagement
      localStorage.setItem(
        engagementKey,
        JSON.stringify({
          link: videoLink,
          views: currentViews,
          likes: currentLikes,
          comments: currentComments,
        })
      );
      setEngagement(currentEngagement);
    } else {
      alert('No new engagement detected.');
    }
  };

  return (
    <div className="tokenclash-arena-container">
      <h2 className="tokenclash-title">Token Clash Arena</h2>
      <p className="tokenclash-subtitle">
        Generate a unique image for your token and earn points by sharing and tracking engagement!
      </p>
      <div className="tokenclash-buttons">
        <button onClick={generateImage} className="tokenclash-btn generate-btn">
          Generate Image
        </button>
        <button onClick={handleShareClick} className="tokenclash-btn share-btn">
          Share
        </button>
        <button onClick={handleDownload} className="tokenclash-btn download-btn">
          Download Image
        </button>
      </div>
      {shareMenuOpen && (
        <div className="tokenclash-share-menu">
          <p>Select platform to share:</p>
          <button onClick={() => handleSelectShareTarget('TikTok')} className="tokenclash-btn">
            TikTok
          </button>
          <button onClick={() => handleSelectShareTarget('Instagram')} className="tokenclash-btn">
            Instagram
          </button>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {generatedImage && (
        <div className="tokenclash-image-preview">
          <img src={generatedImage} alt="Generated Token" />
        </div>
      )}

      {/* Video Engagement Tracker */}
      <div className="tokenclash-video-tracker">
        <h3>Video Engagement Tracker</h3>
        <p>Paste the link to your shared video:</p>
        <input
          type="url"
          className="tokenclash-video-input"
          value={videoLink}
          onChange={(e) => setVideoLink(e.target.value)}
          placeholder="https://..."
        />
        <button onClick={handleVideoSubmit} className="tokenclash-btn submit-video-btn">
          Submit Video
        </button>
        {engagement && (
          <div className="tokenclash-engagement-display">
            <p>Views: {engagement.views}</p>
            <p>Likes: {engagement.likes}</p>
            <p>Comments: {engagement.comments}</p>
          </div>
        )}
      </div>

      <div className="tokenclash-score-section">
        <h3>Your Current Score: {score} points</h3>
        <p>Earn more points by sharing your token image and driving engagement!</p>
      </div>
    </div>
  );
};

export default TokenClashArena;

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt) return null;

  return (
    <button 
      onClick={handleInstallClick}
      className="px-2.5 py-1 bg-ink text-paper text-xs font-semibold rounded-md flex items-center gap-1 hover:bg-gold hover:text-ink transition shadow-sm"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Install</span>
    </button>
  );
}
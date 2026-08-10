import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowLeft, Stamp, Sparkles, AlertCircle } from 'lucide-react';

export default function OpenLetter() {
  const { id } = useParams();
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLetter();
    }
  }, [id]);

  const fetchLetter = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get(`/letters/show.php?id=${id}`);
      if (res.data.success) {
        setLetter(res.data.letter);
      } else {
        setErrorMsg(res.data.message || 'Letter not found.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setErrorMsg(err.response?.data?.message || 'Letter missing or inaccessible.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-ink/60 font-serif">Locating letter in vault...</div>;
  }

  if (errorMsg || !letter) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto px-4">
        <div className="p-4 bg-stampRed/10 border border-stampRed/30 text-stampRed rounded-xl text-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMsg || 'Letter missing or inaccessible.'}</span>
        </div>
        <div>
          <Link to="/inbox" className="text-xs font-semibold text-ink underline">
            Return to Inbox
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col items-center">
      <Link
        to="/inbox"
        className="self-start flex items-center gap-2 text-xs font-semibold text-ink/60 hover:text-ink transition mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Inbox
      </Link>

      {!isOpen ? (
        /* Sealed Envelope Screen */
        <div className="w-full max-w-md bg-envelope border-2 border-gold/40 rounded-2xl p-8 shadow-xl text-center space-y-6 transform transition hover:scale-102">
          <div className="flex justify-between items-start border-b border-gold/20 pb-4">
            <div className="text-left">
              <span className="text-[10px] font-mono text-ink/50 uppercase tracking-widest block">From</span>
              <p className="font-bold text-sm text-ink">@{letter.sender_username}</p>
            </div>
            <div className="w-10 h-12 border-2 border-dashed border-stampRed/60 bg-stampRed/10 rounded flex items-center justify-center">
              <Stamp className="w-5 h-5 text-stampRed" />
            </div>
          </div>

          <div className="py-6 space-y-2">
            <Mail className="w-12 h-12 text-gold mx-auto animate-bounce" />
            <p className="font-serif text-2xl text-ink">{letter.subject}</p>
            <p className="text-xs text-ink/50">Delivered on {new Date(letter.created_at).toLocaleDateString()}</p>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="w-full py-3.5 bg-ink text-paper font-semibold text-sm rounded-xl shadow-md hover:bg-gold hover:text-ink transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> OPEN LETTER
          </button>
        </div>
      ) : (
        /* Unfolded Letter View */
        <div className="w-full bg-paper border-2 border-envelope rounded-2xl p-8 md:p-12 shadow-lg space-y-6 animate-unfold relative">
          <div className="flex justify-between items-center border-b border-envelope pb-4 text-xs text-ink/60 font-mono">
            <div>
              FROM: <span className="font-bold text-ink">@{letter.sender_username}</span> ({letter.sender_name})
            </div>
            <div>{new Date(letter.created_at).toLocaleDateString()}</div>
          </div>

          <div className="space-y-4">
            <h1 className="font-serif text-3xl md:text-4xl text-ink border-b border-gold/20 pb-3">
              {letter.subject}
            </h1>
            <p className="text-sm md:text-base leading-relaxed text-ink/90 whitespace-pre-wrap font-sans">
              {letter.message}
            </p>
          </div>

          <div className="pt-8 border-t border-envelope flex justify-end">
            <div className="font-serif italic text-sm text-ink/60">~ End of Letter ~</div>
          </div>
        </div>
      )}
    </div>
  );
}
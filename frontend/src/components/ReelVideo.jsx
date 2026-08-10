import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function ReelVideo({ src }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Autoplay / Pause based on scroll visibility
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch((err) => console.log('Autoplay deferred:', err));
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 } // Plays when 60% of the video is visible
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl my-3 border border-envelope/20">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Reel Mute/Unmute Control Overlay */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/60 text-paper backdrop-blur-md hover:bg-black/80 transition z-10"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
}
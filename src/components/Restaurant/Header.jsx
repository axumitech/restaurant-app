import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';

function formatCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

export default function Header() {
  const [currentTime, setCurrentTime] = useState(formatCurrentTime);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(formatCurrentTime());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" aria-label="Premium Délice" className="flex items-center">
          <img
            src="/premium-delice-logo.png"
            alt="Premium Délice"
            className="w-14 h-14 rounded-full object-contain"
          />
        </Link>
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex items-center gap-1 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-inter">{currentTime}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-inter">Kinshasa</span>
          </div>
        </div>
      </div>
    </header>
  );
}

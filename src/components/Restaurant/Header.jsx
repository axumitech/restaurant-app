import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';

export default function Header() {
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
            <span className="font-inter">11h-14h</span>
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

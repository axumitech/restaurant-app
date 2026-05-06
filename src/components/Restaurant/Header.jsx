import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-inter font-black text-sm">KD</span>
          </div>
          <div>
            <h1 className="font-inter font-bold text-sm text-foreground leading-tight">
              Restaurant Kin Délices
            </h1>
            <p className="font-inter text-xs text-primary font-semibold leading-tight">
              Cuisine congolaise
            </p>
          </div>
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

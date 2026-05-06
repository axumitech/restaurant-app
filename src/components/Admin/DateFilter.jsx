import React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLocalStartOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getToday() {
  return getLocalStartOfDay();
}

function isSameLocalDate(dateA, dateB) {
  return formatDateValue(dateA) === formatDateValue(dateB);
}

function formatDateLabel(date) {
  const today = getToday();

  if (isSameLocalDate(date, today)) {
    return "Aujourd'hui";
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function DateFilter({ selectedDate, onDateChange }) {
  const inputRef = React.useRef(null);
  const today = getToday();
  const isToday = isSameLocalDate(selectedDate, today);
  const subtitle = isToday ? "Commandes d'aujourd'hui" : 'Commandes du jour sélectionné';
  const visibleDateLabel = formatDateLabel(selectedDate);

  const handleStep = (amount) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + amount);

    if (next <= today) {
      onDateChange(getLocalStartOfDay(next));
    }
  };

  const openDatePicker = () => {
    if (typeof inputRef.current?.showPicker === 'function') {
      inputRef.current.showPicker();
      return;
    }

    inputRef.current?.click();
    inputRef.current?.focus();
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <p className="font-inter font-semibold text-foreground text-sm">{visibleDateLabel}</p>
          <p className="font-inter text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          className="w-10 h-10 rounded-xl bg-secondary text-foreground flex items-center justify-center hover:bg-secondary/70 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={openDatePicker}
          className="relative h-10 min-w-36 rounded-xl border border-border bg-secondary px-3 text-sm font-inter text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <span>{visibleDateLabel}</span>
          <input
            ref={inputRef}
            type="date"
            value={formatDateValue(selectedDate)}
            max={formatDateValue(today)}
            onChange={(event) => {
              const [year, month, day] = event.target.value.split('-').map(Number);
              const next = new Date(year, month - 1, day);
              if (next <= today) {
                onDateChange(next);
              }
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Choisir une date"
            tabIndex={-1}
          />
        </button>

        <button
          type="button"
          onClick={() => handleStep(1)}
          disabled={isToday}
          className="w-10 h-10 rounded-xl bg-secondary text-foreground flex items-center justify-center hover:bg-secondary/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

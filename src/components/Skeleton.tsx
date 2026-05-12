'use client';

/** Shimmering placeholder shown while data is loading */
export function Skeleton({ h = 'h-6', className = '' }: { h?: string; className?: string }) {
  return (
    <div
      className={`${h} ${className} rounded-xl animate-pulse`}
      style={{ background: 'rgba(45,106,79,0.07)' }}
    />
  );
}

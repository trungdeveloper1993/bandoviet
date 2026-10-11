import React, { useEffect, useState } from 'react';

// Full class names so Tailwind picks them up
const GRADIENTS = [
  'from-indigo-500 via-violet-500 to-fuchsia-500',
  'from-sky-500 via-cyan-500 to-emerald-400',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-rose-500 via-pink-500 to-purple-500',
  'from-blue-600 via-indigo-500 to-sky-400',
];
const EMOJIS = ['🏞️', '🏝️', '⛰️', '🏯', '🌅', '🗺️'];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface SmartImageProps {
  src?: string;
  alt: string;
  className?: string;
  /** Seed for the fallback gradient so each place keeps a stable look */
  seed?: string;
  emojiClassName?: string;
}

/** Lazy image that swaps to a colourful placeholder when the link is broken. */
export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = '',
  seed,
  emojiClassName = 'text-4xl',
}) => {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (failed) {
    const h = hash(seed || alt);
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-linear-to-br ${GRADIENTS[h % GRADIENTS.length]} flex items-center justify-center ${className}`}
      >
        <span className={`select-none drop-shadow ${emojiClassName}`}>{EMOJIS[h % EMOJIS.length]}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export default SmartImage;

import { useState, useEffect } from 'react';

// 10 Curated High-Definition TMDB Movie Backdrops (3840x2160 / 1920x1080)
const HERO_BACKDROPS = [
  {
    id: 'dune-2',
    title: 'Dune: Part Two',
    tmdbId: 693134,
    url: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
    fallbackUrl: 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
  },
  {
    id: 'interstellar',
    title: 'Interstellar',
    tmdbId: 157336,
    url: 'https://image.tmdb.org/t/p/original/vgnoBSVzWAV9sNQUORaDGvDp7wx.jpg',
    fallbackUrl: 'https://image.tmdb.org/t/p/w1280/vgnoBSVzWAV9sNQUORaDGvDp7wx.jpg',
  },
  {
    id: 'the-batman',
    title: 'The Batman',
    tmdbId: 414906,
    url: 'https://image.tmdb.org/t/p/original/rvtdN5XkWAfGX6xDuPL6yYS2seK.jpg',
    fallbackUrl: 'https://image.tmdb.org/t/p/w1280/rvtdN5XkWAfGX6xDuPL6yYS2seK.jpg',
  },
  {
    id: 'avatar-2',
    title: 'Avatar: The Way of Water',
    tmdbId: 76600,
    url: 'https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vREc0547VKqEv.jpg',
    fallbackUrl: 'https://image.tmdb.org/t/p/w1280/8rpDcsfLJypbO6vREc0547VKqEv.jpg',
  },
  {
    id: 'pirates-3',
    title: "Pirates of the Caribbean: At World's End",
    tmdbId: 285,
    url: 'https://image.tmdb.org/t/p/original/qvzVWohbdcrnaD9qaa6IjrjXHMZ.jpg',
    fallbackUrl: 'https://image.tmdb.org/t/p/w1280/qvzVWohbdcrnaD9qaa6IjrjXHMZ.jpg',
  },
  {
    id: 'jurassic-world-dominion',
    title: 'Jurassic World Dominion',
    tmdbId: 507086,
    url: 'https://image.tmdb.org/t/p/original/9eAn20y26wtB3aet7w9lHjuSgZ3.jpg',
    fallbackUrl: 'https://image.tmdb.org/t/p/w1280/9eAn20y26wtB3aet7w9lHjuSgZ3.jpg',
  },
  {
    id: 'blade-runner-2049',
    title: 'Blade Runner 2049',
    tmdbId: 335984,
    url: 'https://image.tmdb.org/t/p/original/3bWUP9kyf9BxVc0hmZdqXB2w4UP.jpg',
    fallbackUrl: 'https://image.tmdb.org/t/p/w1280/3bWUP9kyf9BxVc0hmZdqXB2w4UP.jpg',
  },
  {
    id: 'mad-max-fury-road',
    title: 'Mad Max: Fury Road',
    tmdbId: 76341,
    url: 'https://image.tmdb.org/t/p/original/gqrnQA6Xppdl8vIb2eJc58VC1tW.jpg',
    fallbackUrl: 'https://image.tmdb.org/t/p/w1280/gqrnQA6Xppdl8vIb2eJc58VC1tW.jpg',
  },
  {
    id: 'oppenheimer',
    title: 'Oppenheimer',
    tmdbId: 872585,
    url: 'https://image.tmdb.org/t/p/original/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg',
    fallbackUrl: 'https://image.tmdb.org/t/p/w1280/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg',
  },
  {
    id: 'lotr-fellowship',
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    tmdbId: 120,
    url: 'https://image.tmdb.org/t/p/original/x2RS3uTcsJJ9IfjNPcgDmukoEcQ.jpg',
    fallbackUrl: 'https://image.tmdb.org/t/p/w1280/x2RS3uTcsJJ9IfjNPcgDmukoEcQ.jpg',
  },
];

export default function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageSources, setImageSources] = useState(() => HERO_BACKDROPS.map((b) => b.url));

  // Preload high-definition backdrops on mount for instant, flicker-free crossfades
  useEffect(() => {
    HERO_BACKDROPS.forEach((item, index) => {
      const img = new Image();
      img.src = item.url;
      img.onerror = () => {
        // Fallback gracefully to high-res w1280 if original fails
        setImageSources((prev) => {
          if (prev[index] !== item.fallbackUrl) {
            const next = [...prev];
            next[index] = item.fallbackUrl;
            return next;
          }
          return prev;
        });
      };
    });
  }, []);

  // Automatically transition between images every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_BACKDROPS.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  function handleImageError(index) {
    const item = HERO_BACKDROPS[index];
    if (imageSources[index] !== item.fallbackUrl) {
      setImageSources((prev) => {
        const next = [...prev];
        next[index] = item.fallbackUrl;
        return next;
      });
    }
  }

  return (
    <section
      aria-label="Cinematic Backdrop Carousel"
      className="hero-cinematic relative w-full overflow-hidden h-[460px] sm:h-[560px] md:h-[640px] lg:h-[720px] xl:h-[780px] bg-[#0a0a0a] mb-8 sm:mb-12"
    >
      {/* 10 Full-Width HD TMDB Backdrop Slides */}
      {HERO_BACKDROPS.map((slide, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
            aria-hidden={!isActive}
          >
            <img
              src={imageSources[idx]}
              alt=""
              className="w-full h-full object-cover object-center"
              loading={idx === 0 ? 'eager' : 'lazy'}
              onError={() => handleImageError(idx)}
            />
          </div>
        );
      })}

      {/* Subtle cinematic gradient vignette for text legibility */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent pointer-events-none z-20"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/30 to-transparent pointer-events-none z-20"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent pointer-events-none z-20"
        aria-hidden="true"
      />

      {/* Very Clean Hero Overlay — Just Few Words with Google Fonts */}
      <div className="absolute inset-0 z-30 flex flex-col justify-end pb-10 sm:pb-14 md:pb-16 pointer-events-none">
        <div className="wrap max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            {/* Tag / Category in Google Font Outfit */}
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse"></span>
              <span className="font-outfit text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold text-[#E50914]">
                Curated Cinema
              </span>
            </div>

            {/* Main Headline in Google Font Cinzel */}
            <h1 className="font-cinzel text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-wider leading-[1.15] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] mb-3">
              Stories That Stay With You.
            </h1>

            {/* Clean Subtext in Google Font Outfit */}
            <p className="font-outfit text-xs sm:text-sm md:text-base text-white/80 font-normal tracking-wide drop-shadow-md max-w-md">
              Intelligent movie recommendations tailored to your taste.
            </p>
          </div>
        </div>
      </div>

      {/* Subtle Slide Indicator & Movie Title at Bottom-Right */}
      <div className="absolute bottom-6 sm:bottom-8 right-4 sm:right-8 z-30 pointer-events-none flex items-center gap-3">
        <span className="font-outfit text-[11px] sm:text-xs text-white/60 tracking-wider hidden sm:inline">
          {HERO_BACKDROPS[currentIndex].title}
        </span>
        <div className="flex items-center gap-1.5">
          {HERO_BACKDROPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === currentIndex ? 'w-5 bg-[#E50914]' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

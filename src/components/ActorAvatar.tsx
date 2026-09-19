import React, { useState, useEffect } from 'react';
import { 
  resolveActorPhoto, 
  fetchActorPhotoOnline, 
  generateInitialsAvatar, 
  reportBrokenPhoto 
} from '../services/actorPhotoService';

interface ActorAvatarProps {
  name: string;
  englishName?: string;
  photo?: string;
  className?: string;
  alt?: string;
}

export const ActorAvatar: React.FC<ActorAvatarProps> = ({
  name,
  englishName,
  photo,
  className = 'w-full h-full object-cover object-[center_18%]',
  alt
}) => {
  const initialResolved = resolveActorPhoto(name, englishName, photo);
  const [currentSrc, setCurrentSrc] = useState<string>(initialResolved);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const resolved = resolveActorPhoto(name, englishName, photo);
    setCurrentSrc(resolved);
    setRetryAttempt(0);
    setHasLoaded(false);

    // If it's an SVG avatar (no verified photo available upfront), try fetching in background from Wikipedia/API
    if (resolved.startsWith('data:image/svg+xml')) {
      fetchActorPhotoOnline(name, englishName, true).then((onlineUrl) => {
        if (isMounted && onlineUrl && !onlineUrl.startsWith('data:image/svg+xml')) {
          setCurrentSrc(onlineUrl);
        }
      }).catch(() => {
        // SVG remains
      });
    }

    return () => {
      isMounted = false;
    };
  }, [name, englishName, photo]);

  const handleImageError = () => {
    // Report this specific URL as broken so other components and cache avoid it
    reportBrokenPhoto(currentSrc, name, englishName);

    if (retryAttempt === 0) {
      setRetryAttempt(1);
      // Attempt 1: Fetch fresh real online photo bypassing static / broken cache
      fetchActorPhotoOnline(name, englishName, true)
        .then((freshUrl) => {
          if (freshUrl && !freshUrl.startsWith('data:image/svg+xml') && freshUrl !== currentSrc) {
            setCurrentSrc(freshUrl);
          } else {
            setCurrentSrc(generateInitialsAvatar(englishName || name));
          }
        })
        .catch(() => {
          setCurrentSrc(generateInitialsAvatar(englishName || name));
        });
    } else {
      // Attempt 2+: Graceful SVG initials fallback
      setCurrentSrc(generateInitialsAvatar(englishName || name));
    }
  };

  // Ensure portrait positioning (centering eyes and facial features) if object-cover is present without explicit position
  const resolvedClassName = className.includes('object-cover') && !className.includes('object-[') && !className.includes('object-top') && !className.includes('object-center')
    ? `${className} object-[center_18%]`
    : className;

  return (
    <img
      src={currentSrc}
      alt={alt || name}
      referrerPolicy="no-referrer"
      loading="lazy"
      onLoad={() => setHasLoaded(true)}
      onError={handleImageError}
      className={`${resolvedClassName} transition-opacity duration-300 ${hasLoaded ? 'opacity-100' : 'opacity-90'}`}
    />
  );
};



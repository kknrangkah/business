'use client';

import React, { useState } from 'react';
import {
  KingStreamVideo,
  resolveVideoPlayback,
  isPlaceholderThumbnail,
  getAutoThumbnailFromVideoUrl,
} from '@/lib/kingstream-storage';

const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80';

interface VideoThumbnailProps {
  video: Pick<KingStreamVideo, 'title' | 'thumbnailUrl' | 'videoUrl'>;
  className?: string;
}

export function VideoThumbnail({
  video,
  className = 'w-full h-full object-cover',
}: VideoThumbnailProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const resolved = resolveVideoPlayback(video.videoUrl);
  const hasRealImg = !isPlaceholderThumbnail(video.thumbnailUrl) && !imgFailed;
  const autoUrlThumb = getAutoThumbnailFromVideoUrl(video.videoUrl);

  if (hasRealImg) {
    return (
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className={className}
        onError={() => setImgFailed(true)}
      />
    );
  }

  if (resolved.kind === 'native' && resolved.src) {
    return (
      <video
        src={`${resolved.src}#t=1.5`}
        preload="metadata"
        muted
        playsInline
        className={`${className} pointer-events-none`}
      />
    );
  }

  return (
    <img
      src={autoUrlThumb || FALLBACK_THUMB}
      alt={video.title}
      className={className}
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== FALLBACK_THUMB) {
          target.src = FALLBACK_THUMB;
        }
      }}
    />
  );
}


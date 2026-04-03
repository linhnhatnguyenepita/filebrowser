import '@videojs/react/audio/skin.css';
import { createPlayer } from '@videojs/react';
import { audioFeatures, AudioSkin, Audio } from '@videojs/react/audio';

const AudioPlayer = createPlayer({ features: audioFeatures });

interface AudioPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export default function AudioPlayerComponent({ src, poster, className }: AudioPlayerProps) {
  return (
    <AudioPlayer.Provider>
      <AudioSkin className={className}>
        <Audio src={src} poster={poster} preload="metadata" />
      </AudioSkin>
    </AudioPlayer.Provider>
  );
}

import '@videojs/react/video/skin.css';
import { createPlayer } from '@videojs/react';
import { videoFeatures, VideoSkin, Video } from '@videojs/react/video';

const VideoPlayer = createPlayer({ features: videoFeatures });

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export default function VideoPlayerComponent({ src, className }: VideoPlayerProps) {
  return (
    <VideoPlayer.Provider>
      <VideoSkin className={className}>
        <Video src={src} playsInline />
      </VideoSkin>
    </VideoPlayer.Provider>
  );
}

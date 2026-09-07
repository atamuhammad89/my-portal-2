type AudioPlayerProps = {
  src: string;
};

export function AudioPlayer({ src }: AudioPlayerProps) {
  return <audio controls className="w-full" preload="metadata" src={src} />;
}

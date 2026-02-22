'use client';

import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const PRESETS = [
  { label: 'LoFi',   videoId: 'jfKfPfyJRdk' },
  { label: '雨音',   videoId: 'mPZkdNFkNps' },
  { label: 'カフェ', videoId: '02azSAMtZWU' },
];

function extractVideoId(input: string): string | null {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /^[a-zA-Z0-9_-]{11}$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1] ?? m[0];
  }
  return null;
}

export default function BGMPlayer() {
  const [videoId, setVideoId] = useState(PRESETS[0].videoId);
  const [activePresetId, setActivePresetId] = useState<string | null>(PRESETS[0].videoId);
  const [hasUrlVideo, setHasUrlVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [urlInput, setUrlInput] = useState('');
  const playerRef = useRef<any>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const apiReadyRef = useRef(false);

  const initPlayer = (vid: string) => {
    if (!window.YT || !playerDivRef.current) return;
    if (playerRef.current) {
      playerRef.current.destroy();
    }
    playerRef.current = new window.YT.Player(playerDivRef.current, {
      width: 1,
      height: 1,
      videoId: vid,
      playerVars: { controls: 0, autoplay: 0, modestbranding: 1 },
      events: {
        onReady: (e: any) => {
          e.target.setVolume(volume);
        },
        onStateChange: (e: any) => {
          // YT.PlayerState.PLAYING = 1
          setIsPlaying(e.data === 1);
        },
      },
    });
  };

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      apiReadyRef.current = true;
      initPlayer(videoId);
      return;
    }

    const existing = document.getElementById('yt-iframe-api');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'yt-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      apiReadyRef.current = true;
      initPlayer(videoId);
    };

    return () => {
      // cleanup only on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeVideo = (vid: string) => {
    setVideoId(vid);
    setIsPlaying(false);
    if (playerRef.current && apiReadyRef.current) {
      playerRef.current.loadVideoById(vid);
      playerRef.current.stopVideo();
    } else if (apiReadyRef.current) {
      initPlayer(vid);
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    playerRef.current?.setVolume(v);
  };

  const handlePresetClick = (presetVideoId: string) => {
    if (activePresetId === presetVideoId) {
      setActivePresetId(null);
      playerRef.current?.stopVideo();
      setIsPlaying(false);
    } else {
      setActivePresetId(presetVideoId);
      setHasUrlVideo(false);
      changeVideo(presetVideoId);
    }
  };

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    const id = extractVideoId(value.trim());
    if (id) {
      setHasUrlVideo(true);
      changeVideo(id);
    }
  };

  const canPlay = activePresetId !== null || hasUrlVideo;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 w-full">
      <p className="text-sm font-medium text-gray-500 mb-4">🎵 BGM</p>

      {/* プリセットボタン */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {PRESETS.map(preset => (
          <button
            key={preset.videoId}
            onClick={() => handlePresetClick(preset.videoId)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activePresetId === preset.videoId
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* URL入力 */}
      <input
        type="text"
        value={urlInput}
        onChange={e => handleUrlChange(e.target.value)}
        placeholder="YouTube URL / ID"
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4 placeholder:text-gray-400"
      />

      {/* 再生コントロール */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={!canPlay}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm transition-all shadow-sm shrink-0 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* 音量スライダー */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-gray-400 text-xs shrink-0">🔊</span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={e => handleVolume(Number(e.target.value))}
            className="flex-1 h-1.5 accent-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 非表示プレイヤー */}
      <div ref={playerDivRef} className="absolute pointer-events-none opacity-0 w-px h-px overflow-hidden" />
    </div>
  );
}

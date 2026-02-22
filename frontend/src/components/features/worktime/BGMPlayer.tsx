'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { BGMPreset } from '@/types/bgmPreset';
import { getBGMPresets, createBGMPreset, deleteBGMPreset } from '@/lib/api';

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

type CurrentSource =
  | { kind: 'builtin'; videoId: string }
  | { kind: 'user'; presetId: string; videoId: string }
  | { kind: 'url'; videoId: string }
  | null;

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
  const { data: session } = useSession();
  const isLoggedIn = !!(session?.user as { id?: string })?.id;

  const [currentSource, setCurrentSource] = useState<CurrentSource>(
    { kind: 'builtin', videoId: PRESETS[0].videoId }
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [urlInput, setUrlInput] = useState('');

  const [userPresets, setUserPresets] = useState<BGMPreset[]>([]);
  const [savingLabel, setSavingLabel] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const apiReadyRef = useRef(false);

  useEffect(() => {
    getBGMPresets().then(setUserPresets).catch(() => {});
  }, []);

  const initPlayer = (vid: string) => {
    if (!window.YT || !playerContainerRef.current) return;
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    const div = document.createElement('div');
    playerContainerRef.current.innerHTML = '';
    playerContainerRef.current.appendChild(div);
    playerRef.current = new window.YT.Player(div, {
      width: 1,
      height: 1,
      videoId: vid,
      playerVars: { controls: 0, autoplay: 0, modestbranding: 1 },
      events: {
        onReady: (e: any) => { e.target.setVolume(volume); },
        onStateChange: (e: any) => { setIsPlaying(e.data === 1); },
      },
    });
  };

  useEffect(() => {
    const initialVideoId = PRESETS[0].videoId;
    if (window.YT && window.YT.Player) {
      apiReadyRef.current = true;
      initPlayer(initialVideoId);
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
      initPlayer(initialVideoId);
    };
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeVideo = (vid: string) => {
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
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    playerRef.current?.setVolume(v);
  };

  const handleBuiltinClick = (presetVideoId: string) => {
    if (currentSource?.kind === 'builtin' && currentSource.videoId === presetVideoId) {
      setCurrentSource(null);
      playerRef.current?.stopVideo();
      setIsPlaying(false);
    } else {
      setCurrentSource({ kind: 'builtin', videoId: presetVideoId });
      changeVideo(presetVideoId);
    }
  };

  const handleUserPresetClick = (preset: BGMPreset) => {
    if (currentSource?.kind === 'user' && currentSource.presetId === preset.preset_id) {
      setCurrentSource(null);
      playerRef.current?.stopVideo();
      setIsPlaying(false);
    } else {
      setCurrentSource({ kind: 'user', presetId: preset.preset_id, videoId: preset.video_id });
      changeVideo(preset.video_id);
    }
  };

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    const id = extractVideoId(value.trim());
    if (id) {
      setCurrentSource({ kind: 'url', videoId: id });
      changeVideo(id);
    }
  };

  const handleSave = async () => {
    const label = savingLabel.trim();
    const vid = currentSource?.videoId ?? null;
    if (!label || !vid) return;
    const saved = await createBGMPreset(label, vid);
    if (saved) setUserPresets(prev => [...prev, saved]);
    setSavingLabel('');
    setShowSaveForm(false);
    if (currentSource?.kind === 'url') setUrlInput('');
  };

  const handleDelete = async (presetId: string) => {
    await deleteBGMPreset(presetId);
    setUserPresets(prev => prev.filter(p => p.preset_id !== presetId));
    if (currentSource?.kind === 'user' && currentSource.presetId === presetId) {
      setCurrentSource(null);
      playerRef.current?.stopVideo();
      setIsPlaying(false);
    }
  };

  const nowPlayingLabel =
    currentSource?.kind === 'builtin'
      ? PRESETS.find(p => p.videoId === currentSource.videoId)?.label ?? '—'
      : currentSource?.kind === 'user'
      ? userPresets.find(p => p.preset_id === currentSource.presetId)?.label ?? '—'
      : currentSource?.kind === 'url' ? 'カスタム URL'
      : '選択なし';

  const canPlay = currentSource !== null;
  const canSave = currentSource !== null && isLoggedIn;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 w-full flex-1 flex flex-col">

      <p className="text-sm font-medium text-gray-500 mb-4">🎵 BGM</p>

      {/* 組み込みプリセット */}
      <p className="text-xs text-gray-400 mb-2">プリセット</p>
      <div className="flex gap-2 flex-wrap mb-4">
        {PRESETS.map(preset => {
          const active = currentSource?.kind === 'builtin' && currentSource.videoId === preset.videoId;
          return (
            <button
              key={preset.videoId}
              onClick={() => handleBuiltinClick(preset.videoId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                active ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* マイプリセット */}
      <p className="text-xs text-gray-400 mb-2">マイプリセット</p>
      <div className="max-h-24 overflow-y-auto mb-2">
        {userPresets.length === 0 ? (
          <p className="text-xs text-gray-300">保存済みプリセットなし</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {userPresets.map(preset => {
              const active = currentSource?.kind === 'user' && currentSource.presetId === preset.preset_id;
              return (
                <div key={preset.preset_id} className="flex items-center gap-0.5">
                  <button
                    onClick={() => handleUserPresetClick(preset)}
                    className={`px-3 py-1.5 rounded-l-lg text-xs font-medium transition-all ${
                      active ? 'bg-violet-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                  <button
                    onClick={() => handleDelete(preset.preset_id)}
                    className="px-1.5 py-1.5 rounded-r-lg text-xs bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-400 transition-all"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 再生ボタンを上下中央に固定 */}
      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-xs text-gray-400">{nowPlayingLabel}</p>
        <button
          onClick={togglePlay}
          disabled={!canPlay}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white transition-all
            bg-blue-500 hover:bg-blue-600 active:scale-95 shadow-md
            disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="flex items-center gap-2 w-full">
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

      {/* URL入力・保存 */}
      <div className="space-y-2 pb-4 mt-8">
        <input
          type="text"
          value={urlInput}
          onChange={e => handleUrlChange(e.target.value)}
          placeholder="YouTube URL / IDを追加"
          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-400"
        />
        {canSave && (
          showSaveForm ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={savingLabel}
                onChange={e => setSavingLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveForm(false); }}
                placeholder="プリセット名"
                autoFocus
                className="flex-1 px-3 py-1.5 text-xs border border-violet-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-gray-400"
              />
              <button
                onClick={handleSave}
                disabled={!savingLabel.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-40 transition-all"
              >
                保存
              </button>
              <button
                onClick={() => setShowSaveForm(false)}
                className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-all"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveForm(true)}
              className="text-xs text-violet-500 hover:text-violet-700 transition-all"
            >
              ＋ 現在の曲をマイプリセットに保存
            </button>
          )
        )}
      </div>

      <div ref={playerContainerRef} className="absolute pointer-events-none opacity-0 w-px h-px overflow-hidden" />
    </div>
  );
}

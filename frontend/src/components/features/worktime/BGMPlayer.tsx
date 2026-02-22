'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [currentSource, setCurrentSource] = useState<CurrentSource>(
    { kind: 'builtin', videoId: PRESETS[0].videoId }
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [urlInput, setUrlInput] = useState('');

  // ユーザープリセット
  const [userPresets, setUserPresets] = useState<BGMPreset[]>([]);
  const [savingLabel, setSavingLabel] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const playerRef = useRef<any>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const apiReadyRef = useRef(false);

  // ユーザープリセット取得
  useEffect(() => {
    getBGMPresets().then(setUserPresets).catch(() => {});
  }, []);

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
          setIsPlaying(e.data === 1);
        },
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

    return () => {};
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

  // 保存
  const handleSave = async () => {
    const label = savingLabel.trim();
    const vid = currentSource?.videoId ?? null;
    if (!label || !vid) return;
    const saved = await createBGMPreset(label, vid);
    if (saved) {
      setUserPresets(prev => [...prev, saved]);
    }
    setSavingLabel('');
    setShowSaveForm(false);
    if (currentSource?.kind === 'url') {
      setUrlInput('');
    }
  };

  // 削除
  const handleDelete = async (presetId: string) => {
    await deleteBGMPreset(presetId);
    setUserPresets(prev => prev.filter(p => p.preset_id !== presetId));
    if (currentSource?.kind === 'user' && currentSource.presetId === presetId) {
      setCurrentSource(null);
      playerRef.current?.stopVideo();
      setIsPlaying(false);
    }
  };

  const canPlay = currentSource !== null;
  const canSave = currentSource !== null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 w-full">
      <p className="text-sm font-medium text-gray-500 mb-4">🎵 BGM</p>

      {/* 組み込みプリセット */}
      <p className="text-xs text-gray-400 mb-1.5">プリセット</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {PRESETS.map(preset => (
          <button
            key={preset.videoId}
            onClick={() => handleBuiltinClick(preset.videoId)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentSource?.kind === 'builtin' && currentSource.videoId === preset.videoId
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* マイプリセット（常に表示） */}
      <p className="text-xs text-gray-400 mb-1.5">マイプリセット</p>
      <div className="flex gap-2 mb-4 flex-wrap min-h-[28px] items-center">
        {userPresets.length === 0 ? (
          <span className="text-xs text-gray-300">保存済みプリセットなし</span>
        ) : (
          userPresets.map(preset => (
            <div key={preset.preset_id} className="flex items-center gap-0.5">
              <button
                onClick={() => handleUserPresetClick(preset)}
                className={`px-3 py-1.5 rounded-l-lg text-xs font-medium transition-all ${
                  currentSource?.kind === 'user' && currentSource.presetId === preset.preset_id
                    ? 'bg-violet-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          ))
        )}
      </div>

      {/* URL入力 */}
      <input
        type="text"
        value={urlInput}
        onChange={e => handleUrlChange(e.target.value)}
        placeholder="YouTube URL / IDを追加"
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-2 placeholder:text-gray-400"
      />

      {/* 保存フォーム */}
      {canSave && (
        showSaveForm ? (
          <div className="flex gap-2 mb-3">
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
              className="px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 transition-all"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveForm(true)}
            className="text-xs text-violet-500 hover:text-violet-700 mb-3 transition-all"
          >
            ＋ 現在の曲をマイプリセットに保存
          </button>
        )
      )}

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

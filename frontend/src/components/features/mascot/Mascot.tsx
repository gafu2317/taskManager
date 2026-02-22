import Image from 'next/image';
import { MascotMood } from '@/types/mascot';

const moodImages: Record<MascotMood, string> = {
  idle: '/mascot/idle.png',
  happy: '/mascot/happy.png',
  cheering: '/mascot/cheering.png',
};

interface MascotProps {
  mood: MascotMood;
  dialogue: string;
  visible: boolean;
}

export default function Mascot({ mood, dialogue, visible }: MascotProps) {
  return (
    <div className="flex flex-col items-center w-full">
      {/* 吹き出し */}
      <div
        className="relative bg-white border border-gray-200 rounded-xl shadow-md px-3 py-2 text-xs text-gray-700 whitespace-nowrap mb-1"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s ease' }}
      >
        {dialogue}
        <div className="absolute left-1/2 -translate-x-1/2 top-full"
          style={{
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #e5e7eb',
          }}
        />
        <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-px"
          style={{
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid white',
          }}
        />
      </div>

      {/* キャラクター画像 */}
      <div className="relative w-full aspect-square">
        <Image
          src={moodImages[mood]}
          alt="maccat"
          fill
          className="object-contain drop-shadow-md"
          draggable={false}
        />
      </div>
    </div>
  );
}

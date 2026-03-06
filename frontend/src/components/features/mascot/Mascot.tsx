import Image from 'next/image';
import { MascotMood } from '@/types/mascot';

const moodImages: Record<MascotMood, string> = {
  tasks:   '/mascot/happy.png',
  inbox:   '/mascot/idle.png',
  worktime: '/mascot/working.png',
  mascot:  '/mascot/happy.png',
};

interface MascotProps {
  mood: MascotMood;
  dialogue: string;
  visible: boolean;
  fit?: 'width' | 'height';
}

export default function Mascot({ mood, dialogue, visible, fit = 'width' }: MascotProps) {
  const heightFit = fit === 'height';
  return (
    <div className={`flex flex-col items-center ${heightFit ? 'h-full min-h-0' : 'w-full'}`}>
      {/* 吹き出し */}
      <div
        className="relative bg-white border border-gray-200 rounded-xl shadow-md px-3 py-2 text-xs text-gray-700 w-full text-center mb-1 shrink-0"
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
      <Image
        src={moodImages[mood]}
        alt="maccat"
        width={300}
        height={450}
        className="drop-shadow-md"
        style={heightFit
          ? { height: '100%', width: 'auto', maxWidth: '100%', minHeight: 0, flex: '1 1 0' }
          : { width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '40vh' }
        }
        draggable={false}
      />
    </div>
  );
}

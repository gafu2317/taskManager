'use client';

import { useState } from 'react';
import { ACCESSORIES, AccessoryId } from '@/types/mascot';

interface AccessoryShopProps {
  currentPoints: number;
  ownedAccessories: string[];
  equippedAccessories: string[];
  onBuy: (accessoryId: string) => Promise<void>;
  onEquipChange: (equipped: string[]) => Promise<void>;
  onClose: () => void;
}

// アクセサリーの絵文字（暫定・後で画像に差し替え可）
const ACCESSORY_EMOJI: Record<AccessoryId, string> = {
  ribbon:  '🎀',
  hat:     '🎩',
  glasses: '👓',
  scarf:   '🧣',
  crown:   '👑',
};

export default function AccessoryShop({
  currentPoints,
  ownedAccessories,
  equippedAccessories,
  onBuy,
  onEquipChange,
  onClose,
}: AccessoryShopProps) {
  const [loading, setLoading] = useState<string | null>(null); // ローディング中のアクセサリーID

  const handleBuy = async (accessoryId: string) => {
    setLoading(accessoryId);
    try {
      await onBuy(accessoryId);
    } finally {
      setLoading(null);
    }
  };

  const handleToggleEquip = async (accessoryId: string) => {
    setLoading(accessoryId);
    try {
      const isEquipped = equippedAccessories.includes(accessoryId);
      const newEquipped = isEquipped
        ? equippedAccessories.filter(id => id !== accessoryId)
        : [...equippedAccessories, accessoryId];
      await onEquipChange(newEquipped);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[420px] max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-bold text-gray-800">ショップ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-5">所持ポイント: <span className="font-mono font-bold text-gray-800">{currentPoints} pt</span></p>

        {/* アクセサリー一覧 */}
        <div className="grid grid-cols-2 gap-3">
          {ACCESSORIES.map(({ id, name, price }) => {
            const isOwned    = ownedAccessories.includes(id);
            const isEquipped = equippedAccessories.includes(id);
            const canAfford  = currentPoints >= price;
            const isLoading  = loading === id;

            return (
              <div
                key={id}
                className={`rounded-xl border p-4 flex flex-col items-center gap-2 ${
                  isEquipped ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="text-4xl">{ACCESSORY_EMOJI[id]}</div>
                <p className="text-sm font-medium text-gray-700">{name}</p>
                <p className="text-xs text-gray-400">{price} pt</p>

                {!isOwned && (
                  <button
                    onClick={() => handleBuy(id)}
                    disabled={!canAfford || !!loading}
                    className="w-full py-1.5 rounded-lg text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    {isLoading ? '...' : `購入 ${price}pt`}
                  </button>
                )}

                {isOwned && !isEquipped && (
                  <button
                    onClick={() => handleToggleEquip(id)}
                    disabled={!!loading}
                    className="w-full py-1.5 rounded-lg text-xs font-bold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50"
                  >
                    {isLoading ? '...' : '装備する'}
                  </button>
                )}

                {isOwned && isEquipped && (
                  <button
                    onClick={() => handleToggleEquip(id)}
                    disabled={!!loading}
                    className="w-full py-1.5 rounded-lg text-xs font-bold text-white bg-red-400 hover:bg-red-500 disabled:opacity-50"
                  >
                    {isLoading ? '...' : '外す'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

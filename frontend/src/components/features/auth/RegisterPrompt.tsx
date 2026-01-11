import React, { useState } from 'react';

interface RegisterPromptProps {
  taskCount: number;
  onRegisterClick: () => void;
  onDismiss: () => void;
  isDismissed: boolean;
}

const RegisterPrompt = ({ taskCount, onRegisterClick, onDismiss, isDismissed }: RegisterPromptProps) => {

  const getPromptMessage = () => {
    if (taskCount >= 10) {
      return {
        title: "データを守りましょう！",
        message: `${taskCount}個のタスクが蓄積されています。アカウント作成で安全に保護しませんか？`,
        urgency: "high"
      };
    } else {
      return {
        title: "データを保護しませんか？",
        message: `${taskCount}個のタスクができました。アカウント作成で同期・バックアップしませんか？`,
        urgency: "medium"
      };
    }
  };

  const prompt = getPromptMessage();
  const bgColor = prompt.urgency === 'high' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
  const textColor = prompt.urgency === 'high' ? 'text-red-800' : 'text-blue-800';
  const buttonColor = prompt.urgency === 'high' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className={`${bgColor} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className={`font-semibold text-sm ${textColor}`}>
            {prompt.title}
          </h3>
          <p className={`text-xs ${textColor} mt-1`}>
            {prompt.message}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onRegisterClick}
            className={`${buttonColor} text-white text-xs px-3 py-1.5 rounded hover:shadow-md transition-all`}
          >
            アカウント作成
          </button>
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1.5"
          >
            後で
          </button>
        </div>
      </div>
      
      {/* プログレスバー（視覚的な効果） */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>データ蓄積度</span>
          <span>{Math.min(taskCount * 10, 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              prompt.urgency === 'high' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{
              width: `${Math.min(taskCount * 10, 100)}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPrompt;
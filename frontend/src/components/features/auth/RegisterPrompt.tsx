import React, { useState } from 'react';

interface RegisterPromptProps {
  taskCount: number;
  onRegisterClick: () => void;
  onDismiss: () => void;
  isDismissed: boolean;
}

const RegisterPrompt = ({ taskCount, onRegisterClick, onDismiss, isDismissed }: RegisterPromptProps) => {

  const bgColor = 'bg-blue-50 border-blue-200';
  const textColor = 'text-blue-800';
  const buttonColor = 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className={`${bgColor} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className={`font-semibold text-sm ${textColor}`}>
            アカウントを作成しますか？
          </h3>
          <p className={`text-xs ${textColor} mt-1`}>
            {taskCount}個のタスクができました。アカウント作成で同期・バックアップしませんか？
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
    </div>
  );
};

export default RegisterPrompt;
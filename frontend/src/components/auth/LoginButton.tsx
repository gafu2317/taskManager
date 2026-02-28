'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'

export default function LoginButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin h-5 w-5 border-2 border-ink border-t-transparent rounded-full"></div>
        <span>読み込み中...</span>
      </div>
    )
  }

  if (session) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt="Profile"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm">
            {session.user?.name || session.user?.email}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="bg-mist hover:bg-sage text-ink px-3 py-1 rounded text-sm transition-colors"
        >
          ログアウト
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="bg-ink text-white hover:bg-ink/80 px-4 py-2 rounded font-medium transition-colors"
    >
      Googleでログイン
    </button>
  )
}
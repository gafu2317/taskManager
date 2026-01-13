import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async session({ session, token }) {
      // セッションにユーザーIDを追加
      if (session?.user && token?.sub) {
        (session.user as { id?: string }).id = token.sub
      }
      return session
    },
    async jwt({ user, token }) {
      // JWTトークンにユーザーIDを保存
      if (user) {
        token.sub = user.id
      }
      return token
    }
  },
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin', // カスタムサインインページ（後で作成）
  }
})
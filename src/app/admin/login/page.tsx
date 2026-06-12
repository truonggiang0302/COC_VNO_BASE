import LoginForm from './LoginForm'
import { Shield } from 'lucide-react'

export const metadata = { title: 'Admin Login – CoC Base Hub' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0d0b] px-4">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-700 bg-gradient-to-b from-gold-600 to-gold-800 shadow-lg shadow-gold-900/50">
            <Shield className="h-7 w-7 text-stone-950" />
          </div>
          <div>
            <h1 className="gold-shimmer font-display text-2xl font-bold">
              Admin Portal
            </h1>
            <p className="mt-1 text-xs text-stone-500">CoC Base Hub</p>
          </div>
        </div>

        {/* Form */}
        <div className="stone-card rounded-2xl p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

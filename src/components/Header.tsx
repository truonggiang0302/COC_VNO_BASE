import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function Header() {
  return (
    <header className="relative border-b border-stone-750 bg-gradient-to-b from-[#1a1410] to-[#141210] shadow-lg shadow-black/40">
      {/* Top gold line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-700 bg-gradient-to-b from-gold-600 to-gold-800 shadow-lg shadow-gold-900/50 transition-transform group-hover:scale-105">
            <Shield className="h-5 w-5 text-stone-950" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="gold-shimmer text-xl font-bold tracking-wide">
              CoC VNO
            </span>
            <span className="text-xs text-stone-400 tracking-widest uppercase">
              Clash of Clans
            </span>
          </div>
        </Link>

        {/* Right side */}
        <nav className="flex items-center gap-4">
          <Link
            href="/admin/login"
            className="flex items-center gap-1.5 rounded-md border border-stone-750 bg-stone-850 px-3 py-1.5 text-sm text-stone-400 transition-colors hover:border-gold-700 hover:text-gold-400"
          >
            Admin
          </Link>
        </nav>
      </div>

      {/* Bottom gold line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-800/40 to-transparent" />
    </header>
  )
}

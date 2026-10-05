import type { Metadata } from 'next'
import Header from '@/components/Header'
import TournamentClient from './TournamentClient'

export const metadata: Metadata = {
  title: 'Giải đấu clan | CoC VNO Base Hub',
  description: 'Sơ đồ ghép trận giải đấu loại trực tiếp của clan',
}

export default function TournamentPage() {
  return (
    <div className="min-h-screen bg-[#12100e] text-stone-200">
      <Header />
      <TournamentClient />
    </div>
  )
}

import type { Metadata } from 'next'
import Header from '@/components/Header'
import LeagueBracketClient from '@/components/LeagueBracketClient'

export const metadata: Metadata = {
  title: 'Bảng ghép đấu | CoC VNO Base Hub',
  description: 'Xem bảng ghép đấu theo rank của giải đấu CWL',
}

export default function LeaguePage() {
  return (
    <div className="min-h-screen bg-[#12100e] text-stone-200">
      <Header />
      <LeagueBracketClient />
    </div>
  )
}

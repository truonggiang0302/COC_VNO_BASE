import type { Metadata } from 'next'
import Header from '@/components/Header'
import LuckyNumberClient from './LuckyNumberClient'

export const metadata: Metadata = {
  title: 'Đăng ký số may mắn | CoC VNO Base Hub',
  description: 'Chọn số may mắn tham gia event CWL',
}

export default function LuckyNumberPage() {
  return (
    <div className="min-h-screen bg-[#12100e] text-stone-200">
      <Header />
      <LuckyNumberClient />
    </div>
  )
}

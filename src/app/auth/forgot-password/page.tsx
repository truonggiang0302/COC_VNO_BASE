import ForgotPasswordForm from './ForgotPasswordForm'

export const metadata = { title: 'Quên mật khẩu – CoC Base Hub' }

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0d0b] px-4">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
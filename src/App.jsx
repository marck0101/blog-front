import AppRoutes from './routes'
import CookieBanner from './components/CookieBanner'
import ToastProvider from './components/ToastProvider'

export default function App() {
  return (
    <ToastProvider>
      <AppRoutes />
      <CookieBanner />
    </ToastProvider>
  )
}

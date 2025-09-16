import { MedusaAuthProvider } from '@/contexts/MedusaAuthContext'
import { MedusaCartProvider } from '@/contexts/MedusaCartContext'

export default function KCTShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MedusaAuthProvider>
      <MedusaCartProvider>
        {children}
      </MedusaCartProvider>
    </MedusaAuthProvider>
  )
}
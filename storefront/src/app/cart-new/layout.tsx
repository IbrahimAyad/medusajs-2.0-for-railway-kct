import { MedusaAuthProvider } from '@/contexts/MedusaAuthContext'
import { MedusaCartProvider } from '@/contexts/MedusaCartContext'

export default function CartLayout({
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
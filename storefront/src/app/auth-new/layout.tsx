import { MedusaAuthProvider } from '@/contexts/MedusaAuthContext'
import { MedusaCartProvider } from '@/contexts/MedusaCartContext'

export default function CleanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MedusaAuthProvider>
      <MedusaCartProvider>
        <div className="min-h-screen">
          {/* Clean navigation without legacy code */}
          <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <a href="/" className="text-xl font-bold">
                    KCT Menswear
                  </a>
                </div>
                <div className="flex items-center space-x-4">
                  <a href="/shop-new" className="text-gray-700 hover:text-black">
                    Shop
                  </a>
                  <a href="/cart-new" className="text-gray-700 hover:text-black">
                    Cart
                  </a>
                  <a href="/account-new" className="text-gray-700 hover:text-black">
                    Account
                  </a>
                </div>
              </div>
            </div>
          </nav>
          {children}
        </div>
      </MedusaCartProvider>
    </MedusaAuthProvider>
  )
}
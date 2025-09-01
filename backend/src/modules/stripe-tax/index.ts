import { ModuleProviderExports } from '@medusajs/framework/types'
import { StripeTaxService } from './services/stripe-tax'

const services = [StripeTaxService]

const providerExport: ModuleProviderExports = {
  services,
}

export default providerExport
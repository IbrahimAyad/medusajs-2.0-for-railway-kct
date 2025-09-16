import { NextResponse } from 'next/server'

// Mock product tabs data to prevent 404 errors
export async function GET() {
  return NextResponse.json({
    tabs: {
      about: {
        title: 'About',
        content: 'Premium quality menswear crafted with attention to detail.'
      },
      'care-instructions': {
        title: 'Care Instructions',
        content: 'Dry clean only. Store in a cool, dry place.'
      },
      'style-tips': {
        title: 'Style Tips',
        content: 'Perfect for formal occasions, weddings, and business events.'
      },
      'color-matcher': {
        title: 'Color Matching',
        content: 'Pairs well with white shirts and black shoes.'
      },
      alterations: {
        title: 'Alterations',
        content: 'Professional alterations available in-store.'
      },
      appointment: {
        title: 'Book Appointment',
        content: 'Schedule a fitting appointment with our experts.'
      },
      faq: {
        title: 'FAQ',
        content: 'Common questions about sizing, shipping, and returns.'
      }
    }
  })
}
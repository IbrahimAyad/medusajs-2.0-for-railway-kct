'use client'

import { motion } from 'framer-motion'

export function CollectionSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="h-[220px] md:h-[250px] flex flex-col justify-center items-center px-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-6" />
          
          {/* Category Cards Skeleton */}
          <div className="flex gap-3 overflow-x-hidden w-full max-w-6xl">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i}
                className="flex-shrink-0 w-[160px] h-[90px] bg-gray-200 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid Skeleton */}
      <div className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {[...Array(12)].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg overflow-hidden"
            >
              <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
              <div className="p-2 sm:p-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
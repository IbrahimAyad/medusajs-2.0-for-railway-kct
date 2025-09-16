'use client'

import { useState } from 'react'
import { Star, ThumbsUp, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Review {
  id: string
  name: string
  rating: number
  date: string
  verified: boolean
  title: string
  comment: string
  helpful: number
  size?: string
  fit?: string
}

// Seed reviews for demonstration (replace with real data later)
const generateSeedReviews = (productName: string): Review[] => {
  const reviews: Review[] = [
    {
      id: '1',
      name: 'Michael R.',
      rating: 5,
      date: '2 weeks ago',
      verified: true,
      title: 'Perfect fit and exceptional quality',
      comment: 'This is exactly what I was looking for. The fabric quality is outstanding and the fit is perfect. I ordered my usual size 42R and it fits like it was tailored for me. Will definitely order more.',
      helpful: 12,
      size: '42R',
      fit: 'Perfect'
    },
    {
      id: '2',
      name: 'David L.',
      rating: 5,
      date: '1 month ago',
      verified: true,
      title: 'Wedding suit success',
      comment: 'Wore this to my wedding and received countless compliments. The attention to detail is remarkable - from the stitching to the lining. KCT really knows their craft.',
      helpful: 8,
      size: '40R',
      fit: 'Perfect'
    },
    {
      id: '3',
      name: 'James T.',
      rating: 4,
      date: '1 month ago',
      verified: true,
      title: 'Great suit, minor alterations needed',
      comment: 'Beautiful suit with excellent construction. Needed slight alterations on the sleeves but that\'s expected. The customer service team was very helpful with sizing questions.',
      helpful: 5,
      size: '44L',
      fit: 'Slightly Large'
    },
    {
      id: '4',
      name: 'Robert K.',
      rating: 5,
      date: '2 months ago',
      verified: false,
      title: 'Best purchase this year',
      comment: 'I\'ve bought suits from many places, but this one stands out. The fabric breathes well, doesn\'t wrinkle easily, and looks sharp. Highly recommend.',
      helpful: 3,
      size: '38S',
      fit: 'Perfect'
    },
    {
      id: '5',
      name: 'William S.',
      rating: 5,
      date: '3 months ago',
      verified: true,
      title: 'Impressed with the quality',
      comment: 'For the price point, this exceeds expectations. Comparable to suits I\'ve paid twice as much for. The modern fit is exactly what I wanted.',
      helpful: 7,
      size: '46R',
      fit: 'Perfect'
    }
  ]
  
  return reviews
}

interface ProductReviewsProps {
  productId?: string
  productName?: string
}

export default function ProductReviews({ productId, productName = 'this product' }: ProductReviewsProps) {
  const [reviews] = useState<Review[]>(generateSeedReviews(productName))
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set())
  
  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
  }))

  const handleHelpful = (reviewId: string) => {
    setHelpfulReviews(prev => new Set(prev).add(reviewId))
  }

  return (
    <div className="mt-12 border-t pt-12">
      <h2 className="text-2xl font-light mb-8">Customer Reviews</h2>
      
      {/* Rating Summary */}
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <span className="text-4xl font-light">{averageRating.toFixed(1)}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-5 h-5",
                    star <= Math.round(averageRating) 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-600">Based on {reviews.length} reviews</p>
          <p className="text-xs text-green-600 mt-1">98% would recommend</p>
        </div>
        
        <div className="space-y-2">
          {ratingCounts.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm w-4">{rating}</span>
              <Star className="w-4 h-4 text-gray-400" />
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm font-medium text-green-900">Size Accuracy</p>
            <p className="text-xs text-green-700 mt-1">95% found true to size</p>
          </div>
          <button className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Write a Review
          </button>
        </div>
      </div>
      
      {/* Individual Reviews */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-6 last:border-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= review.rating 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-sm">{review.name}</span>
                  {review.verified && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{review.date}</p>
              </div>
              {review.size && (
                <div className="text-xs text-gray-600">
                  <p>Size: {review.size}</p>
                  <p>Fit: {review.fit}</p>
                </div>
              )}
            </div>
            
            <h3 className="font-medium mb-2">{review.title}</h3>
            <p className="text-gray-700 text-sm mb-3">{review.comment}</p>
            
            <button
              onClick={() => handleHelpful(review.id)}
              disabled={helpfulReviews.has(review.id)}
              className={cn(
                "flex items-center gap-1 text-xs",
                helpfulReviews.has(review.id) 
                  ? "text-green-600" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <ThumbsUp className="w-3 h-3" />
              {helpfulReviews.has(review.id) ? 'Thanks!' : 'Helpful'} 
              ({review.helpful + (helpfulReviews.has(review.id) ? 1 : 0)})
            </button>
          </div>
        ))}
      </div>
      
      <button className="mt-6 text-sm text-burgundy-600 hover:text-burgundy-700 font-medium">
        View All Reviews →
      </button>
    </div>
  )
}
"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MessageSquare, X, Sparkles } from 'lucide-react'
import { ChatAssistant } from './ChatAssistant'
import { cn } from '@/lib/utils/cn'

interface ChatWidgetProps {
  userId?: string
  className?: string
}

export function ChatWidget({ userId, className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={cn(
              "fixed bottom-6 right-6 z-40",
              className
            )}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-burgundy hover:bg-burgundy-700 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
            
            {/* Pulse Animation */}
            <div className="absolute inset-0 rounded-full bg-burgundy animate-ping opacity-20" />
            
            {/* New Badge */}
            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-bounce">
              <Sparkles className="h-3 w-3" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Assistant */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-0 right-0 z-50"
          >
            <div className="relative">
              <ChatAssistant 
                userId={userId}
                initialMessage="Hi! I'm your AI shopping assistant powered by Fashion CLIP. I can help you find the perfect outfit, answer questions about sizing, or provide personalized style recommendations. How can I assist you today?"
              />
              
              {/* Close Button */}
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="absolute top-4 right-14 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
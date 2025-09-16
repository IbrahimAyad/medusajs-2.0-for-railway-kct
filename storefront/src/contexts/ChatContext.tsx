"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ChatContextType {
  activeChat: string | null;
  openChat: (chatId: string) => void;
  closeChat: () => void;
  isOpen: (chatId: string) => boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const openChat = useCallback((chatId: string) => {
    // Close any existing chat before opening new one
    setActiveChat(chatId);
  }, []);

  const closeChat = useCallback(() => {
    setActiveChat(null);
  }, []);

  const isOpen = useCallback((chatId: string) => {
    return activeChat === chatId;
  }, [activeChat]);

  return (
    <ChatContext.Provider value={{ activeChat, openChat, closeChat, isOpen }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

// Hook for individual chat components
export function useChatInstance(chatId: string) {
  const { activeChat, openChat, closeChat } = useChat();
  
  const isOpen = activeChat === chatId;
  
  const open = useCallback(() => {
    openChat(chatId);
  }, [chatId, openChat]);
  
  const close = useCallback(() => {
    if (activeChat === chatId) {
      closeChat();
    }
  }, [activeChat, chatId, closeChat]);
  
  return { isOpen, open, close };
}
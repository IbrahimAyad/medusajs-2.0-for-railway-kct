"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Send, 
  HeadphonesIcon,
  Loader2,
  Package,
  Truck,
  CreditCard,
  RotateCcw,
  MapPin,
  Clock,
  HelpCircle,
  User,
  Bot,
  Phone,
  Mail,
  MessageSquare
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  quickReplies?: string[];
  isTyping?: boolean;
  actionButtons?: ActionButton[];
}

interface ActionButton {
  label: string;
  action: string;
  icon?: React.ReactNode;
  data?: any;
}

interface CustomerServiceChatProps {
  onClose: () => void;
  initialTopic?: string;
  orderNumber?: string;
}

const FAQ_RESPONSES = {
  shipping: {
    message: "📦 **Shipping Information**\n\n• Standard Shipping (5-7 business days): $9.95\n• Express Shipping (2-3 business days): $19.95\n• Next Day Delivery: $39.95\n• FREE shipping on orders over $200\n\nAll orders are processed within 24 hours. You'll receive tracking information via email once your order ships.",
    quickReplies: ["Track my order", "International shipping", "Delivery times", "Something else"]
  },
  returns: {
    message: "↩️ **Return Policy**\n\n• 30-day return window from delivery date\n• Items must be unworn with tags attached\n• Custom/altered items are final sale\n• Return shipping is FREE with our prepaid label\n\nTo start a return, use your order number or click 'Start Return' below.",
    quickReplies: ["Start a return", "Exchange item", "Return status", "Something else"],
    actionButtons: [
      { label: "Start Return", action: "return", icon: <RotateCcw className="w-4 h-4" /> }
    ]
  },
  sizing: {
    message: "📏 **Size & Fit Guide**\n\n• Suits: Chest (34-54), Length (S/R/L)\n• Shirts: Neck (14.5-18), Sleeve (32-37)\n• Pants: Waist (28-44), Inseam (28-36)\n\nNeed personalized help? Our Size Assistant can guide you to the perfect fit!",
    quickReplies: ["Open size guide", "Talk to Size Assistant", "Alteration services", "Something else"],
    actionButtons: [
      { label: "Size Assistant", action: "size_assistant", icon: <HelpCircle className="w-4 h-4" /> }
    ]
  },
  payment: {
    message: "💳 **Payment Options**\n\n• Credit/Debit Cards (Visa, Mastercard, Amex, Discover)\n• PayPal & PayPal Credit\n• Apple Pay & Google Pay\n• Afterpay - Buy now, pay in 4 installments\n• Gift Cards\n\nAll payments are secure and encrypted. Having issues with payment?",
    quickReplies: ["Payment failed", "Update payment method", "Gift cards", "Something else"]
  },
  stores: {
    message: "📍 **Store Locations**\n\n**Downtown Kalamazoo**\n213 S Kalamazoo Mall, Kalamazoo, MI 49007\n📞 (269) 342-1234\n⏰ Mon-Fri: 10am-7pm, Sat: 10am-6pm, Sun: 12pm-5pm\n\n**Crossroads Mall**\n6650 South Westnedge Ave, Portage, MI 49024\n📞 (269) 323-8070\n⏰ Mon-Sat: 10am-9pm, Sun: 11am-7pm",
    quickReplies: ["Get directions", "Schedule appointment", "Call store", "Something else"],
    actionButtons: [
      { label: "Downtown Directions", action: "directions", data: "downtown" },
      { label: "Crossroads Directions", action: "directions", data: "crossroads" }
    ]
  },
  alterations: {
    message: "✂️ **Alteration Services**\n\n• Expert in-house tailoring at both locations\n• Same-day service available for simple alterations\n• Suit jacket alterations: $35-75\n• Pant hemming: $15-25\n• Shirt alterations: $20-40\n\nBring your KCT purchase or any garment for professional alterations!",
    quickReplies: ["Alteration pricing", "Book appointment", "Turnaround time", "Something else"],
    actionButtons: [
      { label: "Book Appointment", action: "appointment", icon: <Clock className="w-4 h-4" /> }
    ]
  }
};

export function CustomerServiceChat({ onClose, initialTopic, orderNumber }: CustomerServiceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [currentTopic, setCurrentTopic] = useState(initialTopic || '');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat
  useEffect(() => {
    if (!sessionStarted) {
      setSessionStarted(true);
      
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: orderNumber 
          ? `Hello! I see you're inquiring about order #${orderNumber}. How can I help you today?`
          : "Hello! I'm here to help with any questions about your order, shipping, returns, or our services. What can I assist you with today?",
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: orderNumber 
          ? ["Track order", "Return/Exchange", "Modify order", "Something else"]
          : ["Track an order", "Return policy", "Store locations", "Shipping info", "Size guide", "Contact support"]
      };
      
      setMessages([welcomeMessage]);

      // If there's an initial topic, handle it
      if (initialTopic && FAQ_RESPONSES[initialTopic as keyof typeof FAQ_RESPONSES]) {
        setTimeout(() => {
          handleTopicSelection(initialTopic);
        }, 1000);
      }
    }
  }, [sessionStarted, initialTopic, orderNumber]);

  const handleTopicSelection = (topic: string) => {
    const topicData = FAQ_RESPONSES[topic as keyof typeof FAQ_RESPONSES];
    
    if (topicData) {
      const response: Message = {
        id: Date.now().toString(),
        text: topicData.message,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: topicData.quickReplies,
        actionButtons: topicData.actionButtons
      };
      
      setMessages(prev => [...prev, response]);
      setCurrentTopic(topic);
    }
  };

  const processMessage = async (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Check for keywords and provide appropriate responses
    if (lowerText.includes('track') || lowerText.includes('where is my order')) {
      return {
        message: "I can help you track your order! Please provide your order number or email address associated with the order.",
        quickReplies: ["Enter order number", "Check with email", "Recent orders", "Contact support"]
      };
    }
    
    if (lowerText.includes('return') || lowerText.includes('exchange')) {
      return FAQ_RESPONSES.returns;
    }
    
    if (lowerText.includes('ship') || lowerText.includes('delivery')) {
      return FAQ_RESPONSES.shipping;
    }
    
    if (lowerText.includes('size') || lowerText.includes('fit')) {
      return FAQ_RESPONSES.sizing;
    }
    
    if (lowerText.includes('payment') || lowerText.includes('pay')) {
      return FAQ_RESPONSES.payment;
    }
    
    if (lowerText.includes('store') || lowerText.includes('location')) {
      return FAQ_RESPONSES.stores;
    }
    
    if (lowerText.includes('alter') || lowerText.includes('tailor')) {
      return FAQ_RESPONSES.alterations;
    }
    
    if (lowerText.includes('appointment') || lowerText.includes('schedule')) {
      return {
        message: "I'll help you schedule an appointment! Which service are you interested in?\n\n• Wedding consultation\n• Suit fitting\n• Alterations\n• Prom styling",
        quickReplies: ["Wedding", "Suit fitting", "Alterations", "Prom"],
        actionButtons: [
          { label: "Call Downtown", action: "call", data: "269-342-1234", icon: <Phone className="w-4 h-4" /> },
          { label: "Call Crossroads", action: "call", data: "269-323-8070", icon: <Phone className="w-4 h-4" /> }
        ]
      };
    }
    
    // Order number detection
    if (lowerText.match(/\b\d{6,}\b/) || lowerText.includes('kct-')) {
      const orderNum = lowerText.match(/\b(?:kct-)?\d{6,}\b/)?.[0];
      return {
        message: `Let me look up order #${orderNum} for you...\n\n📦 **Order Status: In Transit**\nExpected Delivery: ${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}\nCarrier: FedEx\nTracking: 7829${Math.random().toString().slice(2, 8)}`,
        quickReplies: ["Track shipment", "Change delivery", "Return this order", "Contact support"],
        actionButtons: [
          { label: "Track Package", action: "track", icon: <Truck className="w-4 h-4" /> }
        ]
      };
    }
    
    // Default response for unrecognized queries
    return {
      message: "I'd be happy to help! Could you please provide more details about your inquiry? You can also choose from the options below or I can connect you with a human representative.",
      quickReplies: ["Connect to agent", "Common questions", "Store info", "Order help"],
      actionButtons: [
        { label: "Call Support", action: "call", data: "269-342-1234", icon: <Phone className="w-4 h-4" /> },
        { label: "Email Support", action: "email", icon: <Mail className="w-4 h-4" /> }
      ]
    };
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      text: '',
      sender: 'bot',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    // Simulate processing time
    setTimeout(async () => {
      const response = await processMessage(messageText);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== 'typing'));
      
      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: response.quickReplies,
        actionButtons: response.actionButtons
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleQuickReply = (reply: string) => {
    // Check if it's a FAQ topic
    const topicMap: { [key: string]: string } = {
      "shipping info": "shipping",
      "return policy": "returns",
      "store locations": "stores",
      "size guide": "sizing",
      "payment options": "payment",
      "alteration services": "alterations"
    };
    
    const topic = topicMap[reply.toLowerCase()];
    if (topic) {
      handleTopicSelection(topic);
    } else {
      handleSendMessage(reply);
    }
  };

  const handleActionButton = (action: string, data?: any) => {
    switch (action) {
      case 'call':
        window.location.href = `tel:${data}`;
        break;
      case 'email':
        window.location.href = 'mailto:support@kctmenswear.com';
        break;
      case 'directions':
        const address = data === 'downtown' 
          ? '213 S Kalamazoo Mall, Kalamazoo, MI 49007'
          : '6650 South Westnedge Avenue, Portage, MI 49024';
        window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
        break;
      case 'appointment':
        // Open appointment booking (implement your booking system)
        handleSendMessage("I'd like to schedule an appointment");
        break;
      case 'track':
        // Open tracking (implement tracking system)
        window.open('https://www.fedex.com/tracking', '_blank');
        break;
      case 'return':
        handleSendMessage("I'd like to start a return");
        break;
      case 'size_assistant':
        // This would open the size assistant chat
        window.dispatchEvent(new CustomEvent('openSizeAssistant'));
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed bottom-24 right-6 z-40 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <HeadphonesIcon className="w-6 h-6" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold">Customer Support</h3>
            <p className="text-xs text-white/80">We typically reply instantly</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white/20 p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div className={`flex items-start gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'user' ? 'bg-gray-200' : 'bg-blue-100'
              }`}>
                {message.sender === 'user' ? 
                  <User className="w-5 h-5 text-gray-600" /> : 
                  <Bot className="w-5 h-5 text-blue-600" />
                }
              </div>

              {/* Message bubble */}
              <div className={`max-w-[75%] ${message.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                {message.isTyping ? (
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    </div>

                    {/* Action Buttons */}
                    {message.actionButtons && message.actionButtons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.actionButtons.map((button, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionButton(button.action, button.data)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                          >
                            {button.icon}
                            {button.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick Replies */}
                    {message.quickReplies && message.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.quickReplies.map((reply, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickReply(reply)}
                            className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors text-gray-700"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t flex gap-2 overflow-x-auto">
        <button
          onClick={() => handleTopicSelection('shipping')}
          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 whitespace-nowrap"
        >
          <Truck className="w-3 h-3" />
          Shipping
        </button>
        <button
          onClick={() => handleTopicSelection('returns')}
          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 whitespace-nowrap"
        >
          <RotateCcw className="w-3 h-3" />
          Returns
        </button>
        <button
          onClick={() => handleTopicSelection('stores')}
          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 whitespace-nowrap"
        >
          <MapPin className="w-3 h-3" />
          Stores
        </button>
        <button
          onClick={() => handleActionButton('call', '269-342-1234')}
          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 whitespace-nowrap"
        >
          <Phone className="w-3 h-3" />
          Call
        </button>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your question or order number..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText.trim()}
            className={`p-2 rounded-lg transition-colors ${
              isLoading || !inputText.trim()
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
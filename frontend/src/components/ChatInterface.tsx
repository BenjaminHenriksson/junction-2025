import { useState, useEffect, useRef } from 'react';
import { ChatMessage, Order } from '../types/order';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Send, Bot, User, Phone, Clock } from 'lucide-react';

interface ChatInterfaceProps {
  order: Order;
}

// Generate messages based on order status
const generateMessagesByStatus = (order: Order): ChatMessage[] => {
  const baseTime = new Date(order.createdAt);
  
  switch (order.status) {
    case 'support_required':
      // Show past chat history between customer and AI
      return [
        {
          id: '1',
          sender: 'customer',
          content: `Hi, I need help with order ${order.orderNumber}. The shipping address seems incorrect.`,
          timestamp: new Date(baseTime.getTime() + 5 * 60000).toISOString(),
        },
        {
          id: '2',
          sender: 'ai',
          content: 'Thank you for reaching out. I can see the address validation has failed. Let me verify the details with you.',
          timestamp: new Date(baseTime.getTime() + 6 * 60000).toISOString(),
        },
        {
          id: '3',
          sender: 'customer',
          content: `The correct address should be in Helsinki, but the system shows something else.`,
          timestamp: new Date(baseTime.getTime() + 8 * 60000).toISOString(),
        },
        {
          id: '4',
          sender: 'ai',
          content: 'I understand. Unfortunately, this requires manual verification from our operations team due to security protocols. I\'ve escalated this to human support.',
          timestamp: new Date(baseTime.getTime() + 10 * 60000).toISOString(),
        },
        {
          id: '5',
          sender: 'system',
          content: '⚠️ Support requested - Awaiting operations manager review',
          timestamp: new Date(baseTime.getTime() + 11 * 60000).toISOString(),
        },
      ];
    
    case 'action_required':
      // Show prompts for decision-making
      return [
        {
          id: '1',
          sender: 'system',
          content: `Action Required for ${order.orderNumber}`,
          timestamp: new Date(baseTime.getTime() + 5 * 60000).toISOString(),
        },
        {
          id: '2',
          sender: 'ai',
          content: order.notes || 'This order requires your attention and decision.',
          timestamp: new Date(baseTime.getTime() + 6 * 60000).toISOString(),
        },
        {
          id: '3',
          sender: 'system',
          content: '📋 Recommended Actions:\n\n1. Contact customer via agent\n2. Contact customer personally\n3. Wait for inventory update\n4. Cancel and refund\n\nPlease select your preferred course of action.',
          timestamp: new Date(baseTime.getTime() + 7 * 60000).toISOString(),
        },
      ];
    
    case 'ai_resolving':
      // Show AI work history with thinking and communications
      return [
        {
          id: '1',
          sender: 'system',
          content: `🤖 Agentic Handling initiated for ${order.orderNumber}`,
          timestamp: new Date(baseTime.getTime() + 5 * 60000).toISOString(),
        },
        {
          id: '2',
          sender: 'ai',
          content: '💭 Analyzing order details and identifying issues...',
          timestamp: new Date(baseTime.getTime() + 6 * 60000).toISOString(),
        },
        {
          id: '3',
          sender: 'ai',
          content: order.aiSummary || 'Working on resolving the issue...',
          timestamp: new Date(baseTime.getTime() + 8 * 60000).toISOString(),
        },
        {
          id: '4',
          sender: 'ai',
          content: `💭 Checking alternative delivery options for ${order.destination}...`,
          timestamp: new Date(baseTime.getTime() + 10 * 60000).toISOString(),
        },
        {
          id: '5',
          sender: 'system',
          content: '📧 Automated message sent to customer',
          timestamp: new Date(baseTime.getTime() + 12 * 60000).toISOString(),
        },
        {
          id: '6',
          sender: 'ai',
          content: `Dear ${order.customer},\n\nWe're working on your order ${order.orderNumber}. We've identified some scheduling adjustments needed and are currently finding the best solution for you. We'll keep you updated.\n\nBest regards,\nDelivery Operations`,
          timestamp: new Date(baseTime.getTime() + 13 * 60000).toISOString(),
        },
        {
          id: '7',
          sender: 'ai',
          content: '💭 Finalizing resolution strategy... Expected completion in 15 minutes.',
          timestamp: new Date(baseTime.getTime() + 20 * 60000).toISOString(),
        },
      ];
    
    case 'completed':
      // Show actions that led to completion
      return [
        {
          id: '1',
          sender: 'system',
          content: `Order ${order.orderNumber} - Resolution Timeline`,
          timestamp: new Date(baseTime.getTime() + 5 * 60000).toISOString(),
        },
        {
          id: '2',
          sender: 'ai',
          content: '✓ Order received and validated',
          timestamp: new Date(baseTime.getTime() + 6 * 60000).toISOString(),
        },
        {
          id: '3',
          sender: 'ai',
          content: `✓ Delivery route to ${order.destination} optimized`,
          timestamp: new Date(baseTime.getTime() + 15 * 60000).toISOString(),
        },
        {
          id: '4',
          sender: 'ai',
          content: '✓ Inventory allocated and packed',
          timestamp: new Date(baseTime.getTime() + 45 * 60000).toISOString(),
        },
        {
          id: '5',
          sender: 'ai',
          content: '✓ Shipment dispatched to carrier',
          timestamp: new Date(baseTime.getTime() + 90 * 60000).toISOString(),
        },
        {
          id: '6',
          sender: 'system',
          content: '📧 Delivery confirmation sent to customer',
          timestamp: new Date(baseTime.getTime() + 120 * 60000).toISOString(),
        },
        {
          id: '7',
          sender: 'ai',
          content: `✅ Order completed successfully. Total value: €${order.totalValue.toLocaleString()}`,
          timestamp: new Date(baseTime.getTime() + 125 * 60000).toISOString(),
        },
      ];
    
    default:
      return [
        {
          id: '1',
          sender: 'system',
          content: 'Chat session started for this order.',
          timestamp: new Date().toISOString(),
        },
      ];
  }
};

export function ChatInterface({ order }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update messages when order changes
  useEffect(() => {
    setMessages(generateMessagesByStatus(order));
  }, [order.id, order.status]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Simulate AI response based on status
    setTimeout(() => {
      let responseContent = 'I understand your concern. Let me check the order details and get back to you with a solution.';
      
      if (order.status === 'action_required') {
        responseContent = 'Thank you for your decision. I\'ll process this action immediately.';
      } else if (order.status === 'ai_resolving') {
        responseContent = 'The agentic system is currently handling this. I\'ll monitor the progress and update you shortly.';
      } else if (order.status === 'completed') {
        responseContent = 'This order has been completed. Is there anything else I can help you with?';
      }

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: responseContent,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSenderIcon = (sender: string) => {
    if (sender === 'customer') {
      return <Phone className="w-4 h-4 text-slate-600" />;
    } else if (sender === 'user') {
      return <User className="w-4 h-4 text-slate-600" />;
    } else if (sender === 'ai') {
      return <Bot className="w-4 h-4 text-[#0D6672]" />;
    }
    return <Clock className="w-4 h-4 text-slate-500" />;
  };

  const getSenderBackground = (sender: string) => {
    if (sender === 'customer') {
      return 'bg-purple-100';
    } else if (sender === 'user') {
      return 'bg-slate-200';
    } else if (sender === 'ai') {
      return 'bg-teal-100';
    }
    return 'bg-slate-100';
  };

  const getMessageBackground = (sender: string) => {
    if (sender === 'customer') {
      return 'bg-purple-50 border border-purple-100';
    } else if (sender === 'user') {
      return 'bg-[#0D6672] text-white';
    } else if (sender === 'ai') {
      return 'bg-teal-50 border border-teal-100';
    }
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="pb-3 border-b px-6 pt-4 bg-white">
        <h3 className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Support Chat
        </h3>
      </div>
      
      <div className="flex-1 overflow-hidden px-6">
        <ScrollArea className="h-full">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' || message.sender === 'customer' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getSenderBackground(message.sender)}`}>
                  {getSenderIcon(message.sender)}
                </div>
                <div className={`flex-1 max-w-[80%] ${
                  message.sender === 'user' || message.sender === 'customer' ? 'text-right' : ''
                }`}>
                  <div className={`inline-block p-3 rounded-lg whitespace-pre-line ${getMessageBackground(message.sender)}`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 border-t bg-white flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 rounded-lg"
          />
          <Button onClick={handleSend} size="icon" className="bg-[#0D6672] hover:bg-[#0a5259] rounded-lg">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

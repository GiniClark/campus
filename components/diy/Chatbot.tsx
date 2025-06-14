// components/Chatbot.tsx
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import axios from "axios";

interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
}

interface NFTChatbotProps {
  initialQuestion?: string;
}

const NFTChatbot: React.FC<NFTChatbotProps> = ({ initialQuestion = "" }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: 'bot',
      content: "你好！我是你的NFT助手。我可以帮你咨询NFT、推荐NFT或查看你的收藏。试试说：\"推荐一些价格低于1ETH的NFT\"或\"我想找动物类的NFT\"。"
    }
  ]);
  const [inputValue, setInputValue] = useState(initialQuestion);
  const [isLoading, setIsLoading] = useState(false);
  const { address: userAddress } = useAccount();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await axios.post<{ reply: string }>("http://localhost:3050/chat", {
        message: userMessage,
        userAddress: userAddress || "anonymous",
      });

      setMessages(prev => [...prev, { type: 'bot', content: response.data.reply }]);
    } catch (error) {
      console.error("Chatbot API Error:", error);
      setMessages(prev => [...prev, { type: 'bot', content: "抱歉，我暂时遇到了一些问题，请稍后再试。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuestion) {
      handleSendMessage({ preventDefault: () => {} } as React.FormEvent);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-4 overflow-y-auto px-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} items-start`}
          >
            {message.type === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
                <i className="bi bi-robot text-primary"></i>
              </div>
            )}
            <div
              className={`rounded-2xl p-3 max-w-[80%] ${
                message.type === 'user'
                  ? 'bg-[#95ec69] text-gray-800 rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.content}</p>
            </div>
            {message.type === 'user' && (
              <div className="w-8 h-8 rounded-full bg-[#95ec69] flex items-center justify-center ml-2 flex-shrink-0">
                <i className="bi bi-person text-gray-800"></i>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start items-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
              <i className="bi bi-robot text-primary"></i>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入您的问题..."
            className="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="btn bg-[#95ec69] hover:bg-[#85dc59] text-gray-800 border-none rounded-full px-6 flex items-center gap-2 disabled:opacity-50"
          >
            <i className="bi bi-send"></i>
            发送
          </button>
        </div>
      </form>
    </div>
  );
};

export default NFTChatbot;
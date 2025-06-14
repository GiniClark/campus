"use client";

import { Suspense, useState } from "react";
// import Link from "next/link";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import NFTChatbot from "~~/components/diy/Chatbot";

function Model() {
  const { scene } = useGLTF("/images/boy.glb");
  return <primitive object={scene} position={[0, -1, 0]} scale={1.5} rotation={[0, -0.5, 0]} />;
}

const HelpCenter = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState("");

  const faqCategories = [
    {
      icon: "bi-wallet2",
      title: "钱包与账户",
      questions: ["如何创建数字钱包？", "支持哪些钱包类型？", "如何保护我的钱包安全？"],
    },
    {
      icon: "bi-cart",
      title: "购买与出售",
      questions: ["如何购买NFT？", "如何出售我的NFT？", "交易费用是多少？"],
    },
    {
      icon: "bi-shield-check",
      title: "安全与隐私",
      questions: ["如何验证NFT的真实性？", "交易安全保障措施有哪些？", "个人信息如何保护？"],
    },
    {
      icon: "bi-gear",
      title: "技术支持",
      questions: ["支持哪些文件格式？", "如何解决连接问题？", "如何处理交易失败？"],
    },
  ];

  const handleQuestionClick = (question: string) => {
    setSelectedQuestion(question);
    setShowChatbot(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            帮助中心
          </h1>
          <p className="text-gray-600">获取您需要的所有帮助和支持</p>
        </div>

        {/* 搜索框 */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索您的问题..."
              className="w-full px-6 py-4 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:text-primary transition-colors">
              <i className="bi bi-search text-gray-400"></i>
            </button>
          </div>
        </div>

        {/* AI助手区域 */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-12 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-primary/10 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-blue-500/10 rounded-full animate-pulse delay-100"></div>
                <h2 className="text-3xl font-bold mb-4 relative">AI智能助手</h2>
              </div>
              <p className="text-gray-600 mb-6 text-lg">
                遇到任何问题都可以询问我们的AI助手。它能够快速回答您关于NFT、钱包、交易等方面的各种问题。
              </p>
              <button
                onClick={() => setShowChatbot(true)}
                className="btn btn-primary rounded-full px-8 py-3 flex items-center gap-2 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <i className="bi bi-robot text-xl"></i>
                开始对话
              </button>
            </div>
            <div className="md:w-1/2 flex justify-center items-center bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-2xl p-4">
              <div className="w-full h-[400px] rounded-xl overflow-hidden">
                <Canvas camera={{ position: [0, 0, 2.5] }}>
                  <Suspense fallback={null}>
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[5, 5, 5]} intensity={0.8} />
                    <Model />
                    <OrbitControls
                      enableZoom={false}
                      enablePan={false}
                      autoRotate
                      autoRotateSpeed={4}
                      maxPolarAngle={Math.PI / 2}
                      minPolarAngle={Math.PI / 3}
                    />
                  </Suspense>
                </Canvas>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ分类 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {faqCategories.map((category, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 mx-auto">
                <i className={`bi ${category.icon} text-primary text-2xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-center mb-4">{category.title}</h3>
              <ul className="space-y-3">
                {category.questions.map((question, qIndex) => (
                  <li
                    key={qIndex}
                    onClick={() => handleQuestionClick(question)}
                    className="text-gray-600 hover:text-primary cursor-pointer p-2 rounded-lg hover:bg-primary/5 transition-all flex items-center"
                  >
                    <i className="bi bi-chevron-right mr-2 text-primary/70"></i>
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 联系方式 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-envelope text-blue-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">电子邮件</h3>
            <p className="text-gray-600">support@example.com</p>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-telephone text-green-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">电话支持</h3>
            <p className="text-gray-600">+86 400-123-4567</p>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-chat-dots text-purple-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">在线客服</h3>
            <p className="text-gray-600">周一至周日 9:00-18:00</p>
          </div>
        </div>
      </div>

      {/* AI聊天机器人弹窗 */}
      {showChatbot && (
        <>
          {/* 遮罩层，用于点击关闭 */}
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowChatbot(false)} />
          <div className="fixed bottom-4 right-4 w-96 bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-primary to-blue-600">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="bi bi-robot"></i>
                AI智能助手
              </h3>
              <button
                onClick={() => setShowChatbot(false)}
                className="text-white/80 hover:text-white transition-colors w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="flex flex-col h-[500px]">
              <div className="flex-1 overflow-y-auto p-4">
                <NFTChatbot initialQuestion={selectedQuestion} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HelpCenter;

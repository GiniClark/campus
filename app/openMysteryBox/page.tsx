'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { Button, Modal, Spin, Badge, Tooltip } from 'antd';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useScaffoldContractWrite, useScaffoldContractRead, useScaffoldEventSubscriber } from '~~/hooks/scaffold-eth';
import { ethers } from 'ethers';
import { notification } from '~~/utils/scaffold-eth';
import Loader from '~~/components/diy/Loader';
import axios from 'axios';
import { GiftOutlined, RocketOutlined, HistoryOutlined, FireOutlined, TrophyOutlined, EyeOutlined } from '@ant-design/icons';
import confetti from 'canvas-confetti';

const Scene = dynamic(
  () => import('~~/components/three/Scene'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-64 p-8">
        <div className="text-2xl font-bold text-indigo-600 mb-4">神秘盲盒加载中</div>
        <Loader />
      </div>
    ),
  }
);

// 定义 NFT 数据结构
interface NFTInfo {
  tokenId: number;
  image: string;
  name?: string;
  description?: string;
  class?: string;
}

// 盲盒开启动画效果
const triggerConfetti = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // 从左右两侧发射彩带
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
};

export default function OpenMysteryBox() {
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);
  const [currentMysteryBoxPrice, setCurrentMysteryBoxPrice] = useState<string>("0.1");
  const [purchasedNFT, setPurchasedNFT] = useState<NFTInfo | null>(null);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [buyerAddress, setBuyerAddress] = useState<string>("");
  const [previousPurchases, setPreviousPurchases] = useState<NFTInfo[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 获取当前时间戳
  const { data: timestampData } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "getCurrentTimestamp",
  });

  // 获取盲盒价格
  const { data: priceData } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "mysteryBoxPrice",
  });

  // 购买盲盒
  const { writeAsync: buyMysteryBox } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "buyMysteryBox",
    args: [BigInt(currentTimestamp)],
    value: ethers.parseUnits(currentMysteryBoxPrice || "0.1", "ether"),
  });

  // 监听购买事件
  useScaffoldEventSubscriber({
    contractName: "YourCollectible",
    eventName: "MysteryBoxPurchased",
    listener: (logs) => {
      logs.forEach((log) => {
        const { tokenId, buyer } = log.args;
        if (tokenId !== undefined) {
          fetchPurchasedNFT(Number(tokenId));
        }
        if (buyer !== undefined) {
          setBuyerAddress(buyer);
        }
      });
    },
  });

  // 更新时间戳和价格
  useEffect(() => {
    if (timestampData) {
      setCurrentTimestamp(Number(timestampData));
    }
  }, [timestampData]);

  useEffect(() => {
    if (priceData) {
      setCurrentMysteryBoxPrice(ethers.formatEther(priceData));
    }
  }, [priceData]);

  // 加载用户之前的购买记录
  const fetchPreviousPurchases = async () => {
    if (!connectedAddress) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:3050/nfts?owner=${connectedAddress}`);
      // 按时间倒序排列，假设最近购买的排在前面
      setPreviousPurchases(response.data.slice(0, 6)); // 只显示最近的6个
    } catch (error) {
      console.error("获取历史记录失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 点击盲盒时显示确认购买弹框
  const handleOpen = () => {
    if (isOpening) return;
    setIsConfirmModalVisible(true);
  };

  // 确认购买盲盒
  const handleConfirmPurchase = async () => {
    if (!connectedAddress) {
      notification.error("请先连接钱包！");
      setIsConfirmModalVisible(false);
      return;
    }

    setIsOpening(true);
    setIsConfirmModalVisible(false);
    const notificationId = notification.loading("购买盲盒中...");

    try {
      await buyMysteryBox({
        args: [BigInt(currentTimestamp)],
        value: ethers.parseUnits(currentMysteryBoxPrice || "0.1", "ether"),
      });
      notification.success("购买成功，开始抽取 NFT...");
    } catch (error) {
      console.error("购买盲盒失败:", error);
      notification.error("购买盲盒失败，请重试！");
      setIsOpening(false);
    } finally {
      notification.remove(notificationId);
    }
  };

  // 获取购买的 NFT 信息并更新数据库
  const fetchPurchasedNFT = async (tokenId: number) => {
    try {
      const response = await axios.get(`http://localhost:3050/nfts?tokenIds=${tokenId}`);
      const nft = response.data[0];
      if (nft) {
        setPurchasedNFT(nft);
        // 触发庆祝动画
        setTimeout(() => triggerConfetti(), 300);

        // 更新数据库中的 NFT 拥有者
        await axios.post("http://localhost:3050/updateNFT", {
          tokenId,
          newOwner: buyerAddress || connectedAddress,
        });
      }
    } catch (error) {
      console.error("获取购买的 NFT 失败:", error);
      notification.error("无法获取购买的 NFT 信息");
    } finally {
      setIsOpening(false);
    }
  };
  
  // 显示历史记录
  const showHistory = () => {
    fetchPreviousPurchases();
    setIsHistoryVisible(true);
  };

  // 获取NFT类别对应的颜色
  const getCategoryColor = (category?: string): string => {
    const colorMap: Record<string, string> = {
      "艺术": "bg-pink-500",
      "文学": "bg-blue-500",
      "科学": "bg-green-500",
      "工程": "bg-yellow-500",
      "数学": "bg-purple-500",
      "计算机": "bg-cyan-500",
      "历史": "bg-amber-500",
      "地理": "bg-emerald-500"
    };

    return category ? colorMap[category] || "bg-gray-500" : "bg-gray-500";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-violet-500 to-indigo-600 relative overflow-hidden">
      {/* 主要内容区 */}
      <div className="container mx-auto px-4 py-8 pt-16 relative z-10">
        {/* 页面标题和活动信息 */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">2025限定 - 神秘盲盒</h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto mb-6">
            开启盲盒，探索数字藏品的无限可能！
          </p>
          <div className="flex justify-center items-center text-white">
            <Badge status="processing" color="#22C55E" className="mr-2" />
            <span className="font-bold">活动时间：7.1-8.31</span>
          </div>
        </div>
        
        {/* 盲盒价格显示 */}
        <div className="flex justify-center mb-12">
          <div className="bg-black bg-opacity-40 backdrop-blur-md text-white rounded-xl px-6 py-3 flex items-center">
            <GiftOutlined className="text-yellow-300 text-2xl mr-3" />
            <div>
              <div className="text-sm opacity-80">开启价格</div>
              <div className="text-2xl font-extrabold text-yellow-300">{currentMysteryBoxPrice} ETH</div>
            </div>
          </div>
      </div>

      {/* 3D 场景容器 */}
        <div className="relative mx-auto max-w-2xl bg-gradient-to-b from-indigo-400/20 to-purple-600/20 backdrop-blur-lg p-4 rounded-2xl shadow-2xl border border-white/20">
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            <Tooltip title="查看历史开箱记录">
              <Button 
                type="primary" 
                shape="circle" 
                icon={<HistoryOutlined />} 
                onClick={showHistory}
                className="shadow-lg bg-indigo-600 hover:bg-indigo-700 border-none"
              />
            </Tooltip>
          </div>
          
          <div className="w-full h-[400px] relative rounded-xl overflow-hidden">
          <Suspense fallback={null}>
            <Scene onOpen={handleOpen} isOpening={isOpening} />
          </Suspense>
            
            {/* 操作提示 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm animate-pulse">
              点击盲盒开启惊喜
            </div>
          </div>
        </div>
        
        {/* 底部装饰和介绍 */}
        <div className="mt-12 text-center text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center justify-center">
            <FireOutlined className="mr-2 text-yellow-300" /> 盲盒稀有度说明
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-green-300 font-bold mb-2">普通 NFT (70%)</div>
              <p className="opacity-80 text-sm">常见的数字艺术藏品，适合入门收藏</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-blue-300 font-bold mb-2">稀有 NFT (25%)</div>
              <p className="opacity-80 text-sm">独特设计的限量数字藏品，具有较高收藏价值</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-purple-300 font-bold mb-2">传奇 NFT (5%)</div>
              <p className="opacity-80 text-sm">极为罕见的顶级数字艺术品，市场价值极高</p>
            </div>
          </div>
        </div>
      </div>

      {/* 确认购买盲盒的模态框 */}
      <Modal
        title={<div className="text-xl font-bold">确认购买盲盒</div>}
        open={isConfirmModalVisible}
        onCancel={() => setIsConfirmModalVisible(false)}
        width={400}
        centered
        footer={[
          <Button key="cancel" size="large" onClick={() => setIsConfirmModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            size="large"
            onClick={handleConfirmPurchase}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 border-none"
          >
            确认购买 ({currentMysteryBoxPrice} ETH)
          </Button>,
        ]}
      >
        <div className="py-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <GiftOutlined className="text-6xl text-indigo-500" />
              <div className="absolute -top-1 -right-1">
                <Badge count="?" style={{ backgroundColor: '#f5222d' }} />
              </div>
            </div>
          </div>
          <p className="text-center text-gray-600 mb-2">您将花费</p>
          <p className="text-center text-2xl font-bold text-indigo-600 mb-4">{currentMysteryBoxPrice} ETH</p>
          <p className="text-center text-gray-600 mb-4">购买一个神秘盲盒</p>
          <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-600">
            <p className="flex items-center mb-1">
              <RocketOutlined className="mr-2 text-indigo-500" /> 您有机会获得普通、稀有或传奇级别的 NFT
            </p>
            <p className="flex items-center">
              <TrophyOutlined className="mr-2 text-yellow-500" /> NFT 购买后将直接添加到您的钱包中
            </p>
          </div>
        </div>
      </Modal>

      {/* 历史记录模态框 */}
      <Modal
        title={<div className="text-xl font-bold">我的开箱记录</div>}
        open={isHistoryVisible}
        onCancel={() => setIsHistoryVisible(false)}
        width={800}
        footer={[
          <Button key="close" size="large" onClick={() => setIsHistoryVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : previousPurchases.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
            {previousPurchases.map((nft) => (
              <div key={nft.tokenId} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img src={nft.image} alt={nft.name || `NFT #${nft.tokenId}`} className="w-full h-40 object-cover" />
                  {nft.class && (
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs text-white rounded-full ${getCategoryColor(nft.class)}`}>
                        {nft.class}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 mb-1">{nft.name || `NFT #${nft.tokenId}`}</h3>
                  <p className="text-gray-500 text-xs">Token ID: {nft.tokenId}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-gray-500">您还没有开启过盲盒</p>
            <Button 
              type="primary" 
              className="mt-4 bg-indigo-600 hover:bg-indigo-700" 
              onClick={() => {
                setIsHistoryVisible(false);
              }}
            >
              立即开启第一个盲盒
            </Button>
          </div>
        )}
      </Modal>

      {/* 购买成功后显示的模态框 */}
      {purchasedNFT && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-white p-8 rounded-2xl max-w-md animate-bounceIn shadow-2xl">
            <h2 className="text-3xl font-bold text-center mb-6 text-indigo-600 flex items-center justify-center">
              <TrophyOutlined className="mr-2" /> 恭喜获得！
            </h2>
            <div className="text-center">
              <div className="relative rounded-xl overflow-hidden mb-6 bg-gray-100">
              <img
                src={purchasedNFT.image}
                  alt={purchasedNFT.name || `NFT #${purchasedNFT.tokenId}`}
                  className="w-full h-64 object-contain"
                />
                {purchasedNFT.class && (
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-sm text-white rounded-full ${getCategoryColor(purchasedNFT.class)}`}>
                      {purchasedNFT.class}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{purchasedNFT.name || `NFT #${purchasedNFT.tokenId}`}</h3>
              <p className="text-gray-600 mb-4">Token ID: {purchasedNFT.tokenId}</p>
              {purchasedNFT.description && (
                <p className="text-gray-600 text-sm mb-6 bg-gray-50 p-3 rounded-lg">
                  {purchasedNFT.description}
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                type="default"
                size="large"
                block
                onClick={() => setPurchasedNFT(null)}
              >
                关闭
              </Button>
              <div className="flex-col space-y-2 w-full">
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => {
                    if (purchasedNFT) {
                      // 跳转到当前NFT的详情页面
                      const tokenId = purchasedNFT.tokenId;
                      setPurchasedNFT(null);
                      router.push(`/nft/${tokenId}`);
                    }
                  }}
                  className="bg-gradient-to-r from-green-500 to-teal-500 border-none hover:shadow-lg transition-all duration-300"
                  icon={<EyeOutlined />}
                >
                  查看此NFT详情
                </Button>
                
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => {
                    // 直接跳转，不使用有问题的通知
                    setPurchasedNFT(null);
                    router.push('/myNFT');
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 border-none hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                >
                  查看我的NFT
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
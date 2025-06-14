'use client';

import { Suspense, useState, useEffect } from 'react';
import { Input, Button, Modal, Tooltip, Badge, Spin, Empty } from 'antd';
import { useAccount } from 'wagmi';
import { useScaffoldContractWrite, useScaffoldContractRead } from '~~/hooks/scaffold-eth';
import { ethers } from 'ethers';
import { notification } from '~~/utils/scaffold-eth';
import axios from 'axios';
import { GiftOutlined, PlusOutlined, SettingOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';

// 定义 NFT 数据结构
interface NFTInfo {
  tokenId: number;
  image: string;
  name?: string;
}

export default function MintMysteryBox() {
  const { address: connectedAddress } = useAccount();
  const [mysteryBoxPrice, setMysteryBoxPrice] = useState<string>("0.1");
  const [userNFTs, setUserNFTs] = useState<NFTInfo[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<NFTInfo[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<BigInt[]>([]);
  const [availableNFTs, setAvailableNFTs] = useState<NFTInfo[]>([]);
  const [isAvailableTokensModalVisible, setIsAvailableTokensModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 设置盲盒价格的合约调用
  const { writeAsync: setMysteryBoxPriceContract } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "setMysteryBoxPrice",
    args: [mysteryBoxPrice ? ethers.parseUnits(mysteryBoxPrice, "ether") : ethers.parseUnits("0", "ether")],
  });

  // 添加可用 NFT 的合约调用
  const { writeAsync: addAvailableToken } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "addAvailableToken",
    args: [0n], // 占位符，实际调用时会动态设置
  });

  // 获取盲盒中剩余 NFT 的 tokenId 列表
  const { data: getAvailableTokens } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "getAvailableTokens",
  });

  useEffect(() => {
    if (getAvailableTokens) {
      setAvailableTokens([...getAvailableTokens]);
    }
  }, [getAvailableTokens]);

  // 处理设置价格的函数
  const handleSetMysteryBoxPrice = async () => {
    if (!mysteryBoxPrice || isNaN(Number(mysteryBoxPrice)) || Number(mysteryBoxPrice) <= 0) {
      notification.error("请输入有效的盲盒价格！");
      return;
    }
    
    console.log("点击了设置价格按钮");
    const notificationId = notification.loading("设置盲盒价格中...");
    try {
      await setMysteryBoxPriceContract();
      notification.success("盲盒价格设置成功！");
    } catch (error) {
      console.error(error);
      notification.error("设置盲盒价格失败，请重试！");
    } finally {
      notification.remove(notificationId);
    }
  };

  // 获取用户拥有的 NFT
  const fetchUserNFTs = async () => {
    if (!connectedAddress) {
      notification.error("请先连接钱包！");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:3050/nfts?owner=${connectedAddress}`);
      setUserNFTs(response.data);
    } catch (error) {
      console.error("获取 NFT 失败:", error);
      notification.error("无法获取 NFT 列表");
    } finally {
      setIsLoading(false);
    }
  };

  // 获取剩余 NFT 的详细信息
  const fetchAvailableNFTs = async () => {
    setIsLoading(true);
    if (availableTokens.length === 0) {
      setAvailableNFTs([]);
      setIsLoading(false);
      return;
    }

    try {
      const tokenIds = availableTokens.map((tokenId) => tokenId.toString()).join(',');
      const response = await axios.get(`http://localhost:3050/nfts?tokenIds=${tokenIds}`);
      setAvailableNFTs(response.data);
    } catch (error) {
      console.error("获取剩余 NFT 失败:", error);
      notification.error("无法获取剩余 NFT 列表");
    } finally {
      setIsLoading(false);
    }
  };

  // 点击"添加 NFT"按钮，显示模态框
  const handleAddNFTClick = () => {
    fetchUserNFTs();
    setIsModalVisible(true);
  };

  // 点击"查看盲盒 NFT"按钮，显示模态框
  const handleViewAvailableTokens = () => {
    fetchAvailableNFTs();
    setIsAvailableTokensModalVisible(true);
  };

  // 选择或取消选择 NFT
  const handleSelectNFT = (nft: NFTInfo) => {
    setSelectedNFTs((prevSelected) => {
      if (prevSelected.some((selected) => selected.tokenId === nft.tokenId)) {
        return prevSelected.filter((selected) => selected.tokenId !== nft.tokenId);
      } else {
        return [...prevSelected, nft];
      }
    });
  };

  // 确认添加选中的 NFT
  const handleConfirmAddNFTs = async () => {
    if (selectedNFTs.length === 0) {
      notification.error("请至少选择一个 NFT！");
      return;
    }

    setIsAdding(true);
    const notificationId = notification.loading(`正在添加 ${selectedNFTs.length} 个 NFT...`);
    try {
      for (const nft of selectedNFTs) {
        await addAvailableToken({
          args: [BigInt(nft.tokenId)],
        });
      }
      notification.success(`成功添加 ${selectedNFTs.length} 个 NFT 到盲盒！`);
      setIsModalVisible(false);
      setSelectedNFTs([]);
    } catch (error) {
      console.error("添加 NFT 失败:", error);
      notification.error("添加 NFT 失败，请重试！");
    } finally {
      setIsAdding(false);
      notification.remove(notificationId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 to-indigo-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题和介绍 */}
        <div className="text-center mb-16">
          <div className="inline-block p-2 px-6 bg-white bg-opacity-20 rounded-full mb-4 backdrop-blur-sm">
            <h2 className="text-lg font-medium text-white">限时活动</h2>
          </div>
          <h1 className="text-5xl font-bold text-white mb-8 drop-shadow-lg">2025限定 - 神秘盲盒</h1>
          <p className="text-xl text-white opacity-80 max-w-3xl mx-auto">
            添加您的NFT到盲盒中，让收藏家获得稀有数字藏品的惊喜体验。
            <span className="font-bold block mt-2">活动时间：7.1-8.31</span>
          </p>
        </div>

        {/* 卡片容器 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* 盲盒状态卡片 */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border border-white border-opacity-20 text-white">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">盲盒状态</h2>
                <Badge count={availableTokens.length} overflowCount={999} style={{ backgroundColor: '#6366F1' }} />
              </div>
              
              <div className="mb-8">
                <div className="flex justify-between text-lg mb-2">
                  <span>当前价格:</span>
                  <span className="font-extrabold text-xl text-yellow-300">{mysteryBoxPrice} ETH</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>盲盒NFT数量:</span>
                  <span className="font-extrabold text-xl text-green-300">{availableTokens.length} 个</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={handleViewAvailableTokens}
                  icon={<EyeOutlined />}
                  className="bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl flex-1"
                >
                  查看盲盒内容
                </Button>
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={handleAddNFTClick}
                  icon={<PlusOutlined />}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700 border-none rounded-xl flex-1"
                >
                  添加NFT
                </Button>
              </div>
            </div>
          </div>

          {/* 管理设置卡片 */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border border-white border-opacity-20 text-white">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <SettingOutlined className="mr-2" /> 盲盒设置
              </h2>
              
              <div className="mb-8">
                <label className="block text-lg mb-2">盲盒价格 (ETH)</label>
                <Input
                  type="text"
                  placeholder="输入盲盒价格"
                  value={mysteryBoxPrice}
                  onChange={(e: any) => {
                    const value = e.target.value;
                    // 只允许输入数字和小数点
                    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                      setMysteryBoxPrice(value);
                    }
                  }}
                  className="mb-6 h-12 text-xl bg-black border-2 border-yellow-400 rounded-xl text-yellow-300 font-extrabold tracking-wider placeholder:text-gray-500"
                  prefix={<GiftOutlined className="text-yellow-400 mr-2" />}
                  size="large"
                  style={{ caretColor: '#FFFF00' }}
                />
                
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  onClick={handleSetMysteryBoxPrice}
                  className="h-12 text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-none rounded-xl"
                >
                  更新盲盒价格
                </Button>
              </div>
              
              <div className="mt-8 p-4 bg-white bg-opacity-10 rounded-xl">
                <h3 className="text-lg font-medium mb-2">管理说明</h3>
                <ul className="list-disc list-inside opacity-80 space-y-1">
                  <li>设置合理的盲盒价格可以吸引更多购买者</li>
                  <li>添加多样化的NFT以增加盲盒吸引力</li>
                  <li>稀有度不同的NFT可提高用户开盒体验</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 选择 NFT 的模态框 */}
      <Modal
        title={<div className="text-xl font-bold">选择要添加的 NFT</div>}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedNFTs([]);
        }}
        width={800}
        footer={[
          <Button key="cancel" size="large" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            size="large"
            onClick={handleConfirmAddNFTs}
            loading={isAdding}
            disabled={selectedNFTs.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            确认添加 ({selectedNFTs.length})
          </Button>,
        ]}
        className="nft-selection-modal"
      >
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
            {userNFTs.length > 0 ? (
              userNFTs.map((nft) => {
                const isSelected = selectedNFTs.some((selected) => selected.tokenId === nft.tokenId);
                return (
                  <div
                    key={nft.tokenId}
                    className={`cursor-pointer relative rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${
                      isSelected ? 'ring-4 ring-indigo-500' : 'border border-gray-200'
                    }`}
                    onClick={() => handleSelectNFT(nft)}
                  >
                    <div className="relative aspect-square">
                      <img
                        src={nft.image}
                        alt={`NFT ${nft.tokenId}`}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-500 bg-opacity-30 flex items-center justify-center">
                          <CheckCircleOutlined className="text-4xl text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white">
                      <p className="font-medium">{nft.name || `NFT #${nft.tokenId}`}</p>
                      <p className="text-gray-500 text-sm">Token ID: {nft.tokenId}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 py-12">
                <Empty description="您没有可添加的 NFT" />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 查看剩余 NFT 的模态框 */}
      <Modal
        title={<div className="text-xl font-bold">盲盒中的 NFT（{availableNFTs.length}）</div>}
        open={isAvailableTokensModalVisible}
        onCancel={() => setIsAvailableTokensModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" size="large" onClick={() => setIsAvailableTokensModalVisible(false)}>
            关闭
          </Button>,
        ]}
        className="nft-display-modal"
      >
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
            {availableNFTs.length > 0 ? (
              availableNFTs.map((nft) => (
                <div key={nft.tokenId} className="rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl">
                  <div className="aspect-square">
                    <img
                      src={nft.image}
                      alt={`NFT ${nft.tokenId}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="font-medium">{nft.name || `NFT #${nft.tokenId}`}</p>
                    <p className="text-gray-500 text-sm">Token ID: {nft.tokenId}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 py-12">
                <Empty description="当前盲盒中没有 NFT" />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
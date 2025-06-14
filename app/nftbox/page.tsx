'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { Input, Button, Modal } from 'antd';
import { useAccount } from 'wagmi';
import { useScaffoldContractWrite, useScaffoldContractRead, useScaffoldEventSubscriber } from '~~/hooks/scaffold-eth';
import { ethers } from 'ethers';
import { notification } from '~~/utils/scaffold-eth';
import Loader from '~~/components/diy/Loader';
import axios from 'axios';

const Scene = dynamic(
  () => import('~~/components/three/Scene'),
  { 
    ssr: false,
    loading: () => (
      <div className="text-center p-8 text-blue-600">
        🎁 加载夏日盲盒中...
        <Loader />
      </div>
    )
  }
);

// 定义 NFT 数据结构
interface NFTInfo {
    tokenId: number;
    image: string;
    name?: string; // 可选字段，根据你的后端返回数据调整
  }

export default function SummerBlindBox() {
  const { address: connectedAddress } = useAccount();
  const [result, setResult] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [mysteryBoxPrice, setMysteryBoxPrice] = useState<string>("0.1"); // 新增状态
  const [userNFTs, setUserNFTs] = useState<NFTInfo[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
//   const [selectedNFT, setSelectedNFT] = useState<NFTInfo | null>(null);
  const [selectedNFTs, setSelectedNFTs] = useState<NFTInfo[]>([]); // 修改为数组，支持多选
  const [isAdding, setIsAdding] = useState(false); // 添加加载状态

  const [availableTokens, setAvailableTokens] = useState<BigInt[]>([]); // 存储从合约获取的 tokenId 列表
  const [availableNFTs, setAvailableNFTs] = useState<NFTInfo[]>([]); // 存储剩余 NFT 的详细信息
  const [isAvailableTokensModalVisible, setIsAvailableTokensModalVisible] = useState(false); // 控制查看剩余 NFT 模态框

  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);
  const [currentMysteryBoxPrice, setCurrentMysteryBoxPrice] = useState<string>("0.1");
  const [purchasedNFT, setPurchasedNFT] = useState<NFTInfo | null>(null);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [buyerAddress, setBuyerAddress] = useState<string>("");


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

  // 新增：设置盲盒价格的合约调用
  const { writeAsync: setMysteryBoxPriceContract } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "setMysteryBoxPrice",
    args: [ethers.parseUnits(mysteryBoxPrice, "ether")],
  });

  // 添加可用 NFT 的合约调用
  const { writeAsync: addAvailableToken } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "addAvailableToken",
    // args: selectedNFT ? [BigInt(selectedNFT.tokenId)] : [0n], // 默认值为 0n，实际使用时会被选中值覆盖
    args: [0n], // 占位符，实际调用时会动态设置
  });

  // 购买盲盒
  const { writeAsync: buyMysteryBox } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "buyMysteryBox",
    args: [BigInt(currentTimestamp)],
    value: ethers.parseUnits(currentMysteryBoxPrice, "ether"),
  });

  
  // 获取盲盒中剩余 NFT 的 tokenId 列表
  const { data: getAvailableTokens } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "getAvailableTokens",
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

  useEffect(() => {
    if (getAvailableTokens) {
      setAvailableTokens([...getAvailableTokens]);
    }
  }, [getAvailableTokens]);

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
        value: ethers.parseUnits(currentMysteryBoxPrice, "ether"),
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

//   // 监听 getAvailableTokens 数据变化，更新 availableTokens
//   useEffect(() => {
//     if (getAvailableTokens) {
//       setAvailableTokens([...getAvailableTokens]);
//     }
//   }, [getAvailableTokens]);

  // 新增：处理设置价格的函数
  const handleSetMysteryBoxPrice = async () => {
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
    try {
      const response = await axios.get(`http://localhost:3050/nfts?owner=${connectedAddress}`);
      setUserNFTs(response.data);
    } catch (error) {
      console.error("获取 NFT 失败:", error);
      notification.error("无法获取 NFT 列表");
    }
  };

  // 获取剩余 NFT 的详细信息
  const fetchAvailableNFTs = async () => {
    if (availableTokens.length === 0) {
      setAvailableNFTs([]);
      return;
    }

    try {
      // 将 BigInt 转换为字符串以便传递给后端
      const tokenIds = availableTokens.map((tokenId) => tokenId.toString()).join(',');
      const response = await axios.get(`http://localhost:3050/nfts?tokenIds=${tokenIds}`);
      setAvailableNFTs(response.data);
    } catch (error) {
      console.error("获取剩余 NFT 失败:", error);
      notification.error("无法获取剩余 NFT 列表");
    }
  };

  // 点击“添加 NFT”按钮，显示模态框
  const handleAddNFTClick = () => {
    fetchUserNFTs();
    setIsModalVisible(true);
  };

  // 点击“查看盲盒 NFT”按钮，显示模态框
  const handleViewAvailableTokens = () => {
    fetchAvailableNFTs();
    setIsAvailableTokensModalVisible(true);
  };

  // 选择 NFT 并添加到盲盒
//   const handleSelectNFT = async (nft: NFTInfo) => {
//     setSelectedNFT(nft);
//     const notificationId = notification.loading("添加 NFT 中...");
//     try {
//       await addAvailableToken({
//         args: [BigInt(nft.tokenId)],
//       });
//       notification.success(`NFT (Token ID: ${nft.tokenId}) 添加成功！`);
//       setIsModalVisible(false);
//     } catch (error) {
//       console.error("添加 NFT 失败:", error);
//       notification.error("添加 NFT 失败，请重试！");
//     } finally {
//       notification.remove(notificationId);
//     }
//   };
// 选择或取消选择 NFT
const handleSelectNFT = (nft: NFTInfo) => {
    setSelectedNFTs((prevSelected) => {
      if (prevSelected.some((selected) => selected.tokenId === nft.tokenId)) {
        // 如果已选中，则移除
        return prevSelected.filter((selected) => selected.tokenId !== nft.tokenId);
      } else {
        // 如果未选中，则添加
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
      setSelectedNFTs([]); // 清空选择
    } catch (error) {
      console.error("添加 NFT 失败:", error);
      notification.error("添加 NFT 失败，请重试！");
    } finally {
      setIsAdding(false);
      notification.remove(notificationId);
    }
  };

  return (
    <div className="relative h-screen w-full bg-gradient-to-b from-sky-200 to-blue-100">
      <div className="absolute top-4 left-4 text-blue-600 z-10">
        <h1 className="text-2xl font-bold">2022夏日限定</h1>
        <p className="text-sm">活动时间：7.1-8.31</p>
      </div>

      {/* 新增：设置盲盒价格的 UI，增加 z-index */}
      <div className="absolute top-4 right-4 flex flex-col items-end z-10">
        <Input
          type="text"
          placeholder="盲盒价格 (ETH)"
          value={mysteryBoxPrice}
          onChange={(e: any) => setMysteryBoxPrice(e.target.value)}
          className="mb-2 w-48"
        />
        <Button type="primary" onClick={handleSetMysteryBoxPrice}>
          设置盲盒价格
        </Button>
      </div>

      {/* 添加 NFT 按钮 */}
      <div className="absolute top-20 right-4 z-10">
        <Button type="primary" onClick={handleAddNFTClick}>
          添加 NFTNFT
        </Button>
      </div>

      {/* 查看盲盒 NFT 按钮 */}
      <div className="absolute top-36 right-4 z-10">
        <Button type="primary" onClick={handleViewAvailableTokens}>
          查看盲盒 NFT
        </Button>
      </div>

      {/* 3D 场景容器，限制尺寸和控制事件 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-3/4 h-3/4 pointer-events-auto">
          <Suspense fallback={null}>
            <Scene onOpen={handleOpen} isOpening={isOpening} />
          </Suspense>
        </div>
      </div>

      {/* 选择 NFT 的模态框 */}
      {/* <Modal
        title="选择要添加的 NFT"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {userNFTs.length > 0 ? (
            userNFTs.map((nft) => (
              <div
                key={nft.tokenId}
                className="cursor-pointer p-2 border rounded-lg hover:bg-blue-100"
                onClick={() => handleSelectNFT(nft)}
              >
                <img
                  src={nft.image}
                  alt={`NFT ${nft.tokenId}`}
                  className="w-full h-32 object-cover mb-2"
                />
                <p className="text-center">Token ID: {nft.tokenId}</p>
              </div>
            ))
          ) : (
            <p className="text-center col-span-2">暂无 NFT</p>
          )}
        </div>
      </Modal> */}
      {/* 确认购买盲盒的模态框 */}
      <Modal
        title="确认购买盲盒"
        open={isConfirmModalVisible}
        onCancel={() => setIsConfirmModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsConfirmModalVisible(false)}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmPurchase}>
            确认购买 ({currentMysteryBoxPrice} ETH)
          </Button>,
        ]}
      >
        <p>您将花费 {currentMysteryBoxPrice} ETH 购买一个盲盒，确认购买吗？</p>
      </Modal>

    {/* 选择 NFT 的模态框 */}
    <Modal
        title="选择要添加的 NFT"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedNFTs([]); // 关闭时清空选择
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmAddNFTs}
            loading={isAdding}
            disabled={selectedNFTs.length === 0}
          >
            确认添加 ({selectedNFTs.length})
          </Button>,
        ]}
      >
        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {userNFTs.length > 0 ? (
            userNFTs.map((nft) => (
              <div
                key={nft.tokenId}
                className={`cursor-pointer p-2 border rounded-lg hover:bg-blue-100 ${
                  selectedNFTs.some((selected) => selected.tokenId === nft.tokenId)
                    ? 'bg-blue-200 border-blue-500'
                    : ''
                }`}
                onClick={() => handleSelectNFT(nft)}
              >
                <img
                  src={nft.image}
                  alt={`NFT ${nft.tokenId}`}
                  className="w-full h-32 object-cover mb-2"
                />
                <p className="text-center">Token ID: {nft.tokenId}</p>
              </div>
            ))
          ) : (
            <p className="text-center col-span-2">暂无 NFT</p>
          )}
        </div>
      </Modal>

      {/* 查看剩余 NFT 的模态框 */}
      <Modal
        title="盲盒中剩余的 NFT"
        open={isAvailableTokensModalVisible}
        onCancel={() => setIsAvailableTokensModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsAvailableTokensModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {availableNFTs.length > 0 ? (
            availableNFTs.map((nft) => (
              <div key={nft.tokenId} className="p-2 border rounded-lg">
                <img
                  src={nft.image}
                  alt={`NFT ${nft.tokenId}`}
                  className="w-full h-32 object-cover mb-2"
                />
                <p className="text-center">Token ID: {nft.tokenId}</p>
              </div>
            ))
          ) : (
            <p className="text-center col-span-2">当前盲盒中没有剩余 NFT</p>
          )}
        </div>
      </Modal>
      {/* {result && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="bg-white p-8 rounded-2xl max-w-md animate-bounceIn">
            <h2 className="text-3xl font-bold text-center mb-4 text-blue-600">
              🎉 恭喜获得！
            </h2>
            <div className="text-center text-2xl py-6 font-semibold">
              {result}
            </div>
            <button
              onClick={() => setResult(null)}
              className="w-full py-3 bg-blue-500 text-white rounded-lg
                       hover:bg-blue-600 transition-colors"
            >
              继续开启
            </button>
          </div>
        </div>
      )} */}
      {/* 购买成功后显示的模态框 */}
      {purchasedNFT && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="bg-white p-8 rounded-2xl max-w-md animate-bounceIn">
            <h2 className="text-3xl font-bold text-center mb-4 text-blue-600">
              🎉 恭喜获得！
            </h2>
            <div className="text-center py-6">
              <img
                src={purchasedNFT.image}
                alt={`NFT ${purchasedNFT.tokenId}`}
                className="w-48 h-48 object-cover mx-auto mb-4"
              />
              <p className="text-2xl font-semibold">NFT Token ID: {purchasedNFT.tokenId}</p>
            </div>
            <button
              onClick={() => setPurchasedNFT(null)}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              继续开启
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
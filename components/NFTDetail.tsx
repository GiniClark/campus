"use client";

import { useState, useEffect, SetStateAction } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { notification } from "~~/utils/scaffold-eth";
import Loader from "~~/components/diy/Loader";
import { useScaffoldContractRead, useScaffoldContractWrite, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";
import { ethers } from "ethers";
import { Input, Button, Tabs, Tooltip, Modal, Badge } from "antd";
import { useAccount } from "wagmi";
import { 
  DownloadOutlined, 
  EyeOutlined, 
  GiftOutlined, 
  ShareAltOutlined, 
  QrcodeOutlined,
  ClockCircleOutlined,
  TagOutlined,
  UserOutlined,
  FileTextOutlined
} from "@ant-design/icons";

const { TabPane } = Tabs;

interface NFTInfo {
  tokenId: number;
  image: string;
  name: string;
  description: string;
  class: string;
  price: string;
  owner: string;
  uri: string;
  cid: string;
  fileUrl?: string;
}

interface RentalInfo {
  tokenId: number;
  dailyRentPrice: string;
  maxDuration: number;
  renter: string;
  startTime: number;
  duration: number;
  active: boolean;
}

const NFTDetail: React.FC<{ tokenId: number }> = ({ tokenId }) => {
  const router = useRouter();
  const { address: connectedAddress } = useAccount(); // 获取当前用户地址
  const [nft, setNft] = useState<NFTInfo | null>(null);
  const [rental, setRental] = useState<RentalInfo | null>(null); // 存储租赁信息
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [pageViews] = useState<number>(Math.floor(Math.random() * 1000) + 50); // 模拟页面浏览量

  const [rewardAmount, setRewardAmount] = useState<string>("0.01"); // 打赏金额，默认 0.01 ETH
  const [totalReward, setTotalReward] = useState<string>("0"); // NFT 总打赏数量
  const [isRewarding, setIsRewarding] = useState(false); // 打赏加载状态

  // 获取 NFT 的总打赏数量（初始加载）
  const { data: rewardCount } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "rewardCount",
    args: [BigInt(tokenId)],
  });

  // 调用打赏方法
  const { writeAsync: rewardNFT } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "rewardNFT",
    args: [BigInt(tokenId), ethers.parseUnits(rewardAmount, "ether")],
    value: ethers.parseUnits(rewardAmount, "ether"),
  });

  // 监听 RewardUpdated 事件
  useScaffoldEventSubscriber({
    contractName: "YourCollectible",
    eventName: "RewardUpdated",
    listener: (logs) => {
      logs.forEach((log) => {
        const { tokenId: eventTokenId, totalReward } = log.args;
        if (eventTokenId !== undefined && totalReward !== undefined) {
          // 确保事件是针对当前 NFT 的
          if (Number(eventTokenId) === tokenId) {
            setTotalReward(ethers.formatEther(totalReward));
            notification.info(`打赏更新：NFT ${tokenId} 的总打赏数量为 ${ethers.formatEther(totalReward)} ETH`);
          }
        }
      });
    },
  });

  useEffect(() => {
    const fetchNFT = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:3050/nft/${tokenId}`);
        const nftData = response.data;

        let fileUrl = nftData.fileUrl;
        if (!fileUrl && nftData.uri) {
          try {
            const metadataResponse = await axios.get(nftData.uri);
            fileUrl = metadataResponse.data.fileUrl;
          } catch (error) {
            console.error("获取元数据失败:", error);
          }
        }

        setNft({ ...nftData, fileUrl });
      } catch (error) {
        console.error("Failed to fetch NFT:", error);
        notification.error("无法获取 NFT 信息");
        router.push("/myNFT");
      } finally {
        setLoading(false);
      }
    };

    const fetchRental = async () => {
      try {
        const response = await axios.get(`http://localhost:3050/getRental/${tokenId}`);
        console.log("获取到的租赁信息:", response.data);
        setRental(response.data);
      } catch (error) {
        console.error("获取租赁信息失败:", error);
        // 如果租赁信息不存在，设置为 null
        setRental(null);
      }
    };

    fetchNFT();
    fetchRental(); // 确保获取租赁信息
  }, [tokenId, router]);
  
  // 更新总打赏数量（初始加载）
  useEffect(() => {
    if (rewardCount) {
      setTotalReward(ethers.formatEther(rewardCount));
    }
  }, [rewardCount]);

  // 检查下载权限
  const hasDownloadPermission = () => {
    if (!connectedAddress) {
      return false; // 未连接钱包，无权限
    }

    if (!nft) {
      return false; // NFT 数据未加载，无权限
    }

    // 检查是否是拥有者
    if (connectedAddress.toLowerCase() === nft.owner.toLowerCase()) {
      console.log("用户是NFT拥有者，有下载权限");
      return true;
    }

    // 检查是否是租赁者且租赁有效
    if (rental && rental.active && rental.renter) {
      const currentTime = Math.floor(Date.now() / 1000); // 当前时间（秒）
      const rentalEndTime = rental.startTime + rental.duration; // 租赁结束时间（秒）- 这里duration已经是秒数了
      console.log("租赁信息:", rental);
      console.log("当前时间:", currentTime);
      console.log("租赁结束时间:", rentalEndTime);
      
      if (
        connectedAddress.toLowerCase() === rental.renter.toLowerCase() &&
        currentTime <= rentalEndTime
      ) {
        console.log("用户是有效租赁者，有下载权限");
        return true;
      }
    }

    console.log("用户无下载权限");
    return false;
  };

  // 下载文件到本地的函数
  const handleDownload = async () => {
    if (!hasDownloadPermission()) {
      notification.error("您没有下载权限！仅限 NFT 拥有者或当前租赁者下载。");
      return;
    }

    if (!nft?.fileUrl) {
      notification.error("文件 URL 不存在");
      return;
    }

    try {
      // 使用 fetch 获取文件内容
      const response = await fetch(nft.fileUrl);
      if (!response.ok) {
        throw new Error("文件请求失败");
      }

      // 将响应转换为 Blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // 动态创建 <a> 标签触发下载
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nft.name || "resource"}`; // 设置下载文件名，基于 NFT 名称
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      notification.success("成功获取文件，请下载");
    } catch (error) {
      console.error("下载失败:", error);
      notification.error("下载失败，请重试");
    }
  };

  // 处理打赏
  const handleReward = async () => {
    if (!rewardAmount || parseFloat(rewardAmount) <= 0) {
      notification.error("请输入有效的打赏金额（大于 0）");
      return;
    }

    setIsRewarding(true);
    const notificationId = notification.loading("正在处理打赏...");

    try {
      await rewardNFT({
        args: [BigInt(tokenId), ethers.parseUnits(rewardAmount, "ether")],
        value: ethers.parseUnits(rewardAmount, "ether"),
      });
      notification.success(`成功打赏 ${rewardAmount} ETH！`);
      // 总打赏数量会通过事件更新，无需手动重新获取
    } catch (error) {
      console.error("打赏失败:", error);
      notification.error("打赏失败，请重试！");
    } finally {
      setIsRewarding(false);
      notification.remove(notificationId);
    }
  };

  // 生成二维码的函数
  const generateQRCode = async (text: string) => {
    try {
      setQrLoading(true);
      setQrError("");
      const response = await axios.get(
        `https://v2.xxapi.cn/api/qrcode?text=${encodeURIComponent(text)}`
      );
  
      if (response.data.code === 200 || response.data.code === "200") {
        setQrCodeUrl(response.data.data);
        setShowQRCode(true);
      } else {
        throw new Error(response.data.msg || "生成二维码失败");
      }
    } catch (error) {
      console.error("生成二维码失败:", error);
      setQrError(
        error instanceof Error 
          ? error.message 
          : "无法生成二维码，请稍后重试"
      );
      notification.error("二维码生成失败");
    } finally {
      setQrLoading(false);
    }
  };

  // 关闭二维码弹窗
  const closeQRCode = () => {
    setShowQRCode(false);
    setQrCodeUrl("");
  };

  // 获取租赁剩余时间
  const getRentalTimeLeft = () => {
    if (!rental || !rental.active) return null;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const endTime = rental.startTime + rental.duration;
    const timeLeft = endTime - currentTime;
    
    if (timeLeft <= 0) return "租赁已过期";
    
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  };

  // 获取分类标签的颜色
  const getCategoryColor = () => {
    if (!nft) return "";
    
    const colorMap: Record<string, string> = {
      "艺术": "#f472b6", // pink
      "文学": "#3b82f6", // blue
      "科学": "#22c55e", // green
      "工程": "#eab308", // yellow
      "数学": "#a855f7", // purple
      "计算机": "#06b6d4", // cyan
      "历史": "#f59e0b", // amber
      "地理": "#10b981", // emerald
      "其他": "#6b7280"  // gray
    };
    
    return colorMap[nft.class] || "#6b7280"; // 默认灰色
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl text-red-500">NFT 不存在</div>
      </div>
    );
  }

  return (
    <>
      {/* 分享二维码弹窗 */}
      <Modal
        title="扫描查看元数据"
        open={showQRCode}
        onCancel={closeQRCode}
        footer={[
          <Button key="close" type="primary" danger onClick={closeQRCode}>
            关闭
          </Button>
        ]}
        centered
      >
        {qrLoading ? (
          <div className="flex justify-center p-6">
            <Loader />
          </div>
        ) : qrError ? (
          <div className="text-red-500 p-4">{qrError}</div>
        ) : (
          <div className="text-center">
            <img src={qrCodeUrl} alt="元数据二维码" className="w-64 h-64 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">使用手机扫描二维码查看元数据</p>
          </div>
        )}
      </Modal>

      {/* 主内容区 */}
      <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* NFT详情区域 */}
          <div className="item-details-wrap">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 左侧图片区域 */}
                <div className="flex justify-center">
                  <div className="relative overflow-hidden rounded-xl shadow-lg w-full">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-auto max-h-[500px] object-cover hover:scale-105 transition-transform duration-500"
                      onError={(e) => (e.currentTarget.src = "/placeholder-image.png")}
                    />
                    <div className="absolute top-4 right-4">
                      <Badge
                        count={nft.class}
                        style={{ backgroundColor: getCategoryColor(), padding: '0 8px' }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 右侧详情区域 */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge count={<EyeOutlined style={{ color: '#1890ff' }} />} />
                      <span className="text-sm text-gray-600">{pageViews} 人浏览过</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Tooltip title="分享">
                        <Button
                          shape="circle"
                          icon={<ShareAltOutlined />}
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: nft.name,
                                text: nft.description,
                                url: window.location.href,
                              });
                            } else {
                              notification.info("您的浏览器不支持分享功能");
                            }
                          }}
                        />
                      </Tooltip>
                      
                      <Tooltip title="查看元数据">
                        <Button
                          shape="circle"
                          icon={<QrcodeOutlined />}
                          onClick={() => generateQRCode(nft.uri)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                  
                  <h1 className="text-3xl font-bold">{nft.name}</h1>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserOutlined style={{ fontSize: '18px' }} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">所有者</span>
                      <div className="text-sm font-mono font-medium truncate max-w-[200px]">{nft.owner}</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 my-4"></div>
                  
                  {/* 租赁信息 */}
                  {rental && rental.active && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <ClockCircleOutlined className="text-blue-500" />
                        <span className="font-semibold text-blue-700">租赁状态</span>
                      </div>
                      <p className="text-base text-gray-800">当前租赁者: <span className="font-mono font-medium">{rental.renter.substring(0, 8)}...{rental.renter.substring(rental.renter.length - 6)}</span></p>
                      <p className="text-base text-gray-800">剩余时间: {getRentalTimeLeft()}</p>
                    </div>
                  )}
                  
                  {/* 价格和打赏信息 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-5 border-2 border-blue-200 shadow-sm">
                      <div className="text-base font-medium text-blue-700 mb-2">价格</div>
                      <div className="text-3xl font-bold text-blue-600 flex items-center">
                        <span className="mr-1">{nft.price}</span>
                        <span className="text-xl font-semibold">ETH</span>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-5 border-2 border-green-200 shadow-sm">
                      <div className="text-base font-medium text-green-700 mb-2">累计打赏</div>
                      <div className="text-3xl font-bold text-green-600 flex items-center">
                        <span className="mr-1">{totalReward}</span>
                        <span className="text-xl font-semibold">ETH</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 打赏功能 */}
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <label className="text-base font-medium text-gray-700 mb-1 block">打赏金额 (ETH)</label>
                      <Input
                        type="number"
                        value={rewardAmount}
                        onChange={(e: { target: { value: SetStateAction<string>; }; }) => setRewardAmount(e.target.value)}
                        step="0.01"
                        min="0"
                        prefix={<GiftOutlined />}
                        className="text-base"
                        size="large"
                      />
                    </div>
                    <Button
                      type="primary"
                      onClick={handleReward}
                      loading={isRewarding}
                      disabled={isRewarding}
                      className="mb-0.5 h-12 text-base font-medium"
                      size="large"
                      style={{ backgroundColor: "#f5222d", borderColor: "#f5222d" }}
                    >
                      打赏作者
                    </Button>
                  </div>
                  
                  {/* 文件下载 */}
                  {nft.fileUrl && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                        disabled={!hasDownloadPermission()}
                        size="large"
                        className="h-12 text-base font-medium"
                        style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                      >
                        下载资源
                      </Button>
                      
                      <Button
                        type="default"
                        onClick={() => window.open(nft.fileUrl, "_blank")}
                        size="large"
                        className="h-12 text-base font-medium"
                        style={{ borderColor: "#1890ff", color: "#1890ff" }}
                      >
                        在线预览
                      </Button>
                      
                      {!hasDownloadPermission() && (
                        <div className="w-full mt-2">
                          <p className="text-sm font-medium text-red-500">
                            仅限 NFT 拥有者或当前租赁者下载
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 选项卡区域 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <Tabs defaultActiveKey="details" size="large">
                <TabPane 
                  tab={
                    <span className="px-2 text-base">
                      <FileTextOutlined /> 详细描述
                    </span>
                  } 
                  key="details"
                >
                  <div className="py-4">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-800">资源详情</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Token ID</p>
                          <p className="text-base font-medium">{nft.tokenId}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">分类</p>
                          <div className="flex items-center">
                            <TagOutlined style={{ color: getCategoryColor(), marginRight: '4px', fontSize: '16px' }} />
                            <span className="text-base font-medium">{nft.class}</span>
                          </div>
                        </div>
                        {nft.cid && (
                          <div className="col-span-1 md:col-span-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">CID</p>
                            <p className="font-mono text-base break-all border border-gray-200 bg-gray-50 p-2 rounded">{nft.cid}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="border-t border-gray-200 my-4"></div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">描述</h3>
                        <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">{nft.description}</p>
                      </div>
                      
                      {rental && !rental.active && rental.dailyRentPrice && (
                        <>
                          <div className="border-t border-gray-200 my-4"></div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">租赁信息</h3>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <p className="text-base mb-2">每日租金: <span className="font-semibold">{rental.dailyRentPrice} ETH</span></p>
                              <p className="text-base mb-3">最长租期: <span className="font-semibold">{rental.maxDuration} 天</span></p>
                              <p className="text-base text-gray-700 mt-2">
                                租用此NFT可获得资源的临时使用权，包括下载权限。
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </TabPane>
                
                <TabPane 
                  tab={
                    <span className="px-2 text-base">
                      <UserOutlined /> 所有者信息
                    </span>
                  } 
                  key="owner"
                >
                  <div className="py-4">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-14 h-14 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                          <UserOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">所有者地址</div>
                          <div className="font-mono text-base font-medium truncate">{nft.owner}</div>
                        </div>
                      </div>
                      <p className="text-base text-gray-800 leading-relaxed">
                        NFT的所有者拥有完全的所有权和使用权，包括下载、租赁以及打赏收益权。
                      </p>
                    </div>
                  </div>
                </TabPane>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NFTDetail;
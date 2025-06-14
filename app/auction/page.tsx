"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Tabs } from "antd";
import { useAccount } from "wagmi";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { notification } from "~~/utils/scaffold-eth";
import { Collectible } from "~~/components/simpleNFT";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import axios from "axios";
import Link from "next/link";

interface Auction {
    tokenId: number;
    seller: string;
    minBid: string;
    highestBid: string;
    highestBidder: string;
    endTime: number;
    isActive: boolean;
    image: string;
    name?: string;
    description?: string;
}

const AuctionPage = () => {
    const router = useRouter();
    const { address: connectedAddress } = useAccount();
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [selectedNFT, setSelectedNFT] = useState<any>(null);
    const [userNFTs, setUserNFTs] = useState<any[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newAuction, setNewAuction] = useState({
        tokenId: 0,
        minBid: "",
        duration: "",
    });
    const [bidAmount, setBidAmount] = useState<string>("");
    const [currentTime, setCurrentTime] = useState(Date.now() / 1000);
    const [bidModalVisible, setBidModalVisible] = useState(false);
    const [currentAuction, setCurrentAuction] = useState<Auction | null>(null);

    const { writeAsync: startAuction } = useScaffoldContractWrite({
        contractName: "YourCollectible",
        functionName: "startAuction",
        args: [0n, 0n, 0n, 0n],
    });

    const { writeAsync: placeBid } = useScaffoldContractWrite({
        contractName: "YourCollectible",
        functionName: "placeBid",
        args: [0n, "", 0n],
    });

    const { writeAsync: endAuction } = useScaffoldContractWrite({
        contractName: "YourCollectible",
        functionName: "endAuction",
        args: [0n, 0n],
    });

     const { data: currentTimestamp } = useScaffoldContractRead({
        contractName: "YourCollectible",
        functionName: "getCurrentTimestamp",
    });
    
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Math.floor(Date.now() / 1000));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (currentTimestamp) {
            setCurrentTime(Number(currentTimestamp));
        }
    }, [currentTimestamp]);

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

    // 获取拍卖列表
    const fetchAuctions = async () => {
        try {
            const response = await axios.get(`http://localhost:3050/auctions?isActive=true`);
            setAuctions(response.data);
        } catch (error) {
            console.error("获取拍卖列表失败:", error);
            notification.error("无法获取拍卖列表");
        }
    };

    // 获取历史拍卖
    const [pastAuctions, setPastAuctions] = useState<Auction[]>([]);
    
    const fetchPastAuctions = async () => {
        try {
            const response = await axios.get(`http://localhost:3050/auctions?isActive=false`);
            setPastAuctions(response.data);
        } catch (error) {
            console.error("获取历史拍卖失败:", error);
            notification.error("无法获取历史拍卖");
        }
    };

    // 当Modal打开时获取用户NFT
    useEffect(() => {
        if (isModalVisible && connectedAddress) {
            fetchUserNFTs();
        }
    }, [isModalVisible, connectedAddress]);

    // 组件加载时获取拍卖列表
    useEffect(() => {
        fetchAuctions();
        fetchPastAuctions();
    }, []);

    const handleStartAuction = async () => {
        const { tokenId, minBid, duration } = newAuction;

        console.log("Selected NFT:", selectedNFT);
        console.log("New Auction:", newAuction);

        if (!tokenId || !minBid || !duration) {
            notification.error("请填写完整的拍卖信息！");
            return;
        }

        const notificationId = notification.loading("启动拍卖中...");
        try {
            await startAuction({
                args: [
                    BigInt(tokenId),
                    BigInt(ethers.parseUnits(Number(minBid).toString(), "ether")),
                    BigInt(currentTime),
                    BigInt(duration),
                ],
            });
            
            // 将拍卖信息保存到后端
            const endTime = Math.floor(currentTime) + Number(duration);
            await axios.post('http://localhost:3050/createAuction', {
                tokenId,
                seller: connectedAddress,
                minBid,
                endTime,
                image: selectedNFT?.image,
                name: selectedNFT?.name,
                description: selectedNFT?.description
            });

            notification.success("拍卖启动成功！");
            fetchAuctions(); // 重新获取拍卖列表
            setIsModalVisible(false);
            setSelectedNFT(null);
            setNewAuction({
                tokenId: 0,
                minBid: "",
                duration: "",
            });

        } catch (error) {
            console.error(error);
            notification.error("启动拍卖失败，请重试！");
        } finally {
            notification.remove(notificationId);
        }
    };

    const handlePlaceBid = async (auction: Auction) => {
        const highestBid = auction.highestBid || "0";

        console.log("当前最低出价: ", auction.minBid);
        console.log("当前最高出价: ", highestBid);
        console.log("出价金额为：", bidAmount);

        // 验证出价金额是否有效
        if (!bidAmount || bidAmount === "" || isNaN(Number(bidAmount)) || Number(bidAmount) <= 0) {
            notification.error("请输入有效的出价金额！");
            return;
        }

        const bidAmountInWei = ethers.parseUnits(bidAmount, "ether");
        const minBidInWei = ethers.parseUnits(auction.minBid, "ether");
        const highestBidInWei = ethers.parseUnits(highestBid, "ether");

        if (bidAmountInWei <= minBidInWei) {
            notification.error("出价必须高于最低出价！");
            return;
        }

        if (bidAmountInWei <= highestBidInWei) {
            notification.error("出价必须高于当前最高出价！");
            return;
        }

        const notificationId = notification.loading("出价中...");
        try {
            await placeBid({
                args: [BigInt(auction.tokenId), connectedAddress, BigInt(currentTime)],
                value: bidAmountInWei,
            });

            // 将出价信息保存到后端
            await axios.post('http://localhost:3050/placeBid', {
                tokenId: auction.tokenId,
                bidder: connectedAddress,
                bidAmount: bidAmount
            });

            notification.success("出价成功！");
            fetchAuctions(); // 重新获取拍卖列表
        } catch (error) {
            console.error(error);
            notification.error("出价失败，请重试！");
        } finally {
            notification.remove(notificationId);
        }
    };

    const handleEndAuction = async (auction: Auction) => {
        console.log("当前时间:", currentTime);
        console.log("拍卖结束时间:", auction.endTime);

        if (currentTime < auction.endTime) {
            notification.error("拍卖尚未结束！");
            return;
        }

        const notificationId = notification.loading("结束拍卖中...");
        try {
            await endAuction({
                args: [BigInt(auction.tokenId), BigInt(currentTime)],
            });
            
            // 更新后端拍卖状态
            await axios.post('http://localhost:3050/endAuction', {
                tokenId: auction.tokenId
            });

            notification.success("拍卖已成功结束！");
            fetchAuctions(); // 重新获取活跃拍卖列表
            fetchPastAuctions(); // 重新获取历史拍卖
        } catch (error) {
            console.error(error);
            notification.error("结束拍卖失败，请重试！");
        } finally {
            notification.remove(notificationId);
        }
    };

    const formatTimeLeft = (endTime: number) => {
        const timeLeft = endTime - currentTime;
        if (timeLeft <= 0) return "已结束";
        
        const days = Math.floor(timeLeft / 86400);
        const hours = Math.floor((timeLeft % 86400) / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = Math.floor(timeLeft % 60);

        return `${days}天 ${hours}时 ${minutes}分 ${seconds}秒`;
    };

    const formatEth = (value: string) => {
        return `${Number(value).toFixed(3)} ETH`;
    };

    const formatDuration = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        const parts = [];
        if (days > 0) parts.push(`${days}天`);
        if (hours > 0) parts.push(`${hours}小时`);
        if (minutes > 0) parts.push(`${minutes}分钟`);
        if (remainingSeconds > 0) parts.push(`${remainingSeconds}秒`);

        return parts.join(' ');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">实时拍卖</h1>
                    <p className="text-gray-600">发现并竞拍独特的NFT作品</p>
                </div>

                <Tabs
                    defaultActiveKey="past"
                    items={[
                        {
                            key: 'past',
                            label: '往期拍卖',
                            children: (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {pastAuctions.map((auction, index) => (
                                        <div
                                            key={index}
                                            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow opacity-80"
                                        >
                                            <div className="relative aspect-square group">
                                                <Link href={`/nft/${auction.tokenId}`}>
                                                    <img
                                                        src={auction.image}
                                                        alt={`NFT #${auction.tokenId}`}
                                                        className="w-full h-full object-cover rounded-t-2xl filter grayscale cursor-pointer transition-all duration-300 group-hover:filter-none group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-t-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <span className="bg-white/80 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                                                            查看详情
                                                        </span>
                                                    </div>
                                                </Link>
                                                <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                                    已结束
                                                </div>
                                            </div>

                                            <div className="p-6">
                                                <h3 className="text-xl font-bold mb-2">
                                                    {auction.name || `NFT #${auction.tokenId}`}
                                                </h3>
                                                {auction.description && (
                                                    <p className="text-gray-500 text-sm mb-4">
                                                        {auction.description}
                                                    </p>
                                                )}
                                                <div className="flex justify-between items-center mb-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500">起拍价</p>
                                                        <p className="text-lg font-semibold text-primary">
                                                            {formatEth(auction.minBid)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-500">成交价</p>
                                                        <p className="text-lg font-semibold text-green-600">
                                                            {formatEth(auction.highestBid)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <i className="bi bi-trophy text-primary"></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">中标者</p>
                                                        <p className="text-sm font-medium truncate w-32">
                                                            {auction.highestBidder}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-sm text-gray-500 text-right">
                                                    结束于 {new Date(auction.endTime * 1000).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {pastAuctions.length === 0 && (
                                        <div className="col-span-full text-center py-8 text-gray-500">
                                            暂无已结束的拍卖
                                        </div>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'active',
                            label: '进行中的拍卖',
                            children: (
                                <>
                                    <div className="flex justify-end mb-8">
                                        <button
                                            onClick={() => setIsModalVisible(true)}
                                            className="btn btn-primary rounded-full px-8 py-3 flex items-center gap-2"
                                        >
                                            <i className="bi bi-plus-circle"></i>
                                            创建拍卖
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {auctions.map((auction, index) => (
                                            <div
                                                key={index}
                                                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow"
                                            >
                                                <div className="relative aspect-square group">
                                                    <Link href={`/nft/${auction.tokenId}`}>
                                                        <img
                                                            src={auction.image || "/images/placeholder.png"}
                                                            alt={`NFT #${auction.tokenId}`}
                                                            className="w-full h-full object-cover rounded-t-2xl cursor-pointer transition-all duration-300 group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-t-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                            <span className="bg-white/80 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                                                                查看详情
                                                            </span>
                                                        </div>
                                                    </Link>
                                                    <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                                        {formatTimeLeft(auction.endTime)}
                                                    </div>
                                                </div>

                                                <div className="p-6">
                                                    <h3 className="text-xl font-bold mb-2">
                                                        {auction.name || `NFT #${auction.tokenId}`}
                                                    </h3>
                                                    {auction.description && (
                                                        <p className="text-gray-500 text-sm mb-4">
                                                            {auction.description}
                                                        </p>
                                                    )}
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">最低出价</p>
                                                            <p className="text-lg font-semibold text-primary">
                                                                {formatEth(auction.minBid)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">当前最高出价</p>
                                                            <p className="text-lg font-semibold text-green-600">
                                                                {formatEth(auction.highestBid || "0")}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <i className="bi bi-person text-primary"></i>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">卖家</p>
                                                            <p className="text-sm font-medium truncate w-32">
                                                                {auction.seller}
                                                            </p>
                                                        </div>
            </div>

                                                    <div className="flex gap-2">
                                                        {currentTime < auction.endTime ? (
                                                            <button
                                                                onClick={() => {
                                                                    // 设置默认出价为当前最高出价的1.1倍或最低出价的1.1倍
                                                                    const highestBidAmount = auction.highestBid ? parseFloat(auction.highestBid) : 0;
                                                                    const minBidAmount = parseFloat(auction.minBid);
                                                                    const defaultBid = Math.max(highestBidAmount * 1.1, minBidAmount * 1.1).toFixed(3);
                                                                    
                                                                    setBidAmount(defaultBid);
                                                                    setCurrentAuction(auction);
                                                                    setBidModalVisible(true);
                                                                }}
                                                                className="btn btn-primary flex-1 rounded-full"
                                                                disabled={auction.seller === connectedAddress}
                                                            >
                                                                <i className="bi bi-hammer mr-2"></i>
                                                                参与竞拍
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleEndAuction(auction)}
                                                                className="btn btn-secondary flex-1 rounded-full"
                                                                disabled={!auction.isActive || auction.seller !== connectedAddress}
                                                            >
                                                                <i className="bi bi-flag mr-2"></i>
                                                                结束拍卖
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {auctions.length === 0 && (
                                            <div className="col-span-full text-center py-8 text-gray-500">
                                                暂无进行中的拍卖
                                            </div>
                                        )}
                                    </div>
                                </>
                            ),
                        },
                    ]}
                />

            <Modal
                    title="创建新拍卖"
                    open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                    <div className="p-4">
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold mb-4">选择NFT</h4>
                            <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                                {userNFTs.map((nft: any, index: number) => (
                                    <div
                                        key={index}
                                        className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                                            selectedNFT?.tokenId === nft.tokenId
                                                ? "border-primary"
                                                : "border-transparent hover:border-gray-200"
                                        }`}
                                        onClick={() => {
                                            setSelectedNFT(nft);
                                            setNewAuction(prev => ({ 
                                                ...prev, 
                                                tokenId: nft.tokenId,
                                                name: nft.name,
                                                description: nft.description,
                                                image: nft.image
                                            }));
                                        }}
                                    >
                                        <div className="relative aspect-square">
                                            <img
                                                src={nft.image}
                                                alt={`NFT #${nft.tokenId}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-2 bg-gray-50">
                                            <p className="text-sm font-medium">#{nft.tokenId}</p>
                                            {nft.name && (
                                                <p className="text-sm text-gray-600 truncate">
                                                    {nft.name}
                                                </p>
                                            )}
                                        </div>
                    </div>
                ))}
                                {userNFTs.length === 0 && (
                                    <div className="col-span-2 text-center py-8 text-gray-500">
                                        你还没有拥有任何NFT
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-lg font-semibold mb-3 text-center">
                                {selectedNFT ? '已选择的NFT' : '请选择要拍卖的NFT'}
                            </h4>
                            
                            {selectedNFT ? (
                                <div className="p-4 border-2 border-primary rounded-lg bg-primary/5 shadow-md">
                                    <div className="flex gap-4">
                                        <div className="w-1/3">
                                            <div className="aspect-square rounded-lg overflow-hidden shadow-sm">
                                                <img 
                                                    src={selectedNFT.image} 
                                                    alt={`NFT #${selectedNFT.tokenId}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <div className="w-2/3">
                                            <h5 className="font-bold text-lg text-primary">{selectedNFT.name || `NFT #${selectedNFT.tokenId}`}</h5>
                                            <p className="text-sm text-gray-600 mb-2">Token ID: {selectedNFT.tokenId}</p>
                                            {selectedNFT.description && (
                                                <p className="text-sm text-gray-600 line-clamp-3">{selectedNFT.description}</p>
                                            )}
                                            <div className="mt-2 text-xs text-primary font-semibold">
                                                此NFT将被用于创建拍卖
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedNFT(null);
                                            setNewAuction(prev => ({
                                                ...prev,
                                                tokenId: 0
                                            }));
                                        }}
                                        className="mt-3 w-full py-1 px-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors"
                                    >
                                        <i className="bi bi-x-circle mr-1"></i>
                                        取消选择
                                    </button>
                                </div>
                            ) : (
                                <div className="p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center text-gray-500">
                                    <i className="bi bi-image text-4xl mb-2 block"></i>
                                    从上方列表中选择一个NFT进行拍卖
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="mb-6 border-t border-gray-200 pt-4">
                                <h4 className="text-lg font-semibold mb-4 text-center">拍卖设置</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">最低出价 (ETH)</label>
                    <Input
                        type="number"
                                            min="0"
                                            step="0.01"
                        value={newAuction.minBid}
                                            onChange={(e) => setNewAuction(prev => ({ ...prev, minBid: e.target.value }))}
                                            placeholder="设置最低出价"
                                            className="w-full"
                                            disabled={!selectedNFT}
                                            addonBefore={<span className="text-xs">ETH</span>}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">拍卖时长 (秒)</label>
                    <Input
                        type="number"
                                            min="0"
                        value={newAuction.duration}
                                            onChange={(e) => setNewAuction(prev => ({ ...prev, duration: e.target.value }))}
                                            placeholder="设置拍卖持续时间"
                                            className="w-full"
                                            disabled={!selectedNFT}
                                            addonBefore={<span className="text-xs">秒</span>}
                                        />
                                    </div>
                </div>
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 mb-2">
                                        {newAuction.duration && parseInt(newAuction.duration) > 0 ? (
                                            <>拍卖将持续 {formatDuration(parseInt(newAuction.duration))}</>
                                        ) : (
                                            <>请设置拍卖时长</>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleStartAuction}
                                className="btn btn-primary w-full rounded-full py-3"
                                disabled={!selectedNFT || !newAuction.minBid || !newAuction.duration}
                            >
                                <i className="bi bi-play-circle mr-2"></i>
                                启动拍卖
                            </button>
                        </div>
                    </div>
                </Modal>

                <Modal
                    title="参与竞拍"
                    open={bidModalVisible}
                    onCancel={() => setBidModalVisible(false)}
                    footer={[
                        <button
                            key="cancel"
                            className="btn btn-outline mr-2"
                            onClick={() => setBidModalVisible(false)}
                        >
                            取消
                        </button>,
                        <button
                            key="submit"
                            className="btn btn-primary"
                            disabled={!bidAmount || bidAmount === "" || isNaN(Number(bidAmount)) || Number(bidAmount) <= 0 || 
                                      (currentAuction && (Number(bidAmount) <= Number(currentAuction.highestBid || '0') || 
                                                         Number(bidAmount) < Number(currentAuction?.minBid || '0')))}
                            onClick={() => {
                                if (currentAuction) {
                                    handlePlaceBid(currentAuction);
                                    setBidModalVisible(false);
                                }
                            }}
                        >
                            确认出价
                        </button>
                    ]}
                >
                    {currentAuction && (
                        <div>
                            <div className="mb-4">
                                <div className="flex items-center mb-3">
                                    <div className="w-16 h-16 mr-3">
                                        <img
                                            src={currentAuction.image || "/images/placeholder.png"}
                                            alt={`NFT #${currentAuction.tokenId}`}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{currentAuction.name || `NFT #${currentAuction.tokenId}`}</h3>
                                        <p className="text-sm text-gray-500">Token ID: {currentAuction.tokenId}</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500">最低出价</p>
                                        <p className="font-semibold text-primary">{formatEth(currentAuction.minBid)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">当前最高出价</p>
                                        <p className="font-semibold text-green-600">{formatEth(currentAuction.highestBid || "0")}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                                    <p className="text-sm text-yellow-700">
                                        <i className="bi bi-info-circle mr-1"></i>
                                        建议出价至少比当前最高出价高10%
                                    </p>
                                </div>
                                
            <div>
                                    <label className="block text-sm font-medium mb-2">您的出价 (ETH)</label>
                            <Input
                                        placeholder="输入竞拍金额"
                                value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        type="number"
                                        min={Number(currentAuction.minBid)}
                                        step="0.01"
                                        addonBefore="ETH"
                                        autoFocus
                                    />
                                    
                                    {bidAmount && Number(bidAmount) > 0 && (
                                        <div className="mt-2">
                                            {Number(bidAmount) <= Number(currentAuction.highestBid || '0') ? (
                                                <p className="text-red-500 text-sm">出价必须高于当前最高出价</p>
                                            ) : Number(bidAmount) < Number(currentAuction.minBid) ? (
                                                <p className="text-red-500 text-sm">出价必须不低于最低出价</p>
                                            ) : (
                                                <p className="text-green-600 text-sm">✓ 有效的出价金额</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                )}
                </Modal>
            </div>
        </div>
    );
};

export default AuctionPage;

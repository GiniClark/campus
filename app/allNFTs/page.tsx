"use client";

import { useState, useEffect, SetStateAction, useCallback, useRef } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Modal, Button, notification, Pagination, Input, Select, Tooltip, Empty } from "antd";
import { SearchOutlined, FilterOutlined, ShoppingOutlined, KeyOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

export interface Collectible {
  tokenId: number;
  image: string;
  name: string;
  class: string;
  description: string;
  owner: string;
  price: string;
  uri: string;
  cid: string;
  fileCID: string;
  isListed: boolean;
}

interface RentalInfo {
  tokenId: number;
  dailyRentPrice: string;
  maxDuration: number;
  renter: string;
  startTime: number;
  active: boolean;
}

const { Option } = Select;

const AllNFTs: NextPage = () => {
  const router = useRouter();
  const { address: connectedAddress } = useAccount();
  const [allNFTs, setAllNFTs] = useState<Collectible[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState<Collectible | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [filteredNFTs, setFilteredNFTs] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<string>("default");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 预设的分类列表
  const predefinedCategories = [
    "艺术",
    "文学",
    "科学",
    "工程",
    "数学",
    "计算机",
    "历史",
    "地理",
    "其他"
  ];

  // 租用相关状态
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [rentalInfo, setRentalInfo] = useState<{ [key: number]: RentalInfo }>({});
  const [daysToRent, setDaysToRent] = useState<string>("");

  const itemsPerPage = 12; // 增加每页显示数量，更好地利用空间

  // 智能合约调用：购买 NFT
  const { writeAsync: buyNFT } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "buyNFT",
    args: [0n, 0n],
  });

  // 智能合约调用：租用 NFT
  const { writeAsync: rentNFT } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "rentNFT",
    args: [0n, 0n, 0n],
    value: 0n,
  });

  // 从后端加载上架的 NFT 数据并获取租赁信息
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchListedNFTs = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:3050/listedNFTs", {
          signal: controller.signal
        });
        if (isMounted) {
          const listedNFTs = response.data;
          setAllNFTs(listedNFTs);
          setFilteredNFTs(listedNFTs);

          // 获取每个 NFT 的租赁信息
          const rentalPromises = listedNFTs.map(async (nft: Collectible) => {
            try {
              const rentalResponse = await axios.get(`http://localhost:3050/getRental/${nft.tokenId}`, {
                signal: controller.signal
              });
              return { tokenId: nft.tokenId, ...rentalResponse.data };
            } catch (error) {
              // 如果租赁信息不存在，返回默认值
              return { tokenId: nft.tokenId, active: false, dailyRentPrice: "0" };
            }
          });

          const rentals = await Promise.all(rentalPromises);
          const rentalMap = rentals.reduce((acc: { [key: number]: RentalInfo }, rental) => {
            acc[rental.tokenId] = rental;
            return acc;
          }, {});
          if (isMounted) {
            setRentalInfo(rentalMap);
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isMounted) {
          console.error("Failed to fetch listed NFTs:", error);
          notification.error({ message: "无法获取上架的 NFT 列表" });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchListedNFTs();

    // 组件卸载时执行清理函数
    return () => {
      isMounted = false;
      controller.abort(); // 取消所有进行中的请求
      console.log("资源市场页面已卸载，已清理所有请求");
    };
  }, []);

  // 筛选和排序
  useEffect(() => {
    // 避免在空数据时执行筛选
    if (allNFTs.length === 0) return;
    
    let result = [...allNFTs];
    
    // 应用搜索筛选
    if (searchText) {
      result = result.filter((nft) => 
        nft.name.toLowerCase().includes(searchText.toLowerCase()) ||
        nft.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // 应用分类筛选
    if (categoryFilter !== 'all') {
      if (categoryFilter === '其他') {
        // 对于"其他"分类，筛选出不在预设分类列表中的NFT
        result = result.filter((nft) => !predefinedCategories.includes(nft.class) || !nft.class);
      } else {
        // 对于其他分类，精确匹配
        result = result.filter((nft) => nft.class === categoryFilter);
      }
    }
    
    // 应用可用性筛选
    if (availabilityFilter !== 'all') {
      if (availabilityFilter === 'forRent') {
        result = result.filter((nft) => 
          rentalInfo[nft.tokenId]?.dailyRentPrice && 
          rentalInfo[nft.tokenId]?.dailyRentPrice !== "0" && 
          !rentalInfo[nft.tokenId]?.active
        );
      } else if (availabilityFilter === 'forSale') {
        result = result.filter((nft) => nft.isListed);
      }
    }
    
    // 应用排序
    if (sortOption === 'priceAsc') {
      result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortOption === 'priceDesc') {
      result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortOption === 'newest') {
      result.sort((a, b) => b.tokenId - a.tokenId);
    }
    
    // 只有当过滤结果不同时才更新状态
    const currentFilteredIds = filteredNFTs.map(nft => nft.tokenId).sort().join(',');
    const newFilteredIds = result.map(nft => nft.tokenId).sort().join(',');
    
    if (currentFilteredIds !== newFilteredIds) {
      setFilteredNFTs(result);
      setCurrentPage(1); // 重置为第一页
    }
  }, [searchText, allNFTs, sortOption, categoryFilter, availabilityFilter, rentalInfo]);

  // 获取所有可用的分类
  const getCategories = () => {
    const categories = Array.from(new Set(allNFTs.map(nft => nft.class)));
    return categories;
  };

  // 打开购买模态框
  const openModal = (nft: Collectible) => {
    setSelectedNft(nft);
    setIsModalOpen(true);
  };

  // 打开租用模态框
  const openRentModal = (nft: Collectible) => {
    setSelectedNft(nft);
    setDaysToRent("");
    setIsRentModalOpen(true);
  };

  // 处理购买
  const handlePurchase = async () => {
    if (!selectedNft) return;

    try {
      const price = selectedNft.price;
      const value = ethers.parseUnits(price, "ether");

      // 自动使用当前连接的钱包地址作为买家地址
      const buyerAddress = connectedAddress;

      // 调用智能合约购买 NFT
      await buyNFT({
        args: [BigInt(selectedNft.tokenId), value],
        value,
      });

      // 更新 MongoDB 中的 owner 和 isListed 字段
      await axios.post("http://localhost:3050/updateNFT", {
        tokenId: selectedNft.tokenId,
        newOwner: buyerAddress,
      });

      await axios.post("http://localhost:3050/listNFT", {
        tokenId: selectedNft.tokenId,
        price: selectedNft.price,
        isListed: false,
      });

      // 从前端列表中移除已购买的 NFT
      const updatedNFTs = allNFTs.filter((nft) => nft.tokenId !== selectedNft.tokenId);
      setAllNFTs(updatedNFTs);
      setFilteredNFTs(updatedNFTs);

      notification.success({ 
        message: "购买成功", 
        description: `您已成功购买 ${selectedNft.name}`, 
        placement: "topRight" 
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("购买失败:", error);
      notification.error({ 
        message: "购买失败", 
        description: "交易未能完成，请稍后再试",
        placement: "topRight" 
      });
    }
  };

  // 处理租用
  const handleRent = async () => {
    if (!selectedNft || !daysToRent || parseInt(daysToRent) <= 0) {
      notification.error({ message: "请输入有效的租赁天数" });
      return;
    }

    const rental = rentalInfo[selectedNft.tokenId];
    if (!rental || rental.active) {
      notification.error({ message: "该 NFT 已被租用" });
      return;
    }

    try {
      // 确保 dailyRentPrice 是字符串形式（单位：ETH）
      const dailyRentPrice = rental.dailyRentPrice; // 例如 "0.1"
      const days = parseInt(daysToRent); // 租赁天数
      const durationInSeconds = days * 86400; // 转换为秒（1 天 = 86400 秒）

      // 使用 ethers 进行精确计算，避免浮点数精度问题
      const dailyRentPriceWei = ethers.parseUnits(dailyRentPrice, "ether"); // 将 dailyRentPrice 转换为 wei
      const totalRentPriceWei = dailyRentPriceWei * BigInt(days); // 计算总租金（wei）
      
      // 调用智能合约
      await rentNFT({
        args: [BigInt(selectedNft.tokenId), BigInt(daysToRent), totalRentPriceWei],
        value: totalRentPriceWei, // 直接传递 wei 单位的值
      });

      // 更新 MongoDB 中的租赁信息
      await axios.post("http://localhost:3050/updateRental", {
        tokenId: selectedNft.tokenId,
        renter: connectedAddress,
        startTime: Math.floor(Date.now() / 1000),
        duration: durationInSeconds,
        active: true,
      });

      // 更新前端租赁信息
      setRentalInfo((prev) => ({
        ...prev,
        [selectedNft.tokenId]: {
          ...prev[selectedNft.tokenId],
          renter: connectedAddress || "",
          startTime: Math.floor(Date.now() / 1000),
          duration: durationInSeconds,
          active: true,
        },
      }));

      notification.success({ 
        message: "租用成功", 
        description: `您已成功租用 ${selectedNft.name} ${daysToRent} 天`, 
        placement: "topRight" 
      });
      setIsRentModalOpen(false);
    } catch (error) {
      console.error("租用失败:", error);
      notification.error({ 
        message: "租用失败", 
        description: "交易未能完成，请稍后再试",
        placement: "topRight" 
      });
    }
  };

  // 分页数据
  const paginatedNFTs = filteredNFTs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 在AllNFTs组件外部添加这个辅助函数，用于根据分类返回对应的颜色类名
  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      "艺术": "bg-pink-500",
      "文学": "bg-blue-500",
      "科学": "bg-green-500",
      "工程": "bg-yellow-500",
      "数学": "bg-purple-500",
      "计算机": "bg-cyan-500",
      "历史": "bg-amber-500",
      "地理": "bg-emerald-500",
      "其他": "bg-gray-500"
    };

    return colorMap[category] || "bg-gray-500"; // 默认使用灰色
  };

  // 滚动NFT轮播区域的函数
  const scrollCarousel = useCallback((direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth; // 滚动整个视图宽度
      
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        setCurrentCarouselIndex(prev => Math.max(prev - 1, 0));
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        // 热门NFT的最大索引（6张图片，一行4个，共2页）
        const maxIndex = Math.ceil(hotNFTs.length / 4) - 1; // 2 - 1 = 1
        setCurrentCarouselIndex(prev => Math.min(prev + 1, maxIndex));
      }
    }
  }, []);

  // 自动轮播
  useEffect(() => {
    const autoScroll = setInterval(() => {
      if (currentCarouselIndex < Math.ceil(hotNFTs.length / 4) - 1) {
        scrollCarousel('right');
      } else {
        // 回到第一页
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          setCurrentCarouselIndex(0);
        }
      }
    }, 5000); // 每5秒切换一次

    return () => clearInterval(autoScroll);
  }, [currentCarouselIndex, scrollCarousel]);

  // 热门NFT数据
  const hotNFTs = [
    {
      id: 1,
      image: "/1.avif",
      name: "Docker",
      category: "计算机",
      price: "1 ETH",
      creator: "0xFEc0...2865"
    },
    {
      id: 2,
      image: "/3.avif",
      name: "rg",
      category: "科学",
      price: "10 ETH",
      creator: "0xFEc0...2865"
    },
    {
      id: 3,
      image: "/9.avif",
      name: "数字珍藏",
      category: "艺术",
      price: "0.5 ETH",
      creator: "0xFEc0...2865"
    },
    {
      id: 4,
      image: "/11.avif",
      name: "限量收藏",
      category: "收藏品",
      price: "2.3 ETH",
      creator: "0xFEc0...2865"
    },
    {
      id: 5,
      image: "/24.webp",
      name: "创作者原作",
      category: "文学",
      price: "0.8 ETH",
      creator: "0xFEc0...2865"
    },
    {
      id: 6,
      image: "/27.avif",
      name: "限时拍卖",
      category: "艺术",
      price: "3.2 ETH",
      creator: "0xFEc0...2865"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-100">
      {/* 顶部横幅 */}
      <div className="bg-base-300 py-12 px-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">NFT 资源市场</h1>
          <p className="text-center text-lg opacity-80 max-w-2xl mx-auto">
            探索各类数字藏品，购买或租用您喜欢的 NFT 资源
          </p>
        </div>
      </div>

      {/* 热门NFT轮播区域 */}
      <div className="container mx-auto px-4 py-8 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">热门NFT</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => scrollCarousel('left')}
              disabled={currentCarouselIndex === 0}
              className={`p-2 rounded-full flex items-center justify-center bg-base-200 hover:bg-base-300 transition-colors ${currentCarouselIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <LeftOutlined className="text-lg" />
            </button>
            <button 
              onClick={() => scrollCarousel('right')} 
              disabled={currentCarouselIndex === 1}
              className={`p-2 rounded-full flex items-center justify-center bg-base-200 hover:bg-base-300 transition-colors ${currentCarouselIndex === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RightOutlined className="text-lg" />
            </button>
          </div>
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="overflow-x-hidden flex snap-x snap-mandatory w-full"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {/* 第一页 - 显示前4张 */}
          <div className="min-w-full flex gap-4 snap-start">
            {hotNFTs.slice(0, 4).map((nft) => (
              <div
                key={nft.id}
                className="w-1/4 flex-shrink-0 bg-base-100 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative overflow-hidden aspect-square">
                  <img 
                    src={nft.image} 
                    alt={nft.name} 
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110" 
                  />
                  <div className="absolute inset-0 transition-colors duration-300 group-hover:bg-black/10"></div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs text-white rounded-full ${getCategoryColor(nft.category)}`}>
                      {nft.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold group-hover:text-blue-600 transition-colors">{nft.name}</h3>
                      <div className="text-xs text-gray-500 mt-1">
                        {nft.creator}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">底价</div>
                      <div className="font-bold group-hover:text-blue-600 transition-colors">{nft.price}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 第二页 - 显示剩余图片 */}
          <div className="min-w-full flex gap-4 snap-start">
            {hotNFTs.slice(4).map((nft) => (
              <div
                key={nft.id}
                className="w-1/4 flex-shrink-0 bg-base-100 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative overflow-hidden aspect-square">
                  <img 
                    src={nft.image} 
                    alt={nft.name} 
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110" 
                  />
                  <div className="absolute inset-0 transition-colors duration-300 group-hover:bg-black/10"></div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs text-white rounded-full ${getCategoryColor(nft.category)}`}>
                      {nft.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold group-hover:text-blue-600 transition-colors">{nft.name}</h3>
                      <div className="text-xs text-gray-500 mt-1">
                        {nft.creator}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">底价</div>
                      <div className="font-bold group-hover:text-blue-600 transition-colors">{nft.price}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* 如果第二页不足4个，添加空白占位 */}
            {Array.from({ length: Math.max(0, 4 - hotNFTs.slice(4).length) }).map((_, index) => (
              <div key={`empty-${index}`} className="w-1/4 flex-shrink-0"></div>
            ))}
          </div>
        </div>
        
        {/* 轮播指示器 */}
        <div className="flex justify-center space-x-2 mt-4">
          <button 
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                setCurrentCarouselIndex(0);
              }
            }}
            className={`w-2 h-2 rounded-full ${currentCarouselIndex === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}
            aria-label="第1页"
          />
          <button 
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ left: scrollContainerRef.current.clientWidth, behavior: 'smooth' });
                setCurrentCarouselIndex(1);
              }
            }}
            className={`w-2 h-2 rounded-full ${currentCarouselIndex === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}
            aria-label="第2页"
          />
        </div>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-base-100 p-4 rounded-xl shadow-md mb-8">
          <div className="flex-1 w-full lg:w-auto">
            <Input 
              placeholder="搜索 NFT 名称或描述..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              className="w-full"
              size="large"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="flex-1">
              <Select
                className="w-full"
                placeholder="分类筛选"
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value)}
                size="large"
              >
                <Option value="all">所有分类</Option>
                {predefinedCategories.map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <Select
                className="w-full"
                placeholder="可用性筛选"
                value={availabilityFilter}
                onChange={(value) => setAvailabilityFilter(value)}
                size="large"
              >
                <Option value="all">所有 NFT</Option>
                <Option value="forSale">可购买</Option>
                <Option value="forRent">可租用</Option>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                className="w-full"
                placeholder="排序方式"
                value={sortOption}
                onChange={(value) => setSortOption(value)}
                size="large"
              >
                <Option value="default">默认排序</Option>
                <Option value="priceAsc">价格从低到高</Option>
                <Option value="priceDesc">价格从高到低</Option>
                <Option value="newest">最新发布</Option>
              </Select>
            </div>
          </div>
        </div>

        {/* NFT 卡片展示区域 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            // 加载状态
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-base-200 rounded-xl h-[400px] animate-pulse"></div>
            ))
          ) : paginatedNFTs.length === 0 ? (
            // 没有结果
            <div className="col-span-full py-12 flex justify-center items-center">
              <Empty 
                description="没有找到符合条件的 NFT" 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
              />
            </div>
          ) : (
            // 展示NFT卡片
            paginatedNFTs.map((nft) => (
              <div
                key={nft.tokenId}
                className="bg-base-100 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg"
              >
                {/* NFT图片 - 点击进入详情页 */}
                <div 
                  className="relative cursor-pointer overflow-hidden aspect-square"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const path = `/nft/${nft.tokenId}`;
                    console.log("正在导航到:", path);
                    // 使用window.location进行导航，避免可能的路由钩子问题
                    window.location.href = path;
                  }}
                >
                  <img 
                    src={nft.image} 
                    alt={nft.name} 
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110" 
                  />
                  <div className="absolute inset-0 transition-colors duration-300 group-hover:bg-black/10"></div>
                  
                  {/* 查看详情提示 */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-white/80 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      查看详情
                    </span>
                  </div>
                  
                  {/* TokenId显示在左下角 */}
                  <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
                    #{nft.tokenId}
                  </div>
                  
                  {/* 类别标签 */}
                  <div className="absolute top-3 right-3">
                    {nft.class && (
                      <span className={`px-2 py-1 text-xs text-white rounded-full ${getCategoryColor(nft.class)}`}>
                        {nft.class}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* NFT信息 */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold group-hover:text-blue-600 transition-colors">{nft.name}</h3>
                      <div className="text-xs text-gray-500 mt-1">
                        <Address address={nft.owner} size="sm" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">价格</div>
                      <div className="font-bold group-hover:text-blue-600 transition-colors">{nft.price} ETH</div>
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openModal(nft)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center font-medium text-sm"
                    >
                      <ShoppingOutlined className="mr-1" /> 购买
                    </button>
                    
                    {rentalInfo[nft.tokenId]?.active ? (
                      <button
                        disabled
                        className="flex-1 bg-gray-200 text-gray-500 py-2 px-4 rounded-md flex items-center justify-center font-medium text-sm cursor-not-allowed"
                      >
                        <KeyOutlined className="mr-1" /> 已出租
                      </button>
                    ) : rentalInfo[nft.tokenId]?.dailyRentPrice && rentalInfo[nft.tokenId]?.dailyRentPrice !== "0" ? (
                      <button
                        onClick={() => openRentModal(nft)}
                        className="flex-1 border border-green-500 text-green-600 hover:bg-green-50 py-2 px-4 rounded-md flex items-center justify-center font-medium text-sm"
                      >
                        <KeyOutlined className="mr-1" /> 租用
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 分页控件 */}
        {!loading && filteredNFTs.length > 0 && (
          <div className="flex justify-center mt-12">
            <Pagination
              current={currentPage}
              onChange={(page) => setCurrentPage(page)}
              pageSize={itemsPerPage}
              total={filteredNFTs.length}
              showSizeChanger={false}
              showQuickJumper
            />
          </div>
        )}
      </div>

      {/* 购买确认模态框 */}
      <Modal
        title="确认购买"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)} size="large">
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={handlePurchase}
            size="large"
            className="bg-blue-600 hover:bg-blue-700 border-none font-semibold"
          >
            确认购买
          </Button>,
        ]}
      >
        {selectedNft && (
          <div className="py-4">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src={selectedNft.image} 
                alt={selectedNft.name} 
                className="w-20 h-20 object-cover rounded-lg" 
              />
              <div>
                <h3 className="font-bold text-lg">{selectedNft.name}</h3>
                <p className="text-sm opacity-70">#{selectedNft.tokenId}</p>
              </div>
            </div>
            <div className="p-4 bg-base-200 rounded-lg">
              <p className="mb-2">您将支付:</p>
              <p className="text-xl font-bold text-primary">{selectedNft.price} ETH</p>
              <p className="text-sm opacity-70 mt-4">购买后，该 NFT 将转移到您的钱包中。</p>
            </div>
          </div>
        )}
      </Modal>

      {/* 租用确认模态框 */}
      <Modal
        title="确认租用"
        open={isRentModalOpen}
        onCancel={() => setIsRentModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsRentModalOpen(false)} size="large">
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={handleRent}
            size="large"
            className="bg-green-600 hover:bg-green-700 border-none font-semibold"
          >
            确认租用
          </Button>,
        ]}
      >
        {selectedNft && rentalInfo[selectedNft.tokenId] && (
          <div className="py-4">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src={selectedNft.image} 
                alt={selectedNft.name} 
                className="w-20 h-20 object-cover rounded-lg" 
              />
              <div>
                <h3 className="font-bold text-lg">{selectedNft.name}</h3>
                <p className="text-sm opacity-70">#{selectedNft.tokenId}</p>
              </div>
            </div>
            
            <div className="p-4 bg-base-200 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span>每日租金:</span>
                <span className="font-bold">{rentalInfo[selectedNft.tokenId].dailyRentPrice} ETH</span>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm mb-2">租赁天数:</label>
                <Input
                  type="number"
                  value={daysToRent}
                  onChange={(e: { target: { value: SetStateAction<string> } }) => setDaysToRent(e.target.value)}
                  placeholder="请输入租赁天数"
                  min={1}
                  max={rentalInfo[selectedNft.tokenId].maxDuration || 30}
                />
              </div>
              
              {daysToRent && parseInt(daysToRent) > 0 && (
                <div className="mt-4 p-3 border-t border-base-300">
                  <div className="flex justify-between">
                    <span>总计:</span>
                    <span className="font-bold text-primary">
                      {(parseFloat(rentalInfo[selectedNft.tokenId].dailyRentPrice) * parseInt(daysToRent)).toFixed(6)} ETH
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-sm opacity-70">
              租用后，您将在指定时间内拥有此 NFT 的使用权，但所有权仍属于原持有者。
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllNFTs;
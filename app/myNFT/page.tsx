// pages/MyNFTPage.tsx
"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import axios from "axios";
import { notification } from "~~/utils/scaffold-eth";
import { NFTCard } from "~~/components/NFTCard";
import { RentedNFTCard } from "~~/components/diy/RentedNFTCard"; // 新增：引入 RentedNFTCard
import Loader from "~~/components/diy/Loader";
import NFTChatbot from "~~/components/diy/Chatbot";

// NFT基本信息接口
interface NFTInfo {
  tokenId: number;
  image: string;
  name: string;
  owner: string;
  isListed: boolean;
  rentalInfo?: RentalInfoType;
}

// 租赁信息接口
interface RentalInfoType {
  dailyRentPrice: string;
  maxDuration: number;
  renter: string;
  startTime: number;
  duration: number;
  active: boolean;
}

// 带有必需租赁信息的NFT接口
interface RentedNFTInfo extends Omit<NFTInfo, 'rentalInfo'> {
  rentalInfo: RentalInfoType;
}

const MyNFTPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [nfts, setNfts] = useState<NFTInfo[]>([]); // 拥有的 NFT
  const [rentedNfts, setRentedNfts] = useState<RentedNFTInfo[]>([]); // 租赁的 NFT
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"owned" | "rented">("owned"); // 选项卡状态

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!connectedAddress) {
        notification.error("请连接钱包查看 NFT 列表");
        return;
      }

      try {
        setLoading(true);

        // 获取用户拥有的 NFT
        const ownedResponse = await axios.get(`http://localhost:3050/nfts?owner=${connectedAddress}`);
        setNfts(ownedResponse.data);

        // 获取用户租赁的 NFT
        const rentedResponse = await axios.get(`http://localhost:3050/rentedNFTs?renter=${connectedAddress}`);
        // 确保租赁的NFT都有租赁信息
        setRentedNfts(rentedResponse.data.filter((nft: any) => nft.rentalInfo) as RentedNFTInfo[]);
      } catch (error) {
        console.error("Failed to fetch NFTs:", error);
        notification.error("无法获取 NFT 列表");
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [connectedAddress]);

  const handleTransferSuccess = (tokenId: number) => {
    setNfts((prevNfts) => prevNfts.filter((nft) => nft.tokenId !== tokenId));
  };

  // 计算分页数据
  const currentItems = tab === "owned" ? nfts : rentedNfts;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNfts = currentItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);

  // 分页导航
  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理归还成功后的回调
  const handleRentalEnded = (tokenId: number) => {
    setRentedNfts((prev) => prev.filter((nft) => nft.tokenId !== tokenId));
  };

  // 生成页码数组
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (startPage === 2) endPage = Math.min(4, totalPages - 1);
      if (endPage === totalPages - 1) startPage = Math.max(2, totalPages - 3);

      if (startPage > 2) pageNumbers.push(-1);
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      if (endPage < totalPages - 1) pageNumbers.push(-2);
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">我的 NFT</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setTab("owned")}
              className={`px-4 py-2 rounded-md ${tab === "owned" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              拥有的 NFT
            </button>
            <button
              onClick={() => setTab("rented")}
              className={`px-4 py-2 rounded-md ${tab === "rented" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              租赁的 NFT
            </button>
          </div>
        </div>

        {currentItems.length === 0 ? (
          <div className="text-center text-lg text-gray-600 bg-white p-6 rounded-lg shadow-md">
            {tab === "owned" ? "你还没有铸造任何 NFT" : "你还没有租赁任何 NFT"}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tab === "owned" 
                ? currentNfts.map((nft) => (
                    <NFTCard
                      key={nft.tokenId}
                      nft={nft}
                      connectedAddress={connectedAddress || ""}
                      onTransferSuccess={handleTransferSuccess}
                    />
                  ))
                : (currentNfts as RentedNFTInfo[]).map((nft) => (
                    <RentedNFTCard
                      key={nft.tokenId}
                      nft={nft}
                      onRentalEnded={handleRentalEnded}
                    />
                  ))
              }
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 mx-1 rounded-md ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    上一页
                  </button>

                  {getPageNumbers().map((pageNumber, index) =>
                    pageNumber < 0 ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-1 mx-1">
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1 mx-1 rounded-md ${
                          currentPage === pageNumber
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  )}

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 mx-1 rounded-md ${
                      currentPage === totalPages
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    下一页
                  </button>
                </nav>
              </div>
            )}

            {/* 分页信息显示 */}
            <div className="text-center text-gray-600 mt-4">
              显示 {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, currentItems.length)} 项，共{" "}
              {currentItems.length} 项
            </div>
          </div>
        )}
      </div>
      <NFTChatbot />
    </div>
  );
};

export default MyNFTPage;
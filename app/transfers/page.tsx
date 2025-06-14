"use client";

import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import axios from "axios";
import { useEffect, useState } from "react";
import Link from "next/link";

const Transfers: NextPage = () => {
  const { data: transferEvents, isLoading } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "Transfer",
    fromBlock: 0n,
  });

  // 使用 state 保存已经保存过的 transactionHash
  const [processedTransactions, setProcessedTransactions] = useState<Set<string>>(new Set());
  
  // 添加状态来存储NFT信息
  const [nftInfoMap, setNftInfoMap] = useState<Record<string, any>>({});
  
  // 添加状态来存储当前页码和每页显示数量
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // 添加过滤和排序状态
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState("");

  // 保存转移记录到数据库
  const saveTransferToDb = async (event: any) => {
    try {
      await axios.post("http://localhost:3001/saveNftTransfers", {
        tokenId: event.args.tokenId?.toString(),
        from: event.args.from || "",
        to: event.args.to || "",
        blockNumber: event.block.number.toString() || "",
        transactionHash: event.block.transactions[0] || "0xabcdefabcdefabcdefabcdefabcdefabcdefabcde1",
        gas: event.block.baseFeePerGas.toString() || "",
        timestamp: event.block.timestamp.toString() || "",
      });
      console.log("转移记录已保存");
    } catch (error) {
      console.error("保存转移记录失败: ", error);
    }
  };

  // 监听 transferEvents，过滤未处理的事件
  useEffect(() => {
    if (transferEvents) {
      transferEvents.forEach((event) => {
        if (!processedTransactions.has(event.log.blockHash)) {
          saveTransferToDb(event);
          setProcessedTransactions((prev) => new Set(prev).add(event.log.blockHash));
        }
      });
    }
  }, [transferEvents, processedTransactions]);
  
  // 获取NFT信息
  useEffect(() => {
    const fetchNftInfo = async () => {
      if (!transferEvents || transferEvents.length === 0) return;
      
      for (const event of transferEvents) {
        const tokenId = event.args.tokenId?.toString();
        if (tokenId && !nftInfoMap[tokenId]) {
          try {
            const response = await axios.get(`http://localhost:3050/nft/${tokenId}`);
            setNftInfoMap(prev => ({
              ...prev,
              [tokenId]: response.data
            }));
          } catch (error) {
            console.error(`获取NFT #${tokenId}信息失败:`, error);
          }
        }
      }
    };
    
    fetchNftInfo();
  }, [transferEvents, nftInfoMap]);
  
  // 格式化日期时间
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // 排序和过滤转移事件
  const filteredAndSortedEvents = transferEvents 
    ? transferEvents
        .filter(event => {
          if (!searchTerm) return true;
          const tokenId = event.args.tokenId?.toString() || '';
          const from = event.args.from?.toLowerCase() || '';
          const to = event.args.to?.toLowerCase() || '';
          const term = searchTerm.toLowerCase();
          
          return tokenId.includes(term) || from.includes(term) || to.includes(term);
        })
        .sort((a, b) => {
          const timestampA = Number(a.block.timestamp);
          const timestampB = Number(b.block.timestamp);
          
          return sortDirection === 'asc' 
            ? timestampA - timestampB 
            : timestampB - timestampA;
        })
    : [];
  
  // 分页逻辑
  const totalPages = Math.ceil(filteredAndSortedEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEvents = filteredAndSortedEvents.slice(startIndex, startIndex + itemsPerPage);
  
  // 分页导航
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center items-center mt-6 mb-8 space-x-2">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="btn btn-sm btn-outline"
        >
          &laquo; 上一页
        </button>
        
        <span className="px-4 py-2 rounded-lg bg-gray-100">
          第 {currentPage} 页，共 {totalPages} 页
        </span>
        
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="btn btn-sm btn-outline"
        >
          下一页 &raquo;
        </button>
      </div>
    );
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-xl"></span>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">NFT 转移记录</h1>
            <p className="text-gray-600">查看区块链上所有 NFT 的转移历史</p>
          </div>
          
          {/* 搜索和过滤工具栏 */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="w-full md:w-1/2">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索 Token ID 或地址..."
                  className="input input-bordered w-full pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <i className="bi bi-search"></i>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center cursor-pointer">
                <span className="mr-2 text-sm text-gray-600">排序方式:</span>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                  className="select select-bordered select-sm"
                >
                  <option value="desc">最新在前</option>
                  <option value="asc">最早在前</option>
                </select>
              </label>
            </div>
          </div>
          
          {/* 主表格 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            {filteredAndSortedEvents.length === 0 ? (
              <div className="py-16 text-center">
                <i className="bi bi-inbox text-5xl text-gray-300 mb-4 block"></i>
                <p className="text-gray-500">没有找到转移记录</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-4 text-primary hover:text-primary-focus underline"
                  >
                    清除搜索
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-6 py-4">Token ID</th>
                      <th className="px-6 py-4">NFT</th>
                      <th className="px-6 py-4">发送方</th>
                      <th className="px-6 py-4">接收方</th>
                      <th className="px-6 py-4">时间</th>
                      <th className="px-6 py-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEvents.map((event, index) => {
                      const tokenId = event.args.tokenId?.toString();
                      const nftInfo = nftInfoMap[tokenId];
                      const timestamp = Number(event.block.timestamp);
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-primary">#{tokenId}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {nftInfo ? (
                                <>
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                      src={nftInfo.image || "/images/placeholder.png"}
                                      alt={`NFT #${tokenId}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <div className="font-medium">{nftInfo.name || `NFT #${tokenId}`}</div>
                                  </div>
                                </>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <i className="bi bi-image text-gray-400"></i>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Address address={event.args.from} size="sm" />
                          </td>
                          <td className="px-6 py-4">
                            <Address address={event.args.to} size="sm" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{formatDate(timestamp)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <Link 
                              href={`/nft/${tokenId}`}
                              className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 border-none px-4"
                            >
                              查看详情
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* 分页控制 */}
          {renderPagination()}
          
          {/* 统计信息 */}
          {filteredAndSortedEvents.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">统计信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-500 text-3xl font-bold mb-2">{filteredAndSortedEvents.length}</div>
                  <div className="text-gray-600">总转移次数</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-500 text-3xl font-bold mb-2">
                    {new Set(filteredAndSortedEvents.map(e => e.args.tokenId?.toString())).size}
                  </div>
                  <div className="text-gray-600">独立NFT数量</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-500 text-3xl font-bold mb-2">
                    {new Set([
                      ...filteredAndSortedEvents.map(e => e.args.from),
                      ...filteredAndSortedEvents.map(e => e.args.to)
                    ]).size}
                  </div>
                  <div className="text-gray-600">参与用户数</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transfers;

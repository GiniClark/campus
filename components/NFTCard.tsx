// components/NFTCard.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { HeartIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import axios from "axios";
import { AddressInput } from "~~/components/scaffold-eth";

interface NFTInfo {
  tokenId: number;
  image: string;
  name: string;
  owner: string;
  isListed: boolean;
}

interface NFTCardProps {
  nft: NFTInfo;
  connectedAddress: string;
  onTransferSuccess: (tokenId: number) => void;
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

export const NFTCard: React.FC<NFTCardProps> = ({ nft, connectedAddress, onTransferSuccess }) => {
  const [transferToAddress, setTransferToAddress] = useState("");
  const [price, setPrice] = useState("");
  const [isListed, setIsListed] = useState(nft.isListed || false);
  const [dailyRentPrice, setDailyRentPrice] = useState("");
  const [maxDuration, setMaxDuration] = useState("");
  const [rentalInfo, setRentalInfo] = useState<RentalInfo | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [liked, setLiked] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const { writeAsync: setApprovalForAll } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "setApprovalForAll",
    args: [connectedAddress, true],
  });

  const { writeAsync: transferNFT } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "transferFrom",
    args: [nft.owner, transferToAddress, BigInt(nft.tokenId)],
  });

  const { writeAsync: createRental } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "createRental",
    args: [BigInt(nft.tokenId), 0n, BigInt(maxDuration || "0")],
  });

  const { writeAsync: checkAndPenalizeLateReturn } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "checkAndPenalizeLateReturn",
    args: [BigInt(nft.tokenId)],
  });

  useEffect(() => {
    const fetchRentalInfo = async () => {
      try {
        const response = await axios.get(`http://localhost:3050/getRental/${nft.tokenId}`);
        setRentalInfo(response.data);
      } catch (error) {
        // 404错误是正常的，表示该NFT还没有租赁信息
        if (error.response && error.response.status === 404) {
          // 静默处理404错误，只初始化默认租赁信息
          setRentalInfo({
            tokenId: nft.tokenId,
            dailyRentPrice: "0",
            maxDuration: 0,
            renter: "",
            startTime: 0,
            duration: 0,
            active: false,
          });
        } else {
          // 记录其他类型的错误，但仍然设置默认值避免UI问题
          console.error("获取租赁信息失败:", error);
          setRentalInfo({
            tokenId: nft.tokenId,
            dailyRentPrice: "0",
            maxDuration: 0,
            renter: "",
            startTime: 0,
            duration: 0,
            active: false,
          });
        }
      }
    };

    fetchRentalInfo();
    
    // 点击外部关闭操作菜单
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [nft.tokenId]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 40;
    const rotateY = (centerX - x) / 40;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  };

  const handleTransfer = async () => {
    if (!transferToAddress) {
      notification.error("请输入接收者地址");
      return;
    }

    try {
      if (connectedAddress !== nft.owner) {
        await setApprovalForAll();
      }
      await transferNFT();
      await axios.post("http://localhost:3050/updateNFT", {
        tokenId: nft.tokenId,
        newOwner: transferToAddress,
      });
      onTransferSuccess(nft.tokenId);
      notification.success("NFT 转移成功");
    } catch (error) {
      console.error("转移 NFT 失败:", error);
      notification.error("转移 NFT 失败");
    }
  };

  const handleListToggle = async () => {
    if (!isListed && !price) {
      notification.error("请设置价格");
      return;
    }

    try {
      if (!isListed) {
        await axios.post("http://localhost:3050/listNFT", {
          tokenId: nft.tokenId,
          price,
          isListed: true,
        });
        notification.success("NFT 上架成功");
      } else {
        await axios.post("http://localhost:3050/listNFT", {
          tokenId: nft.tokenId,
          price: "",
          isListed: false,
        });
        notification.success("NFT 下架成功");
      }
      setIsListed(!isListed);
    } catch (error) {
      console.error("上架/下架 NFT 失败:", error);
      notification.error("上架/下架 NFT 失败");
    }
  };

  const handleCreateRental = async () => {
    if (!dailyRentPrice || !maxDuration) {
      notification.error("请设置每日租金和最长租赁天数");
      return;
    }

    if (connectedAddress !== nft.owner) {
      notification.error("只有 NFT 拥有者可以出租");
      return;
    }

    try {
      await createRental();
      await axios.post("http://localhost:3050/createRental", {
        tokenId: nft.tokenId,
        dailyRentPrice,
        maxDuration,
        renter: '',
        startTime: 0,
        active: false
      });
      setRentalInfo((prev) => ({
        ...prev,
        tokenId: nft.tokenId,
        dailyRentPrice,
        maxDuration: parseInt(maxDuration),
        renter: "",
        startTime: 0,
        duration: 0,
        active: false,
      }));
      notification.success("设置租赁成功");
    } catch (error) {
      console.error("设置租赁失败:", error);
      notification.error("设置租赁失败");
    }
  };

  const handleCheckAndPenalizeLateReturn = async () => {
    if (!rentalInfo || !rentalInfo.active) {
      notification.error("这个 NFT 目前没有被租用");
      return;
    }

    try {
      await checkAndPenalizeLateReturn();
      notification.success("检查租赁状态成功");
    } catch (error) {
      console.error("检查租赁状态失败:", error);
      notification.error("检查租赁状态失败");
    }
  };

  return (
    <div
      ref={cardRef}
      className="opensea-card group transition-transform duration-200 cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        <Link href={`/nft/${nft.tokenId}`}>
          <div className="overflow-hidden rounded-t-xl">
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-64 object-cover transition-all duration-300 group-hover:scale-105"
              onError={(e) => (e.currentTarget.src = "/placeholder-image.png")}
            />
          </div>
        </Link>
        
        {/* 收藏和菜单按钮 */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button 
            onClick={() => setLiked(!liked)} 
            className="p-2 rounded-full bg-base-100/90 backdrop-blur-sm hover:bg-base-200/90 transition-colors"
          >
            {liked ? (
              <HeartIconSolid className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-base-content" />
            )}
          </button>
          
          <div className="relative" ref={actionsRef}>
            <button 
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-full bg-base-100/90 backdrop-blur-sm hover:bg-base-200/90 transition-colors"
            >
              <EllipsisHorizontalIcon className="h-5 w-5 text-base-content" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-base-200 shadow-lg rounded-lg overflow-hidden z-10">
                {connectedAddress === nft.owner && (
                  <>
                    <button
                      onClick={() => {
                        const modal = document.getElementById(`transfer-modal-${nft.tokenId}`);
                        setShowActions(false);
                        if (modal) {
                          (modal as any).showModal();
                        }
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-base-300 transition-colors"
                    >
                      转移
                    </button>
                    <button
                      onClick={() => {
                        const modal = document.getElementById(`list-modal-${nft.tokenId}`);
                        setShowActions(false);
                        if (modal) {
                          (modal as any).showModal();
                        }
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-base-300 transition-colors"
                    >
                      {isListed ? "下架" : "上架"}
                    </button>
                    <button
                      onClick={() => {
                        const modal = document.getElementById(`rental-modal-${nft.tokenId}`);
                        setShowActions(false);
                        if (modal) {
                          (modal as any).showModal();
                        }
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-base-300 transition-colors"
                    >
                      设置租赁
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    // 分享逻辑
                    navigator.clipboard.writeText(window.location.origin + `/nft/${nft.tokenId}`);
                    notification.success("复制链接成功");
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-base-300 transition-colors"
                >
                  分享
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1">{nft.name}</h3>
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm opacity-70">
            #{nft.tokenId} · 拥有者: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
          </div>
        </div>
        
        {isListed && (
          <div className="bg-base-300/50 rounded-lg p-3">
            <div className="text-xs mb-1 opacity-70">当前价格</div>
            <div className="text-lg font-bold">{price} ETH</div>
          </div>
        )}
        
        {rentalInfo && rentalInfo.dailyRentPrice !== "0" && (
          <div className="mt-2 text-sm">
            <span className="opacity-70">租赁价格:</span> {rentalInfo.dailyRentPrice} ETH/天
          </div>
        )}
      </div>

      {/* 转移 Modal */}
      <dialog id={`transfer-modal-${nft.tokenId}`} className="modal">
        <form method="dialog" className="modal-box">
          <h3 className="font-bold text-lg mb-4">转移 NFT</h3>
          <AddressInput
            value={transferToAddress}
            onChange={setTransferToAddress}
            placeholder="接收者地址"
          />
          <div className="modal-action">
            <button className="btn" onClick={() => document.getElementById(`transfer-modal-${nft.tokenId}`)?.close()}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                handleTransfer();
                document.getElementById(`transfer-modal-${nft.tokenId}`)?.close();
              }}
            >
              转移
            </button>
          </div>
        </form>
      </dialog>

      {/* 上架/下架 Modal */}
      <dialog id={`list-modal-${nft.tokenId}`} className="modal">
        <form method="dialog" className="modal-box">
          <h3 className="font-bold text-lg mb-4">{isListed ? "下架 NFT" : "上架 NFT"}</h3>
          {!isListed && (
            <div className="mb-4">
              <label className="block text-sm mb-1">价格 (ETH)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input input-bordered w-full"
                placeholder="设置价格"
              />
            </div>
          )}
          <div className="modal-action">
            <button className="btn" onClick={() => document.getElementById(`list-modal-${nft.tokenId}`)?.close()}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                handleListToggle();
                document.getElementById(`list-modal-${nft.tokenId}`)?.close();
              }}
            >
              {isListed ? "下架" : "上架"}
            </button>
          </div>
        </form>
      </dialog>

      {/* 租赁设置 Modal */}
      <dialog id={`rental-modal-${nft.tokenId}`} className="modal">
        <form method="dialog" className="modal-box">
          <h3 className="font-bold text-lg mb-4">设置租赁</h3>
          <div className="mb-4">
            <label className="block text-sm mb-1">每日租金 (ETH)</label>
            <input
              type="text"
              value={dailyRentPrice}
              onChange={(e) => setDailyRentPrice(e.target.value)}
              className="input input-bordered w-full"
              placeholder="每日租金"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1">最长租赁天数</label>
            <input
              type="text"
              value={maxDuration}
              onChange={(e) => setMaxDuration(e.target.value)}
              className="input input-bordered w-full"
              placeholder="最长租赁天数"
            />
          </div>
          <div className="modal-action">
            <button className="btn" onClick={() => document.getElementById(`rental-modal-${nft.tokenId}`)?.close()}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                handleCreateRental();
                document.getElementById(`rental-modal-${nft.tokenId}`)?.close();
              }}
            >
              设置
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
};
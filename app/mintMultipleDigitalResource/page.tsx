"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useScaffoldContractWrite, useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { uploadToPinata } from "~~/components/simpleNFT/pinata";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import axios from "axios";
import { motion, useMotionValue, useTransform } from "framer-motion";

interface DigitalResourceInfo {
  image: string;
  name: string;
  description: string;
  class: string;
  price: string;
  owner: string;
  file: File | null;
  uri: string;
  CID?: string;
  fileCID?: string;
  nftType: string;
  royalty: string;
  copies: string;
  size: string;
  agreeTerms: boolean;
  fileUrl: string;
}

interface ImageInfo {
  file: File;
  preview: string;
  ipfsUrl?: string;
  cid?: string;
}

const DRAG_BUFFER = 50;
const VELOCITY_THRESHOLD = 200;
const GAP = 16;
const SPRING_OPTIONS = { 
  type: "spring", 
  stiffness: 200,
  damping: 25,
  mass: 0.5
};

const ImageCarousel = ({ images }: { images: ImageInfo[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);
  const containerRef = useRef(null);
  const baseWidth = 400;
  const containerPadding = 16;
  const itemWidth = baseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;
  const [isHovered, setIsHovered] = useState(false);

  // 自动轮播定时器
  useEffect(() => {
    if (images.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 2000); // 每3秒切换一次
2
    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  const handleDragEnd = (_, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    const shouldSwipe = Math.abs(offset) > DRAG_BUFFER || Math.abs(velocity) > VELOCITY_THRESHOLD;

    if (shouldSwipe) {
      const direction = offset < 0 || velocity < 0 ? 1 : -1;
      const newIndex = Math.max(0, Math.min(currentIndex + direction, images.length - 1));
      setCurrentIndex(newIndex);
    }
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg cursor-grab active:cursor-grabbing"
        style={{
          width: `${baseWidth}px`,
          touchAction: "none"
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className="flex"
          drag="x"
          dragConstraints={{
            left: -trackItemOffset * (images.length - 1),
            right: 0,
          }}
          dragElastic={0.2}
          dragMomentum={true}
          style={{
            width: itemWidth,
            gap: `${GAP}px`,
            x,
          }}
          onDragEnd={handleDragEnd}
          animate={{ x: -(currentIndex * trackItemOffset) }}
          transition={SPRING_OPTIONS}
        >
          {images.map((image, index) => {
            const range = [
              -(index + 1) * trackItemOffset,
              -index * trackItemOffset,
              -(index - 1) * trackItemOffset,
            ];
            const outputRange = [90, 0, -90];
            const rotateY = useTransform(x, range, outputRange, { clamp: false });

            return (
              <motion.div
                key={index}
                className="relative shrink-0 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
                style={{
                  width: itemWidth,
                  height: itemWidth,
                  rotateY: rotateY,
                }}
              >
                <Image
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {image.ipfsUrl && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                    已上传到 IPFS
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      <div className="flex justify-center mt-4">
        <div className="flex space-x-2">
          {images.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 w-2 rounded-full cursor-pointer ${
                currentIndex === index ? "bg-blue-600" : "bg-gray-300"
              }`}
              animate={{
                scale: currentIndex === index ? 1.2 : 1,
              }}
              onClick={() => setCurrentIndex(index)}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const MintMultipleDigitalResourcePage: NextPage = () => {
  const router = useRouter();
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const [resourceInfo, setResourceInfo] = useState<DigitalResourceInfo>({
    image: "",
    name: "",
    description: "",
    class: "",
    price: "",
    owner: connectedAddress || "",
    file: null,
    uri: "",
    CID: "",
    fileCID: "",
    nftType: "fixed",
    royalty: "5",
    copies: "1",
    size: "",
    agreeTerms: false,
    fileUrl: ""
  });
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchSize, setBatchSize] = useState("1");

  // 调用合约的 mintMultipleDigitalResources 函数
  const { writeAsync: mintMultipleDigitalResources } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "mintMultipleDigitalResources",
    args: [connectedAddress, [], BigInt(0), ""],
  });

  const { data: tokenIdCounter } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
    cacheOnBlock: true,
  });

  // 添加分类选项
  const categories = [
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

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setResourceInfo({
      ...resourceInfo,
      [name]: value,
    });
  };

  // 处理批量大小变化
  const handleBatchSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBatchSize(e.target.value);
  };

  // 处理复选框变化
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setResourceInfo({
      ...resourceInfo,
      [name]: checked,
    });
  };

  // 处理单选框变化
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResourceInfo({
      ...resourceInfo,
      nftType: e.target.value,
    });
  };

  // 修改图片上传处理函数
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: ImageInfo[] = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setImages(newImages);
      // 自动设置批量铸造数量为图片数量
      setBatchSize(e.target.files.length.toString());
      setResourceInfo({
        ...resourceInfo,
        size: (e.target.files[0].size / (1024 * 1024)).toFixed(2) + "MB",
      });
    }
  };

  // 处理资源文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResourceInfo({
        ...resourceInfo,
        file: e.target.files[0],
      });
    }
  };

  // 上传图片和资源文件到 IPFS
  const handleUpload = async () => {
    if (images.length === 0) {
      notification.error("请上传 NFT 展示图片");
      return;
    }
    if (!resourceInfo.file) {
      notification.error("请上传数字资源文件");
      return;
    }

    setLoading(true);
    const notificationId = notification.loading("上传文件中...");

    try {
      // 1. 上传所有展示图片到 IPFS
      const imageUploadPromises = images.map(image => uploadToPinata(image.file));
      const imageUploadResults = await Promise.all(imageUploadPromises);
      
      // 2. 上传数字资源文件到 IPFS
      const resourceUploadResult = await uploadToPinata(resourceInfo.file);
      const resourceUrl = `https://ipfs.io/ipfs/${resourceUploadResult.IpfsHash}`;

      // 3. 更新图片信息
      const updatedImages = images.map((image, index) => ({
        ...image,
        ipfsUrl: `https://ipfs.io/ipfs/${imageUploadResults[index].IpfsHash}`,
        cid: imageUploadResults[index].IpfsHash
      }));
      setImages(updatedImages);

      // 4. 生成元数据并上传到 IPFS
      const metadata = {
        name: resourceInfo.name,
        description: resourceInfo.description,
        image: updatedImages[0].ipfsUrl, // 使用第一张图片作为主图
        class: resourceInfo.class,
        fileUrl: resourceUrl,
        nftType: resourceInfo.nftType,
        royalty: resourceInfo.royalty,
        copies: resourceInfo.copies,
        size: resourceInfo.size
      };
      const metadataUploadResult = await addToIPFS(metadata);
      const metadataUrl = `https://ipfs.io/ipfs/${metadataUploadResult.IpfsHash}`;

      // 更新状态
      setResourceInfo({
        ...resourceInfo,
        image: updatedImages[0].ipfsUrl,
        uri: metadataUrl,
        CID: imageUploadResults[0].IpfsHash,
        fileCID: resourceUploadResult.IpfsHash,
        fileUrl: resourceUrl,
      });

      notification.remove(notificationId);
      notification.success("文件上传成功");
    } catch (error) {
      notification.remove(notificationId);
      notification.error("上传失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 批量铸造数字资源 NFT
  const handleMintMultipleDigitalResources = async () => {
    const { name, description, class: resourceClass, price, fileCID, agreeTerms } = resourceInfo;

    if (!name || !description || !resourceClass || !price || !fileCID) {
      notification.error("请填写所有必填字段并上传文件");
      return;
    }

    if (!agreeTerms) {
      notification.error("请同意条款和条件");
      return;
    }

    const notificationId = notification.loading("批量铸造数字资源 NFT 中...");
    try {
      const priceInWei = ethers.parseEther(price);
      const batchSizeNum = parseInt(batchSize);
      
      // 创建URI数组，使用所有上传的图片
      const uris = images.map(image => image.ipfsUrl || "");

      // 批量铸造 NFT
      await mintMultipleDigitalResources({
        args: [connectedAddress, uris, priceInWei, fileCID],
      });
      // 获取铸造的tokenIds
      const newTokenIds = Array.from({ length: batchSizeNum }, (_, i) => Number(tokenIdCounter) + i + 1);

      // 准备要保存的NFT信息数组
      const nftsToSave = newTokenIds.map((tokenId, index) => ({
        tokenId,
        image: images[index % images.length].ipfsUrl || "",
        name,
        description,
        class: resourceClass,
        price,
        owner: connectedAddress,
        uri: resourceInfo.uri,
        cid: images[index % images.length].cid || "",
        fileCID: resourceInfo.fileCID,
        fileUrl: resourceInfo.fileUrl,
        nftType: resourceInfo.nftType,
        royalty: resourceInfo.royalty,
        copies: resourceInfo.copies,
        size: resourceInfo.size
      }));

      // 保存NFT信息到后端
      await axios.post("http://localhost:3050/saveNFTs", {
        nfts: nftsToSave
      });

      notification.remove(notificationId);
      notification.success(`成功批量铸造 ${batchSizeNum} 个数字资源 NFT!`);
      router.push("/myNFT");
    } catch (error) {
      notification.remove(notificationId);
      notification.error("铸造失败");
      console.error("铸造出错: ", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-grow px-[120px] py-8">
        <h1 className="text-3xl font-semibold mb-8 text-gray-900">创建数字资源 NFT</h1>
        
        <div className="flex gap-12">
          {/* 左侧表单区域 */}
          <div className="flex-grow max-w-3xl">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">上传文件</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NFT展示图片（可多选）
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      数字资源文件
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">基本信息</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                      <input
                        type="text"
                        name="name"
                        value={resourceInfo.name}
                        onChange={handleInputChange}
                        placeholder="资源名称（如高等数学笔记）"
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                      <textarea
                        name="description"
                        value={resourceInfo.description}
                        onChange={handleInputChange}
                        placeholder="资源描述"
                        rows={3}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                        <input
                          type="number"
                          name="price"
                          value={resourceInfo.price}
                          onChange={handleInputChange}
                          placeholder="0.324 ETH"
                          step="0.000001"
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                        <select
                          name="class"
                          value={resourceInfo.class}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded-lg bg-white"
                        >
                          <option value="">选择分类</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">版税</label>
                        <input
                          type="number"
                          name="royalty"
                          value={resourceInfo.royalty}
                          onChange={handleInputChange}
                          placeholder="5"
                          min="0"
                          max="100"
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">批量铸造数量</label>
                        <input
                          type="number"
                          value={batchSize}
                          onChange={handleBatchSizeChange}
                          min="1"
                          max="100"
                          className="w-full p-2 border rounded-lg bg-gray-100"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">NFT类型</h2>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="nftType"
                        value="fixed"
                        checked={resourceInfo.nftType === "fixed"}
                        onChange={handleRadioChange}
                        className="mr-2"
                      />
                      固定价格
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="nftType"
                        value="unlock"
                        checked={resourceInfo.nftType === "unlock"}
                        onChange={handleRadioChange}
                        className="mr-2"
                      />
                      解锁购买
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="nftType"
                        value="auction"
                        checked={resourceInfo.nftType === "auction"}
                        onChange={handleRadioChange}
                        className="mr-2"
                      />
                      开放竞价
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-8">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={resourceInfo.agreeTerms}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">我同意条款和条件</span>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={loading}
                      className="px-6 py-2.5 bg-gray-50 text-gray-900 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 transition-colors duration-200"
                    >
                      上传
                    </button>
                    <button
                      type="button"
                      onClick={handleMintMultipleDigitalResources}
                      disabled={loading || images.length === 0 || !resourceInfo.file}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                    >
                      批量铸造 NFT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧预览区域 */}
          <div className="w-[420px]">
            <div className="bg-white rounded-2xl p-8 shadow-sm sticky top-8">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">上传图片预览</h2>
              {images.length > 0 ? (
                <ImageCarousel images={images} />
              ) : (
                <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-500 border border-gray-100">
                  上传图片预览
                </div>
              )}
              
              <div className="mt-6 space-y-4">
                {resourceInfo.name && (
                  <div>
                    <h4 className="font-medium text-gray-900">名称</h4>
                    <p className="text-gray-700 mt-1">{resourceInfo.name}</p>
                  </div>
                )}
                {resourceInfo.description && (
                  <div>
                    <h4 className="font-medium text-gray-900">描述</h4>
                    <p className="text-gray-700 mt-1">{resourceInfo.description}</p>
                  </div>
                )}
                {resourceInfo.class && (
                  <div>
                    <h4 className="font-medium text-gray-900">分类</h4>
                    <p className="text-gray-700 mt-1">{resourceInfo.class}</p>
                  </div>
                )}
                {resourceInfo.price && (
                  <div>
                    <h4 className="font-medium text-gray-900">价格</h4>
                    <p className="text-gray-700 mt-1">{resourceInfo.price} ETH</p>
                  </div>
                )}
                {resourceInfo.size && (
                  <div>
                    <h4 className="font-medium text-gray-900">文件大小</h4>
                    <p className="text-gray-700 mt-1">{resourceInfo.size}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MintMultipleDigitalResourcePage; 
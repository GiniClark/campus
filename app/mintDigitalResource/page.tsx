"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useScaffoldContractWrite, useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch"; // 上传 JSON 数据到 Pinata
import { uploadToPinata } from "~~/components/simpleNFT/pinata"; // 上传文件到 Pinata
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import axios from "axios";

interface DigitalResourceInfo {
  image: string; // NFT 展示图片的 IPFS 链接
  id: number; // NFT 的 tokenId（铸造后生成）
  name: string; // 资源名称（如"高等数学笔记"）
  description: string; // 资源描述
  class: string; // 资源分类
  price: string; // 以 ETH 为单位，用户输入的价格
  owner: string; // 资源拥有者地址
  file: File | null; // 上传的数字资源文件（如 PDF）
  uri: string; // 元数据链接，包含资源的 IPFS 链接
  CID?: string; // IPFS 上传图片的 CID
  fileCID?: string; // IPFS 上传文件的 CID
  nftType: string; // NFT类型: 固定价格、解锁购买、开放竞价
  royalty: string; // 版税比例
  copies: string; // 副本数量
  size: string; // 资源大小
  agreeTerms: boolean; // 同意条款
}

const MintDigitalResourcePage: NextPage = () => {
  const router = useRouter();
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const [resourceInfo, setResourceInfo] = useState<DigitalResourceInfo>({
    image: "",
    id: 0,
    name: "",
    description: "",
    class: "",
    price: "",
    owner: connectedAddress || "",
    file: null,
    uri: "",
    CID: "",
    fileCID: "",
    nftType: "fixed", // 默认为固定价格
    royalty: "5", // 默认版税5%
    copies: "1", // 默认1个副本
    size: "", // 资源大小
    agreeTerms: false // 默认未同意条款
  });
  const [imageFile, setImageFile] = useState<File | null>(null); // 单独处理展示图片
  const [loading, setLoading] = useState(false);

  // 调用合约的 mintDigitalResource 函数
  const { writeAsync: mintDigitalResource } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "mintDigitalResource",
    args: [connectedAddress, "", BigInt(0), ""],
  });

  const { data: tokenIdCounter } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
    cacheOnBlock: true,
  });

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setResourceInfo({
      ...resourceInfo,
      [name]: value,
    });
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

  // 处理展示图片上传
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
      // 同时更新size字段
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
    if (!imageFile) {
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
      // 1. 上传展示图片到 IPFS
      const imageUploadResult = await uploadToPinata(imageFile);
      const imageUrl = `https://ipfs.io/ipfs/${imageUploadResult.IpfsHash}`;

      // 2. 上传数字资源文件到 IPFS
      const resourceUploadResult = await uploadToPinata(resourceInfo.file);
      const resourceUrl = `https://ipfs.io/ipfs/${resourceUploadResult.IpfsHash}`;

      // 3. 生成元数据并上传到 IPFS
      const metadata = {
        name: resourceInfo.name,
        description: resourceInfo.description,
        image: imageUrl,
        class: resourceInfo.class,
        fileUrl: resourceUrl, // 数字资源文件的 IPFS 链接
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
        image: imageUrl,
        uri: metadataUrl,
        CID: imageUploadResult.IpfsHash,
        fileCID: resourceUploadResult.IpfsHash,
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

  // 铸造数字资源 NFT
  const handleMintDigitalResource = async () => {
    const { name, description, class: resourceClass, price, uri, fileCID, agreeTerms } = resourceInfo;

    if (!name || !description || !resourceClass || !price || !uri) {
      notification.error("请填写所有必填字段并上传文件");
      return;
    }

    if (!uri.startsWith("https://ipfs.io/ipfs/")) {
      notification.error("请先上传文件并生成元数据");
      return;
    }

    if (!agreeTerms) {
      notification.error("请同意条款和条件");
      return;
    }

    const notificationId = notification.loading("铸造数字资源 NFT 中...");
    try {
      const priceInWei = ethers.parseEther(price);

      // 铸造 NFT
      await mintDigitalResource({
        args: [connectedAddress, uri, priceInWei, fileCID],
      });

      // 保存 NFT 信息到后端
      const newId = Number(tokenIdCounter) + 1;
      await axios.post("http://localhost:3050/saveNFT", {
        tokenId: newId,
        image: resourceInfo.image,
        name,
        description,
        class: resourceClass,
        price,
        owner: connectedAddress,
        uri,
        cid: resourceInfo.CID,
        fileCID: resourceInfo.fileCID,
        nftType: resourceInfo.nftType,
        royalty: resourceInfo.royalty,
        copies: resourceInfo.copies,
        size: resourceInfo.size
      });

      notification.remove(notificationId);
      notification.success("数字资源 NFT 铸造成功!");
      router.push("/myNFT");
    } catch (error) {
      notification.remove(notificationId);
      notification.error("铸造失败, 检测到你上传他人的资源, 请重新上传");
      console.error("铸造出错: ", error);
    }
  };

  return (
    <div className="create-new-wrapper py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧表单区域 */}
          <div className="lg:col-span-8">
            <div className="create-new-form border rounded-xl shadow-sm p-4 sm:p-8 bg-white">
              <h2 className="text-3xl font-bold mb-6">创建数字资源 NFT</h2>
              <form>
                <div className="space-y-6">
                  <div className="form-group">
                    <label className="block text-gray-700 mb-2 text-lg" htmlFor="formFileMultiple">上传文件</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="mb-1 text-gray-600">NFT展示图片</p>
                        <input 
                          type="file"
                          onChange={handleImageChange}
                          className="form-control block w-full px-3 py-2 text-base font-normal text-gray-700 
                                    bg-white bg-clip-padding border border-gray-300 rounded transition 
                                    ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                          accept="image/*"
                        />
                        {imageFile && !loading && (
                          <div className="mt-2">
                            <Image
                              src={URL.createObjectURL(imageFile)}
                              alt="Preview"
                              width={150}
                              height={150}
                              className="rounded-lg shadow-sm object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="mb-1 text-gray-600">数字资源文件</p>
                        <input 
                          type="file"
                          onChange={handleFileChange}
                          className="form-control block w-full px-3 py-2 text-base font-normal text-gray-700 
                                    bg-white bg-clip-padding border border-gray-300 rounded transition 
                                    ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                          accept=".pdf,.docx,.txt"
                        />
                        {resourceInfo.file && !loading && (
                          <p className="mt-2 text-gray-600">已选择文件: {resourceInfo.file.name}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="flex flex-wrap gap-4">
                      <div className="form-check">
                        <input 
                          className="form-check-input appearance-none rounded-full h-4 w-4 border border-gray-300 
                                    bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none 
                                    transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left 
                                    mr-2 cursor-pointer" 
                          type="radio" 
                          name="nftType" 
                          id="fixedPrice" 
                          value="fixed" 
                          checked={resourceInfo.nftType === "fixed"}
                          onChange={handleRadioChange}
                        />
                        <label className="form-check-label inline-block text-gray-800" htmlFor="fixedPrice">
                          固定价格
                        </label>
                      </div>
                      <div className="form-check">
                        <input 
                          className="form-check-input appearance-none rounded-full h-4 w-4 border border-gray-300 
                                    bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none 
                                    transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left 
                                    mr-2 cursor-pointer" 
                          type="radio" 
                          name="nftType" 
                          id="unlockPurchased" 
                          value="unlock" 
                          checked={resourceInfo.nftType === "unlock"}
                          onChange={handleRadioChange}
                        />
                        <label className="form-check-label inline-block text-gray-800" htmlFor="unlockPurchased">
                          解锁购买
                        </label>
                      </div>
                      <div className="form-check">
                        <input 
                          className="form-check-input appearance-none rounded-full h-4 w-4 border border-gray-300 
                                    bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none 
                                    transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left 
                                    mr-2 cursor-pointer" 
                          type="radio" 
                          name="nftType" 
                          id="openForBids" 
                          value="open" 
                          checked={resourceInfo.nftType === "open"}
                          onChange={handleRadioChange}
                        />
                        <label className="form-check-label inline-block text-gray-800" htmlFor="openForBids">
                          开放竞价
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="block text-gray-700 mb-2 text-lg" htmlFor="title">标题</label>
                    <input 
                      type="text" 
                      name="name"
                      value={resourceInfo.name}
                      onChange={handleInputChange}
                      className="form-control block w-full px-3 py-2 text-base font-normal text-gray-700 
                                bg-white bg-clip-padding border border-gray-300 rounded transition 
                                ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                      placeholder="资源名称（如高等数学笔记）"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-gray-700 mb-2 text-lg" htmlFor="description">描述</label>
                    <textarea 
                      name="description"
                      value={resourceInfo.description}
                      onChange={handleInputChange}
                      className="form-control block w-full px-3 py-2 text-base font-normal text-gray-700 
                                bg-white bg-clip-padding border border-gray-300 rounded transition 
                                ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                      placeholder="资源描述"
                      rows={3}
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="block text-gray-700 mb-2 text-lg" htmlFor="price">价格</label>
                      <input 
                        type="number" 
                        name="price"
                        value={resourceInfo.price}
                        onChange={handleInputChange}
                        className="form-control block w-full px-3 py-2 text-base font-normal text-gray-700 
                                  bg-white bg-clip-padding border border-gray-300 rounded transition 
                                  ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="0.324 ETH"
                        step="0.001"
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-gray-700 mb-2 text-lg" htmlFor="class">分类</label>
                      <select
                        name="class"
                        value={resourceInfo.class}
                        onChange={(e) => setResourceInfo({...resourceInfo, class: e.target.value})}
                        className="form-select appearance-none block w-full px-3 py-2 text-base font-normal text-gray-700 
                                  bg-white bg-clip-padding bg-no-repeat border border-gray-300 rounded transition 
                                  ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                      >
                        <option value="">选择分类</option>
                        <option value="艺术">艺术</option>
                        <option value="文学">文学</option>
                        <option value="科学">科学</option>
                        <option value="工程">工程</option>
                        <option value="数学">数学</option>
                        <option value="计算机">计算机</option>
                        <option value="历史">历史</option>
                        <option value="地理">地理</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label className="block text-gray-700 mb-2 text-lg" htmlFor="royalty">版税</label>
                      <input 
                        type="text" 
                        name="royalty"
                        value={resourceInfo.royalty}
                        onChange={handleInputChange}
                        className="form-control block w-full px-3 py-2 text-base font-normal text-gray-700 
                                  bg-white bg-clip-padding border border-gray-300 rounded transition 
                                  ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="5%"
                      />
                    </div>

                    {/* <div className="form-group">
                      <label className="block text-gray-700 mb-2 text-lg" htmlFor="copies">副本数量</label>
                      <input 
                        type="number" 
                        name="copies"
                        value={resourceInfo.copies}
                        onChange={handleInputChange}
                        className="form-control block w-full px-3 py-2 text-base font-normal text-gray-700 
                                  bg-white bg-clip-padding border border-gray-300 rounded transition 
                                  ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="1"
                        min="1"
                      />
                    </div> */}

                    <div className="form-group">
                      <label className="block text-gray-700 mb-2 text-lg" htmlFor="size">大小</label>
                      <input 
                        type="text" 
                        name="size"
                        value={resourceInfo.size}
                        onChange={handleInputChange}
                        className="form-control block w-full px-3 py-2 text-base font-normal text-gray-700 
                                  bg-white bg-clip-padding border border-gray-300 rounded transition 
                                  ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="20MB"
                        readOnly={!!imageFile}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
                    <div className="md:col-span-5">
                      <div className="form-check">
                        <input 
                          className="form-check-input appearance-none h-4 w-4 border border-gray-300 rounded-sm 
                                    bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none 
                                    transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left 
                                    mr-2 cursor-pointer" 
                          type="checkbox" 
                          name="agreeTerms"
                          id="agreeTerms"
                          checked={resourceInfo.agreeTerms}
                          onChange={handleCheckboxChange}
                        />
                        <label className="form-check-label inline-block text-gray-800" htmlFor="agreeTerms">
                          我同意所有条款和条件
                        </label>
                      </div>
                    </div>
                    <div className="md:col-span-3 flex gap-2">
                      {!resourceInfo.uri ? (
                        <button 
                          type="button"
                          className={`flex-1 py-2.5 px-5 text-white bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                          disabled={loading}
                          onClick={handleUpload}
                        >
                          {loading ? "上传中..." : "上传"}
                        </button>
                      ) : (
                        <>
                          {!isConnected || isConnecting ? (
                            <div className="flex-1">
                              <RainbowKitCustomConnectButton />
                            </div>
                          ) : (
                            <button 
                              type="button" 
                              className="flex-1 py-2.5 px-5 text-white bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none"
                              onClick={handleMintDigitalResource}
                            >
                              铸造
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* 右侧预览区域 */}
          <div className="lg:col-span-4">
            <div className="nft-card card border rounded-xl shadow-sm overflow-hidden bg-white">
              <div className="p-4">
                <div className="img-wrap relative">
                  {imageFile ? (
                    <Image
                      src={URL.createObjectURL(imageFile)}
                      alt="NFT Preview"
                      width={500}
                      height={350}
                      className="w-full h-60 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-60 bg-gray-200 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">上传图片预览</p>
                    </div>
                  )}
                  {resourceInfo.nftType === "fixed" && (
                    <div className="badge bg-blue-500 absolute top-3 left-3 text-white text-xs px-2 py-1 rounded">
                      固定价格
                    </div>
                  )}
                  {resourceInfo.nftType === "unlock" && (
                    <div className="badge bg-purple-500 absolute top-3 left-3 text-white text-xs px-2 py-1 rounded">
                      解锁购买
                    </div>
                  )}
                  {resourceInfo.nftType === "open" && (
                    <div className="badge bg-amber-500 absolute top-3 left-3 text-white text-xs px-2 py-1 rounded">
                      开放竞价
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4 text-gray-500">
                  <span className="text-xs">
                    <i className="bi bi-bag me-1"></i>
                    {resourceInfo.copies || 1} 件可用
                  </span>
                  <button className="wishlist-btn" type="button">
                    <i className="bi bi-heart"></i>
                  </button>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <div className="relative mr-2">
                      {connectedAddress && (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 text-sm">用户</span>
                        </div>
                      )}
                      <i className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-1 text-xs bi bi-check"></i>
                    </div>
                    <div>
                      <div className="block font-bold text-sm hover:text-primary truncate">
                        {resourceInfo.name || "资源名称"}
                      </div>
                      <div className="block text-xs text-gray-500 hover:text-primary truncate">
                        {connectedAddress ? `@${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : "@用户地址"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-gray-500">
                    <span className="block text-xs">价格</span>
                    <h6 className="mb-0 font-bold">{resourceInfo.price || "0.00"} ETH</h6>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <button type="button" className="btn btn-primary btn-sm rounded-full px-4 py-2">
                    查看详情
                  </button>
                  <button type="button" className="btn btn-minimal btn-sm hover:text-primary">
                    <i className="bi bi-activity me-1"></i>活动
                  </button>
                </div>
              </div>
            </div>
            <h5 className="text-center mt-4 mb-0">
              <i className="bi bi-eye me-1"></i>实时预览
            </h5>

            {resourceInfo.uri && (
              <div className="mt-4 p-4 border rounded-xl bg-white">
                <h5 className="font-semibold">元数据链接</h5>
                <a href={resourceInfo.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all">
                  {resourceInfo.uri}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MintDigitalResourcePage;
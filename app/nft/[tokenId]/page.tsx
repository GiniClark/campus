"use client"; // 添加 "use client" 指令

import type { NextPage } from "next";
import { useParams } from "next/navigation"; // 使用 useParams 获取动态参数
import NFTDetail from "~~/components/NFTDetail";

const NFTDetailPage: NextPage = () => {
  const params = useParams(); // 获取动态路由参数
  const tokenId = params?.tokenId; // 从 params 中提取 tokenId

  if (!tokenId || typeof tokenId !== "string") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl text-red-500">无效的 Token ID</div>
      </div>
    );
  }

  return <NFTDetail tokenId={parseInt(tokenId)} />;
};

export default NFTDetailPage;
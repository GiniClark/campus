"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";

// 藏品数据
const collection_data = [
  {
    id: 1,
    name: "艺术",
    totalItems: 138,
    images: ["/images/1.png", "/images/2.png", "/images/3.png", "/images/4.png"]
  },
  {
    id: 2,
    name: "照片",
    totalItems: 169,
    images: ["/images/5.png", "/images/6.png", "/images/7.png", "/images/8.png"]
  },
  {
    id: 3,
    name: "收藏品",
    totalItems: 987,
    images: ["/images/9.png", "/images/10.png", "/images/11.png", "/images/12.png"]
  },
  {
    id: 4,
    name: "域名",
    totalItems: 99,
    images: ["/images/13.png", "/images/14.png", "/images/15.png", "/images/16.png"]
  },
  {
    id: 5,
    name: "音乐",
    totalItems: 164,
    images: ["/images/17.png", "/images/18.png", "/images/19.png", "/images/20.png"]
  },
  {
    id: 6,
    name: "视频",
    totalItems: 364,
    images: ["/images/21.png", "/images/22.png", "/images/23.png", "/images/24.png"]
  },
  {
    id: 7,
    name: "运动",
    totalItems: 780,
    images: ["/images/25.png", "/images/26.png", "/images/27.png", "/images/28.png"]
  },
  {
    id: 8,
    name: "表情包",
    totalItems: 221,
    images: ["/images/29.png", "/images/30.png", "/images/31.png", "/images/32.png"]
  },
  {
    id: 9,
    name: "虚拟世界",
    totalItems: 647,
    images: ["/images/1.png", "/images/2.png", "/images/3.png", "/images/4.png"]
  }
];

const CollectionsPage: NextPage = () => {
  const [count, setCount] = useState(6);
  const [noMorePost, setNoMorePost] = useState(false);
  const countSlice = collection_data.slice(0, count);

  const handleLoadMore = () => {
    setCount(count + 3);
    if (count >= collection_data.length) {
      setNoMorePost(true);
    }
  };

  return (
    <div className="collection-wrapper py-16">
      <div className="container mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">探索藏品</h2>
          <p className="text-gray-600">发现独特的数字艺术品和收藏品</p>
        </div>

        {/* 藏品网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {countSlice.map((item) => (
            <div key={item.id} className="collection-card bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="p-4">
                {/* 图片网格 */}
                <div className="grid grid-cols-2 gap-2">
                  {item.images.map((image, index) => (
                    <div key={index} className={index === 0 ? "col-span-2" : ""}>
                      <Image
                        src={image}
                        width={500}
                        height={index === 0 ? 300 : 150}
                        alt={item.name}
                        className="w-full rounded-lg object-cover"
                        style={{ height: index === 0 ? "200px" : "100px" }}
                      />
                    </div>
                  ))}
                </div>

                {/* 藏品信息 */}
                <div className="flex justify-between items-center mt-4">
                  <div>
                    <h5 className="text-xl font-bold mb-1">
                      {item.name}
                      <span className="ml-2 text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        {item.totalItems}
                      </span>
                    </h5>
                  </div>
                  <Link
                    href="/allNFTs"
                    className="text-blue-500 hover:text-blue-600 flex items-center text-sm"
                  >
                    查看全部
                    <i className="bi bi-arrow-right ml-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 加载更多按钮 */}
        <div className="text-center mt-12">
          {noMorePost ? (
            <button
              className="btn bg-gray-200 text-gray-600 rounded-full px-8 py-3 font-semibold cursor-not-allowed"
              disabled
            >
              没有更多藏品了
              <i className="bi bi-arrow-repeat ml-2"></i>
            </button>
          ) : (
            <button
              onClick={handleLoadMore}
              className="btn bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-3 font-semibold"
            >
              加载更多藏品
              <i className="bi bi-arrow-repeat ml-2"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionsPage; 
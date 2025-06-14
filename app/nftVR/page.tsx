"use client";

import { useEffect, useState, useRef } from "react";
import type { NextPage } from "next";

const NFTVRPage: NextPage = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 处理全屏切换
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // 如果iframe元素存在，则将其设置为全屏
        if (iframeRef.current) {
          if (iframeRef.current.requestFullscreen) {
            await iframeRef.current.requestFullscreen();
          } else if ((iframeRef.current as any).webkitRequestFullscreen) {
            await (iframeRef.current as any).webkitRequestFullscreen();
          } else if ((iframeRef.current as any).msRequestFullscreen) {
            await (iframeRef.current as any).msRequestFullscreen();
          }
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('全屏切换失败:', error);
    }
  };

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black">
      {/* VR展厅iframe */}
      <iframe
        ref={iframeRef}
        className="w-full h-full"
        frameBorder="0"
        name="waseePanorama"
        scrolling="no"
        src="https://d1ccuffw4.wasee.com/m/d1ccuffw4"
        allow="fullscreen"
        allowFullScreen
        style={{ 
          height: isFullscreen ? '100vh' : 'calc(100vh - 40px)',
          marginBottom: isFullscreen ? '0' : '40px'
        }}
      />

      {/* 全屏切换按钮 */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 z-50 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md backdrop-blur-sm transition-all duration-200"
      >
        {isFullscreen ? "退出全屏" : "进入全屏"}
      </button>

      {/* 返回按钮 */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 z-50 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md backdrop-blur-sm transition-all duration-200"
      >
        返回
      </button>
    </div>
  );
};

export default NFTVRPage;

"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  BugAntIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

// 主菜单数据结构定义
interface MenuItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  hasDropdown?: boolean;
  subMenus?: MenuItem[];
}

// 主菜单数据
export const menuData: MenuItem[] = [
  // {
  //   label: "主页",
  //   href: "/",
  //   icon: <ArrowPathIcon className="h-4 w-4" />,
  // },
  {
    label: "创作中心",
    href: "#",
    icon: <ArrowUpTrayIcon className="h-4 w-4" />,
    hasDropdown: true,
    subMenus: [
      {
        label: "铸造数字资源NFT",
        href: "/mintDigitalResource",
        icon: <ArrowUpTrayIcon className="h-4 w-4" />,
      },
      {
        label: "批量铸造NFT",
        href: "/mintMultipleDigitalResource",
        icon: <ArrowUpTrayIcon className="h-4 w-4" />,
      },
      {
        label: "铸造盲盒",
        href: "/mintMysteryBox",
        icon: <ArrowUpTrayIcon className="h-4 w-4" />,
      },
    ]
  },
  {
    label: "市场",
    href: "/allNFTs",
    icon: <Bars3Icon className="h-4 w-4" />,
  },
  {
    label: "特色功能",
    href: "#",
    icon: <BugAntIcon className="h-4 w-4" />,
    hasDropdown: true,
    subMenus: [
      {
        label: "3DNFT展厅",
        href: "/nftVR",
        icon: <BugAntIcon className="h-4 w-4" />,
      },
      {
        label: "限时拍卖",
        href: "/auction",
        icon: <BugAntIcon className="h-4 w-4" />,
      },
      {
        label: "NFT盲盒",
        href: "/openMysteryBox",
        icon: <BugAntIcon className="h-4 w-4" />,
      },
      {
        label: "交易历史记录",
        href: "/transfers",
        icon: <BugAntIcon className="h-4 w-4" />,
      },
    ]
  },
  {
    label: "智能客服",
    href: "/help-center",
    icon: <MagnifyingGlassIcon className="h-4 w-4" />,
  },
  {
    label: "我的资产",
    href: "#",
    icon: <PhotoIcon className="h-4 w-4" />,
    hasDropdown: true,
    subMenus: [
      {
        label: "我的NFT",
        href: "/myNFT",
        icon: <PhotoIcon className="h-4 w-4" />,
      },
    ]
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // 替换为鼠标悬停处理逻辑
  const handleMouseEnter = (label: string) => {
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  return (
    <>
      {menuData.map((item) => {
        const isActive = pathname === item.href || 
          (item.subMenus?.some(subItem => pathname === subItem.href));
        
        return (
          <li key={item.label} className="mx-1 relative">
            {item.hasDropdown ? (
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter(item.label)}
              >
                <button
                  className={`${
                    isActive 
                      ? "bg-opacity-20 bg-accent text-accent-content" 
                      : "hover:bg-opacity-10 hover:bg-accent text-base-content"
                  } py-2 px-3 text-sm rounded-lg flex items-center gap-2 transition-colors duration-200`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === item.label && (
                  <div 
                    className="absolute z-50 left-0 top-full"
                    onMouseLeave={handleMouseLeave}
                  >
                    <ul className="mt-1 w-56 rounded-md shadow-lg bg-base-200 ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {item.subMenus?.map((subMenu) => (
                        <li key={subMenu.href} className="mx-0">
                          <Link
                            href={subMenu.href}
                            passHref
                            prefetch={true}
                            onClick={(e) => {
                              // 对于资源市场页面，特殊处理
                              if (pathname === '/allNFTs' && subMenu.href !== '/allNFTs') {
                                e.preventDefault();
                                console.log("从资源市场导航到:", subMenu.href);
                                window.location.href = subMenu.href;
                              }
                            }}
                            className={`${
                              pathname === subMenu.href
                                ? "bg-opacity-20 bg-accent text-accent-content" 
                                : "hover:bg-opacity-10 hover:bg-accent text-base-content"
                            } block py-2 px-4 text-sm rounded-none flex items-center gap-2 transition-colors duration-200 hover:bg-opacity-20 hover:bg-accent`}
                          >
                            {subMenu.icon}
                            <span>{subMenu.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                passHref
                prefetch={true}
                onClick={(e) => {
                  // 对于资源市场页面，特殊处理
                  if (pathname === '/allNFTs' && item.href !== '/allNFTs') {
                    e.preventDefault();
                    console.log("从资源市场导航到:", item.href);
                    window.location.href = item.href;
                  }
                }}
                className={`${
                  isActive 
                    ? "bg-opacity-20 bg-accent text-accent-content" 
                    : "hover:bg-opacity-10 hover:bg-accent text-base-content"
                } py-2 px-3 text-sm rounded-lg flex items-center gap-2 transition-colors duration-200`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )}
          </li>
        );
      })}
    </>
  );
};

// 移动端菜单
export const MobileMenuLinks = () => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
    );
  };

  return (
    <ul className="menu p-2 shadow-lg bg-base-200 rounded-box w-64 z-[1]">
      {menuData.map((item) => {
        const isActive = pathname === item.href || 
          (item.subMenus?.some(subItem => pathname === subItem.href));
        const isExpanded = expandedItems.includes(item.label);

        return (
          <li key={item.label}>
            {item.hasDropdown ? (
              <>
                <div
                  className={`${
                    isActive ? "bg-opacity-20 bg-accent text-accent-content" : ""
                  } flex items-center justify-between w-full py-2 px-3 text-sm rounded-lg cursor-pointer`}
                  onClick={() => toggleExpand(item.label)}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
                {isExpanded && (
                  <ul className="pl-4 mt-1">
                    {item.subMenus?.map((subMenu) => (
                      <li key={subMenu.href}>
                        <Link
                          href={subMenu.href}
                          passHref
                          prefetch={true}
                          onClick={(e) => {
                            // 对于资源市场页面，特殊处理
                            if (pathname === '/allNFTs' && subMenu.href !== '/allNFTs') {
                              e.preventDefault();
                              console.log("从资源市场导航到:", subMenu.href);
                              window.location.href = subMenu.href;
                            }
                          }}
                          className={`${
                            pathname === subMenu.href
                              ? "bg-opacity-20 bg-accent text-accent-content" 
                              : "hover:bg-opacity-10 hover:bg-accent text-base-content"
                          } block py-2 px-3 text-sm rounded-lg flex items-center gap-2 transition-colors duration-200`}
                        >
                          {subMenu.icon}
                          <span>{subMenu.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                passHref
                prefetch={true}
                onClick={(e) => {
                  // 对于资源市场页面，特殊处理
                  if (pathname === '/allNFTs' && item.href !== '/allNFTs') {
                    e.preventDefault();
                    console.log("从资源市场导航到:", item.href);
                    window.location.href = item.href;
                  }
                }}
                className={`${
                  isActive 
                    ? "bg-opacity-20 bg-accent text-accent-content" 
                    : "hover:bg-opacity-10 hover:bg-accent text-base-content"
                } py-2 px-3 text-sm rounded-lg flex items-center gap-2 transition-colors duration-200`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("搜索:", searchQuery);
    // 实现搜索逻辑
  };

  return (
    <div className="sticky top-0 z-20 w-full border-b border-base-300 bg-base-100">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between px-2 sm:px-4">
        <div className="flex items-center">
          <div className="xl:hidden dropdown" ref={burgerMenuRef}>
            <label
              tabIndex={0}
              className={`btn btn-ghost btn-sm rounded-btn p-2 ${isDrawerOpen ? "hover:bg-opacity-20" : "hover:bg-opacity-10"}`}
              onClick={() => {
                setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
              }}
            >
              <Bars3Icon className="h-5 w-5" />
            </label>
            {isDrawerOpen && (
              <div className="absolute top-full left-0 mt-2">
                <MobileMenuLinks />
              </div>
            )}
          </div>
          <Link href="/" passHref className="flex items-center gap-1 -ml-1 mr-4">
            <div className="flex relative w-8 h-8">
              <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.svg" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold leading-tight text-base-content">知享</span>
              <span className="text-xs text-base-content/70">您的版权交给区块链来保护！</span>
            </div>
          </Link>
          
          {/* 搜索栏 */}
          <form onSubmit={handleSearch} className="hidden sm:flex">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="搜索NFT、收藏品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-base-200 border-0 rounded-lg py-2 pl-10 pr-4 text-sm text-base-content placeholder:text-base-content/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-base-content/70" />
            </div>
          </form>
          
          <ul className="hidden xl:flex menu menu-horizontal px-1 gap-1 ml-6">
            <HeaderMenuLinks />
          </ul>
        </div>
        
        <div className="flex items-center gap-3 pr-1">
          {/* 主题切换 */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'opensea' : 'dark')}
            className="btn btn-ghost btn-sm px-2 rounded-btn"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              {theme === 'dark' ? (
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
              ) : theme === 'opensea' ? (
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              ) : (
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              )}
            </svg>
          </button>
          <RainbowKitCustomConnectButton />
          <FaucetButton />
        </div>
      </div>
    </div>
  );
};

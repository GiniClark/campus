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
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
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
    ],
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
    ],
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
    ],
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleMouseEnter = (label: string) => {
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  return (
    <>
      {menuData.map(item => {
        const isActive = pathname === item.href || item.subMenus?.some(subItem => pathname === subItem.href);

        return (
          <li key={item.label} className="relative">
            {item.hasDropdown ? (
              <div className="relative" onMouseEnter={() => handleMouseEnter(item.label)}>
                <button
                  className={`${
                    isActive
                      ? "text-accent bg-accent/10 border-b-2 border-accent"
                      : "text-base-content hover:text-accent hover:bg-accent/5"
                  } py-3 px-5 text-sm font-medium rounded-none flex items-center gap-2 transition-all duration-200 border-b-2 border-transparent hover:border-accent/30 whitespace-nowrap`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <ChevronDownIcon
                    className={`h-3 w-3 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === item.label && (
                  <div className="absolute z-[60] left-0 top-full" onMouseLeave={handleMouseLeave}>
                    <ul className="mt-1 w-56 rounded-lg shadow-lg bg-base-100 border border-base-300 ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {item.subMenus?.map(subMenu => (
                        <li key={subMenu.href} className="mx-0">
                          <Link
                            href={subMenu.href}
                            passHref
                            prefetch={true}
                            onClick={e => {
                              if (pathname === "/allNFTs" && subMenu.href !== "/allNFTs") {
                                e.preventDefault();
                                console.log("从资源市场导航到:", subMenu.href);
                                window.location.href = subMenu.href;
                              }
                            }}
                            className={`${
                              pathname === subMenu.href
                                ? "bg-accent/10 text-accent-content"
                                : "hover:bg-accent/5 text-base-content"
                            } block py-3 px-4 text-sm rounded-none flex items-center gap-2 transition-colors duration-200 hover:text-accent`}
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
                onClick={e => {
                  if (pathname === "/allNFTs" && item.href !== "/allNFTs") {
                    e.preventDefault();
                    console.log("从资源市场导航到:", item.href);
                    window.location.href = item.href;
                  }
                }}
                className={`${
                  isActive
                    ? "text-accent bg-accent/10 border-b-2 border-accent"
                    : "text-base-content hover:text-accent hover:bg-accent/5"
                } py-3 px-5 text-sm font-medium rounded-none flex items-center gap-2 transition-all duration-200 border-b-2 border-transparent hover:border-accent/30 whitespace-nowrap`}
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
    setExpandedItems(prev => (prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]));
  };

  return (
    <ul className="menu p-2 shadow-lg bg-base-100 rounded-box w-64 z-[60] border border-base-300">
      {menuData.map(item => {
        const isActive = pathname === item.href || item.subMenus?.some(subItem => pathname === subItem.href);
        const isExpanded = expandedItems.includes(item.label);

        return (
          <li key={item.label}>
            {item.hasDropdown ? (
              <>
                <div
                  className={`${
                    isActive ? "bg-accent/10 text-accent-content" : "hover:bg-accent/5"
                  } flex items-center justify-between w-full py-2 px-3 text-sm rounded-lg cursor-pointer`}
                  onClick={() => toggleExpand(item.label)}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
                {isExpanded && (
                  <ul className="pl-4 mt-1">
                    {item.subMenus?.map(subMenu => (
                      <li key={subMenu.href}>
                        <Link
                          href={subMenu.href}
                          passHref
                          prefetch={true}
                          onClick={e => {
                            if (pathname === "/allNFTs" && subMenu.href !== "/allNFTs") {
                              e.preventDefault();
                              console.log("从资源市场导航到:", subMenu.href);
                              window.location.href = subMenu.href;
                            }
                          }}
                          className={`${
                            pathname === subMenu.href
                              ? "bg-accent/10 text-accent-content"
                              : "hover:bg-accent/5 text-base-content"
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
                onClick={e => {
                  if (pathname === "/allNFTs" && item.href !== "/allNFTs") {
                    e.preventDefault();
                    console.log("从资源市场导航到:", item.href);
                    window.location.href = item.href;
                  }
                }}
                className={`${
                  isActive ? "bg-accent/10 text-accent-content" : "hover:bg-accent/5 text-base-content"
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
    <div className="sticky top-0 z-30 w-full border-b border-base-300 bg-base-100/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* 左侧：Logo + 导航 */}
        <div className="flex items-center flex-1">
          {/* 移动端菜单按钮 */}
          <div className="xl:hidden dropdown mr-2" ref={burgerMenuRef}>
            <label
              tabIndex={0}
              className={`btn btn-ghost btn-sm rounded-btn p-2 ${
                isDrawerOpen ? "hover:bg-accent/10" : "hover:bg-accent/5"
              }`}
              onClick={() => {
                setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
              }}
            >
              <Bars3Icon className="h-5 w-5" />
            </label>
            {isDrawerOpen && (
              <div className="absolute top-full left-0 mt-2 z-[60]">
                <MobileMenuLinks />
              </div>
            )}
          </div>

          {/* Logo */}
          <Link href="/" passHref className="flex items-center gap-3 mr-8 flex-shrink-0">
            <div className="flex relative w-8 h-8">
              <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.svg" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold leading-tight text-base-content text-xl tracking-wide">知享</span>
              <span className="text-xs text-base-content/60 hidden sm:block leading-tight">
                您的版权交给区块链来保护！
              </span>
            </div>
          </Link>

          {/* 桌面端导航菜单 */}
          <nav className="hidden xl:flex">
            <ul className="flex items-center">
              <HeaderMenuLinks />
            </ul>
          </nav>
        </div>

        {/* 右侧：功能按钮 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 钱包连接和水龙头按钮 */}
          <div className="flex items-center gap-2">
            <RainbowKitCustomConnectButton />
            <FaucetButton />
          </div>
        </div>
      </div>
    </div>
  );
};

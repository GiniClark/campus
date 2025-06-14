import Link from "next/link";
import Image from "next/image";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="flex flex-col flex-grow">
      {/* 英雄区域 */}
      <div className="welcome-area pt-16 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* 左侧文本内容 */}
            <div className="text-center lg:text-left">
              <h2 
                className="text-4xl md:text-5xl font-bold mb-4 animate__animated animate__fadeInUp"
                data-aos="fade-up"
                data-aos-duration="750"
                data-aos-delay="300"
              >
                探索、购买和出售优质NFTs。
              </h2>
              <p 
                className="text-lg text-gray-600 mb-8"
                data-aos="fade-up"
                data-aos-duration="750"
                data-aos-delay="500"
              >
                采用最新的设计趋势打造，并使用现代方法进行编码。
              </p>
              <div 
                className="flex flex-wrap gap-4 justify-center lg:justify-start"
                data-aos="fade-up"
                data-aos-duration="750"
                data-aos-delay="800"
              >
                <Link 
                  href="/allNFTs" 
                  className="btn btn-primary rounded-full px-8 py-3"
                >
                  立即探索
                </Link>
                <Link 
                  href="/collections" 
                  className="btn btn-outline-primary rounded-full px-8 py-3 flex items-center"
                >
                  <i className="bi bi-grid-3x3-gap mr-2"></i>
                  所有藏品
                </Link>
              </div>
            </div>

            {/* 右侧图片区域 */}
            <div className="relative" data-aos="fade-left" data-aos-duration="750" data-aos-delay="500">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Image
                    src="/1.avif"
                    width={400}
                    height={400}
                    alt="NFT展示"
                    className="w-full rounded-2xl shadow-lg"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-award text-xl"></i>
                      <div>
                        <p className="text-xs mb-0">认证NFT</p>
                        <h6 className="text-sm font-bold mb-0">所有权证书</h6>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative mt-12">
              <Image
                    src="/11.avif"
                    width={400}
                    height={400}
                    alt="NFT展示"
                    className="w-full rounded-2xl shadow-lg"
                  />
                  <div className="absolute -top-4 -left-4 bg-purple-500 text-white p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-stars text-xl"></i>
                      <div>
                        <p className="text-xs mb-0">稀有NFT</p>
                        <h6 className="text-sm font-bold mb-0">限量发行</h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="divider h-0.5 bg-gray-100 w-full my-8"></div>

      {/* 实时拍卖区域 */}
      <div className="live-bidding-wrapper bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-row items-center mb-8">
            <div className="w-3/4">
              <div className="section-heading flex items-center">
                <div className="spinner-grow text-red-500 h-4 w-4 rounded-full animate-pulse"></div>
                <h2 className="text-3xl font-bold ml-2 mb-0">实时拍卖</h2>
              </div>
            </div>
            <div className="w-1/4 text-right">
              <Link className="btn btn-outline-primary btn-sm border-2 rounded-full px-4 py-2" href="/auction">
                查看所有拍卖
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* 拍卖项目1 */}
            <div className="nft-card card border-0 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="card-body p-4">
                <div className="relative">
                  <Image
                    src="/images/3.png"
                    width={500}
                    height={500}
                    alt="NFT"
                    className="w-full h-60 object-cover rounded-lg"
                  />
                  <div className="badge bg-danger absolute top-3 left-3 flex items-center px-2 py-1 rounded text-white text-xs">
                    热门
                  </div>
                  <div className="countdown-timer absolute bottom-3 left-0 right-0 text-center bg-white bg-opacity-80 py-1 rounded mx-3">
                    <span className="text-sm font-semibold">05:23:14:32</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 text-gray-500">
                  <span className="text-xs">
                    <i className="bi bi-bag me-1"></i>3 件可用
                  </span>
                  <button className="wishlist-btn" type="button">
                    <i className="bi bi-heart"></i>
                  </button>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <div className="relative mr-2">
                      <Image
                        src="/images/11.png"
                        width={40}
                        height={40}
                        alt="author"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <i className="absolute bottom-0 right-0 bg-success text-white rounded-full p-1 text-xs bi bi-check"></i>
                    </div>
                    <div>
                      <Link href="/allNFTs" className="block font-bold text-sm hover:text-primary truncate">暴力兔 #114</Link>
                      <Link href="/allNFTs" className="block text-xs text-gray-500 hover:text-primary truncate">@艺术家001</Link>
                    </div>
                  </div>
                  <div className="text-right text-gray-500">
                    <span className="block text-xs">当前出价</span>
                    <h6 className="mb-0 font-bold">1.25 ETH</h6>
                  </div>
                </div>

                <Link href="/auction" className="btn btn-primary rounded-full btn-sm mt-4 w-full">
                  参与竞拍
                </Link>
              </div>
            </div>

            {/* 拍卖项目2 */}
            <div className="nft-card card border-0 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="card-body p-4">
                <div className="relative">
                  <Image
                    src="/images/1.png"
                    width={500}
                    height={500}
                    alt="NFT"
                    className="w-full h-60 object-cover rounded-lg"
                  />
                  <div className="badge bg-primary absolute top-3 left-3 flex items-center px-2 py-1 rounded text-white text-xs">
                    新品
                  </div>
                  <div className="countdown-timer absolute bottom-3 left-0 right-0 text-center bg-white bg-opacity-80 py-1 rounded mx-3">
                    <span className="text-sm font-semibold">02:11:55:43</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 text-gray-500">
                  <span className="text-xs">
                    <i className="bi bi-bag me-1"></i>1 件可用
                  </span>
                  <button className="wishlist-btn" type="button">
                    <i className="bi bi-heart"></i>
                  </button>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <div className="relative mr-2">
                      <Image
                        src="/images/9.png"
                        width={40}
                        height={40}
                        alt="author"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <i className="absolute bottom-0 right-0 bg-success text-white rounded-full p-1 text-xs bi bi-check"></i>
                    </div>
                    <div>
                      <Link href="/allNFTs" className="block font-bold text-sm hover:text-primary truncate">暴力娘 #23</Link>
                      <Link href="/allNFTs" className="block text-xs text-gray-500 hover:text-primary truncate">@艺术家002</Link>
                    </div>
                  </div>
                  <div className="text-right text-gray-500">
                    <span className="block text-xs">当前出价</span>
                    <h6 className="mb-0 font-bold">0.75 ETH</h6>
                  </div>
                </div>

                <Link href="/auction" className="btn btn-primary rounded-full btn-sm mt-4 w-full">
                  参与竞拍
                </Link>
              </div>
            </div>

            {/* 拍卖项目3 */}
            <div className="nft-card card border-0 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="card-body p-4">
                <div className="relative">
                  <Image
                    src="/images/9.png"
                    width={500}
                    height={500}
                    alt="NFT"
                    className="w-full h-60 object-cover rounded-lg"
                  />
                  <div className="badge bg-warning absolute top-3 left-3 flex items-center px-2 py-1 rounded text-white text-xs">
                    即将结束
                  </div>
                  <div className="countdown-timer absolute bottom-3 left-0 right-0 text-center bg-white bg-opacity-80 py-1 rounded mx-3">
                    <span className="text-sm font-semibold">00:04:23:11</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 text-gray-500">
                  <span className="text-xs">
                    <i className="bi bi-bag me-1"></i>5 件可用
                  </span>
                  <button className="wishlist-btn" type="button">
                    <i className="bi bi-heart"></i>
                  </button>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <div className="relative mr-2">
                      <Image
                        src="/images/24.png"
                        width={40}
                        height={40}
                        alt="author"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <i className="absolute bottom-0 right-0 bg-success text-white rounded-full p-1 text-xs bi bi-check"></i>
                    </div>
                    <div>
                      <Link href="/allNFTs" className="block font-bold text-sm hover:text-primary truncate">暴力狼 #87</Link>
                      <Link href="/allNFTs" className="block text-xs text-gray-500 hover:text-primary truncate">@艺术家003</Link>
                    </div>
                  </div>
                  <div className="text-right text-gray-500">
                    <span className="block text-xs">当前出价</span>
                    <h6 className="mb-0 font-bold">2.3 ETH</h6>
                  </div>
                </div>

                <Link href="/auction" className="btn btn-primary rounded-full btn-sm mt-4 w-full">
                  参与竞拍
                </Link>
              </div>
            </div>

            {/* 拍卖项目4 */}
            <div className="nft-card card border-0 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="card-body p-4">
                <div className="relative">
                  <Image
                    src="/images/27.png"
                    width={500}
                    height={500}
                    alt="NFT"
                    className="w-full h-60 object-cover rounded-lg"
                  />
                  <div className="badge bg-info absolute top-3 left-3 flex items-center px-2 py-1 rounded text-white text-xs">
                    特色
                  </div>
                  <div className="countdown-timer absolute bottom-3 left-0 right-0 text-center bg-white bg-opacity-80 py-1 rounded mx-3">
                    <span className="text-sm font-semibold">03:12:45:22</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 text-gray-500">
                  <span className="text-xs">
                    <i className="bi bi-bag me-1"></i>2 件可用
                  </span>
                  <button className="wishlist-btn" type="button">
                    <i className="bi bi-heart"></i>
                  </button>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <div className="relative mr-2">
              <Image
                        src="/images/3.png"
                        width={40}
                        height={40}
                        alt="author"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <i className="absolute bottom-0 right-0 bg-success text-white rounded-full p-1 text-xs bi bi-check"></i>
                    </div>
                    <div>
                      <Link href="/allNFTs" className="block font-bold text-sm hover:text-primary truncate">暴力武士 #42</Link>
                      <Link href="/allNFTs" className="block text-xs text-gray-500 hover:text-primary truncate">@艺术家004</Link>
                    </div>
                  </div>
                  <div className="text-right text-gray-500">
                    <span className="block text-xs">当前出价</span>
                    <h6 className="mb-0 font-bold">1.8 ETH</h6>
                  </div>
                </div>

                <Link href="/auction" className="btn btn-primary rounded-full btn-sm mt-4 w-full">
                  参与竞拍
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="divider h-0.5 bg-gray-100 w-full my-8"></div>

      {/* NFT盲盒区域 */}
      <div className="nft-box-wrapper py-16">
        <div className="container mx-auto px-4">
          <div className="section-heading mb-10">
            <h2 className="text-3xl font-bold mb-0">NFT盲盒</h2>
            <p className="text-gray-500 mt-2">获得稀有数字藏品的机会</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2">
              <Image
                src="/images/10.png" 
                width={600} 
                height={400} 
                alt="NFT盲盒" 
                className="rounded-2xl shadow-lg w-full h-auto object-cover"
              />
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold mb-4">探索神秘的NFT盲盒</h3>
              <p className="text-gray-600 mb-6">
                NFT盲盒是一种令人兴奋的收藏方式，让您有机会获得稀有和限量版的数字藏品。每个盲盒都包含一个随机的NFT，可能是普通、稀有、史诗或传奇级别的艺术品。
              </p>
              <ul className="list-disc pl-5 mb-6 text-gray-600">
                <li className="mb-2">包含各种稀缺度的随机NFT</li>
                <li className="mb-2">限量发售，独特稀有</li>
                <li className="mb-2">有机会获得价值连城的传奇NFT</li>
                <li className="mb-2">使用智能合约保证随机性和公平性</li>
              </ul>
              <Link 
                href="/nftbox" 
                className="btn btn-primary rounded-full px-8 py-3 inline-flex items-center"
              >
                <i className="bi bi-box-seam mr-2"></i>
                探索盲盒
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="divider h-0.5 bg-gray-100 w-full my-8"></div>

      {/* 3D NFT展厅区域 */}
      <div className="nft-vr-wrapper bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="section-heading mb-10">
            <h2 className="text-3xl font-bold mb-0">3D NFT展厅</h2>
            <p className="text-gray-500 mt-2">身临其境的艺术体验</p>
          </div>
          
          <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
            <div className="md:w-1/2">
              <div className="relative">
                <Image 
                  src="/images/33.png" 
                  width={600} 
                  height={400} 
                  alt="3D NFT展厅" 
                  className="rounded-2xl shadow-lg w-full h-auto object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white bg-opacity-80 rounded-full p-4 cursor-pointer hover:bg-opacity-90 transition-all">
                    <i className="bi bi-play-fill text-primary text-4xl"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold mb-4">沉浸式虚拟现实艺术展</h3>
              <p className="text-gray-600 mb-6">
                我们的3D NFT展厅为艺术爱好者提供了一个身临其境的虚拟现实体验。在这个精心设计的虚拟环境中，您可以探索数字艺术品，欣赏精美细节，并与其他收藏家互动。
              </p>
              <ul className="list-disc pl-5 mb-6 text-gray-600">
                <li className="mb-2">高清3D展示NFT艺术品</li>
                <li className="mb-2">沉浸式VR体验</li>
                <li className="mb-2">自由探索展厅空间</li>
                <li className="mb-2">支持多人互动和社交功能</li>
              </ul>
              <Link 
                href="/nftVR" 
                className="btn btn-primary rounded-full px-8 py-3 inline-flex items-center"
              >
                <i className="bi bi-badge-3d mr-2"></i>
                进入3D展厅
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="divider h-0.5 bg-gray-100 w-full my-8"></div>

      {/* 发现NFT区域 */}
      <div className="discover-nft-wrapper bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="section-heading mb-10">
            <h2 className="text-3xl font-bold mb-0">发现数字资源</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* NFT项目1 */}
            <div className="nft-card card border-0 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="card-body p-4">
                <div className="relative">
                  <Image
                    src="/images/11.png"
                    width={500}
                    height={500}
                    alt="NFT"
                    className="w-full h-60 object-cover rounded-lg"
                  />
                </div>

                <div className="flex justify-between items-center mt-4 text-gray-500">
                  <span className="text-xs">
                    <i className="bi bi-arrow-up"></i>最近添加
                  </span>
                  <button className="wishlist-btn active" type="button">
                    <i className="bi bi-heart-fill text-red-500"></i>
                  </button>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <div className="relative mr-2">
                      <Image
                        src="/images/1.png"
                        width={40}
                        height={40}
                        alt="author"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <i className="absolute bottom-0 right-0 bg-success text-white rounded-full p-1 text-xs bi bi-check"></i>
                    </div>
                    <div>
                      <Link href="/allNFTs" className="block font-bold text-sm hover:text-primary truncate">暴力狂 #76</Link>
                      <Link href="/allNFTs" className="block text-xs text-gray-500 hover:text-primary truncate">@艺术家005</Link>
                    </div>
                  </div>
                  <div className="text-right text-gray-500">
                    <span className="block text-xs">当前出价</span>
                    <h6 className="mb-0 font-bold">1.5 ETH</h6>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <Link href="/allNFTs" className="btn btn-primary rounded-full btn-sm px-4">
                    出价
                  </Link>
                  <Link href="/allNFTs" className="btn btn-minimal btn-sm hover:text-primary">
                    <i className="bi bi-activity me-1"></i>活动
                  </Link>
                </div>
              </div>
            </div>

            {/* NFT项目2 */}
            <div className="nft-card card border-0 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="card-body p-4">
                <div className="relative">
                  <Image
                    src="/images/24.png"
                    width={500}
                    height={500}
                    alt="NFT"
                    className="w-full h-60 object-cover rounded-lg"
                  />
                </div>

                <div className="flex justify-between items-center mt-4 text-gray-500">
                  <span className="text-xs">
                    <i className="bi bi-arrow-up"></i>热门收藏
                  </span>
                  <button className="wishlist-btn" type="button">
                    <i className="bi bi-heart"></i>
                  </button>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <div className="relative mr-2">
                      <Image
                        src="/images/3.png"
                        width={40}
                        height={40}
                        alt="author"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <i className="absolute bottom-0 right-0 bg-success text-white rounded-full p-1 text-xs bi bi-check"></i>
                    </div>
                    <div>
                      <Link href="/allNFTs" className="block font-bold text-sm hover:text-primary truncate">暴力环 #32</Link>
                      <Link href="/allNFTs" className="block text-xs text-gray-500 hover:text-primary truncate">@艺术家006</Link>
                    </div>
                  </div>
                  <div className="text-right text-gray-500">
                    <span className="block text-xs">当前出价</span>
                    <h6 className="mb-0 font-bold">0.9 ETH</h6>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <Link href="/allNFTs" className="btn btn-primary rounded-full btn-sm px-4">
                    出价
                  </Link>
                  <Link href="/allNFTs" className="btn btn-minimal btn-sm hover:text-primary">
                    <i className="bi bi-activity me-1"></i>活动
                  </Link>
                </div>
              </div>
            </div>

            {/* NFT项目3 */}
            <div className="nft-card card border-0 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="card-body p-4">
                <div className="relative">
                  <Image
                    src="/images/9.png"
                    width={500}
                    height={500}
                    alt="NFT"
                    className="w-full h-60 object-cover rounded-lg"
                  />
                </div>

                <div className="flex justify-between items-center mt-4 text-gray-500">
                  <span className="text-xs">
                    <i className="bi bi-arrow-up"></i>最畅销
                  </span>
                  <button className="wishlist-btn active" type="button">
                    <i className="bi bi-heart-fill text-red-500"></i>
                  </button>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <div className="relative mr-2">
              <Image
                        src="/images/27.png"
                        width={40}
                        height={40}
                        alt="author"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <i className="absolute bottom-0 right-0 bg-success text-white rounded-full p-1 text-xs bi bi-check"></i>
                    </div>
                    <div>
                      <Link href="/allNFTs" className="block font-bold text-sm hover:text-primary truncate">暴力兔 #91</Link>
                      <Link href="/allNFTs" className="block text-xs text-gray-500 hover:text-primary truncate">@艺术家007</Link>
                    </div>
                  </div>
                  <div className="text-right text-gray-500">
                    <span className="block text-xs">当前出价</span>
                    <h6 className="mb-0 font-bold">2.1 ETH</h6>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <Link href="/allNFTs" className="btn btn-primary rounded-full btn-sm px-4">
                    出价
                  </Link>
                  <Link href="/allNFTs" className="btn btn-minimal btn-sm hover:text-primary">
                    <i className="bi bi-activity me-1"></i>活动
                  </Link>
                </div>
              </div>
            </div>

            {/* NFT项目4 */}
            <div className="nft-card card border-0 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="card-body p-4">
                <div className="relative">
                  <Image
                    src="/images/1.png"
                    width={500}
                    height={500}
                    alt="NFT"
                    className="w-full h-60 object-cover rounded-lg"
                  />
                </div>

                <div className="flex justify-between items-center mt-4 text-gray-500">
                  <span className="text-xs">
                    <i className="bi bi-arrow-up"></i>即将售罄
                  </span>
                  <button className="wishlist-btn" type="button">
                    <i className="bi bi-heart"></i>
                  </button>
          </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <div className="relative mr-2">
              <Image
                        src="/images/11.png"
                        width={40}
                        height={40}
                        alt="author"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <i className="absolute bottom-0 right-0 bg-success text-white rounded-full p-1 text-xs bi bi-check"></i>
                    </div>
                    <div>
                      <Link href="/allNFTs" className="block font-bold text-sm hover:text-primary truncate">暴力娘 #18</Link>
                      <Link href="/allNFTs" className="block text-xs text-gray-500 hover:text-primary truncate">@艺术家008</Link>
                    </div>
                  </div>
                  <div className="text-right text-gray-500">
                    <span className="block text-xs">当前出价</span>
                    <h6 className="mb-0 font-bold">1.7 ETH</h6>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <Link href="/allNFTs" className="btn btn-primary rounded-full btn-sm px-4">
                    出价
                  </Link>
                  <Link href="/allNFTs" className="btn btn-minimal btn-sm hover:text-primary">
                    <i className="bi bi-activity me-1"></i>活动
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 查看更多按钮 */}
          <div className="text-center mt-16">
            <Link href="/allNFTs" className="btn btn-outline-primary rounded-full px-10 py-3">
              查看更多数字资源
            </Link>
          </div>
        </div>
      </div>

      {/* NFT创建流程指南 */}
      <div className="how-it-works-wrapper py-16">
        <div className="container mx-auto px-4">
          <div className="section-heading text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">如何创建和交易NFT</h2>
            <p className="text-gray-500">简单四步，开启您的NFT之旅</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* 步骤1 */}
            <div className="step-card text-center border border-gray-100 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                  <i className="bi bi-wallet2 text-primary text-2xl"></i>
                </div>
              </div>
              <div className="step-num font-bold text-primary text-xl mb-3">步骤 01</div>
              <h3 className="text-xl font-bold mb-3">设置钱包</h3>
              <p className="text-gray-600">
                创建并设置您的数字钱包，这是您存储和管理数字资产的地方。
              </p>
            </div>

            {/* 步骤2 */}
            <div className="step-card text-center border border-gray-100 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                  <i className="bi bi-file-earmark-plus text-primary text-2xl"></i>
                </div>
              </div>
              <div className="step-num font-bold text-primary text-xl mb-3">步骤 02</div>
              <h3 className="text-xl font-bold mb-3">创建收藏品</h3>
              <p className="text-gray-600">
                上传您的数字作品，设置NFT属性、描述和初始价格。
              </p>
            </div>

            {/* 步骤3 */}
            <div className="step-card text-center border border-gray-100 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                  <i className="bi bi-tags text-primary text-2xl"></i>
                </div>
              </div>
              <div className="step-num font-bold text-primary text-xl mb-3">步骤 03</div>
              <h3 className="text-xl font-bold mb-3">上架销售</h3>
              <p className="text-gray-600">
                将您的NFT上架到市场，选择适合的销售方式：固定价格或拍卖。
              </p>
            </div>

            {/* 步骤4 */}
            <div className="step-card text-center border border-gray-100 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                  <i className="bi bi-currency-exchange text-primary text-2xl"></i>
                </div>
              </div>
              <div className="step-num font-bold text-primary text-xl mb-3">步骤 04</div>
              <h3 className="text-xl font-bold mb-3">交易与收藏</h3>
              <p className="text-gray-600">
                买卖NFT，建立您自己的数字收藏，赚取加密货币收益。
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/mintDigitalResource" className="btn btn-primary rounded-full px-8 py-3 inline-flex items-center">
              <i className="bi bi-plus-circle mr-2"></i>
              开始创建您的NFT
            </Link>
          </div>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="divider h-0.5 bg-gray-100 w-full my-8"></div>

      {/* 平台数据统计 */}
      <div className="platform-stats bg-primary bg-opacity-5 py-16">
        <div className="container mx-auto px-4">
          <div className="section-heading text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">平台数据</h2>
            <p className="text-gray-500">我们的成长与成就</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* 统计项1 */}
            <div className="stat-card text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="icon-wrapper mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <i className="bi bi-images text-blue-600 text-2xl"></i>
                </div>
              </div>
              <h3 className="text-4xl font-bold text-gray-800 mb-2">12,000+</h3>
              <p className="text-gray-500">NFT作品</p>
            </div>

            {/* 统计项2 */}
            <div className="stat-card text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="icon-wrapper mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <i className="bi bi-people text-green-600 text-2xl"></i>
                </div>
              </div>
              <h3 className="text-4xl font-bold text-gray-800 mb-2">8,500+</h3>
              <p className="text-gray-500">活跃用户</p>
            </div>

            {/* 统计项3 */}
            <div className="stat-card text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="icon-wrapper mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <i className="bi bi-graph-up-arrow text-purple-600 text-2xl"></i>
                </div>
              </div>
              <h3 className="text-4xl font-bold text-gray-800 mb-2">25,000+</h3>
              <p className="text-gray-500">总交易量</p>
            </div>

            {/* 统计项4 */}
            <div className="stat-card text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="icon-wrapper mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <i className="bi bi-currency-exchange text-amber-600 text-2xl"></i>
                </div>
              </div>
              <h3 className="text-4xl font-bold text-gray-800 mb-2">5,600 ETH</h3>
              <p className="text-gray-500">交易总额</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

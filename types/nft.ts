// types/nft.ts
export interface RentalInfo {
    dailyRentPrice: string;
    maxDuration: number;
    renter: string;
    startTime: number;
    duration: number;
    active: boolean;
  }
  
  export interface NFTInfo {
    tokenId: number;
    image: string;
    name: string;
    owner: string;
    isListed: boolean;
    rentalInfo?: RentalInfo; // 可选字段，允许 undefined
  }
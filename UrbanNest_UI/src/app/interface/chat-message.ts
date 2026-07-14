export interface ChatProductCard {
  productId: number;
  productName: string;
  productPrice: number;
  imagePath: string[];
  stock: number;
  categoryName: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  products?: ChatProductCard[];
  quickReplies?: string[];
  timestamp: Date;
}

export interface ChatResponse {
  reply: string;
  products?: ChatProductCard[];
  quickReplies: string[];
}
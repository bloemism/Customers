import { CUSTOMER_PAYMENT_FEE } from '../lib/stripe';

export interface PaymentFeeCalculation {
  originalAmount: number;
  feeAmount: number;
  totalAmount: number;
  feePercentage: number;
  storeRevenue: number;
}

export class PaymentFeeService {
  /**
   * 顧客決済時の手数料を計算
   * @param amount 決済金額
   * @returns 手数料計算結果
   */
  static calculatePaymentFee(amount: number): PaymentFeeCalculation {
    const feePercentage = CUSTOMER_PAYMENT_FEE.percentage;
    const feeAmount = Math.round(amount * (feePercentage / 100));
    const totalAmount = amount + feeAmount;
    const storeRevenue = amount; // 店舗の収益は元の金額

    return {
      originalAmount: amount,
      feeAmount: feeAmount,
      totalAmount: totalAmount,
      feePercentage: feePercentage,
      storeRevenue: storeRevenue
    };
  }

  /**
   * 手数料を含む総額から元の金額を逆算
   * @param totalAmount 手数料込みの総額
   * @returns 元の金額
   */
  static calculateOriginalAmount(totalAmount: number): number {
    const feePercentage = CUSTOMER_PAYMENT_FEE.percentage;
    return Math.round(totalAmount / (1 + feePercentage / 100));
  }

  /**
   * 手数料の説明文を取得
   * @returns 手数料説明
   */
  static getFeeDescription(): string {
    return CUSTOMER_PAYMENT_FEE.description;
  }

  /**
   * 手数料率を取得
   * @returns 手数料率（%）
   */
  static getFeePercentage(): number {
    return CUSTOMER_PAYMENT_FEE.percentage;
  }

  /**
   * 店舗の収益計算（手数料を除いた金額）
   * @param totalAmount 顧客が支払う総額
   * @returns 店舗の収益
   */
  static calculateStoreRevenue(totalAmount: number): number {
    const originalAmount = this.calculateOriginalAmount(totalAmount);
    return originalAmount;
  }

  /**
   * 手数料の表示用フォーマット
   * @param amount 金額
   * @returns フォーマットされた金額
   */
  static formatAmount(amount: number): string {
    return `¥${amount.toLocaleString()}`;
  }

  /**
   * 手数料計算の詳細表示用
   * @param amount 決済金額
   * @returns 表示用の詳細情報
   */
  static getPaymentDetails(amount: number): {
    subtotal: string;
    fee: string;
    total: string;
    feeDescription: string;
  } {
    const calculation = this.calculatePaymentFee(amount);
    
    return {
      subtotal: this.formatAmount(calculation.originalAmount),
      fee: this.formatAmount(calculation.feeAmount),
      total: this.formatAmount(calculation.totalAmount),
      feeDescription: `${calculation.feePercentage}%の手数料`
    };
  }
}

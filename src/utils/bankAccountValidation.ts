// 銀行口座情報のバリデーション機能
// 87app Flower Shop Management System

export interface BankAccountInfo {
  bank_name: string;
  branch_name: string;
  account_type: string;
  account_number: string;
  account_holder: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class BankAccountValidator {
  // 日本の主要銀行名のリスト
  private static readonly MAJOR_BANKS = [
    'みずほ銀行',
    '三菱UFJ銀行',
    '三井住友銀行',
    'りそな銀行',
    '楽天銀行',
    'PayPay銀行',
    '住信SBIネット銀行',
    'イオン銀行',
    'セブン銀行',
    'ゆうちょ銀行',
    '地方銀行',
    '信用金庫',
    '信用組合'
  ];

  // 口座種別のリスト
  private static readonly ACCOUNT_TYPES = ['普通', '当座'];

  /**
   * 銀行口座情報の完全なバリデーション
   */
  static validate(bankInfo: BankAccountInfo): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必須項目チェック
    if (!bankInfo.bank_name?.trim()) {
      errors.push('銀行名は必須です');
    }

    if (!bankInfo.branch_name?.trim()) {
      errors.push('支店名は必須です');
    }

    if (!bankInfo.account_type?.trim()) {
      errors.push('口座種別は必須です');
    }

    if (!bankInfo.account_number?.trim()) {
      errors.push('口座番号は必須です');
    }

    if (!bankInfo.account_holder?.trim()) {
      errors.push('口座名義は必須です');
    }

    // 銀行名の形式チェック
    if (bankInfo.bank_name?.trim()) {
      if (!this.isValidBankName(bankInfo.bank_name)) {
        warnings.push('銀行名の形式を確認してください（「銀行」で終わる必要があります）');
      }
    }

    // 支店名の形式チェック
    if (bankInfo.branch_name?.trim()) {
      if (!this.isValidBranchName(bankInfo.branch_name)) {
        warnings.push('支店名の形式を確認してください（「支店」で終わる必要があります）');
      }
    }

    // 口座種別チェック
    if (bankInfo.account_type?.trim()) {
      if (!this.ACCOUNT_TYPES.includes(bankInfo.account_type)) {
        errors.push('口座種別は「普通」または「当座」を選択してください');
      }
    }

    // 口座番号の形式チェック
    if (bankInfo.account_number?.trim()) {
      const accountNumberResult = this.validateAccountNumber(bankInfo.account_number);
      if (!accountNumberResult.isValid) {
        errors.push(...accountNumberResult.errors);
      }
      if (accountNumberResult.warnings.length > 0) {
        warnings.push(...accountNumberResult.warnings);
      }
    }

    // 口座名義の形式チェック
    if (bankInfo.account_holder?.trim()) {
      if (!this.isValidAccountHolder(bankInfo.account_holder)) {
        warnings.push('口座名義の形式を確認してください（法人名または個人名）');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 銀行名の形式チェック
   */
  private static isValidBankName(bankName: string): boolean {
    const trimmed = bankName.trim();
    return trimmed.endsWith('銀行') || trimmed.endsWith('信用金庫') || trimmed.endsWith('信用組合');
  }

  /**
   * 支店名の形式チェック
   */
  private static isValidBranchName(branchName: string): boolean {
    const trimmed = branchName.trim();
    return trimmed.endsWith('支店') || trimmed.endsWith('営業部') || trimmed.endsWith('出張所');
  }

  /**
   * 口座番号の形式チェック
   */
  private static validateAccountNumber(accountNumber: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const trimmed = accountNumber.trim();

    // 数字のみかチェック
    if (!/^[0-9]+$/.test(trimmed)) {
      errors.push('口座番号は数字のみで入力してください');
      return { isValid: false, errors, warnings };
    }

    // 桁数チェック（通常7桁）
    if (trimmed.length !== 7) {
      if (trimmed.length < 7) {
        errors.push('口座番号は7桁で入力してください');
      } else {
        warnings.push('口座番号の桁数を確認してください（通常7桁）');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 口座名義の形式チェック
   */
  private static isValidAccountHolder(accountHolder: string): boolean {
    const trimmed = accountHolder.trim();
    
    // 法人名（株式会社、有限会社等）
    if (trimmed.includes('株式会社') || trimmed.includes('有限会社') || 
        trimmed.includes('合同会社') || trimmed.includes('合資会社') || 
        trimmed.includes('合名会社')) {
      return true;
    }

    // 個人名（ひらがな、カタカナ、漢字）
    if (/^[ひらがなカタカナ漢字\s]+$/.test(trimmed)) {
      return true;
    }

    // 英字（外国人名等）
    if (/^[a-zA-Z\s]+$/.test(trimmed)) {
      return true;
    }

    return false;
  }

  /**
   * 銀行口座情報のフォーマット（表示用）
   */
  static formatForDisplay(bankInfo: BankAccountInfo): string {
    if (!bankInfo.bank_name || !bankInfo.branch_name || !bankInfo.account_number) {
      return '銀行口座情報が未設定です';
    }

    return `${bankInfo.bank_name} ${bankInfo.branch_name} ${bankInfo.account_type} ${bankInfo.account_number}`;
  }

  /**
   * 銀行口座情報のマスキング（セキュリティ用）
   */
  static maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) {
      return '****';
    }

    const start = accountNumber.substring(0, 2);
    const end = accountNumber.substring(accountNumber.length - 2);
    const middle = '*'.repeat(accountNumber.length - 4);

    return `${start}${middle}${end}`;
  }

  /**
   * 銀行口座情報の完全性チェック
   */
  static isComplete(bankInfo: BankAccountInfo): boolean {
    return !!(
      bankInfo.bank_name?.trim() &&
      bankInfo.branch_name?.trim() &&
      bankInfo.account_type?.trim() &&
      bankInfo.account_number?.trim() &&
      bankInfo.account_holder?.trim()
    );
  }

  /**
   * サンプルデータの生成
   */
  static generateSampleData(): BankAccountInfo {
    return {
      bank_name: 'みずほ銀行',
      branch_name: '渋谷支店',
      account_type: '普通',
      account_number: '1234567',
      account_holder: '株式会社サンプル花店'
    };
  }
}

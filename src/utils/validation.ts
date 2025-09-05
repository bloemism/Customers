// バリデーション関数

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// メールアドレスのバリデーション
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('メールアドレスは必須です');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('有効なメールアドレスを入力してください');
  } else if (email.length > 255) {
    errors.push('メールアドレスは255文字以内で入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// パスワードのバリデーション
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('パスワードは必須です');
  } else if (password.length < 6) {
    errors.push('パスワードは6文字以上で入力してください');
  } else if (password.length > 128) {
    errors.push('パスワードは128文字以内で入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 名前のバリデーション
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name) {
    errors.push('名前は必須です');
  } else if (name.length < 1) {
    errors.push('名前を入力してください');
  } else if (name.length > 100) {
    errors.push('名前は100文字以内で入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 電話番号のバリデーション
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  if (phone && !/^[\d\-\+\(\)\s]+$/.test(phone)) {
    errors.push('有効な電話番号を入力してください');
  } else if (phone && phone.length > 20) {
    errors.push('電話番号は20文字以内で入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 住所のバリデーション
export const validateAddress = (address: string): ValidationResult => {
  const errors: string[] = [];
  
  if (address && address.length > 255) {
    errors.push('住所は255文字以内で入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 生年月日のバリデーション
export const validateBirthDate = (birthDate: string): ValidationResult => {
  const errors: string[] = [];
  
  if (birthDate) {
    // 日本語形式の日付（例：1990年3月3日）
    const japaneseDateRegex = /^(\d{4})年(\d{1,2})月(\d{1,2})日$/;
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!japaneseDateRegex.test(birthDate) && !isoDateRegex.test(birthDate)) {
      errors.push('生年月日は「1990年3月3日」または「1990-03-03」の形式で入力してください');
    } else {
      // 日付の妥当性チェック
      let date: Date;
      if (japaneseDateRegex.test(birthDate)) {
        const [, year, month, day] = birthDate.match(japaneseDateRegex)!;
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(birthDate);
      }
      
      if (isNaN(date.getTime())) {
        errors.push('有効な日付を入力してください');
      } else {
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();
        if (age < 0 || age > 150) {
          errors.push('有効な年齢を入力してください');
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// アルファベット名のバリデーション
export const validateAlphabetName = (alphabetName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (alphabetName && !/^[a-zA-Z\s]+$/.test(alphabetName)) {
    errors.push('アルファベット名は英字とスペースのみで入力してください');
  } else if (alphabetName && alphabetName.length > 100) {
    errors.push('アルファベット名は100文字以内で入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 複数フィールドのバリデーション
export const validateForm = (data: Record<string, any>, rules: Record<string, (value: any) => ValidationResult>): ValidationResult => {
  const allErrors: string[] = [];
  let isValid = true;
  
  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(data[field]);
    if (!result.isValid) {
      isValid = false;
      allErrors.push(...result.errors);
    }
  }
  
  return {
    isValid,
    errors: allErrors
  };
};

// 顧客データのバリデーション
export const validateCustomerData = (data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  alphabet?: string;
}): ValidationResult => {
  const rules: Record<string, (value: any) => ValidationResult> = {};
  
  if (data.name !== undefined) rules.name = validateName;
  if (data.email !== undefined) rules.email = validateEmail;
  if (data.phone !== undefined) rules.phone = validatePhone;
  if (data.address !== undefined) rules.address = validateAddress;
  if (data.birth_date !== undefined) rules.birth_date = validateBirthDate;
  if (data.alphabet !== undefined) rules.alphabet = validateAlphabetName;
  
  return validateForm(data, rules);
};

// サニタイゼーション関数
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // HTMLタグの除去
    .replace(/javascript:/gi, '') // JavaScriptの除去
    .replace(/on\w+=/gi, ''); // イベントハンドラの除去
};

// XSS対策のHTMLエスケープ
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};


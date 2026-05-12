/** 開発用カタログの閲覧ロール（将来は認証コンテキストから注入） */
export type CatalogViewerRole = 'store' | 'customer' | 'admin';

/** 通常の市場流通向け / 規格外（姿勢・尺など通常規格外だが品質は良い花の区分） */
export type ProductGradeClass = 'standard' | 'non_standard';

export interface InAppPurchaseProduct {
  id: string;
  symbol: string;
  itemName: string;
  varietyName: string;
  color: string;
  /** 産地名など */
  origin: string;
  /** サイズ表記（例: 60cm、L） */
  sizeLabel: string;
  /** 規格 = 通常流通。規格外 = 市場規格に乗らないが品質良好な出荷区分 */
  gradeClass: ProductGradeClass;
  imageUrl: string;
  description: string;
  wholesalePrice: number;
  b2bUnitsPerCase: number;
  b2bCaseCount: number;
  retailPrice: number;
  b2cUnitsPerCase: number;
  b2cCaseCount: number;
  /** 0.1 = 10% */
  taxRate: number;
  stockQuantity: number;
  isPublished: boolean;
  isPublicB2b: boolean;
  isPublicB2c: boolean;
  salesStartAt: string;
  salesEndAt: string;
}

export function filterProductsForRole(
  role: CatalogViewerRole,
  products: InAppPurchaseProduct[]
): InAppPurchaseProduct[] {
  if (role === 'admin') {
    return products;
  }
  return products.filter((p) => {
    if (!p.isPublished) return false;
    if (role === 'store') return p.isPublicB2b;
    return p.isPublicB2c;
  });
}

export function b2bLineTotal(p: InAppPurchaseProduct): number {
  return p.wholesalePrice * p.b2bUnitsPerCase * p.b2bCaseCount;
}

export function b2cLineTotal(p: InAppPurchaseProduct): number {
  return p.retailPrice * p.b2cUnitsPerCase * p.b2cCaseCount;
}

export function isWithinSalesPeriod(p: InAppPurchaseProduct, now = new Date()): boolean {
  const start = new Date(p.salesStartAt);
  const end = new Date(p.salesEndAt);
  return now >= start && now <= end;
}

export function gradeClassLabel(g: ProductGradeClass): string {
  return g === 'standard' ? '規格' : '規格外';
}

/** 規格外の説明（UIにそのまま表示可） */
export const nonStandardGradeDescription =
  '市場の通常規格に乗らない花です。茎の曲がりや尺が短いなどの理由で通常出荷されないが、花としては美しく産地で廃棄予定だったものを出荷する区分です。';

export function isNonStandardProduct(p: InAppPurchaseProduct): boolean {
  return p.gradeClass === 'non_standard';
}

/** 管理画面の「入力用の空行」初期値（この id は DB 保存前の下書き。登録後に UUID に置き換わる） */
export function createEmptyInAppPurchaseProduct(): InAppPurchaseProduct {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `new-${crypto.randomUUID()}`
      : `new-${Date.now()}`;
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 6);
  return {
    id,
    symbol: '',
    itemName: '',
    varietyName: '',
    color: '',
    origin: '',
    sizeLabel: '',
    gradeClass: 'standard',
    imageUrl: '',
    description: '',
    wholesalePrice: 0,
    b2bUnitsPerCase: 10,
    b2bCaseCount: 1,
    retailPrice: 0,
    b2cUnitsPerCase: 10,
    b2cCaseCount: 1,
    taxRate: 0.1,
    stockQuantity: 0,
    isPublished: false,
    isPublicB2b: false,
    isPublicB2c: false,
    salesStartAt: start.toISOString(),
    salesEndAt: end.toISOString(),
  };
}

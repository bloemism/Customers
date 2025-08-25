# 87app リファクタリングガイド

## 概要
このガイドは、87appの統一されたベースを確立するためのリファクタリング計画です。

## 完了した作業

### 1. 共通コンポーネントの作成
- ✅ `PageHeader` - 統一されたページヘッダー
- ✅ `PageLayout` - 統一されたページレイアウト
- ✅ `Card` - 統一されたカードコンポーネント
- ✅ 共通エクスポートファイル

### 2. 統一テーマ・スタイルガイド
- ✅ `theme.ts` - 統一されたテーマ定義
- ✅ 共通スタイルクラス
- ✅ ユーティリティ関数

### 3. クリーンアップ
- ✅ 不要なバックアップファイルの削除
- ✅ 重複ファイルの整理

## 次のステップ

### 1. ページコンポーネントのリファクタリング
各ページを以下の構造に統一：

```tsx
import React from 'react';
import { PageHeader, PageLayout, Card } from '../components/common';
import { theme } from '../styles/theme';

export const PageName: React.FC = () => {
  return (
    <>
      <PageHeader
        title="ページタイトル"
        subtitle="ページの説明"
        icon={<IconComponent />}
        bgGradient={theme.pageGradients.pageName}
      />
      <PageLayout>
        <Card title="セクションタイトル">
          {/* コンテンツ */}
        </Card>
      </PageLayout>
    </>
  );
};
```

### 2. 優先度の高いページ
1. **SimpleMenuScreen** - メインメニュー（小さいファイル）
2. **ProductManagement** - 商品管理
3. **CustomerManagement** - 顧客管理
4. **StoreRegistration** - 店舗登録

### 3. 共通フックの作成
- `useSupabase` - Supabase操作の統一
- `useForm` - フォーム処理の統一
- `useNotification` - 通知の統一

### 4. 共通サービス層の整理
- データアクセス層の統一
- エラーハンドリングの統一
- 型定義の統一

## コーディング規約

### 1. ファイル構造
```
src/
├── components/
│   ├── common/          # 共通コンポーネント
│   ├── forms/           # フォーム関連
│   ├── ui/              # UI基本コンポーネント
│   └── features/        # 機能別コンポーネント
├── hooks/               # カスタムフック
├── services/            # API・データアクセス
├── styles/              # スタイル・テーマ
├── types/               # 型定義
├── utils/               # ユーティリティ関数
└── pages/               # ページコンポーネント
```

### 2. 命名規則
- **コンポーネント**: PascalCase (`PageHeader`)
- **ファイル**: PascalCase (`PageHeader.tsx`)
- **フック**: camelCase (`useSupabase`)
- **定数**: UPPER_SNAKE_CASE (`API_ENDPOINTS`)

### 3. スタイリング
- Tailwind CSSを基本とする
- 共通スタイルクラスを優先使用
- インラインスタイルは最小限に

### 4. 型定義
- すべてのpropsに型定義
- 共通型は`types/`ディレクトリに配置
- 厳密な型チェックを推奨

## 品質基準

### 1. パフォーマンス
- ファイルサイズ: 各ページは50KB以下を目標
- バンドルサイズ: 適切なコード分割
- レンダリング最適化: React.memo, useMemo, useCallbackの適切な使用

### 2. 保守性
- 単一責任の原則
- DRY原則（Don't Repeat Yourself）
- 明確なコメントとドキュメント

### 3. アクセシビリティ
- セマンティックなHTML
- キーボードナビゲーション対応
- スクリーンリーダー対応

## 移行計画

### Phase 1: 基盤整備（完了）
- ✅ 共通コンポーネント作成
- ✅ テーマ・スタイルガイド作成
- ✅ 不要ファイル削除

### Phase 2: ページリファクタリング（進行中）
- [ ] SimpleMenuScreen
- [ ] ProductManagement
- [ ] CustomerManagement
- [ ] StoreRegistration

### Phase 3: 機能統合
- [ ] 共通フック作成
- [ ] サービス層整理
- [ ] 型定義統一

### Phase 4: 最適化
- [ ] パフォーマンス最適化
- [ ] テスト追加
- [ ] ドキュメント整備

## 注意事項

1. **段階的移行**: 一度にすべてを変更せず、段階的に移行
2. **後方互換性**: 既存機能を壊さないよう注意
3. **テスト**: 各段階で動作確認を実施
4. **ドキュメント**: 変更内容を適切に記録

## 参考資料

- [React Best Practices](https://react.dev/learn)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ページ遷移時にスクロール位置をトップにリセットするカスタムフック
export const useScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // ページ遷移時にスクロール位置をトップに移動
    window.scrollTo(0, 0);
  }, [location.pathname]);
};

// コンポーネントマウント時にスクロール位置をトップにリセットするカスタムフック
export const useScrollToTopOnMount = () => {
  useEffect(() => {
    // コンポーネントマウント時にスクロール位置をトップに移動
    window.scrollTo(0, 0);
  }, []);
};

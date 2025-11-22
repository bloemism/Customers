import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ページ遷移時にスクロール位置をトップにリセットするコンポーネント
export const ScrollToTop: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // ページ遷移時にスクロール位置をトップに移動
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
};


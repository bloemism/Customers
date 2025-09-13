import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';

interface SimpleAuthGuardProps {
  children: React.ReactNode;
}

export const SimpleAuthGuard: React.FC<SimpleAuthGuardProps> = ({ children }) => {
  // 一時的に認証チェックを無効化してデータ表示をテスト
  console.log('認証チェックを一時的に無効化してデータ表示をテストします');
  return <>{children}</>;
};

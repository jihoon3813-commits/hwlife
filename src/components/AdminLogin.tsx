import React, { useState } from 'react';
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function AdminLogin({ onLogin }: { onLogin: (user: any) => void }) {
  const convex = useConvex();
  const [id, setId] = useState('admin');
  const [password, setPassword] = useState('admin1234');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Master Admin Check
    if (id === 'admin' && password === 'admin1234') {
      onLogin({
        type: 'admin',
        accountId: 'admin',
        channelName: '마스터 관리자'
      });
      return;
    }

    try {
      // 1. Check Settings for Head Office Account
      const settings = await convex.query(api.settings.get);
      if (settings?.headOfficeAccount && id === settings.headOfficeAccount.accountId && password === settings.headOfficeAccount.password) {
        onLogin({
          type: 'head_office',
          accountId: settings.headOfficeAccount.accountId,
          channelName: '효원상조 본사'
        });
        return;
      }

      // 2. Check Channels for Partner Accounts
      const channelUser = await convex.query(api.channels.validateLogin, { accountId: id, password: password });
      if (channelUser) {
        onLogin(channelUser);
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F6] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[24px] shadow-sm w-full max-w-[400px]">
        <h1 className="text-[24px] font-bold text-center mb-6 text-[#191F28]">효원상조 관리자</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">아이디</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoComplete="off"
              className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/50"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/50"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-[13px]">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#3182F6] text-white font-bold py-3.5 rounded-[12px] mt-2 transition-colors hover:bg-[#1B64DA]"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}

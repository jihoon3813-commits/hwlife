import React, { useState } from 'react';
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowRight, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';

export default function AdminLogin({ onLogin }: { onLogin: (user: any) => void }) {
  const convex = useConvex();
  const [id, setId] = useState('admin');
  const [password, setPassword] = useState('admin1234');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Master Admin Check
      if (id === 'admin' && password === 'admin1234') {
        onLogin({
          type: 'admin',
          accountId: 'admin',
          channelName: '총괄관리자'
        });
        return;
      }

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

      // 2. Check Settings for Staff Accounts (e.g. tu)
      const staffAccount = (settings as any)?.staffAccounts?.find((s: any) => s.accountId === id && s.password === password);
      if (staffAccount) {
        onLogin({
          type: staffAccount.role || 'head_office',
          accountId: staffAccount.accountId,
          channelName: staffAccount.name || `실무자 (${staffAccount.accountId})`
        });
        return;
      }

      // 3. Built-in Fallback for 실무자 tu / tu1234
      if (id === 'tu' && password === 'tu1234') {
        onLogin({
          type: 'head_office',
          accountId: 'tu',
          channelName: '실무자(tu)'
        });
        return;
      }

      // 4. Check Channels for Partner Accounts
      const channelUser = await convex.query(api.channels.validateLogin, { accountId: id, password: password });
      if (channelUser) {
        onLogin(channelUser);
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err: any) {
      if (id === 'tu' && password === 'tu1234') {
        onLogin({
          type: 'head_office',
          accountId: 'tu',
          channelName: '실무자(tu)'
        });
        return;
      }
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sono-admin-theme min-h-screen bg-[#f5f6f3] flex flex-col lg:flex-row">
      {/* Left Deep-Green Brand Aside */}
      <aside className="hidden lg:flex lg:w-[440px] xl:w-[480px] bg-[#193f39] text-[#d6e2dc] p-12 flex-col justify-between shrink-0 border-r border-[#13312c]">
        <div>
          <div className="adm-brand !p-0 !mb-14">
            <div className="adm-brand-emblem">
              H<span>•</span>
            </div>
            <div>
              <small>HYOWON SANGJO</small>
              <strong>파트너센터</strong>
            </div>
          </div>

          <p className="text-[10px] tracking-[0.18em] text-[#8da69a] font-semibold uppercase mb-4">
            INTEGRATED SALES ADMIN
          </p>
          <h1 className="text-[30px] font-bold leading-[1.32] tracking-tight text-white mb-5">
            효원상조의 모든 영업을<br />
            하나의 워크스페이스에서.
          </h1>
          <p className="text-[13.5px] leading-[1.7] text-[#a7bdb3] break-keep">
            스페셜299, 리빙144, LG가전구독 결합상품의 상담 접수부터 구매동의서·본사 접수·채널 운영까지 일관된 기준으로 관리합니다.
          </p>
        </div>

        <div className="border-t border-white/10 pt-6 space-y-3 text-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-[#86a196]">지원 상품</span>
            <span className="font-semibold text-[#e6efe9]">스페셜299 · 리빙144 · LG가전구독</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#86a196]">운영 환경</span>
            <span className="font-semibold text-[#e6efe9]">본사 총괄 · 상위/일반 파트너 · 실무자</span>
          </div>
        </div>
      </aside>

      {/* Right Login Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8">
        {/* Compact Brand Pill on Mobile/Tablet */}
        <div className="lg:hidden mb-6 inline-flex items-center gap-2.5 bg-[#193f39] text-white px-4 py-2.5 rounded-full shadow-sm">
          <span className="font-serif text-[16px] font-bold tracking-tight">H<span className="text-[#b9c89b]">•</span></span>
          <span className="text-[12px] font-semibold tracking-tight">효원상조 파트너센터</span>
        </div>

        <div className="w-full max-w-[430px]">
          <div className="adm-panel p-8 sm:p-10 shadow-[0_14px_45px_rgba(25,63,57,0.06)]">
            <div className="mb-6">
              <span className="adm-pill green tracking-wider uppercase text-[10px]">
                PARTNER &amp; ADMIN PORTAL
              </span>
              <h2 className="text-[22px] font-bold text-[#263d36] tracking-tight mt-3">
                워크스페이스 로그인
              </h2>
              <p className="text-[12.5px] text-[#86918a] mt-1.5">
                본사 관리자 및 파트너 채널·실무자 계정으로 접속하세요.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#45554e] mb-1.5">
                  아이디
                </label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  autoComplete="off"
                  className="w-full py-3 px-3.5 bg-[#f9faf7] focus:bg-white border border-[#dfe5d9] focus:border-[#295e52] rounded-[9px] text-[13.5px] text-[#263d36] placeholder-[#9ca795] outline-none transition-all focus:shadow-[0_0_0_2px_rgba(41,94,82,0.12)]"
                  placeholder="아이디를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#45554e] mb-1.5">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  className="w-full py-3 px-3.5 bg-[#f9faf7] focus:bg-white border border-[#dfe5d9] focus:border-[#295e52] rounded-[9px] text-[13.5px] text-[#263d36] placeholder-[#9ca795] outline-none transition-all focus:shadow-[0_0_0_2px_rgba(41,94,82,0.12)]"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>

              {error && (
                <div className="px-3.5 py-2.5 rounded-[8px] bg-[#faeae5] border border-[#ead5cf] text-[#a85042] text-[12px] font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#295e52] hover:bg-[#214d43] disabled:opacity-60 text-white font-semibold py-3.5 rounded-[9px] mt-2 transition-colors flex items-center justify-center gap-2 text-[13.5px] cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>접속 확인 중...</span>
                  </>
                ) : (
                  <>
                    <span>로그인</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#edf0e7] flex items-center justify-between text-[12px]">
              <span className="text-[#86918a]">결합상품 공식 안내가 필요하신가요?</span>
              <a
                href="/care_new"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#295e52] hover:text-[#214d43] inline-flex items-center gap-1"
              >
                LG구독 랜딩 보기 <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="mt-6 text-center space-y-2">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#7d877f] hover:text-[#263d36] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              공식 메인 페이지로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

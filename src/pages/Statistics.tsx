import React, { useState } from 'react';
import { BarChart3, Users, MousePointerClick, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function Statistics({ channelId }: { channelId?: string }) {
  const [period, setPeriod] = useState('today');
  const subChannelIds = useQuery(api.channels.getSubChannelIds, 
    channelId ? { subdomain: channelId } : 'skip'
  );

  const stats = useQuery(api.stats.getDashboardStats, 
    channelId 
      ? (subChannelIds ? { period, channelIds: subChannelIds } : 'skip') 
      : { period }
  );


  if (!stats) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-[#3182F6] animate-spin mb-4" />
        <p className="text-[14px] font-bold text-[#4E5968]">통계 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const periodLabel = period === 'today' ? '오늘' : period === 'week' ? '최근 1주일' : '최근 1개월';

  const statCards = [
    { label: `${periodLabel} 유입 인원 (UV)`, value: stats.summary.uv.toLocaleString(), change: stats.summary.uvChange, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: `${periodLabel} 페이지 뷰 (PV)`, value: stats.summary.pv.toLocaleString(), change: stats.summary.pvChange, icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: `${periodLabel} 상담 신청`, value: stats.summary.inquiries.toLocaleString(), change: stats.summary.inquiryChange, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 overflow-y-auto no-scrollbar pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-[20px] lg:text-[24px] font-bold text-[#191F28]">통계분석</h2>
          <p className="text-[12px] lg:text-[13px] text-[#8B95A1] mt-1 break-keep">실시간 방문자 및 신청 현황을 확인합니다.</p>
        </div>
        <div className="flex w-full lg:w-auto bg-white rounded-[12px] border border-[#E5E8EB] overflow-hidden p-1 shadow-sm overflow-x-auto">
          {['today', 'week', 'month'].map((p) => (
            <button 
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 lg:flex-none px-4 lg:px-5 py-2 text-[12px] lg:text-[13px] font-bold rounded-[8px] transition-all whitespace-nowrap ${period === p ? 'bg-[#F2F4F6] text-[#191F28]' : 'text-[#4E5968] hover:bg-[#F9FAFB]'}`}
            >
              {p === 'today' ? '오늘' : p === 'week' ? '1주일' : '1개월'}
            </button>
          ))}
          <button className="hidden lg:block px-5 py-2 text-[13px] font-medium text-[#4E5968] hover:bg-[#F9FAFB] border-l border-[#E5E8EB] ml-1">기간 설정</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const isPositive = card.change.startsWith('+');
          const isNeutral = card.change === '0%';
          return (
            <div key={idx} className="bg-white p-5 lg:p-7 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4 lg:mb-5">
                <div className={`p-3 lg:p-3.5 rounded-[12px] lg:rounded-[16px] ${card.bg}`}>
                  <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${card.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-[12px] lg:text-[13px] font-bold px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-full ${isNeutral ? 'bg-gray-50 text-gray-400' : isPositive ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                  {isNeutral ? '' : isPositive ? <TrendingUp className="w-3 h-3"/> : <TrendingUp className="w-3 h-3 rotate-180"/>}
                  {card.change}
                </div>
              </div>
              <p className="text-[13px] lg:text-[14px] font-bold text-[#4E5968] mb-1">{card.label}</p>
              <h3 className="text-[24px] lg:text-[32px] font-black text-[#191F28]">{card.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-5 lg:p-8 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <h3 className="text-[16px] lg:text-[18px] font-bold flex items-center gap-2 text-[#191F28]">
            <BarChart3 className="w-5 h-5 text-[#3182F6]" /> 최근 7일 통계
          </h3>
          <span className="text-[11px] lg:text-[12px] text-[#8B95A1] font-medium">최근 일주일간의 데이터입니다.</span>
        </div>
        <div className="overflow-x-auto rounded-[16px] border border-[#F2F4F6] hide-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
              <tr>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">일자</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] text-right">유입 인원 (UV)</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] text-right">페이지 뷰 (PV)</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] text-right">상담 신청</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] text-right">전환율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F6]">
              {stats.dailyStats.map((stat, idx) => (
                <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-4 text-[14px] font-bold text-[#191F28]">{stat.date}</td>
                  <td className="px-6 py-4 text-[14px] text-[#4E5968] text-right font-medium">{stat.uv.toLocaleString()}명</td>
                  <td className="px-6 py-4 text-[14px] text-[#4E5968] text-right font-medium">{stat.pv.toLocaleString()}회</td>
                  <td className="px-6 py-4 text-[14px] font-black text-[#3182F6] text-right">{stat.applies.toLocaleString()}건</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[14px] font-bold text-[#191F28] bg-[#F2F4F6] px-3 py-1 rounded-full">
                      {stat.uv > 0 ? ((stat.applies / stat.uv) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 lg:p-8 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm">
          <h3 className="text-[16px] lg:text-[17px] font-bold mb-6 text-[#191F28]">유입 경로 (Top 10 Referrer)</h3>
          <div className="space-y-3">
            {stats.referrers.length > 0 ? stats.referrers.map((ref, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#F9FAFB] p-4 rounded-[16px] border border-[#F2F4F6] hover:border-[#3182F6]/30 transition-all">
                <div className="text-[13px] font-bold text-[#4E5968] truncate max-w-[280px]" title={ref.url}>{ref.url}</div>
                <div className="text-[14px] font-black text-[#191F28] bg-white px-3 py-1 rounded-[8px] shadow-sm border border-[#E5E8EB]">{ref.count.toLocaleString()}건</div>
              </div>
            )) : (
              <div className="text-center py-10 text-[#8B95A1] text-[13px]">데이터가 없습니다.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 lg:p-8 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm">
          <h3 className="text-[16px] lg:text-[17px] font-bold mb-6 text-[#191F28]">최근 접속 IP 현황</h3>
          <div className="overflow-x-auto rounded-[16px] border border-[#F2F4F6] hide-scrollbar">
            <table className="w-full text-left min-w-[300px]">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
                <tr>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#4E5968]">IP 주소</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#4E5968] text-center">건수</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#4E5968] text-right">최근 접속</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F6]">
                {stats.ipLogs.length > 0 ? stats.ipLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3 text-[13px] text-[#191F28] font-bold">{log.ip}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[12px] font-bold text-[#3182F6] bg-[#E8F3FF] px-2 py-0.5 rounded-md">{log.count}회</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#8B95A1] text-right font-medium">{log.lastVisit}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-[#8B95A1] text-[13px]">데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

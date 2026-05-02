import { BarChart3, Users, MousePointerClick, TrendingUp } from 'lucide-react';

export default function Statistics() {
  const statCards = [
    { label: '오늘 유입 인원 (UV)', value: '1,234', change: '+12%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: '오늘 페이지 뷰 (PV)', value: '3,456', change: '+5%', icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: '오늘 상담 신청', value: '45', change: '+18%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  const dailyStats = [
    { date: '2026-05-02', uv: 1234, pv: 3456, applies: 45 },
    { date: '2026-05-01', uv: 1102, pv: 3200, applies: 38 },
    { date: '2026-04-30', uv: 980, pv: 2800, applies: 35 },
  ];

  const referrers = [
    { url: 'https://m.search.naver.com/search.naver...', count: 450 },
    { url: '직접 유입 (Direct)', count: 320 },
    { url: 'https://www.google.com/search...', count: 210 },
    { url: 'https://m.blog.naver.com/...', count: 150 },
  ];

  const ipLogs = [
    { ip: '112.123.***.***', count: 12, lastVisit: '2026-05-02 14:30:22', location: '서울' },
    { ip: '211.45.***.***', count: 8, lastVisit: '2026-05-02 14:28:10', location: '경기' },
    { ip: '118.235.***.***', count: 5, lastVisit: '2026-05-02 14:15:05', location: '부산' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[24px] font-bold">통계분석</h2>
        <div className="flex bg-white rounded-[8px] border border-[#E5E8EB] overflow-hidden">
          <button className="px-4 py-2 text-[13px] font-bold bg-[#F2F4F6] text-[#191F28]">오늘</button>
          <button className="px-4 py-2 text-[13px] font-medium text-[#4E5968] hover:bg-[#F9FAFB]">1주일</button>
          <button className="px-4 py-2 text-[13px] font-medium text-[#4E5968] hover:bg-[#F9FAFB]">1개월</button>
          <button className="px-4 py-2 text-[13px] font-medium text-[#4E5968] hover:bg-[#F9FAFB] border-l border-[#E5E8EB]">기간 설정</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-[16px] border border-[#E5E8EB] shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-[12px] ${card.bg}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <span className="text-[13px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">{card.change}</span>
              </div>
              <p className="text-[14px] font-medium text-[#4E5968] mb-1">{card.label}</p>
              <h3 className="text-[28px] font-bold text-[#191F28]">{card.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-[16px] border border-[#E5E8EB] shadow-sm">
        <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#3182F6]" /> 일자별 통계
        </h3>
        <table className="w-full text-left">
          <thead className="bg-[#F9FAFB] border-y border-[#E5E8EB]">
            <tr>
              <th className="px-4 py-3 text-[13px] font-bold text-[#4E5968]">일자</th>
              <th className="px-4 py-3 text-[13px] font-bold text-[#4E5968] text-right">유입 인원 (UV)</th>
              <th className="px-4 py-3 text-[13px] font-bold text-[#4E5968] text-right">페이지 뷰 (PV)</th>
              <th className="px-4 py-3 text-[13px] font-bold text-[#4E5968] text-right">상담 신청</th>
              <th className="px-4 py-3 text-[13px] font-bold text-[#4E5968] text-right">전환율</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E8EB]">
            {dailyStats.map((stat, idx) => (
              <tr key={idx} className="hover:bg-[#F9FAFB]">
                <td className="px-4 py-3 text-[14px] font-medium text-[#191F28]">{stat.date}</td>
                <td className="px-4 py-3 text-[14px] text-[#4E5968] text-right">{stat.uv.toLocaleString()}</td>
                <td className="px-4 py-3 text-[14px] text-[#4E5968] text-right">{stat.pv.toLocaleString()}</td>
                <td className="px-4 py-3 text-[14px] font-bold text-[#3182F6] text-right">{stat.applies.toLocaleString()}</td>
                <td className="px-4 py-3 text-[14px] font-bold text-[#191F28] text-right">
                  {((stat.applies / stat.uv) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[16px] border border-[#E5E8EB] shadow-sm">
          <h3 className="text-[16px] font-bold mb-4">유입 경로 (Referrer)</h3>
          <div className="space-y-3">
            {referrers.map((ref, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#F9FAFB] p-3 rounded-[8px] border border-[#F2F4F6]">
                <div className="text-[13px] text-[#4E5968] truncate max-w-[280px]" title={ref.url}>{ref.url}</div>
                <div className="text-[14px] font-bold text-[#191F28]">{ref.count.toLocaleString()}건</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[16px] border border-[#E5E8EB] shadow-sm">
          <h3 className="text-[16px] font-bold mb-4">IP별 접속 현황</h3>
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] border-y border-[#E5E8EB]">
              <tr>
                <th className="px-3 py-2 text-[12px] font-bold text-[#4E5968]">IP 주소</th>
                <th className="px-3 py-2 text-[12px] font-bold text-[#4E5968] text-center">지역</th>
                <th className="px-3 py-2 text-[12px] font-bold text-[#4E5968] text-right">접속 횟수</th>
                <th className="px-3 py-2 text-[12px] font-bold text-[#4E5968] text-right">최근 접속</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E8EB]">
              {ipLogs.map((log, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-[13px] text-[#191F28] font-medium">{log.ip}</td>
                  <td className="px-3 py-2 text-[13px] text-[#4E5968] text-center">{log.location}</td>
                  <td className="px-3 py-2 text-[13px] text-[#3182F6] font-bold text-right">{log.count}회</td>
                  <td className="px-3 py-2 text-[12px] text-[#8B95A1] text-right">{log.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

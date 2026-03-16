/**
 * 工作区布局
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 工作区页面布局，包含侧边栏
 */

import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b-2 border-[#D7CCC8]/50 bg-[#FDFBF7] font-serif">
          <MobileSidebar />
          <div className="w-8 h-8 bg-[#8B0000] flex items-center justify-center text-white text-sm font-bold rounded-sm border border-[#FFD700]/30 shadow-sm">
            命
          </div>
          <span className="font-bold text-[#3E2723] tracking-widest">命理工作台</span>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

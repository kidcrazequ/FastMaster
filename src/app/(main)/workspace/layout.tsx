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
        <div className="lg:hidden flex items-center gap-2 p-4 border-b">
          <MobileSidebar />
          <span className="font-semibold">工作台</span>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

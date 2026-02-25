/**
 * 侧边栏组件
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 工作区侧边栏导航
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Heart,
  Sparkles,
  History,
  ChevronRight,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

/** 导航项类型 */
interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

/** 导航分组类型 */
interface NavGroup {
  title: string;
  items: NavItem[];
}

/** 侧边栏导航配置 */
const navGroups: NavGroup[] = [
  {
    title: '命理分析',
    items: [
      {
        title: '八字合婚',
        href: '/workspace/bazi-marriage',
        icon: Heart,
        description: '智能合婚分析',
      },
      {
        title: '算姻缘',
        href: '/workspace/bazi-destiny',
        icon: Sparkles,
        description: '个人姻缘分析',
      },
    ],
  },
  {
    title: '个人中心',
    items: [
      {
        title: '历史记录',
        href: '/workspace/history',
        icon: History,
        description: '查看分析历史',
      },
    ],
  },
];

/**
 * 侧边栏组件
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r-2 border-[#D7CCC8]/30 bg-[#FDFBF7] font-serif shadow-sm">
      <ScrollArea className="flex-1 py-6">
        <div className="px-4 space-y-8">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 mb-4 text-xs font-bold text-[#8B0000] uppercase tracking-[0.2em] border-l-2 border-[#8B0000] ml-1">
                {group.title}
              </h3>
              <nav className="space-y-2">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center justify-between px-4 py-3 rounded-none text-sm font-bold transition-all border-l-2',
                        isActive
                          ? 'bg-[#FFF9ED] text-[#8B0000] border-[#8B0000]'
                          : 'text-[#5D4037] border-transparent hover:bg-[#F5F2E9] hover:text-[#8B0000]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            'h-4 w-4 transition-colors',
                            isActive
                              ? 'text-[#8B0000]'
                              : 'text-[#8D6E63] group-hover:text-[#8B0000]'
                          )}
                        />
                        <span className="tracking-widest">{item.title}</span>
                      </div>
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 opacity-0 transition-opacity',
                          isActive ? 'opacity-100' : 'group-hover:opacity-50'
                        )}
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* 底部升级提示 */}
      <div className="p-6 border-t border-[#D7CCC8]/30">
        <div className="p-5 rounded-none border border-dashed border-[#8B0000]/30 bg-[#FFF9ED] relative group overflow-hidden text-center">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-[#8B0000]/5 rounded-full transform group-hover:scale-150 transition-transform duration-700" />
          <p className="text-sm font-bold text-[#3E2723] mb-1 relative z-10">解锁完整天机</p>
          <p className="text-[10px] text-[#8D6E63] mb-4 italic relative z-10">
            升级至高级版，获取深度 AI 命理解析
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center w-full h-10 px-4 text-xs font-bold text-white bg-[#8B0000] hover:bg-[#7A0000] rounded-none border-b-2 border-[#5D0000] transition-colors relative z-10 tracking-widest shadow-md"
          >
            立即精进
          </Link>
        </div>
      </div>
    </aside>
  );
}

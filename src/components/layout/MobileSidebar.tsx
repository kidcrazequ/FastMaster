/**
 * 移动端侧边栏组件
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 移动端抽屉式侧边栏导航
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Menu,
  Heart,
  User,
  History,
  Calendar,
  Sparkles,
  X,
} from 'lucide-react';

/** 导航项类型 */
interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** 导航分组类型 */
interface NavGroup {
  title: string;
  items: NavItem[];
}

/** 侧边栏导航配置 */
const navGroups: NavGroup[] = [
  {
    title: '八字算命',
    items: [
      { title: '八字计算', href: '/workspace/bazi-analysis', icon: User },
      { title: '八字合婚', href: '/workspace/bazi-marriage', icon: Heart },
      { title: '每日运势', href: '/workspace/daily', icon: Calendar },
    ],
  },
  {
    title: '其他功能',
    items: [
      { title: 'AI 老黄历', href: '/workspace/calendar', icon: Sparkles },
    ],
  },
  {
    title: '个人中心',
    items: [
      { title: '历史记录', href: '/workspace/history', icon: History },
    ],
  },
];

/**
 * 移动端侧边栏组件
 */
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 rounded-none border-r-2 border-[#3E2723] bg-[#FDFBF7] font-serif">
        <SheetHeader className="p-6 border-b border-[#D7CCC8]/30">
          <SheetTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-sm bg-[#8B0000] flex items-center justify-center border border-[#FFD700]/30 shadow-sm transform -rotate-3">
              <span className="text-white font-serif font-bold text-xl">缘</span>
            </div>
            <span className="font-serif font-bold text-xl text-[#3E2723] tracking-widest">命理大师</span>
          </div>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="px-4 py-6 space-y-8">
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
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-4 px-4 py-3 rounded-none text-sm font-bold transition-all border-l-2',
                          isActive
                            ? 'bg-[#FFF9ED] text-[#8B0000] border-[#8B0000]'
                            : 'text-[#5D4037] border-transparent hover:bg-[#F5F2E9] hover:text-[#8B0000]'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4',
                            isActive ? 'text-[#8B0000]' : 'text-[#8D6E63]'
                          )}
                        />
                        <span className="tracking-widest">{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

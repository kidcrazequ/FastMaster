/**
 * 顶部导航组件
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 网站顶部导航栏，包含 Logo、导航链接和用户菜单
 */

'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, History, Settings } from 'lucide-react';

/**
 * 顶部导航组件
 */
export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-[#8B0000] bg-[#F5F2E9] shadow-sm font-serif">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo 和品牌名 */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative w-10 h-10 rounded-sm bg-[#8B0000] flex items-center justify-center shadow-lg border border-[#FFD700]/30 transform group-hover:scale-105 transition-transform -rotate-3">
            <span className="text-white font-serif font-bold text-xl">缘</span>
          </div>
          <span className="font-serif font-bold text-xl text-[#3E2723] tracking-widest">
            命理大师
          </span>
        </Link>

        {/* 导航链接 */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="/workspace/bazi-marriage"
            className="text-sm font-bold text-[#5D4037] hover:text-[#8B0000] transition-colors relative group"
          >
            八字合婚
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#8B0000] transition-all group-hover:w-full" />
          </Link>
          <Link
            href="/workspace/bazi-destiny"
            className="text-sm font-bold text-[#5D4037] hover:text-[#8B0000] transition-colors relative group"
          >
            算姻缘
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#8B0000] transition-all group-hover:w-full" />
          </Link>
          <Link
            href="/workspace/history"
            className="text-sm font-bold text-[#5D4037] hover:text-[#8B0000] transition-colors relative group"
          >
            历史记录
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#8B0000] transition-all group-hover:w-full" />
          </Link>
        </nav>

        {/* 用户菜单 */}
        <div className="flex items-center space-x-4">
          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-[#D7CCC8] animate-pulse" />
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-none border border-[#D7CCC8] p-0 overflow-hidden hover:bg-[#FFF9ED]">
                  <Avatar className="h-full w-full rounded-none">
                    <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                    <AvatarFallback className="bg-[#8B0000] text-[#FFD700] rounded-none font-bold">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-none border-2 border-[#3E2723] bg-[#FDFBF7] font-serif" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2 border-b border-[#D7CCC8]/30">
                  <div className="flex flex-col space-y-1 leading-none">
                    {session.user.name && (
                      <p className="font-bold text-[#3E2723]">{session.user.name}</p>
                    )}
                    {session.user.email && (
                      <p className="w-[200px] truncate text-xs text-[#8D6E63] italic">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-[#D7CCC8]/30" />
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-[#FFF9ED] focus:text-[#8B0000]">
                  <Link href="/workspace/history" className="flex items-center w-full">
                    <History className="mr-2 h-4 w-4" />
                    <span>往期记录</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-[#FFF9ED] focus:text-[#8B0000]">
                  <Link href="/settings" className="flex items-center w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>设置中心</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#D7CCC8]/30" />
                <DropdownMenuItem
                  className="cursor-pointer text-[#8B0000] focus:bg-[#8B0000] focus:text-white"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出名册</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-3">
              <Button variant="ghost" asChild className="text-[#5D4037] hover:text-[#8B0000] hover:bg-transparent font-bold">
                <Link href="/login">登录</Link>
              </Button>
              <Button asChild className="bg-[#8B0000] hover:bg-[#7A0000] text-[#FFD700] rounded-none border-b-2 border-[#5D0000] font-bold shadow-md">
                <Link href="/register">注册</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

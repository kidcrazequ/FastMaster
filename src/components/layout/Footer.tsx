/**
 * 页脚组件
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 网站页脚，包含版权信息和链接
 */

import Link from 'next/link';

/**
 * 页脚组件
 */
export function Footer() {
  return (
    <footer className="border-t-2 border-[#8B0000] bg-[#F5F2E9] font-serif relative overflow-hidden">
      {/* 背景纹理 */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
      
      <div className="container py-8 md:py-10 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* 左侧：品牌 */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-sm bg-[#8B0000] flex items-center justify-center border border-[#FFD700]/30 shadow-md transform -rotate-3">
              <span className="text-white font-serif font-bold text-base">缘</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg text-[#3E2723] tracking-widest leading-none">命理大师</span>
              <span className="text-[10px] text-[#8D6E63] italic mt-1 uppercase tracking-tighter opacity-70">AI 智能命理分析</span>
            </div>
          </div>

          {/* 中间：主旨 */}
          <div className="hidden lg:block text-center px-8 border-x border-[#D7CCC8]/30">
            <p className="text-xs text-[#5D4037] italic">“博通阴阳理，洞察天地机。”</p>
          </div>

          {/* 右侧：导航与版权 */}
          <div className="flex flex-col md:items-end gap-3">
            <div className="flex gap-6 text-sm font-bold text-[#5D4037]">
              <Link href="/workspace/bazi-marriage" className="hover:text-[#8B0000] transition-colors relative group">
                八字合婚
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#8B0000] transition-all group-hover:w-full" />
              </Link>
              <Link href="/workspace/bazi-destiny" className="hover:text-[#8B0000] transition-colors relative group">
                算姻缘
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#8B0000] transition-all group-hover:w-full" />
              </Link>
              <Link href="/workspace/history" className="hover:text-[#8B0000] transition-colors relative group">
                往期名册
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#8B0000] transition-all group-hover:w-full" />
              </Link>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-[#8D6E63] italic opacity-60 tracking-widest">
              <p>© {new Date().getFullYear()} 命理大师 版权所有</p>
              <div className="flex gap-2">
                <span className="w-1 h-1 bg-[#8D6E63] rounded-full" />
                <span>隐私</span>
                <span className="w-1 h-1 bg-[#8D6E63] rounded-full" />
                <span>协议</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * 合婚分析结果页面
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 展示合婚分析结果和 AI 分析报告
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Heart,
  Users,
  Sparkles,
  Home,
  Send,
  Loader2,
  MessageCircle,
  User,
  Bot,
  Lock,
  Scale,
  Brain,
  Baby,
  Star,
  Crown,
  Flame,
  Droplets,
  Mountain,
  TreePine,
  Coins,
  ChevronDown,
  ChevronUp,
  Compass,
} from 'lucide-react';
import { toast } from 'sonner';
import type { MarriageAnalysisResult, PersonBazi, WuXing } from '@/types/bazi';

/** 分析记录类型 */
interface AnalysisData {
  id: string;
  person1Name: string;
  person2Name: string;
  person1Birth: string;
  person2Birth: string;
  person1Bazi: PersonBazi;
  person2Bazi: PersonBazi;
  result: MarriageAnalysisResult;
  overallScore: number;
  createdAt: string;
  conversations: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }>;
}

/** 维度配置 */
const dimensionConfig = {
  basicCompatibility: { icon: Heart, label: '基础契合度', color: 'text-pink-500' },
  personalityMatch: { icon: Users, label: '性格相容性', color: 'text-blue-500' },
  marriagePalace: { icon: Sparkles, label: '婚姻宫位', color: 'text-purple-500' },
  familyHarmony: { icon: Home, label: '家庭和谐', color: 'text-green-500' },
};

/** 五行图标映射 - 中国传统色系 */
const wuXingIcons: Record<WuXing, { icon: typeof Flame; color: string; bg: string; bar: string }> = {
  '金': { icon: Coins, color: 'text-[#B8860B]', bg: 'bg-[#FFF9E6]', bar: 'bg-[#B8860B]' }, // 缊黄
  '木': { icon: TreePine, color: 'text-[#228B22]', bg: 'bg-[#E6F9F0]', bar: 'bg-[#228B22]' }, // 竹青
  '水': { icon: Droplets, color: 'text-[#003153]', bg: 'bg-[#E6F3FF]', bar: 'bg-[#003153]' }, // 黛蓝
  '火': { icon: Flame, color: 'text-[#8B0000]', bg: 'bg-[#FFEBEB]', bar: 'bg-[#8B0000]' }, // 朱砂
  '土': { icon: Mountain, color: 'text-[#8B4513]', bg: 'bg-[#FFF4E6]', bar: 'bg-[#8B4513]' }, // 赭石
};

/**
 * 评分等级
 */
function getScoreLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: '极佳', color: 'bg-green-500' };
  if (score >= 70) return { label: '良好', color: 'bg-blue-500' };
  if (score >= 60) return { label: '中等', color: 'bg-yellow-500' };
  return { label: '需努力', color: 'bg-orange-500' };
}

/**
 * 预处理 Markdown 内容，修复一些格式问题
 */
function preprocessMarkdown(content: string): string {
  if (!content) return '';
  
  let processed = content;
  
  // 处理 ** 和中文标点之间的空格问题
  processed = processed.replace(/\*\*\s*([""「」『』【】])/g, '**$1');
  processed = processed.replace(/([""「」『』【】])\s*\*\*/g, '$1**');
  
  // 将 **"..."** 转换为 "**...**"
  processed = processed.replace(/\*\*[""]([^""]+)[""]\*\*/g, '"**$1**"');
  processed = processed.replace(/\*\*「([^」]+)」\*\*/g, '「**$1**」');
  
  return processed;
}

/** 地支对应生肖 */
const diZhiToZodiac: Record<string, string> = {
  '子': '🐭 鼠', '丑': '🐂 牛', '寅': '🐅 虎', '卯': '🐰 兔',
  '辰': '🐲 龙', '巳': '🐍 蛇', '午': '🐴 马', '未': '🐏 羊',
  '申': '🐵 猴', '酉': '🐔 鸡', '戌': '🐕 狗', '亥': '🐷 猪',
};

/** 根据农历年份计算生肖（按春节划分，符合民俗习惯）*/
const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
const zodiacEmojis = ['🐭', '🐂', '🐅', '🐰', '🐲', '🐍', '🐴', '🐏', '🐵', '🐔', '🐕', '🐷'];

/**
 * 春节日期表（公历）1970-2030
 * 格式：年份 -> [月, 日]
 */
const chineseNewYearDates: Record<number, [number, number]> = {
  1970: [2, 6], 1971: [1, 27], 1972: [2, 15], 1973: [2, 3], 1974: [1, 23],
  1975: [2, 11], 1976: [1, 31], 1977: [2, 18], 1978: [2, 7], 1979: [1, 28],
  1980: [2, 16], 1981: [2, 5], 1982: [1, 25], 1983: [2, 13], 1984: [2, 2],
  1985: [2, 20], 1986: [2, 9], 1987: [1, 29], 1988: [2, 17], 1989: [2, 6],
  1990: [1, 27], 1991: [2, 15], 1992: [2, 4], 1993: [1, 23], 1994: [2, 10],
  1995: [1, 31], 1996: [2, 19], 1997: [2, 7], 1998: [1, 28], 1999: [2, 16],
  2000: [2, 5], 2001: [1, 24], 2002: [2, 12], 2003: [2, 1], 2004: [1, 22],
  2005: [2, 9], 2006: [1, 29], 2007: [2, 18], 2008: [2, 7], 2009: [1, 26],
  2010: [2, 14], 2011: [2, 3], 2012: [1, 23], 2013: [2, 10], 2014: [1, 31],
  2015: [2, 19], 2016: [2, 8], 2017: [1, 28], 2018: [2, 16], 2019: [2, 5],
  2020: [1, 25], 2021: [2, 12], 2022: [2, 1], 2023: [1, 22], 2024: [2, 10],
  2025: [1, 29], 2026: [2, 17], 2027: [2, 6], 2028: [1, 26], 2029: [2, 13],
  2030: [2, 3],
};

/**
 * 根据出生日期计算生肖（按农历春节划分）
 * @param birthDate - 出生日期
 * @returns 生肖字符串（含emoji）
 */
function getZodiacByBirthDate(birthDate: Date | string): string {
  try {
    const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 获取该年春节日期
    const cny = chineseNewYearDates[year];
    let lunarYear = year;
    
    if (cny) {
      // 如果在春节之前，属于上一年生肖
      if (month < cny[0] || (month === cny[0] && day < cny[1])) {
        lunarYear = year - 1;
      }
    } else {
      // 如果没有春节数据，使用简化逻辑（2月5日前属于上一年）
      if (month === 1 || (month === 2 && day < 5)) {
        lunarYear = year - 1;
      }
    }
    
    // 1900年是鼠年，以此为基准计算
    const index = ((lunarYear - 1900) % 12 + 12) % 12;
    return `${zodiacEmojis[index]} ${zodiacAnimals[index]}`;
  } catch {
    return '';
  }
}

/**
 * 八字展示组件
 */
/**
 * 八字展示组件 - 古典风格
 */
function BaziDisplay({ bazi, title }: { bazi: PersonBazi; title: string }) {
  // 优先使用服务端计算的生肖（按农历春节划分）
  const zodiacFromServer = bazi.zodiac ? `${zodiacEmojis[zodiacAnimals.indexOf(bazi.zodiac)]} ${bazi.zodiac}` : '';
  const zodiacFromDate = getZodiacByBirthDate(bazi.birthDate);
  const zodiacFromBazi = diZhiToZodiac[bazi.siZhu.year.diZhi] || '';
  const zodiac = zodiacFromServer || zodiacFromDate || zodiacFromBazi;
  
  const mingZhu = bazi.mingZhu || `${bazi.riYuan}${bazi.riYuanWuXing}`;

  return (
    <div className="relative p-6 rounded-none border-2 border-[#8B0000] bg-[#FFF9ED] shadow-md overflow-hidden group">
      {/* 装饰边角 */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#8B0000] z-10" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#8B0000] z-10" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#8B0000] z-10" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#8B0000] z-10" />
      
      {/* 水墨背景装饰 */}
      <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
        <Compass className="w-full h-full text-[#8B0000]" />
      </div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <h3 className="text-2xl font-serif font-bold text-[#8B0000] flex items-center gap-2">
            {title} 
            <span className="text-xs font-normal text-[#5D4037] px-2 py-0.5 border border-[#8B0000]/30 rounded-sm">
              {bazi.gender === 'male' ? '乾造' : '坤造'}
            </span>
          </h3>
          <div className="flex items-center gap-3 mt-2 text-[#8D6E63] text-sm font-serif">
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {zodiac}</span>
            <span className="w-1 h-1 rounded-full bg-[#D7CCC8]" />
            <span className="text-[#8B0000] font-medium">命主：{mingZhu}</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-[#8B0000] rounded-sm flex items-center justify-center text-white font-serif text-sm shadow-lg transform -rotate-12 border border-[#FFD700]/50">
          <span className="text-xs">命盘<br/>真印</span>
        </div>
      </div>

      {/* 八字四柱 - 竖排古典布局 */}
      <div className="grid grid-cols-4 gap-3 mb-8 relative z-10">
        {[
          { label: '年柱', value: bazi.siZhu.year },
          { label: '月柱', value: bazi.siZhu.month },
          { label: '日柱', value: bazi.siZhu.day },
          { label: '时柱', value: bazi.siZhu.hour },
        ].map((item, i) => (
          <div key={item.label} className="flex flex-col items-center">
            <span className="text-[10px] text-[#A1887F] mb-2 font-serif">{item.label}</span>
            <div className="flex flex-col bg-[#F5F5DC] border-2 border-[#D7CCC8] py-3 px-4 rounded-sm shadow-inner w-full items-center gap-1 group-hover:border-[#8B0000]/30 transition-colors">
              <span className="text-xl font-serif font-bold text-[#3E2723]">{item.value.tianGan}</span>
              <span className="text-xl font-serif font-bold text-[#3E2723]">{item.value.diZhi}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 五行能量图 */}
      <div className="relative z-10">
        <p className="text-xs text-[#A1887F] mb-3 font-serif border-b border-[#D7CCC8] pb-1">五行能量分布</p>
        <div className="grid grid-cols-5 gap-1">
          {Object.entries(bazi.wuXingCount).map(([wx, count]) => {
            const config = wuXingIcons[wx as WuXing];
            return (
              <div key={wx} className="flex flex-col items-center p-1 bg-white/40 border border-[#D7CCC8]/50 rounded-sm">
                <span className="text-[10px] mb-1">{wx}</span>
                <span className={`text-xs font-bold ${config.color}`}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 评分进度条
 */
function ScoreBar({ score, label }: { score: number; label: string }) {
  const level = getScoreLevel(score);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{score}分</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${level.color} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

/**
 * 可折叠分析模块 - 古典经书风格
 */
function AnalysisModule({
  title,
  icon: Icon,
  iconColor,
  score,
  isLocked = false,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: any;
  iconColor: string;
  score?: number;
  isLocked?: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-none border-2 border-[#D7CCC8] bg-[#FFF9ED] overflow-hidden mb-8 shadow-sm transition-all duration-500 ${isLocked ? 'grayscale-[0.5] opacity-90' : 'hover:border-[#8B0000]/30 hover:shadow-md'}`}>
      <div 
        className="bg-[#F5F2E9] border-b border-[#D7CCC8] p-5 flex justify-between items-center cursor-pointer select-none group"
        onClick={() => !isLocked && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full bg-white border border-[#D7CCC8] shadow-inner group-hover:border-[#8B0000]/30 transition-colors`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="flex flex-col">
            <h3 className="font-serif font-bold text-lg text-[#3E2723] tracking-wider flex items-center gap-3">
              {title}
              {score !== undefined && (
                <span className="text-sm font-normal text-[#8B0000] border-b border-[#8B0000] px-1">
                  {score}分
                </span>
              )}
            </h3>
          </div>
        </div>
        
        {isLocked ? (
          <div className="flex items-center gap-2 text-[#8B0000] bg-[#8B0000]/5 px-3 py-1 rounded-full border border-[#8B0000]/20">
            <Lock className="h-3 w-3" />
            <span className="text-xs font-serif">订阅解锁</span>
          </div>
        ) : (
          <div className={`text-[#D7CCC8] group-hover:text-[#8B0000] transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="h-5 w-5" />
          </div>
        )}
      </div>
      
      {isOpen && !isLocked && (
        <div className="p-8 animate-in fade-in slide-in-from-top-2 duration-500">
          {children}
        </div>
      )}
      
      {isLocked && (
        <div className="p-10 text-center bg-[#F5F2E9]/50">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-[#8B0000]/10 rounded-full animate-ping" />
              <div className="relative w-16 h-16 bg-white border-2 border-[#8B0000] rounded-full flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-[#8B0000]" />
              </div>
            </div>
            <p className="text-lg font-serif text-[#3E2723]">缘分深度，需诚心开启</p>
            <p className="text-sm text-[#8D6E63] font-serif leading-relaxed">
              此模块包含更深层的命理分析，包括婚姻宫详解、子嗣运势及十神格局，建议升级至高级版以获取完整天机。
            </p>
            <Button className="w-full bg-[#8B0000] hover:bg-[#7A0000] text-white rounded-none border-b-4 border-[#5D0000] font-serif tracking-widest h-12" asChild>
              <Link href="/pricing">立即开启因果</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 五行平衡分析组件
 */
function WuXingBalanceSection({ bazi1, bazi2, name1, name2 }: { 
  bazi1: PersonBazi; 
  bazi2: PersonBazi;
  name1: string;
  name2: string;
}) {
  const renderWuXingBar = (count: Record<string, number>, name: string, color: string) => {
    const total = Object.values(count).reduce((a, b) => a + b, 0);
    const max = Math.max(...Object.values(count));
    
    return (
      <div className={`p-6 rounded-none border-2 ${color} bg-[#FDFBF7] relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow font-serif`}>
        <div className="absolute top-0 right-0 w-12 h-12 bg-[#F5F2E9] transform rotate-45 translate-x-6 -translate-y-6 pointer-events-none opacity-50" />
        <p className="font-bold text-lg text-[#3E2723] mb-6 flex items-center gap-3">
          <span className={`w-1 h-6 ${color === 'border-[#3E2723]' ? 'bg-[#3E2723]' : 'bg-[#8B0000]'}`} />
          {name}之五行
        </p>
        <div className="space-y-4">
          {Object.entries(count).map(([wx, val]) => {
            const config = wuXingIcons[wx as WuXing];
            const Icon = config.icon;
            const percentage = total > 0 ? (val / total) * 100 : 0;
            const isMax = val === max;
            
            return (
              <div key={wx} className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${config.bg} shadow-inner`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <span className="w-6 text-xs font-bold text-[#5D4037]">{wx}</span>
                <div className="flex-1 h-2 bg-[#EFEBE9] rounded-none overflow-hidden border border-[#D7CCC8]/30">
                  <div
                    className={`h-full ${isMax ? 'bg-[#8B0000]' : 'bg-[#D7CCC8]'} transition-all duration-1000`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-[10px] text-right text-[#8D6E63] font-mono">{val.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 找出最强和最弱的五行
  const getStrongestWeakest = (count: Record<string, number>) => {
    const entries = Object.entries(count);
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return { strongest: sorted[0][0], weakest: sorted[sorted.length - 1][0] };
  };

  const p1Analysis = getStrongestWeakest(bazi1.wuXingCount as any);
  const p2Analysis = getStrongestWeakest(bazi2.wuXingCount as any);

  return (
    <div className="space-y-8 font-serif">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {renderWuXingBar(bazi1.wuXingCount as any, name1, 'border-[#3E2723]')}
        {renderWuXingBar(bazi2.wuXingCount as any, name2, 'border-[#8B0000]')}
      </div>
      
      <div className="p-6 rounded-none border-2 border-[#8B0000]/30 bg-[#FFF9ED] shadow-md relative group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 bg-[#8B0000] text-white text-[10px] py-1.5 rounded-none font-serif tracking-[0.2em] border border-[#FFD700]/50 shadow-sm group-hover:bg-[#A30000] transition-colors">
          五行互补 · 调和之道
        </div>
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#8B0000]/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#8B0000]/20 pointer-events-none" />
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-3 bg-[#F5F2E9]/50 border border-[#D7CCC8]/30">
              <p className="text-xs text-[#5D4037] italic">
                {name1}命局：<span className="text-[#8B0000] font-bold">{p1Analysis.strongest}</span>偏旺，需<span className="text-[#8B0000] font-bold">{p1Analysis.weakest}</span>补益
              </p>
            </div>
            <div className="text-center p-3 bg-[#F5F2E9]/50 border border-[#D7CCC8]/30">
              <p className="text-xs text-[#5D4037] italic">
                {name2}命局：<span className="text-[#8B0000] font-bold">{p2Analysis.strongest}</span>偏旺，需<span className="text-[#8B0000] font-bold">{p2Analysis.weakest}</span>补益
              </p>
            </div>
          </div>
          <p className="text-[#3E2723] leading-relaxed text-sm italic text-center px-4 pt-2">
            “💡 {p1Analysis.weakest === p2Analysis.strongest || p2Analysis.weakest === p1Analysis.strongest
              ? '双方五行存在天然的互补关系，一人之盈补一人之亏，相得益彰，大吉。'
              : '双方五行虽互补性平平，但并无明显的冲克之虞。在日常生活中，建议多通过居住环境、服饰颜色进行后天调和。'}”
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 性格特点分析组件 - 增强个性化版本
 */
function PersonalitySection({ bazi1, bazi2, name1, name2 }: { 
  bazi1: PersonBazi; 
  bazi2: PersonBazi;
  name1: string;
  name2: string;
}) {
  const getPersonalityDetail = (riYuan: string, gender: string, name: string) => {
    const isMale = gender === 'male';
    const traits: Record<string, { 
      core: string; 
      love: string; 
      comm: string; 
      style: string;
      quote: string;
    }> = {
      '甲': { 
        core: '正直仁慈，具有领导力，像大树一样稳重可靠', 
        love: isMale ? '感情中积极主动，像参天大树般给对方安全感' : '对待感情专一，追求能够共同成长的伴侣',
        comm: '沟通直接坦诚，不屑于虚伪，有时显得有些固执',
        style: '决策果断，注重长远发展，看重原则与信誉',
        quote: '“甲木参天，脱胎要火。”'
      },
      '乙': { 
        core: '温柔坚韧，富有同情心，像花草一样灵活多变', 
        love: isMale ? '心思细腻，善于营造浪漫气氛，呵护伴侣' : '温柔如水，在感情中极具韧性，懂得柔能克刚',
        comm: '沟通婉转含蓄，善于倾听，能化解矛盾于无形',
        style: '决策灵活，擅长借力使力，追求和谐的解决方案',
        quote: '“乙木虽柔，刿羊解牛。”'
      },
      '丙': { 
        core: '热情奔放，充满正能量，像太阳一样照耀他人', 
        love: isMale ? '感情热烈如火，全心全意付出，渴望激情' : '性格开朗，是伴侣的开心果，追求光明正大的爱情',
        comm: '沟通直率豪爽，富有感染力，有时会显得急躁',
        style: '决策迅速，敢于冒险，具有极强的爆发力',
        quote: '“丙火猛烈，欺霜侮雪。”'
      },
      '丁': { 
        core: '细腻多思，温和而有礼，像烛火一样默默奉献', 
        love: isMale ? '感情深沉，在细节中展现爱意，守护对方' : '心思缜密，追求精神共鸣，是典型的贤内助',
        comm: '沟通温和委婉，善于观察他人情绪，极具亲和力',
        style: '决策慎重，注重细节，擅长在幕后运筹帷幄',
        quote: '“丁火柔中，内性昭融。”'
      },
      '戊': { 
        core: '诚实守信，包容力强，像大地一样厚德载物', 
        love: isMale ? '感情稳重可靠，一旦认定便不轻易改变' : '追求踏实稳定的感情，是家庭的坚强后盾',
        comm: '沟通朴实无华，给人以信任感，有时显得沉闷',
        style: '决策稳健，注重积累，不轻易冒险，极具定力',
        quote: '“戊土固重，既中且正。”'
      },
      '己': { 
        core: '心思缜密，多才多艺，像田园之土般孕育万物', 
        love: isMale ? '体贴入微，擅长经营婚姻，生活气息浓厚' : '包容大度，善解人意，能给予伴侣极大的支持',
        comm: '沟通细致入微，逻辑性强，善于协调各方关系',
        style: '决策周密，注重实际利益，擅长处理复杂问题',
        quote: '“己土卑湿，中正蓄藏。”'
      },
      '庚': { 
        core: '刚毅果断，有正义感，像利剑一样锐意进取', 
        love: isMale ? '感情中极具担当，敢于负责，追求效率' : '个性独立，敢爱敢恨，欣赏有魄力的伴侣',
        comm: '沟通简练干脆，直击重点，有时会显得犀利',
        style: '决策果断，极具执行力，在压力下能做出正确判断',
        quote: '“庚金带煞，刚健为最。”'
      },
      '辛': { 
        core: '精致优雅，聪明灵秀，像珠宝一样璀璨夺目', 
        love: isMale ? '追求高品质的感情，温文尔雅，极具绅士风度' : '心思细腻，注重品味，渴望被呵护与赞美',
        comm: '沟通精致得体，善于表达，极具语言天赋',
        style: '决策精明，注重细节与美感，擅长在复杂中寻找平衡',
        quote: '“辛金软弱，温润而清。”'
      },
      '壬': { 
        core: '聪明睿智，志向远大，像江河之水般奔流不息', 
        love: isMale ? '感情中极具魅力，追求广阔的空间与自由' : '聪慧大方，富有远见，能引领伴侣共同进步',
        comm: '沟通流畅自然，富有幽默感，极具说服力',
        style: '决策大气，注重全局，具有极强的应变能力',
        quote: '“壬水通河，能泄金气。”'
      },
      '癸': { 
        core: '柔和智慧，感性敏锐，像雨露一样滋润万物', 
        love: isMale ? '感情细腻多情，善于感同身受，追求心灵契合' : '温柔体贴，具有极强的灵气，是伴侣的解语花',
        comm: '沟通柔和婉转，直觉灵敏，擅长情感层面的互动',
        style: '决策审慎，注重直觉与灵感，擅长在无声中解决问题',
        quote: '“癸水至弱，达于天津。”'
      },
    };

    return traits[riYuan] || { 
      core: '待分析', 
      love: '待分析', 
      comm: '待分析', 
      style: '待分析',
      quote: '“万物皆有其性。”'
    };
  };

  const p1Detail = getPersonalityDetail(bazi1.riYuan, bazi1.gender, name1);
  const p2Detail = getPersonalityDetail(bazi2.riYuan, bazi2.gender, name2);

  // 获取优势建议
  const getAdvantages = () => {
    const p1Core = p1Detail.core.split('，')[0];
    const p2Core = p2Detail.core.split('，')[0];
    return [
      `${name1}的${p1Core}与${name2}的${p2Core}形成互补，刚柔并济。`,
      `双方在沟通上“${p1Detail.comm.split('，')[0]}”与“${p2Detail.comm.split('，')[0]}”的结合，有利于建立深层默契。`,
      `性格中“${p1Detail.style.split('，')[0]}”与“${p2Detail.style.split('，')[0]}”的差异，能为生活决策提供更多维度。`
    ];
  };

  // 获取注意事项
  const getCautions = () => {
    return [
      `注意不要将“${p1Detail.core.split('，')[0]}”演变为固执，多听取对方意见。`,
      `在处理“${p1Detail.style.split('，')[0]}”时，多给彼此一些缓冲空间。`,
      `保持“${p1Detail.love.split('，')[0]}”的初心，多制造一些二人世界的浪漫。`
    ];
  };

  return (
    <div className="space-y-8 font-serif">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { name: name1, detail: p1Detail, color: 'border-[#3E2723]', riYuan: bazi1.riYuan, gender: bazi1.gender },
          { name: name2, detail: p2Detail, color: 'border-[#8B0000]', riYuan: bazi2.riYuan, gender: bazi2.gender }
        ].map((p, i) => (
          <div key={i} className={`p-6 rounded-none border-2 ${p.color} bg-[#FDFBF7] relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#F5F2E9] transform rotate-45 translate-x-8 -translate-y-8 pointer-events-none opacity-50" />
            
            <div className="flex items-center gap-4 mb-6 relative">
              <div className={`w-1 h-8 ${p.color === 'border-[#3E2723]' ? 'bg-[#3E2723]' : 'bg-[#8B0000]'}`} />
              <div>
                <p className="font-bold text-lg text-[#3E2723]">{p.name}之品性</p>
                <p className="text-[10px] text-[#8D6E63] tracking-widest italic opacity-80">{p.detail.quote}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-[#5D4037]">
              <p className="text-[12px] text-[#8D6E63] border-b border-[#D7CCC8] pb-1 italic opacity-70">
                日元 {p.riYuan} · {p.gender === 'male' ? '乾造' : '坤造'}
              </p>
              <div className="flex gap-3 p-3 bg-[#FFF9ED] border-l-2 border-[#8B0000]/50 rounded-sm">
                <span className="shrink-0 text-[#8B0000] font-bold">【本性】</span>
                <p>{p.detail.core}</p>
              </div>
              <div className="flex gap-3 p-3 bg-[#FFF9ED] border-l-2 border-[#3E2723]/50 rounded-sm">
                <span className="shrink-0 text-[#3E2723] font-bold">【情深】</span>
                <p>{p.detail.love}</p>
              </div>
              <div className="flex gap-3 p-3 bg-[#FFF9ED] border-l-2 border-[#5D4037]/50 rounded-sm">
                <span className="shrink-0 text-[#5D4037] font-bold">【言传】</span>
                <p>{p.detail.comm}</p>
              </div>
              <div className="flex gap-3 p-3 bg-[#FFF9ED] border-l-2 border-[#8D6E63]/50 rounded-sm">
                <span className="shrink-0 text-[#8D6E63] font-bold">【断事】</span>
                <p>{p.detail.style}</p>
              </div>
            </div>

            <div className="absolute bottom-2 right-4 opacity-5">
              <span className="text-4xl font-serif">{p.name[0]}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-none border-2 border-[#8B0000]/30 bg-[#FFF9ED] shadow-md relative group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 bg-[#8B0000] text-white text-[10px] py-1.5 rounded-none font-serif tracking-[0.2em] border border-[#FFD700]/50 shadow-sm group-hover:bg-[#A30000] transition-colors">
          琴瑟和鸣 · 互补之美
        </div>
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#8B0000]/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#8B0000]/20 pointer-events-none" />
        
        <div className="space-y-6">
          <p className="text-[#3E2723] leading-relaxed text-sm italic text-center px-4">
            “夫合者，和也。两人的性情如同琴与瑟，各有千秋，合则生音。”
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#8B0000]/10">
            <div className="space-y-3">
              <p className="font-bold text-[#8B0000] text-xs flex items-center gap-2">
                <span className="w-4 h-4 bg-[#8B0000] text-white flex items-center justify-center rounded-full text-[8px]">合</span>
                相辅相成
              </p>
              <ul className="text-[11px] space-y-2 text-[#5D4037] italic">
                {getAdvantages().map((adv, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[#8B0000]">·</span>
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <p className="font-bold text-[#8D6E63] text-xs flex items-center gap-2">
                <span className="w-4 h-4 bg-[#8D6E63] text-white flex items-center justify-center rounded-full text-[8px]">诫</span>
                诚心以待
              </p>
              <ul className="text-[11px] space-y-2 text-[#5D4037] italic">
                {getCautions().map((caution, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[#8D6E63]">·</span>
                    {caution}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 婚姻宫分析组件
 */
function MarriagePalaceSection({ bazi1, bazi2, name1, name2 }: { 
  bazi1: PersonBazi; 
  bazi2: PersonBazi;
  name1: string;
  name2: string;
}) {
  const p1Palace = bazi1.siZhu.day.diZhi;
  const p2Palace = bazi2.siZhu.day.diZhi;

  const getPalaceDescription = (diZhi: string, gender: string, riYuan: string, riYuanWuXing: string, name: string): { 
    timing: string; 
    characteristics: string[];
    loveStyle: string;
    expectation: string;
    detailAdvice: string;
  } => {
    const isMale = gender === 'male';
    
    const baseDescriptions: Record<string, { timing: string; characteristics: string[] }> = {
      '子': { timing: '感情来得快，容易一见钟情', characteristics: ['聪明伶俐', '感情丰富', '善于沟通'] },
      '丑': { timing: '感情发展稳健，厚积薄发', characteristics: ['踏实稳重', '忠诚可靠', '务实持家'] },
      '寅': { timing: '感情积极主动，敢爱敢恨', characteristics: ['热情大方', '有进取心', '重视家庭'] },
      '卯': { timing: '感情温和浪漫，追求完美', characteristics: ['温柔体贴', '善解人意', '追求和谐'] },
      '辰': { timing: '感情有规划，目标明确', characteristics: ['志向远大', '有责任感', '顾家有方'] },
      '巳': { timing: '感情细腻多思，深情款款', characteristics: ['聪慧灵活', '善于经营', '重感情'] },
      '午': { timing: '感情热烈奔放，充满激情', characteristics: ['热情奔放', '积极向上', '感情丰富'] },
      '未': { timing: '感情细水长流，越久越深', characteristics: ['温和包容', '心地善良', '家庭观念强'] },
      '申': { timing: '感情多变灵活，不拘一格', characteristics: ['机敏灵活', '适应力强', '善于变通'] },
      '酉': { timing: '感情讲究品质，精挑细选', characteristics: ['精明能干', '追求完美', '重视品质'] },
      '戌': { timing: '感情专一持久，从一而终', characteristics: ['忠诚可靠', '有正义感', '重视承诺'] },
      '亥': { timing: '感情包容大度，海纳百川', characteristics: ['包容大度', '富有同情', '善于理解'] },
    };

    const getLoveStyle = () => {
      if (isMale) {
        const malePrefs: Record<string, Record<string, string>> = {
          '子': { '木': '欣赏聪慧灵动、善于交流的女性', '火': '喜欢聪明活泼、能带来快乐的伴侣', '土': '欣赏机智过人、善于理财的女性', '金': '喜欢聪慧温柔、善解人意的伴侣', '水': '欣赏志趣相投、心灵相通的女性' },
          '丑': { '木': '喜欢务实稳重、持家有道的女性', '火': '欣赏踏实可靠、能够共同奋斗的伴侣', '土': '喜欢贤惠勤劳、善于积累的女性', '金': '欣赏稳重贤淑、重视家庭的伴侣', '水': '喜欢务实低调、默默付出的女性' },
          '寅': { '木': '欣赏有事业心、能够共同进步的女性', '火': '喜欢积极向上、充满正能量的伴侣', '土': '欣赏独立自主、有主见的女性', '金': '喜欢有魄力、敢于拼搏的伴侣', '水': '欣赏有想法、不甘平庸的女性' },
          '卯': { '木': '喜欢温柔贤淑、善于持家的女性', '火': '欣赏优雅知性、有气质的伴侣', '土': '喜欢体贴入微、善解人意的女性', '金': '欣赏温和可人、让人舒适的伴侣', '水': '喜欢有艺术气息、浪漫多情的女性' },
          '辰': { '木': '欣赏有志向、能够共同实现目标的女性', '火': '喜欢有抱负、积极进取的伴侣', '土': '欣赏有规划、目标明确的女性', '金': '喜欢有责任感、值得信赖的伴侣', '水': '欣赏有远见、善于规划的女性' },
          '巳': { '木': '喜欢聪慧灵巧、善于经营的女性', '火': '欣赏精明能干、有能力的伴侣', '土': '喜欢细心周到、善于理财的女性', '金': '欣赏聪明上进、有品位的伴侣', '水': '喜欢善于思考、内涵丰富的女性' },
          '午': { '木': '欣赏热情开朗、充满活力的女性', '火': '喜欢阳光积极、能够带来欢乐的伴侣', '土': '欣赏热情大方、性格开朗的女性', '金': '喜欢活泼外向、社交能力强的伴侣', '水': '欣赏有激情、敢于追求的女性' },
          '未': { '木': '喜欢温柔善良、家庭观念强的女性', '火': '欣赏贤惠持家、心地善良的伴侣', '土': '喜欢温和包容、善于照顾的女性', '金': '欣赏善良朴实、顾家有爱的伴侣', '水': '喜欢温馨体贴、给人安全感的女性' },
          '申': { '木': '欣赏聪明机智、善于应变的女性', '火': '喜欢灵活变通、不拘一格的伴侣', '土': '欣赏适应力强、能够共同成长的女性', '金': '喜欢机敏过人、善于沟通的伴侣', '水': '欣赏善于变通、能够互相理解的女性' },
          '酉': { '木': '喜欢有品位、注重生活质量的女性', '火': '欣赏精致优雅、追求完美的伴侣', '土': '喜欢精明能干、有审美眼光的女性', '金': '欣赏志趣相投、品味相近的伴侣', '水': '喜欢有内涵、注重细节的女性' },
          '戌': { '木': '欣赏忠诚可靠、重视承诺的女性', '火': '喜欢正直坦荡、值得信赖的伴侣', '土': '欣赏忠诚专一、有安全感的女性', '金': '喜欢信守承诺、责任感强的伴侣', '水': '欣赏真诚可靠、从一而终的女性' },
          '亥': { '木': '喜欢包容大度、善于理解的女性', '火': '欣赏开明智慧、善于沟通的伴侣', '土': '喜欢温柔体贴、善于倾听的女性', '金': '欣赏有智慧、心胸宽广的伴侣', '水': '喜欢心灵相通、能够深度交流的女性' },
        };
        return malePrefs[diZhi]?.[riYuanWuXing] || '欣赏能够理解自己、共同成长的伴侣';
      } else {
        const femalePrefs: Record<string, Record<string, string>> = {
          '子': { '木': '欣赏聪明睿智、有思想深度的男性', '火': '喜欢机智幽默、能够带来欢乐的伴侣', '土': '欣赏头脑灵活、善于理财的男性', '金': '喜欢聪慧体贴、善于沟通的伴侣', '水': '欣赏志同道合、心灵相通的男性' },
          '丑': { '木': '喜欢稳重踏实、有责任感的男性', '火': '欣赏务实可靠、能够给予安全感的伴侣', '土': '喜欢勤劳肯干、善于积累的男性', '金': '欣赏稳重可靠、重视家庭的伴侣', '水': '喜欢踏实低调、默默奋斗的男性' },
          '寅': { '木': '欣赏有事业心、积极进取的男性', '火': '喜欢有魄力、敢于担当的伴侣', '土': '欣赏有主见、能够带领方向的男性', '金': '喜欢有闯劲、不甘平庸的伴侣', '水': '欣赏有抱负、勇于拼搏的男性' },
          '卯': { '木': '喜欢温柔体贴、懂得浪漫的男性', '火': '欣赏有气质、温文尔雅的伴侣', '土': '喜欢细心体贴、善解人意的男性', '金': '欣赏温和有礼、给人舒适感的伴侣', '水': '喜欢有艺术气息、懂得欣赏美的男性' },
          '辰': { '木': '欣赏有志向、目标明确的男性', '火': '喜欢有抱负、积极进取的伴侣', '土': '欣赏有规划、脚踏实地的男性', '金': '喜欢有责任感、能够托付终身的伴侣', '水': '欣赏有远见、善于规划未来的男性' },
          '巳': { '木': '喜欢聪慧能干、善于经营的男性', '火': '欣赏精明干练、有能力的伴侣', '土': '喜欢细心周到、有商业头脑的男性', '金': '欣赏聪明上进、有事业心的伴侣', '水': '喜欢善于思考、内涵丰富的男性' },
          '午': { '木': '欣赏热情阳光、充满活力的男性', '火': '喜欢开朗积极、有感染力的伴侣', '土': '欣赏热情大方、性格豪爽的男性', '金': '喜欢活力四射、社交能力强的伴侣', '水': '欣赏有激情、勇于追求的男性' },
          '未': { '木': '喜欢温和善良、重视家庭的男性', '火': '欣赏顾家有爱、心地善良的伴侣', '土': '喜欢温和包容、有责任感的男性', '金': '欣赏善良正直、以家为重的伴侣', '水': '喜欢温馨体贴、能够给予安全感的男性' },
          '申': { '木': '欣赏聪明机智、应变能力强的男性', '火': '喜欢灵活多变、有趣有料的伴侣', '土': '欣赏适应力强、善于沟通的男性', '金': '喜欢机敏睿智、头脑灵活的伴侣', '水': '欣赏善于变通、能够互相成长的男性' },
          '酉': { '木': '喜欢有品位、注重生活质量的男性', '火': '欣赏精致有型、追求完美的伴侣', '土': '喜欢精明能干、有审美眼光的男性', '金': '欣赏志趣相投、品味相近的伴侣', '水': '喜欢有内涵、注重品质的男性' },
          '戌': { '木': '欣赏忠诚专一、信守承诺的男性', '火': '喜欢正直可靠、值得托付的伴侣', '土': '欣赏忠诚可靠、有安全感的男性', '金': '喜欢责任感强、说到做到的伴侣', '水': '欣赏真诚可靠、从一而终的男性' },
          '亥': { '木': '喜欢包容大度、善于理解的男性', '火': '欣赏开明睿智、善于沟通的伴侣', '土': '喜欢温柔体贴、善于倾听的男性', '金': '欣赏有智慧、心胸宽广的伴侣', '水': '喜欢心灵相通、能够深度交流的男性' },
        };
        return femalePrefs[diZhi]?.[riYuanWuXing] || '期待能够理解自己、共同成长的伴侣';
      }
    };

    const getExpectation = () => {
      const baseExpectations: Record<string, { male: string; female: string }> = {
        '子': { male: '期待与伴侣有深入的精神交流，共同探索人生', female: '期待伴侣既聪明又体贴，能够给予情感上的满足' },
        '丑': { male: '期待共同积累财富，建立稳固的家庭基础', female: '期待伴侣稳重可靠，能够给予长久的安全感' },
        '寅': { male: '期待与伴侣共同奋斗，创造更好的未来', female: '期待伴侣有上进心，能够一起拼搏成长' },
        '卯': { male: '期待和谐温馨的家庭氛围，享受平淡中的浪漫', female: '期待伴侣温柔浪漫，能够营造甜蜜的二人世界' },
        '辰': { male: '期待共同实现人生目标，建功立业', female: '期待伴侣有志向有规划，能够共同追求梦想' },
        '巳': { male: '期待物质与精神双丰收，过有品质的生活', female: '期待伴侣聪明能干，能够共同经营美好生活' },
        '午': { male: '期待充满激情与活力的婚姻生活', female: '期待伴侣热情阳光，能够带来快乐和正能量' },
        '未': { male: '期待温馨甜蜜的家庭生活，相濡以沫', female: '期待伴侣顾家有爱，能够给予温暖和关怀' },
        '申': { male: '期待丰富多彩的婚姻生活，不断探索新鲜事物', female: '期待伴侣机智灵活，能够让生活充满惊喜' },
        '酉': { male: '期待精致有品质的生活方式，共同提升生活品味', female: '期待伴侣有品位有追求，能够一起提升生活质量' },
        '戌': { male: '期待从一而终的婚姻承诺，相守一生', female: '期待伴侣忠诚专一，能够给予一生的陪伴' },
        '亥': { male: '期待心灵的深度交流，彼此理解包容', female: '期待伴侣包容大度，能够理解自己的一切' },
      };
      return isMale ? baseExpectations[diZhi]?.male : baseExpectations[diZhi]?.female || '期待幸福美满的婚姻生活';
    };

    const getDetailAdvice = () => {
      const advices: Record<string, string> = {
        '木': isMale ? `${name}日元属木，在婚姻中要学会柔软，不要过于坚持己见` : `${name}日元属木，在婚姻中保持独立的同时也要懂得依赖`,
        '火': isMale ? `${name}日元属火，在婚姻中注意控制情绪，不要太过急躁` : `${name}日元属火，在婚姻中保持热情但也要给对方空间`,
        '土': isMale ? `${name}日元属土，在婚姻中是可靠的依靠，但也要表达情感` : `${name}日元属土，在婚姻中是稳定的支柱，但也需要浪漫`,
        '金': isMale ? `${name}日元属金，在婚姻中要学会柔和表达，不要太过强势` : `${name}日元属金，在婚姻中保持原则但也要懂得变通`,
        '水': isMale ? `${name}日元属水，在婚姻中善于沟通但也要更加坚定` : `${name}日元属水，在婚姻中善解人意但也要表达需求`,
      };
      return advices[riYuanWuXing] || `${name}在婚姻中要学会相互理解和包容`;
    };

    const baseDesc = baseDescriptions[diZhi] || { timing: '待分析', characteristics: ['待分析'] };

    return {
      ...baseDesc,
      loveStyle: getLoveStyle(),
      expectation: getExpectation(),
      detailAdvice: getDetailAdvice(),
    };
  };

  const p1Desc = getPalaceDescription(p1Palace, bazi1.gender, bazi1.riYuan, bazi1.riYuanWuXing, name1);
  const p2Desc = getPalaceDescription(p2Palace, bazi2.gender, bazi2.riYuan, bazi2.riYuanWuXing, name2);

  const liuHePairs = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']];
  const chongPairs = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
  const haiPairs = [['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']];
  
  const isLiuHe = liuHePairs.some(([a, b]) => (p1Palace === a && p2Palace === b) || (p1Palace === b && p2Palace === a));
  const isChong = chongPairs.some(([a, b]) => (p1Palace === a && p2Palace === b) || (p1Palace === b && p2Palace === a));
  const isHai = haiPairs.some(([a, b]) => (p1Palace === a && p2Palace === b) || (p1Palace === b && p2Palace === a));

  let relationResult = { type: '平和', color: '#8B0000', analysis: '' };
  if (isLiuHe) {
    relationResult = { type: '六合', color: '#006400', analysis: `${name1}（${p1Palace}）与${name2}（${p2Palace}）婚姻宫六合，这是非常吉利的配对！双方在感情上自然契合，容易互相理解，婚后生活和谐美满。` };
  } else if (isChong) {
    relationResult = { type: '相冲', color: '#8B4513', analysis: `${name1}（${p1Palace}）与${name2}（${p2Palace}）婚姻宫相冲，感情上可能会有较多磨合。但相冲也代表互相吸引的对立面，只要双方学会包容退让，反而能激发出更强的感情。` };
  } else if (isHai) {
    relationResult = { type: '相害', color: '#A52A2A', analysis: `${name1}（${p1Palace}）与${name2}（${p2Palace}）婚姻宫相害，日常相处中可能容易产生小摩擦。建议多沟通、少计较，用理解化解矛盾。` };
  } else if (p1Palace === p2Palace) {
    relationResult = { type: '同宫', color: '#00008B', analysis: `双方婚姻宫都是${p1Palace}，说明在感情观念和生活方式上非常相似，容易达成共识，但也要注意避免过于相似导致的审美疲劳。` };
  } else {
    relationResult = { type: '平和', color: '#3E2723', analysis: `${name1}（${p1Palace}）与${name2}（${p2Palace}）婚姻宫关系平和，没有明显的冲合关系，感情发展比较平稳，可以在日常相处中慢慢培养默契。` };
  }

  return (
    <div className="space-y-8 font-serif">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { name: name1, bazi: bazi1, desc: p1Desc, palace: p1Palace, color: 'border-[#3E2723]' },
          { name: name2, bazi: bazi2, desc: p2Desc, palace: p2Palace, color: 'border-[#8B0000]' }
        ].map((p, i) => (
          <div key={i} className={`p-6 rounded-none border-2 ${p.color} bg-[#FDFBF7] relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#F5F2E9] transform rotate-45 translate-x-8 -translate-y-8 pointer-events-none opacity-50" />
            
            <div className="flex items-center gap-4 mb-6 relative">
              <div className="w-12 h-12 rounded-sm bg-[#8B0000] flex items-center justify-center shadow-lg border border-[#FFD700]/30 transform group-hover:scale-105 transition-transform">
                <span className="text-xl font-serif text-white">{p.palace}</span>
              </div>
              <div>
                <p className="font-bold text-lg text-[#3E2723]">{p.name}之配偶宫</p>
                <p className="text-[10px] text-[#8D6E63] tracking-widest italic opacity-80">“{p.desc.timing}”</p>
              </div>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-[#5D4037]">
              <p className="text-[12px] text-[#8D6E63] border-b border-[#D7CCC8] pb-1 italic opacity-70">
                坐支 {p.palace} · {p.bazi.gender === 'male' ? '妻宫' : '夫宫'}
              </p>
              <div className="flex gap-3 p-3 bg-[#FFF9ED] border-l-2 border-[#8B0000]/50 rounded-sm">
                <span className="shrink-0 text-[#8B0000] font-bold">【偏好】</span>
                <p className="text-[#3E2723]">{p.desc.loveStyle}</p>
              </div>
              <div className="flex gap-3 p-3 bg-[#FFF9ED] border-l-2 border-[#3E2723]/50 rounded-sm">
                <span className="shrink-0 text-[#3E2723] font-bold">【期待】</span>
                <p className="text-[#3E2723]">{p.desc.expectation}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {p.desc.characteristics.map((c, idx) => (
                <span key={idx} className="text-[10px] px-2 py-0.5 bg-[#F5F2E9] border border-[#D7CCC8] text-[#8D6E63] rounded-sm group-hover:bg-[#8B0000]/5 group-hover:border-[#8B0000]/20 transition-colors">{c}</span>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#D7CCC8]/50 flex gap-2">
              <span className="shrink-0 text-[#8B0000] opacity-60">💡</span>
              <p className="text-[11px] text-[#8D6E63] leading-relaxed italic">{p.desc.detailAdvice}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-none border-2 border-[#8B0000]/30 bg-[#FFF9ED] shadow-md relative group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 bg-[#8B0000] text-white text-[10px] py-1.5 rounded-none font-serif tracking-[0.2em] border border-[#FFD700]/50 shadow-sm group-hover:bg-[#A30000] transition-colors">
          配偶宫合论 · {relationResult.type}
        </div>
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#8B0000]/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#8B0000]/20 pointer-events-none" />
        <div className="space-y-4">
          <p className="text-[#3E2723] leading-relaxed text-sm italic text-center px-4 pt-2">
            “{relationResult.analysis}”
          </p>
          <div className="pt-4 border-t border-[#8B0000]/10 text-center">
            <p className="text-[11px] text-[#8D6E63] italic">
              💡 建议：婚姻宫的冲合仅是先天磁场的引力，真正的美满还需双方后天的悉心经营与宽容。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 子嗣分析组件 - 增强个性化版本
 */
function ChildrenSection({ bazi1, bazi2, name1, name2 }: { 
  bazi1: PersonBazi; 
  bazi2: PersonBazi;
  name1: string;
  name2: string;
}) {
  // 时柱与子女运势相关
  const p1Hour = bazi1.siZhu.hour;
  const p2Hour = bazi2.siZhu.hour;

  // 根据时柱地支、天干、性别和日元分析子女运势
  const getChildrenAnalysis = (
    diZhi: string, 
    tianGan: string, 
    gender: string, 
    riYuan: string, 
    riYuanWuXing: string,
    name: string
  ) => {
    const isMale = gender === 'male';
    
    // 地支基础特征
    const diZhiTraits: Record<string, { 
      luck: string; 
      character: string[]; 
      personality: string;
      talent: string;
      modernEducation: string[];
    }> = {
      '子': { 
        luck: '子女聪慧机敏', 
        character: ['思维敏捷', '好奇心强', '学习能力强'],
        personality: '子女天生聪明，对新事物充满好奇，善于思考和分析问题',
        talent: '适合发展逻辑思维和语言表达能力',
        modernEducation: ['编程与人工智能', '数学奥赛', '辩论演讲', '外语学习']
      },
      '丑': { 
        luck: '子女踏实稳重', 
        character: ['勤劳踏实', '耐心细致', '责任心强'],
        personality: '子女性格沉稳，做事有条不紊，能够持之以恒地完成目标',
        talent: '适合发展专业技能和动手能力',
        modernEducation: ['财经管理', '工程技术', '医学健康', '农业科技']
      },
      '寅': { 
        luck: '子女进取有为', 
        character: ['勇敢进取', '领导力强', '有冲劲'],
        personality: '子女天生具有领导气质，敢想敢做，有创业精神',
        talent: '适合发展领导力和决策能力',
        modernEducation: ['企业管理', '体育竞技', '军事国防', '创业创新']
      },
      '卯': { 
        luck: '子女温和善良', 
        character: ['温柔体贴', '人缘好', '有艺术天赋'],
        personality: '子女性格温和，善解人意，在社交中很受欢迎',
        talent: '适合发展艺术感知和人际交往能力',
        modernEducation: ['艺术设计', '音乐舞蹈', '心理咨询', '公共关系']
      },
      '辰': { 
        luck: '子女志向远大', 
        character: ['有抱负', '责任感强', '做事有规划'],
        personality: '子女从小有明确目标，做事认真负责，有担当精神',
        talent: '适合发展规划能力和专业深度',
        modernEducation: ['建筑工程', '城市规划', '法律政务', '项目管理']
      },
      '巳': { 
        luck: '子女灵巧聪慧', 
        character: ['聪明伶俐', '口才好', '善于经营'],
        personality: '子女思维灵活，善于表达，有商业头脑',
        talent: '适合发展沟通能力和商业思维',
        modernEducation: ['市场营销', '电子商务', '新媒体运营', '金融投资']
      },
      '午': { 
        luck: '子女热情开朗', 
        character: ['阳光积极', '有感染力', '表现欲强'],
        personality: '子女性格外向，充满活力，能够感染和带动身边的人',
        talent: '适合发展表演能力和公众表达',
        modernEducation: ['传媒影视', '主持表演', '娱乐产业', '体育运动']
      },
      '未': { 
        luck: '子女孝顺贴心', 
        character: ['善良孝顺', '懂得感恩', '家庭观念强'],
        personality: '子女心地善良，从小懂事，与家人关系亲密',
        talent: '适合发展服务意识和情感智慧',
        modernEducation: ['教育培训', '社会工作', '餐饮服务', '健康护理']
      },
      '申': { 
        luck: '子女机敏多变', 
        character: ['反应快', '适应力强', '创意丰富'],
        personality: '子女头脑灵活，善于变通，能够快速适应新环境',
        talent: '适合发展创新能力和应变能力',
        modernEducation: ['软件开发', '人工智能', '游戏设计', '科技创新']
      },
      '酉': { 
        luck: '子女精致品味', 
        character: ['追求完美', '有审美', '注重细节'],
        personality: '子女有较高的审美品味，做事精益求精',
        talent: '适合发展审美能力和精细技艺',
        modernEducation: ['珠宝设计', '时尚产业', '精密制造', '品质管理']
      },
      '戌': { 
        luck: '子女忠诚正直', 
        character: ['正义感强', '守信用', '有担当'],
        personality: '子女为人正直，重视承诺，有强烈的责任感',
        talent: '适合发展领导力和社会责任',
        modernEducation: ['法律法务', '公务行政', '安全防护', '公益慈善']
      },
      '亥': { 
        luck: '子女包容智慧', 
        character: ['大度宽容', '富有智慧', '想象力丰富'],
        personality: '子女心胸开阔，善于思考，有哲学家气质',
        talent: '适合发展思辨能力和创造力',
        modernEducation: ['哲学研究', '文学创作', '心理学', '科学研究']
      },
    };
    
    // 根据时干判断子女缘分特点
    const yangGan = ['甲', '丙', '戊', '庚', '壬'];
    const isYangGan = yangGan.includes(tianGan);
    const tianGanAnalysis = isYangGan 
      ? { hint: '子女缘较旺', detail: '时干为阳干，子女缘分较好，与子女互动频繁' }
      : { hint: '子女贵而精', detail: '时干为阴干，子女虽不多但质量高，关系亲密' };
    
    // 根据性别分析与子女的关系
    const parentRole = isMale 
      ? '作为父亲，在子女教育中扮演引导者和榜样的角色'
      : '作为母亲，在子女成长中给予温暖和细腻的关爱';
    
    // 根据日元五行分析教育方式
    const educationStyle: Record<string, string> = {
      '木': '适合采用鼓励式教育，培养子女的自信和创造力',
      '火': '适合采用激励式教育，激发子女的热情和积极性',
      '土': '适合采用稳健式教育，给子女足够的安全感和耐心',
      '金': '适合采用规范式教育，培养子女的纪律性和执行力',
      '水': '适合采用启发式教育，引导子女独立思考和探索',
    };
    
    const traits = diZhiTraits[diZhi] || { 
      luck: '待分析', 
      character: ['待分析'], 
      personality: '待分析',
      talent: '待分析',
      modernEducation: ['待分析']
    };
    
    return { 
      ...traits, 
      tianGanAnalysis,
      parentRole,
      educationStyle: educationStyle[riYuanWuXing] || '根据子女特点灵活调整教育方式',
    };
  };

  const p1Analysis = getChildrenAnalysis(p1Hour.diZhi, p1Hour.tianGan, bazi1.gender, bazi1.riYuan, bazi1.riYuanWuXing, name1);
  const p2Analysis = getChildrenAnalysis(p2Hour.diZhi, p2Hour.tianGan, bazi2.gender, bazi2.riYuan, bazi2.riYuanWuXing, name2);

  // 分析双方时柱关系
  const liuHePairs = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']];
  const chongPairs = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
  
  const isLiuHe = liuHePairs.some(([a, b]) => 
    (p1Hour.diZhi === a && p2Hour.diZhi === b) || (p1Hour.diZhi === b && p2Hour.diZhi === a)
  );
  const isChong = chongPairs.some(([a, b]) => 
    (p1Hour.diZhi === a && p2Hour.diZhi === b) || (p1Hour.diZhi === b && p2Hour.diZhi === a)
  );
  const isSame = p1Hour.diZhi === p2Hour.diZhi;

  // 生成综合分析
  const getComprehensiveAnalysis = () => {
    let base = '';
    let advice = '';
    
    if (isLiuHe) {
      base = `双方时柱六合（${p1Hour.diZhi}合${p2Hour.diZhi}），这是非常吉利的子女运势组合！说明两人在教育理念上容易达成共识，共同培养出优秀的子女。`;
      advice = '建议充分发挥这种默契，共同参与子女的成长过程。';
    } else if (isChong) {
      base = `双方时柱相冲（${p1Hour.diZhi}冲${p2Hour.diZhi}），在子女教育方面可能会有不同观点。`;
      advice = '建议多沟通协调，将不同观点转化为互补优势，让子女获得更全面的教育。';
    } else if (isSame) {
      base = `双方时柱相同（都是${p1Hour.diZhi}），在子女教育理念上高度一致，容易形成统一战线。`;
      advice = '注意避免过于相似导致教育方式单一，可以适当引入多元化元素。';
    } else {
      base = `双方时柱（${p1Hour.diZhi}与${p2Hour.diZhi}）关系平和，在子女培养方面可以各展所长。`;
      advice = '建议根据子女的实际特点，灵活调整教育方式，取长补短。';
    }
    
    return { base, advice };
  };

  const comprehensiveAnalysis = getComprehensiveAnalysis();

  // 综合两人时柱推荐的教育方向
  const getCombinedEducationSuggestions = () => {
    const p1Edu = p1Analysis.modernEducation;
    const p2Edu = p2Analysis.modernEducation;
    
    // 找出共同方向
    const combined: string[] = [];
    if (p1Edu.some(e => e.includes('科技') || e.includes('编程') || e.includes('人工智能'))) {
      combined.push('科技创新');
    }
    if (p1Edu.some(e => e.includes('艺术') || e.includes('设计')) || p2Edu.some(e => e.includes('艺术') || e.includes('设计'))) {
      combined.push('艺术创意');
    }
    if (p1Edu.some(e => e.includes('管理') || e.includes('领导')) || p2Edu.some(e => e.includes('管理') || e.includes('领导'))) {
      combined.push('管理领导');
    }
    if (p1Edu.some(e => e.includes('商') || e.includes('金融')) || p2Edu.some(e => e.includes('商') || e.includes('金融'))) {
      combined.push('商业金融');
    }
    
    if (combined.length === 0) {
      combined.push('根据子女兴趣培养');
    }
    
    return combined;
  };

  return (
    <div className="space-y-8 font-serif">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { name: name1, bazi: bazi1, analysis: p1Analysis, hour: p1Hour, color: 'border-[#3E2723]' },
          { name: name2, bazi: bazi2, analysis: p2Analysis, hour: p2Hour, color: 'border-[#8B0000]' }
        ].map((p, i) => (
          <div key={i} className={`p-6 rounded-none border-2 ${p.color} bg-[#FDFBF7] relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#F5F2E9] transform rotate-45 translate-x-8 -translate-y-8 pointer-events-none opacity-50" />
            
            <div className="flex items-center gap-4 mb-6 relative">
              <div className="text-center w-12 h-14 rounded-sm bg-[#8B0000] flex flex-col items-center justify-center shadow-lg border border-[#FFD700]/30 transform group-hover:scale-105 transition-transform">
                <span className="text-xs text-white/80 leading-tight">{p.hour.tianGan}</span>
                <span className="text-lg font-bold text-white leading-none">{p.hour.diZhi}</span>
              </div>
              <div>
                <p className="font-bold text-lg text-[#3E2723]">{p.name}之子女宫</p>
                <p className="text-[10px] text-[#8B0000] tracking-widest italic opacity-80">“{p.analysis.luck}”</p>
              </div>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-[#5D4037]">
              <div className="flex flex-wrap gap-1 mb-2">
                {p.analysis.character.map((c, idx) => (
                  <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-[#F5F2E9] border border-[#D7CCC8] text-[#8D6E63] rounded-sm">{c}</span>
                ))}
              </div>
              <p className="text-[12px] text-[#5D4037] italic mb-4 opacity-90">{p.analysis.personality}</p>
              
              <div className="space-y-2">
                <div className="flex gap-3 p-3 bg-[#FFF9ED] border-l-2 border-[#8B0000]/50 rounded-sm">
                  <span className="shrink-0 text-[#8B0000] font-bold">【子缘】</span>
                  <p className="text-[#3E2723]">{p.analysis.tianGanAnalysis.hint}</p>
                </div>
                <div className="flex gap-3 p-3 bg-[#FFF9ED] border-l-2 border-[#3E2723]/50 rounded-sm">
                  <span className="shrink-0 text-[#3E2723] font-bold">【亲子】</span>
                  <p className="text-[#3E2723]">{p.analysis.parentRole}</p>
                </div>
                <div className="flex gap-3 p-3 bg-[#FFF9ED] border-l-2 border-[#5D4037]/50 rounded-sm">
                  <span className="shrink-0 text-[#5D4037] font-bold">【教育】</span>
                  <p className="text-[#3E2723]">{p.analysis.educationStyle}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#D7CCC8]/50">
              <p className="text-[10px] text-[#8B0000] mb-2 tracking-widest uppercase opacity-70">🎯 推荐培养方向</p>
              <div className="flex flex-wrap gap-2">
                {p.analysis.modernEducation.map((e, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 bg-white border border-[#D7CCC8] text-[#5D4037] rounded-sm group-hover:border-[#8B0000]/30 transition-colors">{e}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-none border-2 border-[#8B0000]/30 bg-[#FFF9ED] shadow-md relative group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 bg-[#8B0000] text-white text-[10px] py-1.5 rounded-none font-serif tracking-[0.2em] border border-[#FFD700]/50 shadow-sm group-hover:bg-[#A30000] transition-colors">
          子嗣运势 · 综合合论
        </div>
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#8B0000]/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#8B0000]/20 pointer-events-none" />
        
        <div className="space-y-4">
          <p className="text-[#3E2723] leading-relaxed text-sm italic text-center px-4 pt-2">
            “{comprehensiveAnalysis.base}”
          </p>
          <div className="pt-4 border-t border-[#8B0000]/10 flex flex-col items-center gap-2">
            <p className="text-[11px] text-[#8D6E63] italic">
              💡 {comprehensiveAnalysis.advice}
            </p>
            <p className="text-[11px] text-[#5D4037] font-bold">
              重点培养建议：{getCombinedEducationSuggestions().join('、')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 姻缘缘分分析组件 - 核心模块，突出婚姻配对
 */
function YinYuanSection({ bazi1, bazi2, name1, name2, overallScore }: { 
  bazi1: PersonBazi; 
  bazi2: PersonBazi;
  name1: string;
  name2: string;
  overallScore: number;
}) {
  // 日元五行关系分析
  const wx1 = bazi1.riYuanWuXing;
  const wx2 = bazi2.riYuanWuXing;
  
  // 五行相生关系
  const shengRelation: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  // 五行相克关系
  const keRelation: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
  
  // 判断关系类型
  const getRelationType = () => {
    if (shengRelation[wx1] === wx2) return { type: '相生', desc: `${wx1}生${wx2}`, rating: '上等姻缘' };
    if (shengRelation[wx2] === wx1) return { type: '相生', desc: `${wx2}生${wx1}`, rating: '上等姻缘' };
    if (wx1 === wx2) return { type: '比和', desc: `${wx1}与${wx2}同属`, rating: '中上姻缘' };
    if (keRelation[wx1] === wx2) return { type: '相克', desc: `${wx1}克${wx2}`, rating: '需要磨合' };
    if (keRelation[wx2] === wx1) return { type: '相克', desc: `${wx2}克${wx1}`, rating: '需要磨合' };
    return { type: '中性', desc: '五行关系平和', rating: '中等姻缘' };
  };
  
  const relation = getRelationType();
  
  // 日支婚姻宫关系
  const p1Day = bazi1.siZhu.day.diZhi;
  const p2Day = bazi2.siZhu.day.diZhi;
  const liuHePairs = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']];
  const chongPairs = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
  
  const isPalaceLiuHe = liuHePairs.some(([a, b]) => 
    (p1Day === a && p2Day === b) || (p1Day === b && p2Day === a)
  );
  const isPalaceChong = chongPairs.some(([a, b]) => 
    (p1Day === a && p2Day === b) || (p1Day === b && p2Day === a)
  );

  // 年支关系
  const p1Year = bazi1.siZhu.year.diZhi;
  const p2Year = bazi2.siZhu.year.diZhi;
  const isYearLiuHe = liuHePairs.some(([a, b]) => 
    (p1Year === a && p2Year === b) || (p1Year === b && p2Year === a)
  );

  // 计算姻缘指数 (基于多个因素)
  let yinYuanScore = overallScore;
  if (isPalaceLiuHe) yinYuanScore += 8;
  if (isYearLiuHe) yinYuanScore += 5;
  if (relation.type === '相生') yinYuanScore += 5;
  if (isPalaceChong) yinYuanScore -= 3;
  yinYuanScore = Math.min(100, Math.max(50, yinYuanScore));

  // 姻缘等级
  const getYinYuanLevel = (score: number) => {
    if (score >= 90) return { emoji: '💕💕💕', label: '天作之合', color: 'text-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-950/30' };
    if (score >= 80) return { emoji: '💕💕', label: '上等良缘', color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-950/30' };
    if (score >= 70) return { emoji: '💕', label: '美满姻缘', color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-950/30' };
    if (score >= 60) return { emoji: '❤️', label: '和谐之缘', color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950/30' };
    return { emoji: '🤝', label: '需要经营', color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/30' };
  };

  const level = getYinYuanLevel(yinYuanScore);

  // 最佳结婚年份建议 (简化版)
  const currentYear = new Date().getFullYear();
  const getBestWeddingYears = () => {
    const years: { year: number; reason: string }[] = [];
    const zodiacCycle = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    // 找出与双方婚姻宫六合的年份
    for (let i = 0; i <= 5; i++) {
      const year = currentYear + i;
      const yearZhi = zodiacCycle[(year - 4) % 12]; // 计算年支
      
      // 检查是否与双方婚姻宫形成六合
      const isHe1 = liuHePairs.some(([a, b]) => 
        (p1Day === a && yearZhi === b) || (p1Day === b && yearZhi === a)
      );
      const isHe2 = liuHePairs.some(([a, b]) => 
        (p2Day === a && yearZhi === b) || (p2Day === b && yearZhi === a)
      );
      
      if (isHe1 && isHe2) {
        years.push({ year, reason: '与双方婚姻宫都形成六合，大吉' });
      } else if (isHe1) {
        years.push({ year, reason: `与${name1}婚姻宫六合` });
      } else if (isHe2) {
        years.push({ year, reason: `与${name2}婚姻宫六合` });
      }
    }
    
    return years.slice(0, 3);
  };

  const bestYears = getBestWeddingYears();

  // 姻缘关键点分析
  const getKeyPoints = () => {
    const points: { type: 'good' | 'caution'; text: string }[] = [];
    
    if (relation.type === '相生') {
      points.push({ type: 'good', text: `日元${relation.desc}，感情自然流动，互相成就` });
    } else if (relation.type === '比和') {
      points.push({ type: 'good', text: '日元同属性，志趣相投，默契度高' });
    }
    
    if (isPalaceLiuHe) {
      points.push({ type: 'good', text: '婚姻宫六合，感情基础稳固，缘分深厚' });
    }
    if (isYearLiuHe) {
      points.push({ type: 'good', text: '年支六合，家庭背景和谐，长辈支持' });
    }
    
    if (isPalaceChong) {
      points.push({ type: 'caution', text: '婚姻宫相冲，需要多包容理解，化解矛盾' });
    }
    if (relation.type === '相克') {
      points.push({ type: 'caution', text: `日元${relation.desc}，个性有差异，需要互相迁就` });
    }

    // 如果没有特别的点，添加通用评价
    if (points.length === 0) {
      points.push({ type: 'good', text: '八字关系平和，感情发展稳定' });
    }

    return points;
  };

  const keyPoints = getKeyPoints();

  return (
    <div className="space-y-8 font-serif">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左侧：缘分要点 */}
        <div className="p-6 rounded-none border-2 border-[#3E2723] bg-[#FDFBF7] relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#F5F2E9] transform rotate-45 translate-x-8 -translate-y-8 pointer-events-none opacity-50" />
          <div className="flex items-center gap-4 mb-6 relative">
            <div className="w-12 h-12 rounded-sm bg-[#8B0000] flex items-center justify-center shadow-lg border border-[#FFD700]/30 transform group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-[#3E2723]">缘分要点</p>
              <p className="text-[10px] text-[#8B0000] tracking-widest italic opacity-80">“天作之合 · 缘定三生”</p>
            </div>
          </div>
          
          <div className="space-y-4 text-sm leading-relaxed text-[#5D4037]">
            <div className="space-y-2">
              {keyPoints.map((point, i) => (
                <div key={i} className={`flex items-start gap-3 p-2 bg-[#FFF9ED] border-l-2 ${
                  point.type === 'good' ? 'border-green-600/50 text-green-800' : 'border-amber-600/50 text-amber-800'
                } rounded-sm`}>
                  <span className="shrink-0">{point.type === 'good' ? '✓' : '⚠'}</span>
                  <p className="text-[12px] italic">{point.text}</p>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-[#D7CCC8]/50 flex justify-between items-center">
              <span className="text-xs text-[#8D6E63]">五行关系：</span>
              <Badge variant="outline" className={`text-[10px] ${relation.type === '相生' ? 'text-green-600 border-green-200' : relation.type === '相克' ? 'text-amber-600 border-amber-200' : ''}`}>
                {relation.desc}（{relation.rating}）
              </Badge>
            </div>
          </div>
        </div>

        {/* 右侧：吉日建议 */}
        <div className="p-6 rounded-none border-2 border-[#8B0000] bg-[#FDFBF7] relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#F5F2E9] transform rotate-45 translate-x-8 -translate-y-8 pointer-events-none opacity-50" />
          <div className="flex items-center gap-4 mb-6 relative">
            <div className="w-12 h-12 rounded-sm bg-[#8B0000] flex items-center justify-center shadow-lg border border-[#FFD700]/30 transform group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-[#3E2723]">适宜年份</p>
              <p className="text-[10px] text-[#8B0000] tracking-widest italic opacity-80">“良辰吉日 · 喜结良缘”</p>
            </div>
          </div>

          <div className="space-y-4">
            {bestYears.length > 0 ? (
              <div className="space-y-3">
                {bestYears.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#FFF9ED] border border-[#D7CCC8]/30 rounded-sm">
                    <div className="text-center min-w-[60px] py-1 bg-[#8B0000] text-white rounded-sm shadow-sm">
                      <span className="text-xs font-bold">{item.year}年</span>
                    </div>
                    <p className="text-[12px] text-[#5D4037] italic">{item.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#F5F2E9]/30 border border-dashed border-[#D7CCC8]">
                <p className="text-xs text-[#8D6E63] italic">
                  近五年内均可选择，建议结合双方流年运势综合考虑。
                </p>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-[#D7CCC8]/50 text-center">
              <p className="text-[10px] text-[#8D6E63] italic flex items-center justify-center gap-2">
                <span>💡</span> 具体日期建议结合老黄历择吉
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 姻缘总评 */}
      <div className="p-6 rounded-none border-2 border-[#8B0000]/30 bg-[#FFF9ED] shadow-md relative group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 bg-[#8B0000] text-white text-[10px] py-1.5 rounded-none font-serif tracking-[0.2em] border border-[#FFD700]/50 shadow-sm group-hover:bg-[#A30000] transition-colors">
          姻缘合论 · {level.label}
        </div>
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#8B0000]/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#8B0000]/20 pointer-events-none" />
        
        <div className="space-y-4 text-center">
          <div className="flex justify-center items-center gap-4 mb-2">
             <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#8B0000]/20" />
             <span className="text-2xl">{level.emoji}</span>
             <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#8B0000]/20" />
          </div>
          <p className="text-[#3E2723] leading-relaxed text-sm italic px-4">
            “💡 <strong>姻缘总评：</strong>
            {yinYuanScore >= 80 
              ? `${name1}与${name2}八字相配度较高，双方有较深的缘分，感情发展顺利，婚后生活幸福美满的概率较大。`
              : yinYuanScore >= 70
              ? `${name1}与${name2}八字匹配良好，双方性格互补，只要用心经营，可以共创美好未来。`
              : `${name1}与${name2}八字有一定差异，但差异也是互补。婚姻需要双方共同努力，相互理解包容。`
            }”
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 十神分析组件 - 完整版，基于实际十神计算
 */
function ShiShenSection({ bazi1, bazi2, name1, name2 }: { 
  bazi1: PersonBazi; 
  bazi2: PersonBazi;
  name1: string;
  name2: string;
}) {
  // 天干五行映射
  const tianGanWuXing: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  };

  // 天干阴阳映射
  const tianGanYinYang: Record<string, 'yang' | 'yin'> = {
    '甲': 'yang', '乙': 'yin', '丙': 'yang', '丁': 'yin', '戊': 'yang',
    '己': 'yin', '庚': 'yang', '辛': 'yin', '壬': 'yang', '癸': 'yin',
  };

  // 地支藏干（简化版，取主气）
  const diZhiCangGan: Record<string, string> = {
    '子': '癸', '丑': '己', '寅': '甲', '卯': '乙', '辰': '戊', '巳': '丙',
    '午': '丁', '未': '己', '申': '庚', '酉': '辛', '戌': '戊', '亥': '壬',
  };

  // 五行生克关系
  const wuXingSheng: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const wuXingKe: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
  const wuXingBeiKe: Record<string, string> = { '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' };
  const wuXingBeiSheng: Record<string, string> = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' };

  // 计算某个天干相对于日元的十神
  const calculateShiShen = (riYuan: string, targetGan: string): string => {
    const riWuXing = tianGanWuXing[riYuan];
    const targetWuXing = tianGanWuXing[targetGan];
    const riYinYang = tianGanYinYang[riYuan];
    const targetYinYang = tianGanYinYang[targetGan];
    const sameYinYang = riYinYang === targetYinYang;

    // 同我者为比劫
    if (riWuXing === targetWuXing) {
      return sameYinYang ? '比肩' : '劫财';
    }
    // 我生者为食伤
    if (wuXingSheng[riWuXing] === targetWuXing) {
      return sameYinYang ? '食神' : '伤官';
    }
    // 我克者为财
    if (wuXingKe[riWuXing] === targetWuXing) {
      return sameYinYang ? '偏财' : '正财';
    }
    // 克我者为官杀
    if (wuXingBeiKe[riWuXing] === targetWuXing) {
      return sameYinYang ? '七杀' : '正官';
    }
    // 生我者为印
    if (wuXingBeiSheng[riWuXing] === targetWuXing) {
      return sameYinYang ? '偏印' : '正印';
    }
    return '日元';
  };

  // 计算完整的八字十神
  const calculateAllShiShen = (bazi: PersonBazi) => {
    const riYuan = bazi.siZhu.day.tianGan;
    return {
      year: {
        tianGan: calculateShiShen(riYuan, bazi.siZhu.year.tianGan),
        diZhi: calculateShiShen(riYuan, diZhiCangGan[bazi.siZhu.year.diZhi]),
      },
      month: {
        tianGan: calculateShiShen(riYuan, bazi.siZhu.month.tianGan),
        diZhi: calculateShiShen(riYuan, diZhiCangGan[bazi.siZhu.month.diZhi]),
      },
      day: {
        tianGan: '日元',
        diZhi: calculateShiShen(riYuan, diZhiCangGan[bazi.siZhu.day.diZhi]),
      },
      hour: {
        tianGan: calculateShiShen(riYuan, bazi.siZhu.hour.tianGan),
        diZhi: calculateShiShen(riYuan, diZhiCangGan[bazi.siZhu.hour.diZhi]),
      },
    };
  };

  // 十神详解 - 颜色调整为中国传统色
  const shiShenDetails: Record<string, { 
    meaning: string; 
    personality: string; 
    career: string[];
    relationship: string;
    color: string;
  }> = {
    '比肩': {
      meaning: '与日主同类同性，代表兄弟姐妹、同事、竞争者',
      personality: '独立自主、有主见、竞争意识强、不服输',
      career: ['创业者', '合伙人', '自由职业', '竞技类'],
      relationship: '在婚姻中较为独立，需要个人空间',
      color: 'bg-[#E6F9F0] text-[#228B22] border-[#228B22]/20', // 竹青色 (木)
    },
    '劫财': {
      meaning: '与日主同类异性，代表朋友、竞争、争夺',
      personality: '豪爽大方、善于社交、敢于冒险、有魄力',
      career: ['销售业务', '投资理财', '娱乐业', '社交类'],
      relationship: '在婚姻中需注意理财，避免冲动消费',
      color: 'bg-[#F0FFF0] text-[#006400] border-[#006400]/20', // 嫩绿 (木)
    },
    '食神': {
      meaning: '日主所生同性，代表才华、口福、子女（女）',
      personality: '温和宽厚、才华横溢、享受生活、乐观开朗',
      career: ['餐饮美食', '艺术创作', '教育培训', '文化娱乐'],
      relationship: '在婚姻中带来温馨气氛，善于调节家庭氛围',
      color: 'bg-[#FFF9E6] text-[#B8860B] border-[#B8860B]/20', // 缊黄 (土/金)
    },
    '伤官': {
      meaning: '日主所生异性，代表才艺、反叛、表现欲',
      personality: '聪明伶俐、创意无限、追求完美、个性张扬',
      career: ['艺术表演', '设计创意', '自媒体', '技术研发'],
      relationship: '在婚姻中要注意沟通方式，避免过于挑剔',
      color: 'bg-[#FFF4E6] text-[#D2691E] border-[#D2691E]/20', // 琥珀 (火/土)
    },
    '偏财': {
      meaning: '日主所克异性，代表父亲、意外之财、交际',
      personality: '慷慨大方、交际广泛、理财能力强、机遇多',
      career: ['金融投资', '商业贸易', '公关交际', '项目运营'],
      relationship: '在婚姻中带来财运，但需注意异性缘',
      color: 'bg-[#FCF4E0] text-[#B8860B] border-[#B8860B]/20', // 枯黄 (土)
    },
    '正财': {
      meaning: '日主所克同性，代表稳定收入、妻子（男）',
      personality: '勤俭持家、踏实稳重、重视物质、有责任感',
      career: ['财务会计', '银行保险', '房产管理', '稳定职业'],
      relationship: '在婚姻中是稳定的经济支柱',
      color: 'bg-[#F5F5DC] text-[#8B4513] border-[#8B4513]/20', // 米褐 (土)
    },
    '七杀': {
      meaning: '克日主异性，代表权威、压力、挑战、丈夫（女）',
      personality: '果断刚毅、有魄力、敢于挑战、雷厉风行',
      career: ['执法军警', '企业高管', '外科医生', '竞技体育'],
      relationship: '在婚姻中是有担当的另一半',
      color: 'bg-[#FFEBEB] text-[#8B0000] border-[#8B0000]/20', // 朱砂 (火)
    },
    '正官': {
      meaning: '克日主同性，代表名誉、地位、约束、丈夫（女）',
      personality: '端正守法、有责任感、追求名誉、自律性强',
      career: ['公务员', '教师', '管理层', '法律工作'],
      relationship: '在婚姻中重视责任 and 承诺',
      color: 'bg-[#FFF0F0] text-[#A52A2A] border-[#A52A2A]/20', // 赭红 (火)
    },
    '偏印': {
      meaning: '生日主异性，代表偏门学问、继母、意外',
      personality: '思维独特、直觉敏锐、善于思考、有艺术感',
      career: ['研究学术', '心理咨询', '玄学五术', '艺术创作'],
      relationship: '在婚姻中需要精神层面的交流',
      color: 'bg-[#F0F0FF] text-[#483D8B] border-[#483D8B]/20', // 靛青 (水)
    },
    '正印': {
      meaning: '生日主同性，代表母亲、学历、保护',
      personality: '仁慈宽厚、爱学习、重名誉、有文化修养',
      career: ['教育行业', '医疗健康', '文化出版', '公益慈善'],
      relationship: '在婚姻中是温暖的守护者',
      color: 'bg-[#E6F3FF] text-[#003153] border-[#003153]/20', // 黛蓝 (水)
    },
    '日元': {
      meaning: '命主自身，代表自我、个性、生命力',
      personality: '这是命主的本命，体现核心个性',
      career: [],
      relationship: '婚姻关系的核心',
      color: 'bg-[#F2F2F2] text-[#4D4D4D] border-[#4D4D4D]/20', // 浅灰
    },
  };

  // 获取主要十神（出现次数最多的）
  const getMainShiShen = (shiShenData: ReturnType<typeof calculateAllShiShen>) => {
    const count: Record<string, number> = {};
    Object.values(shiShenData).forEach(pillar => {
      if (pillar.tianGan !== '日元') {
        count[pillar.tianGan] = (count[pillar.tianGan] || 0) + 1;
      }
      count[pillar.diZhi] = (count[pillar.diZhi] || 0) + 1;
    });
    const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 3).map(([name]) => name);
  };

  // 根据月令定格局
  const getGeJu = (bazi: PersonBazi, shiShenData: ReturnType<typeof calculateAllShiShen>) => {
    const monthShiShen = shiShenData.month.diZhi;
    const geJuName = `${monthShiShen}格`;
    
    const geJuAnalysis: Record<string, string> = {
      '比肩格': '独立自主，适合自主创业或独立工作',
      '劫财格': '社交能力强，适合销售或公关类工作',
      '食神格': '才华横溢，适合艺术、美食、教育相关行业',
      '伤官格': '创意无限，适合设计、技术研发、自媒体',
      '偏财格': '善于理财，适合投资、贸易、商业运营',
      '正财格': '稳健务实，适合财务、银行、房产管理',
      '七杀格': '果断刚毅，适合管理层、军警、外科医生',
      '正官格': '正直守法，适合公务员、教师、法律工作',
      '偏印格': '思维独特，适合研究、心理咨询、玄学',
      '正印格': '文化修养高，适合教育、医疗、出版行业',
      '日元格': '综合型格局，需结合其他因素分析',
    };
    
    return {
      name: geJuName,
      description: geJuAnalysis[geJuName] || '综合型格局',
    };
  };

  // 分析婚姻相关十神
  const getMarriageShiShen = (bazi: PersonBazi, shiShenData: ReturnType<typeof calculateAllShiShen>) => {
    const isMale = bazi.gender === 'male';
    // 男命看正财、偏财为妻；女命看正官、七杀为夫
    const marriageStars = isMale ? ['正财', '偏财'] : ['正官', '七杀'];
    const found: string[] = [];
    
    Object.values(shiShenData).forEach(pillar => {
      if (marriageStars.includes(pillar.tianGan)) found.push(pillar.tianGan);
      if (marriageStars.includes(pillar.diZhi)) found.push(pillar.diZhi);
    });
    
    if (found.length === 0) {
      return {
        has: false,
        analysis: isMale 
          ? '命局中财星不显，婚姻来得稍晚，需主动追求' 
          : '命局中官星不显，婚姻来得稍晚，可多参加社交活动',
      };
    } else if (found.length >= 3) {
      return {
        has: true,
        analysis: isMale 
          ? '命局财星多现，异性缘佳，婚后需专一' 
          : '命局官杀混杂，感情经历丰富，择偶需谨慎',
      };
    } else {
      return {
        has: true,
        analysis: isMale 
          ? '命局财星适中，婚姻运势良好' 
          : '命局官星纯正，婚姻稳定有保障',
      };
    }
  };

  const p1ShiShen = calculateAllShiShen(bazi1);
  const p2ShiShen = calculateAllShiShen(bazi2);
  const p1MainShiShen = getMainShiShen(p1ShiShen);
  const p2MainShiShen = getMainShiShen(p2ShiShen);
  const p1GeJu = getGeJu(bazi1, p1ShiShen);
  const p2GeJu = getGeJu(bazi2, p2ShiShen);
  const p1Marriage = getMarriageShiShen(bazi1, p1ShiShen);
  const p2Marriage = getMarriageShiShen(bazi2, p2ShiShen);

  // 十神互补分析
  const getShiShenCompatibility = () => {
    const p1Set = new Set(p1MainShiShen);
    const p2Set = new Set(p2MainShiShen);
    const common = p1MainShiShen.filter(s => p2Set.has(s));
    
    if (common.length >= 2) {
      return `双方主要十神相似（${common.join('、')}），价值观和处事方式接近，容易产生共鸣。`;
    } else if (common.length === 1) {
      return `双方在${common[0]}方面有共同点，其他方面各有特色，形成互补。`;
    } else {
      return `双方十神特征各异，性格和能力互补性强，可以相互学习成长。`;
    }
  };

  // 渲染十神表格
  const renderShiShenTable = (bazi: PersonBazi, shiShenData: ReturnType<typeof calculateAllShiShen>, name: string, colorClass: string) => {
    const pillars = [
      { name: '年柱', gan: bazi.siZhu.year.tianGan, zhi: bazi.siZhu.year.diZhi, shiShen: shiShenData.year },
      { name: '月柱', gan: bazi.siZhu.month.tianGan, zhi: bazi.siZhu.month.diZhi, shiShen: shiShenData.month },
      { name: '日柱', gan: bazi.siZhu.day.tianGan, zhi: bazi.siZhu.day.diZhi, shiShen: shiShenData.day },
      { name: '时柱', gan: bazi.siZhu.hour.tianGan, zhi: bazi.siZhu.hour.diZhi, shiShen: shiShenData.hour },
    ];

    return (
      <div className={`p-4 rounded-lg border bg-gradient-to-br ${colorClass} space-y-4`}>
        <div className="flex items-center justify-between">
          <p className="font-medium">{name}的十神命盘</p>
          <Badge variant="secondary">{bazi.riYuan}{bazi.riYuanWuXing}日主</Badge>
        </div>
        
        {/* 四柱十神表 */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {pillars.map((pillar, i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs text-muted-foreground">{pillar.name}</p>
              <div className="p-2 bg-white/50 dark:bg-black/20 rounded">
                <p className="text-sm font-medium">{pillar.gan}</p>
                <p className={`text-xs px-1 py-0.5 rounded ${shiShenDetails[pillar.shiShen.tianGan]?.color || 'bg-gray-100'}`}>
                  {pillar.shiShen.tianGan}
                </p>
              </div>
              <div className="p-2 bg-white/30 dark:bg-black/10 rounded">
                <p className="text-sm font-medium">{pillar.zhi}</p>
                <p className={`text-xs px-1 py-0.5 rounded ${shiShenDetails[pillar.shiShen.diZhi]?.color || 'bg-gray-100'}`}>
                  {pillar.shiShen.diZhi}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染十神分析
  const renderShiShenAnalysis = (
    mainShiShen: string[], 
    geJu: { name: string; description: string },
    marriage: { has: boolean; analysis: string },
    name: string
  ) => {
    const primaryShiShen = mainShiShen[0];
    const detail = shiShenDetails[primaryShiShen];
    
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1">
          <span className="text-sm text-muted-foreground">主要十神：</span>
          {mainShiShen.map((ss, i) => (
            <Badge key={i} className={shiShenDetails[ss]?.color}>{ss}</Badge>
          ))}
        </div>
        
        <div className="space-y-2 text-sm">
          <p>
            <strong>📊 格局：</strong>
            <span className="text-indigo-600 dark:text-indigo-400">{geJu.name}</span>
            <span className="text-muted-foreground ml-1">- {geJu.description}</span>
          </p>
          
          {detail && (
            <>
              <p>
                <strong>🎭 性格特点：</strong>
                <span className="text-muted-foreground">{detail.personality}</span>
              </p>
              <p>
                <strong>💼 事业方向：</strong>
                <span className="text-muted-foreground">{detail.career.join('、')}</span>
              </p>
            </>
          )}
          
          <p>
            <strong>💕 婚姻暗示：</strong>
            <span className="text-muted-foreground">{marriage.analysis}</span>
          </p>
          
          {detail && (
            <p>
              <strong>👫 婚姻角色：</strong>
              <span className="text-muted-foreground">{detail.relationship}</span>
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 font-serif">
      {/* 十神命盘 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { name: name1, bazi: bazi1, shiShen: p1ShiShen, main: p1MainShiShen, geJu: p1GeJu, marriage: p1Marriage, color: 'border-[#3E2723]' },
          { name: name2, bazi: bazi2, shiShen: p2ShiShen, main: p2MainShiShen, geJu: p2GeJu, marriage: p2Marriage, color: 'border-[#8B0000]' }
        ].map((p, i) => (
          <div key={i} className={`p-6 rounded-none border-2 ${p.color} bg-[#FDFBF7] relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#F5F2E9] transform rotate-45 translate-x-8 -translate-y-8 pointer-events-none opacity-50" />
            
            <div className="flex items-center gap-4 mb-6 relative">
              <div className="w-12 h-12 rounded-sm bg-[#8B0000] flex items-center justify-center shadow-lg border border-[#FFD700]/30 transform group-hover:scale-105 transition-transform">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg text-[#3E2723]">{p.name}之格局</p>
                <p className="text-[10px] text-[#8B0000] tracking-widest italic opacity-80">“{p.geJu.name}”</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* 四柱简盘 */}
              <div className="grid grid-cols-4 gap-2 text-center border-y border-[#D7CCC8]/30 py-4 bg-[#F5F2E9]/20">
                {[
                  { label: '年', val: p.shiShen.year },
                  { label: '月', val: p.shiShen.month },
                  { label: '日', val: p.shiShen.day },
                  { label: '时', val: p.shiShen.hour }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-[10px] text-[#8D6E63]">{item.label}</p>
                    <p className={`text-[11px] font-bold px-1 py-0.5 rounded-sm border ${shiShenDetails[item.val.tianGan]?.color || 'bg-gray-100'}`}>
                      {item.val.tianGan}
                    </p>
                    <p className={`text-[11px] px-1 py-0.5 rounded-sm border ${shiShenDetails[item.val.diZhi]?.color || 'bg-gray-100'}`}>
                      {item.val.diZhi}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-[#5D4037]">
                <div className="flex gap-3 p-3 bg-[#FFF9ED] border-l-2 border-[#8B0000]/50 rounded-sm">
                  <span className="shrink-0 text-[#8B0000] font-bold">【气象】</span>
                  <p className="text-[#3E2723]">{p.geJu.description}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-[#8B0000] font-bold shrink-0 text-xs">· 性格：</span>
                    <p className="text-[12px] italic">{shiShenDetails[p.main[0]]?.personality}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#8B0000] font-bold shrink-0 text-xs">· 事业：</span>
                    <p className="text-[12px] italic">{shiShenDetails[p.main[0]]?.career.join('、')}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#8B0000] font-bold shrink-0 text-xs">· 姻缘：</span>
                    <p className="text-[12px] italic">{p.marriage.analysis}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 综合分析 */}
      <div className="p-6 rounded-none border-2 border-[#8B0000]/30 bg-[#FFF9ED] shadow-md relative group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 bg-[#8B0000] text-white text-[10px] py-1.5 rounded-none font-serif tracking-[0.2em] border border-[#FFD700]/50 shadow-sm group-hover:bg-[#A30000] transition-colors">
          十神合论 · 格局互补
        </div>
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#8B0000]/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#8B0000]/20 pointer-events-none" />
        
        <div className="space-y-4 text-center">
          <p className="text-[#3E2723] leading-relaxed text-sm italic px-4">
            “💡 十神者，乃天地造化之妙。{getShiShenCompatibility()}”
          </p>
          <div className="pt-4 border-t border-[#8B0000]/10">
            <p className="text-[11px] text-[#8D6E63] italic">
              建议：结合两人的格局特征，在共同奋斗的过程中，应充分发挥各自在十神命理中的优势。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AI 对话组件
 */
function ChatSection({
  analysisId,
  conversations,
  onNewMessage,
}: {
  analysisId: string;
  conversations: AnalysisData['conversations'];
  onNewMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void;
}) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // 添加用户消息
    onNewMessage({ role: 'user', content: userMessage });

    try {
      const response = await fetch(`/api/bazi/marriage/${analysisId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const result = await response.json();

      if (result.success) {
        onNewMessage({ role: 'assistant', content: result.data.content });
      } else {
        toast.error(result.error || '发送失败');
      }
    } catch (error) {
      console.error('发送失败:', error);
      toast.error('发送失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 预设问题
  const presetQuestions = [
    '我们的感情发展趋势如何？',
    '我们在哪些方面需要注意？',
    '如何改善我们的相处模式？',
    '最佳的结婚时间是什么时候？',
  ];

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          AI 追问对话
        </CardTitle>
        <CardDescription>对分析结果有疑问？继续向 AI 提问</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {conversations.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">可以问我任何关于这次合婚分析的问题</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {presetQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {conversations.map((conv, i) => (
              <div
                key={i}
                className={`flex gap-3 ${conv.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    conv.role === 'user'
                      ? 'bg-amber-500 text-white'
                      : 'bg-muted'
                  }`}
                >
                  {conv.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`flex-1 rounded-lg p-3 ${
                    conv.role === 'user'
                      ? 'bg-[#8B0000] text-white'
                      : 'bg-[#FFF9ED] border border-[#D7CCC8]'
                  }`}
                >
                  <div className={`text-sm prose prose-sm max-w-none ${conv.role === 'user' ? 'prose-invert' : 'prose-stone prose-headings:text-[#8B0000] prose-strong:text-[#8B0000]'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {preprocessMarkdown(conv.content)}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1 rounded-lg p-3 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入您的问题..."
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * 合婚分析结果页面
 */
export default function MarriageResultPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<AnalysisData['conversations']>([]);
  const [activeTab, setActiveTab] = useState('bazi');
  
  // 从 session 获取用户是否为高级用户
  const isPremium = session?.user?.isPremium ?? false;

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/bazi/marriage/${params.id}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
          setConversations(result.data.conversations || []);
        } else {
          toast.error(result.error || '加载失败');
          router.push('/workspace/bazi-marriage');
        }
      } catch (error) {
        console.error('加载失败:', error);
        toast.error('加载失败');
        router.push('/workspace/bazi-marriage');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [params.id, router]);

  const handleNewMessage = (msg: { role: 'user' | 'assistant'; content: string }) => {
    setConversations((prev) => [
      ...prev,
      { id: Date.now().toString(), ...msg, createdAt: new Date().toISOString() },
    ]);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-[#F5F2E9]">
        <div className="w-12 h-12 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#8B0000] font-serif italic text-lg tracking-widest">正在开启三生石，窥探前世今生...</p>
      </div>
    );
  }

  if (!data) return null;

  const { result, person1Bazi, person2Bazi } = data;
  const scoreLevel = getScoreLevel(data.overallScore);

  return (
    <div className="min-h-screen bg-[#F5F2E9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* 背景纹理 */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
      
      {/* 古典装饰边角 */}
      <div className="fixed top-4 left-4 w-20 h-20 border-t-2 border-l-2 border-[#8B0000]/20 pointer-events-none" />
      <div className="fixed top-4 right-4 w-20 h-20 border-t-2 border-r-2 border-[#8B0000]/20 pointer-events-none" />
      <div className="fixed bottom-4 left-4 w-20 h-20 border-b-2 border-l-2 border-[#8B0000]/20 pointer-events-none" />
      <div className="fixed bottom-4 right-4 w-20 h-20 border-b-2 border-r-2 border-[#8B0000]/20 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">
        {/* 顶部标题栏 */}
        <div className="flex justify-between items-center mb-10 border-b-2 border-[#8B0000] pb-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-[#8B0000] rounded-sm flex items-center justify-center text-white text-3xl font-serif shadow-xl border-2 border-[#FFD700]">
               缘
             </div>
             <div>
               <h1 className="text-3xl font-serif font-bold text-[#3E2723]">三生石畔 · 姻缘签</h1>
               <div className="flex items-center gap-2 mt-1">
                 <p className="text-[#8B0000] text-sm font-medium">【{data.person1Name}】</p>
                 <Heart className="w-3 h-3 text-[#8B0000] fill-current" />
                 <p className="text-[#8B0000] text-sm font-medium">【{data.person2Name}】</p>
               </div>
             </div>
          </div>
          <Link href="/workspace/bazi-marriage" className="group flex items-center gap-2 px-4 py-2 border border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white transition-all rounded-sm font-serif">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            <span>返回书院</span>
          </Link>
        </div>

        {/* 核心分数卡片 - 古典喜庆风格 */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-[#8B0000] transform -rotate-1 skew-x-1 shadow-2xl" />
          <div className="relative bg-[#8B0000] text-[#FFF9ED] p-10 border-double border-4 border-[#FFD700] text-center">
            <div className="flex justify-center gap-8 mb-4">
              <div className="w-1 h-12 bg-[#FFD700]/30 rounded-full" />
              <p className="font-serif text-xl tracking-[0.2em] opacity-90">天定姻缘 · 契合评定</p>
              <div className="w-1 h-12 bg-[#FFD700]/30 rounded-full" />
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <span className="text-8xl font-serif font-bold text-[#FFD700] drop-shadow-lg">{data.overallScore}</span>
              <span className="text-3xl font-serif text-[#FFD700]/80">分</span>
            </div>
            
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="px-8 py-2 border-2 border-[#FFD700] text-[#FFD700] font-serif text-2xl tracking-[0.5em] bg-[#7A0000] shadow-inner">
                {scoreLevel.label}
              </div>
              <p className="max-w-md text-[#FFD700]/70 text-sm font-serif leading-relaxed italic">
                “众里寻他千百度，蓦然回首，那人却在，灯火阑珊处。”
              </p>
            </div>
          </div>
        </div>

        {/* 分数维度展示 - 水墨风格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {Object.entries(result.dimensions).map(([key, dim]) => {
            const config = dimensionConfig[key as keyof typeof dimensionConfig];
            return (
              <div key={key} className="bg-[#FFF9ED] border border-[#D7CCC8] p-4 text-center group hover:border-[#8B0000] transition-colors shadow-sm">
                <p className="text-xs text-[#8D6E63] mb-1 font-serif">{config.label}</p>
                <p className="text-2xl font-serif font-bold text-[#3E2723] group-hover:text-[#8B0000] transition-colors">
                  {dim.score}<span className="text-xs font-normal">分</span>
                </p>
                <div className="mt-2 h-1 bg-[#EFEBE9] overflow-hidden">
                  <div 
                    className="h-full bg-[#8B0000] transition-all duration-1000" 
                    style={{ width: `${dim.score}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 主内容页签 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto p-1 bg-[#EFEBE9] border border-[#D7CCC8] rounded-none mb-8">
            <TabsTrigger 
              value="bazi" 
              className="flex-1 py-3 text-lg font-serif data-[state=active]:bg-[#8B0000] data-[state=active]:text-white rounded-none transition-all"
            >
              命理盘
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              className="flex-1 py-3 text-lg font-serif data-[state=active]:bg-[#8B0000] data-[state=active]:text-white rounded-none transition-all"
            >
              姻缘笺
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="flex-1 py-3 text-lg font-serif data-[state=active]:bg-[#8B0000] data-[state=active]:text-white rounded-none transition-all"
            >
              问因果
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bazi" className="space-y-12">
            {/* 八字命盘展示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <BaziDisplay bazi={person1Bazi} title={data.person1Name} />
              <BaziDisplay bazi={person2Bazi} title={data.person2Name} />
            </div>

            {/* 各项详细分析模块 */}
            <div className="space-y-8">
              <AnalysisModule title="美满姻缘" icon={Heart} iconColor="text-red-600" isLocked={false}>
                <YinYuanSection bazi1={person1Bazi} bazi2={person2Bazi} name1={data.person1Name} name2={data.person2Name} overallScore={data.overallScore} />
              </AnalysisModule>

              <AnalysisModule title="性格相合" icon={Brain} iconColor="text-blue-600" isLocked={false}>
                <PersonalitySection bazi1={person1Bazi} bazi2={person2Bazi} name1={data.person1Name} name2={data.person2Name} />
              </AnalysisModule>

              <AnalysisModule title="五行平衡" icon={Scale} iconColor="text-amber-600" isLocked={false}>
                <WuXingBalanceSection bazi1={person1Bazi} bazi2={person2Bazi} name1={data.person1Name} name2={data.person2Name} />
              </AnalysisModule>

              <AnalysisModule title="婚姻宫分析" icon={Crown} iconColor="text-purple-600" isLocked={!isPremium}>
                <MarriagePalaceSection bazi1={person1Bazi} bazi2={person2Bazi} name1={data.person1Name} name2={data.person2Name} />
              </AnalysisModule>

              <AnalysisModule title="子嗣分析" icon={Baby} iconColor="text-orange-600" isLocked={!isPremium}>
                <ChildrenSection bazi1={person1Bazi} bazi2={person2Bazi} name1={data.person1Name} name2={data.person2Name} />
              </AnalysisModule>

              <AnalysisModule title="十神格局" icon={Star} iconColor="text-indigo-600" isLocked={!isPremium}>
                <ShiShenSection bazi1={person1Bazi} bazi2={person2Bazi} name1={data.person1Name} name2={data.person2Name} />
              </AnalysisModule>
            </div>
          </TabsContent>

          <TabsContent value="analysis">
            <Card className="rounded-none border-2 border-[#8B0000] bg-[#FDFBF7] p-8 md:p-12 min-h-[600px] shadow-2xl relative overflow-hidden font-serif">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#8B0000]/5 rounded-bl-full pointer-events-none" />
              
              <div className="relative z-10">
                {result.aiAnalysis ? (
                  <div className="prose prose-stone max-w-none 
                    prose-headings:text-[#8B0000] prose-headings:font-black prose-headings:font-serif prose-headings:tracking-wider
                    prose-h1:text-4xl prose-h1:text-center prose-h1:border-b-4 prose-h1:border-double prose-h1:border-[#8B0000] prose-h1:pb-6 prose-h1:mb-16
                    prose-h2:text-3xl prose-h2:border-l-[16px] prose-h2:border-[#8B0000] prose-h2:pl-8 prose-h2:mt-24 prose-h2:mb-12 prose-h2:bg-[#8B0000]/10 prose-h2:py-6 prose-h2:tracking-[0.2em] prose-h2:shadow-sm
                    prose-h3:text-2xl prose-h3:mt-14 prose-h3:mb-8 prose-h3:text-[#3E2723] prose-h3:font-black prose-h3:border-b-2 prose-h3:border-[#D7CCC8] prose-h3:pb-3
                    prose-p:text-[#3E2723] prose-p:leading-loose prose-p:mb-14 prose-p:text-xl prose-p:font-medium
                    prose-strong:text-[#8B0000] prose-strong:font-black prose-strong:text-2xl
                    prose-li:text-[#3E2723] prose-li:text-xl prose-li:mb-8 prose-li:font-medium
                    prose-hr:border-[#D7CCC8] prose-hr:my-24">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {preprocessMarkdown(result.aiAnalysis
                        // 1. 清洗：去掉所有行首可能存在的井号和多余空格，然后重新标注 Markdown 级别
                        .split('\n')
                        .map(line => {
                          const cleanLine = line.trim().replace(/^#+\s*/, '');
                          // 1. 识别并转换一级标题
                          if (cleanLine.endsWith('分析报告')) return `# ${cleanLine}`;
                          
                          // 2. 识别大项标题（支持特定关键词或序号开头）
                          const isMainTitle = /^(姻缘概述|八字解读|桃花运势|理想对象|婚姻建议|流年参考|合婚评价|性格相容|婚姻宫位|子嗣分析|事业方向|总体评价)/.test(cleanLine) || 
                                            /^[一二三四五六七八九十\d]+[.、]/.test(cleanLine);
                          if (isMainTitle) return `## ${cleanLine}`;
                          
                          // 3. 识别小项标题
                          if (/^\(\d+\)/.test(cleanLine)) return `### ${cleanLine}`;
                          
                          return cleanLine;
                        })
                        .join('\n\n')
                      )}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#8B0000] mb-4" />
                    <p className="text-[#8B0000] font-serif italic text-xl tracking-widest">姻缘笺撰写中，请稍候...</p>
                  </div>
                )}
              </div>

              {/* 底部落款印章 */}
              <div className="mt-20 flex justify-end">
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#8B0000]/10 blur-sm transform rotate-3" />
                  <div className="relative text-center p-6 border-4 border-double border-[#8B0000] text-[#8B0000] font-serif transform rotate-3 bg-white shadow-xl">
                    <p className="text-xs tracking-[0.3em] text-[#8D6E63] mb-1 font-bold uppercase">命理大师 · 钦定</p>
                    <div className="w-full h-[1px] bg-[#8B0000]/30 my-2" />
                    <p className="font-bold text-2xl tracking-[0.2em] text-red-800">准予合婚</p>
                    <div className="w-full h-[1px] bg-[#8B0000]/30 my-2" />
                    <p className="text-[10px] tracking-widest font-bold opacity-80 mt-1">
                      {new Date().getFullYear()}年 · {new Date().getMonth() + 1}月 · {new Date().getDate()}日
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <ChatSection analysisId={data.id} conversations={conversations} onNewMessage={handleNewMessage} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

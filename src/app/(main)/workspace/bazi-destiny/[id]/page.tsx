/**
 * 姻缘分析结果页面
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 展示个人姻缘分析结果，支持 AI 追问对话
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  Sparkles,
  Send,
  Loader2,
  ArrowLeft,
  User,
  Bot,
  Calendar,
  Compass,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/** 分析数据类型 */
interface AnalysisData {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  bazi: {
    siZhu: {
      year: { tianGan: string; diZhi: string };
      month: { tianGan: string; diZhi: string };
      day: { tianGan: string; diZhi: string };
      hour?: { tianGan: string; diZhi: string };
    };
    riYuan: string;
    riYuanWuXing: string;
    wuXingCount: Record<string, number>;
  };
  result: {
    aiAnalysis: string;
    knowBirthTime: boolean;
  };
  conversations: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
}

/**
 * 姻缘分析结果页面
 */
export default function DestinyResultPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [askingAI, setAskingAI] = useState(false);
  const [conversations, setConversations] = useState<Array<{ role: string; content: string }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /** 加载分析结果 */
  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/bazi/destiny/${params.id}`);
        const result = await response.json();

        if (!result.success) {
          toast.error(result.error || '获取分析结果失败');
          router.push('/workspace/bazi-destiny');
          return;
        }

        setAnalysis(result.data);
        setConversations(
          result.data.conversations.map((c: { role: string; content: string }) => ({
            role: c.role,
            content: c.content,
          }))
        );
      } catch (error) {
        console.error('获取分析结果失败:', error);
        toast.error('获取分析结果失败');
        router.push('/workspace/bazi-destiny');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAnalysis();
    }
  }, [params.id, router]);

  /** 滚动到底部 */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  /** 发送追问 */
  const handleAskQuestion = async () => {
    if (!question.trim() || askingAI) return;

    const userQuestion = question.trim();
    setQuestion('');
    setAskingAI(true);

    // 先显示用户消息
    setConversations((prev) => [...prev, { role: 'user', content: userQuestion }]);

    try {
      const response = await fetch(`/api/bazi/destiny/${params.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQuestion }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'AI 回复失败');
        // 移除用户消息
        setConversations((prev) => prev.slice(0, -1));
        return;
      }

      // 添加 AI 回复
      setConversations((prev) => [...prev, { role: 'assistant', content: result.data.answer }]);
    } catch (error) {
      console.error('追问失败:', error);
      toast.error('AI 回复失败，请稍后重试');
      setConversations((prev) => prev.slice(0, -1));
    } finally {
      setAskingAI(false);
    }
  };

  /** 预处理 Markdown 内容，修复格式问题并过滤 emoji */
  const preprocessMarkdown = (content: string): string => {
    if (!content) return '';
    
    let processed = content;

    // 过滤 emoji 图标，保持纯文字古典风格
    processed = processed.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '');
    
    // 修复 ** 和中文标点之间的空格问题
    processed = processed.replace(/\*\*\s*([""「」『』【】])/g, '**$1');
    processed = processed.replace(/([""「」『』【】])\s*\*\*/g, '$1**');
    
    processed = processed.replace(/\*\*[""]([^""]+)[""]\*\*/g, '"**$1**"');
    processed = processed.replace(/\*\*「([^」]+)」\*\*/g, '「**$1**」');
    
    return processed;
  };

  /** 格式化八字 */
  const formatBazi = (siZhu: AnalysisData['bazi']['siZhu']) => {
    const parts = [
      `${siZhu.year.tianGan}${siZhu.year.diZhi}`,
      `${siZhu.month.tianGan}${siZhu.month.diZhi}`,
      `${siZhu.day.tianGan}${siZhu.day.diZhi}`,
    ];
    if (siZhu.hour && siZhu.hour.tianGan && siZhu.hour.diZhi) {
      parts.push(`${siZhu.hour.tianGan}${siZhu.hour.diZhi}`);
    }
    return parts.join(' ');
  };

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F2E9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-serif">
      {/* 背景纹理 */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
      
      {/* 古典装饰边角 */}
      <div className="fixed top-4 left-4 w-20 h-20 border-t-2 border-l-2 border-[#8B0000]/20 pointer-events-none" />
      <div className="fixed top-4 right-4 w-20 h-20 border-t-2 border-r-2 border-[#8B0000]/20 pointer-events-none" />
      <div className="fixed bottom-4 left-4 w-20 h-20 border-b-2 border-l-2 border-[#8B0000]/20 pointer-events-none" />
      <div className="fixed bottom-4 right-4 w-20 h-20 border-b-2 border-r-2 border-[#8B0000]/20 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">
        {/* 返回按钮和标题 */}
        <div className="flex justify-between items-center mb-10 border-b-2 border-[#8B0000] pb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/workspace/bazi-destiny')}
              className="hover:bg-[#8B0000]/10 text-[#8B0000]"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#3E2723] tracking-widest">三生石畔 · 姻缘笺</h1>
              <p className="text-[#8D6E63] text-sm mt-1 italic">
                批算时间：{format(new Date(analysis.createdAt), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="w-12 h-12 border-2 border-[#8B0000] flex items-center justify-center text-[#8B0000] font-bold text-xl rotate-12 bg-white/50">
              缘
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {/* 命盘卷轴风格 */}
          <div className="relative">
            <div className="absolute inset-x-0 -top-4 h-8 bg-[#D7CCC8] rounded-full shadow-inner opacity-40" />
            <div className="absolute inset-x-0 -bottom-4 h-8 bg-[#D7CCC8] rounded-full shadow-inner opacity-40" />
            
            <Card className="rounded-none border-x-8 border-y-0 border-[#3E2723] bg-[#FDFBF7] shadow-[0_10px_30px_rgba(0,0,0,0.1)] py-10 px-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-[#3E2723] border-b border-[#D7CCC8] inline-block pb-2 px-10 mb-2">个人生辰命盘</h2>
                <p className="text-[#8D6E63] text-xs">“乾坤有数，姻缘有定”</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* 姓名性别 */}
                <div className="flex flex-col items-center justify-center p-4 border border-[#D7CCC8]/50 bg-[#F5F2E9]/30">
                  <div className="text-xs text-[#8D6E63] mb-1">姓名</div>
                  <div className="text-xl font-bold text-[#3E2723]">{analysis.name}</div>
                  <div className="mt-4 px-3 py-1 bg-[#8B0000] text-white text-xs rounded-full">
                    {analysis.gender === 'male' ? '乾造（男）' : '坤造（女）'}
                  </div>
                </div>

                {/* 出生日期 */}
                <div className="flex flex-col items-center justify-center p-4 border border-[#D7CCC8]/50 bg-[#F5F2E9]/30">
                  <div className="text-xs text-[#8D6E63] mb-1">出生日期</div>
                  <div className="text-sm font-bold text-[#3E2723] text-center leading-relaxed">
                    {format(new Date(analysis.birthDate), 'yyyy年M月d日', { locale: zhCN })}
                  </div>
                  <div className="mt-2 text-[10px] text-[#8D6E63] italic">
                    {analysis.result.knowBirthTime ? '有时辰记录' : '时辰未详'}
                  </div>
                </div>

                {/* 八字展示 - 垂直排列风格 */}
                <div className="md:col-span-2 flex justify-around p-4 border-2 border-double border-[#D7CCC8] bg-white shadow-inner">
                  {[
                    { label: '年柱', ...analysis.bazi.siZhu.year },
                    { label: '月柱', ...analysis.bazi.siZhu.month },
                    { label: '日柱', ...analysis.bazi.siZhu.day },
                    ...(analysis.bazi.siZhu.hour ? [{ label: '时柱', ...analysis.bazi.siZhu.hour }] : []),
                  ].map((pillar, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className="text-[10px] text-[#8D6E63] mb-1">{pillar.label}</div>
                      <div className="w-10 h-10 bg-[#8B0000]/5 flex items-center justify-center text-lg font-bold text-[#8B0000] border border-[#8B0000]/20">
                        {pillar.tianGan}
                      </div>
                      <div className="w-10 h-10 bg-[#3E2723]/5 flex items-center justify-center text-lg font-bold text-[#3E2723] border border-[#3E2723]/20">
                        {pillar.diZhi}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#D7CCC8] flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                   <div className="px-3 py-1 bg-[#F5F2E9] border border-[#D7CCC8] text-[#5D4037] text-sm">
                     <span className="opacity-60 mr-2">命主:</span>
                     <span className="font-bold">{analysis.bazi.riYuan}（{analysis.bazi.riYuanWuXing}）</span>
                   </div>
                </div>
                <div className="flex gap-4">
                  {Object.entries(analysis.bazi.wuXingCount).map(([element, count]) => (
                    <div key={element} className="flex flex-col items-center">
                       <div className="text-[10px] text-[#8D6E63]">{element}</div>
                       <div className="text-sm font-bold text-[#3E2723]">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* AI 分析结果 - 宣纸风格 */}
          <Card className="rounded-none border-2 border-[#D7CCC8] bg-[#FDFBF7] shadow-xl overflow-hidden relative p-0">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#8B0000]" />
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-4 mb-10 pb-4 border-b border-[#D7CCC8]/50">
                <div className="p-3 bg-[#8B0000] rounded-full text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#3E2723] tracking-[0.2em]">姻缘运势批注</h3>
                  <p className="text-[#8D6E63] text-xs mt-1">AI 智能解读 · 结合古法命理</p>
                </div>
              </div>

              <div className="prose prose-base max-w-none
                    prose-headings:text-[#8B0000] prose-headings:font-bold prose-headings:font-serif prose-headings:tracking-wider
                    prose-h1:text-2xl prose-h1:text-center prose-h1:border-b-2 prose-h1:border-double prose-h1:border-[#8B0000] prose-h1:pb-4 prose-h1:mb-8
                    prose-h2:text-xl prose-h2:border-l-4 prose-h2:border-[#8B0000] prose-h2:pl-4 prose-h2:mt-10 prose-h2:mb-4 prose-h2:bg-[#8B0000]/5 prose-h2:py-2
                    prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-[#3E2723] prose-h3:font-bold prose-h3:border-b prose-h3:border-[#D7CCC8] prose-h3:pb-2
                    prose-p:text-[#3E2723] prose-p:leading-relaxed prose-p:mb-4 prose-p:text-base
                    prose-strong:text-[#8B0000] prose-strong:font-bold
                    prose-li:text-[#3E2723] prose-li:text-base prose-li:mb-1
                    prose-hr:border-[#D7CCC8] prose-hr:my-8
                    prose-table:text-sm prose-th:bg-[#F5F2E9] prose-th:text-[#3E2723]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {preprocessMarkdown(analysis.result.aiAnalysis)}
                </ReactMarkdown>
              </div>

              {/* 底部落款印章 */}
              <div className="mt-20 flex justify-end">
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#8B0000]/10 blur-sm transform rotate-3" />
                  <div className="relative text-center p-6 border-4 border-double border-[#8B0000] text-[#8B0000] font-serif transform rotate-3 bg-white shadow-xl">
                    <p className="text-xs tracking-[0.3em] text-[#8D6E63] mb-1 font-bold uppercase">命理大师 · 钦定</p>
                    <div className="w-full h-[1px] bg-[#8B0000]/30 my-2" />
                    <p className="font-bold text-2xl tracking-[0.2em] text-red-800">准予批算</p>
                    <div className="w-full h-[1px] bg-[#8B0000]/30 my-2" />
                    <p className="text-[10px] tracking-widest font-bold opacity-80 mt-1">
                      {new Date().getFullYear()}年 · {new Date().getMonth() + 1}月 · {new Date().getDate()}日
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* AI 追问对话 - 古典茶室风格 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#8B0000]" />
              <h2 className="text-xl font-bold text-[#3E2723]">问因果 · 答疑点</h2>
            </div>

            <Card className="rounded-none border border-[#D7CCC8] bg-[#FDFBF7] shadow-lg overflow-hidden flex flex-col h-[600px]">
              <div className="flex-1 overflow-y-auto p-6 bg-[#F5F2E9]/30">
                <div className="space-y-8">
                  {conversations.map((conv, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 ${conv.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-md
                        ${conv.role === 'user' ? 'bg-[#3E2723] rounded-sm' : 'bg-[#8B0000] rounded-sm'}`}>
                        {conv.role === 'user' ? '访' : '师'}
                      </div>
                      <div className={`relative max-w-[80%] p-4 border shadow-sm rounded-none
                        ${conv.role === 'user' 
                          ? 'bg-[#FDFBF7] border-[#3E2723]/20' 
                          : 'bg-white border-[#8B0000]/20'}`}>
                        
                        {/* 气泡小三角 */}
                        <div className={`absolute top-3 w-3 h-3 rotate-45 border
                          ${conv.role === 'user' 
                            ? '-right-1.5 bg-[#FDFBF7] border-r border-t border-[#3E2723]/20 border-l-0 border-b-0' 
                            : '-left-1.5 bg-white border-l border-b border-[#8B0000]/20 border-r-0 border-t-0'}`} />

                        <div className={`text-sm prose prose-sm max-w-none ${conv.role === 'user' ? '' : 'prose-stone prose-headings:text-[#8B0000] prose-strong:text-[#8B0000]'}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {preprocessMarkdown(conv.content)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {askingAI && (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-[#8B0000] rounded-sm flex items-center justify-center text-white font-bold text-sm shadow-md animate-pulse">
                        师
                      </div>
                      <div className="bg-white border border-[#8B0000]/20 p-4 shadow-sm rounded-none">
                        <Loader2 className="h-5 w-5 animate-spin text-[#8B0000]" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              <div className="p-6 bg-white border-t border-[#D7CCC8]">
                <div className="flex gap-3">
                  <Input
                    placeholder="向大师追问心中所惑..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAskQuestion();
                      }
                    }}
                    disabled={askingAI}
                    className="rounded-none border-[#D7CCC8] focus:border-[#8B0000] h-12 bg-[#FDFBF7]"
                  />
                  <Button
                    onClick={handleAskQuestion}
                    disabled={!question.trim() || askingAI}
                    className="rounded-none bg-[#8B0000] hover:bg-[#7A0000] text-[#FFD700] px-8 h-12 shadow-md transition-all active:scale-95"
                  >
                    {askingAI ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>

                {/* 快捷问题 */}
                {conversations.length <= 1 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {[
                      '我的桃花运什么时候最旺？',
                      '我适合什么样的另一半？',
                      '我应该如何提升姻缘运势？',
                      '我的婚姻宫位有什么特点？',
                    ].map((q) => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        onClick={() => setQuestion(q)}
                        className="rounded-none border-[#D7CCC8] text-[#8D6E63] hover:text-[#8B0000] hover:border-[#8B0000] hover:bg-[#FFF9ED] text-xs transition-colors"
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="mt-20 text-center">
        <div className="inline-block p-4 border border-dashed border-[#D7CCC8] bg-[#FDFBF7]/30 text-[10px] text-[#8D6E63] italic">
          命由天定，运由己造。以上批算仅供参考，愿君珍惜良缘，顺遂安康。
        </div>
      </div>
    </div>
  );
}

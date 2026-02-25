/**
 * 历史记录页面
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 展示用户的合婚分析和姻缘分析历史记录
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, History, Loader2, Plus, ArrowRight, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/** 合婚历史记录类型 */
interface MarriageHistoryItem {
  id: string;
  person1Name: string;
  person2Name: string;
  overallScore: number;
  createdAt: string;
}

/** 姻缘历史记录类型 */
interface DestinyHistoryItem {
  id: string;
  name: string;
  gender: string;
  createdAt: string;
}

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
 * 历史记录页面组件
 */
export default function HistoryPage() {
  const router = useRouter();
  const { status } = useSession();
  const [marriageHistory, setMarriageHistory] = useState<MarriageHistoryItem[]>([]);
  const [destinyHistory, setDestinyHistory] = useState<DestinyHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/workspace/history');
      return;
    }

    if (status === 'authenticated') {
      fetchHistory();
    }
  }, [status, router]);

  const fetchHistory = async () => {
    try {
      // 同时获取合婚和姻缘历史
      const [marriageRes, destinyRes] = await Promise.all([
        fetch('/api/bazi/marriage'),
        fetch('/api/bazi/destiny'),
      ]);

      const marriageResult = await marriageRes.json();
      const destinyResult = await destinyRes.json();

      if (marriageResult.success) {
        setMarriageHistory(marriageResult.data);
      }
      if (destinyResult.success) {
        setDestinyHistory(destinyResult.data);
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
      toast.error('加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2E9] py-10 px-4 sm:px-6 lg:px-8 font-serif relative overflow-hidden">
      {/* 背景纹理 */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        {/* 页面标题 */}
        <div className="flex items-center justify-between border-b-2 border-[#8B0000] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#3E2723] flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8B0000] rounded-sm flex items-center justify-center text-white border border-[#FFD700]/30 shadow-md">
                <History className="h-6 w-6" />
              </div>
              往期名册
            </h1>
            <p className="text-[#8D6E63] italic text-sm mt-2 leading-relaxed">"过往皆为序章，记录每一次缘分的指引。"</p>
          </div>
        </div>

        {/* 历史记录标签页 */}
        <Tabs defaultValue="marriage" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none bg-[#FDFBF7] border-2 border-[#D7CCC8] h-14">
            <TabsTrigger 
              value="marriage" 
              className="rounded-none data-[state=active]:bg-[#8B0000] data-[state=active]:text-[#FFD700] font-serif tracking-widest h-full"
            >
              <Heart className="mr-2 h-4 w-4" />
              八字合婚
            </TabsTrigger>
            <TabsTrigger 
              value="destiny" 
              className="rounded-none data-[state=active]:bg-[#8B0000] data-[state=active]:text-[#FFD700] font-serif tracking-widest h-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              算姻缘
            </TabsTrigger>
          </TabsList>

          {/* 合婚历史 */}
          <TabsContent value="marriage" className="mt-6">
            <div className="flex justify-end mb-6">
              <Button asChild className="bg-[#8B0000] hover:bg-[#7A0000] text-[#FFD700] rounded-none border-b-4 border-[#5D0000] font-serif tracking-widest shadow-xl h-12 px-8">
                <Link href="/workspace/bazi-marriage">
                  <Plus className="mr-2 h-4 w-4" />
                  新建合婚
                </Link>
              </Button>
            </div>

            {marriageHistory.length === 0 ? (
              <div className="py-24 text-center bg-[#FDFBF7] border-2 border-dashed border-[#D7CCC8] rounded-none group">
                <Heart className="h-16 w-16 mx-auto text-[#D7CCC8] mb-6 group-hover:text-[#8B0000]/30 transition-colors" />
                <h3 className="text-xl font-bold text-[#3E2723] mb-2">名册尚空</h3>
                <p className="text-[#8D6E63] mb-8 italic">您还未进行过合婚卜算</p>
                <Button asChild className="bg-[#3E2723] hover:bg-[#2D1B19] text-white rounded-none h-12 px-10">
                  <Link href="/workspace/bazi-marriage">立即卜算</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {marriageHistory.map((item) => {
                  const scoreLevel = getScoreLevel(item.overallScore);
                  return (
                    <div key={item.id} className="group relative">
                      <div className="absolute inset-0 bg-[#8B0000]/5 transform -rotate-1 skew-x-1 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <Card className="rounded-none border-2 border-[#D7CCC8] bg-[#FDFBF7] hover:border-[#8B0000]/30 transition-all shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#F5F2E9] transform rotate-45 translate-x-8 -translate-y-8 pointer-events-none opacity-50" />
                        <CardContent className="p-8">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-sm bg-[#FFF9ED] border border-[#D7CCC8] flex items-center justify-center shadow-inner group-hover:bg-[#8B0000] transition-colors duration-500">
                                <Heart className="h-8 w-8 text-[#8B0000] group-hover:text-white transition-colors" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-[#3E2723] mb-1">
                                  {item.person1Name} <span className="text-[#8B0000] mx-2">♥</span> {item.person2Name}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-[#8D6E63] italic">
                                  <History className="w-3 h-3" />
                                  {format(new Date(item.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between md:justify-end gap-10 border-t md:border-t-0 pt-4 md:pt-0">
                              <div className="text-center md:text-right">
                                <div className="flex items-baseline gap-1 mb-1">
                                  <span className="text-4xl font-serif font-bold text-[#8B0000]">
                                    {item.overallScore}
                                  </span>
                                  <span className="text-xs text-[#8D6E63] font-bold tracking-widest">分</span>
                                </div>
                                <div className={`text-[10px] px-3 py-0.5 inline-block text-white rounded-none tracking-widest ${
                                  item.overallScore >= 80 ? 'bg-green-800' : 
                                  item.overallScore >= 70 ? 'bg-blue-800' : 
                                  item.overallScore >= 60 ? 'bg-orange-800' : 'bg-red-900'
                                }`}>
                                  {scoreLevel.label}
                                </div>
                              </div>
                              
                              <Button variant="ghost" size="icon" asChild className="w-12 h-12 rounded-none border border-[#D7CCC8] hover:bg-[#8B0000] hover:text-white transition-all group/btn">
                                <Link href={`/workspace/bazi-marriage/${item.id}`}>
                                  <ArrowRight className="h-5 w-5 transform group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* 姻缘历史 */}
          <TabsContent value="destiny" className="mt-6">
            <div className="flex justify-end mb-6">
              <Button asChild className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-none border-b-4 border-pink-800 font-serif tracking-widest shadow-xl h-12 px-8">
                <Link href="/workspace/bazi-destiny">
                  <Plus className="mr-2 h-4 w-4" />
                  新建姻缘分析
                </Link>
              </Button>
            </div>

            {destinyHistory.length === 0 ? (
              <div className="py-24 text-center bg-[#FDFBF7] border-2 border-dashed border-[#D7CCC8] rounded-none group">
                <Sparkles className="h-16 w-16 mx-auto text-[#D7CCC8] mb-6 group-hover:text-pink-500/30 transition-colors" />
                <h3 className="text-xl font-bold text-[#3E2723] mb-2">名册尚空</h3>
                <p className="text-[#8D6E63] mb-8 italic">您还未进行过姻缘分析</p>
                <Button asChild className="bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-none h-12 px-10">
                  <Link href="/workspace/bazi-destiny">立即分析</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {destinyHistory.map((item) => (
                  <div key={item.id} className="group relative">
                    <div className="absolute inset-0 bg-pink-500/5 transform -rotate-1 skew-x-1 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <Card className="rounded-none border-2 border-[#D7CCC8] bg-[#FDFBF7] hover:border-pink-500/30 transition-all shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[#F5F2E9] transform rotate-45 translate-x-8 -translate-y-8 pointer-events-none opacity-50" />
                      <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-sm bg-pink-50 border border-pink-200 flex items-center justify-center shadow-inner group-hover:bg-pink-500 transition-colors duration-500">
                              <User className="h-8 w-8 text-pink-500 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-[#3E2723] mb-1">
                                {item.name}
                                <span className="ml-2 text-sm font-normal text-[#8D6E63]">
                                  ({item.gender === 'male' ? '男' : '女'})
                                </span>
                              </h3>
                              <div className="flex items-center gap-3 text-xs text-[#8D6E63] italic">
                                <History className="w-3 h-3" />
                                {format(new Date(item.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-end gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                            <div className="text-[10px] px-3 py-1 bg-pink-100 text-pink-700 rounded-none tracking-widest">
                              姻缘分析
                            </div>
                            
                            <Button variant="ghost" size="icon" asChild className="w-12 h-12 rounded-none border border-[#D7CCC8] hover:bg-pink-500 hover:text-white transition-all group/btn">
                              <Link href={`/workspace/bazi-destiny/${item.id}`}>
                                <ArrowRight className="h-5 w-5 transform group-hover/btn:translate-x-1 transition-transform" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

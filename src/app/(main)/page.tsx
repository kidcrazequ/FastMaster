/**
 * 首页
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 网站首页，展示产品介绍和功能入口，古典中国风设计
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Heart,
  Sparkles,
  Brain,
  Shield,
  ArrowRight,
  BookOpen,
  MessageCircle,
  TrendingUp,
  Compass,
  Scroll,
  Star,
  Calendar,
} from 'lucide-react';

/** 核心理念 */
const principles = [
  {
    icon: Brain,
    title: '智慧 · 科学解析',
    description: '融合现代 AI 技术与传统命理智慧，通过大数据解读，让千年玄学焕发新生。',
  },
  {
    icon: BookOpen,
    title: '传承 · 理性态度',
    description: '以理性、开放的态度传承东方智慧，去芜存菁，让古老文化滋养现代生活。',
  },
  {
    icon: Shield,
    title: '求真 · 独立思考',
    description: '命理如明镜，映照本心。通过 AI 工具，助您独立探索命运之律。',
  },
];

/**
 * 首页组件
 */
export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2E9] relative overflow-hidden font-serif">
      {/* 背景纹理 */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
      
      {/* 古典装饰边角 */}
      <div className="fixed top-4 left-4 w-24 h-24 border-t-2 border-l-2 border-[#8B0000]/20 pointer-events-none z-10" />
      <div className="fixed top-4 right-4 w-24 h-24 border-t-2 border-r-2 border-[#8B0000]/20 pointer-events-none z-10" />
      <div className="fixed bottom-4 left-4 w-24 h-24 border-b-2 border-l-2 border-[#8B0000]/20 pointer-events-none z-10" />
      <div className="fixed bottom-4 right-4 w-24 h-24 border-b-2 border-r-2 border-[#8B0000]/20 pointer-events-none z-10" />

      {/* Hero 区域 */}
      <section className="relative py-20 md:py-32 overflow-hidden border-b border-[#D7CCC8]/30">
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-none border border-[#8B0000]/30 bg-[#FFF9ED] text-[#8B0000] text-sm tracking-widest shadow-sm">
              <Sparkles className="h-4 w-4" />
              人工智能 · 传统命理
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-[#3E2723] tracking-tighter">
                命理大师
              </h1>
              <p className="text-[#8B0000] font-serif text-lg md:text-xl tracking-[0.2em] italic opacity-80">
                “博通阴阳理，洞察天地机”
              </p>
            </div>
            
            <p className="text-xl text-[#5D4037] max-w-2xl mx-auto leading-relaxed">
              融合五行生克智慧与尖端 AI 算力，为您呈现专业、深度、有温度的八字解析。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
              <Button size="lg" asChild className="px-12 h-14 bg-[#8B0000] hover:bg-[#7A0000] text-[#FFD700] rounded-none border-b-4 border-[#5D0000] font-serif tracking-[0.3em] text-lg shadow-xl">
                <Link href="/workspace/bazi-marriage">
                  <Compass className="mr-3 h-5 w-5" />
                  开启问姻缘
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="px-12 h-14 border-2 border-[#3E2723] text-[#3E2723] hover:bg-[#3E2723] hover:text-[#FDFBF7] rounded-none font-serif tracking-[0.3em] text-lg bg-transparent">
                <Link href="/register">注册名册</Link>
              </Button>
            </div>
            
            <div className="pt-10 flex justify-center">
              <div className="p-4 border border-dashed border-[#D7CCC8] bg-[#FDFBF7]/50 max-w-sm">
                <p className="text-xs text-[#8D6E63] italic leading-relaxed">
                  &ldquo;除非你意识到你的潜意识，否则潜意识将主导你的人生，而你将其称为命运。&rdquo;
                  <br />
                  <span className="not-italic opacity-60">— 卡尔·荣格</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 核心理念 */}
      <section className="py-24 bg-[#FDFBF7] border-b border-[#D7CCC8]/30">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <div className="flex justify-center items-center gap-4 mb-2">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#8B0000]/20" />
              <div className="w-10 h-10 bg-[#8B0000] rounded-sm flex items-center justify-center border border-[#FFD700]/30 shadow-md transform rotate-45">
                <Scroll className="w-5 h-5 text-white transform -rotate-45" />
              </div>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#8B0000]/20" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-[#3E2723] tracking-widest">核心理念</h2>
            <p className="text-[#8D6E63] text-sm tracking-widest italic uppercase opacity-70">Core Principles</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {principles.map((item) => (
              <div key={item.title} className="text-center space-y-6 group">
                <div className="w-20 h-20 mx-auto rounded-full bg-[#FFF9ED] border-2 border-[#D7CCC8] flex items-center justify-center group-hover:border-[#8B0000] group-hover:bg-[#FFEBEB] transition-all duration-500 shadow-sm relative">
                   <div className="absolute inset-0 rounded-full border border-dashed border-[#8B0000]/10 animate-spin-slow" />
                   <item.icon className="h-8 w-8 text-[#8D6E63] group-hover:text-[#8B0000] transition-colors" />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#3E2723]">{item.title}</h3>
                <p className="text-sm text-[#5D4037] leading-relaxed italic opacity-90">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 合婚功能展示 */}
      <section className="py-24 relative overflow-hidden">
        {/* 装饰水印 */}
        <div className="absolute -bottom-20 -left-20 text-[200px] font-serif text-[#8B0000]/5 pointer-events-none">缘</div>
        
        <div className="container relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-serif font-bold text-[#3E2723] tracking-widest">三生合婚</h2>
            <p className="text-[#8B0000] italic text-sm">“愿天下有情人，终成眷属”</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                icon: Heart, 
                title: '契合深度分析', 
                desc: '智能解读双方八字磁场，评估五行补救与能量平衡。',
                color: 'border-pink-200/50'
              },
              { 
                icon: TrendingUp, 
                title: '维度全景剖析', 
                desc: '从性格、婚姻宫、家庭、子嗣等多重维度，解析相处之道。',
                color: 'border-blue-200/50'
              },
              { 
                icon: MessageCircle, 
                title: 'AI 问天解惑', 
                desc: '支持针对分析结果进行无限次追问，助您拨云见日，明确心意。',
                color: 'border-amber-200/50'
              }
            ].map((item, idx) => (
              <Card key={idx} className="rounded-none border-2 border-[#D7CCC8] bg-[#FDFBF7] shadow-sm hover:shadow-xl hover:border-[#8B0000]/30 transition-all duration-500 group">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-sm bg-[#F5F2E9] border border-[#D7CCC8]/50 flex items-center justify-center mb-4 group-hover:bg-[#8B0000] transition-colors`}>
                    <item.icon className="h-6 w-6 text-[#8B0000] group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="font-serif font-bold text-[#3E2723]">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-[#5D4037] italic leading-relaxed">{item.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Button size="lg" asChild className="px-16 h-14 bg-[#8B0000] hover:bg-[#7A0000] text-[#FFD700] rounded-none border-b-4 border-[#5D0000] font-serif tracking-[0.3em] text-lg shadow-xl">
              <Link href="/workspace/bazi-marriage">
                立即批算
                <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 算姻缘功能展示 */}
      <section className="py-24 bg-[#FDFBF7] relative overflow-hidden border-b border-[#D7CCC8]/30">
        {/* 装饰水印 */}
        <div className="absolute -bottom-20 -right-20 text-[200px] font-serif text-[#8B0000]/5 pointer-events-none">命</div>
        
        <div className="container relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-serif font-bold text-[#3E2723] tracking-widest">算姻缘</h2>
            <p className="text-[#8B0000] italic text-sm">"缘起缘灭，皆有定数"</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                icon: Star, 
                title: '桃花运势分析', 
                desc: 'AI 智能分析您的桃花运特点、旺盛时期与注意事项。',
                color: 'border-pink-200/50'
              },
              { 
                icon: Heart, 
                title: '理想对象匹配', 
                desc: '根据八字特征，描绘最适合您的另一半特质与性格。',
                color: 'border-rose-200/50'
              },
              { 
                icon: Calendar, 
                title: '流年运势展望', 
                desc: '分析近几年姻缘运势走向，助您把握最佳时机。',
                color: 'border-amber-200/50'
              }
            ].map((item, idx) => (
              <Card key={idx} className="rounded-none border-2 border-[#D7CCC8] bg-[#F5F2E9] shadow-sm hover:shadow-xl hover:border-[#8B0000]/30 transition-all duration-500 group">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-sm bg-[#FDFBF7] border border-[#D7CCC8]/50 flex items-center justify-center mb-4 group-hover:bg-[#8B0000] transition-colors`}>
                    <item.icon className="h-6 w-6 text-[#8B0000] group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="font-serif font-bold text-[#3E2723]">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-[#5D4037] italic leading-relaxed">{item.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Button size="lg" asChild className="px-16 h-14 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-none border-b-4 border-pink-800 font-serif tracking-[0.3em] text-lg shadow-xl">
              <Link href="/workspace/bazi-destiny">
                算我姻缘
                <Sparkles className="ml-3 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-24 bg-[#3E2723] text-white relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
        <div className="container relative z-10 text-center">
          <div className="max-w-2xl mx-auto space-y-10">
            <div className="space-y-4">
              <h2 className="text-4xl font-serif font-bold tracking-widest text-[#FFD700]">共话前生今世</h2>
              <p className="text-[#D7CCC8] text-lg italic leading-relaxed">
                洞察命理玄机，把握人生方向。<br />
                为您的人生决策，提供一份跨越千年的参考。
              </p>
            </div>
            <Button size="lg" variant="secondary" asChild className="px-16 h-14 bg-[#FFD700] hover:bg-[#E6C200] text-[#3E2723] rounded-none border-b-4 border-[#C4A000] font-serif tracking-[0.4em] text-lg shadow-xl">
              <Link href="/workspace/bazi-marriage">
                立即启程
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

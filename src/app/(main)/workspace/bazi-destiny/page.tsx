/**
 * 算姻缘分析页面
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 个人姻缘分析输入表单页面
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Heart, Sparkles, Loader2, Star, TrendingUp, MessageCircle, Search, History } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

/** 表单验证 Schema */
const destinyFormSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  gender: z.enum(['male', 'female'], { required_error: '请选择性别' }),
  isLunarCalendar: z.boolean().default(false),
  isLeapMonth: z.boolean().default(false),
  birthYear: z.string().min(1, '请选择年份'),
  birthMonth: z.string().min(1, '请选择月份'),
  birthDay: z.string().min(1, '请选择日期'),
  knowBirthTime: z.boolean().default(false),
  birthHour: z.string().optional(),
  birthMinute: z.string().optional(),
  birthPlace: z.string().optional(),
  useTrueSolarTime: z.boolean().default(false),
  isEarlyZiHour: z.boolean().optional(),
});

type DestinyFormData = z.infer<typeof destinyFormSchema>;

/** 年份选项 */
const years = Array.from({ length: 100 }, (_, i) => ({
  value: String(2024 - i),
  label: `${2024 - i}年`,
}));

/** 公历月份选项 */
const months = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}月`,
}));

/** 农历月份选项 */
const lunarMonthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const lunarMonths = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: lunarMonthNames[i],
}));

/** 公历日期选项 */
const days = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}日`,
}));

/** 农历日期选项 */
const lunarDayNames = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
const lunarDays = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: lunarDayNames[i],
}));

/** 小时选项 */
const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${i}时`,
}));

/** 分钟选项 */
const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
  value: String(i),
  label: `${i}分`,
}));

/** 分析维度 */
const dimensions = [
  {
    icon: Heart,
    title: '桃花运势',
    description: '分析您的桃花运特点和时机',
    color: 'text-pink-500',
  },
  {
    icon: Star,
    title: '婚姻宫位',
    description: '解读八字中的婚姻信息',
    color: 'text-purple-500',
  },
  {
    icon: TrendingUp,
    title: '流年运势',
    description: '近几年姻缘运势展望',
    color: 'text-blue-500',
  },
  {
    icon: MessageCircle,
    title: 'AI 解答',
    description: '支持追问获取个性化建议',
    color: 'text-green-500',
  },
];

/**
 * 算姻缘页面组件
 */
export default function BaziDestinyPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DestinyFormData>({
    resolver: zodResolver(destinyFormSchema),
    defaultValues: {
      gender: 'male',
      knowBirthTime: false,
      isLunarCalendar: false,
      birthYear: '',
      birthMonth: '',
      birthDay: '',
    },
  });

  // 调试：当表单提交失败时显示所有错误
  const onError = (formErrors: typeof errors) => {
    console.log('表单验证错误:', formErrors);
    const errorMessages = Object.entries(formErrors)
      .map(([field, error]) => `${field}: ${error?.message}`)
      .join(', ');
    if (errorMessages) {
      toast.error(`请完善信息: ${errorMessages}`);
    }
  };

  const gender = watch('gender');
  const knowBirthTime = watch('knowBirthTime');
  const birthHour = watch('birthHour');
  const isLunarCalendar = watch('isLunarCalendar');
  const birthPlace = watch('birthPlace');

  /** 判断是否需要显示早晚子时选项 */
  const showZiHourOption = knowBirthTime && birthHour && (birthHour === '23' || birthHour === '0');

  /** 根据日历类型获取月份和日期选项 */
  const currentMonths = isLunarCalendar ? lunarMonths : months;
  const currentDays = isLunarCalendar ? lunarDays : days;

  /** 提交分析 */
  const onSubmit = async (data: DestinyFormData) => {
    if (!session) {
      toast.error('请先登录后再进行分析');
      router.push('/login?callbackUrl=/workspace/bazi-destiny');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/bazi/destiny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || '分析失败');
        return;
      }

      // 跳转到结果页面
      router.push(`/workspace/bazi-destiny/${result.data.id}`);
    } catch (error) {
      console.error('分析失败:', error);
      toast.error('分析失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* 顶部标题栏 */}
        <div className="flex justify-between items-center mb-10 border-b-2 border-[#8B0000] pb-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-[#8B0000] rounded-sm flex items-center justify-center text-white text-3xl font-serif shadow-xl border-2 border-[#FFD700]">
               算
             </div>
             <div>
               <h1 className="text-3xl font-serif font-bold text-[#3E2723]">姻缘求签 · 卜吉凶</h1>
               <p className="text-[#8D6E63] text-sm mt-1 italic">“心诚则灵，签定姻缘。”</p>
             </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 border border-[#D7CCC8] text-[#8D6E63] rounded-sm text-sm cursor-pointer hover:bg-[#FFF9ED] transition-colors" onClick={() => router.push('/workspace/history')}>
            <History className="w-4 h-4" />
            <span>查看往期名册</span>
          </div>
        </div>

        {/* 分析维度说明 - 经书折页风格 */}
        <div className="relative mb-12 group">
          <div className="absolute inset-0 bg-[#8B0000]/5 transform -rotate-1 skew-x-1" />
          <div className="relative bg-[#FFF9ED] border-2 border-[#D7CCC8] p-8 shadow-sm group-hover:border-[#8B0000]/30 transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#8B0000] rounded-full">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-[#3E2723] tracking-widest">姻缘要义</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dimensions.map((dim) => (
                <div key={dim.title} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <dim.icon className={`h-4 w-4 ${dim.color}`} />
                    <h3 className="font-bold text-[#5D4037] text-sm">{dim.title}</h3>
                  </div>
                  <p className="text-xs text-[#8D6E63] leading-relaxed">{dim.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 输入表单 */}
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-[#8B0000]" />
            <h2 className="text-xl font-bold text-[#3E2723]">录入生辰信息</h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className={`relative p-8 rounded-none border-2 border-[#3E2723] bg-[#FDFBF7] shadow-xl overflow-hidden group`}>
              {/* 装饰边角 */}
              <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#3E2723]/30 z-10`} />
              <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#3E2723]/30 z-10`} />
              <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#3E2723]/30 z-10`} />
              <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#3E2723]/30 z-10`} />

              <div className="space-y-8 relative z-10">
                {/* 姓名 */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#5D4037] font-bold">尊姓大名</Label>
                  <Input
                    id="name"
                    placeholder="请输入姓名"
                    {...register('name')}
                    className="rounded-none border-[#D7CCC8] bg-white/50 focus:border-[#8B0000] transition-colors h-11"
                  />
                  {errors.name && (
                    <p className="text-xs text-[#8B0000] italic">{errors.name.message}</p>
                  )}
                </div>

                {/* 性别 */}
                <div className="space-y-2">
                  <Label className="text-[#5D4037] font-bold">性别</Label>
                  <RadioGroup
                    value={gender}
                    onValueChange={(value) => setValue('gender', value as 'male' | 'female')}
                    className="flex gap-10"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" className="border-[#D7CCC8] text-[#8B0000]" />
                      <Label htmlFor="male" className="font-bold cursor-pointer text-[#5D4037]">男（乾造）</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" className="border-[#D7CCC8] text-[#8B0000]" />
                      <Label htmlFor="female" className="font-bold cursor-pointer text-[#5D4037]">女（坤造）</Label>
                    </div>
                  </RadioGroup>
                  {errors.gender && (
                    <p className="text-xs text-[#8B0000] italic">{errors.gender.message}</p>
                  )}
                </div>

                {/* 日历类型选择 */}
                <div className="space-y-4 p-6 bg-[#F5F2E9]/50 border border-[#D7CCC8]/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#5D4037] font-bold">出生日期</Label>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${!isLunarCalendar ? 'font-bold text-[#8B0000]' : 'text-[#8D6E63]'}`}>公历</span>
                      <Switch
                        checked={isLunarCalendar || false}
                        onCheckedChange={(checked) => setValue('isLunarCalendar', checked)}
                        className="data-[state=checked]:bg-[#8B0000]"
                      />
                      <span className={`text-xs ${isLunarCalendar ? 'font-bold text-[#8B0000]' : 'text-[#8D6E63]'}`}>农历</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Select onValueChange={(v) => setValue('birthYear', v)}>
                      <SelectTrigger className="rounded-none border-[#D7CCC8] bg-white h-10">
                        <SelectValue placeholder="年" />
                      </SelectTrigger>
                      <SelectContent className="font-serif">
                        {years.map((y) => (
                          <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={(v) => setValue('birthMonth', v)}>
                      <SelectTrigger className="rounded-none border-[#D7CCC8] bg-white h-10">
                        <SelectValue placeholder={isLunarCalendar ? "月份" : "月"} />
                      </SelectTrigger>
                      <SelectContent className="font-serif">
                        {currentMonths.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={(v) => setValue('birthDay', v)}>
                      <SelectTrigger className="rounded-none border-[#D7CCC8] bg-white h-10">
                        <SelectValue placeholder={isLunarCalendar ? "日期" : "日"} />
                      </SelectTrigger>
                      <SelectContent className="font-serif">
                        {currentDays.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {isLunarCalendar && (
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        checked={watch('isLeapMonth') || false}
                        onCheckedChange={(checked) => setValue('isLeapMonth', checked)}
                        className="data-[state=checked]:bg-[#8B0000] scale-75"
                      />
                      <Label className="cursor-pointer text-[10px] text-[#8D6E63]">
                        闰月（若该农历月为闰月请开启）
                      </Label>
                    </div>
                  )}
                  {(errors.birthYear || errors.birthMonth || errors.birthDay) && (
                    <p className="text-[10px] text-[#8B0000] italic">请选择完整的出生日期</p>
                  )}
                </div>

                {/* 知道出生时间开关 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={knowBirthTime}
                      onCheckedChange={(checked) => setValue('knowBirthTime', checked)}
                      className="data-[state=checked]:bg-[#8B0000]"
                    />
                    <Label className="cursor-pointer text-[#5D4037] font-bold">
                      明确出生时辰
                    </Label>
                  </div>
                  {!knowBirthTime && (
                    <p className="text-[10px] text-[#8D6E63] italic leading-relaxed">
                      * 若不知时辰，将按中午12时（午时）计算，可能影响批算之精准度。
                    </p>
                  )}
                </div>

                {/* 出生时间 */}
                {knowBirthTime && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                    <Label className="text-[#5D4037] font-bold text-sm">出生时分</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Select onValueChange={(v) => setValue('birthHour', v)}>
                        <SelectTrigger className="rounded-none border-[#D7CCC8] bg-white h-10">
                          <SelectValue placeholder="时" />
                        </SelectTrigger>
                        <SelectContent className="font-serif">
                          {hourOptions.map((h) => (
                            <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select onValueChange={(v) => setValue('birthMinute', v)}>
                        <SelectTrigger className="rounded-none border-[#D7CCC8] bg-white h-10">
                          <SelectValue placeholder="分" />
                        </SelectTrigger>
                        <SelectContent className="font-serif">
                          {minuteOptions.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* 出生地点 */}
                <div className="space-y-2">
                  <Label htmlFor="birthPlace" className="text-[#5D4037] font-bold">出生地点</Label>
                  <div className="relative">
                    <Input
                      id="birthPlace"
                      placeholder="请输入省市区，以便计算经度..."
                      {...register('birthPlace')}
                      className="rounded-none border-[#D7CCC8] bg-white/50 pr-10 focus:border-[#8B0000] h-11"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8D6E63]" />
                  </div>
                </div>

                {/* 真太阳时与早晚子时 */}
                <div className="space-y-3 pt-4 border-t border-[#D7CCC8]/30">
                  {knowBirthTime && birthPlace && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={watch('useTrueSolarTime') || false}
                        onCheckedChange={(checked) => setValue('useTrueSolarTime', checked)}
                        className="data-[state=checked]:bg-[#8B0000] scale-75"
                      />
                      <Label className="cursor-pointer text-[10px] text-[#5D4037]">
                        校正真太阳时（推荐开启，确保时辰无误）
                      </Label>
                    </div>
                  )}

                  {showZiHourOption && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={watch('isEarlyZiHour') || false}
                        onCheckedChange={(checked) => setValue('isEarlyZiHour', checked)}
                        className="data-[state=checked]:bg-[#8B0000] scale-75"
                      />
                      <Label className="cursor-pointer text-[10px] text-[#5D4037]">
                        早晚子时切换（开启为早子时，关闭为晚子时）
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#8B0000] blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <Button
                type="submit"
                size="lg"
                className="relative px-20 h-14 bg-[#8B0000] hover:bg-[#7A0000] text-[#FFD700] rounded-none border-b-4 border-[#5D0000] font-serif tracking-[0.4em] text-lg shadow-xl transition-all active:translate-y-1 active:border-b-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    求签中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-3 h-5 w-5" />
                    求取姻缘笺
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

      {/* 底部补充说明 - 宣纸批注风格 */}
      <div className="mt-20 p-8 rounded-none border border-dashed border-[#D7CCC8] bg-[#FDFBF7]/50 relative max-w-4xl mx-auto">
        <div className="absolute -top-3 left-8 px-4 bg-[#F5F2E9] text-[#8B0000] font-bold text-xs flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          <span>批算须知</span>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <h4 className="font-bold text-sm text-[#3E2723] mb-2">缘分天定</h4>
            <p className="text-xs text-[#8D6E63] leading-relaxed italic">
              通过八字命盘深度解析个人姻缘潜质，为您揭示命中注定的桃花机遇与情感走向。
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#3E2723] mb-2">流年契机</h4>
            <p className="text-xs text-[#8D6E63] leading-relaxed italic">
              观察大运与流年之互动，为您捕捉最适宜步入婚姻殿堂或邂逅良缘的黄金时机。
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#3E2723] mb-2">趋吉避凶</h4>
            <p className="text-xs text-[#8D6E63] leading-relaxed italic">
              指出性格中的情感短板与潜在波折，辅助您在感情道路上理性抉择，修成正果。
            </p>
          </div>
        </div>
        <p className="mt-8 text-[10px] text-center text-[#8D6E63] opacity-60 italic">
          * 命理参考，旨在助您更好了解自我与把握契机，幸福终究掌握在自己手中。
        </p>
      </div>
    </div>
  </div>
);
}

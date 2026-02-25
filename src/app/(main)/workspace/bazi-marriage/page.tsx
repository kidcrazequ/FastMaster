/**
 * 八字合婚分析页面
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 合婚分析主页面，包含表单输入和历史记录
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
import { 
  Heart, 
  Sparkles, 
  Users, 
  Home, 
  Loader2, 
  FileEdit, 
  Brain, 
  FileText, 
  MessageCircle, 
  Search,
  Compass,
  ArrowRight,
  BookOpen,
  History,
  Info
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

/** 个人信息 Schema */
const personSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  gender: z.enum(['male', 'female'], { required_error: '请选择性别' }),
  isLunarCalendar: z.boolean().default(false),  // 是否农历
  isLeapMonth: z.boolean().default(false),       // 是否闰月（农历时使用）
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

/** 表单验证 Schema */
const marriageFormSchema = z.object({
  person1: personSchema,
  person2: personSchema,
});

type MarriageFormData = z.infer<typeof marriageFormSchema>;

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

/** 小时选项（0-23） */
const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${i}时`,
}));

/** 分钟选项（0-59） */
const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
  value: String(i),
  label: `${i}分`,
}));

/** 分析维度卡片 */
const dimensions = [
  {
    icon: Heart,
    title: '基础契合度',
    description: '分析双方八字的基本匹配程度，评估感情基础',
    color: 'text-pink-500',
  },
  {
    icon: Users,
    title: '性格相容性',
    description: '评估双方性格特征的互补程度，观察相处模式特点',
    color: 'text-blue-500',
  },
  {
    icon: Sparkles,
    title: '婚姻宫位',
    description: '解读双方的婚姻命盘特征，参考婚姻特点',
    color: 'text-purple-500',
  },
  {
    icon: Home,
    title: '家庭和谐',
    description: '分析双方在家庭生活中的相处模式，参考家庭互动特点',
    color: 'text-green-500',
  },
];

/** 分析流程步骤 */
const processSteps = [
  {
    step: 1,
    icon: FileEdit,
    title: '填写信息',
    description: '输入双方生辰八字',
  },
  {
    step: 2,
    icon: Brain,
    title: '智能分析',
    description: 'AI 系统解读契合度',
  },
  {
    step: 3,
    icon: FileText,
    title: '生成报告',
    description: '获取详细分析结果',
  },
  {
    step: 4,
    icon: MessageCircle,
    title: '深度咨询',
    description: 'AI 解答关键问题',
  },
];

/**
 * 个人信息表单组件
 */
function PersonForm({
  title,
  prefix,
  register,
  errors,
  setValue,
  watch,
}: {
  title: string;
  prefix: 'person1' | 'person2';
  register: ReturnType<typeof useForm<MarriageFormData>>['register'];
  errors: ReturnType<typeof useForm<MarriageFormData>>['formState']['errors'];
  setValue: ReturnType<typeof useForm<MarriageFormData>>['setValue'];
  watch: ReturnType<typeof useForm<MarriageFormData>>['watch'];
}) {
  const personErrors = errors[prefix];
  const gender = watch(`${prefix}.gender`);
  const knowBirthTime = watch(`${prefix}.knowBirthTime`);
  const birthHour = watch(`${prefix}.birthHour`);
  const isLunarCalendar = watch(`${prefix}.isLunarCalendar`);

  /** 判断是否需要显示早晚子时选项 */
  const showZiHourOption = knowBirthTime && birthHour && (birthHour === '23' || birthHour === '0');

  /** 根据日历类型获取月份和日期选项 */
  const currentMonths = isLunarCalendar ? lunarMonths : months;
  const currentDays = isLunarCalendar ? lunarDays : days;

  const isPerson1 = prefix === 'person1';

  return (
    <div className={`relative p-6 rounded-none border-2 ${isPerson1 ? 'border-[#3E2723]' : 'border-[#8B0000]'} bg-[#FFF9ED] shadow-md overflow-hidden group font-serif`}>
      {/* 装饰边角 */}
      <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 ${isPerson1 ? 'border-[#3E2723]/30' : 'border-[#8B0000]/30'} z-10`} />
      <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 ${isPerson1 ? 'border-[#3E2723]/30' : 'border-[#8B0000]/30'} z-10`} />
      <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 ${isPerson1 ? 'border-[#3E2723]/30' : 'border-[#8B0000]/30'} z-10`} />
      <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 ${isPerson1 ? 'border-[#3E2723]/30' : 'border-[#8B0000]/30'} z-10`} />

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className={`text-xl font-bold ${isPerson1 ? 'text-[#3E2723]' : 'text-[#8B0000]'} flex items-center gap-3`}>
          <span className={`w-1 h-6 ${isPerson1 ? 'bg-[#3E2723]' : 'bg-[#8B0000]'}`} />
          {title}
        </h3>
        <div className={`w-10 h-10 ${isPerson1 ? 'bg-[#3E2723]' : 'bg-[#8B0000]'} rounded-sm flex items-center justify-center text-white text-xs transform -rotate-6 border border-[#FFD700]/30 shadow-sm`}>
          {isPerson1 ? '乾造' : '坤造'}
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {/* 姓名 */}
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-name`} className="text-[#5D4037] font-bold">姓名</Label>
          <Input
            id={`${prefix}-name`}
            placeholder="请输入姓名"
            {...register(`${prefix}.name`)}
            className="rounded-none border-[#D7CCC8] bg-white/50 focus:border-[#8B0000] transition-colors"
          />
          {personErrors?.name && (
            <p className="text-xs text-[#8B0000] italic">{personErrors.name.message}</p>
          )}
        </div>

        {/* 性别 */}
        <div className="space-y-2">
          <Label className="text-[#5D4037] font-bold">性别</Label>
          <RadioGroup
            value={gender}
            onValueChange={(value) => setValue(`${prefix}.gender`, value as 'male' | 'female')}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id={`${prefix}-male`} className="border-[#D7CCC8] text-[#8B0000]" />
              <Label htmlFor={`${prefix}-male`} className="font-normal cursor-pointer text-[#5D4037]">男</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id={`${prefix}-female`} className="border-[#D7CCC8] text-[#8B0000]" />
              <Label htmlFor={`${prefix}-female`} className="font-normal cursor-pointer text-[#5D4037]">女</Label>
            </div>
          </RadioGroup>
          {personErrors?.gender && (
            <p className="text-xs text-[#8B0000] italic">{personErrors.gender.message}</p>
          )}
        </div>

        {/* 日历类型选择 */}
        <div className="space-y-3 p-4 bg-[#F5F2E9]/50 border border-[#D7CCC8]/30">
          <div className="flex items-center justify-between">
            <Label className="text-[#5D4037] font-bold">出生日期</Label>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${!isLunarCalendar ? 'font-bold text-[#8B0000]' : 'text-[#8D6E63]'}`}>公历</span>
              <Switch
                id={`${prefix}-isLunarCalendar`}
                checked={isLunarCalendar || false}
                onCheckedChange={(checked) => setValue(`${prefix}.isLunarCalendar`, checked)}
                className="data-[state=checked]:bg-[#8B0000]"
              />
              <span className={`text-xs ${isLunarCalendar ? 'font-bold text-[#8B0000]' : 'text-[#8D6E63]'}`}>农历</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Select onValueChange={(v) => setValue(`${prefix}.birthYear`, v)}>
              <SelectTrigger className="rounded-none border-[#D7CCC8] bg-white/50 h-9">
                <SelectValue placeholder="年" />
              </SelectTrigger>
              <SelectContent className="font-serif">
                {years.map((y) => (
                  <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(v) => setValue(`${prefix}.birthMonth`, v)}>
              <SelectTrigger className="rounded-none border-[#D7CCC8] bg-white/50 h-9">
                <SelectValue placeholder={isLunarCalendar ? "月份" : "月"} />
              </SelectTrigger>
              <SelectContent className="font-serif">
                {currentMonths.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(v) => setValue(`${prefix}.birthDay`, v)}>
              <SelectTrigger className="rounded-none border-[#D7CCC8] bg-white/50 h-9">
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
                id={`${prefix}-isLeapMonth`}
                checked={watch(`${prefix}.isLeapMonth`) || false}
                onCheckedChange={(checked) => setValue(`${prefix}.isLeapMonth`, checked)}
                className="data-[state=checked]:bg-[#8B0000] scale-75"
              />
              <Label htmlFor={`${prefix}-isLeapMonth`} className="cursor-pointer text-[10px] text-[#8D6E63]">
                闰月（若该农历月为闰月请开启）
              </Label>
            </div>
          )}
          {(personErrors?.birthYear || personErrors?.birthMonth || personErrors?.birthDay) && (
            <p className="text-[10px] text-[#8B0000] italic">请选择完整的出生日期</p>
          )}
        </div>

        {/* 知道出生时间开关 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch
              id={`${prefix}-knowBirthTime`}
              checked={knowBirthTime}
              onCheckedChange={(checked) => setValue(`${prefix}.knowBirthTime`, checked)}
              className="data-[state=checked]:bg-[#8B0000]"
            />
            <Label htmlFor={`${prefix}-knowBirthTime`} className="cursor-pointer text-[#5D4037] font-bold">
              知道出生时间
            </Label>
          </div>
          {!knowBirthTime && (
            <p className="text-[10px] text-[#8D6E63] italic leading-relaxed">
              * 不选择时间将按中午12时计算，会影响时柱及八字分析的准确性。
            </p>
          )}
        </div>

        {/* 出生时间 */}
        {knowBirthTime && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <Label className="text-[#5D4037] font-bold text-sm">出生时分</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select onValueChange={(v) => setValue(`${prefix}.birthHour`, v)}>
                <SelectTrigger className="rounded-none border-[#D7CCC8] bg-white/50 h-9">
                  <SelectValue placeholder="时" />
                </SelectTrigger>
                <SelectContent className="font-serif">
                  {hourOptions.map((h) => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => setValue(`${prefix}.birthMinute`, v)}>
                <SelectTrigger className="rounded-none border-[#D7CCC8] bg-white/50 h-9">
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
          <Label htmlFor={`${prefix}-birthPlace`} className="text-[#5D4037] font-bold">出生地点</Label>
          <div className="relative">
            <Input
              id={`${prefix}-birthPlace`}
              placeholder="请输入省市区，用于计算经度..."
              {...register(`${prefix}.birthPlace`)}
              className="rounded-none border-[#D7CCC8] bg-white/50 pr-10 focus:border-[#8B0000] transition-colors"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8D6E63]" />
          </div>
        </div>

        {/* 真太阳时与早晚子时 */}
        <div className="space-y-3 pt-2 border-t border-[#D7CCC8]/30">
          {knowBirthTime && watch(`${prefix}.birthPlace`) && (
            <div className="flex items-center gap-2">
              <Switch
                id={`${prefix}-useTrueSolarTime`}
                checked={watch(`${prefix}.useTrueSolarTime`) || false}
                onCheckedChange={(checked) => setValue(`${prefix}.useTrueSolarTime`, checked)}
                className="data-[state=checked]:bg-[#8B0000] scale-75"
              />
              <Label htmlFor={`${prefix}-useTrueSolarTime`} className="cursor-pointer text-[10px] text-[#5D4037]">
                计算真太阳时（建议开启，使时辰更精准）
              </Label>
            </div>
          )}

          {showZiHourOption && (
            <div className="flex items-center gap-2">
              <Switch
                id={`${prefix}-isEarlyZiHour`}
                checked={watch(`${prefix}.isEarlyZiHour`) || false}
                onCheckedChange={(checked) => setValue(`${prefix}.isEarlyZiHour`, checked)}
                className="data-[state=checked]:bg-[#8B0000] scale-75"
              />
              <Label htmlFor={`${prefix}-isEarlyZiHour`} className="cursor-pointer text-[10px] text-[#5D4037]">
                早晚子时（开启为早子时，关闭为晚子时）
              </Label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 八字合婚页面组件
 */
export default function BaziMarriagePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MarriageFormData>({
    resolver: zodResolver(marriageFormSchema),
    defaultValues: {
      person1: { gender: 'male', knowBirthTime: false },
      person2: { gender: 'female', knowBirthTime: false },
    },
  });

  /** 提交分析 */
  const onSubmit = async (data: MarriageFormData) => {
    if (!session) {
      toast.error('请先登录后再进行分析');
      router.push('/login?callbackUrl=/workspace/bazi-marriage');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/bazi/marriage', {
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
      router.push(`/workspace/bazi-marriage/${result.data.id}`);
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
               缘
             </div>
             <div>
               <h1 className="text-3xl font-serif font-bold text-[#3E2723]">三生石畔 · 问姻缘</h1>
               <p className="text-[#8D6E63] text-sm mt-1 italic">“合其生辰，卜其姻缘，窥天机而求美满。”</p>
             </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 border border-[#D7CCC8] text-[#8D6E63] rounded-sm text-sm">
            <History className="w-4 h-4" />
            <span>查看往期记录</span>
          </div>
        </div>

        {/* 核心功能介绍 - 经书折页风格 */}
        <div className="relative mb-12 group">
          <div className="absolute inset-0 bg-[#8B0000]/5 transform -rotate-1 skew-x-1" />
          <div className="relative bg-[#FFF9ED] border-2 border-[#D7CCC8] p-8 shadow-sm group-hover:border-[#8B0000]/30 transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#8B0000] rounded-full">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-[#3E2723] tracking-widest">合婚要义</h2>
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

        {/* 分析流程 - 印章步进风格 */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D7CCC8] to-transparent" />
            <h4 className="font-bold text-[#8B0000] tracking-widest px-4 text-sm">卜算流程</h4>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D7CCC8] to-transparent" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {processSteps.map((item) => (
              <div key={item.step} className="relative p-4 text-center group">
                <div className="w-10 h-10 bg-[#FFF9ED] border-2 border-[#D7CCC8] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:border-[#8B0000] group-hover:bg-[#FFEBEB] transition-all">
                  <item.icon className="w-4 h-4 text-[#8D6E63] group-hover:text-[#8B0000]" />
                </div>
                <h4 className="text-xs font-bold text-[#3E2723] mb-1">{item.title}</h4>
                <p className="text-[10px] text-[#8D6E63] italic">{item.description}</p>
                {item.step < 4 && (
                  <div className="hidden md:block absolute top-8 -right-2 text-[#D7CCC8]">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 输入表单 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-[#8B0000]" />
            <h2 className="text-xl font-bold text-[#3E2723]">新增姻缘卜算</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PersonForm
              title="男方信息"
              prefix="person1"
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
            />
            <PersonForm
              title="女方信息"
              prefix="person2"
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
            />
          </div>

          <div className="flex justify-center pt-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#8B0000] blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <Button
                type="submit"
                size="lg"
                className="relative px-16 h-14 bg-[#8B0000] hover:bg-[#7A0000] text-[#FFD700] rounded-none border-b-4 border-[#5D0000] font-serif tracking-[0.3em] text-lg shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    卜算中...
                  </>
                ) : (
                  <>
                    <Compass className="mr-3 h-5 w-5" />
                    开启合婚
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* 底部补充说明 - 宣纸批注风格 */}
        <div className="mt-20 p-8 rounded-none border border-dashed border-[#D7CCC8] bg-[#FDFBF7]/50 relative">
          <div className="absolute -top-3 left-8 px-4 bg-[#F5F2E9] text-[#8B0000] font-bold text-xs flex items-center gap-2">
            <Info className="w-3 h-3" />
            <span>卜算须知</span>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[#3E2723]">智能匹配</h4>
              <p className="text-xs text-[#8D6E63] leading-relaxed italic">
                运用大数据分析，提供匹配评估参考，为您了解相处特点提供观察角度。
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[#3E2723]">全面解析</h4>
              <p className="text-xs text-[#8D6E63] leading-relaxed italic">
                深入分析双方八字特征，观察感情发展特点，了解相处模式。
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[#3E2723]">发展参考</h4>
              <p className="text-xs text-[#8D6E63] leading-relaxed italic">
                观察潜在特点，提供感情发展思考角度，供您参考决策。
              </p>
            </div>
          </div>
          <p className="mt-8 text-[10px] text-center text-[#8D6E63] opacity-60">
            * 本系统分析结果仅供参考，愿天下有情人终成眷属。
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 登录页面
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 用户登录页面
 */

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/** 登录表单验证 Schema */
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

type LoginForm = z.infer<typeof loginSchema>;

/**
 * 登录页面组件
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/workspace/bazi-marriage';
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  /** 处理登录 */
  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F2E9] py-12 px-4 sm:px-6 lg:px-8 font-serif relative overflow-hidden">
      {/* 背景纹理 */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
      
      {/* 古典装饰边角 */}
      <div className="fixed top-4 left-4 w-20 h-20 border-t-2 border-l-2 border-[#8B0000]/20 pointer-events-none" />
      <div className="fixed top-4 right-4 w-20 h-20 border-t-2 border-r-2 border-[#8B0000]/20 pointer-events-none" />
      <div className="fixed bottom-4 left-4 w-20 h-20 border-b-2 border-l-2 border-[#8B0000]/20 pointer-events-none" />
      <div className="fixed bottom-4 right-4 w-20 h-20 border-b-2 border-r-2 border-[#8B0000]/20 pointer-events-none" />

      <Card className="w-full max-w-md rounded-none border-2 border-[#3E2723] bg-[#FDFBF7] shadow-2xl relative z-10">
        <CardHeader className="space-y-4 text-center pt-10">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-sm bg-[#8B0000] flex items-center justify-center border border-[#FFD700]/30 shadow-xl transform -rotate-3">
              <span className="text-white font-serif font-bold text-3xl">缘</span>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-[#3E2723] tracking-widest">命理大师</CardTitle>
            <CardDescription className="text-[#8D6E63] italic">登录您的命理大师账户</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-8">
            {error && (
              <div className="p-3 text-sm text-[#8B0000] bg-[#8B0000]/5 border border-[#8B0000]/20 rounded-none italic">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#5D4037] font-bold text-sm">电子邮契</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register('email')}
                  className="rounded-none border-[#D7CCC8] focus:border-[#8B0000] bg-white/50 h-11"
                />
                {errors.email && (
                  <p className="text-xs text-[#8B0000] italic">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#5D4037] font-bold text-sm">暗号密令</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="rounded-none border-[#D7CCC8] focus:border-[#8B0000] bg-white/50 h-11"
                />
                {errors.password && (
                  <p className="text-xs text-[#8B0000] italic">{errors.password.message}</p>
                )}
              </div>
            </div>
          </CardContent>
          <div className="px-8 pb-10 flex flex-col space-y-6">
            <Button
              type="submit"
              className="w-full bg-[#8B0000] hover:bg-[#7A0000] text-[#FFD700] rounded-none border-b-4 border-[#5D0000] font-serif tracking-[0.3em] h-12 shadow-lg text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  验证中...
                </>
              ) : (
                '开启命盘'
              )}
            </Button>
            <p className="text-sm text-center text-[#8D6E63] italic">
              尚未列入名册？{' '}
              <Link href="/register" className="text-[#8B0000] font-bold hover:underline">
                立即注册
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}

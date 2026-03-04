import React from 'react';
import { CreditCard, CheckCircle2, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Settings() {
  const user = useStore((state) => state.user);
  const deductCredits = useStore((state) => state.deductCredits); // Hack: we'll use a setCredits if we had one, but let's just add a way to add credits.

  // Add a simple way to add credits for demo purposes
  const addCredits = (amount: number) => {
    useStore.setState((state) => ({
      user: { ...state.user, credits: state.user.credits + amount },
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Cài Đặt & Thanh Toán</h1>
        <p className="mt-2 text-sm text-zinc-500">Quản lý tài khoản, gói đăng ký và tín dụng của bạn.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center">
            <CreditCard className="w-6 h-6 mr-2 text-indigo-600" />
            Gói Hiện Tại
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-indigo-600 p-6 relative">
              <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Đang hoạt động
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 capitalize">Gói {user.plan === 'free' ? 'Miễn phí' : 'Pro'}</h3>
              <p className="mt-2 text-sm text-zinc-500">Bạn hiện đang sử dụng gói {user.plan === 'free' ? 'Miễn phí' : 'Pro'}.</p>
              <div className="mt-6 flex items-baseline text-4xl font-bold text-zinc-900">
                {user.credits}
                <span className="ml-1 text-xl font-medium text-zinc-500">tín dụng</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-6 bg-zinc-50 flex flex-col justify-center items-center text-center">
              <Zap className="h-8 w-8 text-amber-500 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900">Cần thêm tín dụng?</h3>
              <p className="mt-2 text-sm text-zinc-500 mb-6">
                Nâng cấp lên Pro hoặc mua gói tín dụng để tạo thêm lookbook.
              </p>
              <button
                onClick={() => addCredits(100)}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                Thêm 100 Tín dụng (Demo)
              </button>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Sử Dụng Tín Dụng</h3>
            <ul className="space-y-4">
              <li className="flex items-center justify-between text-sm py-3 border-b border-zinc-100">
                <span className="text-zinc-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                  Phân Tích Hình Ảnh & Tạo Prompt
                </span>
                <span className="font-medium text-zinc-900">1 Tín dụng</span>
              </li>
              <li className="flex items-center justify-between text-sm py-3 border-b border-zinc-100">
                <span className="text-zinc-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                  Tạo 1 Hình Ảnh HD
                </span>
                <span className="font-medium text-zinc-900">3 Tín dụng</span>
              </li>
              <li className="flex items-center justify-between text-sm py-3 border-b border-zinc-100">
                <span className="text-zinc-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                  Tạo Bộ 9 Hình Ảnh Đầy Đủ
                </span>
                <span className="font-medium text-zinc-900">25 Tín dụng</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

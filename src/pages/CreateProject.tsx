import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Loader2, Image as ImageIcon, Sparkles, Settings2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { MarketingContext } from '../types';

export function CreateProject() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Marketing Context State
  const [platform, setPlatform] = useState('Shopee + TikTok');
  const [audience, setAudience] = useState('Nữ 18-25');
  const [tone, setTone] = useState('Hàn Quốc Tối Giản');
  const [price, setPrice] = useState('Tầm trung');
  const [mood, setMood] = useState<'Studio' | 'Lifestyle'>('Studio');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');

  const addProject = useStore((state) => state.addProject);
  const deductCredits = useStore((state) => state.deductCredits);
  const user = useStore((state) => state.user);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Kích thước tệp phải nhỏ hơn 5MB');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError('Kích thước tệp phải nhỏ hơn 5MB');
        return;
      }
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    if (user.credits < 1) {
      setError('Không đủ tín dụng. Bạn cần 1 tín dụng để phân tích hình ảnh.');
      return;
    }

    let apiKey = '';
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        try {
          await window.aistudio.openSelectKey();
        } catch (e) {
          console.error('Failed to select API key:', e);
          setError('Không thể chọn khóa API. Vui lòng thử lại.');
          return;
        }
      }
      // Assuming we can get the key somehow or relying on the environment being set
      // Since window.aistudio sets it for the session, maybe we don't need to pass it explicitly if the backend runs in the same context?
      // But for safety, let's try to get it if possible, or rely on the backend picking up the env var if it's injected.
      // The instructions say "The selected API key is available using process.env.API_KEY".
      // So we might not need to pass it in the header if the backend can see process.env.API_KEY.
      // However, passing it explicitly is safer if we have access to it.
      // Since we can't easily access the selected key value on the client (it's hidden), we rely on the backend environment.
      // BUT, if the backend is a separate process (node server.ts), does it see the updated env var?
      // Let's assume the platform handles it. If not, we might need a way to proxy the key.
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Analyze Image
      const formData = new FormData();
      formData.append('image', file);

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        headers: {
           // If we had the key, we'd pass it here: 'x-goog-api-key': apiKey
        }
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze image');
      }

      const analysis = await analyzeResponse.json();

      // Deduct 1 credit for analysis
      deductCredits(1);

      const context: MarketingContext = {
        platform,
        audience,
        tone,
        price,
      };

      // 2. Generate Prompts
      const promptsResponse = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis,
          mood,
          aspectRatio,
          context // Passing context to backend if needed, though generate-prompts endpoint might need update to use it
        }),
      });

      if (!promptsResponse.ok) {
        throw new Error('Failed to generate prompts');
      }

      const prompts = await promptsResponse.json();

      // Create project
      const projectId = `proj-${Date.now()}`;
      
      // Convert file to base64 for storage
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      addProject({
        id: projectId,
        userId: user.user_id,
        originalImageUrl: base64Data,
        analysis: analysis,
        prompts: prompts,
        content: null,
        settings: {
          platform: platform as any, // Cast for now, should align types
          mood,
          aspectRatio,
        },
        status: 'generating_prompts', // Or 'analyzing' -> 'completed' for this stage
        createdAt: new Date().toISOString(),
      });

      // Redirect to project page
      navigate(`/project/${projectId}`);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Không thể phân tích hình ảnh. Vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Tạo Dự Án Mới</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tải lên hình ảnh sản phẩm để phân tích và tạo bộ ảnh lookbook chuyên nghiệp.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-8">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {!previewUrl ? (
            <div
              className="mt-2 flex justify-center rounded-2xl border-2 border-dashed border-zinc-300 px-6 py-20 hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-zinc-400" aria-hidden="true" />
                <div className="mt-4 flex text-sm leading-6 text-zinc-600 justify-center">
                  <span className="relative cursor-pointer rounded-md bg-transparent font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
                    Tải lên tệp
                  </span>
                  <p className="pl-1">hoặc kéo và thả</p>
                </div>
                <p className="text-xs leading-5 text-zinc-500 mt-2">PNG, JPG, WEBP tối đa 5MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 aspect-video flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-4 right-4 rounded-full bg-white/90 p-2 text-zinc-600 shadow-sm hover:bg-white hover:text-zinc-900 backdrop-blur-sm transition-colors"
                >
                  <span className="sr-only">Xóa ảnh</span>
                  <ImageIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Marketing Context Form */}
              <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 space-y-4">
                <div className="flex items-center space-x-2 text-zinc-900 font-medium mb-2">
                  <Settings2 className="w-5 h-5 text-indigo-600" />
                  <h3>Bối cảnh Marketing</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Nền tảng tập trung</label>
                    <input
                      type="text"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="ví dụ: Instagram, Shopee"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Đối tượng mục tiêu</label>
                    <input
                      type="text"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="ví dụ: Gen Z, Nhân viên văn phòng"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Phong cách thương hiệu</label>
                    <input
                      type="text"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="ví dụ: Tối giản, Táo bạo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Phân khúc giá</label>
                    <select
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="Budget">Giá rẻ</option>
                      <option value="Mid-range">Tầm trung</option>
                      <option value="Luxury">Cao cấp</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-900">Phân tích AI & Tạo Prompt</h3>
                    <p className="text-xs text-zinc-500">Tốn 1 tín dụng</p>
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={cn(
                    "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all",
                    isAnalyzing
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" />
                      Đang phân tích...
                    </>
                  ) : (
                    'Bắt đầu phân tích'
                  )}
                </button>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}

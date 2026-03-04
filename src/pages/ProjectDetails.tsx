import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Play, Image as ImageIcon, Sparkles, CheckCircle2, FileText, Copy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const project = useStore((state) => state.projects.find((p) => p.id === id));
  const allGeneratedImages = useStore((state) => state.generatedImages);
  const generatedImages = allGeneratedImages.filter((img) => img.projectId === id);
  const updateProject = useStore((state) => state.updateProject);
  const addGeneratedImage = useStore((state) => state.addGeneratedImage);
  const deductCredits = useStore((state) => state.deductCredits);
  const user = useStore((state) => state.user);

  const [generatingAngles, setGeneratingAngles] = useState<Set<string>>(new Set());
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-zinc-900">Không tìm thấy dự án</h2>
        <Link to="/" className="mt-4 text-indigo-600 hover:text-indigo-500">
          Quay lại Bảng điều khiển
        </Link>
      </div>
    );
  }

  const prompts = project.prompts || [];

  const handleGenerateImage = async (angle: string, prompt: string) => {
    if (user.credits < 3) {
      setError('Không đủ tín dụng. Bạn cần 3 tín dụng để tạo hình ảnh.');
      return;
    }

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
    }

    setGeneratingAngles((prev) => new Set(prev).add(angle));
    setError(null);

    try {
      deductCredits(3);
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          aspectRatio: project.settings.aspectRatio,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      const imageUrl = data.image;

      const imageId = `img-${Date.now()}`;
      addGeneratedImage({
        id: imageId,
        projectId: project.id,
        angle,
        prompt,
        imageUrl: imageUrl,
      });

      // Update project status if all images are generated
      if (generatedImages.length + 1 >= prompts.length) {
        updateProject(project.id, { status: 'completed' });
      } else {
        updateProject(project.id, { status: 'generating_images' });
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(`Không thể tạo hình ảnh cho ${angle}: ${err.message}`);
    } finally {
      setGeneratingAngles((prev) => {
        const next = new Set(prev);
        next.delete(angle);
        return next;
      });
    }
  };

  const handleGenerateAll = async () => {
    if (user.credits < 25) {
      setError('Không đủ tín dụng. Bạn cần 25 tín dụng để tạo tất cả 9 hình ảnh.');
      return;
    }

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
    }

    const ungeneratedPrompts = prompts.filter(
      (p: any) => !generatedImages.some((img) => img.angle === p.angle)
    );

    if (ungeneratedPrompts.length === 0) return;

    deductCredits(25);
    updateProject(project.id, { status: 'generating_images' });

    // Generate sequentially to avoid rate limits
    for (const p of ungeneratedPrompts) {
      await handleGenerateImage(p.angle, p.prompt);
    }
  };

  const handleGenerateContent = async () => {
    if (user.credits < 1) {
      setError('Không đủ tín dụng. Bạn cần 1 tín dụng để tạo nội dung.');
      return;
    }

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
    }

    setIsGeneratingContent(true);
    setError(null);

    try {
      deductCredits(1);
      
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis: project.analysis,
          platform: project.settings.platform,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const content = await response.json();
      updateProject(project.id, { content });
    } catch (err: any) {
      console.error('Content generation error:', err);
      setError(`Không thể tạo nội dung: ${err.message}`);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              {project.analysis?.productType || 'Chi tiết dự án'}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {project.analysis?.style} • {project.settings.platform}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
            {project.status === 'completed' ? 'Hoàn thành' : 
             project.status === 'analyzing' ? 'Đang phân tích' :
             project.status === 'generating_prompts' ? 'Đang tạo prompt' :
             project.status === 'generating_images' ? 'Đang tạo ảnh' :
             project.status === 'failed' ? 'Thất bại' : 'Nháp'}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Original & Analysis */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="aspect-[4/5] relative bg-zinc-100">
              <img
                src={project.originalImageUrl}
                alt="Original"
                className="absolute inset-0 h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                Phân tích AI
              </h3>
              <dl className="space-y-4 text-sm">
                {project.analysis && Object.entries(project.analysis).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-4">
                    <dt className="font-medium text-zinc-500 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </dt>
                    <dd className="col-span-2 text-zinc-900">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Content Generation Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                Nội dung bán hàng
              </h3>
              {!project.content && (
                <button
                  onClick={handleGenerateContent}
                  disabled={isGeneratingContent}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                >
                  {isGeneratingContent ? 'Đang tạo...' : 'Tạo nội dung (1 Tín dụng)'}
                </button>
              )}
            </div>
            
            {project.content ? (
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-zinc-900">Tiêu đề</h4>
                    <button onClick={() => copyToClipboard(project.content!.title)} className="text-zinc-400 hover:text-zinc-600">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg">{project.content.title}</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-zinc-900">Caption</h4>
                    <button onClick={() => copyToClipboard(project.content!.caption)} className="text-zinc-400 hover:text-zinc-600">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg">{project.content.caption}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-900 mb-1">Hashtags</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.content.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-zinc-900">Mô tả chi tiết</h4>
                    <button onClick={() => copyToClipboard(project.content!.description)} className="text-zinc-400 hover:text-zinc-600">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {project.content.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 text-sm">
                Chưa có nội dung. Nhấn "Tạo nội dung" để AI viết bài bán hàng cho bạn.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Prompts & Generations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Lookbook Đã Tạo</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Đã tạo {generatedImages.length} trên tổng số {prompts.length} hình ảnh
              </p>
            </div>
            <button
              onClick={handleGenerateAll}
              disabled={generatedImages.length === prompts.length || generatingAngles.size > 0}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-50 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="-ml-0.5 mr-2 h-4 w-4" />
              Tạo Tất Cả (25 Tín dụng)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {prompts.map((p: any, index: number) => {
              const generatedImage = generatedImages.find((img) => img.angle === p.angle);
              const isGenerating = generatingAngles.has(p.angle);

              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col"
                >
                  <div className="aspect-[3/4] relative bg-zinc-100 group">
                    {generatedImage ? (
                      <>
                        <img
                          src={generatedImage.imageUrl}
                          alt={p.angle}
                          className="absolute inset-0 h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="h-6 w-6 text-emerald-500 bg-white rounded-full" />
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
                            <p className="text-sm font-medium text-zinc-900">Đang tạo...</p>
                            <p className="text-xs text-zinc-500 mt-1">Quá trình này có thể mất một phút</p>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8 text-zinc-300 mb-4" />
                            <button
                              onClick={() => handleGenerateImage(p.angle, p.prompt)}
                              className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors"
                            >
                              Tạo (3 Tín dụng)
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="font-semibold text-zinc-900 text-sm">{p.angle}</h4>
                    <p className="mt-2 text-xs text-zinc-500 line-clamp-4 flex-1" title={p.prompt}>
                      {p.prompt}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

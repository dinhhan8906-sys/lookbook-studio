import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PlusCircle, Image as ImageIcon, Clock, CheckCircle2 } from 'lucide-react';

export function Dashboard() {
  const projects = useStore((state) => state.projects);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dự Án</h1>
          <p className="mt-2 text-sm text-zinc-500">Quản lý các dự án lookbook AI và tài sản đã tạo.</p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
        >
          <PlusCircle className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
          Dự Án Mới
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center rounded-2xl border-2 border-dashed border-zinc-300 p-12">
          <ImageIcon className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-2 text-sm font-semibold text-zinc-900">Chưa có dự án nào</h3>
          <p className="mt-1 text-sm text-zinc-500">Bắt đầu bằng cách tạo một dự án lookbook mới.</p>
          <div className="mt-6">
            <Link
              to="/create"
              className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusCircle className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Dự Án Mới
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 hover:shadow-md transition-all"
            >
              <div className="aspect-[4/3] bg-zinc-100 sm:aspect-[2/1] lg:aspect-[3/2] relative">
                {project.originalImageUrl ? (
                  <img
                    src={project.originalImageUrl}
                    alt="Original"
                    className="absolute inset-0 h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-zinc-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm">
                    {project.status === 'completed' ? (
                      <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-400" />
                    ) : (
                      <Clock className="mr-1 h-3 w-3 text-amber-400" />
                    )}
                    {project.status === 'completed' ? 'Hoàn thành' : 
                     project.status === 'analyzing' ? 'Đang phân tích' :
                     project.status === 'generating_prompts' ? 'Đang tạo prompt' :
                     project.status === 'generating_images' ? 'Đang tạo ảnh' :
                     project.status === 'failed' ? 'Thất bại' : 'Nháp'}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 line-clamp-1">
                    {project.analysis?.productType || 'Dự án chưa đặt tên'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                    {project.analysis?.style} • {project.analysis?.marketingAngles?.[0]}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                  <span>{new Date(project.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span className="font-medium text-indigo-600 group-hover:text-indigo-500">Xem chi tiết &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

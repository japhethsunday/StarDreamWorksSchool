"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Upload,
  X,
  Eye,
} from "lucide-react";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import Modal from "@/components/dashboard/Modal";

interface GalleryItem {
  id: string;
  url: string;
  title: string;
  category: string;
  createdAt: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/gallery");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setImages(data.data || data.images || []);
    } catch {
      setError("Failed to load gallery.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", uploadTitle);
      formData.append("category", uploadCategory);

      const res = await fetch("/api/admin/gallery", { method: "POST", body: formData });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Upload failed"); }
      setUploadModalOpen(false);
      setUploadTitle("");
      setUploadCategory("");
      fetchData();
    } catch (e: any) {
      alert(e.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/gallery/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setConfirmDelete(null);
      fetchData();
    } catch { alert("Failed to delete"); } finally { setDeleting(false); }
  };

  if (loading) return <LoadingSpinner text="Loading gallery..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-school-blue text-white text-sm rounded-xl">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">Gallery</h2>
          <p className="text-sm text-gray-500 mt-1">{images.length} images</p>
        </div>
        <button onClick={() => setUploadModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-glow-blue hover:shadow-lg transition-all">
          <Upload className="w-4 h-4" /> Upload Image
        </button>
      </div>

      {images.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-10 h-10 text-gray-400" />}
          title="No images in gallery"
          description="Upload images to showcase school activities."
          action={{ label: "Upload Image", onClick: () => setUploadModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-soft-sm overflow-hidden hover:shadow-soft-md transition-all">
              <div className="aspect-square bg-gray-100">
                <img src={img.url} alt={img.title || ""} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-800 truncate">{img.title || "Untitled"}</p>
                {img.category && (
                  <span className="text-[10px] font-medium text-school-blue bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {img.category}
                  </span>
                )}
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setPreviewImage(img.url)}
                  className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-gray-600 hover:text-school-blue transition-colors shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDelete(img.id)}
                  className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-gray-600 hover:text-red-600 transition-colors shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload Image" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="Image title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <input type="text" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="e.g. Sports, Events" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-school-blue file:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setUploadModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      </Modal>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors" onClick={() => setPreviewImage(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-soft-xl" />
        </div>
      )}

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Image" message="Are you sure you want to delete this image from the gallery?" loading={deleting} />
    </div>
  );
}

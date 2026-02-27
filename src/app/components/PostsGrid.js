"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedinIn, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { faTimes, faPaperPlane, faTrash, faPlus, faArrowsRotate } from "@fortawesome/free-solid-svg-icons";

const APPROVE_WEBHOOK_URL = "https://n8n.indicrm.io/webhook/approve-post";
const CREATE_POST_WEBHOOK_URL = "https://n8n.indicrm.io/webhook/social-media-post-create";

const THEME_OPTIONS = [
  { value: "purple", label: "Purple" },
  { value: "blue", label: "Blue" },
  { value: "orange", label: "Orange" },
  { value: "green", label: "Green" },
  { value: "auto", label: "Auto" },
];

const SOCIAL_PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: faLinkedinIn },
  { id: "x", label: "X", icon: faXTwitter },
];

const CHANNEL_STYLES = {
  linkedin: { icon: faLinkedinIn, bg: "#0a66c2" },
  x: { icon: faXTwitter, bg: "#000000" },
  twitter: { icon: faXTwitter, bg: "#000000" },
};

function getChannelIcon(channel) {
  const c = (channel || "").toLowerCase();
  return CHANNEL_STYLES[c]?.icon ?? CHANNEL_STYLES.linkedin.icon;
}

function getChannelBg(channel) {
  const c = (channel || "").toLowerCase();
  return CHANNEL_STYLES[c]?.bg ?? CHANNEL_STYLES.linkedin.bg;
}

function ConfirmModal({
  title = "Confirm",
  message,
  onConfirm,
  onCancel,
  isLoading,
  confirmLabel = "Confirm",
  loadingLabel = "Loading…",
  confirmVariant = "primary",
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  const isDanger = confirmVariant === "danger";
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 id="confirm-title" className="text-lg font-semibold text-zinc-900">
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultModal({ title, message, isSuccess, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2
          id="result-title"
          className={`text-lg font-semibold ${isSuccess ? "text-emerald-700" : "text-red-600"}`}
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ id, checked, onClick }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:ring-offset-2 ${
        checked ? "bg-emerald-600" : "bg-zinc-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function CreatePostModal({ onClose, onSuccess, onError }) {
  const [activeTab, setActiveTab] = useState("ai");
  const [topic, setTopic] = useState("");
  const [textContent, setTextContent] = useState("");
  const [titleFix, setTitleFix] = useState("");
  const [theme, setTheme] = useState("blue");
  const [themeFix, setThemeFix] = useState("blue");
  const [generateImage, setGenerateImage] = useState(true);
  const [textOnlyImage, setTextOnlyImage] = useState(false);
  const [generateImageFix, setGenerateImageFix] = useState(true);
  const [textOnlyImageFix, setTextOnlyImageFix] = useState(false);
  const [socialPlatforms, setSocialPlatforms] = useState(["linkedin", "x"]);
  const [submitting, setSubmitting] = useState(false);

  const togglePlatform = (id) => {
    setSocialPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const isAi = activeTab === "ai";
    if (isAi && !topic.trim()) return;
    if (!isAi && !textContent.trim()) return;
    if (socialPlatforms.length === 0) {
      onError?.("Please select at least one social platform.");
      return;
    }
    setSubmitting(true);
    const payload = isAi
      ? {
          post_topic: topic.trim().slice(0, 200),
          generate_image: generateImage,
          text_only_image: generateImage ? textOnlyImage : false,
          theme,
          platform: socialPlatforms,
          ai_generated: true,
        }
      : {
          title: titleFix.trim(),
          post_topic: textContent.trim().slice(0, 1000),
          theme: themeFix,
          generate_image: generateImageFix,
          text_only_image: generateImageFix ? textOnlyImageFix : false,
          platform: socialPlatforms,
          ai_generated: false,
        };
    fetch(CREATE_POST_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
    setSubmitting(false);
    onClose();
    onSuccess?.();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-post-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 id="create-post-title" className="text-lg font-semibold text-zinc-900">
            Create new post
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>
        {/* Tabs */}
        <div className="mt-4 border-b border-zinc-200">
          <nav className="flex gap-1" aria-label="Create post type">
            {[
              { id: "ai", label: "AI Content" },
              { id: "fix", label: "Fix Content" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-[#0a66c2] text-[#0a66c2]"
                    : "border-transparent text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {activeTab === "ai" && (
            <>
              <div>
                <label htmlFor="create-topic" className="block text-sm font-medium text-zinc-700">
                  Topic <span className="text-zinc-400">(max 200 characters)</span>
                </label>
                <textarea
                  id="create-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value.slice(0, 200))}
                  maxLength={200}
                  rows={3}
                  placeholder="e.g. Boost your business with Inventory CRM Solutions"
                  className="mt-1 w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  required={activeTab === "ai"}
                />
                <p className="mt-0.5 text-right text-xs text-zinc-400">{topic.length}/200</p>
              </div>
              <div>
                <label htmlFor="create-theme" className="block text-sm font-medium text-zinc-700">
                  Theme
                </label>
                <select
                  id="create-theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                >
                  {THEME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="create-generate-image" className="text-sm font-medium text-zinc-700">
                  Generate image
                </label>
                <Toggle
                  id="create-generate-image"
                  checked={generateImage}
                  onClick={() => setGenerateImage((v) => !v)}
                />
              </div>
              {generateImage && (
                <div className="flex items-center justify-between rounded-md bg-zinc-50 p-3">
                  <label htmlFor="create-text-only" className="text-sm font-medium text-zinc-700">
                    Text only <span className="font-normal text-zinc-400">(default: off)</span>
                  </label>
                  <Toggle
                    id="create-text-only"
                    checked={textOnlyImage}
                    onClick={() => setTextOnlyImage((v) => !v)}
                  />
                </div>
              )}
            </>
          )}
          {activeTab === "fix" && (
            <>
              <div>
                <label htmlFor="create-title-fix" className="block text-sm font-medium text-zinc-700">
                  Title
                </label>
                <input
                  id="create-title-fix"
                  type="text"
                  value={titleFix}
                  onChange={(e) => setTitleFix(e.target.value)}
                  placeholder="Enter title..."
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                />
              </div>
              <div>
                <label htmlFor="create-text-content" className="block text-sm font-medium text-zinc-700">
                  Text Content <span className="text-zinc-400">(max 1000 characters)</span>
                </label>
                <textarea
                  id="create-text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value.slice(0, 1000))}
                  maxLength={1000}
                  rows={5}
                  placeholder="Enter your post content..."
                  className="mt-1 w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  required={activeTab === "fix"}
                />
                <p className="mt-0.5 text-right text-xs text-zinc-400">{textContent.length}/1000</p>
              </div>
              <div>
                <label htmlFor="create-theme-fix" className="block text-sm font-medium text-zinc-700">
                  Theme
                </label>
                <select
                  id="create-theme-fix"
                  value={themeFix}
                  onChange={(e) => setThemeFix(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                >
                  {THEME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="create-generate-image-fix" className="text-sm font-medium text-zinc-700">
                  Generate image
                </label>
                <Toggle
                  id="create-generate-image-fix"
                  checked={generateImageFix}
                  onClick={() => setGenerateImageFix((v) => !v)}
                />
              </div>
              {generateImageFix && (
                <div className="flex items-center justify-between rounded-md bg-zinc-50 p-3">
                  <label htmlFor="create-text-only-fix" className="text-sm font-medium text-zinc-700">
                    Text only <span className="font-normal text-zinc-400">(default: off)</span>
                  </label>
                  <Toggle
                    id="create-text-only-fix"
                    checked={textOnlyImageFix}
                    onClick={() => setTextOnlyImageFix((v) => !v)}
                  />
                </div>
              )}
            </>
          )}
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-700">Social Platform</p>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_PLATFORMS.map((platform) => (
                <label
                  key={platform.id}
                  className="flex cursor-pointer items-center gap-2 text-xs text-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={socialPlatforms.includes(platform.id)}
                    onChange={() => togglePlatform(platform.id)}
                    className="h-3.5 w-3.5 rounded border-zinc-300 text-[#0a66c2] focus:ring-[#0a66c2]"
                  />
                  <FontAwesomeIcon icon={platform.icon} className="h-3.5 w-3.5 text-zinc-500" />
                  <span>{platform.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-md bg-[#0a66c2] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a66c2]/90 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPostPublished(post) {
  const s = post?.status?.toLowerCase?.();
  return s === "published" || s === "posted";
}

const SHIMMER_POST_ID = "__shimmer_new__";

function ShimmerCard() {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-zinc-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="h-3 w-32 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <div className="h-7 w-16 animate-pulse rounded-md bg-zinc-100" />
          <div className="h-6 w-14 animate-pulse rounded-full bg-zinc-100" />
        </div>
      </div>
      <div className="flex-1 px-4 py-4">
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-100" />
        </div>
      </div>
      <div className="border-t border-zinc-100">
        <div className="h-48 w-full animate-pulse bg-zinc-100" />
      </div>
    </article>
  );
}

function PostCard({ post, onMoreClick, onApprove, onDelete, isApproving, isDeleting }) {
  const content = post.ai_research_output || "";
  const imageUrl = post.generated_image_url || null;
  const channel = post.social_media_channel || "";
  const status = post.status || "draft";
  const keyword = post.keyword || "";
  const showMoreLink = true; // always show so user can open popup (view full post / image)
  const approving = isApproving(post.id);
  const deleting = isDeleting(post.id);
  const isPublished =
    status && (status.toLowerCase() === "published" || status.toLowerCase() === "posted");

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      {/* Card header - title full width, actions on second row */}
      <div className="border-b border-zinc-100 px-4 py-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: getChannelBg(channel) }}
          >
            <FontAwesomeIcon icon={getChannelIcon(channel)} className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-semibold leading-tight text-zinc-900">
              {keyword || channel}
            </p>
            <p className="mt-0.5 text-xs leading-tight text-zinc-500">
              {isPublished && post.updated_at
                ? `Last modified: ${formatDate(post.updated_at)}`
                : [channel, post.created_at && formatDate(post.created_at)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {!isPublished && (
            <button
              type="button"
              onClick={() => onApprove(post)}
              disabled={approving}
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
              {approving ? "Approving…" : "Approve"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(post)}
            disabled={deleting}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 disabled:opacity-60"
            aria-label="Delete post"
          >
            <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
            Delete
          </button>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {isPublished ? "Published" : status}
          </span>
        </div>
      </div>

      {/* Post content - max 5 lines then more... */}
      <div className="flex-1 px-4 py-4">
        <p className="line-clamp-5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
          {content || "No content."}
        </p>
        {showMoreLink && (
          <button
            type="button"
            onClick={() => onMoreClick(post)}
            className="mt-1 cursor-pointer text-sm font-medium text-[#0a66c2] hover:underline"
          >
            more...
          </button>
        )}
      </div>

      {/* Image - LinkedIn style: full width, constrained height, object-cover */}
      {imageUrl && (
        <div className="border-t border-zinc-100">
          <div className="relative w-full overflow-hidden bg-zinc-100" style={{ maxHeight: "450px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>
      )}
    </article>
  );
}

function PostModal({ post, onClose, onApprove, onDelete, isApproving, isDeleting }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!post) return null;
  const content = post.ai_research_output || "";
  const imageUrl = post.generated_image_url || null;
  const channel = post.social_media_channel || "";
  const keyword = post.keyword || "";
  const status = post.status || "draft";
  const approving = isApproving(post.id);
  const deleting = isDeleting(post.id);
  const isPublished =
    status && (status.toLowerCase() === "published" || status.toLowerCase() === "posted");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Post details"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Modal header - title full width, actions on second row */}
        <div className="border-b border-zinc-200 px-4 py-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: getChannelBg(channel) }}
            >
              <FontAwesomeIcon icon={getChannelIcon(channel)} className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold leading-tight text-zinc-900">
                {keyword || channel}
              </p>
              <p className="mt-0.5 text-xs leading-tight text-zinc-500">
                {isPublished && post.updated_at
                  ? `Last modified: ${formatDate(post.updated_at)}`
                  : [channel, post.created_at && formatDate(post.created_at)].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            {!isPublished && (
              <button
                type="button"
                onClick={() => onApprove(post)}
                disabled={approving}
                className="flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
                {approving ? "Approving…" : "Approve"}
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(post)}
              disabled={deleting}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 disabled:opacity-60"
              aria-label="Delete post"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
              Delete
            </button>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {isPublished ? "Published" : status}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body: full text then image */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
              {content || "No content."}
            </p>
          </div>
          {imageUrl && (
            <div className="border-t border-zinc-100">
              <a
                href="https://www.ibirdsservices.com/platforms/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative block w-full cursor-pointer overflow-hidden bg-zinc-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt=""
                  className="max-w-full w-full h-auto object-contain"
                />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PostsGrid({ posts: initialPosts }) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [postToApprove, setPostToApprove] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [resultModal, setResultModal] = useState(null);
  const [activeTab, setActiveTab] = useState("draft");
  const [postToDelete, setPostToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Load posts on mount (e.g. after login when page is client-navigated and RSC payload may be empty)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setPosts(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const draftPosts = posts.filter((p) => !isPostPublished(p));
  const publishedPosts = posts.filter(isPostPublished);
  const filteredPosts =
    activeTab === "draft"
      ? draftPosts
      : activeTab === "published"
        ? publishedPosts
        : posts;

  const selectedPost = selectedPostId
    ? posts.find((p) => p.id === selectedPostId) ?? null
    : null;

  const isApproving = (id) => approvingId === id;

  const handleApproveClick = (post) => {
    if (!post?.id) return;
    setPostToApprove(post);
  };

  const handleDeleteClick = (post) => {
    if (!post?.id) return;
    setPostToDelete(post);
  };

  const handleConfirmDelete = async () => {
    const post = postToDelete;
    if (!post?.id) return;
    setDeletingId(post.id);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setResultModal({
          success: false,
          message: data?.error || "Failed to delete post.",
        });
        return;
      }
      setPostToDelete(null);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      if (selectedPostId === post.id) setSelectedPostId(null);
    } catch (err) {
      setResultModal({
        success: false,
        message: err?.message || "Something went wrong.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const isDeleting = (id) => deletingId === id;

  const handleConfirmApprove = async () => {
    const post = postToApprove;
    if (!post?.id) return;
    setApprovingId(post.id);
    try {
      const res = await fetch(APPROVE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: post.id }),
      });
      const text = await res.text();
      let data = { success: false, message: "Approval failed." };
      try {
        data = JSON.parse(text);
      } catch {
        if (text.trim()) data = { ...data, message: text };
      }
      const success = data?.success === true;
      const message =
        data?.message ?? data?.msg ?? (success ? "Post approved successfully." : "Approval failed.");
      setPostToApprove(null);
      setResultModal({ success, message, postId: post.id });
    } catch (err) {
      setPostToApprove(null);
      setResultModal({
        success: false,
        message: err?.message || "Something went wrong.",
        postId: post.id,
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleResultModalClose = async () => {
    if (!resultModal) return;
    const postId = resultModal.postId;
    setResultModal(null);
    if (postId == null) return;
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (!res.ok) return;
      const updated = await res.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...updated } : p))
      );
    } catch {
      // ignore
    }
  };

  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch {
      // ignore
    } finally {
      setRefreshLoading(false);
    }
  };

  const refreshTimeoutRef = useRef(null);

  const handleCreateSuccess = () => {
    setPosts((prev) => [
      { id: SHIMMER_POST_ID, _shimmer: true, status: "draft" },
      ...prev,
    ]);
    setActiveTab("draft");
    setResultModal({
      success: true,
      message: "Post request successfully submitted.",
    });
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/posts");
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch {
        // ignore
      } finally {
        refreshTimeoutRef.current = null;
      }
    }, 15000);
  };

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, []);

  return (
    <>
      {postToApprove && (
        <ConfirmModal
          title="Approve post"
          message="Are you sure you want to approve this post?"
          onConfirm={handleConfirmApprove}
          onCancel={() => setPostToApprove(null)}
          isLoading={approvingId === postToApprove?.id}
          confirmLabel="Confirm"
          loadingLabel="Approving…"
        />
      )}
      {postToDelete && (
        <ConfirmModal
          title="Delete post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setPostToDelete(null)}
          isLoading={deletingId === postToDelete?.id}
          confirmLabel="Delete"
          loadingLabel="Deleting…"
          confirmVariant="danger"
        />
      )}
      {resultModal && (
        <ResultModal
          title={resultModal.success ? "Success" : "Error"}
          message={resultModal.message}
          isSuccess={resultModal.success}
          onClose={handleResultModalClose}
        />
      )}
      {createModalOpen && (
        <CreatePostModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          onError={(message) => setResultModal({ success: false, message })}
        />
      )}
      {/* Tabs + actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200">
        <nav className="-mb-px flex gap-1" aria-label="Post categories">
          {[
            { id: "draft", label: "Draft", count: draftPosts.length },
            { id: "published", label: "Published", count: publishedPosts.length },
            { id: "all", label: "All", count: posts.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-[#0a66c2] text-[#0a66c2]"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  activeTab === tab.id ? "bg-[#0a66c2]/10 text-[#0a66c2]" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex cursor-pointer items-center gap-2 rounded-md bg-[#0a66c2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0a66c2]/90"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
            New post
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshLoading}
            className="cursor-pointer rounded-md border border-zinc-300 bg-white p-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-60"
            aria-label="Refresh posts"
            title="Refresh posts"
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className={`h-4 w-4 ${refreshLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-zinc-500">
            {activeTab === "all"
              ? "No posts yet."
              : activeTab === "draft"
                ? "No draft posts."
                : "No published posts."}
          </p>
        ) : (
          filteredPosts.map((post) =>
            post._shimmer ? (
              <ShimmerCard key={post.id} />
            ) : (
              <PostCard
                key={post.id}
                post={post}
                onMoreClick={(p) => setSelectedPostId(p?.id ?? null)}
                onApprove={handleApproveClick}
                onDelete={handleDeleteClick}
                isApproving={isApproving}
                isDeleting={isDeleting}
              />
            )
          )
        )}
      </div>
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPostId(null)}
          onApprove={handleApproveClick}
          onDelete={handleDeleteClick}
          isApproving={isApproving}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}

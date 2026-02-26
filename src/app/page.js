import Image from "next/image";
import { getSocialMediaPosts } from "@/lib/db";
import PostsGrid from "./components/PostsGrid";
import LogoutButton from "./components/LogoutButton";

export default async function Home() {
  let posts = [];
  let error = null;

  try {
    posts = await getSocialMediaPosts();
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
              <Image
                src="/images/logo.png"
                alt=""
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">AdSpark AI</h1>
              <p className="text-xs font-medium text-zinc-500">
                AI Powered Social Media Post Generator
              </p>
            </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Could not load posts: {error}
          </div>
        )}

        {!error && <PostsGrid posts={posts} />}
      </main>
    </div>
  );
}

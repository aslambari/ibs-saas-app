import { getSocialMediaPosts } from "@/lib/db";

export async function GET() {
  try {
    const posts = await getSocialMediaPosts();
    return Response.json(posts);
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

import { getSocialMediaPostById, deleteSocialMediaPost } from "@/lib/db";

export async function GET(_request, context) {
  const params = await context.params;
  const id = params?.id;
  if (!id) {
    return Response.json({ error: "Missing post id" }, { status: 400 });
  }
  try {
    const post = await getSocialMediaPostById(id);
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }
    return Response.json(post);
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const params = await context.params;
  const id = params?.id;
  if (!id) {
    return Response.json({ error: "Missing post id" }, { status: 400 });
  }
  try {
    const deleted = await deleteSocialMediaPost(id);
    if (!deleted) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to delete post" },
      { status: 500 }
    );
  }
}

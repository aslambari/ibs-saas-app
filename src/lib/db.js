import pg from "pg";

const { Pool } = pg;

const pool =
  globalThis.__postgresPool ||
  new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__postgresPool = pool;
}

export async function getSocialMediaPosts() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, keyword, ai_research_output, generated_image_url, social_media_channel, status, scheduled_post_time, posted_at, posted_by, created_at, updated_at
       FROM public.social_media_posts
       ORDER BY created_at DESC`
    );
    return res.rows;
  } finally {
    client.release();
  }
}

export async function getSocialMediaPostById(id) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, keyword, ai_research_output, generated_image_url, social_media_channel, status, scheduled_post_time, posted_at, posted_by, created_at, updated_at
       FROM public.social_media_posts
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  } finally {
    client.release();
  }
}

export async function deleteSocialMediaPost(id) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "DELETE FROM public.social_media_posts WHERE id = $1 RETURNING id",
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

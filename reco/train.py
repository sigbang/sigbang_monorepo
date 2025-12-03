import os
import sys
import json
import time
import uuid
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta


def get_env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        print(f"Missing env: {name}", file=sys.stderr)
        sys.exit(1)
    return v


def connect_db():
    dsn = get_env("DATABASE_URL")
    return psycopg2.connect(dsn)


def ensure_active_model(cur) -> str:
    """Create a simple heuristic model version and mark it active."""
    name = "heuristic_trend_v1"
    version = datetime.utcnow().strftime("%Y%m%d")
    model_id = str(uuid.uuid4())

    # Deactivate previous active models of the same name
    cur.execute(
        """
        UPDATE reco_model_registry
        SET "isActive" = FALSE
        WHERE name = %s AND "isActive" = TRUE
        """,
        (name,),
    )

    # Upsert current model version
    cur.execute(
        """
        INSERT INTO reco_model_registry (id, name, version, "isActive", meta, "createdAt")
        VALUES (%s, %s, %s, TRUE, %s::jsonb, NOW())
        ON CONFLICT (name, version) DO UPDATE
          SET "isActive" = EXCLUDED."isActive", meta = EXCLUDED.meta
        RETURNING id
        """,
        (model_id, name, version, json.dumps({"strategy": "trend_score_fallback"})),
    )
    row = cur.fetchone()
    return row[0]


def load_top_recipes(cur, limit=200):
    """Prefer recipe_counters.trendScore, fallback to viewCount + recency."""
    # Try counters
    cur.execute(
        """
        SELECT r.id, COALESCE(rc."trendScore", 0) AS score
        FROM recipes r
        LEFT JOIN recipe_counters rc ON rc."recipeId" = r.id
        WHERE r.status = 'PUBLISHED' AND r."isHidden" = FALSE AND r."authorId" IS NOT NULL
        ORDER BY rc."trendScore" DESC NULLS LAST, r."createdAt" DESC, r.id DESC
        LIMIT %s
        """,
        (limit,),
    )
    rows = cur.fetchall()
    if rows and len(rows) >= max(20, limit // 5):
        return [{"recipeId": r[0], "score": float(r[1] or 0)} for r in rows]

    # Fallback simple score
    cur.execute(
        """
        SELECT r.id,
               (LN(1 + r."viewCount") + EXTRACT(EPOCH FROM (NOW() - r."createdAt")) / 86400.0 * -0.05) AS s
        FROM recipes r
        WHERE r.status = 'PUBLISHED' AND r."isHidden" = FALSE AND r."authorId" IS NOT NULL
        ORDER BY s DESC, r."createdAt" DESC, r.id DESC
        LIMIT %s
        """,
        (limit,),
    )
    rows = cur.fetchall()
    return [{"recipeId": r[0], "score": float(r[1] or 0)} for r in rows]


def load_target_users(cur, limit=500):
    """Pick recently active users (likes/saves/follows) or latest sign-ups as fallback."""
    cur.execute(
        """
        WITH active AS (
          SELECT l."userId" AS uid, MAX(l."createdAt") AS last_at FROM likes l GROUP BY 1
          UNION ALL
          SELECT s."userId" AS uid, MAX(s."createdAt") AS last_at FROM saves s GROUP BY 1
          UNION ALL
          SELECT f."followerId" AS uid, MAX(f."createdAt") AS last_at FROM follows f GROUP BY 1
        )
        SELECT u.id
        FROM users u
        LEFT JOIN (
          SELECT uid, MAX(last_at) AS last_at FROM active GROUP BY 1
        ) a ON a.uid = u.id
        ORDER BY COALESCE(a.last_at, u."createdAt") DESC
        LIMIT %s
        """,
        (limit,),
    )
    return [r[0] for r in cur.fetchall()]


def upsert_user_recos(cur, model_id: str, user_id: str, items):
    cur.execute(
        """
        INSERT INTO user_recommendations (id, "userId", "modelId", items, "updatedAt")
        VALUES (%s, %s, %s, %s::jsonb, NOW())
        ON CONFLICT ("userId", "modelId") DO UPDATE
          SET items = EXCLUDED.items, "updatedAt" = NOW()
        """,
        (str(uuid.uuid4()), user_id, model_id, json.dumps(items)),
    )


def main():
    t0 = time.time()
    conn = connect_db()
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            model_id = ensure_active_model(cur)
            items = load_top_recipes(cur, limit=200)
            users = load_target_users(cur, limit=500)
            top_n = 50
            batch = [{"recipeId": x["recipeId"], "score": x["score"]} for x in items[:top_n]]
            count = 0
            for uid in users:
                upsert_user_recos(cur, model_id, uid, batch)
                count += 1
            conn.commit()
            print(json.dumps({"ok": True, "modelId": model_id, "users": count, "tookMs": int((time.time() - t0) * 1000)}))
    except Exception as e:
        conn.rollback()
        print(json.dumps({"ok": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()



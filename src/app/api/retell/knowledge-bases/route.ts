import { NextRequest, NextResponse } from "next/server";
import { listKnowledgeBases, createKnowledgeBase, getKnowledgeBase } from "@/lib/retell-api";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

async function getFallbackUserId(): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: users } = await supabase.from("users").select("id").limit(1);
    if (users && users.length > 0) return users[0].id;
  } catch (e) {}
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    let userId = payload?.sub || null;
    const userRole = payload?.role || 'owner';
    if (!userId) userId = await getFallbackUserId();

    if (!userId) {
      return NextResponse.json([]);
    }

    const isSuperAdmin = ['super_admin', 'admin', 'operations', 'support'].includes(userRole);

    if (isSuperAdmin) {
      try {
        const kbs = await listKnowledgeBases({ skipCache: true });
        if (Array.isArray(kbs) && kbs.length > 0) {
          return NextResponse.json(kbs);
        }
      } catch (adminKbErr) {
        console.warn("[Super Admin listKnowledgeBases error]", adminKbErr);
      }
    }

    const supabase = createServerSupabaseClient();

    // Query local DB for Knowledge Bases created by this user
    const { data: userKbs, error } = await supabase
      .from("retell_knowledge_bases")
      .select("*");

    if (error) {
      console.warn("[DB Knowledge Bases Query Warning]", error);
    }

    // Filter KBs created by this user (or all if super admin)
    const userKbRecords = (userKbs || []).filter(
      (kb: any) =>
        isSuperAdmin ||
        kb.created_by === userId ||
        kb.raw_payload?.created_by === userId
    );

    if (userKbRecords.length === 0) {
      if (isSuperAdmin) {
        const liveKbs = await listKnowledgeBases({ skipCache: true });
        return NextResponse.json(liveKbs || []);
      }
      return NextResponse.json([]);
    }

    // Fetch live status for user's created knowledge bases
    const userLiveKbs = await Promise.all(
      userKbRecords.map(async (record: any) => {
        try {
          const live = await getKnowledgeBase(record.knowledge_base_id, { skipCache: true });
          return {
            ...record,
            ...live,
            knowledge_base_id: record.knowledge_base_id,
            knowledge_base_name: live?.knowledge_base_name || record.knowledge_base_name,
            status: live?.status || record.status || "complete",
          };
        } catch {
          return {
            knowledge_base_id: record.knowledge_base_id,
            knowledge_base_name: record.knowledge_base_name,
            status: record.status || "complete",
          };
        }
      })
    );

    return NextResponse.json(userLiveKbs);
  } catch (error: any) {
    console.error("[GET /api/retell/knowledge-bases]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user knowledge bases" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    let userId = payload?.sub || null;
    if (!userId) userId = await getFallbackUserId();

    const body = await req.json();
    const {
      knowledge_base_name,
      texts,
      urls,
      files,
      knowledge_base_texts,
      knowledge_base_urls,
      knowledge_base_files,
    } = body;

    if (!knowledge_base_name) {
      return NextResponse.json(
        { error: "knowledge_base_name is required" },
        { status: 400 }
      );
    }

    // 1. Create Knowledge Base on Retell API
    const createdKb = await createKnowledgeBase({
      knowledge_base_name,
      texts,
      urls,
      files,
      knowledge_base_texts,
      knowledge_base_urls,
      knowledge_base_files,
    });

    // 2. Track in Supabase retell_knowledge_bases table tied to userId
    if (createdKb?.knowledge_base_id) {
      try {
        const supabase = createServerSupabaseClient();
        await supabase.from("retell_knowledge_bases").upsert({
          knowledge_base_id: createdKb.knowledge_base_id,
          knowledge_base_name: createdKb.knowledge_base_name || knowledge_base_name,
          status: createdKb.status || "indexing",
          raw_payload: {
            ...createdKb,
            created_by: userId,
          },
          updated_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn("[Track User KB DB Error]", dbErr);
      }
    }

    return NextResponse.json(createdKb, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/retell/knowledge-bases]", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Knowledge Base" },
      { status: error.status || 500 }
    );
  }
}

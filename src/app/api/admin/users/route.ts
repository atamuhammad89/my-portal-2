import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestJwt, requireRole } from '@/lib/jwt-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    if (!payload || !requireRole(payload, ['super_admin', 'admin', 'operations'])) {
      return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const supabase = createServerSupabaseClient();
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .order('full_name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(users || []);
  } catch (error: any) {
    console.error('[API /admin/users GET Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch users list' },
      { status: 500 }
    );
  }
}
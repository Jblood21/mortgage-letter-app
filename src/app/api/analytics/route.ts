import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/analytics - Get analytics summary
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Base query
    let query = supabase
      .from('letters')
      .select('*, created_by_user:users!created_by(full_name)')
      .eq('company_id', companyId);

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const { data: letters, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate analytics
    const totalLetters = letters?.length || 0;
    const activeLetters = letters?.filter(l => l.status === 'issued').length || 0;
    const expiredLetters = letters?.filter(l => l.status === 'expired').length || 0;
    const sentLetters = letters?.filter(l => l.status === 'sent').length || 0;
    const viewedLetters = letters?.filter(l => l.viewed_at).length || 0;
    const signedLetters = letters?.filter(l => l.signed_at).length || 0;

    const totalPreApprovalAmount = letters?.reduce(
      (sum, l) => sum + (l.pre_approval_amount || 0),
      0
    ) || 0;

    const averagePreApprovalAmount = totalLetters > 0
      ? totalPreApprovalAmount / totalLetters
      : 0;

    const conversionRate = sentLetters > 0
      ? (signedLetters / sentLetters) * 100
      : 0;

    // Group by loan type
    const lettersByLoanType: Record<string, number> = {};
    letters?.forEach(l => {
      const type = l.loan_type || 'other';
      lettersByLoanType[type] = (lettersByLoanType[type] || 0) + 1;
    });

    // Group by month
    const lettersByMonth: { month: string; count: number }[] = [];
    const monthCounts: Record<string, number> = {};
    letters?.forEach(l => {
      const month = new Date(l.created_at).toISOString().substring(0, 7);
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, count]) => {
        lettersByMonth.push({ month, count });
      });

    // Top loan officers
    const loByOfficer: Record<string, { name: string; count: number; amount: number }> = {};
    letters?.forEach(l => {
      const name = l.created_by_user?.full_name || 'Unknown';
      if (!loByOfficer[name]) {
        loByOfficer[name] = { name, count: 0, amount: 0 };
      }
      loByOfficer[name].count += 1;
      loByOfficer[name].amount += l.pre_approval_amount || 0;
    });

    const topLoanOfficers = Object.values(loByOfficer)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      totalLetters,
      activeLetters,
      expiredLetters,
      sentLetters,
      viewedLetters,
      signedLetters,
      totalPreApprovalAmount,
      averagePreApprovalAmount,
      conversionRate,
      lettersByLoanType,
      lettersByMonth,
      topLoanOfficers,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

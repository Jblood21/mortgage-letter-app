import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createServerClient();
    const token = params.token;

    // Find the portal access record
    const { data: access, error: accessError } = await supabase
      .from('borrower_portal_access')
      .select(`
        *,
        letter:letters(
          *,
          borrower:borrowers(*),
          created_by:users(*),
          company:companies(*)
        )
      `)
      .eq('access_token', token)
      .single();

    if (accessError || !access) {
      return NextResponse.json(
        { error: 'Letter not found or access expired' },
        { status: 404 }
      );
    }

    // Check if access has expired
    if (new Date(access.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Letter not found or access expired' },
        { status: 403 }
      );
    }

    // Update last accessed time
    await supabase
      .from('borrower_portal_access')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', access.id);

    // Update letter viewed_at if not already set
    if (!access.letter.viewed_at) {
      await supabase
        .from('letters')
        .update({
          viewed_at: new Date().toISOString(),
          status: access.letter.status === 'sent' ? 'viewed' : access.letter.status
        })
        .eq('id', access.letter.id);
    }

    const letter = access.letter;

    // Return formatted letter data
    return NextResponse.json({
      id: letter.id,
      borrower: {
        firstName: letter.borrower.first_name,
        lastName: letter.borrower.last_name,
      },
      loanOfficer: {
        fullName: letter.created_by.full_name,
        phone: letter.created_by.phone || '',
        email: letter.created_by.email,
      },
      company: {
        name: letter.company.name,
        logoUrl: letter.company.logo_url,
        primaryColor: letter.company.primary_color,
      },
      loanAmount: letter.loan_amount,
      preApprovalAmount: letter.pre_approval_amount,
      loanType: letter.loan_type,
      expirationDate: letter.expiration_date,
      letterContent: letter.letter_content,
      status: letter.status,
      issuedAt: letter.created_at,
    });
  } catch (error) {
    console.error('Portal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

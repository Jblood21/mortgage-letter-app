import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createEmailService } from '@/lib/email';

// POST /api/email/send - Send pre-approval letter via email
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const {
      company_id,
      letter_id,
      user_id,
      to_emails,
      include_pdf,
      pdf_base64,
    } = body;

    if (!company_id || !letter_id || !user_id || !to_emails?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get company settings
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (companyError || !company?.resend_api_key) {
      return NextResponse.json(
        { error: 'Email not configured for this company' },
        { status: 400 }
      );
    }

    // Get letter details
    const { data: letter, error: letterError } = await supabase
      .from('letters')
      .select(`
        *,
        borrower:borrowers!borrower_id(*),
        created_by_user:users!created_by(*)
      `)
      .eq('id', letter_id)
      .single();

    if (letterError || !letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    // Create email service
    const emailService = createEmailService(
      company.resend_api_key,
      company.email || undefined,
      company.name
    );

    // Send email
    const result = await emailService.sendPreApprovalLetter({
      to: to_emails,
      borrowerName: `${letter.borrower.first_name} ${letter.borrower.last_name}`,
      loanOfficerName: letter.created_by_user.full_name,
      companyName: company.name,
      preApprovalAmount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(letter.pre_approval_amount),
      expirationDate: new Date(letter.expiration_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      letterPdfBase64: include_pdf ? pdf_base64 : undefined,
      portalLink: `${process.env.NEXT_PUBLIC_APP_URL}/portal/${letter_id}`,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log the email
    for (const email of to_emails) {
      await supabase.from('email_logs').insert({
        company_id,
        letter_id,
        sent_by: user_id,
        sent_to: email,
        subject: `Pre-Approval Letter - ${letter.borrower.first_name} ${letter.borrower.last_name}`,
        status: 'sent',
        resend_id: result.messageId,
      });
    }

    // Update letter status
    await supabase
      .from('letters')
      .update({
        status: 'sent',
        sent_to_emails: to_emails,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', letter_id);

    // Create audit log
    await supabase.from('audit_logs').insert({
      company_id,
      user_id,
      action: 'send_email',
      entity_type: 'letter',
      entity_id: letter_id,
      new_values: { to_emails, message_id: result.messageId },
    });

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}

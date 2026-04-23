import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, letterContent, borrowerName, loanOfficerName, loanOfficerPhone, loanOfficerEmail } = await request.json();

    if (!to || !subject || !letterContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In production, integrate with an email service like SendGrid, Resend, or AWS SES
    // For now, we'll simulate a successful email send
    console.log('Sending email to:', to);
    console.log('Subject:', subject);
    console.log('Borrower:', borrowerName);
    console.log('Loan Officer:', loanOfficerName, loanOfficerEmail, loanOfficerPhone);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (_error) {
    console.error('Email send error:', _error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

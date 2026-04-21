import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createAriveClient, mapAriveLoanToBorrower, mapAriveLoanToLetter } from '@/lib/arive';

// GET /api/arive/loans - Fetch loans from Arive
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Get company's Arive credentials
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('arive_api_key, arive_company_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company?.arive_api_key) {
      return NextResponse.json(
        { error: 'Arive not configured for this company' },
        { status: 400 }
      );
    }

    const ariveClient = createAriveClient(
      company.arive_api_key,
      company.arive_company_id
    );

    // Fetch loans from Arive
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { loans, total } = await ariveClient.getLoans({
      status,
      limit,
      offset,
    });

    return NextResponse.json({ loans, total });
  } catch (error) {
    console.error('Arive API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch loans' },
      { status: 500 }
    );
  }
}

// POST /api/arive/loans - Import a loan from Arive
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { company_id, loan_id, user_id } = body;

    if (!company_id || !loan_id || !user_id) {
      return NextResponse.json(
        { error: 'Company ID, Loan ID, and User ID required' },
        { status: 400 }
      );
    }

    // Get company's Arive credentials
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('arive_api_key, arive_company_id')
      .eq('id', company_id)
      .single();

    if (companyError || !company?.arive_api_key) {
      return NextResponse.json(
        { error: 'Arive not configured for this company' },
        { status: 400 }
      );
    }

    const ariveClient = createAriveClient(
      company.arive_api_key,
      company.arive_company_id
    );

    // Fetch loan details from Arive
    const ariveLoan = await ariveClient.getLoan(loan_id);

    // Create or update borrower
    const borrowerData = mapAriveLoanToBorrower(ariveLoan);

    // Check if borrower exists
    const { data: existingBorrower } = await supabase
      .from('borrowers')
      .select('id')
      .eq('arive_borrower_id', ariveLoan.loanId)
      .eq('company_id', company_id)
      .single();

    let borrowerId: string;

    if (existingBorrower) {
      // Update existing borrower
      await supabase
        .from('borrowers')
        .update({ ...borrowerData, updated_at: new Date().toISOString() })
        .eq('id', existingBorrower.id);
      borrowerId = existingBorrower.id;
    } else {
      // Create new borrower
      const { data: newBorrower, error: borrowerError } = await supabase
        .from('borrowers')
        .insert({
          company_id,
          ...borrowerData,
        })
        .select('id')
        .single();

      if (borrowerError) {
        return NextResponse.json({ error: borrowerError.message }, { status: 500 });
      }
      borrowerId = newBorrower.id;
    }

    // Map loan data
    const letterData = mapAriveLoanToLetter(ariveLoan);

    // Log the import
    await supabase.from('audit_logs').insert({
      company_id,
      user_id,
      action: 'import_from_arive',
      entity_type: 'borrower',
      entity_id: borrowerId,
      new_values: { arive_loan_id: loan_id, borrower_data: borrowerData },
    });

    return NextResponse.json({
      success: true,
      borrower_id: borrowerId,
      loan_data: letterData,
      borrower_data: borrowerData,
    });
  } catch (error) {
    console.error('Arive import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import loan' },
      { status: 500 }
    );
  }
}

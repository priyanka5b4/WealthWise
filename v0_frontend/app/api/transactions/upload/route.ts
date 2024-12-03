import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const accountDataStr = formData.get('accountData') as string;
    
    if (!accountDataStr) {
      return NextResponse.json(
        { error: 'Account data is required' },
        { status: 400 }
      );
    }

    const accountData = JSON.parse(accountDataStr);

    // Create the account first
    try {
      const accountResponse = await fetch(`${process.env.BACKEND_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (!accountResponse.ok) {
        throw new Error('Failed to create account');
      }

      const account = await accountResponse.json();

      // If there's a file, process transactions
      if (file) {
        const fileBuffer = await file.arrayBuffer();
        const fileContent = new TextDecoder().decode(fileBuffer);

        // Parse CSV content
        const records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });

        // Basic validation of required fields
        const validRecords = records.filter((record: any) => {
          return record.date && record.amount && record.name;
        }).map((record: any) => ({
          ...record,
          account_id: account.id, // Add the account ID to each transaction
        }));

        if (validRecords.length === 0) {
          return NextResponse.json(
            { error: 'No valid transactions found in the CSV file' },
            { status: 400 }
          );
        }

        // Send transactions to backend
        const transactionResponse = await fetch('YOUR_BACKEND_API/transactions/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validRecords),
        });

        if (!transactionResponse.ok) {
          throw new Error('Failed to upload transactions');
        }

        return NextResponse.json({
          message: `Successfully created account and processed ${validRecords.length} transactions`,
          account: account,
          totalRecords: records.length,
          validRecords: validRecords.length,
        });
      }

      return NextResponse.json({
        message: 'Successfully created account',
        account: account,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to create account' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

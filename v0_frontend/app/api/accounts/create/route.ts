import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('Starting account creation process...');
    
    const formData = await req.formData();
    console.log('Form data received');
    
    const accountDataStr = formData.get('accountData') as string;
    const validatedRecordsStr = formData.get('validatedRecords') as string;
    
    console.log('Account Data:', accountDataStr);
    console.log('Validated Records:', validatedRecordsStr);
    
    if (!accountDataStr) {
      console.log('Error: Account data is missing');
      return NextResponse.json(
        { error: 'Account data is required' },
        { status: 400 }
      );
    }

    const accountData = JSON.parse(accountDataStr);
    console.log('Parsed account data:', accountData);

    // Create the account first
    try {
      console.log('Account data being sent:', JSON.stringify(accountData, null, 2));
      console.log('Attempting to create account at:', `${process.env.NEXT_PUBLIC_API_URL}/accounts`);
      
      const accountResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      console.log('Account creation response status:', accountResponse.status);
      
      if (!accountResponse.ok) {
        const errorText = await accountResponse.text();
        console.error('Account creation failed:', errorText);
        throw new Error(`Failed to create account: ${errorText}`);
      }

      const responseText = await accountResponse.text();
      console.log('Raw account response:', responseText);

      let account;
      try {
        account = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse account response as JSON:', e);
        throw new Error('Invalid JSON response from account creation');
      }

      console.log('Parsed account response:', JSON.stringify(account, null, 2));

      // Check the structure of the account response
      if (!account || typeof account !== 'object') {
        console.error('Invalid account response format:', account);
        throw new Error('Invalid account response format');
      }

      if (!account.id) {
        console.error('Account response missing ID. Full response:', account);
        // Check if the ID might be nested
        const possibleIds = ['id', '_id', 'accountId', 'account_id'];
        for (const idField of possibleIds) {
          if (account[idField]) {
            console.log(`Found ID in field '${idField}':`, account[idField]);
            account.id = account[idField];
            break;
          }
        }
        
        if (!account.id) {
          throw new Error('Account response missing ID field');
        }
      }

      console.log('Successfully extracted account ID:', account.id);

      console.log('Account created successfully. Full response:', JSON.stringify(account, null, 2));

      // If we have validated records, send them to the backend
      if (validatedRecordsStr) {
        console.log('Processing validated records...');
        
        // Validate and format each transaction
        const validatedRecords = JSON.parse(validatedRecordsStr).map((record: any, index: number) => {
          // Validate required fields
          if (!record.date || !record.amount || !record.name) {
            throw new Error(`Transaction at index ${index} missing required fields`);
          }

          // Format date to ensure YYYY-MM-DD format
          const date = new Date(record.date);
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid date format at index ${index}`);
          }

          // Ensure amount is a number
          const amount = typeof record.amount === 'number' ? 
            record.amount : 
            parseFloat(record.amount);
            
          if (isNaN(amount)) {
            throw new Error(`Invalid amount at index ${index}`);
          }

          return {
            date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            amount: amount,
            name: record.name.trim(),
            account_id: account.id,
            category: record.category?.trim() || null,
            merchant_name: record.merchant_name?.trim() || null,
            iso_currency_code: record.iso_currency_code?.trim() || 'USD'
          };
        });

        if (validatedRecords.length === 0) {
          throw new Error('No valid transactions to process');
        }

        console.log('First transaction after validation:', JSON.stringify(validatedRecords[0], null, 2));
        console.log('Total transactions to upload:', validatedRecords.length);

        // Send transactions to backend
        console.log('Sending transactions to:', `${process.env.NEXT_PUBLIC_API_URL}/transactions/bulk`);
        const requestBody = { 
          transactions: validatedRecords.map(record => ({
            ...record,
            category: record.category || undefined,
            merchant_name: record.merchant_name || undefined,
            iso_currency_code: record.iso_currency_code || undefined
          }))
        };
        
        console.log('Sample transaction from request:', JSON.stringify(requestBody.transactions[0], null, 2));

        const transactionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('Transaction upload response status:', transactionResponse.status);
        
        if (!transactionResponse.ok) {
          const errorText = await transactionResponse.text();
          console.error('Transaction upload failed:', errorText);
          throw new Error(`Failed to upload transactions: ${errorText}`);
        }

        const transactionResult = await transactionResponse.json();
        console.log('Transactions uploaded successfully:', transactionResult);

        return NextResponse.json({
          message: `Successfully created account and processed ${validatedRecords.length} transactions`,
          account: account,
          transactionsCount: validatedRecords.length,
        });
      }

      return NextResponse.json({
        message: 'Successfully created account',
        account: account,
      });
    } catch (error: any) {
      console.error('API Error:', error);
      console.error('Error stack:', error.stack);
      return NextResponse.json(
        { error: error.message || 'An error occurred while processing the request' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Outer try-catch Error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing the request' },
      { status: 500 }
    );
  }
}

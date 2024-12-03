import { systemPrompt } from '@/data/prompt';
// app/api/chat/route.ts

import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500, // Max 500 users per minute
});

async function fetchTransactions() {
    try {
        const response = await fetch('http://localhost:8000/api/transactions');
        if (!response.ok) {
            throw new Error('Failed to fetch transactions');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

function formatTransactionData(transactions) {
    // Group transactions by account
    const accountTransactions = {};
    transactions.forEach(transaction => {
        if (!accountTransactions[transaction.account_id]) {
            accountTransactions[transaction.account_id] = [];
        }
        accountTransactions[transaction.account_id].push(transaction);
    });

    // Format the data in a more readable way
    let formattedData = "USER'S FINANCIAL DATA:\n\n";
    formattedData += "Available Accounts and Transactions:\n";
    
    Object.entries(accountTransactions).forEach(([accountId, txns]) => {
        const accountTxns = txns as any[];
        formattedData += `\nAccount ID: ${accountId}\n`;
        
        // Calculate account balance
        const balance = accountTxns.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        formattedData += `Current Balance: $${balance.toFixed(2)}\n`;
        formattedData += "Recent Transactions:\n";
        
        // Add transaction details
        accountTxns.forEach(tx => {
            formattedData += `- ${tx.date}: ${tx.name} - $${Math.abs(tx.amount).toFixed(2)} `;
            formattedData += `(${tx.amount < 0 ? 'outflow' : 'inflow'})`;
            if (tx.category) formattedData += ` [${tx.category.join(' > ')}]`;
            formattedData += '\n';
        });
    });

    return formattedData;
}

export async function POST(req: Request) {
    try {
        // Apply rate limiting
        const ip = req.headers.get('x-forwarded-for') || 'anonymous';
        const rateLimitInfo = await limiter.check(ip, 10); // 10 requests per minute per IP

        // Extract the `messages` from the body of the request
        const { messages } = await req.json();

        // Fetch transactions
        const transactions = await fetchTransactions();

        // Format transactions data
        const formattedTransactions = formatTransactionData(transactions);

        // Add transactions context to system prompt
        const systemPromptWithTransactions = `${systemPrompt}\n\n${formattedTransactions}`;

        // Get a language model
        const model = google('models/gemini-1.5-flash-8b');

        // Call the language model with the prompt
        const result = await streamText({
            model,
            messages,
            maxTokens: 4096,
            temperature: 0.7,
            topP: 0.4,
            system: systemPromptWithTransactions,
        });

        // Create response with rate limit headers
        const response = result.toDataStreamResponse();
        response.headers.set(
            'X-RateLimit-Limit',
            rateLimitInfo.limit.toString()
        );
        response.headers.set(
            'X-RateLimit-Remaining',
            rateLimitInfo.remaining.toString()
        );
        response.headers.set(
            'X-RateLimit-Reset',
            rateLimitInfo.reset.toString()
        );

        return response;
    } catch (error) {
        if (error.code === 'RATE_LIMIT_EXCEEDED') {
            const rateLimitInfo = error.rateLimitInfo;
            return new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded',
                    message:
                        'Please wait a minute before sending another message',
                    retryAfter: Math.ceil(
                        (rateLimitInfo.reset - Date.now()) / 1000
                    ),
                    rateLimitInfo,
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': Math.ceil(
                            (rateLimitInfo.reset - Date.now()) / 1000
                        ).toString(),
                        'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimitInfo.reset.toString(),
                    },
                }
            );
        }
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: 'Something went wrong. Please try again later.',
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
}

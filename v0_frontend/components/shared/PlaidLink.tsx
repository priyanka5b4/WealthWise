"use client";

import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Plus } from "lucide-react";
import { ErrorDialog } from "@/components/ui/ErrorDialog";
import { GetAccountService } from "@/app/utilities/accountService";
import { useToast } from "@/hooks/use-toast";

export const PlaidLink = () => {
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLinking, setIsLinking] = useState(false);
    const accountService = GetAccountService();
    const { toast } = useToast();

    const generateToken = async () => {
        try {
            console.log('Generating link token...');
            const response = await fetch("/api/create_link_token", {
                method: "POST",
            });
            if (!response.ok) {
                throw new Error(`Failed to generate link token: ${response.status}`);
            }
            const data = await response.json();
            console.log('Link token response:', data);
            setLinkToken(data.link_token);
        } catch (error) {
            console.error("Error generating link token:", error);
            setError("Failed to initialize Plaid Link. Please try again.");
        }
    };

    useEffect(() => {
        generateToken();
    }, []);

    const onSuccess = async (public_token: string, metadata: any) => {
        try {
            setIsLinking(true);
            console.log('Plaid link success, metadata:', metadata);

            // Step 1: Exchange public token for access token
            console.log('Exchanging public token...');
            const tokenResponse = await fetch("/api/set_access_token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    public_token,
                    metadata,
                    institution: metadata.institution,
                    accounts: metadata.accounts
                }),
            });

            if (!tokenResponse.ok) {
                throw new Error(`Failed to exchange token: ${tokenResponse.statusText}`);
            }

            const tokenData = await tokenResponse.json();
            console.log('Access token exchange response:', tokenData);

            // Step 2: Fetch accounts from Plaid
            console.log('Fetching accounts from Plaid...');
            const accountsResponse = await fetch("/api/plaid/accounts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    access_token: tokenData.access_token,
                    item_id: tokenData.item_id
                }),
            });

            if (!accountsResponse.ok) {
                throw new Error(`Failed to fetch accounts: ${accountsResponse.statusText}`);
            }

            const accountsData = await accountsResponse.json();
            console.log('Plaid accounts response:', accountsData);

            // Step 3: Save accounts to our database
            console.log('Saving accounts...');
            const saveResponse = await fetch("/api/accounts/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    item_id: tokenData.item_id,
                    accounts: accountsData.accounts,
                    institution: metadata.institution
                }),
            });

            if (!saveResponse.ok) {
                throw new Error(`Failed to save accounts: ${saveResponse.statusText}`);
            }

            const savedData = await saveResponse.json();
            console.log('Saved accounts:', savedData);

            // Step 4: Refresh accounts list
            console.log('Refreshing accounts list...');
            const accounts = await accountService.getAccountsList();
            console.log('Updated accounts:', accounts);

            toast({
                title: "Success",
                description: "Bank account linked successfully!",
            });
        } catch (error: any) {
            console.error("Error linking account:", error);
            setError(error.message || "An unexpected error occurred");
            toast({
                title: "Error",
                description: error.message || "Failed to link account",
                variant: "destructive",
            });
        } finally {
            setIsLinking(false);
        }
    };

    const config = {
        token: linkToken!,
        onSuccess,
        onExit: (err: any) => {
            console.log('Plaid link exit:', err);
            if (err != null) {
                console.error('Plaid exit error:', err);
                setError(err.message || "An error occurred during linking");
            }
        },
        onEvent: (eventName: string, metadata: any) => {
            console.log('Plaid event:', eventName, metadata);
        },
    };

    const { open, ready } = usePlaidLink(config);

    if (!linkToken) return null;

    return (
        <>
            <button
                onClick={() => {
                    console.log('Opening Plaid link...');
                    open();
                }}
                disabled={!ready || isLinking}
                className="flex items-center gap-2 p-2 text-sm font-medium text-primary hover:bg-gray-100 rounded-md transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus className="h-4 w-4" />
                {isLinking ? 'Linking...' : 'Link Bank Account'}
            </button>
            <ErrorDialog error={error} onClose={() => setError(null)} />
        </>
    );
}; 
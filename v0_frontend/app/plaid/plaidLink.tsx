"use client";

import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Plus, Loader2 } from "lucide-react";
import { ErrorDialog } from "@/components/ui/ErrorDialog";
import { GetAccountService } from "../utilities/accountService";
import { useToast } from "@/hooks/use-toast";

export const LinkService = () => {
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLinking, setIsLinking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
            setIsSaving(true);
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
                const errorData = await tokenResponse.json();
                if (tokenResponse.status === 409) {
                    throw new Error(errorData.error || "This bank account is already connected");
                }
                throw new Error(`Failed to exchange token: ${tokenResponse.statusText}`);
            }

            const tokenData = await tokenResponse.json();
            console.log('Access token exchange response:', tokenData);

            // Step 2: Refresh accounts list
            console.log('Refreshing accounts list...');
            await accountService.forceRefreshAccounts();

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
            setIsSaving(false);
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
                {isLinking ? (isSaving ? 'Saving Accounts...' : 'Linking...') : 'Link Bank Account'}
            </button>
            {error && <ErrorDialog error={error} onClose={() => setError(null)} />}
            {isSaving && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving accounts...</span>
                    </div>
                </div>
            )}
        </>
    );
}; 
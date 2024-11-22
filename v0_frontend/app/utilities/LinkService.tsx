"use client";
import React, { useEffect, useState, useRef } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Plus } from "lucide-react";
import { ErrorDialog } from "@/components/ui/ErrorDialog";
import { GetAccountService } from "../accounts/accountService";

const LinkService = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const scriptLoaded = useRef(false);

  const generateToken = async () => {
    try {
      const response = await fetch("/api/create_link_token", {
        method: "POST",
      });
      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (error) {
      console.error("Error generating link token:", error);
    }
  };

  useEffect(() => {
    if (!scriptLoaded.current) {
      generateToken();
      scriptLoaded.current = true;
    }
    // Cleanup function to handle unmounting
    return () => {
      scriptLoaded.current = false;
    };
  }, []);

  return linkToken != null ? <Link linkToken={linkToken} /> : null;
};
// LINK COMPONENT
// Use Plaid Link and pass link token and onSuccess function
// in configuration to initialize Plaid Link
interface LinkProps {
  linkToken: string | null;
}
const Link: React.FC<LinkProps> = (props: LinkProps) => {
  const [error, setError] = useState<string | null>(null);
  const accountService = GetAccountService();
  const onSuccess = React.useCallback(async (public_token, metadata) => {
    try {
      const response = await fetch("/api/set_access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_token, metadata }),
      });

      if (response.status === 409) {
        throw new Error("Account has already been linked");
      } else if (!response.ok) {
        throw new Error("Failed to link account. Please try again.");
      }

      // get the latest accounts if link is successful
      accountService.getAccountsList().then((response) => {
        console.log("Link succeeded", response);
        return { success: true };
      });
    } catch (error) {
      console.error("Error linking account:", error);
      setError(error.message || "An unexpected error occurred");
      return { error: true };
    }
  }, []);

  const config: Parameters<typeof usePlaidLink>[0] = {
    token: props.linkToken!,
    onSuccess,
  };
  const { open, ready } = usePlaidLink(config);
  return (
    <>
      <button
        className=" flex flex-row p-2 justify-center cursor-pointer"
        onClick={() => open()}
      >
        <Plus className="mr-2 h-4 w-4" />
        <div className="text-sm font-semibold">Link Account</div>
      </button>
      <ErrorDialog error={error} onClose={() => setError(null)} />
    </>
  );
};
export default LinkService;

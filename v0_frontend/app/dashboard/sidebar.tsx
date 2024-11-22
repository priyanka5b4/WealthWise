"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  LayoutDashboard,
  Wallet,
  Receipt,
  Plus,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from "react";
import NewAccount from "../utilities/newPlaidAccount";
import NewManualAccountDialog from "../utilities/newmanualAccount";
import LinkService from "../utilities/LinkService";
import { GetAccountService } from "../accounts/accountService";

const Logo = () => (
  <div className="font-semibold text-xl mb-6">Wealth Wise</div>
);

const SearchBar = () => (
  <div className="relative mb-6">
    <Input placeholder="Search or jump to" className="pl-9" />
    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
    <div className="absolute right-3 top-2.5 flex gap-1">
      <kbd className="px-1.5 py-0.5 text-xs border rounded">⌘</kbd>
      <kbd className="px-1.5 py-0.5 text-xs border rounded">K</kbd>
    </div>
  </div>
);

const Navigation = () => (
  <nav className="space-y-1 mb-6">
    <Button variant="ghost" className="w-full justify-start">
      <LayoutDashboard className="mr-3 h-4 w-4" />
      <Link href={"./dashboard"}>Dashboard</Link>
    </Button>
    <Button variant="ghost" className="w-full justify-start">
      <Wallet className="mr-3 h-4 w-4" />
      <Link href={"./accounts"}> Accounts</Link>
    </Button>
    <Button variant="ghost" className="w-full justify-start">
      <Receipt className="mr-3 h-4 w-4" />
      <Link href={"./transactions"}> Transactions</Link>
    </Button>
  </nav>
);

const PortfolioHeader = () => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <span className="font-bold">ACCOUNTS</span>
    </div>
    {/* <Button variant="ghost" size="icon" className="h-6 w-6">
      <Plus className="h-4 w-4" />
    </Button> */}
    {/* <NewAccount ButtonText={" "}></NewAccount> */}
  </div>
);

const AccountItem = ({ account }) => (
  <div className="pl-7 py-2 hover:bg-gray-50 rounded-lg">
    <div className="flex justify-between items-center">
      <div>
        <div className="font-medium">{account.name}</div>
        {account.type && (
          <div className="text-sm text-gray-500">
            {account.type} ··· {account.number}
          </div>
        )}
      </div>
      <div className="text-right">
        <div>${account.balances.current.toLocaleString()}</div>
        {account.change && (
          <div
            className={account.change > 0 ? "text-green-500" : "text-red-500"}
          >
            {account.change > 0 ? "+" : ""}
            {account.change}%
          </div>
        )}
      </div>
    </div>
  </div>
);

const AccountsList = ({ accounts, toggleAccounts, settoggleAccounts }) => (
  <div className="flex-1 overflow-auto space-y-4">
    <div className="space-y-4">
      <div>
        <Button
          variant="ghost"
          className="w-full justify-between mb-2"
          onClick={() => {
            settoggleAccounts([!toggleAccounts[0], toggleAccounts[1]]);
          }}
        >
          <span className="flex items-center">
            <ChevronDown className="mr-3 h-4 w-4" />
            Connected Accounts
          </span>
          <span className="flex items-center gap-2">
            <span>$48,534</span>
            <span className="text-red-500 text-sm">-3.11%</span>
          </span>
        </Button>
        {toggleAccounts[0] && (
          <div className="flex justify-center hover:bg-[rgb(245,245,245)] rounded-md">
            <LinkService />
          </div>
        )}

        {toggleAccounts[0] &&
          accounts &&
          accounts
            .filter((account) => account.ConnectionType == "Plaid")
            .map((account) => (
              <AccountItem key={account.id} account={account} />
            ))}
      </div>

      <div>
        <Button
          variant="ghost"
          className="w-full justify-between mb-2"
          onClick={() => {
            const toggleStatus = toggleAccounts;
            settoggleAccounts([toggleStatus[0], !toggleStatus[1]]);
          }}
        >
          <span className="flex items-center">
            <ChevronDown className="mr-3 h-4 w-4" />
            Manual Accounts
          </span>
          <span className="flex items-center gap-2">
            <span>$48,534</span>
            <span className="text-red-500 text-sm">-3.11%</span>
          </span>
        </Button>
        {toggleAccounts[1] && (
          <div className="flex justify-center hover:bg-[rgb(245,245,245)] rounded-md">
            <NewManualAccountDialog ButtonText={"New Account"} />
          </div>
        )}
        {toggleAccounts[1] &&
          accounts
            .filter((account) => account.ConnectionType == "Manual")
            .map((account) => (
              <AccountItem key={account.id} account={account} />
            ))}
      </div>
    </div>
  </div>
);

const SidebarContent = ({ accounts, toggleAccounts, settoggleAccounts }) => (
  <div className="w-80 border-r p-6 flex flex-col">
    <Logo />
    <SearchBar />
    <Navigation />
    <PortfolioHeader />
    <AccountsList
      accounts={accounts}
      toggleAccounts={toggleAccounts}
      settoggleAccounts={settoggleAccounts}
    />
  </div>
);

export default function Sidebar() {
  const [toggleAccounts, settoggleAccounts] = useState([false, false]);
  const accountService = GetAccountService();
  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    const uuid = accountService.registeraccountsListener(setAccounts);
    accountService.getAccountsList().then((response) => {
      console.log("New accounts fetched", response);
      setAccounts(response);
    });
    return () => {
      accountService.unregisteraccountsListener(uuid);
    };
  }, []);

  return (
    <div className="flex h-screen bg-white">
      <SidebarContent
        accounts={accounts}
        toggleAccounts={toggleAccounts}
        settoggleAccounts={settoggleAccounts}
      />
    </div>
  );
}

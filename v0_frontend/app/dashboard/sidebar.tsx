"use client";
import { useState, useEffect, useCallback } from "react";
import { GetAccountService } from "../accounts/accountService";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  PlusCircle,
  CreditCard,
  Wallet,
  PiggyBank,
  DollarSign,
  TrendingUp,
  LayoutDashboard,
  History,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Account } from "../types/account";
import { useToast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LinkService } from "../plaid/plaidLink";
import NewManualAccountDialog from "../utilities/newManualAccount";

interface SidebarProps {
  className?: string;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-4">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
);

const Logo = () => (
  <div className="flex items-center space-x-2 px-3 py-3">
    <div className="relative">
      <DollarSign className="h-7 w-7 text-primary animate-pulse" />
      <div className="absolute inset-0 h-7 w-7 bg-primary/20 rounded-full blur-sm animate-pulse"></div>
    </div>
    <span className="font-bold text-xl tracking-tight">WealthWise</span>
  </div>
);

const AccountIcon = ({ type }: { type: string }) => {
  const icons = {
    depository: Wallet,
    credit: CreditCard,
    loan: DollarSign,
    investment: TrendingUp,
    savings: PiggyBank,
  };
  const Icon = icons[type.toLowerCase()] || Wallet;
  return (
    <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-primary/10 transition-colors">
      <Icon className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
    </div>
  );
};

const NavItem = ({ href, icon: Icon, label, isActive }: { href: string; icon: any; label: string; isActive: boolean }) => (
  <Link
    href={href}
    className={cn(
      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative",
      isActive 
        ? "bg-primary/10 text-primary" 
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    )}
  >
    <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-primary/10 transition-colors">
      <Icon className={cn(
        "h-4 w-4 transition-all",
        isActive ? "text-primary scale-110" : "text-gray-500 group-hover:text-primary group-hover:scale-110"
      )} />
    </div>
    <span className="flex-1">{label}</span>
    {isActive && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
    )}
  </Link>
);

const AccountItem = ({ account }: { account: Account }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.balances.iso_currency_code || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const pathname = usePathname();
  const isActive = pathname === `/accounts/${account.id}`;

  return (
    <Link
      href={`/accounts/${account.id}`}
      className={cn(
        "group flex items-center justify-between p-2.5 rounded-lg transition-all relative",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "hover:bg-gray-50 text-gray-600"
      )}
    >
      <div className="flex items-center gap-3">
        <AccountIcon type={account.type} />
        <div className="flex flex-col">
          <span className={cn(
            "text-sm font-medium transition-colors",
            isActive ? "text-primary" : "text-gray-700 group-hover:text-gray-900"
          )}>
            {account.name}
          </span>
          <span className="text-xs text-gray-500">
            {account.subtype || account.type}
            {account.mask && ` (...${account.mask})`}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className={cn(
          "text-sm font-medium transition-colors",
          isActive ? "text-primary" : "text-gray-700 group-hover:text-gray-900",
          account.balances.current < 0 && "text-red-600"
        )}>
          {formatCurrency(account.balances.current)}
        </span>
        {account.balances.available !== null && (
          <span className="text-xs text-gray-500">
            {formatCurrency(account.balances.available)} available
          </span>
        )}
      </div>
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
      )}
    </Link>
  );
};

const AccountsList = ({ accounts, isLoading }: { accounts: Account[], isLoading: boolean }) => {
  const [expandedSections, setExpandedSections] = useState({
    plaid: true,
    manual: true,
  });

  const toggleSection = (section: 'plaid' | 'manual') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getConnectionType = (account: Account): string => {
    return (account.connection_type || account.ConnectionType || '').toLowerCase();
  };

  const plaidAccounts = accounts.filter(acc => getConnectionType(acc) === 'plaid');
  const manualAccounts = accounts.filter(acc => getConnectionType(acc) === 'manual');

  const renderSection = (title: string, accounts: Account[], type: 'plaid' | 'manual') => (
    <div className="space-y-1">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-between group px-3 py-2 hover:bg-gray-50 transition-colors rounded-lg",
          expandedSections[type] && "bg-gray-50"
        )}
        onClick={() => toggleSection(type)}
      >
        <span className="flex items-center gap-2">
          <span className={cn(
            "h-4 w-4 transition-transform duration-200",
            expandedSections[type] && "rotate-90"
          )}>
            <ChevronRight className="text-gray-500 group-hover:text-gray-900" />
          </span>
          <span className="font-medium text-sm text-gray-700">{title}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </span>
          {type === 'plaid' ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                // Handle Plaid link
              }}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                // Handle manual account
              }}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Button>

      <div className={cn(
        "space-y-1 overflow-hidden transition-all duration-200 ease-in-out",
        expandedSections[type] ? "max-h-[1000px] opacity-100 pl-3" : "max-h-0 opacity-0"
      )}>
        {type === 'plaid' && <LinkService />}
        {type === 'manual' && (
          <NewManualAccountDialog ButtonText="Add Manual Account" />
        )}
        {accounts.map((account) => (
          <AccountItem key={account.id} account={account} />
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-100 rounded-lg mb-2"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-50 rounded-lg w-11/12"></div>
              <div className="h-10 bg-gray-50 rounded-lg w-10/12"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-3">
      <div className="space-y-6 py-4">
        {renderSection('Plaid Accounts', plaidAccounts, 'plaid')}
        {renderSection('Manual Accounts', manualAccounts, 'manual')}
      </div>
    </ScrollArea>
  );
};

const Navigation = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/accounts', icon: Wallet, label: 'Accounts' },
    { href: '/transactions', icon: History, label: 'Transactions' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
  ];

  return (
    <div className="space-y-1 py-4">
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
          isActive={pathname === item.href}
        />
      ))}
    </div>
  );
};

export default function Sidebar({ className }: SidebarProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const accountService = GetAccountService();
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await accountService.getAccountsList();
      setAccounts(response);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [accountService, toast]);

  useEffect(() => {
    fetchAccounts();
    const uuid = accountService.registeraccountsListener((updatedAccounts) => {
      console.log('Sidebar received updated accounts:', updatedAccounts);
      setAccounts(updatedAccounts);
      setIsLoading(false);
    });

    return () => {
      accountService.unregisteraccountsListener(uuid);
    };
  }, [accountService, fetchAccounts]);

  const sidebarContent = (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <Logo />
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      <Navigation />
      <AccountsList accounts={accounts} isLoading={isLoading} />
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 md:hidden z-50"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-lg">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={cn("hidden border-r bg-white md:flex md:w-72 md:flex-col", className)}>
        {sidebarContent}
      </div>
    </>
  );
}

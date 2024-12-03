"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parse } from 'csv-parse/sync';

const NewManualAccountDialog = ({ ButtonText }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [accountType, setAccountType] = useState("checking");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [validatedRecords, setValidatedRecords] = useState<any[] | null>(null);
  const [csvStats, setCsvStats] = useState<{ total: number; valid: number } | null>(null);

  const validateCSV = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (records.length === 0) {
        setError('The CSV file is empty');
        return false;
      }

      // Validate required columns exist
      const requiredColumns = ['date', 'amount', 'name'];
      const headers = Object.keys(records[0]);
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        setError(`Missing required columns: ${missingColumns.join(', ')}`);
        return false;
      }

      // Validate and transform records
      const validRecords = [];
      const errors = [];

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowNum = i + 2; // +2 because 1 is header and we start counting from 1

        // Validate date
        const date = new Date(record.date);
        if (isNaN(date.getTime())) {
          errors.push(`Row ${rowNum}: Invalid date format`);
          continue;
        }

        // Validate amount
        const amount = parseFloat(record.amount);
        if (isNaN(amount)) {
          errors.push(`Row ${rowNum}: Invalid amount format`);
          continue;
        }

        // Validate name
        if (!record.name || record.name.trim() === '') {
          errors.push(`Row ${rowNum}: Name is required`);
          continue;
        }

        validRecords.push({
          ...record,
          date: date.toISOString().split('T')[0],
          amount: amount,
        });
      }

      if (errors.length > 0) {
        setError(`Found ${errors.length} errors in CSV:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`);
        return false;
      }

      setValidatedRecords(validRecords);
      setCsvStats({
        total: records.length,
        valid: validRecords.length,
      });
      setError('');
      return true;
    } catch (err: any) {
      setError('Failed to parse CSV file. Please ensure it\'s a valid CSV format.');
      return false;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setValidatedRecords(null);
    setCsvStats(null);
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    await validateCSV(selectedFile);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      
      // Add account details
      const accountData = {
        accountType,
        bankName: (event.target as any).name.value,
        accountNumber: (event.target as any).AccountName.value,
        balance: (event.target as any).balance?.value ? parseFloat((event.target as any).balance.value) : undefined,
        creditLimit: (event.target as any).credit?.value ? parseFloat((event.target as any).credit.value) : undefined,
      };
      
      formData.append('accountData', JSON.stringify(accountData));

      // If we have a file and validated records, include them
      if (file && validatedRecords) {
        formData.append('file', file);
        formData.append('validatedRecords', JSON.stringify(validatedRecords));
      }

      const response = await fetch('/api/accounts/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create account');
      }

      const result = await response.json();
      console.log('Account created:', result);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the account');
    } finally {
      setIsUploading(false);
    }
  };

  const expectedFormat = `
date,amount,name,category,merchant_name,iso_currency_code
`.trim();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex flex-row p-2 justify-center cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          <div className="text-sm font-semibold">{ButtonText}</div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Manual Account</DialogTitle>
          <DialogDescription>
            Add a new account manually and optionally upload transaction history
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Bank Name
              </Label>
              <Input id="name" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="AccountName" className="text-right">
                Account Number
              </Label>
              <Input id="AccountName" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountType" className="text-right">
                Account Type
              </Label>
              <Select value={accountType} onValueChange={setAccountType} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(accountType === "checking" || accountType === "savings") && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="balance" className="text-right">
                  Balance
                </Label>
                <Input id="balance" type="number" step="0.01" className="col-span-3" required />
              </div>
            )}
            {accountType === "credit" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="credit" className="text-right">
                  Credit Limit
                </Label>
                <Input id="credit" type="number" step="0.01" className="col-span-3" required />
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Transaction History
                </Label>
                <div className="col-span-3 space-y-4">
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {error && (
                    <div className="text-sm text-red-500 mt-1">
                      {error.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  )}
                  {csvStats && !error && (
                    <div className="text-sm text-green-600 mt-1">
                      Successfully validated {csvStats.valid} transactions from {csvStats.total} rows
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Expected CSV Format:</Label>
                    <pre className="p-4 rounded-lg bg-secondary text-xs overflow-x-auto">
                      {expectedFormat}
                    </pre>
                    <p className="text-xs text-muted-foreground">
                      Required fields: date, amount, name. Additional fields will enhance transaction analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isUploading || (file && !validatedRecords)}
            >
              {isUploading ? 'Adding Account...' : 'Add Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewManualAccountDialog;

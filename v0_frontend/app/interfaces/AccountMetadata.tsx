export interface AccountMetadata {
  id: string;
  name: string;
  type: string;
  amount: number;
  number: string;
  ConnectionType: string;
}

// example
// {
//       id: 1,
//       name: "Bank of America",
//       type: "Checking",
//       number: "3432",
//       amount: 32126.0,
//       change: 1.3,
//       ConnectionType: "Plaid",
//     }

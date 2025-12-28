import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Clock, AlertCircle, CheckCircle2, Lock, Unlock, Ban } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function XrpEscrowGuide() {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="w-full bg-[#121A2F] border-[#2A3356]">
      <CardHeader className="bg-gradient-to-r from-[#121A2F] to-[#1D2A4D] cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              XRPL Escrow Guide
            </CardTitle>
            <CardDescription>
              Learn how to lock XRP with time and condition-based escrows
            </CardDescription>
          </div>
          {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-6">
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="finish">Finish</TabsTrigger>
              <TabsTrigger value="cancel">Cancel</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">What are XRPL Escrows?</h3>
                <p>
                  An escrow on the XRP Ledger is a feature that allows you to lock up XRP and release it later, 
                  either when time passes or when a cryptographic condition is fulfilled.
                </p>
                
                <Alert className="bg-[#1D2A4D] border-[#2A3356]">
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Escrow Types</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li><strong>Time-based:</strong> XRP is locked until a specific time (FinishAfter)</li>
                      <li><strong>Condition-based:</strong> XRP is locked until a cryptographic condition is met</li>
                      <li><strong>Combined:</strong> Both time and condition constraints can be applied</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <h3 className="text-lg font-semibold mt-4">Common Use Cases</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Payment Channels:</strong> Enabling fast, off-ledger payments</li>
                  <li><strong>Smart Contracts:</strong> Creating simple conditionally-released payments</li>
                  <li><strong>Locked Savings:</strong> Locking your own XRP for a future date</li>
                  <li><strong>Scheduled Payments:</strong> Setting up future-dated transactions</li>
                  <li><strong>Atomic Swaps:</strong> Facilitating cross-chain transactions</li>
                </ul>
                
                <h3 className="text-lg font-semibold mt-4">Key Properties</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="border border-[#2A3356] rounded-lg p-3 bg-[#171F36]">
                    <h4 className="font-medium mb-1">Required</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li><strong>Account:</strong> The creator of the escrow</li>
                      <li><strong>Destination:</strong> The recipient of the escrowed XRP</li>
                      <li><strong>Amount:</strong> The amount of XRP to escrow (in drops)</li>
                    </ul>
                  </div>
                  
                  <div className="border border-[#2A3356] rounded-lg p-3 bg-[#171F36]">
                    <h4 className="font-medium mb-1">Optional</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li><strong>FinishAfter:</strong> Time when escrow can be finished</li>
                      <li><strong>CancelAfter:</strong> Time when escrow can be cancelled</li>
                      <li><strong>Condition:</strong> Crypto-condition that must be fulfilled</li>
                    </ul>
                  </div>
                </div>
                
                <Alert variant="destructive" className="mt-4 bg-red-950 border-red-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important Considerations</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Escrowed XRP is removed from the sender's available balance</li>
                      <li>At least one of FinishAfter or Condition must be specified</li>
                      <li>If only CancelAfter is specified, the escrow can never be finished</li>
                      <li>The escrow remains on the ledger until explicitly finished or cancelled</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            
            <TabsContent value="create">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Creating an Escrow</h3>
                <p>
                  An EscrowCreate transaction locks up XRP until specific conditions are met. Here's how 
                  you can create different types of escrows:
                </p>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="time-held">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Time-based Escrow</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">Example of creating a time-based escrow that releases after a specific date:</p>
                      <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto text-sm">
{`// Create a time-based escrow that releases after 24 hours
const wallet = Wallet.fromSeed('sXXXXXXXXXXXXXXXXXXXXXXXXXXXX'); // Your secret

// Calculate the finish time (24 hours from now)
const finishAfter = Math.floor(Date.now() / 1000) + 86400 - 946684800;

// Prepare the escrow transaction
const escrowTx = {
  TransactionType: "EscrowCreate",
  Account: wallet.address,
  Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe", // Recipient
  Amount: "1000000", // 1 XRP in drops
  FinishAfter: finishAfter
};

// Submit the transaction
const client = new Client('wss://xrplcluster.com');
await client.connect();
const prepared = await client.autofill(escrowTx);
const signed = wallet.sign(prepared);
const result = await client.submitAndWait(signed.tx_blob);`}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="time-cancel">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        <span>Escrow with Cancel Condition</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">Creating an escrow that can be cancelled after a certain time:</p>
                      <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto text-sm">
{`// Create an escrow that can be cancelled after 30 days if not finished
const wallet = Wallet.fromSeed('sXXXXXXXXXXXXXXXXXXXXXXXXXXXX'); // Your secret

// Calculate finish and cancel times (1 day and 30 days from now)
const finishAfter = Math.floor(Date.now() / 1000) + 86400 - 946684800;
const cancelAfter = Math.floor(Date.now() / 1000) + 2592000 - 946684800; // 30 days

// Prepare the escrow transaction
const escrowTx = {
  TransactionType: "EscrowCreate",
  Account: wallet.address,
  Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe", // Recipient
  Amount: "1000000", // 1 XRP in drops
  FinishAfter: finishAfter,
  CancelAfter: cancelAfter
};

// Submit the transaction
const client = new Client('wss://xrplcluster.com');
await client.connect();
const prepared = await client.autofill(escrowTx);
const signed = wallet.sign(prepared);
const result = await client.submitAndWait(signed.tx_blob);`}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="crypto-condition">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span>Condition-based Escrow</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">Creating an escrow that requires a crypto-condition to be fulfilled:</p>
                      <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto text-sm">
{`// Create an escrow with a PREIMAGE-SHA-256 crypto-condition
const wallet = Wallet.fromSeed('sXXXXXXXXXXXXXXXXXXXXXXXXXXXX'); // Your secret

// Example crypto-condition (PREIMAGE-SHA-256)
// In a real app, you'd generate this properly
const condition = "A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100";
const fulfillment = "A0028000"; // The preimage is an empty string in this example

// Prepare the escrow transaction
const escrowTx = {
  TransactionType: "EscrowCreate",
  Account: wallet.address,
  Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe", // Recipient
  Amount: "1000000", // 1 XRP in drops
  Condition: condition,
  // Adding a cancel-after is a good practice even with conditions
  CancelAfter: Math.floor(Date.now() / 1000) + 2592000 - 946684800 // 30 days
};

// Submit the transaction
const client = new Client('wss://xrplcluster.com');
await client.connect();
const prepared = await client.autofill(escrowTx);
const signed = wallet.sign(prepared);
const result = await client.submitAndWait(signed.tx_blob);`}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <Alert className="mt-4 bg-[#1D2A4D] border-[#2A3356]">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Best Practices</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Always include a CancelAfter date as a safety mechanism</li>
                      <li>Save the transaction sequence number to reference when finishing/canceling</li>
                      <li>Test escrows with small amounts before creating large ones</li>
                      <li>Remember that the minimum escrow amount is 20 XRP</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            
            <TabsContent value="finish">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Finishing an Escrow</h3>
                <p>
                  An EscrowFinish transaction releases the XRP from an escrow to the recipient. 
                  Anyone can submit this transaction, not just the original sender or recipient.
                </p>
                
                <Alert className="bg-[#1D2A4D] border-[#2A3356]">
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Requirements for Finishing</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>For time-based escrows: the FinishAfter time must have passed</li>
                      <li>For condition-based escrows: a valid fulfillment must be provided</li>
                      <li>The escrow must not have been canceled</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto text-sm mt-4">
{`// Finish a time-based escrow
const wallet = Wallet.fromSeed('sXXXXXXXXXXXXXXXXXXXXXXXXXXXX'); // Your secret

// Prepare the finish transaction
const finishTx = {
  TransactionType: "EscrowFinish",
  Account: wallet.address, // Account submitting the transaction
  Owner: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH", // Account that created the escrow
  OfferSequence: 123456, // Sequence number of the EscrowCreate transaction
};

// Submit the transaction
const client = new Client('wss://xrplcluster.com');
await client.connect();
const prepared = await client.autofill(finishTx);
const signed = wallet.sign(prepared);
const result = await client.submitAndWait(signed.tx_blob);`}
                </pre>
                
                <h3 className="text-lg font-semibold mt-6">Finishing a Condition-based Escrow</h3>
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto text-sm">
{`// Finish a condition-based escrow
const wallet = Wallet.fromSeed('sXXXXXXXXXXXXXXXXXXXXXXXXXXXX'); // Your secret

// Prepare the finish transaction with fulfillment
const finishTx = {
  TransactionType: "EscrowFinish",
  Account: wallet.address, // Account submitting the transaction
  Owner: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH", // Account that created the escrow
  OfferSequence: 123456, // Sequence number of the EscrowCreate transaction
  Condition: "A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100", // Same condition from creation
  Fulfillment: "A0028000" // The fulfillment that satisfies the condition
};

// Submit the transaction
const client = new Client('wss://xrplcluster.com');
await client.connect();
const prepared = await client.autofill(finishTx);
const signed = wallet.sign(prepared);
const result = await client.submitAndWait(signed.tx_blob);`}
                </pre>
                
                <Alert variant="destructive" className="mt-4 bg-red-950 border-red-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Common Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li><strong>tecNO_TARGET:</strong> The escrow does not exist</li>
                      <li><strong>tecNOT_SATISFIABLE:</strong> FinishAfter time hasn't been reached yet</li>
                      <li><strong>tecCRYPTOCONDITION_ERROR:</strong> The fulfillment doesn't match the condition</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            
            <TabsContent value="cancel">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Canceling an Escrow</h3>
                <p>
                  An EscrowCancel transaction releases escrowed XRP back to the sender. This is only 
                  possible if the escrow has a CancelAfter time and that time has passed.
                </p>
                
                <Alert className="bg-[#1D2A4D] border-[#2A3356]">
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Requirements for Canceling</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>The escrow must have a CancelAfter field</li>
                      <li>The CancelAfter time must have passed</li>
                      <li>The escrow must not have been finished already</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto text-sm mt-4">
{`// Cancel an escrow
const wallet = Wallet.fromSeed('sXXXXXXXXXXXXXXXXXXXXXXXXXXXX'); // Your secret

// Prepare the cancel transaction
const cancelTx = {
  TransactionType: "EscrowCancel",
  Account: wallet.address, // Account submitting the transaction
  Owner: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH", // Account that created the escrow
  OfferSequence: 123456 // Sequence number of the EscrowCreate transaction
};

// Submit the transaction
const client = new Client('wss://xrplcluster.com');
await client.connect();
const prepared = await client.autofill(cancelTx);
const signed = wallet.sign(prepared);
const result = await client.submitAndWait(signed.tx_blob);`}
                </pre>
                
                <Alert variant="destructive" className="mt-4 bg-red-950 border-red-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Common Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li><strong>tecNO_TARGET:</strong> The escrow does not exist</li>
                      <li><strong>tecNO_PERMISSION:</strong> The CancelAfter time hasn't been reached yet</li>
                      <li><strong>tecNO_ENTRY:</strong> The escrow has already been finished or canceled</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <Alert className="mt-4 bg-[#1D2A4D] border-[#2A3356]">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Tip</AlertTitle>
                  <AlertDescription>
                    <p className="mt-2">
                      Anyone can submit an EscrowCancel transaction, not just the sender or recipient. This allows 
                      for third-party services to help clean up expired escrows from the ledger.
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
      
      <CardFooter className={`flex justify-between items-center bg-[#121A2F] ${expanded ? '' : 'hidden'}`}>
        <div className="text-sm text-muted-foreground">
          <a href="https://xrpl.org/escrow.html" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
            <ExternalLink className="h-3 w-3" />
            <span>Official XRPL Escrow Documentation</span>
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}

export default XrpEscrowGuide; 
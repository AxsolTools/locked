import { useState, useEffect } from 'react';
import { useSearchParams } from '../hooks/useSearchParams';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import { API_URL } from '../config';

const VerifyPage = () => {
  const params = useSearchParams();
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const txHash = params.get('txHash');
  const rollId = params.get('rollId');
  const result = params.get('result');
  const target = params.get('target') || '500000'; // Default to middle value of our range
  const isOver = params.get('isOver') || 'true';

  useEffect(() => {
    const verifyRoll = async () => {
      // If no parameters provided, show general fairness info
      if (!txHash || !rollId || !result) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Format URL for the verification endpoint
        const verifyEndpoint = `${API_URL}/api/dice/verify-roll?clientSeed=${encodeURIComponent(txHash)}&serverSeed=${encodeURIComponent(rollId)}&target=${encodeURIComponent(target)}&isOver=${encodeURIComponent(isOver)}`;
        
        const response = await fetch(verifyEndpoint);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to verify roll');
        }
        
        const data = await response.json();
        setVerificationData(data);
      } catch (err) {
        console.error('Error verifying roll:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    verifyRoll();
  }, [txHash, rollId, result, target, isOver]);

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Roll Verification</CardTitle>
          <CardDescription>
            Verify the fairness of your dice roll using cryptographic proof
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : !txHash || !rollId || !result ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-4">🎲 How Provably Fair Works</h3>
                <p className="text-muted-foreground mb-4">
                  Our dice game uses cryptographic techniques to ensure every roll is fair and cannot be manipulated by either the player or the house.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">The Process</h4>
                <Separator className="my-2" />
                <ol className="space-y-3 text-sm list-decimal list-inside">
                  <li><strong>Server Seed Generation:</strong> Before each game, the server generates a random server seed and provides you with its SHA-256 hash. This proves the seed was created before your bet.</li>
                  <li><strong>Client Seed:</strong> Your wallet address or transaction signature serves as the client seed, ensuring you contribute randomness to the outcome.</li>
                  <li><strong>Roll Calculation:</strong> The result is calculated by combining both seeds using SHA-256 cryptographic hashing, then converting to a number between 0 and 100.</li>
                  <li><strong>Verification:</strong> After each roll, you receive both the server seed and its hash, allowing you to independently verify the result was fair.</li>
                </ol>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">Why This Matters</h4>
                <Separator className="my-2" />
                <div className="space-y-2 text-sm">
                  <p>✅ <strong>Transparent:</strong> All seeds and hashes are visible to you</p>
                  <p>✅ <strong>Tamper-Proof:</strong> The server cannot change the outcome after you bet</p>
                  <p>✅ <strong>Verifiable:</strong> You can independently verify every single roll</p>
                  <p>✅ <strong>Fair:</strong> Neither party can predict or manipulate the result</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">How to Verify Your Rolls</h4>
                <Separator className="my-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  After each dice roll, click the "Verify Fairness" button in your game results. This will bring you back to this page with your roll's specific parameters, allowing you to cryptographically verify the outcome.
                </p>
                <Alert className="bg-cyan-950/30 border-cyan-500/30">
                  <AlertDescription className="text-sm">
                    💡 <strong>Pro Tip:</strong> You can also manually verify rolls using any SHA-256 calculator by combining the client seed and server seed, then converting the first 8 hex characters to a decimal number.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex justify-center mt-6 gap-4">
                <Button onClick={() => window.location.href = '/dice-game'} className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-black">
                  Try the Dice Game
                </Button>
              </div>
            </div>
          ) : verificationData ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Roll Parameters</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Client Seed (You):</div>
                  <div className="font-mono break-all">{verificationData.clientSeed}</div>
                  
                  <div className="font-medium">Server Seed:</div>
                  <div className="font-mono break-all">{verificationData.serverSeed}</div>
                  
                  <div className="font-medium">Server Seed Hash:</div>
                  <div className="font-mono break-all">{verificationData.serverSeedHash}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Roll Result</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Target:</div>
                  <div>{verificationData.target.toLocaleString()}</div>
                  
                  <div className="font-medium">Prediction:</div>
                  <div>{verificationData.isOver ? 'Over' : 'Under'}</div>
                  
                  <div className="font-medium">Roll Result:</div>
                  <div className="font-semibold text-xl text-primary">{verificationData.result.toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 2})}</div>
                  
                  <div className="font-medium">Outcome:</div>
                  <div className={verificationData.won ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                    {verificationData.won ? 'WIN' : 'LOSS'}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Verification</h3>
                <Separator className="my-2" />
                <p className="text-sm mb-4">
                  The roll result is determined by combining your client seed with the server's seed,
                  then converting the SHA-256 hash of this combined value to a number between 0 and 999,999.99.
                </p>
                <Alert className={verificationData.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                  <AlertDescription className="flex items-center">
                    <span className={`inline-block w-4 h-4 mr-2 rounded-full ${verificationData.verified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {verificationData.verified 
                      ? 'Roll result successfully verified! The outcome was fair and cannot be manipulated.' 
                      : 'Roll verification failed. The cryptographic proof does not match the claimed result.'}
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex justify-center mt-6">
                <Button onClick={() => window.location.href = '/dice-game'}>
                  Return to Dice Game
                </Button>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>No verification data available</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyPage; 
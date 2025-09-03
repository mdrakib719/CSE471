import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClubSubscriptions } from '@/hooks/useClubSubscriptions';
import { useAuth } from '@/context/AuthContext';

const SubscriptionDebug = () => {
  const { user } = useAuth();
  const { 
    subscriptions, 
    subscribeToClub, 
    unsubscribeFromClub, 
    isSubscribedToClub,
    getClubSubscriptionCount,
    fetchSubscriptions
  } = useClubSubscriptions();
  
  const [testClubId, setTestClubId] = useState('');
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testSubscription = async () => {
    if (!testClubId.trim()) {
      setTestResult('Please enter a club ID');
      return;
    }

    setLoading(true);
    setTestResult('Testing...');

    try {
      // Test subscription
      const subscribeResult = await subscribeToClub(testClubId);
      setTestResult(`Subscribe result: ${subscribeResult ? 'SUCCESS' : 'FAILED'}`);
      
      // Wait a moment then check if subscribed
      setTimeout(async () => {
        const isSubscribed = isSubscribedToClub(testClubId);
        const count = await getClubSubscriptionCount(testClubId);
        setTestResult(prev => `${prev}\nIs subscribed: ${isSubscribed}\nSubscription count: ${count}`);
      }, 1000);

    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testUnsubscription = async () => {
    if (!testClubId.trim()) {
      setTestResult('Please enter a club ID');
      return;
    }

    setLoading(true);
    setTestResult('Testing unsubscription...');

    try {
      const unsubscribeResult = await unsubscribeFromClub(testClubId);
      setTestResult(`Unsubscribe result: ${unsubscribeResult ? 'SUCCESS' : 'FAILED'}`);
      
      // Wait a moment then check if unsubscribed
      setTimeout(async () => {
        const isSubscribed = isSubscribedToClub(testClubId);
        const count = await getClubSubscriptionCount(testClubId);
        setTestResult(prev => `${prev}\nIs subscribed: ${isSubscribed}\nSubscription count: ${count}`);
      }, 1000);

    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscriptions = async () => {
    setLoading(true);
    try {
      await fetchSubscriptions();
      setTestResult('Subscriptions refreshed');
    } catch (error) {
      setTestResult(`Error refreshing: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to test subscriptions</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Subscription Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Test Club ID:</label>
          <input
            type="text"
            value={testClubId}
            onChange={(e) => setTestClubId(e.target.value)}
            placeholder="Enter a club UUID to test"
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={testSubscription} disabled={loading}>
            Test Subscribe
          </Button>
          <Button onClick={testUnsubscription} disabled={loading} variant="outline">
            Test Unsubscribe
          </Button>
          <Button onClick={refreshSubscriptions} disabled={loading} variant="secondary">
            Refresh
          </Button>
        </div>

        <div>
          <h4 className="font-medium mb-2">Current Subscriptions:</h4>
          <div className="text-sm text-muted-foreground">
            {subscriptions.length === 0 ? 'No subscriptions' : (
              <ul>
                {subscriptions.map(sub => (
                  <li key={sub.id}>
                    Club: {sub.club_id} | Active: {sub.is_active ? 'Yes' : 'No'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Test Results:</h4>
          <pre className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
            {testResult || 'No tests run yet'}
          </pre>
        </div>

        <div>
          <h4 className="font-medium mb-2">User Info:</h4>
          <div className="text-sm text-muted-foreground">
            User ID: {user.id}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionDebug;

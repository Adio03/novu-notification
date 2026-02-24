import React, { useEffect, useState } from 'react';
import NovuNotificationProvider from './NovuProvider';
import NotificationBell from './NotificationBell';

const App = () => {
  const [subscriberId, setSubscriberId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriberId = async () => {
      try {
        const response = await fetch('/api/auth/subscriber-id', {
          credentials: 'include',
        });

        if (!response.ok) {
          setSubscriberId('demo-user-123');
          return;
        }

        const data = await response.json();
        setSubscriberId(data.subscriberId);
      } catch (error) {
        console.log('Using demo subscriber ID');
        setSubscriberId('demo-user-123');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriberId();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!subscriberId) {
    return <div>Error: Could not load user information</div>;
  }

  return (
    <NovuNotificationProvider
      subscriberId={subscriberId}
      apiKey={import.meta.env.VITE_NOVU_API_KEY}
      backendUrl={import.meta.env.VITE_NOVU_BACKEND_URL}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
        <h1>Novu Notification Demo</h1>
        <NotificationBell position="top-right" theme="light" />
      </div>

      <main style={{ padding: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2>Getting Started</h2>
          <p><strong>Subscriber ID:</strong> {subscriberId}</p>
          
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
            <h3>Setup Instructions:</h3>
            <ol>
              <li>Create a <code>.env.local</code> file with your Novu credentials:
                <pre>{`VITE_NOVU_API_KEY=your_api_key
VITE_NOVU_BACKEND_URL=https://api.novu.co`}</pre>
              </li>
              <li>Trigger a workflow from your backend with subscriber ID: <strong>{subscriberId}</strong></li>
              <li>The notification bell will auto-fetch and display notifications</li>
            </ol>
          </div>

          <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
            <h3>Backend Integration Example (Java):</h3>
            <pre style={{ overflow: 'auto' }}>{`Novu novu = new Novu(System.getenv("NOVU_API_KEY"));
novu.triggerEvent(
  "workflow-id",
  "${subscriberId}",
  { "message": "Hello from backend!" }
);`}</pre>
          </div>
        </div>
      </main>
    </NovuNotificationProvider>
  );
};

export default App;

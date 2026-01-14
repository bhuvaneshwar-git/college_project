import { useEffect, useState } from 'react';
import authgear from '@authgear/web';

export default function AuthWrapper({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    authgear.configure({
      endpoint: "https://virtual-os.authgear.cloud",
      clientID: "475ff50c866bd1a8",
      sessionType: "31449600"
    }).then(() => {
      setIsAuthenticated(authgear.sessionState === "AUTHENTICATED");
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return (
      <div>
        <h1>Please Login</h1>
        <button onClick={() => authgear.startAuthentication({ redirectURI: window.location.origin })}>
          Login
        </button>
      </div>
    );
  }

  return children;
}

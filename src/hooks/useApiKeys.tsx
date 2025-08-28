import { useState, useEffect, createContext, useContext } from "react";
import { User } from "firebase/auth";

interface ApiKeys {
  runware?: string;
  huggingface?: string;
  openai?: string;
  replicate?: string;
  removebg?: string;
}

interface ApiKeyContextType {
  apiKeys: ApiKeys;
  setApiKey: (service: keyof ApiKeys, key: string) => void;
  getApiKey: (service: keyof ApiKeys) => string;
  clearApiKeys: () => void;
  hasApiKey: (service: keyof ApiKeys) => boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider = ({ 
  children, 
  user 
}: { 
  children: React.ReactNode;
  user: User | null;
}) => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});

  // Load API keys from localStorage when user changes
  useEffect(() => {
    if (user) {
      const storageKey = `apiKeys_${user.uid}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsedKeys = JSON.parse(stored);
          setApiKeys(parsedKeys);
        } catch (error) {
          console.error('Error parsing stored API keys:', error);
        }
      }
    } else {
      // Clear API keys when user logs out
      setApiKeys({});
    }
  }, [user]);

  // Save API keys to localStorage whenever they change
  useEffect(() => {
    if (user && Object.keys(apiKeys).length > 0) {
      const storageKey = `apiKeys_${user.uid}`;
      localStorage.setItem(storageKey, JSON.stringify(apiKeys));
    }
  }, [apiKeys, user]);

  const setApiKey = (service: keyof ApiKeys, key: string) => {
    setApiKeys(prev => ({
      ...prev,
      [service]: key.trim()
    }));
  };

  const getApiKey = (service: keyof ApiKeys): string => {
    return apiKeys[service] || '';
  };

  const hasApiKey = (service: keyof ApiKeys): boolean => {
    return Boolean(apiKeys[service]?.trim());
  };

  const clearApiKeys = () => {
    if (user) {
      const storageKey = `apiKeys_${user.uid}`;
      localStorage.removeItem(storageKey);
    }
    setApiKeys({});
  };

  return (
    <ApiKeyContext.Provider value={{
      apiKeys,
      setApiKey,
      getApiKey,
      clearApiKeys,
      hasApiKey
    }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKeys = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error("useApiKeys must be used within an ApiKeyProvider");
  }
  return context;
};
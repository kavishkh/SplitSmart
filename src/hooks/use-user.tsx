import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { userAPI } from "../services/api.js";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  memberSince: string;
  avatar?: string;
}

interface UserContextType {
  currentUser: User;
  updateUser: (userData: Partial<User>) => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, logout } = useAuth();
  const [currentUser, setCurrentUser] = useState<User>({
    id: "user-tusha",
    name: "tusha",
    email: "tusha@splitsmart.com",
    initials: "TU",
    memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    avatar: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // Update current user when auth user changes
  useEffect(() => {
    if (authUser) {
      setCurrentUser({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        initials: authUser.initials,
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        avatar: ""
      });
    }
  }, [authUser]);

  // Load real user data from database on app start
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // Try to get user from database
        const users = await userAPI.getAll();
        const realUser = users.find((user: any) => user.name === "tusha");
        
        if (realUser) {
          setCurrentUser({
            id: realUser.id,
            name: realUser.name,
            email: realUser.email,
            initials: realUser.initials,
            memberSince: new Date(realUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            avatar: realUser.avatar || ""
          });
          console.log('✅ Loaded real user data from database:', realUser.name);
        } else {
          // Create user in database if not exists
          const newUser = await userAPI.create({
            id: "user-tusha",
            name: "tusha",
            email: "tusha@splitsmart.com",
            initials: "TU",
            avatar: ""
          });
          console.log('✅ Created new user in database:', newUser.name);
        }
      } catch (error) {
        console.warn('⚠️ Could not load user from database, using default:', error);
        // Continue with default user if database is not available
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const updateUser = async (userData: Partial<User>) => {
    try {
      setCurrentUser(prev => ({ ...prev, ...userData }));
      console.log('✅ Updated user data:', userData);
    } catch (error) {
      console.error('❌ Failed to update user:', error);
    }
  };

  const signOut = () => {
    logout();
  };

  return (
    <UserContext.Provider value={{ currentUser, updateUser, signOut, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
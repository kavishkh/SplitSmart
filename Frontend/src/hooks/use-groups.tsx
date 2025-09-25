import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { groupAPI } from "../services/api.js";
import { useUser } from "./use-user";

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: GroupMember[];
  totalSpent: number;
  yourBalance: number;
  lastActivity: string;
  color: string;
  createdAt: Date;
  ownerId: string;
}

interface GroupsContextType {
  groups: Group[];
  createGroup: (groupData: {
    name: string;
    description: string;
    members: GroupMember[];
    color: string;
  }) => Promise<void>;
  deleteGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  getGroupById: (groupId: string) => Group | undefined;
  isLoading: boolean;
  refreshGroups: () => Promise<void>;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useUser();

  // Load groups from database
  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const dbGroups = await groupAPI.getAll();
      
      // Handle case where dbGroups might be undefined or null
      if (!dbGroups || !Array.isArray(dbGroups)) {
        console.log('No groups data received from API');
        setGroups([]);
        return;
      }
      
      // Transform database groups to match our interface
      const transformedGroups: Group[] = dbGroups.map((dbGroup: any) => ({
        id: dbGroup?.id || `group-${Date.now()}-${Math.random()}`,
        name: dbGroup?.name || 'Unnamed Group',
        description: dbGroup?.description || '',
        members: Array.isArray(dbGroup?.members) ? dbGroup.members : [],
        totalSpent: dbGroup?.totalAmount || 0,
        yourBalance: 0, // Will be calculated based on expenses
        lastActivity: new Date(dbGroup?.updatedAt || dbGroup?.createdAt || Date.now()).toLocaleDateString(),
        color: dbGroup?.color || 'from-blue-500 to-purple-600',
        createdAt: new Date(dbGroup?.createdAt || Date.now()),
        ownerId: dbGroup?.createdBy || currentUser?.id || 'unknown'
      }));
      
      setGroups(transformedGroups);
      console.log('✅ Loaded', transformedGroups.length, 'groups from database');
      console.log('📋 Groups data:', transformedGroups); // Debug log
    } catch (error) {
      console.warn('⚠️ Could not load groups from database:', error);
      // Set empty array on error to prevent app crash
      setGroups([]);
      toast.error('Could not load groups. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load groups on component mount
  useEffect(() => {
    loadGroups();
  }, []);

  const createGroup = async (groupData: {
    name: string;
    description: string;
    members: GroupMember[];
    color: string;
  }) => {
    try {
      setIsLoading(true);
      
      // Create group in database
      const newGroup = await groupAPI.create({
        name: groupData.name,
        description: groupData.description,
        members: groupData.members,
        color: groupData.color,
        createdBy: currentUser?.id || 'current-user'
      });

      // Transform and add to local state
      const transformedGroup: Group = {
        id: newGroup?.id || `group-${Date.now()}`,
        name: newGroup?.name || groupData.name || 'New Group',
        description: newGroup?.description || groupData.description || '',
        members: Array.isArray(newGroup?.members) ? newGroup.members : groupData.members || [],
        totalSpent: 0,
        yourBalance: 0,
        lastActivity: 'Just created',
        color: newGroup?.color || groupData.color || 'from-blue-500 to-purple-600',
        createdAt: new Date(newGroup?.createdAt || Date.now()),
        ownerId: newGroup?.createdBy || currentUser?.id || 'current-user'
      };

      setGroups(prev => [transformedGroup, ...prev]);
      toast.success(`Group "${transformedGroup.name}" created successfully! 🎉`);
      console.log('✅ Created new group:', transformedGroup.name);
    } catch (error) {
      console.error('❌ Failed to create group:', error);
      toast.error('Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGroup = (groupId: string) => {
    // Handle case where groups might be undefined
    if (!groups) {
      toast.error("No groups available");
      return;
    }
    
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      toast.error("Group not found");
      return;
    }

    if (group.ownerId !== (currentUser?.id || 'current-user')) {
      toast.error("You can only delete groups you created");
      return;
    }

    setGroups(prev => prev.filter(g => g.id !== groupId));
    toast.success("Group deleted successfully");
    console.log('🗑️ Deleted group:', group.name);
  };

  const updateGroup = (groupId: string, updates: Partial<Group>) => {
    // Handle case where groups might be undefined
    if (!groups) {
      console.warn('No groups available to update');
      return;
    }
    
    setGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, ...updates } : group
    ));
    console.log('📝 Updated group:', groupId);
  };

  const getGroupById = (groupId: string) => {
    // Handle case where groups might be undefined
    if (!groups) return undefined;
    return groups.find(group => group.id === groupId);
  };

  const refreshGroups = async () => {
    await loadGroups();
  };

  return (
    <GroupsContext.Provider
      value={{
        groups: groups || [], // Ensure we always return an array
        createGroup,
        deleteGroup,
        updateGroup,
        getGroupById,
        isLoading,
        refreshGroups,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const context = useContext(GroupsContext);
  if (context === undefined) {
    throw new Error("useGroups must be used within a GroupsProvider");
  }
  return context;
}
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { groupAPI } from "../services/api.js";
import { useUser } from "./use-user";
import realtimeService from "../services/realtime.js";

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status?: 'invited' | 'accepted'; // New field for invitation status
  invitedAt?: string;
  acceptedAt?: string;
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
  deleteGroup: (groupId: string) => Promise<void>;
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
      console.log('🔄 Loading groups from API...');
      const dbGroups = await groupAPI.getAll();
      
      // Handle case where dbGroups might be undefined or null
      if (!dbGroups) {
        console.log('⚠️ No groups data received from API');
        setGroups([]);
        setIsLoading(false);
        return;
      }
      
      // Ensure dbGroups is an array
      const groupsArray = Array.isArray(dbGroups) ? dbGroups : [dbGroups];
      
      // Transform database groups to match our interface
      const transformedGroups: Group[] = groupsArray.map((dbGroup: any) => ({
        id: dbGroup?.id || `group-${Date.now()}-${Math.random()}`,
        name: dbGroup?.name || 'Unnamed Group',
        description: dbGroup?.description || '',
        members: Array.isArray(dbGroup?.members) ? dbGroup.members : [],
        totalSpent: dbGroup?.totalAmount || dbGroup?.totalSpent || 0,
        yourBalance: dbGroup?.yourBalance || 0,
        lastActivity: new Date(dbGroup?.updatedAt || dbGroup?.createdAt || Date.now()).toLocaleDateString(),
        color: dbGroup?.color || 'from-blue-500 to-purple-600',
        createdAt: new Date(dbGroup?.createdAt || Date.now()),
        ownerId: dbGroup?.createdBy || dbGroup?.ownerId || currentUser?.id || 'unknown'
      }));
      
      setGroups(transformedGroups);
      console.log('✅ Loaded', transformedGroups.length, 'groups from database');
      console.log('📋 Groups data:', transformedGroups); // Debug log
    } catch (error: any) {
      console.error('❌ Error loading groups:', error);
      // Set empty array on error to prevent app crash
      setGroups([]);
      
      // Show a more specific error message
      if (error.message && error.message.includes('fetch')) {
        toast.error('Could not load groups. Please check your connection.');
      } else {
        toast.error('Could not load groups. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle real-time group updates
  const handleGroupUpdate = (operation: string, data: any) => {
    console.log(`🔄 Real-time group ${operation}:`, data);
    
    switch (operation) {
      case 'insert':
        // Add new group to the list
        const newGroup: Group = {
          id: data?.id || `group-${Date.now()}-${Math.random()}`,
          name: data?.name || 'Unnamed Group',
          description: data?.description || '',
          members: Array.isArray(data?.members) ? data.members : [],
          totalSpent: data?.totalAmount || data?.totalSpent || 0,
          yourBalance: data?.yourBalance || 0,
          lastActivity: new Date(data?.updatedAt || data?.createdAt || Date.now()).toLocaleDateString(),
          color: data?.color || 'from-blue-500 to-purple-600',
          createdAt: new Date(data?.createdAt || Date.now()),
          ownerId: data?.createdBy || data?.ownerId || currentUser?.id || 'unknown'
        };
        setGroups(prev => [newGroup, ...prev]);
        toast.success(`New group "${newGroup.name}" created!`);
        break;
        
      case 'update':
        // Update existing group
        setGroups(prev => prev.map(group => 
          group.id === data.id ? {
            ...group,
            name: data?.name || group.name,
            description: data?.description || group.description,
            members: Array.isArray(data?.members) ? data.members : group.members,
            totalSpent: data?.totalAmount || data?.totalSpent || group.totalSpent,
            yourBalance: data?.yourBalance !== undefined ? data.yourBalance : group.yourBalance,
            lastActivity: new Date(data?.updatedAt || Date.now()).toLocaleDateString(),
            color: data?.color || group.color,
            ownerId: data?.ownerId || group.ownerId
          } : group
        ));
        break;
        
      case 'delete':
        // Remove group from the list
        setGroups(prev => prev.filter(group => group.id !== data.id));
        toast.success('Group deleted');
        break;
    }
  };

  // Load groups on component mount
  useEffect(() => {
    loadGroups();
    
    // Connect to real-time service
    realtimeService.connect();
    
    // Add listener for group updates
    realtimeService.addListener('group_change', handleGroupUpdate);
    
    // Cleanup function
    return () => {
      realtimeService.removeListener('group_change', handleGroupUpdate);
      // Don't disconnect here as other components might be using the service
    };
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

      // Transform the group data
      const transformedGroup: Group = {
        id: newGroup?.id || `group-${Date.now()}`,
        name: newGroup?.name || groupData.name || 'New Group',
        description: newGroup?.description || groupData.description || '',
        members: Array.isArray(newGroup?.members) ? newGroup.members : groupData.members || [],
        totalSpent: newGroup?.totalAmount || newGroup?.totalSpent || 0,
        yourBalance: newGroup?.yourBalance || 0,
        lastActivity: 'Just created',
        color: newGroup?.color || groupData.color || 'from-blue-500 to-purple-600',
        createdAt: new Date(newGroup?.createdAt || Date.now()),
        ownerId: newGroup?.createdBy || newGroup?.ownerId || currentUser?.id || 'current-user'
      };

      // Note: We're NOT adding the group to local state here because 
      // the real-time update handler will take care of that
      // This prevents duplicate groups from appearing
      
      toast.success(`Group "${transformedGroup.name}" created successfully! 🎉`);
      console.log('✅ Created new group:', transformedGroup.name);
    } catch (error: any) {
      console.error('❌ Failed to create group:', error);
      
      // Show a more specific error message
      if (error.message && error.message.includes('fetch')) {
        toast.error('Failed to create group. Please check your connection.');
      } else {
        toast.error('Failed to create group. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
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

    try {
      // Delete from server
      await groupAPI.delete(groupId);
      
      // Update local state
      setGroups(prev => prev.filter(g => g.id !== groupId));
      toast.success("Group deleted successfully");
      console.log('🗑️ Deleted group:', group.name);
    } catch (error) {
      console.error('❌ Failed to delete group:', error);
      toast.error("Failed to delete group. Please try again.");
    }
  };

  const updateGroup = async (groupId: string, updates: Partial<Group>) => {
    // Handle case where groups might be undefined
    if (!groups) {
      console.warn('No groups available to update');
      return;
    }
    
    try {
      // Call the backend API to update the group
      const updatedGroup = await groupAPI.update(groupId, updates);
      
      // Update local state
      setGroups(prev => prev.map(group => 
        group.id === groupId ? { ...group, ...updatedGroup } : group
      ));
      
      console.log('📝 Updated group:', groupId);
    } catch (error) {
      console.error('❌ Error updating group:', error);
      toast.error('Failed to update group. Please try again.');
    }
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
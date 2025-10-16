// Supabase Real-time Service
// This service demonstrates how to use Supabase real-time subscriptions
// to listen for changes in the database and update the UI in real-time

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tqhdwtwrbguharyecfyt.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxaGR3dHdyYmd1aGFyeWVjZnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODUzMzgsImV4cCI6MjA3NTc2MTMzOH0.osLw-8zpFQtNZ8byOxTl27fbJeob7n3KRkgKVT-LdEs';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class SupabaseRealtimeService {
  constructor() {
    this.subscriptions = {};
  }

  // Subscribe to user changes
  subscribeToUsers(callback) {
    if (this.subscriptions.users) {
      console.warn('Already subscribed to users');
      return;
    }

    this.subscriptions.users = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log('User change received:', payload);
          callback(payload);
        }
      )
      .subscribe();

    console.log('Subscribed to user changes');
  }

  // Subscribe to group changes
  subscribeToGroups(callback) {
    if (this.subscriptions.groups) {
      console.warn('Already subscribed to groups');
      return;
    }

    this.subscriptions.groups = supabase
      .channel('groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
        },
        (payload) => {
          console.log('Group change received:', payload);
          callback(payload);
        }
      )
      .subscribe();

    console.log('Subscribed to group changes');
  }

  // Subscribe to expense changes
  subscribeToExpenses(callback) {
    if (this.subscriptions.expenses) {
      console.warn('Already subscribed to expenses');
      return;
    }

    this.subscriptions.expenses = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
        },
        (payload) => {
          console.log('Expense change received:', payload);
          callback(payload);
        }
      )
      .subscribe();

    console.log('Subscribed to expense changes');
  }

  // Subscribe to settlement changes
  subscribeToSettlements(callback) {
    if (this.subscriptions.settlements) {
      console.warn('Already subscribed to settlements');
      return;
    }

    this.subscriptions.settlements = supabase
      .channel('settlements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settlements',
        },
        (payload) => {
          console.log('Settlement change received:', payload);
          callback(payload);
        }
      )
      .subscribe();

    console.log('Subscribed to settlement changes');
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    Object.keys(this.subscriptions).forEach((key) => {
      const subscription = this.subscriptions[key];
      if (subscription) {
        supabase.removeChannel(subscription);
        delete this.subscriptions[key];
      }
    });
    console.log('Unsubscribed from all channels');
  }

  // Unsubscribe from a specific channel
  unsubscribe(channel) {
    if (this.subscriptions[channel]) {
      supabase.removeChannel(this.subscriptions[channel]);
      delete this.subscriptions[channel];
      console.log(`Unsubscribed from ${channel}`);
    }
  }
}

// Create a singleton instance
const supabaseRealtimeService = new SupabaseRealtimeService();

export default supabaseRealtimeService;

// Example usage:
/*
import supabaseRealtimeService from './supabaseRealtime';

// Subscribe to user changes
supabaseRealtimeService.subscribeToUsers((payload) => {
  console.log('User data changed:', payload);
  // Update your UI here
});

// Subscribe to group changes
supabaseRealtimeService.subscribeToGroups((payload) => {
  console.log('Group data changed:', payload);
  // Update your UI here
});

// When component unmounts or when you want to stop listening
// supabaseRealtimeService.unsubscribeAll();
*/
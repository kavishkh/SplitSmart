import cron from 'node-cron';
import { sendPaymentReminderEmail } from './emailService.js';
import { getDatabase } from '../config/database.js';

/**
 * Scheduled reminder service that sends payment reminders periodically
 */

// Schedule daily reminders at 9:00 AM
const dailyReminderSchedule = '0 9 * * *'; // Cron expression for daily at 9 AM

// Schedule weekly reminders on Mondays at 9:00 AM
const weeklyReminderSchedule = '0 9 * * 1'; // Cron expression for every Monday at 9 AM

/**
 * Send reminders to all members with outstanding balances
 */
async function sendAllReminders() {
  try {
    console.log('Sending scheduled payment reminders...');
    
    // Get database connection
    const db = await getDatabase();
    if (!db) {
      console.log('Database not connected. Skipping scheduled reminders.');
      return;
    }
    
    // Get all groups
    const groupsCollection = db.collection('groups');
    const groups = await groupsCollection.find({}).toArray();
    
    // For each group, check member balances and send reminders
    for (const group of groups) {
      // Calculate balances for each member in the group
      const memberBalances = await calculateGroupBalances(group.id, db);
      
      // Send reminders to members with balances
      if (memberBalances.length > 0) {
        const results = await sendPaymentReminders(memberBalances, group.name, group.id);
        console.log(`Sent reminders for group ${group.name}:`, results);
      }
    }
    
    console.log('Scheduled payment reminders completed.');
  } catch (error) {
    console.error('Error sending scheduled reminders:', error);
  }
}

/**
 * Calculate balances for all members in a group
 * @param {string} groupId - ID of the group
 * @param {Object} db - Database connection
 * @returns {Promise<Array>} - Array of members with their balances
 */
async function calculateGroupBalances(groupId, db) {
  try {
    // Get all expenses for this group
    const expensesCollection = db.collection('expenses');
    const expenses = await expensesCollection.find({ group_id: groupId }).toArray();
    
    // Get all settlements for this group
    const settlementsCollection = db.collection('settlements');
    const settlements = await settlementsCollection.find({ group_id: groupId }).toArray();
    
    // Get group details to access members
    const groupsCollection = db.collection('groups');
    const group = await groupsCollection.findOne({ id: groupId });
    
    if (!group) {
      console.log(`Group ${groupId} not found`);
      return [];
    }
    
    // Calculate balances for each member
    const memberBalances = group.members.map(member => {
      let totalPaid = 0;
      let totalOwed = 0;
      
      // Calculate how much this member has paid
      expenses.forEach(expense => {
        if (expense.paid_by === member.id) {
          totalPaid += parseFloat(expense.amount) || 0;
        }
      });
      
      // Calculate how much this member owes
      expenses.forEach(expense => {
        const split = expense.split_between.find(split => split.member_id === member.id);
        if (split) {
          totalOwed += parseFloat(split.amount) || 0;
        }
      });
      
      // Subtract settlements where this member paid others
      settlements.forEach(settlement => {
        if (settlement.from_user === member.id) {
          totalPaid += parseFloat(settlement.amount) || 0;
        }
        if (settlement.to_user === member.id) {
          totalOwed += parseFloat(settlement.amount) || 0;
        }
      });
      
      // Calculate net balance (positive means they are owed money, negative means they owe money)
      const balance = totalOwed - totalPaid;
      
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        balance: Math.abs(balance), // We only care about the absolute value for reminders
        groupId: groupId,
        owesMoney: balance < 0 // True if they owe money
      };
    });
    
    // Filter to only members who owe money and have a valid email
    return memberBalances.filter(member => 
      member.owesMoney && 
      member.balance > 0 && 
      member.email && 
      isValidEmail(member.email)
    );
  } catch (error) {
    console.error(`Error calculating balances for group ${groupId}:`, error);
    return [];
  }
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Send payment reminders to members with outstanding balances
 * @param {Array} members - Array of members with balances
 * @param {string} groupName - Name of the group
 * @param {string} groupId - ID of the group
 * @returns {Promise<Array>} - Array of email sending results
 */
export async function sendPaymentReminders(members, groupName, groupId) {
  const results = [];
  
  // Send reminder email to each member with a balance
  for (const member of members) {
    try {
      // Generate payment link
      const paymentLink = `http://localhost:8087/groups/${groupId}`;
      
      const result = await sendPaymentReminderEmail({
        to: member.email,
        memberName: member.name,
        groupName,
        amountOwed: `₹${member.balance.toFixed(2)}`,
        paymentLink
      });
      
      results.push({ member, success: result.success, error: result.error });
    } catch (error) {
      results.push({ member, success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Send reminder for a specific expense to members who haven't paid
 * @param {Array} members - Array of members who owe money
 * @param {Object} expense - Expense details
 * @param {string} groupName - Name of the group
 * @returns {Promise<Array>} - Array of email sending results
 */
export async function sendExpenseReminders(members, expense, groupName) {
  const results = [];
  
  // Send reminder email to each member who owes money for this expense
  for (const member of members) {
    try {
      // Calculate amount owed by this member for this expense
      const amountOwed = expense.split_between.find(split => split.member_id === member.id)?.amount || 0;
      
      // Skip if member doesn't owe anything for this expense
      if (amountOwed <= 0) {
        continue;
      }
      
      // Generate payment link for this specific expense
      const paymentLink = `http://localhost:8087/groups/${expense.group_id}`;
      
      const result = await sendPaymentReminderEmail({
        to: member.email,
        memberName: member.name,
        groupName,
        amountOwed: `₹${amountOwed.toFixed(2)}`,
        paymentLink
      });
      
      results.push({ member, success: result.success, error: result.error });
    } catch (error) {
      results.push({ member, success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Start the scheduled reminder service
 */
export function startScheduledReminders() {
  console.log('Starting scheduled reminder service...');
  
  // Schedule daily reminders
  cron.schedule(dailyReminderSchedule, async () => {
    console.log('Running daily reminder job...');
    await sendAllReminders();
  });
  
  console.log(`Daily reminders scheduled for: ${dailyReminderSchedule} (9:00 AM daily)`);
  
  // Schedule weekly reminders
  cron.schedule(weeklyReminderSchedule, async () => {
    console.log('Running weekly reminder job...');
    await sendAllReminders();
  });
  
  console.log(`Weekly reminders scheduled for: ${weeklyReminderSchedule} (9:00 AM every Monday)`);
}

export default {
  sendPaymentReminders,
  sendExpenseReminders,
  startScheduledReminders
};
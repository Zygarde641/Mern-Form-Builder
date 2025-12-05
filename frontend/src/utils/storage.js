/**
 * Utility functions for local storage management
 */

const USER_ID_KEY = 'airtable_forms_user_id';

export const storage = {
  getUserId: () => {
    return localStorage.getItem(USER_ID_KEY);
  },
  
  setUserId: (userId) => {
    localStorage.setItem(USER_ID_KEY, userId);
  },
  
  clearUserId: () => {
    localStorage.removeItem(USER_ID_KEY);
  },
  
  isLoggedIn: () => {
    return !!localStorage.getItem(USER_ID_KEY);
  }
};

export default storage;

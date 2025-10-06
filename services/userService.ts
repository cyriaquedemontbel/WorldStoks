import { User } from '../types';

// Mock database using localStorage
const USERS_KEY = 'skybet_users';

const getUsers = (): User[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Initialize with a default admin user if none exist
const initUsers = () => {
    const users = getUsers();
    const adminEmail = 'admin@skybet.io';
    if (!users.find(u => u.email === adminEmail)) {
        const adminUser: User = {
            id: 'admin-001',
            username: 'Admin',
            email: adminEmail,
            balance: 10000,
            bets: [],
            isAdmin: true,
            isSuspended: false,
        };
        // This is a mock, so we'll store a plain-text password for simplicity.
        // In a real app, NEVER do this.
        localStorage.setItem(`${adminEmail}_pw`, 'admin');
        saveUsers([adminUser, ...users.filter(u => u.email !== adminEmail)]);
    }
};

initUsers();

export const signup = (username: string, email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUsers();
      if (users.some(u => u.email === email)) {
        reject(new Error('An account with this email already exists.'));
        return;
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        username,
        email,
        balance: 100.00, // Starting balance
        bets: [],
        isAdmin: false,
        isSuspended: false,
      };

      users.push(newUser);
      saveUsers(users);
      // In a real app, you would hash the password. We'll store it separately for this mock.
      localStorage.setItem(`${email}_pw`, password);
      
      resolve(newUser);
    }, 500);
  });
};

export const login = (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getUsers();
        const user = users.find(u => u.email === email);
        const storedPassword = localStorage.getItem(`${email}_pw`);
  
        if (user && storedPassword === password) {
          if (user.isSuspended) {
            reject(new Error('Your account has been suspended.'));
            return;
          }
          resolve(user);
        } else {
          reject(new Error('Invalid email or password.'));
        }
      }, 500);
    });
};

export const getAllUsers = (): Promise<User[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(getUsers().filter(u => !u.isAdmin));
        }, 300);
    });
};

export const toggleUserSuspension = (userId: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const users = getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].isSuspended = !users[userIndex].isSuspended;
                saveUsers(users);
                resolve(users[userIndex]);
            } else {
                reject(new Error('User not found.'));
            }
        }, 200);
    });
};
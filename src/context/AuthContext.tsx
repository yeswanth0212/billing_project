import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { Storage } from '../utils/storage';
import { DEFAULT_USERS } from '../data/seedData';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, passwordOrPin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  hasRole: (allowedRoles: Role[]) => boolean;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(DEFAULT_USERS[0]);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);

  const refreshUsers = async () => {
    try {
      const storedUsers = await Storage.getUsers();
      if (storedUsers && storedUsers.length > 0) {
        setUsers(storedUsers);
        const activeId = Storage.getActiveUserId();
        const active = storedUsers.find(u => u.id === activeId) || storedUsers[0];
        setCurrentUser(active);
      }
    } catch (err) {
      console.error('Failed to load users from DB:', err);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const login = async (username: string, passwordOrPin: string): Promise<boolean> => {
    const allUsers = await Storage.getUsers();
    const cleanUsername = username.trim().toLowerCase();
    const cleanSecret = passwordOrPin.trim();

    const found = allUsers.find(
      u =>
        u.username.toLowerCase() === cleanUsername &&
        (u.password === cleanSecret || u.pin === cleanSecret) &&
        u.isActive
    );

    if (found) {
      setCurrentUser(found);
      Storage.setActiveUserId(found.id);
      await Storage.addAuditLog({
        userId: found.id,
        userName: found.name,
        action: 'LOGIN',
        details: `${found.role.toUpperCase()} ${found.name} logged in`,
      });
      return true;
    }
    return false;
  };

  const logout = async () => {
    if (currentUser) {
      await Storage.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'LOGOUT',
        details: `${currentUser.name} logged out`,
      });
    }
    setCurrentUser(null);
    Storage.setActiveUserId(null);
  };

  const switchUser = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      Storage.setActiveUserId(target.id);
      await Storage.addAuditLog({
        userId: target.id,
        userName: target.name,
        action: 'USER_SWITCH',
        details: `Switched active operator to ${target.name} (${target.role})`,
      });
    }
  };

  const hasRole = (allowedRoles: Role[]): boolean => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, switchUser, hasRole, refreshUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

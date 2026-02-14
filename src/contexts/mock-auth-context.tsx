'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate checking for existing session
        const storedUser = localStorage.getItem('mock_auth_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const signIn = async () => {
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const mockUser: User = {
            id: 'user-123',
            name: 'Demo User',
            email: 'demo@echolens.ai',
            avatarUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=random'
        };

        setUser(mockUser);
        localStorage.setItem('mock_auth_user', JSON.stringify(mockUser));
        setIsLoading(false);
    };

    const signOut = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setUser(null);
        localStorage.removeItem('mock_auth_user');
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a MockAuthProvider');
    }
    return context;
}

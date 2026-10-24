import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { BrandMark } from '../../components/ui/BrandMark';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, LogOut } from 'lucide-react';
import { UserProfile } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserUpdate: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
}) => {
  const { success, error } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login(email, name || email.split('@')[0]);
      onUserUpdate(res.user);
      success(`Signed in as ${res.user.name}`);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Authentication failed. Please check credentials.');
      error(err?.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      onUserUpdate(null);
      success('Signed out of Studio session');
      onClose();
    } catch (err: any) {
      error(err?.message || 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentUser ? 'Account & Session' : isSignUp ? 'Create Studio Account' : 'Sign In to VisionGen'}
      description={
        currentUser
          ? 'Manage your current authenticated studio session'
          : 'Access your persistent visual analyses and generated images'
      }
      maxWidth="sm"
    >
      {currentUser ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)]">
            <div className="w-12 h-12 rounded-full bg-[var(--vg-accent-primary)] text-white flex items-center justify-center font-bold text-lg">
              {currentUser.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-[var(--vg-text-primary)] truncate">
                {currentUser.name}
              </h3>
              <p className="text-xs text-[var(--vg-text-muted)] truncate">{currentUser.email}</p>
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-[var(--vg-status-success)]/15 text-[var(--vg-status-success)] font-medium">
                Active Session
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-[var(--vg-border)]">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={handleLogout}
              isLoading={isLoading}
            >
              Sign Out
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center pb-2">
            <BrandMark size="md" />
          </div>

          {formError && (
            <div
              role="alert"
              className="p-3 text-xs rounded-lg bg-[var(--vg-status-error)]/15 border border-[var(--vg-status-error)]/30 text-[var(--vg-status-error)]"
            >
              {formError}
            </div>
          )}

          {isSignUp && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-[var(--vg-text-secondary)] mb-1">
                Your Name
              </label>
              <div className="relative">
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Alex Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-sm text-[var(--vg-text-primary)] placeholder-[var(--vg-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--vg-accent-primary)]"
                />
                <UserIcon className="w-4 h-4 text-[var(--vg-text-muted)] absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-[var(--vg-text-secondary)] mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                id="auth-email"
                type="email"
                required
                placeholder="creator@visiongen.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-sm text-[var(--vg-text-primary)] placeholder-[var(--vg-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--vg-accent-primary)]"
              />
              <Mail className="w-4 h-4 text-[var(--vg-text-muted)] absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-[var(--vg-text-secondary)] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 rounded-lg bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-sm text-[var(--vg-text-primary)] placeholder-[var(--vg-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--vg-accent-primary)]"
              />
              <Lock className="w-4 h-4 text-[var(--vg-text-muted)] absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-2.5 text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button type="submit" variant="primary" size="md" isLoading={isLoading} className="w-full">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp((prev) => !prev);
                setFormError(null);
              }}
              className="text-xs text-[var(--vg-text-muted)] hover:text-[var(--vg-accent-primary)] transition-colors text-center cursor-pointer mt-1"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

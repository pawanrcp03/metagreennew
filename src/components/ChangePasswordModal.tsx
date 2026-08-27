import React, { useState } from 'react';
import { Lock, KeyRound, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useToast } from '../context/ToastContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  isFirstLogin?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  isFirstLogin = false,
  onClose,
  onSuccess
}: ChangePasswordModalProps) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      const msg = 'New password must be at least 6 characters long.';
      setError(msg);
      toast.warning(msg, 'Password Requirement');
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'New password and confirm password do not match.';
      setError(msg);
      toast.error(msg, 'Password Mismatch');
      return;
    }

    setLoading(true);

    try {
      await authService.updateUserPassword(newPassword);
      setSuccess(true);
      toast.success('Account password updated successfully!', 'Security Updated');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Password change error:', err);
      const msg = err.message || 'Failed to update password. Please try again.';
      setError(msg);
      toast.error(msg, 'Password Update Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="px-3 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Security Compliance
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              {isFirstLogin ? '🔒 First Login: Change Password' : 'Change Account Password'}
            </h2>
          </div>

          {!isFirstLogin && (
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isFirstLogin && (
          <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-2">
            <KeyRound className="w-4 h-4 shrink-0 text-amber-400" />
            <span>First-time login detected. You must set a new secure password before proceeding to your workspace.</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-black text-white">Password Updated Successfully!</h3>
            <p className="text-xs text-slate-400 font-medium">Your new password is now active. Redirecting to your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">New Password *</label>
              <div className="relative">
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-emerald-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Confirm New Password *</label>
              <div className="relative">
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-emerald-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              {!isFirstLogin && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

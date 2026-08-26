import { useState } from 'react';

export default function ResetPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) return setMessage('Passwords do not match');
    const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
    const data = await res.json();
    if (res.ok) setMessage('Password reset successful — you can now log in');
    else setMessage(data?.error || 'Reset failed');
  }

  return (
    <div className="auth-card card">
      <div className="auth-header">
        <img src="/crest-150.svg" alt="crest" style={{ height: 72 }} />
        <h2>Reset Password</h2>
      </div>
      <form style={{ padding: 16 }} onSubmit={handleSubmit}>
        <div className="field">
          <label>Reset Token</label>
          <input value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        <div className="field">
          <label>New Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>Confirm Password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <div>
          <button className="btn-primary" type="submit">Reset password</button>
        </div>
        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </form>
    </div>
  );
}

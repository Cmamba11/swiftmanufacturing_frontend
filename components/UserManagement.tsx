import React, { useState } from 'react';
import { AuthUser, CreateUserInput, ManagedUser, UpdateUserInput, UserRole } from '../types';

interface UserManagementProps {
  currentUser: AuthUser;
  users: ManagedUser[];
  onCreateUser: (data: CreateUserInput) => Promise<void>;
  onUpdateUser: (id: string, data: UpdateUserInput) => Promise<void>;
  onResetUserPassword: (id: string, password: string) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

const roleOptions = Object.values(UserRole);

function resolveRole(value: string): UserRole {
  const found = roleOptions.find((role) => role === value);
  return found ?? UserRole.MANAGEMENT;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  users,
  onCreateUser,
  onUpdateUser,
  onResetUserPassword,
  onDeleteUser,
}) => {
  const [createForm, setCreateForm] = useState<CreateUserInput>({
    username: '',
    name: '',
    role: UserRole.MANAGEMENT,
    password: '',
    active: true,
  });
  const [creating, setCreating] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);

    try {
      await onCreateUser({
        ...createForm,
        username: createForm.username.trim().toLowerCase(),
        name: createForm.name.trim(),
        password: createForm.password.trim(),
      });
      setCreateForm({
        username: '',
        name: '',
        role: UserRole.MANAGEMENT,
        password: '',
        active: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>, user: ManagedUser, isSelf: boolean) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: UpdateUserInput = {
      username: String(formData.get('username') ?? '').trim().toLowerCase(),
      name: String(formData.get('name') ?? '').trim(),
    };
    if (!isSelf) {
      payload.role = resolveRole(String(formData.get('role') ?? ''));
      payload.active = formData.get('active') === 'on';
    }

    setBusyUserId(user.id);
    try {
      await onUpdateUser(user.id, payload);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>, userId: string) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get('password') ?? '').trim();
    if (!password) {
      return;
    }

    setBusyUserId(userId);
    try {
      await onResetUserPassword(userId, password);
      form.reset();
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDelete = async (user: ManagedUser) => {
    if (!confirm(`Delete user "${user.username}"?`)) return;
    setBusyUserId(user.id);

    try {
      await onDeleteUser(user.id);
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-[#003366] tracking-tighter uppercase">User Management</h2>
          <p className="text-slate-500 font-medium italic">Create and maintain system accounts.</p>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#003366] mb-6">Create User</h3>
        <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4" onSubmit={handleCreate}>
          <input
            required
            value={createForm.username}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, username: event.target.value }))}
            placeholder="Username"
            className="px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-[#4DB848] font-bold text-slate-700"
          />
          <input
            required
            value={createForm.name}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Full Name"
            className="px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-[#4DB848] font-bold text-slate-700"
          />
          <select
            value={createForm.role}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, role: resolveRole(event.target.value) }))}
            className="px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-[#4DB848] font-bold text-slate-700 bg-white"
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <input
            required
            minLength={6}
            type="password"
            value={createForm.password}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Temporary Password"
            className="px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-[#4DB848] font-bold text-slate-700"
          />
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
              <input
                type="checkbox"
                checked={createForm.active}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, active: event.target.checked }))}
                className="w-4 h-4 accent-[#4DB848]"
              />
              Active
            </label>
            <button
              type="submit"
              disabled={creating}
              className="bg-[#4DB848] disabled:opacity-60 text-[#003366] px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs"
            >
              {creating ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        {users.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 font-bold">
            No users found.
          </div>
        )}

        {users.map((user) => {
          const isSelf = user.id === currentUser.id;
          const isBusy = busyUserId === user.id;

          return (
            <article key={user.id} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-[#003366] uppercase tracking-wide">{user.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {user.username} • Created {formatDate(user.createdAt)}
                  </p>
                </div>
                {isSelf && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    Current Session
                  </span>
                )}
              </div>

              <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4" onSubmit={(event) => void handleUpdate(event, user, isSelf)}>
                <input
                  required
                  name="username"
                  defaultValue={user.username}
                  className="px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-[#4DB848] font-bold text-slate-700"
                />
                <input
                  required
                  name="name"
                  defaultValue={user.name}
                  className="px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-[#4DB848] font-bold text-slate-700"
                />
                <select
                  name="role"
                  defaultValue={user.role}
                  disabled={isSelf}
                  className="px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-[#4DB848] font-bold text-slate-700 bg-white disabled:bg-slate-100"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600 px-2">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={user.active}
                    disabled={isSelf}
                    className="w-4 h-4 accent-[#4DB848] disabled:accent-slate-300"
                  />
                  Active
                </label>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="bg-[#003366] disabled:opacity-60 text-white px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs"
                >
                  {isBusy ? 'Saving...' : 'Save Changes'}
                </button>
              </form>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
                <form className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4" onSubmit={(event) => void handleResetPassword(event, user.id)}>
                  <input
                    required
                    minLength={6}
                    name="password"
                    type="password"
                    placeholder="New Password"
                    className="px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-[#4DB848] font-bold text-slate-700"
                  />
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="bg-slate-800 disabled:opacity-60 text-white px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs"
                  >
                    Reset Password
                  </button>
                </form>

                <button
                  type="button"
                  disabled={isBusy || isSelf}
                  onClick={() => void handleDelete(user)}
                  className="bg-red-50 border border-red-200 text-red-700 disabled:opacity-60 px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs"
                >
                  Delete User
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default UserManagement;

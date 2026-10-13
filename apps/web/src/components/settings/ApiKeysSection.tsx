import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { ApiKey, ApiKeyCreatedResponse } from '@swiftspend/types';

export const ApiKeysSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKeyCreatedResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<{ keys: ApiKey[] }>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await api.get('/api-keys');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/api-keys', { name });
      return res.data as ApiKeyCreatedResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewlyCreatedKey(data);
      setKeyName('');
      toast.success('API key generated successfully');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to generate API key';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key revoked');
    },
    onError: () => toast.error('Failed to revoke API key'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    createMutation.mutate(keyName.trim());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('API key copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const keys = data?.keys || [];

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="font-display font-medium text-headline-sm text-primary">API Keys & REST API</h3>
          <p className="font-body text-xs text-on-surface-variant">Manage API keys for third-party integrations & MCP</p>
        </div>
        <button
          onClick={() => {
            setNewlyCreatedKey(null);
            setIsModalOpen(true);
          }}
          className="font-label text-xs font-semibold text-primary hover:underline uppercase tracking-wider"
        >
          + Generate Key
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 divide-y divide-surface-container-low">
        {isLoading ? (
          <div className="p-6 text-center text-secondary font-body text-sm">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-6 text-center text-on-surface-variant font-body text-sm">
            No API keys generated yet. Create one to connect third-party apps or your MCP server.
          </div>
        ) : (
          keys.map((key) => (
            <div key={key.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-body font-semibold text-sm text-primary">{key.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant font-mono">
                  <span>{key.key_preview}</span>
                  <span>•</span>
                  <span>
                    Last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to revoke "${key.name}"?`)) {
                    deleteMutation.mutate(key.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="text-xs font-semibold text-error hover:underline"
              >
                Revoke
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-surface-variant/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline font-bold text-xl text-primary">
                {newlyCreatedKey ? 'API Key Generated' : 'Generate API Key'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewlyCreatedKey(null);
                }}
                className="material-symbols-outlined text-on-surface-variant hover:text-primary"
              >
                close
              </button>
            </div>

            {newlyCreatedKey ? (
              <div className="space-y-4">
                <div className="p-3 bg-warning-container/30 border border-warning/30 rounded-xl text-xs text-warning-on-container">
                  <p className="font-semibold mb-1">Copy your key now!</p>
                  <p>For security reasons, this key will never be shown again.</p>
                </div>

                <div className="bg-surface-container-high p-3 rounded-xl flex items-center justify-between gap-2 font-mono text-sm break-all text-primary">
                  <span>{newlyCreatedKey.api_key}</span>
                  <button
                    onClick={() => copyToClipboard(newlyCreatedKey.api_key)}
                    className="p-2 text-primary hover:bg-surface-container-low rounded-lg shrink-0"
                    title="Copy"
                  >
                    <span className="material-symbols-outlined text-base">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewlyCreatedKey(null);
                  }}
                  className="w-full py-3 bg-primary text-on-primary font-body text-sm font-semibold rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block font-body text-xs font-semibold text-primary mb-1">
                    Key Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. iOS Shortcut, Zapier, Claude MCP"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    required
                    className="w-full h-12 px-4 bg-surface-container-low border-none rounded-xl text-primary font-body text-base md:text-sm focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-surface-container-low text-primary font-body text-sm font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || !keyName.trim()}
                    className="px-5 py-2 bg-primary text-on-primary font-body text-sm font-semibold rounded-xl disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

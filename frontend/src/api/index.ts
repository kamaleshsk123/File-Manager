const API_URL = 'http://localhost:5000/api';

export const fetchStorage = async (): Promise<{ usedBytes: number; totalFiles: number }> => {
  const res = await fetch(`${API_URL}/storage`);
  if (!res.ok) throw new Error('Failed to fetch storage stats');
  return res.json();
};

export const fetchFolders = async (parentId?: string | null, filterType?: string) => {
  let url = parentId ? `${API_URL}/folders/${parentId}` : `${API_URL}/folders`;
  if (filterType && filterType !== 'home') {
    url = `${API_URL}/folders/filter/${filterType}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch folders');
  return res.json();
};

export const createFolder = async (name: string, parentFolderId?: string | null) => {
  const res = await fetch(`${API_URL}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parentFolderId }),
  });
  if (!res.ok) throw new Error('Failed to create folder');
  return res.json();
};

export const fetchFiles = async (folderId?: string | null, filterType?: string) => {
  let url = folderId ? `${API_URL}/files/${folderId}` : `${API_URL}/files`;
  if (filterType && filterType !== 'home') {
    url = `${API_URL}/files/filter/${filterType}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch files');
  return res.json();
};

export const uploadFile = async (file: File, folderId?: string | null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) formData.append('folderId', folderId);
  else formData.append('folderId', 'null');

  const res = await fetch(`${API_URL}/files/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload file');
  return res.json();
};

export const deleteFolder = async (id: string) => {
  const res = await fetch(`${API_URL}/folders/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete folder');
  return res.json();
};

export const deleteFile = async (id: string) => {
  const res = await fetch(`${API_URL}/files/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete file');
  return res.json();
};

export const restoreFolder = async (id: string) => {
  const res = await fetch(`${API_URL}/folders/${id}/restore`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to restore folder');
  return res.json();
};

export const restoreFile = async (id: string) => {
  const res = await fetch(`${API_URL}/files/${id}/restore`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to restore file');
  return res.json();
};

export const toggleFavoriteFolder = async (id: string) => {
  const res = await fetch(`${API_URL}/folders/${id}/favorite`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to toggle favorite');
  return res.json();
};

export const toggleFavoriteFile = async (id: string) => {
  const res = await fetch(`${API_URL}/files/${id}/favorite`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to toggle favorite');
  return res.json();
};

export const renameFolder = async (id: string, name: string) => {
  const res = await fetch(`${API_URL}/folders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to rename folder');
  return res.json();
};

export const renameFile = async (id: string, name: string) => {
  const res = await fetch(`${API_URL}/files/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to rename file');
  return res.json();
};

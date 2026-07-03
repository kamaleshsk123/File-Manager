import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Toolbar from './components/layout/Toolbar';
import Breadcrumb from './components/layout/Breadcrumb';
import MainContent from './components/layout/MainContent';
import { NewFolderModal, UploadModal } from './components/layout/MainContent';

function App() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('home');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<{ id: string; name: string }[]>([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleFolderOpen = (id: string, name: string) => {
    setCurrentFolderId(id);
    setBreadcrumbPath(prev => [...prev, { id, name }]);
  };

  const handleNavigate = (id: string | null) => {
    if (id === null) {
      setCurrentFolderId(null);
      setBreadcrumbPath([]);
    } else {
      const idx = breadcrumbPath.findIndex(s => s.id === id);
      setCurrentFolderId(id);
      setBreadcrumbPath(prev => prev.slice(0, idx + 1));
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground font-sans">
      <NewFolderModal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} parentId={currentFolderId} />
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} folderId={currentFolderId} />

      <Header
        onUpload={() => setUploadOpen(true)}
        onNewFolder={() => setNewFolderOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={activeTab} onChange={setActiveTab} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Toolbar
            view={view}
            onViewChange={setView}
            onUpload={() => setUploadOpen(true)}
            onNewFolder={() => setNewFolderOpen(true)}
          />
          <Breadcrumb path={breadcrumbPath} onNavigate={handleNavigate} />
          <MainContent
            currentFolderId={currentFolderId}
            onFolderOpen={handleFolderOpen}
            view={view}
            activeTab={activeTab}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

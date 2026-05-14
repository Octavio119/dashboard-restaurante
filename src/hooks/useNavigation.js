import { useState } from 'react';

export const useNavigation = () => {
  const [activeTab, setActiveTab]         = useState('Dashboard');
  const [searchQuery, setSearchQuery]     = useState('');
  const [bellOpen, setBellOpen]           = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return {
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    bellOpen, setBellOpen,
    sidebarOpen, setSidebarOpen,
    sidebarCollapsed, setSidebarCollapsed,
  };
};

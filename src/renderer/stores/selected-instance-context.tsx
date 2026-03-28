import React, { createContext, useContext, useState } from 'react';

interface SelectedInstanceContextValue {
  selectedInstanceId: string;
  setSelectedInstanceId: (id: string) => void;
}

const SelectedInstanceContext = createContext<SelectedInstanceContextValue>({
  selectedInstanceId: '',
  setSelectedInstanceId: () => {},
});

export function SelectedInstanceProvider({ children }: { children: React.ReactNode }) {
  const [selectedInstanceId, setSelectedInstanceId] = useState('');
  return (
    <SelectedInstanceContext.Provider value={{ selectedInstanceId, setSelectedInstanceId }}>
      {children}
    </SelectedInstanceContext.Provider>
  );
}

export function useSelectedInstance() {
  return useContext(SelectedInstanceContext);
}

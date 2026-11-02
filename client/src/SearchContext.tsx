import React, { createContext, useContext, useState } from 'react';

type Search = { checkIn?: string; checkOut?: string; guests: number };
type Ctx = Search & { update: (p: Partial<Search>) => void };

const SearchContext = createContext<Ctx>(null as any);
export const useSearch = () => useContext(SearchContext);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Search>({ guests: 1 });
  return (
    <SearchContext.Provider value={{ ...s, update: (p) => setS((prev) => ({ ...prev, ...p })) }}>
      {children}
    </SearchContext.Provider>
  );
}
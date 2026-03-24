/**
 * Admin User Selector
 * ====================
 * Professionelle Benutzerauswahl für Admins um Anlagen für andere User anzulegen.
 * Stripe/Vercel Design - CSS Module basiert
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './admin.module.css';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  roleLabel: string;
  kundeId: number | null;
  kundeName: string | null;
}

interface AdminUserSelectorProps {
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
  disabled?: boolean;
}

// API: Benutzer laden
async function fetchUsers(search: string = ''): Promise<User[]> {
  const tokenKeys = ['baunity_token', 'token', 'accessToken', 'access_token'];
  let token: string | null = null;
  for (const key of tokenKeys) {
    const t = localStorage.getItem(key);
    if (t && (t.includes('.') || t.length > 20)) {
      token = t;
      break;
    }
  }

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('limit', '50');

  const url = `/api/admin/users/simple?${params}`;
  console.log('[AdminUserSelector] Fetching:', url);

  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    console.log('[AdminUserSelector] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AdminUserSelector] API Error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    console.log('[AdminUserSelector] Users loaded:', data.data?.length || 0);
    return data.data || [];
  } catch (error) {
    console.error('[AdminUserSelector] Fetch error:', error);
    return [];
  }
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Get role class
function getRoleClass(role: string): string {
  switch (role) {
    case 'ADMIN': return styles.roleAdmin;
    case 'MITARBEITER': return styles.roleMitarbeiter;
    case 'KUNDE': return styles.roleKunde;
    case 'SUBUNTERNEHMER': return styles.roleSubunternehmer;
    case 'HANDELSVERTRETER': return styles.roleHandelsvertreter;
    default: return styles.roleDefault;
  }
}

// SVG Icons
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const AdminUserSelector: React.FC<AdminUserSelectorProps> = ({
  selectedUser,
  onSelectUser,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      loadUsers('');
      setInitialLoaded(true);
    }
  }, [initialLoaded]);

  // Load users
  const loadUsers = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const result = await fetchUsers(query);
      setUsers(result);
    } catch (e) {
      console.error('[AdminUserSelector] Error loading users:', e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setHighlightedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadUsers(value);
    }, 250);
  };

  // Filter users based on search (client-side filtering zusätzlich)
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.roleLabel.toLowerCase().includes(q) ||
      (u.kundeName && u.kundeName.toLowerCase().includes(q))
    );
  }, [users, search]);

  // Select user
  const handleSelect = (user: User) => {
    console.log('[AdminUserSelector] User selected:', user.id, user.email);
    onSelectUser(user);
    setIsOpen(false);
    setSearch('');
    setHighlightedIndex(-1);
  };

  // Clear selection
  const handleClear = () => {
    onSelectUser(null);
    setSearch('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const next = prev < filteredUsers.length - 1 ? prev + 1 : prev;
          scrollToItem(next);
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const next = prev > 0 ? prev - 1 : -1;
          if (next >= 0) scrollToItem(next);
          return next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredUsers.length) {
          handleSelect(filteredUsers[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  const scrollToItem = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll(`.${styles.userItem}`);
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }
  };

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Render selected user display
  if (selectedUser && !isOpen) {
    return (
      <div ref={wrapperRef} className={styles.userSelector}>
        <label className={styles.selectorLabel}>
          <UserIcon />
          <span>Anlage erstellen für</span>
        </label>
        <div
          className={`${styles.selectedUser} ${disabled ? styles.selectedUserDisabled : ''}`}
          onClick={() => !disabled && setIsOpen(true)}
        >
          <div className={styles.selectedAvatar}>
            {getInitials(selectedUser.name)}
          </div>
          <div className={styles.selectedInfo}>
            <div className={styles.selectedName}>{selectedUser.name}</div>
            <div className={styles.selectedEmail}>{selectedUser.email}</div>
          </div>
          <span className={`${styles.roleBadge} ${getRoleClass(selectedUser.role)}`}>
            {selectedUser.roleLabel}
          </span>
          {!disabled && (
            <div className={styles.selectedActions}>
              <button
                className={styles.changeButton}
                onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
              >
                Ändern
              </button>
              <button
                className={styles.removeButton}
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                title="Auswahl aufheben"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={styles.userSelector}>
      <label className={styles.selectorLabel}>
        <UsersIcon />
        <span>Benutzer auswählen</span>
      </label>

      <div className={styles.searchWrapper}>
        <div className={styles.searchIcon}>
          <SearchIcon />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Name oder E-Mail eingeben..."
          disabled={disabled}
          autoComplete="off"
          className={styles.searchInput}
        />
        {loading ? (
          <div className={styles.spinnerWrapper}>
            <div className={styles.spinner} />
          </div>
        ) : search ? (
          <button
            className={styles.clearButton}
            onClick={() => { setSearch(''); loadUsers(''); }}
            title="Suche zurücksetzen"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>
              {search ? `Ergebnisse für "${search}"` : 'Alle Benutzer'}
            </span>
            <span className={styles.dropdownCount}>
              {filteredUsers.length}
            </span>
          </div>

          <div ref={listRef} className={styles.dropdownList}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`${styles.userItem} ${index === highlightedIndex ? styles.userItemHighlighted : ''}`}
                >
                  <div className={styles.userAvatar}>
                    {getInitials(user.name)}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userNameRow}>
                      <span className={styles.userName}>{user.name}</span>
                      <span className={`${styles.roleBadge} ${getRoleClass(user.role)}`}>
                        {user.roleLabel}
                      </span>
                    </div>
                    <div className={styles.userMeta}>
                      <span className={styles.userEmail}>{user.email}</span>
                      {user.kundeName && (
                        <span className={styles.userCompany}>{user.kundeName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <UsersIcon />
                </div>
                <div className={styles.emptyTitle}>
                  {loading ? 'Lade Benutzer...' : 'Keine Benutzer gefunden'}
                </div>
                <div className={styles.emptyDescription}>
                  {loading
                    ? 'Bitte warten...'
                    : search
                      ? `Kein Benutzer mit "${search}" gefunden`
                      : 'Es sind keine Benutzer verfügbar'
                  }
                </div>
              </div>
            )}
          </div>

          {filteredUsers.length > 0 && (
            <div className={styles.keyboardHint}>
              <span className={styles.keyboardKey}>
                <kbd>↑</kbd><kbd>↓</kbd> Navigieren
              </span>
              <span className={styles.keyboardKey}>
                <kbd>Enter</kbd> Auswählen
              </span>
              <span className={styles.keyboardKey}>
                <kbd>Esc</kbd> Schließen
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUserSelector;

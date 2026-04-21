'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  PreApprovalLetter,
  LetterTemplate,
  LoanOfficerInfo,
} from '@/types';
import { DEFAULT_TEMPLATES } from '@/lib/defaultTemplates';
import { STORAGE_KEYS, saveToStorage, loadFromStorage } from '@/lib/utils';

interface AppState {
  letters: PreApprovalLetter[];
  templates: LetterTemplate[];
  loanOfficer: LoanOfficerInfo;
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_LETTERS'; payload: PreApprovalLetter[] }
  | { type: 'ADD_LETTER'; payload: PreApprovalLetter }
  | { type: 'UPDATE_LETTER'; payload: PreApprovalLetter }
  | { type: 'DELETE_LETTER'; payload: string }
  | { type: 'SET_TEMPLATES'; payload: LetterTemplate[] }
  | { type: 'ADD_TEMPLATE'; payload: LetterTemplate }
  | { type: 'UPDATE_TEMPLATE'; payload: LetterTemplate }
  | { type: 'DELETE_TEMPLATE'; payload: string }
  | { type: 'SET_LOAN_OFFICER'; payload: LoanOfficerInfo }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'INITIALIZE'; payload: Partial<AppState> };

const defaultLoanOfficer: LoanOfficerInfo = {
  name: '',
  title: 'Loan Officer',
  nmls: '',
  phone: '',
  email: '',
  companyName: '',
  companyNmls: '',
  companyAddress: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
  },
  companyPhone: '',
};

const initialState: AppState = {
  letters: [],
  templates: DEFAULT_TEMPLATES,
  loanOfficer: defaultLoanOfficer,
  isLoading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LETTERS':
      return { ...state, letters: action.payload };

    case 'ADD_LETTER':
      return { ...state, letters: [action.payload, ...state.letters] };

    case 'UPDATE_LETTER':
      return {
        ...state,
        letters: state.letters.map((l) =>
          l.id === action.payload.id ? action.payload : l
        ),
      };

    case 'DELETE_LETTER':
      return {
        ...state,
        letters: state.letters.filter((l) => l.id !== action.payload),
      };

    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };

    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] };

    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.payload),
      };

    case 'SET_LOAN_OFFICER':
      return { ...state, loanOfficer: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'INITIALIZE':
      return { ...state, ...action.payload, isLoading: false };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addLetter: (letter: PreApprovalLetter) => void;
  updateLetter: (letter: PreApprovalLetter) => void;
  deleteLetter: (id: string) => void;
  addTemplate: (template: LetterTemplate) => void;
  updateTemplate: (template: LetterTemplate) => void;
  deleteTemplate: (id: string) => void;
  updateLoanOfficer: (info: LoanOfficerInfo) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const letters = loadFromStorage<PreApprovalLetter[]>(STORAGE_KEYS.LETTERS, []);
    const customTemplates = loadFromStorage<LetterTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    const loanOfficer = loadFromStorage<LoanOfficerInfo>(STORAGE_KEYS.LOAN_OFFICER, defaultLoanOfficer);

    // Merge custom templates with defaults
    const allTemplates = [
      ...DEFAULT_TEMPLATES,
      ...customTemplates.filter(ct => !DEFAULT_TEMPLATES.find(dt => dt.id === ct.id)),
    ];

    dispatch({
      type: 'INITIALIZE',
      payload: {
        letters,
        templates: allTemplates,
        loanOfficer,
      },
    });
  }, []);

  // Save letters to localStorage whenever they change
  useEffect(() => {
    if (!state.isLoading) {
      saveToStorage(STORAGE_KEYS.LETTERS, state.letters);
    }
  }, [state.letters, state.isLoading]);

  // Save custom templates to localStorage
  useEffect(() => {
    if (!state.isLoading) {
      const customTemplates = state.templates.filter(
        (t) => !DEFAULT_TEMPLATES.find((dt) => dt.id === t.id)
      );
      saveToStorage(STORAGE_KEYS.TEMPLATES, customTemplates);
    }
  }, [state.templates, state.isLoading]);

  // Save loan officer info to localStorage
  useEffect(() => {
    if (!state.isLoading) {
      saveToStorage(STORAGE_KEYS.LOAN_OFFICER, state.loanOfficer);
    }
  }, [state.loanOfficer, state.isLoading]);

  const addLetter = (letter: PreApprovalLetter) => {
    dispatch({ type: 'ADD_LETTER', payload: letter });
  };

  const updateLetter = (letter: PreApprovalLetter) => {
    dispatch({ type: 'UPDATE_LETTER', payload: letter });
  };

  const deleteLetter = (id: string) => {
    dispatch({ type: 'DELETE_LETTER', payload: id });
  };

  const addTemplate = (template: LetterTemplate) => {
    dispatch({ type: 'ADD_TEMPLATE', payload: template });
  };

  const updateTemplate = (template: LetterTemplate) => {
    dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
  };

  const deleteTemplate = (id: string) => {
    dispatch({ type: 'DELETE_TEMPLATE', payload: id });
  };

  const updateLoanOfficer = (info: LoanOfficerInfo) => {
    dispatch({ type: 'SET_LOAN_OFFICER', payload: info });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        addLetter,
        updateLetter,
        deleteLetter,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        updateLoanOfficer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

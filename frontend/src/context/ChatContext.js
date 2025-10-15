import React, { createContext, useContext, useReducer, useEffect } from 'react';

const ChatContext = createContext();

const initialState = {
  sessionId: null,
  messages: [],
  currentDocument: null,
  isLoading: false,
  error: null,
  feedback: [],
  sessionTitle: null,
  sessionHistory: [],
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        sessionId: action.payload,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      };
    case 'SET_CURRENT_DOCUMENT':
      return {
        ...state,
        currentDocument: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'ADD_FEEDBACK':
      return {
        ...state,
        feedback: [...state.feedback, action.payload],
      };
    case 'CLEAR_CHAT':
      return {
        ...state,
        messages: [],
        sessionId: null,
        sessionTitle: null,
      };
    case 'SET_SESSION_TITLE':
      return {
        ...state,
        sessionTitle: action.payload,
      };
    case 'LOAD_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        messages: action.payload.messages,
        sessionTitle: action.payload.title,
      };
    default:
      return state;
  }
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Generate session ID on mount
  useEffect(() => {
    if (!state.sessionId) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      dispatch({ type: 'SET_SESSION', payload: sessionId });
    }
  }, [state.sessionId]);

  const value = {
    ...state,
    dispatch,
    addMessage: (message) => dispatch({ type: 'ADD_MESSAGE', payload: message }),
    setMessages: (messages) => dispatch({ type: 'SET_MESSAGES', payload: messages }),
    setCurrentDocument: (document) => dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: document }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    addFeedback: (feedback) => dispatch({ type: 'ADD_FEEDBACK', payload: feedback }),
    clearChat: () => dispatch({ type: 'CLEAR_CHAT' }),
    setSessionTitle: (title) => dispatch({ type: 'SET_SESSION_TITLE', payload: title }),
    loadSession: (sessionData) => dispatch({ type: 'LOAD_SESSION', payload: sessionData }),
    startNewSession: () => {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      dispatch({ type: 'CLEAR_CHAT' });
      dispatch({ type: 'SET_SESSION', payload: newSessionId });
    },
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 
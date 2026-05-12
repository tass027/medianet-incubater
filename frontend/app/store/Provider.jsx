// app/Provider.jsx (ou votre fichier store/Provider)
'use client';

import { store } from './store'; // chemin vers votre store Redux
import { Provider } from 'react-redux';
import { useEffect } from 'react';

export default function Providers({ children }) {
  useEffect(() => {
    // Expose le store pour axiosAuth
    if (typeof window !== 'undefined') {
      window.__REDUX_STORE__ = store;
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
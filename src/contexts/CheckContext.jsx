import React, { createContext, useState, useEffect, useContext } from 'react';

    export const CheckContext = createContext();

    export const useChecks = () => useContext(CheckContext);

    export const CheckProvider = ({ children }) => {
      const [receivedChecks, setReceivedChecks] = useState(() => {
        const data = localStorage.getItem('receivedChecksData');
        return data ? JSON.parse(data) : [];
      });
      const [issuedChecks, setIssuedChecks] = useState(() => {
        const data = localStorage.getItem('issuedChecksData');
        return data ? JSON.parse(data) : [];
      });

      useEffect(() => {
        localStorage.setItem('receivedChecksData', JSON.stringify(receivedChecks));
      }, [receivedChecks]);

      useEffect(() => {
        localStorage.setItem('issuedChecksData', JSON.stringify(issuedChecks));
      }, [issuedChecks]);

      const addReceivedCheck = (check) => {
        setReceivedChecks(prev => [...prev, check]);
      };

      const addIssuedCheck = (check) => {
        setIssuedChecks(prev => [...prev, check]);
      };

      const updateReceivedCheck = (id, updates) => {
        setReceivedChecks(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      };
      
      const updateIssuedCheck = (id, updates) => {
        setIssuedChecks(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      };

      const deleteReceivedCheckByDocId = (docId) => {
        setReceivedChecks(prev => prev.filter(c => c.associatedDocumentId !== docId));
      };

      const deleteIssuedCheckByDocId = (docId) => {
        setIssuedChecks(prev => prev.filter(c => c.associatedDocumentId !== docId));
      };

      const value = {
        receivedChecks,
        issuedChecks,
        addReceivedCheck,
        addIssuedCheck,
        updateReceivedCheck,
        updateIssuedCheck,
        deleteReceivedCheckByDocId,
        deleteIssuedCheckByDocId,
      };

      return (
        <CheckContext.Provider value={value}>
          {children}
        </CheckContext.Provider>
      );
    };
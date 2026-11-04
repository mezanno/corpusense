import { useCallback, useState } from 'react';

type LogType = 'info' | 'error' | 'warning' | 'success';

export type ProgressLoggerSetters = {
  setStatus: (status: 'idle' | 'processing' | 'done' | 'error') => void;
  setProgress: (progress: number) => void;
  addLog: (msg: string, type?: LogType) => void;
};

export type LoggerMessage = {
  timestamp: string;
  message: string;
  type: LogType;
};

const useProgressLogger = () => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<LoggerMessage[]>([]);

  const addLog = useCallback((msg: string, type?: LogType) => {
    const finalType: LogType = type ?? 'info';

    setLogs((prev) => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), message: msg, type: finalType },
    ]);
  }, []);

  return {
    status,
    setStatus,
    progress,
    setProgress,
    logs,
    addLog,
  };
};

export default useProgressLogger;

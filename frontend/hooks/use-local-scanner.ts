'use client';

import { useState, useCallback } from 'react';
import { ScannerDevice } from '@/types/scan';

const BRIDGE_URL = 'http://127.0.0.1:18000';

export function useLocalScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [devices, setDevices] = useState<ScannerDevice[]>([]);

  const checkBridge = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch(`${BRIDGE_URL}/devices`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
        setBridgeStatus('connected');
      } else {
        setBridgeStatus('disconnected');
      }
    } catch (err) {
      setBridgeStatus('disconnected');
    }
  }, []);

  const scanPage = useCallback(async (dpi: number, colorMode: string, deviceId?: string): Promise<string | null> => {
    setIsScanning(true);
    try {
      const body: Record<string, unknown> = { dpi, color_mode: colorMode.toLowerCase() };
      if (deviceId) body.device_id = deviceId;

      const res = await fetch(`${BRIDGE_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Scan failed' }));
        throw new Error(err.detail || 'Scan failed');
      }
      const data = await res.json();
      return data.base64_data || null;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  return { isScanning, bridgeStatus, devices, checkBridge, scanPage };
}

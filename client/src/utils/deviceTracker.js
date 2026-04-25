// src/utils/deviceTracker.js
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

export const getAnonymousDeviceId = () => {
  let deviceId = localStorage.getItem('ventify_device_id');
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('ventify_device_id', deviceId);
  }
  return deviceId;
};
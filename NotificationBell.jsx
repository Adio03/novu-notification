import React from 'react';
import { NotificationCenter } from '@novu/notification-center';

const NotificationBell = ({ position = 'top-right', theme = 'light' }) => {
  return (
    <NotificationCenter
      position={position}
      theme={theme}
      showUserPreferences={true}
      allowedNotificationActions={['archive', 'read', 'unread', 'delete']}
    />
  );
};

export default NotificationBell;

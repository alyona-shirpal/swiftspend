import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, HeaderIconButton } from '../layout/AppLayout';

export const ReportLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  return (
    <AppLayout
      title="Report"
      backTo="/"
      actions={
        <>
          <HeaderIconButton
            icon="paid"
            label="Analytics"
            onClick={() => navigate('/analytics')}
          />
          <HeaderIconButton
            icon="settings"
            label="Settings"
            onClick={() => navigate('/settings')}
          />
        </>
      }
      width="md"
    >
      {children}
    </AppLayout>
  );
};

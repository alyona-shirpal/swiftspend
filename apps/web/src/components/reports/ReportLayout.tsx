import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';
import {
  AppLayout,
  HeaderCurrencyToggle,
  HeaderIconButton,
} from '../layout/AppLayout';
import { ReportPeriodNav, ReportTab } from './ReportPeriodNav';

interface ReportLayoutProps {
  title?: React.ReactNode;
  activeTab?: ReportTab;
  currencyOptions?: Currency[] | string[];
  selectedCurrency?: Currency | string;
  onCurrencyChange?: (currency: Currency) => void;
  actions?: React.ReactNode;
  width?: 'md' | 'xl' | '2xl' | '3xl' | 'full';
  mainClassName?: string;
  children: React.ReactNode;
}

export const ReportLayout: React.FC<ReportLayoutProps> = ({
  title = 'Reports',
  activeTab,
  currencyOptions,
  selectedCurrency,
  onCurrencyChange,
  actions,
  width = '2xl',
  mainClassName = 'space-y-6',
  children,
}) => {
  const navigate = useNavigate();

  const headerActions = (
    <>
      {currencyOptions && selectedCurrency && onCurrencyChange && (
        <HeaderCurrencyToggle
          options={currencyOptions as string[]}
          value={selectedCurrency as string}
          onChange={(currency) => onCurrencyChange(currency as Currency)}
        />
      )}
      {actions}
      <HeaderIconButton
        icon="settings"
        label="Settings"
        onClick={() => navigate('/settings')}
      />
    </>
  );

  return (
    <AppLayout
      title={title}
      backTo="/"
      actions={headerActions}
      width={width}
      mainClassName={mainClassName}
    >
      {activeTab && <ReportPeriodNav activePeriod={activeTab} />}
      {children}
    </AppLayout>
  );
};

'use client';

import { useState } from 'react';

export default function Tabs({ 
  tabs = [], // [{ id: 'tab1', label: 'Tab 1', content: <div /> }]
  defaultTab,
  variant = 'underline', // underline, pills, buttons
  onChange,
  className = ''
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const variants = {
    underline: {
      container: 'border-b border-gray-200',
      tab: (isActive) => `
        px-4 py-2 text-sm font-medium transition-colors
        ${isActive 
          ? 'border-b-2 border-primary-500 text-primary-600' 
          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `,
    },
    pills: {
      container: 'flex gap-2 p-1 bg-gray-100 rounded-lg',
      tab: (isActive) => `
        px-4 py-2 text-sm font-medium rounded-md transition-all
        ${isActive 
          ? 'bg-white shadow-sm text-primary-600' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `,
    },
    buttons: {
      container: 'flex gap-2',
      tab: (isActive) => `
        px-4 py-2 text-sm font-medium rounded-lg border transition-all
        ${isActive 
          ? 'bg-primary-500 text-white border-primary-500 hover:bg-primary-600' 
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }
      `,
    },
  };

  const currentVariant = variants[variant];

  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className={currentVariant.container}>
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={currentVariant.tab(activeTab === tab.id)}
              disabled={tab.disabled}
            >
              <div className="flex items-center gap-2">
                {tab.icon && <span className="text-lg">{tab.icon}</span>}
                {tab.label}
                {tab.badge && (
                  <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
'use client';

import { Tab } from '@headlessui/react';
import ClientUsersPanel from '@shared/components/settings/ClientUsersPanel';
import CompanyDataPanel from '@shared/components/settings/CompanyDataPanel';
import UserProfilePanel from '@shared/components/settings/UserProfilePanel';
import { Building2, UserCircle, Users } from 'lucide-react';

type TabDef = {
  name: string;
  icon: React.ElementType;
  component: React.ComponentType<any>;
};

const TABS: TabDef[] = [
  { name: 'Cliente', icon: Users, component: ClientUsersPanel },
  { name: 'Usuario', icon: UserCircle, component: UserProfilePanel },
  { name: 'Datos Cliente', icon: Building2, component: CompanyDataPanel },
];

export default function ClientSettingsTabView() {
  return (
    <Tab.Group>
      <Tab.List className="mt-2 flex space-x-1 rounded-xl bg-blue-50 p-1">
        {TABS.map(tab => (
          <Tab
            key={tab.name}
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${selected ? 'bg-white text-blue-700 shadow' : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-600'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </div>
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-6">
        {TABS.map((tab, idx) => (
          <Tab.Panel key={idx} className="ring-opacity-5 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black">
            <tab.component />
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}

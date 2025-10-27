import { Tab } from '@headlessui/react';
import { Building2, UserCircle, Users } from 'lucide-react';
import ClientUsersPanel from '@shared/components/settings/ClientUsersPanel';
import UserProfilePanel from '@shared/components/settings/UserProfilePanel';
import CompanyDataPanel from '@shared/components/settings/CompanyDataPanel';
import PageHeader from '@shared/components/common/PageHeader';

export default function ClientConfigPage() {
  const tabs = [
    { name: 'Cliente', icon: Users, component: ClientUsersPanel },
    { name: 'Usuario', icon: UserCircle, component: UserProfilePanel },
    { name: 'Datos Empresa', icon: Building2, component: CompanyDataPanel },
  ];

  return (
    <div className="px-6 py-8 lg:px-8">
      <PageHeader title="Configuración" description="Gestiona la configuración de tu cuenta y empresa" />
      <Tab.Group>
        <Tab.List className="mt-2 flex space-x-1 rounded-xl bg-blue-50 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${selected ? 'bg-white text-blue-700 shadow' : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-600'}`
              }
            >
              <div className="flex items-center justify-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </div>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-6">
          {tabs.map((tab, idx) => (
            <Tab.Panel key={idx} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black ring-opacity-5">
              <tab.component />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}


import ConfigurationAPITab from '@/components/features/configuration/ConfigurationAPITab';
import ConfigurationGeneralTab from '@/components/features/configuration/ConfigurationGeneralTab';
import ConfigurationLLMTab from '@/components/features/configuration/ConfigurationLLMTab';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';

const ConfigurationPage = () => {
  const { t } = useTranslation();

  return (
    <section className='panel h-full flex-col'>
      <ScrollArea className='h-full'>
        <div className='pr-4'>
          <h1 className='text-xl'>{t('page_title_configuration')}</h1>
          <Tabs defaultValue='general' className='mt-4'>
            <TabsList>
              <TabsTrigger value='general'>{t('tab_configuration_general')}</TabsTrigger>
              <TabsTrigger value='api'>{t('tab_configuration_api')}</TabsTrigger>
              <TabsTrigger value='ai'>{t('tab_configuration_llm')}</TabsTrigger>
            </TabsList>
            <TabsContent value='general'>
              <ConfigurationGeneralTab />
            </TabsContent>
            <TabsContent value='api'>
              <ConfigurationAPITab />
            </TabsContent>
            <TabsContent value='ai'>
              <ConfigurationLLMTab />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </section>
  );
};

export default ConfigurationPage;

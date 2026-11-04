import LocalStorageDashboard from '@/components/features/storage/LocalStorageDashboard';

const StoragePage = () => {
  return (
    <div className='panel h-full w-full flex-col space-y-2'>
      <LocalStorageDashboard />
    </div>
  );
};

export default StoragePage;

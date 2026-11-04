import Welcome from '@/components/common/Welcome';

const Home = () => {
  return (
    <div className='flex h-full w-full items-center justify-center'>
      <div className='h-full w-full xl:w-2/3'>
        <Welcome />
      </div>
    </div>
  );
};

export default Home;

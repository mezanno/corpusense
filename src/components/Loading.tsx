import { Spinner } from './ui/spinner';

const Loading = () => {
  return (
    <div className='flex h-full w-full items-center justify-center'>
      <Spinner size={'large'} />
    </div>
  );
};

export default Loading;

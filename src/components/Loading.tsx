import { Spinner } from './ui/spinner';

const Loading = () => {
  return (
    <div
      className='flex h-full w-full items-center justify-center'
      aria-busy='true'
      aria-live='polite'
      role='status'
    >
      <Spinner size={'large'} />
      <span className='sr-only'>Loading data...</span>
    </div>
  );
};

export default Loading;

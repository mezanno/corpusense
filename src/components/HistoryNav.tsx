import { History } from '@/data/models/history';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { fetchManifestFromUrlRequest } from '@/state/reducers/manifests';
import { getHistory } from '@/state/selectors/manifests';
import { useCallback, useMemo } from 'react';

const HistoryNav = () => {
  const history: History[] = useAppSelector(getHistory);
  const dispatch = useAppDispatch();

  const handleHistoryClick = useCallback(
    (url: string) => dispatch(fetchManifestFromUrlRequest(url)),
    [dispatch],
  );

  const historyItems = useMemo(
    () =>
      history.map((item) => (
        <div
          key={item.url}
          onClick={() => handleHistoryClick(item.url)}
          className='text-wrapping cursor-pointer p-2 break-words'
        >
          {item.url}
        </div>
      )),
    [history, handleHistoryClick],
  );

  return historyItems;
};

export default HistoryNav;

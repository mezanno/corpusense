import { clearNavigation } from '@/state/reducers/navigation';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks';

const NavigationHandler = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const redirectTo = useAppSelector((state) => state.navigation.redirectTo);

  useEffect(() => {
    if (redirectTo !== null) {
      void navigate(redirectTo);
      dispatch(clearNavigation());
    }
  }, [redirectTo]);

  return null;
};

export default NavigationHandler;

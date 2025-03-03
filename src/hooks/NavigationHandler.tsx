import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks';

const NavigationHandler = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const redirectTo = useAppSelector((state) => state.navigation.redirectTo);

  useEffect(() => {
    void navigate(redirectTo);
  }, [redirectTo]);

  return null;
};

export default NavigationHandler;

import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  loginDemo as loginDemoThunk,
  logout as logoutThunk,
  selectAuthError,
  selectAuthStatus,
  selectIsAuthenticated,
  selectUser,
} from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const logout = useCallback(() => dispatch(logoutThunk()), [dispatch]);
  const loginDemo = useCallback((roleKey) => dispatch(loginDemoThunk(roleKey)), [dispatch]);

  return { user, status, error, isAuthenticated, logout, loginDemo };
};

export default useAuth;

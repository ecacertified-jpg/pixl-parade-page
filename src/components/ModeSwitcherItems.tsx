import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Store, User } from 'lucide-react';
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export const ModeSwitcherItems = () => {
  const { userMode, setUserMode } = useAuth();
  const navigate = useNavigate();

  const handleModeChange = (mode: 'client' | 'business') => {
    console.log('ModeSwitcherItems - Changing mode to:', mode);
    setUserMode(mode);
    navigate(mode === 'business' ? '/business-account' : '/dashboard');
  };

  return (
    <>
      <DropdownMenuLabel>Changer de mode</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        onClick={() => handleModeChange('client')}
        className="cursor-pointer"
      >
        <User className="mr-2 h-4 w-4" />
        Mode Client
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={() => handleModeChange('business')}
        className="cursor-pointer"
      >
        <Store className="mr-2 h-4 w-4" />
        Mode Business
      </DropdownMenuItem>
    </>
  );
};

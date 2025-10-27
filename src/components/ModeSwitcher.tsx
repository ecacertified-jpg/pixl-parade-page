import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Store, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ModeSwitcherProps {
  variant?: 'default' | 'menu-item';
}

export const ModeSwitcher = ({ variant = 'default' }: ModeSwitcherProps) => {
  const { userMode, setUserMode } = useAuth();
  const navigate = useNavigate();

  const handleModeChange = (mode: 'client' | 'business') => {
    console.log('ModeSwitcher - Changing mode to:', mode);
    setUserMode(mode);
    navigate(mode === 'business' ? '/business-account' : '/dashboard');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant === 'menu-item' ? 'ghost' : 'outline'}
          size="sm" 
          className={variant === 'menu-item' ? 'w-full justify-start gap-2 h-10 px-2' : 'gap-2'}
        >
          {userMode === 'business' ? (
            <>
              <Store className="h-4 w-4" />
              Mode Business
            </>
          ) : (
            <>
              <User className="h-4 w-4" />
              Mode Client
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] z-[110]">
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

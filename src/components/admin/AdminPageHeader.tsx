import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountryFilterIndicator } from '@/components/admin/CountryFilterIndicator';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAdminCountry } from '@/contexts/AdminCountryContext';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  backPath?: string;
  showCountryIndicator?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  showBackButton = true,
  backPath = '/admin',
  showCountryIndicator = true,
  actions,
  className
}: AdminPageHeaderProps) {
  const navigate = useNavigate();
  const { selectedCountry } = useAdminCountry();

  return (
    <motion.div 
      className={cn("flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4", className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-3 min-w-0">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(backPath)}
            className="mt-0.5 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
            {title}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
            {showCountryIndicator && (
              <motion.div
                key={selectedCountry || 'all'}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <CountryFilterIndicator className="text-xs" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {actions && (
        <div className="flex gap-2 self-start sm:self-auto flex-shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
}

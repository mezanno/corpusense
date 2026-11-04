import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

type ExpertReportCardProps = {
  value: number;
  label: string;
  route: string;
  icon?: React.ReactNode;
};

const ExpertReportCard = ({ value, label, route, icon }: ExpertReportCardProps) => {
  return (
    <Card className='w-fit min-w-40 text-primary shadow-sm'>
      <CardContent className='flex flex-col items-center gap-2 p-6'>
        <Link to={route}>{icon}</Link>
        <span className='text-5xl leading-none font-black text-primary'>{value}</span>
        <Separator />
        <span className='text-center text-sm text-primary'>{label}</span>
      </CardContent>
    </Card>
  );
};

export default ExpertReportCard;

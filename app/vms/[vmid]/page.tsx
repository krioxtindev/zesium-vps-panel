import ServerDetail from '@/components/server-detail';

type Props = {
  params: {
    vmid: string;
  };
};

export default function VmPage({ params }: Props) {
  return <ServerDetail params={params} />;
}

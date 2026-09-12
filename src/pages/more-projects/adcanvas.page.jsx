import RepositoryCase from '@src/components/archive/RepositoryCase';
import repositoryStudies from '@src/constants/repositoryStudies';

export default function Page() {
  return <RepositoryCase study={repositoryStudies.adcanvas} />;
}

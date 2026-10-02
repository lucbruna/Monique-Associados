import ConstituicaoFederalViewer from '../../components/legal/ConstituicaoFederalViewer';

export default function ConstituicaoFederal() {
  // Ver VadeMecum.tsx: altura herdada do <main> do Layout, sem calc() fixo.
  return (
    <div className="h-full min-h-0">
      <ConstituicaoFederalViewer />
    </div>
  );
}

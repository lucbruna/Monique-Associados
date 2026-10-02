import VadeMecumViewer from '../../components/legal/VadeMecumViewer';

export default function VadeMecum() {
  // h-full em vez de h-[calc(100vh-10rem)]: o offset fixo quebrava em telas de
  // notebook (header e footer têm altura variável), fazendo a página rolar
  // inteira em vez de rolar só o painel de artigos. A altura vem do <main> do
  // Layout, que já reserva o espaço de header/footer.
  return (
    <div className="h-full min-h-0">
      <VadeMecumViewer />
    </div>
  );
}

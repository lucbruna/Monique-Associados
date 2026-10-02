import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados - ⚖️ Monique Advogados...\n');

  // Limpar dados existentes (cuidado em produção!)
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.note.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.document.deleteMany();
  await prisma.hearing.deleteMany();
  await prisma.deadline.deleteMany();
  await prisma.party.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.case.deleteMany();
  await prisma.client.deleteMany();
  await prisma.template.deleteMany();
  await prisma.user.deleteMany();

  // Criar senha padrão
  const hashedPassword = await bcrypt.hash('senha123', 12);

  // ============================================
  // 20 USUÁRIOS - ⚖️ MONIQUE ADVOGADOS
  // ============================================

  const socio1 = await prisma.user.create({
    data: {
      name: 'Dra. Monique Tomé',
      email: 'monique@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '111.222.333-44',
      oab: 'SP123456',
      phone: '(11) 99999-0001',
      role: 'SUPER_ADMIN',
    },
  });

  const socio2 = await prisma.user.create({
    data: {
      name: 'Dr. Ricardo Mendes',
      email: 'ricardo@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '222.333.444-55',
      oab: 'SP234567',
      phone: '(11) 99999-0002',
      role: 'SOCIO',
    },
  });

  const advogado1 = await prisma.user.create({
    data: {
      name: 'Dra. Ana Carolina Silva',
      email: 'ana.silva@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '333.444.555-66',
      oab: 'SP345678',
      phone: '(11) 99999-0003',
      role: 'ADVOGADO',
    },
  });

  const advogado2 = await prisma.user.create({
    data: {
      name: 'Dr. Fernando Oliveira',
      email: 'fernando@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '444.555.666-77',
      oab: 'SP456789',
      phone: '(11) 99999-0004',
      role: 'ADVOGADO',
    },
  });

  const advogado3 = await prisma.user.create({
    data: {
      name: 'Dra. Beatriz Santos',
      email: 'beatriz@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '555.666.777-88',
      oab: 'SP567890',
      phone: '(11) 99999-0005',
      role: 'ADVOGADO',
    },
  });

  const assistente1 = await prisma.user.create({
    data: {
      name: 'Camila Rodrigues',
      email: 'camila@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '666.777.888-99',
      phone: '(11) 99999-0006',
      role: 'ASSISTENTE',
    },
  });

  const estagiario1 = await prisma.user.create({
    data: {
      name: 'Lucas Ferreira',
      email: 'lucas@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '777.888.999-00',
      phone: '(11) 99999-0007',
      role: 'ESTAGIARIO',
    },
  });

  const secretario = await prisma.user.create({
    data: {
      name: 'Patricia Gomes',
      email: 'patricia@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '888.999.000-11',
      phone: '(11) 99999-0008',
      role: 'SECRETARIO',
    },
  });

  const financeiro = await prisma.user.create({
    data: {
      name: 'Roberto Almeida',
      email: 'roberto@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '999.000.111-22',
      phone: '(11) 99999-0009',
      role: 'FINANCEIRO',
    },
  });

  const rh = await prisma.user.create({
    data: {
      name: 'Juliana Costa',
      email: 'juliana@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '000.111.222-33',
      phone: '(11) 99999-0010',
      role: 'RH',
    },
  });

  const ti = await prisma.user.create({
    data: {
      name: 'Marcos Pereira',
      email: 'marcos@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '111.222.333-55',
      phone: '(11) 99999-0011',
      role: 'TI',
    },
  });

  const recepcionista = await prisma.user.create({
    data: {
      name: 'Isabela Martins',
      email: 'isabela@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '222.333.444-66',
      phone: '(11) 99999-0012',
      role: 'RECEPCIONISTA',
    },
  });

  const correspondente = await prisma.user.create({
    data: {
      name: 'Dr. Paulo Ribeiro',
      email: 'paulo@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '333.444.555-77',
      oab: 'RJ123456',
      phone: '(21) 99999-0013',
      role: 'CORRESPONDENTE',
    },
  });

  const paralegal = await prisma.user.create({
    data: {
      name: 'Amanda Dias',
      email: 'amanda@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '444.555.666-88',
      phone: '(11) 99999-0014',
      role: 'PARALEGAL',
    },
  });

  const analista = await prisma.user.create({
    data: {
      name: 'Thiago Santos',
      email: 'thiago@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '555.666.777-99',
      phone: '(11) 99999-0015',
      role: 'ANALISTA',
    },
  });

  const coordenador = await prisma.user.create({
    data: {
      name: 'Fernanda Lima',
      email: 'fernanda@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '666.777.888-00',
      phone: '(11) 99999-0016',
      role: 'COORDENADOR',
    },
  });

  const diretor = await prisma.user.create({
    data: {
      name: 'Carlos Eduardo Souza',
      email: 'carlos@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '777.888.999-11',
      phone: '(11) 99999-0017',
      role: 'DIRETOR',
    },
  });

  const gerente = await prisma.user.create({
    data: {
      name: 'Adriana Rocha',
      email: 'adriana@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '888.999.000-22',
      phone: '(11) 99999-0018',
      role: 'GERENTE',
    },
  });

  const administrativo = await prisma.user.create({
    data: {
      name: 'Vanessa Castro',
      email: 'vanessa@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '999.000.111-33',
      phone: '(11) 99999-0019',
      role: 'ADMINISTRATIVO',
    },
  });

  const marketing = await prisma.user.create({
    data: {
      name: 'Rafael Moura',
      email: 'rafael@moniqueadvogados.com',
      password: hashedPassword,
      cpf: '000.111.222-44',
      phone: '(11) 99999-0020',
      role: 'MARKETING',
    },
  });

  console.log('✅ 20 Usuários criados com sucesso!');

  // ============================================
  // CLIENTES DE TESTE
  // ============================================

  const cliente1 = await prisma.client.create({
    data: {
      name: 'João da Silva',
      email: 'joao.silva@email.com',
      phone: '(11) 91234-5678',
      cpfCnpj: '123.456.789-00',
      type: 'PESSOA_FISICA',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
    },
  });

  const cliente2 = await prisma.client.create({
    data: {
      name: 'Empresa ABC Ltda',
      email: 'contato@abc.com.br',
      phone: '(11) 3456-7890',
      cpfCnpj: '12.345.678/0001-90',
      type: 'PESSOA_JURIDICA',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
    },
  });

  const cliente3 = await prisma.client.create({
    data: {
      name: 'Maria Oliveira Santos',
      email: 'maria.oliveira@email.com',
      phone: '(11) 98765-4321',
      cpfCnpj: '987.654.321-00',
      type: 'PESSOA_FISICA',
      address: 'Rua Augusta, 500',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-100',
    },
  });

  console.log('✅ 3 Clientes criados');

  // ============================================
  // PROCESSOS DE TESTE
  // ============================================

  const case1 = await prisma.case.create({
    data: {
      caseNumber: '1234567-89.2026.8.26.0100',
      title: 'Ação Trabalhista - Horas Extras',
      description: 'Reclamação trabalhista referente a horas extras não pagas pelo empregador.',
      type: 'TRABALHISTA',
      status: 'ATIVO',
      court: '1ª Vara do Trabalho de São Paulo',
      jurisdiction: 'São Paulo - SP',
      judge: 'Dr. José Antonio',
      value: 50000.00,
      clientId: cliente1.id,
      responsibleId: advogado1.id,
    },
  });

  const case2 = await prisma.case.create({
    data: {
      caseNumber: '9876543-21.2026.8.26.0100',
      title: 'Ação Civil - Cobrança',
      description: 'Ação de cobrança de valores referentes a contrato de prestação de serviços.',
      type: 'CIVIL',
      status: 'ATIVO',
      court: '5ª Vara Cível Central',
      jurisdiction: 'São Paulo - SP',
      judge: 'Dra. Ana Paula',
      value: 100000.00,
      clientId: cliente2.id,
      responsibleId: socio1.id,
    },
  });

  const case3 = await prisma.case.create({
    data: {
      caseNumber: '1122334-55.2026.8.26.0100',
      title: 'Divórcio Consensual',
      description: 'Processo de divórcio consensual com partilha de bens.',
      type: 'FAMILIA',
      status: 'ATIVO',
      court: '3ª Vara de Família',
      jurisdiction: 'São Paulo - SP',
      judge: 'Dra. Carmen Silvia',
      value: 15000.00,
      clientId: cliente3.id,
      responsibleId: advogado2.id,
    },
  });

  console.log('✅ 3 Processos criados');

  // ============================================
  // PRAZOS
  // ============================================

  await prisma.deadline.create({
    data: {
      title: 'Apresentar Recurso Ordinário',
      description: 'Recurso Ordinário contra sentença desfavorável',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      priority: 'ALTA',
      caseId: case1.id,
    },
  });

  await prisma.deadline.create({
    data: {
      title: 'Contestação da Ação',
      description: 'Apresentar contestação da ação de cobrança',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      priority: 'URGENTE',
      caseId: case2.id,
    },
  });

  await prisma.deadline.create({
    data: {
      title: 'Juntada de Documentos',
      description: 'Juntar documentos complementares ao processo',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'MEDIA',
      caseId: case3.id,
    },
  });

  console.log('✅ 3 Prazos criados');

  // ============================================
  // AUDIÊNCIAS
  // ============================================

  await prisma.hearing.create({
    data: {
      title: 'Audiência de Conciliação',
      description: 'Primeira audiência - tentativa de acordo',
      date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      location: '1ª Vara do Trabalho - Sala 3',
      type: 'INICIAL',
      status: 'AGENDADA',
      caseId: case1.id,
    },
  });

  await prisma.hearing.create({
    data: {
      title: 'Audiência de Instrução',
      description: 'Oitiva de testemunhas',
      date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      location: '5ª Vara Cível - Sala 5',
      type: 'INSTRUÇÃO',
      status: 'AGENDADA',
      caseId: case2.id,
    },
  });

  console.log('✅ 2 Audiências criadas');

  // ============================================
  // HONORÁRIOS
  // ============================================

  await prisma.fee.create({
    data: {
      description: 'Honorários Contratuais - Entrada',
      amount: 5000.00,
      dueDate: new Date(),
      status: 'PAGO',
      type: 'HONORARIO',
      caseId: case1.id,
    },
  });

  await prisma.fee.create({
    data: {
      description: 'Honorários Contratuais - Parcela 1',
      amount: 10000.00,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'PENDENTE',
      type: 'HONORARIO',
      caseId: case2.id,
    },
  });

  await prisma.fee.create({
    data: {
      description: 'Custas Processuais',
      amount: 2500.00,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'PENDENTE',
      type: 'CUSTAS',
      caseId: case3.id,
    },
  });

  console.log('✅ 3 Honorários criados');

  // ============================================
  // CONTRATOS
  // ============================================

  await prisma.contract.create({
    data: {
      title: 'Contrato de Prestação de Serviços Jurídicos',
      description: 'Contrato para representação em processo trabalhista',
      value: 15000.00,
      startDate: new Date(),
      status: 'ATIVO',
      clientId: cliente1.id,
    },
  });

  await prisma.contract.create({
    data: {
      title: 'Contrato de Assessoria Jurídica',
      description: 'Assessoria jurídica mensal para empresa',
      value: 5000.00,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'ATIVO',
      clientId: cliente2.id,
    },
  });

  console.log('✅ 2 Contratos criados');

  // ============================================
  // TEMPLATES
  // ============================================

  await prisma.template.create({
    data: {
      name: 'Petição Inicial - Ação Trabalhista',
      description: 'Template padrão para petição inicial em ações trabalhistas',
      content: `
EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DO TRABALHO DA {VARA} DE {CIDADE}

{NOME_CLIENTE}, {QUALIFICACAO}, vem, respeitosamente, à presença de Vossa Excelência, por meio de seus advogados que esta subscrevem, propor

RECLAMAÇÃO TRABALHISTA

em face de {NOME_RECLAMADO}, {QUALIFICACAO_RECLAMADO}, pelos fatos e fundamentos jurídicos a seguir expostos:

I - DOS FATOS
{DESCRICAO_FATOS}

II - DO DIREITO
{FUNDAMENTACAO_JURIDICA}

III - DOS PEDIDOS
...
      `,
      category: 'PETICAO',
      variables: JSON.stringify(['VARA', 'CIDADE', 'NOME_CLIENTE', 'QUALIFICACAO', 'NOME_RECLAMADO', 'QUALIFICACAO_RECLAMADO', 'DESCRICAO_FATOS', 'FUNDAMENTACAO_JURIDICA']),
    },
  });

  await prisma.template.create({
    data: {
      name: 'Procuração',
      description: 'Template de procuração ad judicia',
      content: `
PROCURAÇÃO

OUTORGANTE: {NOME_CLIENTE}, {NACIONALIDADE}, {ESTADO_CIVIL}, {PROFISSAO}, portador(a) do RG nº {RG} e CPF nº {CPF}, residente e domiciliado(a) em {ENDERECO}

OUTORGADO: {NOME_ADVOGADO}, {NACIONALIDADE}, {ESTADO_CIVIL}, advogado(a), inscrito(a) na OAB/{UF} sob o nº {OAB}

PODERES: Para o foro em geral, com poderes especiais para receber e dar quitação, transigir, desistir, firmar compromisso, confessar, reconhecer a procedência do pedido, receber e dar quitação, substabelecer, tudo quanto necessário for ao bom desempenho do mandato.

{CIDADE}, {DATA}

_________________________
{NOME_CLIENTE}
      `,
      category: 'PROCURACAO',
      variables: JSON.stringify(['NOME_CLIENTE', 'NACIONALIDADE', 'ESTADO_CIVIL', 'PROFISSAO', 'RG', 'CPF', 'ENDERECO', 'NOME_ADVOGADO', 'UF', 'OAB', 'CIDADE', 'DATA']),
    },
  });

  console.log('✅ 2 Templates criados');

  // ============================================
  // RESUMO FINAL
  // ============================================

  console.log('\n' + '═'.repeat(50));
  console.log('⚖️  MONIQUE ADVOGADOS - Seed Concluído!  ⚖️');
  console.log('═'.repeat(50));
  console.log('\n📋 CREDENCIAIS DE ACESSO (senha: senha123):');
  console.log('─'.repeat(50));
  console.log('\n👑 SUPER ADMIN (Acesso Total):');
  console.log('   • monique@moniqueadvogados.com');
  console.log('   • ricardo@moniqueadvogados.com');
  console.log('\n👨‍⚖️ ADVOGADOS:');
  console.log('   • ana.silva@moniqueadvogados.com');
  console.log('   • fernando@moniqueadvogados.com');
  console.log('   • beatriz@moniqueadvogados.com');
  console.log('\n👩‍💼 ASSISTENTE:');
  console.log('   • camila@moniqueadvogados.com');
  console.log('\n👨‍🎓 ESTAGIÁRIO:');
  console.log('   • lucas@moniqueadvogados.com');
  console.log('\n📋 SECRETÁRIO:');
  console.log('   • patricia@moniqueadvogados.com');
  console.log('\n💰 FINANCEIRO:');
  console.log('   • roberto@moniqueadvogados.com');
  console.log('\n👥 RH:');
  console.log('   • juliana@moniqueadvogados.com');
  console.log('\n💻 TI:');
  console.log('   • marcos@moniqueadvogados.com');
  console.log('\n📞 RECEPCIONISTA:');
  console.log('   • isabela@moniqueadvogados.com');
  console.log('\n🌍 CORRESPONDENTE:');
  console.log('   • paulo@moniqueadvogados.com');
  console.log('\n📚 PARALEGAL:');
  console.log('   • amanda@moniqueadvogados.com');
  console.log('\n📊 ANALISTA:');
  console.log('   • thiago@moniqueadvogados.com');
  console.log('\n🎯 COORDENADOR:');
  console.log('   • fernanda@moniqueadvogados.com');
  console.log('\n👔 DIRETOR:');
  console.log('   • carlos@moniqueadvogados.com');
  console.log('\n📈 GERENTE:');
  console.log('   • adriana@moniqueadvogados.com');
  console.log('\n📎 ADMINISTRATIVO:');
  console.log('   • vanessa@moniqueadvogados.com');
  console.log('\n📢 MARKETING:');
  console.log('   • rafael@moniqueadvogados.com');
  console.log('\n' + '═'.repeat(50));
  console.log('📁 Dados: 3 Clientes, 3 Processos, 3 Prazos,');
  console.log('          2 Audiências, 3 Honorários, 2 Contratos');
  console.log('═'.repeat(50) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

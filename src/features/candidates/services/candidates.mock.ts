import type { CandidateDetail, CandidateListItem } from '../types/candidate.types';

const names = [
  'María López',
  'Juan Pérez',
  'Carlos Hernández',
  'Ana Sofía Torres',
  'Roberto Gómez',
  'Fernanda Castro',
  'Luis Ramírez',
  'Daniela Mendoza',
  'Jorge Salinas',
  'Paola Jiménez',
  'Miguel Ángel Ruiz',
  'Valeria Ortega',
];

const positions = [
  'Analista de Sistemas',
  'Ejecutivo de Ventas',
  'Auxiliar Contable',
  'Operador de Producción',
  'Coordinador de Logística',
  'Recepcionista',
];

const statuses: CandidateListItem['status'][] = ['pending', 'in_process', 'review', 'completed'];

function buildMockList(): CandidateListItem[] {
  return names.map((fullName, index) => {
    const status = statuses[index % statuses.length];
    const progressByStatus: Record<CandidateListItem['status'], number> = {
      pending: 10,
      in_process: 55,
      review: 90,
      completed: 100,
    };

    return {
      id: `cand_${index + 1}`,
      fullName,
      positionApplied: positions[index % positions.length],
      email: `${fullName.split(' ')[0].toLowerCase()}.${fullName.split(' ')[1].toLowerCase()}@correo.com`,
      phone: `55 ${1000 + index * 37} ${2000 + index * 13}`,
      status,
      progress: progressByStatus[status],
      createdAt: new Date(Date.now() - index * 1000 * 60 * 60 * 26).toISOString(),
    };
  });
}

const mockList = buildMockList();

/**
 * Datos simulados del módulo de Candidatos.
 * Mismo contrato que tendrán `GET /candidates` y `GET /candidates/:id`.
 */
export const candidatesMock = {
  async getList(): Promise<CandidateListItem[]> {
    return mockList;
  },

  async getById(id: string): Promise<CandidateDetail | null> {
    const base = mockList.find((c) => c.id === id);
    if (!base) return null;

    return {
      ...base,
      generalInfo: {
        fullName: base.fullName,
        positionApplied: base.positionApplied,
        address: 'Av. Insurgentes Sur 1234',
        neighborhood: 'Del Valle',
        postalCode: '03100',
        phone: base.phone,
        email: base.email,
        birthDate: '1994-05-12',
        birthPlace: 'Ciudad de México',
        civilStatus: 'Soltero(a)',
      },
    };
  },
};

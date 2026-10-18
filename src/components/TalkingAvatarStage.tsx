import React, { useEffect, useRef, useState } from 'react';

export type AvatarCategory =
  | 'Literatura & Ficción'
  | 'Documental & Ciencia'
  | 'Negocios & Liderazgo'
  | 'Historia & Crónica'
  | 'Bienestar & Filosofía'
  | 'Tecnología & Futuro';

export type AvatarHairStyle =
  | 'long-wave'
  | 'short-part'
  | 'bob-classic'
  | 'beard-exec'
  | 'curly-volume'
  | 'slick-back'
  | 'updo-bun'
  | 'silver-distinguished';

export interface NarratorAvatarPreset {
  id: string;
  number: number;
  name: string;
  role: string;
  category: AvatarCategory;
  voiceName: string;
  gender: 'femenina' | 'masculina';
  accent: string;
  ageRange: string;
  aiModelBadge: string;
  realPhotoUrl: string;
  aiPortraitPrompt: string;
  skinTone: string;
  skinShadow: string;
  hairColor: string;
  hairStyle: AvatarHairStyle;
  jacketColor: string;
  shirtColor: string;
  accentColor: string;
  eyeColor: string;
  lipColor: string;
  glasses?: boolean;
  customPhotoUrl?: string;
}

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  'Literatura & Ficción',
  'Documental & Ciencia',
  'Negocios & Liderazgo',
  'Historia & Crónica',
  'Bienestar & Filosofía',
  'Tecnología & Futuro',
];

/**
 * 30 Real AI Narrator Avatars with real photographic portraits, neural vocal profiles,
 * and Gemini 3.1 Flash Image prompts for on-demand photorealistic regeneration.
 */
export const NARRATOR_AVATAR_PRESETS: NarratorAvatarPreset[] = [
  // ================= 1 - 5: LITERATURA & FICCIÓN =================
  {
    id: 'elena-vega',
    number: 1,
    name: 'Elena Vega',
    role: 'Narradora Literaria & Novela Contemporánea',
    category: 'Literatura & Ficción',
    voiceName: 'Kore',
    gender: 'femenina',
    accent: 'Español Neutro',
    ageRange: '32 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm f/1.4 medium close-up studio portrait of Elena Vega, a warm articulate Hispanic female audiobook narrator in her early 30s, dark acoustic recording studio background with warm amber key light and subtle slate rim light, looking directly at the camera lens, natural composed expression.',
    skinTone: '#E8B89A',
    skinShadow: '#C68E6E',
    hairColor: '#231815',
    hairStyle: 'long-wave',
    jacketColor: '#1E2436',
    shirtColor: '#F59E0B',
    accentColor: '#F59E0B',
    eyeColor: '#3B281E',
    lipColor: '#B85D57',
  },
  {
    id: 'mateo-silva',
    number: 2,
    name: 'Mateo Silva',
    role: 'Narrador de Thriller & Ficción Cinematográfica',
    category: 'Literatura & Ficción',
    voiceName: 'Charon',
    gender: 'masculina',
    accent: 'Español Neutro',
    ageRange: '36 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm f/1.4 medium close-up portrait of Mateo Silva, a charismatic male audiobook narrator in his mid 30s in a dark cinema studio, warm golden rim lighting, deep slate background, wearing a dark tailored jacket, looking directly at the camera.',
    skinTone: '#DCA888',
    skinShadow: '#B57E5E',
    hairColor: '#1C1917',
    hairStyle: 'short-part',
    jacketColor: '#17253B',
    shirtColor: '#38BDF8',
    accentColor: '#38BDF8',
    eyeColor: '#2C221E',
    lipColor: '#9E5B53',
  },
  {
    id: 'sofia-mendoza',
    number: 3,
    name: 'Sofía Mendoza',
    role: 'Autora Editorial & Cuentacuentos Dramática',
    category: 'Literatura & Ficción',
    voiceName: 'Zephyr',
    gender: 'femenina',
    accent: 'Español México',
    ageRange: '29 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Sofia Mendoza, an expressive Mexican female literary storyteller in her late 20s in a modern dark library studio with warm tungsten bokeh, looking directly into the camera lens, natural warm smile.',
    skinTone: '#F0C7AB',
    skinShadow: '#CFA082',
    hairColor: '#4A2C1D',
    hairStyle: 'bob-classic',
    jacketColor: '#281B38',
    shirtColor: '#FBBF24',
    accentColor: '#FBBF24',
    eyeColor: '#423020',
    lipColor: '#C25959',
    glasses: true,
  },
  {
    id: 'gabriel-montes',
    number: 4,
    name: 'Gabriel Montes',
    role: 'Voz de Realismo Mágico & Clásicos',
    category: 'Literatura & Ficción',
    voiceName: 'Fenrir',
    gender: 'masculina',
    accent: 'Español Colombia',
    ageRange: '45 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of a warm Colombian literary narrator in his 40s in a cinema soundstage, rich amber key light, dark background, looking directly at the camera.',
    skinTone: '#D49E7A',
    skinShadow: '#A87454',
    hairColor: '#2A2421',
    hairStyle: 'beard-exec',
    jacketColor: '#231F20',
    shirtColor: '#F59E0B',
    accentColor: '#F59E0B',
    eyeColor: '#3B281E',
    lipColor: '#94524A',
  },
  {
    id: 'camila-del-rio',
    number: 5,
    name: 'Camila del Río',
    role: 'Narradora de Poesía, Romance & Fantasía',
    category: 'Literatura & Ficción',
    voiceName: 'Kore',
    gender: 'femenina',
    accent: 'Español Argentina',
    ageRange: '27 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm portrait of Camila del Rio, an expressive Argentine female audiobook voice actress in her late 20s, dark studio with soft rose-amber key lighting, looking directly at camera.',
    skinTone: '#F2CCB6',
    skinShadow: '#D1A288',
    hairColor: '#3A2318',
    hairStyle: 'curly-volume',
    jacketColor: '#2D1B2E',
    shirtColor: '#F43F5E',
    accentColor: '#F43F5E',
    eyeColor: '#4A3525',
    lipColor: '#C95B63',
  },

  // ================= 6 - 10: DOCUMENTAL & CIENCIA =================
  {
    id: 'javier-alarcon',
    number: 6,
    name: 'Javier Alarcón',
    role: 'Voz Cinematográfica & Documental Naturaleza',
    category: 'Documental & Ciencia',
    voiceName: 'Fenrir',
    gender: 'masculina',
    accent: 'Español Internacional',
    ageRange: '44 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Javier Alarcon, a distinguished male documentary narrator in his 40s with a deep presence, dark minimalist cinema backdrop with emerald and amber rim lighting, looking at camera.',
    skinTone: '#D19C7C',
    skinShadow: '#A67153',
    hairColor: '#27272A',
    hairStyle: 'beard-exec',
    jacketColor: '#142628',
    shirtColor: '#10B981',
    accentColor: '#10B981',
    eyeColor: '#27201C',
    lipColor: '#8F5149',
  },
  {
    id: 'dra-valeria-solis',
    number: 7,
    name: 'Dra. Valeria Solís',
    role: 'Divulgadora de Neurociencia & Medicina',
    category: 'Documental & Ciencia',
    voiceName: 'Zephyr',
    gender: 'femenina',
    accent: 'Español México',
    ageRange: '38 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm portrait of Dr. Valeria Solis, a neuroscience researcher and science audiobook presenter in her late 30s, dark studio with cyan and warm key lighting, wearing modern blazer, looking directly at camera.',
    skinTone: '#E5B596',
    skinShadow: '#C28C6C',
    hairColor: '#1E1614',
    hairStyle: 'updo-bun',
    jacketColor: '#132A38',
    shirtColor: '#06B6D4',
    accentColor: '#06B6D4',
    eyeColor: '#36261B',
    lipColor: '#B85A56',
    glasses: true,
  },
  {
    id: 'alejandro-navarro',
    number: 8,
    name: 'Alejandro Navarro',
    role: 'Narrador de Cosmos, Física & Exploración',
    category: 'Documental & Ciencia',
    voiceName: 'Charon',
    gender: 'masculina',
    accent: 'Español España',
    ageRange: '41 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Alejandro Navarro, a Spanish science and astronomy documentary narrator in his 40s, deep slate studio with subtle blue-amber lighting, looking directly at the camera.',
    skinTone: '#E8BEA2',
    skinShadow: '#C49272',
    hairColor: '#2B2420',
    hairStyle: 'short-part',
    jacketColor: '#161F33',
    shirtColor: '#60A5FA',
    accentColor: '#60A5FA',
    eyeColor: '#3A2E25',
    lipColor: '#9E5C54',
  },
  {
    id: 'clara-ibarra',
    number: 9,
    name: 'Clara Ibarra',
    role: 'Especialista en Biología, Clima & Océanos',
    category: 'Documental & Ciencia',
    voiceName: 'Kore',
    gender: 'femenina',
    accent: 'Español Chile',
    ageRange: '34 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Clara Ibarra, a female natural history and climate documentary narrator in her 30s, dark studio with emerald rim lighting and warm key light, looking directly at camera.',
    skinTone: '#E6B89C',
    skinShadow: '#C28E70',
    hairColor: '#332018',
    hairStyle: 'long-wave',
    jacketColor: '#122B26',
    shirtColor: '#34D399',
    accentColor: '#34D399',
    eyeColor: '#2F4036',
    lipColor: '#B55B56',
  },
  {
    id: 'dr-hector-luna',
    number: 10,
    name: 'Dr. Héctor Luna',
    role: 'Catedrático & Narrador de Ensayos Científicos',
    category: 'Documental & Ciencia',
    voiceName: 'Fenrir',
    gender: 'masculina',
    accent: 'Español Neutro',
    ageRange: '54 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Dr. Hector Luna, a distinguished senior science professor and audiobook narrator in his 50s with salt-and-pepper hair and glasses, dark recording studio, warm key light, looking at camera.',
    skinTone: '#DDA98A',
    skinShadow: '#B47E60',
    hairColor: '#6B7280',
    hairStyle: 'silver-distinguished',
    jacketColor: '#1E2530',
    shirtColor: '#38BDF8',
    accentColor: '#38BDF8',
    eyeColor: '#382B22',
    lipColor: '#94564E',
    glasses: true,
  },

  // ================= 11 - 15: NEGOCIOS & LIDERAZGO =================
  {
    id: 'lucia-carmona',
    number: 11,
    name: 'Lucía Carmona',
    role: 'Voz de Estrategia, Finanzas & Management',
    category: 'Negocios & Liderazgo',
    voiceName: 'Kore',
    gender: 'femenina',
    accent: 'Español España',
    ageRange: '37 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm portrait of Lucia Carmona, an executive female audiobook narrator in her late 30s, tailored dark blazer, warm amber studio lighting, looking directly at camera with confident composure.',
    skinTone: '#ECC1A6',
    skinShadow: '#C89678',
    hairColor: '#2A1B15',
    hairStyle: 'bob-classic',
    jacketColor: '#192132',
    shirtColor: '#F59E0B',
    accentColor: '#F59E0B',
    eyeColor: '#3D2B1F',
    lipColor: '#B85450',
  },
  {
    id: 'rodrigo-velasco',
    number: 12,
    name: 'Rodrigo Velasco',
    role: 'Narrador de Liderazgo, Startups & Economía',
    category: 'Negocios & Liderazgo',
    voiceName: 'Puck',
    gender: 'masculina',
    accent: 'Español México',
    ageRange: '39 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Rodrigo Velasco, a sharp business and leadership audiobook narrator in his late 30s, wearing a dark executive suit in a modern broadcast studio, looking directly at camera.',
    skinTone: '#DBA686',
    skinShadow: '#B27B5A',
    hairColor: '#1A1716',
    hairStyle: 'slick-back',
    jacketColor: '#141D2E',
    shirtColor: '#FBBF24',
    accentColor: '#FBBF24',
    eyeColor: '#2B211B',
    lipColor: '#98554E',
  },
  {
    id: 'mariana-duarte',
    number: 13,
    name: 'Mariana Duarte',
    role: 'Mentora de Marketing, Ventas & Comunicación',
    category: 'Negocios & Liderazgo',
    voiceName: 'Zephyr',
    gender: 'femenina',
    accent: 'Español Colombia',
    ageRange: '33 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm portrait of Mariana Duarte, a charismatic Colombian business author and audiobook narrator in her early 30s, dark studio with warm golden rim light, looking directly at camera.',
    skinTone: '#E8BA9C',
    skinShadow: '#C48E6E',
    hairColor: '#2C1C14',
    hairStyle: 'long-wave',
    jacketColor: '#261C33',
    shirtColor: '#A855F7',
    accentColor: '#A855F7',
    eyeColor: '#3B281E',
    lipColor: '#BD5858',
  },
  {
    id: 'arturo-salazar',
    number: 14,
    name: 'Arturo Salazar',
    role: 'Voz Corporativa, Inversiones & Geopolítica',
    category: 'Negocios & Liderazgo',
    voiceName: 'Charon',
    gender: 'masculina',
    accent: 'Español Neutro',
    ageRange: '48 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Arturo Salazar, an authoritative executive audiobook narrator in his late 40s, dark cinema lighting with amber and slate tones, looking directly at camera.',
    skinTone: '#D49E7E',
    skinShadow: '#AA7353',
    hairColor: '#374151',
    hairStyle: 'silver-distinguished',
    jacketColor: '#1B2230',
    shirtColor: '#F59E0B',
    accentColor: '#F59E0B',
    eyeColor: '#2E241E',
    lipColor: '#8F5048',
  },
  {
    id: 'renata-villar',
    number: 15,
    name: 'Renata Villar',
    role: 'Especialista en Productividad & Hábitos de Alto Nivel',
    category: 'Negocios & Liderazgo',
    voiceName: 'Kore',
    gender: 'femenina',
    accent: 'Español Argentina',
    ageRange: '31 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Renata Villar, a modern female productivity and leadership narrator in her early 30s, dark acoustic studio with crisp warm lighting, looking directly at camera.',
    skinTone: '#F0C8B0',
    skinShadow: '#CC9C80',
    hairColor: '#241814',
    hairStyle: 'updo-bun',
    jacketColor: '#18262E',
    shirtColor: '#2DD4BF',
    accentColor: '#2DD4BF',
    eyeColor: '#3B2F26',
    lipColor: '#BE5A58',
  },

  // ================= 16 - 20: HISTORIA & CRÓNICA =================
  {
    id: 'fernando-alcazar',
    number: 16,
    name: 'Fernando Alcázar',
    role: 'Cronista de Historia Universal & Biografías',
    category: 'Historia & Crónica',
    voiceName: 'Fenrir',
    gender: 'masculina',
    accent: 'Español España',
    ageRange: '52 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Fernando Alcazar, a resonant Spanish historical biographer and narrator in his 50s, warm amber library studio lighting, looking directly at the camera.',
    skinTone: '#DCA88A',
    skinShadow: '#B37C5E',
    hairColor: '#4B5563',
    hairStyle: 'beard-exec',
    jacketColor: '#271E19',
    shirtColor: '#D97706',
    accentColor: '#D97706',
    eyeColor: '#36271E',
    lipColor: '#8E4E46',
  },
  {
    id: 'isabela-montenegro',
    number: 17,
    name: 'Isabela Montenegro',
    role: 'Narradora de Civilizaciones, Arte & Mitología',
    category: 'Historia & Crónica',
    voiceName: 'Zephyr',
    gender: 'femenina',
    accent: 'Español Perú',
    ageRange: '35 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Isabela Montenegro, an articulate cultural history audiobook narrator in her mid 30s, warm golden studio lighting, dark background, looking directly at camera.',
    skinTone: '#DFAC8C',
    skinShadow: '#B88262',
    hairColor: '#1E1512',
    hairStyle: 'long-wave',
    jacketColor: '#2A1D1B',
    shirtColor: '#F59E0B',
    accentColor: '#F59E0B',
    eyeColor: '#332219',
    lipColor: '#B2524E',
  },
  {
    id: 'sebastian-mora',
    number: 18,
    name: 'Sebastián Mora',
    role: 'Periodista Narrativo & Crónica de Investigación',
    category: 'Historia & Crónica',
    voiceName: 'Charon',
    gender: 'masculina',
    accent: 'Español Colombia',
    ageRange: '38 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Sebastian Mora, an investigative journalist and audiobook narrator in his late 30s, dark acoustic broadcast booth with dramatic rim lighting, looking at camera.',
    skinTone: '#D8A382',
    skinShadow: '#AE7858',
    hairColor: '#1F1B18',
    hairStyle: 'short-part',
    jacketColor: '#1C2430',
    shirtColor: '#F97316',
    accentColor: '#F97316',
    eyeColor: '#2D221B',
    lipColor: '#96544C',
    glasses: true,
  },
  {
    id: 'beatriz-lujan',
    number: 19,
    name: 'Beatriz Luján',
    role: 'Relatora de Historia Moderna & Archivos',
    category: 'Historia & Crónica',
    voiceName: 'Kore',
    gender: 'femenina',
    accent: 'Español México',
    ageRange: '42 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Beatriz Lujan, a poised female historical documentary narrator in her early 40s, warm cinema key lighting, dark studio backdrop, looking directly at camera.',
    skinTone: '#E6B698',
    skinShadow: '#C08C6E',
    hairColor: '#2D1E18',
    hairStyle: 'bob-classic',
    jacketColor: '#231D2E',
    shirtColor: '#FBBF24',
    accentColor: '#FBBF24',
    eyeColor: '#3A281E',
    lipColor: '#B45452',
  },
  {
    id: 'emilio-cardenas',
    number: 20,
    name: 'Emilio Cárdenas',
    role: 'Voz Épica de Grandes Relatos & Crónicas Antiguas',
    category: 'Historia & Crónica',
    voiceName: 'Fenrir',
    gender: 'masculina',
    accent: 'Español Neutro',
    ageRange: '49 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Emilio Cardenas, a deep-voiced epic history narrator in his late 40s, dark studio with warm amber rim lighting, looking directly at the camera.',
    skinTone: '#D29B7A',
    skinShadow: '#A87050',
    hairColor: '#2E2A27',
    hairStyle: 'beard-exec',
    jacketColor: '#241B18',
    shirtColor: '#EF4444',
    accentColor: '#EF4444',
    eyeColor: '#2B201A',
    lipColor: '#8C4E46',
  },

  // ================= 21 - 25: BIENESTAR & FILOSOFÍA =================
  {
    id: 'alba-serrano',
    number: 21,
    name: 'Alba Serrano',
    role: 'Guía de Mindfulness, Psicología & Calma',
    category: 'Bienestar & Filosofía',
    voiceName: 'Zephyr',
    gender: 'femenina',
    accent: 'Español España',
    ageRange: '33 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Alba Serrano, a serene psychology and mindfulness audiobook narrator in her early 30s, soft warm studio lighting, calm expression looking directly at camera.',
    skinTone: '#F0C7AE',
    skinShadow: '#CC9B7E',
    hairColor: '#3B261B',
    hairStyle: 'long-wave',
    jacketColor: '#172929',
    shirtColor: '#10B981',
    accentColor: '#10B981',
    eyeColor: '#423224',
    lipColor: '#BC5C58',
  },
  {
    id: 'daniel-quiroz',
    number: 22,
    name: 'Daniel Quiroz',
    role: 'Narrador de Filosofía Estoica & Desarrollo Personal',
    category: 'Bienestar & Filosofía',
    voiceName: 'Charon',
    gender: 'masculina',
    accent: 'Español Neutro',
    ageRange: '40 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Daniel Quiroz, a calm and reflective philosophy audiobook narrator in his 40s, warm amber and slate studio lighting, looking directly at camera.',
    skinTone: '#DDA98A',
    skinShadow: '#B47E60',
    hairColor: '#25201D',
    hairStyle: 'short-part',
    jacketColor: '#1D2432',
    shirtColor: '#818CF8',
    accentColor: '#818CF8',
    eyeColor: '#32261E',
    lipColor: '#98564E',
  },
  {
    id: 'natalia-paz',
    number: 23,
    name: 'Natalia Paz',
    role: 'Voz de Inteligencia Emocional & Espiritualidad',
    category: 'Bienestar & Filosofía',
    voiceName: 'Kore',
    gender: 'femenina',
    accent: 'Español Colombia',
    ageRange: '36 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Natalia Paz, a warm compassionate female audiobook narrator in her mid 30s, soft golden studio key light, dark background, looking directly at camera.',
    skinTone: '#E8BA9E',
    skinShadow: '#C28E70',
    hairColor: '#2A1B14',
    hairStyle: 'curly-volume',
    jacketColor: '#251D30',
    shirtColor: '#F472B6',
    accentColor: '#F472B6',
    eyeColor: '#3A281E',
    lipColor: '#C0585C',
  },
  {
    id: 'marco-aurelio-rios',
    number: 24,
    name: 'Marco Ríos',
    role: 'Mentor de Sabiduría Clásica & Humanismo',
    category: 'Bienestar & Filosofía',
    voiceName: 'Fenrir',
    gender: 'masculina',
    accent: 'Español Argentina',
    ageRange: '47 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Marco Rios, a thoughtful Argentine philosophy narrator in his late 40s, warm acoustic studio lighting, looking directly at the camera.',
    skinTone: '#DCA888',
    skinShadow: '#B27C5C',
    hairColor: '#3F3F46',
    hairStyle: 'beard-exec',
    jacketColor: '#1E262B',
    shirtColor: '#34D399',
    accentColor: '#34D399',
    eyeColor: '#2E231C',
    lipColor: '#91524A',
  },
  {
    id: 'paula-santamaria',
    number: 25,
    name: 'Paula Santamaría',
    role: 'Terapeuta Narrativa & Autora de Bienestar',
    category: 'Bienestar & Filosofía',
    voiceName: 'Zephyr',
    gender: 'femenina',
    accent: 'Español México',
    ageRange: '39 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Paula Santamaria, a warm Mexican wellness author and audiobook narrator in her late 30s, soft amber studio lighting, looking directly at camera.',
    skinTone: '#E5B698',
    skinShadow: '#BF8C6E',
    hairColor: '#261914',
    hairStyle: 'updo-bun',
    jacketColor: '#1F2937',
    shirtColor: '#FBBF24',
    accentColor: '#FBBF24',
    eyeColor: '#38271E',
    lipColor: '#B85654',
  },

  // ================= 26 - 30: TECNOLOGÍA & FUTURO =================
  {
    id: 'diego-kogan',
    number: 26,
    name: 'Diego Kogan',
    role: 'Narrador de Inteligencia Artificial & Cibercultura',
    category: 'Tecnología & Futuro',
    voiceName: 'Puck',
    gender: 'masculina',
    accent: 'Español Internacional',
    ageRange: '31 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Diego Kogan, a modern tech and AI audiobook presenter in his early 30s, dark studio with cyan and amber rim light, looking directly at camera.',
    skinTone: '#E6B89C',
    skinShadow: '#C08E70',
    hairColor: '#1C1917',
    hairStyle: 'short-part',
    jacketColor: '#111C2D',
    shirtColor: '#38BDF8',
    accentColor: '#38BDF8',
    eyeColor: '#2D241E',
    lipColor: '#9C5850',
  },
  {
    id: 'adriana-chen',
    number: 27,
    name: 'Adriana Chen',
    role: 'Especialista en Robótica, Biotecnología & Futuro',
    category: 'Tecnología & Futuro',
    voiceName: 'Kore',
    gender: 'femenina',
    accent: 'Español Neutro',
    ageRange: '28 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Adriana Chen, a futuristic technology and biotech audiobook narrator in her late 20s, sleek dark studio with subtle blue and warm key light, looking at camera.',
    skinTone: '#F0C8AE',
    skinShadow: '#CC9C80',
    hairColor: '#161414',
    hairStyle: 'bob-classic',
    jacketColor: '#141E30',
    shirtColor: '#06B6D4',
    accentColor: '#06B6D4',
    eyeColor: '#261E1A',
    lipColor: '#B85656',
  },
  {
    id: 'tomas-lindqvist',
    number: 28,
    name: 'Tomás Lindqvist',
    role: 'Arquitecto de Software, Web3 & Sistemas Complejos',
    category: 'Tecnología & Futuro',
    voiceName: 'Charon',
    gender: 'masculina',
    accent: 'Español Chile',
    ageRange: '35 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Tomas Lindqvist, a tech author and audiobook narrator in his mid 30s, dark acoustic studio with crisp rim lighting, looking directly at camera.',
    skinTone: '#EABFA4',
    skinShadow: '#C49476',
    hairColor: '#3A2B20',
    hairStyle: 'slick-back',
    jacketColor: '#172133',
    shirtColor: '#818CF8',
    accentColor: '#818CF8',
    eyeColor: '#35424A',
    lipColor: '#9E5C54',
    glasses: true,
  },
  {
    id: 'irene-vazquez',
    number: 29,
    name: 'Irene Vázquez',
    role: 'Divulgadora de Innovación, Espacio & Energía Limpia',
    category: 'Tecnología & Futuro',
    voiceName: 'Zephyr',
    gender: 'femenina',
    accent: 'Español España',
    ageRange: '34 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Irene Vazquez, a Spanish innovation and aerospace audiobook narrator in her mid 30s, dark cinema studio with warm amber key light, looking directly at camera.',
    skinTone: '#ECC2A8',
    skinShadow: '#C89678',
    hairColor: '#2E1E17',
    hairStyle: 'long-wave',
    jacketColor: '#192336',
    shirtColor: '#F59E0B',
    accentColor: '#F59E0B',
    eyeColor: '#3C2A1E',
    lipColor: '#BA5856',
  },
  {
    id: 'victor-kronos',
    number: 30,
    name: 'Víctor Kronos',
    role: 'Voz de Ciencia Ficción Hard, Singularidad & Metaverso',
    category: 'Tecnología & Futuro',
    voiceName: 'Fenrir',
    gender: 'masculina',
    accent: 'Español Neutro',
    ageRange: '43 años',
    aiModelBadge: 'Gemini 3.1 Live Avatar',
    realPhotoUrl:
      'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&w=640&q=85',
    aiPortraitPrompt:
      'Photorealistic 85mm studio portrait of Victor Kronos, a cinematic sci-fi and singularity audiobook narrator in his early 40s, dramatic amber and teal studio lighting, looking directly at camera.',
    skinTone: '#D6A080',
    skinShadow: '#AC7656',
    hairColor: '#222226',
    hairStyle: 'beard-exec',
    jacketColor: '#121A2A',
    shirtColor: '#10B981',
    accentColor: '#10B981',
    eyeColor: '#2A211C',
    lipColor: '#8E5048',
  },
];

/**
 * Draws an expressive, realistic studio narrator avatar with real-time lip-sync,
 * neural photo animation, studio microphone, and acoustic wave rings onto any 2D canvas.
 * Supports animating real photographic portraits (`customImg`) with natural head motion,
 * breathing, lower-face articulation, and studio broadcast overlays.
 */
export function drawTalkingAvatarOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  avatar: NarratorAvatarPreset,
  elapsedSec: number,
  isSpeaking: boolean,
  customImg?: HTMLImageElement | null,
  currentSyllableText?: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Studio background gradient
  const bgGrad = ctx.createRadialGradient(
    x + w * 0.5,
    y + h * 0.4,
    w * 0.05,
    x + w * 0.5,
    y + h * 0.5,
    Math.max(w, h) * 0.75
  );
  bgGrad.addColorStop(0, '#1B2234');
  bgGrad.addColorStop(0.55, '#0F131D');
  bgGrad.addColorStop(1, '#07090E');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(x, y, w, h);

  // Compute speech mouth openness (0..1) from syllable cadence
  const speechEnergy = isSpeaking
    ? Math.max(
        0.08,
        Math.abs(
          Math.sin(elapsedSec * 11.5) * 0.65 +
            Math.cos(elapsedSec * 17.3) * 0.35 +
            Math.sin(elapsedSec * 5.2) * 0.25
        )
      )
    : 0.02;

  // Ambient acoustic halo rings behind narrator when speaking
  const cx = x + w * 0.5;
  const cy = y + h * 0.45;
  const baseRadius = Math.min(w, h) * 0.28;

  for (let r = 1; r <= 3; r++) {
    const pulse = isSpeaking ? speechEnergy * 14 * r : 2;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius + r * 18 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle =
      r === 1
        ? `${avatar.accentColor}44`
        : r === 2
        ? `${avatar.accentColor}26`
        : `${avatar.accentColor}14`;
    ctx.lineWidth = r === 1 ? 2 : 1.2;
    ctx.stroke();
  }

  // If a real photographic portrait (or AI-generated portrait) is loaded, animate it with
  // neural-inspired live head motion, dynamic lower-jaw speaking articulation, studio rim light,
  // and foreground studio condenser microphone!
  if (customImg && customImg.complete && customImg.naturalWidth > 0) {
    const breathScale =
      1.04 + (isSpeaking ? Math.sin(elapsedSec * 3.1) * 0.014 + speechEnergy * 0.018 : Math.sin(elapsedSec * 1.6) * 0.006);
    const swayX = isSpeaking ? Math.sin(elapsedSec * 1.9) * 3.2 : Math.sin(elapsedSec * 0.9) * 1;
    const swayY = isSpeaking ? Math.cos(elapsedSec * 2.7) * 2.8 : 0;
    const headTilt = isSpeaking ? Math.sin(elapsedSec * 1.4) * 0.012 : 0;

    const imgRatio = customImg.naturalWidth / Math.max(1, customImg.naturalHeight);
    const boxRatio = w / Math.max(1, h);
    let drawW = w;
    let drawH = h;
    if (imgRatio > boxRatio) {
      drawH = h;
      drawW = h * imgRatio;
    } else {
      drawW = w;
      drawH = w / imgRatio;
    }

    ctx.save();
    ctx.translate(cx + swayX, y + h * 0.5 + swayY);
    ctx.rotate(headTilt);
    ctx.scale(breathScale, breathScale);

    // Draw main portrait frame
    ctx.drawImage(customImg, -drawW / 2, -drawH / 2, drawW, drawH);

    // Subtle lower-face speaking micro-articulation slice when actively speaking
    if (isSpeaking && speechEnergy > 0.14) {
      const jawShiftY = speechEnergy * 3.4;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, drawH * 0.12, drawW * 0.22, drawH * 0.14, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(customImg, -drawW / 2, -drawH / 2 + jawShiftY, drawW, drawH);
      ctx.restore();
    }

    ctx.restore();

    // Dynamic Studio Rim Light Glow around portrait when speaking
    if (isSpeaking) {
      const rimGrad = ctx.createRadialGradient(
        cx,
        y + h * 0.42,
        Math.min(w, h) * 0.18,
        cx,
        y + h * 0.45,
        Math.max(w, h) * 0.58
      );
      rimGrad.addColorStop(0, 'rgba(0,0,0,0)');
      rimGrad.addColorStop(0.75, 'rgba(0,0,0,0)');
      rimGrad.addColorStop(1, `${avatar.accentColor}40`);
      ctx.fillStyle = rimGrad;
      ctx.fillRect(x, y, w, h);
    }

    // Bottom vignette for studio mic & live voice equalizer
    const vig = ctx.createLinearGradient(0, y + h * 0.56, 0, y + h);
    vig.addColorStop(0, 'rgba(7,9,14,0)');
    vig.addColorStop(0.65, 'rgba(7,9,14,0.68)');
    vig.addColorStop(1, 'rgba(7,9,14,0.95)');
    ctx.fillStyle = vig;
    ctx.fillRect(x, y + h * 0.56, w, h * 0.44);

    // Foreground Broadcast Studio Microphone
    const micScale = Math.min(w, h) / 360;
    ctx.save();
    ctx.translate(cx, y + h * 0.86);
    ctx.scale(micScale, micScale);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = avatar.accentColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-15, -26, 30, 42, 13);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    for (let my = -18; my <= 6; my += 6) {
      ctx.beginPath();
      ctx.moveTo(-10, my);
      ctx.lineTo(10, my);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Lifelike Studio Narrator Character Rig with real-time lip sync, blinking & head motion
    const scale = Math.min(w, h) / 320;
    const headBobY = Math.sin(elapsedSec * 2.4) * (isSpeaking ? 3.2 : 1.2);
    const headTilt = Math.sin(elapsedSec * 1.5) * (isSpeaking ? 0.025 : 0.008);

    // Blink every ~3.8 seconds
    const blinkCycle = elapsedSec % 3.8;
    const isBlinking = blinkCycle > 3.62 && blinkCycle < 3.76;

    ctx.save();
    ctx.translate(cx, y + h * 0.54);
    ctx.scale(scale, scale);

    // Back hair (for long/curly/bob hair styles)
    if (avatar.hairStyle === 'long-wave' || avatar.hairStyle === 'curly-volume') {
      ctx.fillStyle = avatar.hairColor;
      ctx.beginPath();
      ctx.ellipse(
        0,
        -18 + headBobY,
        avatar.hairStyle === 'curly-volume' ? 74 : 68,
        86,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else if (avatar.hairStyle === 'bob-classic') {
      ctx.fillStyle = avatar.hairColor;
      ctx.beginPath();
      ctx.ellipse(0, -28 + headBobY, 64, 68, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (avatar.hairStyle === 'updo-bun') {
      ctx.fillStyle = avatar.hairColor;
      ctx.beginPath();
      ctx.arc(0, -88 + headBobY, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shoulders & Studio Jacket
    ctx.fillStyle = avatar.jacketColor;
    ctx.beginPath();
    ctx.moveTo(-115, 150);
    ctx.quadraticCurveTo(-105, 58, -42, 46);
    ctx.lineTo(42, 46);
    ctx.quadraticCurveTo(105, 58, 115, 150);
    ctx.closePath();
    ctx.fill();

    // Inner Collar / Shirt Accent
    ctx.fillStyle = avatar.shirtColor;
    ctx.beginPath();
    ctx.moveTo(-26, 48);
    ctx.lineTo(0, 96);
    ctx.lineTo(26, 48);
    ctx.closePath();
    ctx.fill();

    // Jacket Lapels
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-40, 48);
    ctx.lineTo(-12, 115);
    ctx.moveTo(40, 48);
    ctx.lineTo(12, 115);
    ctx.stroke();

    // Neck & Neck Shadow
    ctx.fillStyle = avatar.skinShadow;
    ctx.beginPath();
    ctx.roundRect(-22, 10, 44, 48, 12);
    ctx.fill();

    // Animated Head Group
    ctx.save();
    ctx.translate(0, -34 + headBobY);
    ctx.rotate(headTilt);

    // Ears
    ctx.fillStyle = avatar.skinShadow;
    ctx.beginPath();
    ctx.ellipse(-52, 4, 9, 16, -0.1, 0, Math.PI * 2);
    ctx.ellipse(52, 4, 9, 16, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Head Base Shape
    ctx.fillStyle = avatar.skinTone;
    ctx.beginPath();
    ctx.ellipse(0, 0, 51, 64, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle Facial Cheek Shading
    const cheekGrad = ctx.createRadialGradient(-26, 12, 2, -26, 12, 22);
    cheekGrad.addColorStop(0, 'rgba(210, 105, 90, 0.18)');
    cheekGrad.addColorStop(1, 'rgba(210, 105, 90, 0)');
    ctx.fillStyle = cheekGrad;
    ctx.beginPath();
    ctx.arc(-26, 12, 22, 0, Math.PI * 2);
    ctx.arc(26, 12, 22, 0, Math.PI * 2);
    ctx.fill();

    // Executive Beard if selected
    if (avatar.hairStyle === 'beard-exec' || avatar.hairStyle === 'silver-distinguished') {
      ctx.fillStyle =
        avatar.hairStyle === 'silver-distinguished'
          ? 'rgba(120, 130, 145, 0.35)'
          : 'rgba(35, 35, 40, 0.38)';
      ctx.beginPath();
      ctx.arc(0, 8, 50, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.fill();
    }

    // Eyebrows (expressive lift when speaking)
    const browLift = isSpeaking ? Math.sin(elapsedSec * 5) * 2.2 : 0;
    ctx.strokeStyle = avatar.hairColor;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-33, -17 - browLift);
    ctx.quadraticCurveTo(-20, -23 - browLift, -8, -19 - browLift);
    ctx.moveTo(8, -19 - browLift);
    ctx.quadraticCurveTo(20, -23 - browLift, 33, -17 - browLift);
    ctx.stroke();

    // Eyes (with natural blinking)
    if (isBlinking) {
      ctx.strokeStyle = '#271C18';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-29, -7);
      ctx.quadraticCurveTo(-19, -4, -10, -7);
      ctx.moveTo(10, -7);
      ctx.quadraticCurveTo(19, -4, 29, -7);
      ctx.stroke();
    } else {
      // Sclera
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(-19, -7, 9.5, 5.8, 0, 0, Math.PI * 2);
      ctx.ellipse(19, -7, 9.5, 5.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Iris
      const gazeX = Math.sin(elapsedSec * 0.9) * 1.2;
      ctx.fillStyle = avatar.eyeColor;
      ctx.beginPath();
      ctx.arc(-19 + gazeX, -7, 4.6, 0, Math.PI * 2);
      ctx.arc(19 + gazeX, -7, 4.6, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#090A0F';
      ctx.beginPath();
      ctx.arc(-19 + gazeX, -7, 2.2, 0, Math.PI * 2);
      ctx.arc(19 + gazeX, -7, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Eye Catchlight
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-20.5 + gazeX, -8.8, 1.3, 0, Math.PI * 2);
      ctx.arc(17.5 + gazeX, -8.8, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Optional Glasses
    if (avatar.glasses) {
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(-32, -16, 25, 18);
      ctx.strokeRect(7, -16, 25, 18);
      ctx.beginPath();
      ctx.moveTo(-7, -8);
      ctx.lineTo(7, -8);
      ctx.stroke();
    }

    // Nose
    ctx.strokeStyle = avatar.skinShadow;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-3, 12);
    ctx.quadraticCurveTo(0, 15, 5, 12);
    ctx.stroke();

    // Animated Mouth & Lips (Real-time Lip Sync)
    const mouthOpenH = isSpeaking ? 2.5 + speechEnergy * 11.5 : 1.5;
    const mouthWidth = isSpeaking ? 15 + Math.sin(elapsedSec * 9) * 2.5 : 15;

    if (mouthOpenH > 2.2) {
      ctx.fillStyle = '#4A1D1F';
      ctx.beginPath();
      ctx.ellipse(0, 31, mouthWidth, mouthOpenH, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F3F4F6';
      ctx.beginPath();
      ctx.ellipse(0, 27.5, mouthWidth * 0.72, Math.min(2.6, mouthOpenH * 0.35), 0, 0, Math.PI);
      ctx.fill();

      ctx.fillStyle = '#C85A62';
      ctx.beginPath();
      ctx.ellipse(0, 33.5, mouthWidth * 0.55, Math.min(3.5, mouthOpenH * 0.42), 0, 0, Math.PI, true);
      ctx.fill();
    }

    // Lips outline
    ctx.strokeStyle = avatar.lipColor;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.ellipse(0, 31, mouthWidth, Math.max(1.8, mouthOpenH), 0, 0, Math.PI * 2);
    ctx.stroke();

    // Top Hair Crown
    ctx.fillStyle = avatar.hairColor;
    ctx.beginPath();
    ctx.arc(0, -14, 53, Math.PI, Math.PI * 2);
    ctx.quadraticCurveTo(54, -45, 0, -67);
    ctx.quadraticCurveTo(-54, -45, -53, -14);
    ctx.fill();

    // Side hair sweep
    ctx.beginPath();
    ctx.moveTo(-50, -24);
    ctx.quadraticCurveTo(-10, -52, 46, -28);
    ctx.quadraticCurveTo(18, -64, -48, -36);
    ctx.fill();

    ctx.restore(); // end head group

    // Broadcast Condenser Microphone at Bottom Center
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = avatar.accentColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-16, 86, 32, 44, 14);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    for (let my = 94; my <= 120; my += 6) {
      ctx.beginPath();
      ctx.moveTo(-11, my);
      ctx.lineTo(11, my);
      ctx.stroke();
    }

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-4, 130, 8, 30);

    ctx.restore();
  }

  // Bottom Live Voice Waveform Equalizer Bars inside Avatar Stage
  const barCount = 18;
  const totalBarW = Math.min(w * 0.65, 180);
  const startBarX = x + (w - totalBarW) / 2;
  const barGap = totalBarW / barCount;
  const baseBarY = y + h - 18;

  for (let i = 0; i < barCount; i++) {
    const wave = isSpeaking
      ? 4 + Math.abs(Math.sin(elapsedSec * 10 + i * 0.55)) * 16 * speechEnergy
      : 3;
    ctx.fillStyle = isSpeaking ? avatar.accentColor : 'rgba(148, 163, 184, 0.35)';
    ctx.fillRect(startBarX + i * barGap, baseBarY - wave / 2, 3, wave);
  }

  // Live Narrator Badge
  if (currentSyllableText) {
    const labelText = isSpeaking
      ? `● HABLANDO · #${avatar.number} ${avatar.name.toUpperCase()}`
      : `● #${avatar.number} ${avatar.name.toUpperCase()} · ${avatar.voiceName.toUpperCase()}`;
    ctx.font = '600 10px "JetBrains Mono", monospace';
    const textW = Math.min(w - 20, Math.max(165, ctx.measureText(labelText).width + 20));
    ctx.fillStyle = 'rgba(10, 12, 18, 0.84)';
    ctx.fillRect(x + 10, y + 10, textW, 24);
    ctx.strokeStyle = `${avatar.accentColor}66`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 10, y + 10, textW, 24);
    ctx.fillStyle = avatar.accentColor;
    ctx.fillText(labelText, x + 18, y + 25);
  }

  ctx.restore();
}

interface TalkingAvatarStageProps {
  avatar: NarratorAvatarPreset;
  isSpeaking: boolean;
  customPhotoUrl?: string;
  className?: string;
}

export const TalkingAvatarStage: React.FC<TalkingAvatarStageProps> = ({
  avatar,
  isSpeaking,
  customPhotoUrl,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [, setPhotoLoadedTick] = useState(0);

  useEffect(() => {
    const url = customPhotoUrl || avatar.customPhotoUrl || avatar.realPhotoUrl;
    if (!url) {
      imgRef.current = null;
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!cancelled) {
        imgRef.current = img;
        setPhotoLoadedTick((t) => t + 1);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        imgRef.current = null;
        setPhotoLoadedTick((t) => t + 1);
      }
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [customPhotoUrl, avatar.customPhotoUrl, avatar.realPhotoUrl]);

  useEffect(() => {
    let rafId: number;
    const start = performance.now();

    const render = (now: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const elapsed = (now - start) / 1000;
          drawTalkingAvatarOnCanvas(
            ctx,
            0,
            0,
            canvas.width,
            canvas.height,
            avatar,
            elapsed,
            isSpeaking,
            imgRef.current,
            avatar.name
          );
        }
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [avatar, isSpeaking, customPhotoUrl]);

  return (
    <canvas
      ref={canvasRef}
      width={460}
      height={460}
      className={`w-full h-full object-cover ${className}`}
    />
  );
};

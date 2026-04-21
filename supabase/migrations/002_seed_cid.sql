-- ============================================================
-- Migration 002: Seed CID-10 - Códigos mais comuns
-- Consultório Lotti Fonseca - Medicina Geral e Psicologia
-- ============================================================

INSERT INTO cid_codigos (versao, codigo, descricao, categoria, capitulo) VALUES

-- ============================================================
-- CAPÍTULO I - Doenças Infecciosas e Parasitárias (A00-B99)
-- ============================================================
('cid10', 'B18.2', 'Hepatite C crônica viral', 'Hepatite viral crônica', 'I - Doenças infecciosas e parasitárias'),

-- ============================================================
-- CAPÍTULO II - Neoplasias (C00-D48)
-- ============================================================
('cid10', 'C50', 'Neoplasia maligna da mama', 'Neoplasias malignas', 'II - Neoplasias'),

-- ============================================================
-- CAPÍTULO IV - Doenças Endócrinas, Nutricionais e Metabólicas (E00-E90)
-- ============================================================
('cid10', 'E03.9', 'Hipotireoidismo não especificado', 'Hipotireoidismo', 'IV - Doenças endócrinas, nutricionais e metabólicas'),
('cid10', 'E10', 'Diabetes mellitus insulino-dependente (tipo 1)', 'Diabetes mellitus', 'IV - Doenças endócrinas, nutricionais e metabólicas'),
('cid10', 'E11', 'Diabetes mellitus não insulino-dependente (tipo 2)', 'Diabetes mellitus', 'IV - Doenças endócrinas, nutricionais e metabólicas'),
('cid10', 'E11.0', 'Diabetes mellitus tipo 2 com coma', 'Diabetes mellitus', 'IV - Doenças endócrinas, nutricionais e metabólicas'),
('cid10', 'E11.9', 'Diabetes mellitus tipo 2 sem complicações', 'Diabetes mellitus', 'IV - Doenças endócrinas, nutricionais e metabólicas'),
('cid10', 'E66', 'Obesidade', 'Obesidade e outras formas de hiperalimentação', 'IV - Doenças endócrinas, nutricionais e metabólicas'),
('cid10', 'E66.0', 'Obesidade devida a excesso de calorias', 'Obesidade e outras formas de hiperalimentação', 'IV - Doenças endócrinas, nutricionais e metabólicas'),
('cid10', 'E78', 'Distúrbios do metabolismo de lipoproteínas e outras lipidemias', 'Distúrbios metabólicos', 'IV - Doenças endócrinas, nutricionais e metabólicas'),
('cid10', 'E78.0', 'Hipercolesterolemia pura', 'Distúrbios metabólicos', 'IV - Doenças endócrinas, nutricionais e metabólicas'),
('cid10', 'E78.5', 'Hiperlipidemia não especificada', 'Distúrbios metabólicos', 'IV - Doenças endócrinas, nutricionais e metabólicas'),

-- ============================================================
-- CAPÍTULO V - Transtornos Mentais e Comportamentais (F00-F99)
-- ============================================================
('cid10', 'F10.2', 'Síndrome de dependência ao álcool', 'Transtornos mentais por uso de álcool', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F20', 'Esquizofrenia', 'Esquizofrenia, transtornos esquizotípicos e delirantes', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F29', 'Psicose não-orgânica não especificada', 'Esquizofrenia, transtornos esquizotípicos e delirantes', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F31', 'Transtorno afetivo bipolar', 'Transtornos do humor', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F31.0', 'Transtorno afetivo bipolar, episódio hipomaníaco atual', 'Transtornos do humor', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F32', 'Episódio depressivo', 'Transtornos do humor', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F32.0', 'Episódio depressivo leve', 'Transtornos do humor', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F32.1', 'Episódio depressivo moderado', 'Transtornos do humor', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F32.2', 'Episódio depressivo grave sem sintomas psicóticos', 'Transtornos do humor', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F33', 'Transtorno depressivo recorrente', 'Transtornos do humor', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F33.0', 'Transtorno depressivo recorrente, episódio atual leve', 'Transtornos do humor', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F33.1', 'Transtorno depressivo recorrente, episódio atual moderado', 'Transtornos do humor', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F40.1', 'Fobias sociais (Ansiedade social)', 'Transtornos neuróticos, relacionados ao estresse e somatoformes', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F41', 'Outros transtornos ansiosos', 'Transtornos neuróticos, relacionados ao estresse e somatoformes', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F41.0', 'Transtorno de pânico (ansiedade paroxística episódica)', 'Transtornos neuróticos, relacionados ao estresse e somatoformes', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F41.1', 'Ansiedade generalizada', 'Transtornos neuróticos, relacionados ao estresse e somatoformes', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F41.2', 'Transtorno misto ansioso e depressivo', 'Transtornos neuróticos, relacionados ao estresse e somatoformes', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F42', 'Transtorno obsessivo-compulsivo (TOC)', 'Transtornos neuróticos, relacionados ao estresse e somatoformes', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F43.1', 'Estado de estresse pós-traumático (TEPT)', 'Transtornos neuróticos, relacionados ao estresse e somatoformes', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F43.2', 'Transtornos de adaptação', 'Transtornos neuróticos, relacionados ao estresse e somatoformes', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F90', 'Transtornos hipercinéticos (TDAH)', 'Transtornos do comportamento e emocionais', 'V - Transtornos mentais e comportamentais'),
('cid10', 'F90.0', 'Perturbação da atividade e da atenção (TDAH - desatenção)', 'Transtornos do comportamento e emocionais', 'V - Transtornos mentais e comportamentais'),

-- ============================================================
-- CAPÍTULO VI - Doenças do Sistema Nervoso (G00-G99)
-- ============================================================
('cid10', 'G43', 'Enxaqueca (Migrânea)', 'Síndromes episódicas e paroxísticas', 'VI - Doenças do sistema nervoso'),
('cid10', 'G43.0', 'Enxaqueca sem aura (enxaqueca comum)', 'Síndromes episódicas e paroxísticas', 'VI - Doenças do sistema nervoso'),
('cid10', 'G44', 'Outras síndromes de algias cefálicas (cefaleia)', 'Síndromes episódicas e paroxísticas', 'VI - Doenças do sistema nervoso'),
('cid10', 'G44.2', 'Cefaleia do tipo tensional', 'Síndromes episódicas e paroxísticas', 'VI - Doenças do sistema nervoso'),
('cid10', 'G47.0', 'Distúrbios do início e da manutenção do sono (insônia)', 'Distúrbios do sono', 'VI - Doenças do sistema nervoso'),
('cid10', 'G89', 'Outras síndromes dolorosas não classificadas em outra parte (dor crônica)', 'Outras doenças do sistema nervoso', 'VI - Doenças do sistema nervoso'),

-- ============================================================
-- CAPÍTULO IX - Doenças do Aparelho Circulatório (I00-I99)
-- ============================================================
('cid10', 'I10', 'Hipertensão essencial (primária)', 'Doenças hipertensivas', 'IX - Doenças do aparelho circulatório'),
('cid10', 'I25.1', 'Doença aterosclerótica do coração', 'Doença isquêmica crônica do coração', 'IX - Doenças do aparelho circulatório'),

-- ============================================================
-- CAPÍTULO X - Doenças do Aparelho Respiratório (J00-J99)
-- ============================================================
('cid10', 'J06', 'Infecções agudas das vias aéreas superiores de localizações múltiplas e não especificadas', 'Infecções agudas das vias aéreas superiores', 'X - Doenças do aparelho respiratório'),
('cid10', 'J06.9', 'Infecção aguda das vias aéreas superiores não especificada', 'Infecções agudas das vias aéreas superiores', 'X - Doenças do aparelho respiratório'),
('cid10', 'J44', 'Outras doenças pulmonares obstrutivas crônicas (DPOC)', 'Doenças pulmonares obstrutivas', 'X - Doenças do aparelho respiratório'),
('cid10', 'J44.1', 'Doença pulmonar obstrutiva crônica com exacerbação aguda', 'Doenças pulmonares obstrutivas', 'X - Doenças do aparelho respiratório'),
('cid10', 'J45', 'Asma', 'Doenças pulmonares obstrutivas', 'X - Doenças do aparelho respiratório'),
('cid10', 'J45.0', 'Asma predominantemente alérgica', 'Doenças pulmonares obstrutivas', 'X - Doenças do aparelho respiratório'),

-- ============================================================
-- CAPÍTULO XIII - Doenças do Sistema Osteomuscular (M00-M99)
-- ============================================================
('cid10', 'M19', 'Outras artrites (artrose)', 'Artropatias', 'XIII - Doenças do sistema osteomuscular'),
('cid10', 'M19.0', 'Artrose primária de outras articulações', 'Artropatias', 'XIII - Doenças do sistema osteomuscular'),
('cid10', 'M54.5', 'Dor lombar baixa (lombalgia)', 'Dorsopatias', 'XIII - Doenças do sistema osteomuscular'),
('cid10', 'M54.4', 'Lumbago com ciática', 'Dorsopatias', 'XIII - Doenças do sistema osteomuscular'),

-- ============================================================
-- CAPÍTULO XXI - Fatores que influenciam o estado de saúde (Z00-Z99)
-- ============================================================
('cid10', 'Z00.0', 'Exame médico geral (consulta de rotina)', 'Exames gerais', 'XXI - Fatores que influenciam o estado de saúde'),
('cid10', 'Z00.1', 'Exame de rotina de saúde da criança', 'Exames gerais', 'XXI - Fatores que influenciam o estado de saúde'),
('cid10', 'Z09', 'Consulta de acompanhamento após tratamento por outras condições (retorno)', 'Acompanhamento pós-tratamento', 'XXI - Fatores que influenciam o estado de saúde'),
('cid10', 'Z34', 'Supervisão de gravidez normal (consulta pré-natal)', 'Gravidez e reprodução', 'XXI - Fatores que influenciam o estado de saúde'),
('cid10', 'Z34.0', 'Supervisão de primeira gravidez normal', 'Gravidez e reprodução', 'XXI - Fatores que influenciam o estado de saúde'),
('cid10', 'Z73.0', 'Esgotamento vital (Burnout / Síndrome de burnout)', 'Problemas relacionados ao estilo de vida', 'XXI - Fatores que influenciam o estado de saúde'),
('cid10', 'Z76.0', 'Emissão de receita repetida', 'Pessoas em contato com serviços de saúde', 'XXI - Fatores que influenciam o estado de saúde'),

-- ============================================================
-- COVID-19 (código de emergência OMS)
-- ============================================================
('cid10', 'U07.1', 'COVID-19 confirmado laboratorialmente', 'COVID-19', 'XXII - Códigos para fins especiais')

ON CONFLICT (versao, codigo) DO NOTHING;

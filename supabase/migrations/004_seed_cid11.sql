-- CID-11 Subset Clínico — Médica Geral + Psicóloga
-- Fonte: OMS ICD-11 MMS (Mortality and Morbidity Statistics), versão 2024-01
-- Inclui capítulos mais relevantes para clínica geral e saúde mental
-- Nota: tradução oficial para o português ainda não publicada pelo MS/DATASUS

INSERT INTO cid_codigos (versao, codigo, descricao, categoria, capitulo) VALUES

-- ═══════════════════════════════════════════════════════════════
-- CAP. 5 — DOENÇAS ENDÓCRINAS, NUTRICIONAIS E METABÓLICAS
-- ═══════════════════════════════════════════════════════════════
('cid11','5A00','Diabetes mellitus tipo 1','5A00','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A10','Diabetes mellitus tipo 2','5A10','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A11','Diabetes mellitus tipo 2, sem complicações','5A10','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A12','Diabetes mellitus tipo 2, com cetoacidose','5A10','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A13','Diabetes mellitus tipo 2, com hiperglicemia hiperosmolar','5A10','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A14','Diabetes mellitus tipo 2, com complicações renais','5A10','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A15','Diabetes mellitus tipo 2, com complicações oftálmicas','5A10','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A16','Diabetes mellitus tipo 2, com neuropatia','5A10','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A17','Diabetes mellitus tipo 2, com complicações circulatórias periféricas','5A10','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A1Z','Diabetes mellitus tipo 2, não especificado','5A10','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A20','Hipotireoidismo primário','5A20','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A21','Hipotireoidismo secundário','5A20','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A22','Hipotireoidismo, não especificado','5A20','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A00.0','Hipertireoidismo','5A00','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A40','Doença de Addison','5A40','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5A41','Síndrome de Cushing','5A41','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5B00','Desnutrição','5B00','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5B56','Deficiência de vitamina D','5B56','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5B57','Anemia por deficiência de ferro','5B57','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5B80','Obesidade','5B80','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5B81','Sobrepeso','5B81','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5C61','Hipercolesterolemia','5C61','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5C62','Hiperlipidemia mista','5C62','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),
('cid11','5C73','Hiperuricemia','5C73','Cap. 5 — Doenças endócrinas, nutricionais e metabólicas'),

-- ═══════════════════════════════════════════════════════════════
-- CAP. 6 — TRANSTORNOS MENTAIS, COMPORTAMENTAIS E NEURODESENVOLVIMENTO
-- ═══════════════════════════════════════════════════════════════

-- Neurodesenvolvimento
('cid11','6A00','Transtorno do espectro autista','6A00','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A01','Transtorno do espectro autista sem deficiência intelectual, com linguagem funcional','6A00','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A02','Transtorno de déficit de atenção e hiperatividade (TDAH)','6A02','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A02.0','TDAH, apresentação predominantemente desatenta','6A02','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A02.1','TDAH, apresentação predominantemente hiperativa-impulsiva','6A02','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A02.2','TDAH, apresentação combinada','6A02','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A03','Transtorno de aprendizagem do desenvolvimento','6A03','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A03.0','Transtorno de aprendizagem com prejuízo na leitura (dislexia)','6A03','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A03.1','Transtorno de aprendizagem com prejuízo na matemática (discalculia)','6A03','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A03.2','Transtorno de aprendizagem com prejuízo na expressão escrita','6A03','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A04','Transtorno do desenvolvimento da coordenação motora','6A04','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A05','Síndrome de Tourette','6A05','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A06','Transtorno de movimento estereotipado','6A06','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A80','Deficiência intelectual leve','6A80','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A81','Deficiência intelectual moderada','6A80','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A82','Deficiência intelectual grave','6A80','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A83','Deficiência intelectual profunda','6A80','Cap. 6 — Transtornos mentais e comportamentais'),

-- Esquizofrenia e espectro psicótico
('cid11','6A20','Esquizofrenia','6A20','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A21','Transtorno esquizoafetivo','6A21','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A22','Transtorno esquizotípico','6A22','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A23','Transtorno psicótico agudo e transitório','6A23','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A24','Transtorno delirante','6A24','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A25','Transtorno psicótico induzido por substância','6A25','Cap. 6 — Transtornos mentais e comportamentais'),

-- Transtornos bipolares
('cid11','6A40','Transtorno bipolar tipo I','6A40','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A40.0','Transtorno bipolar tipo I, episódio maníaco atual, sem sintomas psicóticos','6A40','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A40.1','Transtorno bipolar tipo I, episódio maníaco atual, com sintomas psicóticos','6A40','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A40.2','Transtorno bipolar tipo I, episódio depressivo atual, leve ou moderado','6A40','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A40.3','Transtorno bipolar tipo I, episódio depressivo atual, grave','6A40','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A41','Transtorno bipolar tipo II','6A41','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A42','Transtorno ciclotímico','6A42','Cap. 6 — Transtornos mentais e comportamentais'),

-- Transtornos depressivos
('cid11','6A60','Transtorno depressivo de episódio único','6A60','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A60.0','Transtorno depressivo de episódio único, leve, sem sintomas somáticos','6A60','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A60.1','Transtorno depressivo de episódio único, leve, com sintomas somáticos','6A60','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A60.2','Transtorno depressivo de episódio único, moderado, sem sintomas psicóticos','6A60','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A60.3','Transtorno depressivo de episódio único, moderado, com sintomas psicóticos','6A60','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A60.4','Transtorno depressivo de episódio único, grave, sem sintomas psicóticos','6A60','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A60.5','Transtorno depressivo de episódio único, grave, com sintomas psicóticos','6A60','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A60.6','Transtorno depressivo de episódio único, em remissão','6A60','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A61','Transtorno depressivo recorrente','6A61','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A61.0','Transtorno depressivo recorrente, episódio atual leve','6A61','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A61.1','Transtorno depressivo recorrente, episódio atual moderado, sem sintomas psicóticos','6A61','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A61.2','Transtorno depressivo recorrente, episódio atual moderado, com sintomas psicóticos','6A61','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A61.3','Transtorno depressivo recorrente, episódio atual grave, sem sintomas psicóticos','6A61','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A61.4','Transtorno depressivo recorrente, episódio atual grave, com sintomas psicóticos','6A61','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A61.5','Transtorno depressivo recorrente, em remissão','6A61','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A62','Distimia','6A62','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A63','Transtorno misto depressivo-ansioso','6A63','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6A64','Transtorno disfórico pré-menstrual','6A64','Cap. 6 — Transtornos mentais e comportamentais'),

-- Ansiedade e medo
('cid11','6B00','Transtorno de ansiedade generalizada','6B00','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B01','Transtorno do pânico','6B01','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B02','Agorafobia','6B02','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B03','Fobia específica','6B03','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B03.0','Fobia a animais','6B03','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B03.1','Fobia a ambiente natural','6B03','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B03.2','Fobia situacional','6B03','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B03.3','Fobia de sangue-injeção-ferimento','6B03','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B04','Transtorno de ansiedade social','6B04','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B05','Transtorno de ansiedade de separação','6B05','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B06','Mutismo seletivo','6B06','Cap. 6 — Transtornos mentais e comportamentais'),

-- TOC e relacionados
('cid11','6B20','Transtorno obsessivo-compulsivo (TOC)','6B20','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B21','Transtorno dismórfico corporal','6B21','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B22','Transtorno de referência olfativa','6B22','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B23','Hipocondria','6B23','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B24','Transtorno de acumulação (hoarding)','6B24','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B25','Escoriação (skin picking)','6B25','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B26','Tricotilomania (pulling de cabelo)','6B26','Cap. 6 — Transtornos mentais e comportamentais'),

-- Trauma e estresse
('cid11','6B40','Transtorno de estresse pós-traumático (TEPT)','6B40','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B41','TEPT complexo','6B41','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B42','Transtorno de luto prolongado','6B42','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B43','Transtorno de ajustamento','6B43','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B44','Transtorno de apego reativo','6B44','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B45','Transtorno de engajamento social desinibido','6B45','Cap. 6 — Transtornos mentais e comportamentais'),

-- Dissociativos
('cid11','6B60','Transtorno neurológico funcional (sintoma dissociativo)','6B60','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B61','Amnésia dissociativa','6B61','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B62','Transtorno de transe','6B62','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B64','Transtorno dissociativo de identidade','6B64','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B65','Transtorno dissociativo de identidade parcial','6B65','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B66','Transtorno de despersonalização-desrealização','6B66','Cap. 6 — Transtornos mentais e comportamentais'),

-- Alimentação e ingestão
('cid11','6B80','Anorexia nervosa','6B80','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B81','Bulimia nervosa','6B81','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B82','Transtorno de compulsão alimentar','6B82','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B83','Transtorno alimentar restritivo/evitativo (ARFID)','6B83','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B84','Pica','6B84','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6B85','Transtorno de ruminação-regurgitação','6B85','Cap. 6 — Transtornos mentais e comportamentais'),

-- Eliminação
('cid11','6C00','Enurese','6C00','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C01','Encoprese','6C01','Cap. 6 — Transtornos mentais e comportamentais'),

-- Sofrimento corporal
('cid11','6C20','Transtorno de angústia corporal','6C20','Cap. 6 — Transtornos mentais e comportamentais'),

-- Uso de substâncias
('cid11','6C40','Transtornos por uso de álcool','6C40','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C40.0','Episódio de uso nocivo de álcool','6C40','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C40.1','Padrão de uso nocivo de álcool','6C40','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C40.2','Dependência de álcool','6C40','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C40.3','Intoxicação por álcool','6C40','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C40.4','Abstinência de álcool','6C40','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C41','Transtornos por uso de cannabis','6C41','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C41.2','Dependência de cannabis','6C41','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C43','Transtornos por uso de opioides','6C43','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C43.2','Dependência de opioides','6C43','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C44','Transtornos por uso de sedativos, hipnóticos ou ansiolíticos','6C44','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C44.2','Dependência de sedativos, hipnóticos ou ansiolíticos','6C44','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C45','Transtornos por uso de cocaína','6C45','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C46','Transtornos por uso de estimulantes','6C46','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C49','Dependência de nicotina','6C49','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C4G','Transtorno de jogo (gambling)','6C4G','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C4H','Transtorno de jogos digitais (gaming disorder)','6C4H','Cap. 6 — Transtornos mentais e comportamentais'),

-- Controle de impulsos
('cid11','6C70','Transtorno explosivo intermitente','6C70','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C71','Piromania','6C71','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C72','Cleptomania','6C72','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C73','Transtorno de comportamento sexual compulsivo','6C73','Cap. 6 — Transtornos mentais e comportamentais'),

-- Disruptivo e antissocial
('cid11','6C90','Transtorno de oposição desafiante','6C90','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C91','Transtorno de conduta','6C91','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6C92','Transtorno antissocial de personalidade','6C92','Cap. 6 — Transtornos mentais e comportamentais'),

-- Personalidade
('cid11','6D10','Transtorno de personalidade','6D10','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D10.0','Transtorno de personalidade leve','6D10','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D10.1','Transtorno de personalidade moderado','6D10','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D10.2','Transtorno de personalidade grave','6D10','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D11','Padrão borderline de personalidade','6D11','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D12','Padrão narcisista de personalidade','6D12','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D13','Padrão anancastico de personalidade','6D13','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D14','Padrão ansioso-evitativo de personalidade','6D14','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D15','Padrão dependente de personalidade','6D15','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D16','Padrão esquizoide de personalidade','6D16','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D50','Transtorno factício','6D50','Cap. 6 — Transtornos mentais e comportamentais'),

-- Neurocognitivos (demência)
('cid11','6D70','Demência devida a Doença de Alzheimer','6D70','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D71','Demência vascular','6D71','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D72','Demência devida a Doença de Lewy','6D72','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D73','Demência devida a Doença de Parkinson','6D73','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D80','Transtorno neurocognitivo leve','6D80','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D85','Delirium','6D85','Cap. 6 — Transtornos mentais e comportamentais'),
('cid11','6D85.0','Delirium por substância ou medicamento','6D85','Cap. 6 — Transtornos mentais e comportamentais'),

-- ═══════════════════════════════════════════════════════════════
-- CAP. 7 — TRANSTORNOS DO SONO
-- ═══════════════════════════════════════════════════════════════
('cid11','7A00','Insônia crônica','7A00','Cap. 7 — Transtornos do sono'),
('cid11','7A01','Insônia de curta duração','7A01','Cap. 7 — Transtornos do sono'),
('cid11','7A20','Síndrome de apneia obstrutiva do sono','7A20','Cap. 7 — Transtornos do sono'),
('cid11','7A40','Narcolepsia','7A40','Cap. 7 — Transtornos do sono'),
('cid11','7A60','Sonambulismo','7A60','Cap. 7 — Transtornos do sono'),
('cid11','7A61','Terror noturno','7A61','Cap. 7 — Transtornos do sono'),
('cid11','7A80','Síndrome das pernas inquietas','7A80','Cap. 7 — Transtornos do sono'),
('cid11','7B01','Transtorno comportamental do sono REM','7B01','Cap. 7 — Transtornos do sono'),

-- ═══════════════════════════════════════════════════════════════
-- CAP. 8 — DOENÇAS DO SISTEMA NERVOSO
-- ═══════════════════════════════════════════════════════════════
('cid11','8A00','Doença de Parkinson','8A00','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8A20','Esclerose múltipla','8A20','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8A60','Epilepsia generalizada idiopática','8A60','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8A61','Epilepsia focal','8A61','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8A80','Enxaqueca (migrânea)','8A80','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8A80.0','Migrânea sem aura','8A80','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8A80.1','Migrânea com aura','8A80','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8A81','Cefaleia tensional','8A81','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8A82','Cefaleia em salvas','8A82','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8B20','Acidente vascular cerebral isquêmico','8B20','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8B21','Acidente vascular cerebral hemorrágico','8B21','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8B22','Ataque isquêmico transitório (AIT)','8B22','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8C00','Neuropatia periférica','8C00','Cap. 8 — Doenças do sistema nervoso'),
('cid11','8C01','Síndrome de Guillain-Barré','8C01','Cap. 8 — Doenças do sistema nervoso'),

-- ═══════════════════════════════════════════════════════════════
-- CAP. 11 — DOENÇAS DO APARELHO CIRCULATÓRIO
-- ═══════════════════════════════════════════════════════════════
('cid11','BA00','Hipertensão arterial essencial','BA00','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BA01','Hipertensão arterial resistente','BA01','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BA02','Hipertensão arterial secundária','BA02','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BA41','Infarto agudo do miocárdio','BA41','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BA42','Angina de peito','BA42','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BA43','Angina instável','BA43','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BA80','Insuficiência cardíaca','BA80','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BA80.0','Insuficiência cardíaca com fração de ejeção reduzida','BA80','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BA80.1','Insuficiência cardíaca com fração de ejeção preservada','BA80','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BC43','Fibrilação atrial','BC43','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BC44','Flutter atrial','BC44','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BD10','Cardiomiopatia dilatada','BD10','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BD11','Cardiomiopatia hipertrófica','BD11','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BE2Y','Trombose venosa profunda','BE2Y','Cap. 11 — Doenças do aparelho circulatório'),
('cid11','BF90','Varizes dos membros inferiores','BF90','Cap. 11 — Doenças do aparelho circulatório'),

-- ═══════════════════════════════════════════════════════════════
-- CAP. 12 — DOENÇAS DO APARELHO RESPIRATÓRIO
-- ═══════════════════════════════════════════════════════════════
('cid11','CA00','Faringite aguda','CA00','Cap. 12 — Doenças do aparelho respiratório'),
('cid11','CA01','Amigdalite aguda','CA01','Cap. 12 — Doenças do aparelho respiratório'),
('cid11','CA02','Laringotraqueíte aguda','CA02','Cap. 12 — Doenças do aparelho respiratório'),
('cid11','CA06','Influenza (gripe)','CA06','Cap. 12 — Doenças do aparelho respiratório'),
('cid11','CA07','Pneumonia','CA07','Cap. 12 — Doenças do aparelho respiratório'),
('cid11','CA22','DPOC (Doença pulmonar obstrutiva crônica)','CA22','Cap. 12 — Doenças do aparelho respiratório'),
('cid11','CA23','Asma','CA23','Cap. 12 — Doenças do aparelho respiratório'),
('cid11','CA23.0','Asma alérgica','CA23','Cap. 12 — Doenças do aparelho respiratório'),
('cid11','CA23.1','Asma não alérgica','CA23','Cap. 12 — Doenças do aparelho respiratório'),
('cid11','CA24','Bronquiectasia','CA24','Cap. 12 — Doenças do aparelho respiratório'),
('cid11','CA40','Rinite alérgica','CA40','Cap. 12 — Doenças do aparelho respiratório'),
('cid11','CB00','Embolia pulmonar','CB00','Cap. 12 — Doenças do aparelho respiratório'),

-- ═══════════════════════════════════════════════════════════════
-- CAP. 13 — DOENÇAS DO APARELHO DIGESTIVO
-- ═══════════════════════════════════════════════════════════════
('cid11','DA22','Doença do refluxo gastroesofágico (DRGE)','DA22','Cap. 13 — Doenças do aparelho digestivo'),
('cid11','DA40','Gastrite','DA40','Cap. 13 — Doenças do aparelho digestivo'),
('cid11','DA41','Úlcera gástrica','DA41','Cap. 13 — Doenças do aparelho digestivo'),
('cid11','DA42','Úlcera duodenal','DA42','Cap. 13 — Doenças do aparelho digestivo'),
('cid11','DA90','Colite ulcerativa','DA90','Cap. 13 — Doenças do aparelho digestivo'),
('cid11','DA91','Doença de Crohn','DA91','Cap. 13 — Doenças do aparelho digestivo'),
('cid11','DB90','Doença hepática por álcool','DB90','Cap. 13 — Doenças do aparelho digestivo'),
('cid11','DB92','Hepatite C crônica','DB92','Cap. 13 — Doenças do aparelho digestivo'),
('cid11','DB93','Doença hepática gordurosa não alcoólica','DB93','Cap. 13 — Doenças do aparelho digestivo'),
('cid11','DC80','Síndrome do intestino irritável','DC80','Cap. 13 — Doenças do aparelho digestivo'),

-- ═══════════════════════════════════════════════════════════════
-- CAP. 14 — DOENÇAS DA PELE
-- ═══════════════════════════════════════════════════════════════
('cid11','EA80','Dermatite atópica','EA80','Cap. 14 — Doenças da pele e tecido subcutâneo'),
('cid11','EA90','Psoríase','EA90','Cap. 14 — Doenças da pele e tecido subcutâneo'),
('cid11','EH40','Urticária','EH40','Cap. 14 — Doenças da pele e tecido subcutâneo'),
('cid11','EH50','Acne','EH50','Cap. 14 — Doenças da pele e tecido subcutâneo'),

-- ═══════════════════════════════════════════════════════════════
-- CAP. 15 — DOENÇAS DO SISTEMA OSTEOMUSCULAR
-- ═══════════════════════════════════════════════════════════════
('cid11','FA00','Artrite reumatoide','FA00','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FA01','Osteoartrite','FA01','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FA01.0','Osteoartrite do joelho','FA01','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FA01.1','Osteoartrite do quadril','FA01','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FA02','Artrite psoriásica','FA02','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FA03','Espondilite anquilosante','FA03','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FA04','Gota','FA04','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FA90','Fibromialgia','FA90','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FA91','Síndrome de fadiga crônica','FA91','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FB10','Dor lombar','FB10','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FB10.0','Dor lombar aguda','FB10','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FB10.1','Dor lombar crônica','FB10','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FB20','Ciática','FB20','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FB30','Osteoporose','FB30','Cap. 15 — Doenças do sistema osteomuscular'),
('cid11','FB31','Fratura por osteoporose','FB31','Cap. 15 — Doenças do sistema osteomuscular'),

-- ═══════════════════════════════════════════════════════════════
-- CAP. 16 — DOENÇAS DO APARELHO GENITURINÁRIO
-- ═══════════════════════════════════════════════════════════════
('cid11','GA00','Endometriose','GA00','Cap. 16 — Doenças do aparelho geniturinário'),
('cid11','GA10','Síndrome dos ovários policísticos (SOP)','GA10','Cap. 16 — Doenças do aparelho geniturinário'),
('cid11','GA14','Dismenorreia primária','GA14','Cap. 16 — Doenças do aparelho geniturinário'),
('cid11','GA15','Sangramento uterino anormal','GA15','Cap. 16 — Doenças do aparelho geniturinário'),
('cid11','GA30','Menopausa','GA30','Cap. 16 — Doenças do aparelho geniturinário'),
('cid11','GA31','Síndrome climatérica','GA31','Cap. 16 — Doenças do aparelho geniturinário'),
('cid11','GB00','Infecção do trato urinário (ITU)','GB00','Cap. 16 — Doenças do aparelho geniturinário'),
('cid11','GB01','Cistite','GB01','Cap. 16 — Doenças do aparelho geniturinário'),
('cid11','GC00','Insuficiência renal crônica','GC00','Cap. 16 — Doenças do aparelho geniturinário'),
('cid11','GC08','Infecção urinária recorrente','GC08','Cap. 16 — Doenças do aparelho geniturinário'),

-- ═══════════════════════════════════════════════════════════════
-- CAP. 18 — GRAVIDEZ, PARTO E PUERPÉRIO
-- ═══════════════════════════════════════════════════════════════
('cid11','JA00','Gravidez normal','JA00','Cap. 18 — Gravidez, parto e puerpério'),
('cid11','JA20','Diabetes gestacional','JA20','Cap. 18 — Gravidez, parto e puerpério'),
('cid11','JA21','Hipertensão gestacional','JA21','Cap. 18 — Gravidez, parto e puerpério'),
('cid11','JA22','Pré-eclâmpsia','JA22','Cap. 18 — Gravidez, parto e puerpério'),
('cid11','JA23','Eclâmpsia','JA23','Cap. 18 — Gravidez, parto e puerpério'),
('cid11','JA30','Depressão pós-parto','JA30','Cap. 18 — Gravidez, parto e puerpério'),
('cid11','JA31','Psicose puerperal','JA31','Cap. 18 — Gravidez, parto e puerpério'),

-- ═══════════════════════════════════════════════════════════════
-- CAP. 21 — SINTOMAS, SINAIS E ACHADOS CLÍNICOS
-- ═══════════════════════════════════════════════════════════════
('cid11','MA00','Dor abdominal','MA00','Cap. 21 — Sintomas e sinais'),
('cid11','MA01','Dor torácica','MA01','Cap. 21 — Sintomas e sinais'),
('cid11','MA02','Dor de cabeça, não classificada','MA02','Cap. 21 — Sintomas e sinais'),
('cid11','MA10','Náuseas e vômitos','MA10','Cap. 21 — Sintomas e sinais'),
('cid11','MA11','Diarreia','MA11','Cap. 21 — Sintomas e sinais'),
('cid11','MA20','Febre de origem obscura','MA20','Cap. 21 — Sintomas e sinais'),
('cid11','MA40','Tontura','MA40','Cap. 21 — Sintomas e sinais'),
('cid11','MA41','Lipotimia / pré-síncope','MA41','Cap. 21 — Sintomas e sinais'),
('cid11','MB40','Fadiga','MB40','Cap. 21 — Sintomas e sinais'),
('cid11','MB41','Insônia (sintoma)','MB41','Cap. 21 — Sintomas e sinais'),

-- ═══════════════════════════════════════════════════════════════
-- CAP. 24 — FATORES QUE INFLUENCIAM O ESTADO DE SAÚDE
-- ═══════════════════════════════════════════════════════════════
('cid11','QA00','Contato com serviços de saúde para exame e consulta','QA00','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QA01','Exame geral de saúde','QA01','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QA02','Exame de triagem','QA02','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QA0Z','Consulta preventiva de rotina','QA0Z','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QA20','Contato com serviços de saúde mental','QA20','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QA21','Acompanhamento psicológico','QA21','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QB00','Problema em relacionamento com cônjuge ou parceiro','QB00','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QB01','Problema em relacionamento com pais e familiares','QB01','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QB10','Abuso físico na infância','QB10','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QB11','Abuso sexual na infância','QB11','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QB12','Abuso emocional na infância','QB12','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QB13','Negligência na infância','QB13','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QB20','Violência doméstica','QB20','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QC00','Desemprego','QC00','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QC01','Problema relacionado ao trabalho','QC01','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QD00','Tabagismo atual','QD00','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QD01','Tabagismo prévio','QD01','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QD10','Uso prejudicial de álcool','QD10','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QD42','Sedentarismo','QD42','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QD43','Alimentação inadequada','QD43','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QE00','História familiar de doença cardiovascular','QE00','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QE01','História familiar de diabetes','QE01','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QE02','História familiar de câncer','QE02','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QE10','História pessoal de doença cardiovascular','QE10','Cap. 24 — Fatores que influenciam a saúde'),
('cid11','QF00','Problema de cumprimento de tratamento médico','QF00','Cap. 24 — Fatores que influenciam a saúde')

ON CONFLICT (versao, codigo) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  categoria = EXCLUDED.categoria,
  capitulo  = EXCLUDED.capitulo;

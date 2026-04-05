-- ============================================================
--  BASE DE DONNÉES D'EXERCICES SCOLAIRES
--  Compatible PostgreSQL 14+
-- ============================================================

CREATE TABLE subjects (
  id         TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE domains (
  id         TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE competences (
  id          TEXT PRIMARY KEY,
  domain_id   TEXT NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  annee       TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE competence_relations (
  from_competence_id TEXT NOT NULL REFERENCES competences(id) ON DELETE CASCADE,
  to_competence_id   TEXT NOT NULL REFERENCES competences(id) ON DELETE CASCADE,
  PRIMARY KEY (from_competence_id, to_competence_id),
  CHECK (from_competence_id <> to_competence_id)
);

CREATE INDEX idx_competence_relations_from ON competence_relations(from_competence_id);
CREATE INDEX idx_competence_relations_to   ON competence_relations(to_competence_id);

CREATE TABLE exercises (
  id            TEXT PRIMARY KEY,
  competence_id TEXT NOT NULL REFERENCES competences(id) ON DELETE CASCADE,
  difficulte    INTEGER NOT NULL CHECK (difficulte BETWEEN 1 AND 3),
  tags          TEXT[],
  mode          TEXT NOT NULL DEFAULT 'statique' CHECK (mode IN ('statique', 'template')),
  enonce        JSONB NOT NULL,
  resolution    JSONB NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_exercises_competence ON exercises(competence_id);
CREATE INDEX idx_exercises_difficulte ON exercises(difficulte);
CREATE INDEX idx_exercises_enonce     ON exercises USING gin(enonce);
CREATE INDEX idx_exercises_resolution ON exercises USING gin(resolution);

-- ============================================================
--  DONNÉES DE DÉPART — P1 MATHÉMATIQUES CALCUL
-- ============================================================

INSERT INTO subjects VALUES ('math', 'Mathématiques');

INSERT INTO domains VALUES ('arithmetique', 'math', 'Arithmétique');

-- TODO: compétences et relations à définir

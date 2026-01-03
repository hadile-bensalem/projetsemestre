-- Script de création du Data Warehouse
-- SGBD : PostgreSQL (peut être adapté pour MySQL)
-- Modèle en étoile pour l'analyse des résultats d'examens

-- ============================================
-- DIMENSIONS
-- ============================================

-- Dimension : Examen
CREATE TABLE dim_exam (
    exam_key SERIAL PRIMARY KEY,
    exam_id VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_points DECIMAL(10,2) NOT NULL,
    min_passing_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    duration INTEGER NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_date DATE,
    created_date DATE NOT NULL,
    updated_date DATE,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,
    is_current BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_dim_exam_exam_id ON dim_exam(exam_id);
CREATE INDEX idx_dim_exam_title ON dim_exam(title);

-- Dimension : Étudiant
CREATE TABLE dim_student (
    student_key SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200),
    enrollment_date DATE,
    student_number VARCHAR(50),
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,
    is_current BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_dim_student_student_id ON dim_student(student_id);
CREATE INDEX idx_dim_student_email ON dim_student(email);
CREATE INDEX idx_dim_student_full_name ON dim_student(full_name);

-- Dimension : Filière
CREATE TABLE dim_filiere (
    filiere_key SERIAL PRIMARY KEY,
    filiere_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    duration INTEGER,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,
    is_current BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_dim_filiere_filiere_id ON dim_filiere(filiere_id);
CREATE INDEX idx_dim_filiere_code ON dim_filiere(code);

-- Dimension : Date
CREATE TABLE dim_date (
    date_key INTEGER PRIMARY KEY, -- Format: YYYYMMDD
    date DATE NOT NULL UNIQUE,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    week INTEGER NOT NULL,
    day_of_month INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL, -- 1 = Lundi, 7 = Dimanche
    day_name VARCHAR(20) NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    is_month_end BOOLEAN NOT NULL,
    is_quarter_end BOOLEAN NOT NULL,
    is_year_end BOOLEAN NOT NULL
);

CREATE INDEX idx_dim_date_date ON dim_date(date);
CREATE INDEX idx_dim_date_year_month ON dim_date(year, month);

-- Fonction pour remplir la dimension date (optionnel)
-- Peut être utilisée pour générer les dates de 2020 à 2030
CREATE OR REPLACE FUNCTION fill_dim_date(start_date DATE, end_date DATE)
RETURNS VOID AS $$
DECLARE
    cur_date DATE := start_date;
BEGIN
    WHILE cur_date <= end_date LOOP
        INSERT INTO dim_date (
            date_key, date, year, quarter, month, month_name,
            week, day_of_month, day_of_week, day_name,
            is_weekend, is_month_end, is_quarter_end, is_year_end
        ) VALUES (
            TO_CHAR(cur_date, 'YYYYMMDD')::INTEGER,
            cur_date,
            EXTRACT(YEAR FROM cur_date),
            EXTRACT(QUARTER FROM cur_date),
            EXTRACT(MONTH FROM cur_date),
            TO_CHAR(cur_date, 'Month'),
            EXTRACT(WEEK FROM cur_date),
            EXTRACT(DAY FROM cur_date),
            EXTRACT(DOW FROM cur_date) + 1, -- Ajustement pour lundi = 1
            TO_CHAR(cur_date, 'Day'),
            EXTRACT(DOW FROM cur_date) IN (0, 6), -- Samedi ou dimanche
            cur_date = DATE_TRUNC('month', cur_date) + INTERVAL '1 month' - INTERVAL '1 day',
            cur_date = DATE_TRUNC('quarter', cur_date) + INTERVAL '3 months' - INTERVAL '1 day',
            cur_date = DATE_TRUNC('year', cur_date) + INTERVAL '1 year' - INTERVAL '1 day'
        )
        ON CONFLICT (date_key) DO NOTHING;
        
        cur_date := cur_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE DE FAITS
-- ============================================

CREATE TABLE fact_exam_results (
    fact_id SERIAL PRIMARY KEY,
    exam_key INTEGER NOT NULL REFERENCES dim_exam(exam_key),
    student_key INTEGER NOT NULL REFERENCES dim_student(student_key),
    filiere_key INTEGER NOT NULL REFERENCES dim_filiere(filiere_key),
    date_key INTEGER NOT NULL REFERENCES dim_date(date_key),
    score DECIMAL(10,2) NOT NULL,
    total_points DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    passed BOOLEAN NOT NULL,
    duration_minutes INTEGER,
    time_taken_minutes INTEGER,
    certificate_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP,
    load_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX idx_fact_exam_key ON fact_exam_results(exam_key);
CREATE INDEX idx_fact_student_key ON fact_exam_results(student_key);
CREATE INDEX idx_fact_filiere_key ON fact_exam_results(filiere_key);
CREATE INDEX idx_fact_date_key ON fact_exam_results(date_key);
CREATE INDEX idx_fact_passed ON fact_exam_results(passed);
CREATE INDEX idx_fact_submitted_at ON fact_exam_results(submitted_at);

-- Index composite pour les requêtes fréquentes
CREATE INDEX idx_fact_exam_student ON fact_exam_results(exam_key, student_key);
CREATE INDEX idx_fact_filiere_date ON fact_exam_results(filiere_key, date_key);

-- ============================================
-- VUES POUR FACILITER L'ANALYSE
-- ============================================

-- Vue : Résultats agrégés par examen
CREATE OR REPLACE VIEW vw_exam_summary AS
SELECT 
    e.exam_key,
    e.title,
    e.total_points,
    e.min_passing_score,
    COUNT(f.fact_id) AS total_submissions,
    COUNT(CASE WHEN f.passed THEN 1 END) AS passed_count,
    COUNT(CASE WHEN NOT f.passed THEN 1 END) AS failed_count,
    CASE 
        WHEN COUNT(f.fact_id) > 0 THEN ROUND(AVG(f.percentage), 2)
        ELSE 0
    END AS avg_percentage,
    CASE 
        WHEN COUNT(f.fact_id) > 0 THEN ROUND(MAX(f.percentage), 2)
        ELSE 0
    END AS max_percentage,
    CASE 
        WHEN COUNT(f.fact_id) > 0 THEN ROUND(MIN(f.percentage), 2)
        ELSE 0
    END AS min_percentage,
    CASE 
        WHEN COUNT(f.fact_id) > 0 THEN ROUND(COUNT(CASE WHEN f.passed THEN 1 END)::NUMERIC / COUNT(f.fact_id) * 100, 2)
        ELSE 0
    END AS pass_rate
FROM dim_exam e
LEFT JOIN fact_exam_results f ON e.exam_key = f.exam_key
GROUP BY e.exam_key, e.title, e.total_points, e.min_passing_score;

-- Vue : Résultats par filière
CREATE OR REPLACE VIEW vw_filiere_performance AS
SELECT 
    fil.filiere_key,
    fil.name AS filiere_name,
    fil.code AS filiere_code,
    COUNT(DISTINCT f.student_key) AS total_students,
    COUNT(f.fact_id) AS total_submissions,
    COUNT(CASE WHEN f.passed THEN 1 END) AS passed_count,
    CASE 
        WHEN COUNT(f.fact_id) > 0 THEN ROUND(AVG(f.percentage), 2)
        ELSE 0
    END AS avg_percentage,
    CASE 
        WHEN COUNT(f.fact_id) > 0 THEN ROUND(COUNT(CASE WHEN f.passed THEN 1 END)::NUMERIC / COUNT(f.fact_id) * 100, 2)
        ELSE 0
    END AS pass_rate
FROM dim_filiere fil
LEFT JOIN fact_exam_results f ON fil.filiere_key = f.filiere_key
GROUP BY fil.filiere_key, fil.name, fil.code;

-- Vue : Performance des étudiants
CREATE OR REPLACE VIEW vw_student_performance AS
SELECT 
    s.student_key,
    s.full_name,
    s.email,
    s.student_number,
    COUNT(f.fact_id) AS total_exams,
    COUNT(CASE WHEN f.passed THEN 1 END) AS passed_count,
    CASE 
        WHEN COUNT(f.fact_id) > 0 THEN ROUND(AVG(f.percentage), 2)
        ELSE 0
    END AS avg_percentage,
    CASE 
        WHEN COUNT(f.fact_id) > 0 THEN ROUND(MAX(f.percentage), 2)
        ELSE 0
    END AS best_score,
    CASE 
        WHEN COUNT(f.fact_id) > 0 THEN ROUND(MIN(f.percentage), 2)
        ELSE 0
    END AS worst_score
FROM dim_student s
LEFT JOIN fact_exam_results f ON s.student_key = f.student_key
GROUP BY s.student_key, s.full_name, s.email, s.student_number;

-- ============================================
-- COMMENTAIRES POUR DOCUMENTATION
-- ============================================

COMMENT ON TABLE dim_exam IS 'Dimension des examens';
COMMENT ON TABLE dim_student IS 'Dimension des étudiants';
COMMENT ON TABLE dim_filiere IS 'Dimension des filières';
COMMENT ON TABLE dim_date IS 'Dimension temporelle (table calendrier)';
COMMENT ON TABLE fact_exam_results IS 'Table de faits : résultats des examens';

COMMENT ON COLUMN fact_exam_results.fact_id IS 'Clé primaire de la table de faits';
COMMENT ON COLUMN fact_exam_results.exam_key IS 'Clé étrangère vers dim_exam';
COMMENT ON COLUMN fact_exam_results.student_key IS 'Clé étrangère vers dim_student';
COMMENT ON COLUMN fact_exam_results.filiere_key IS 'Clé étrangère vers dim_filiere';
COMMENT ON COLUMN fact_exam_results.date_key IS 'Clé étrangère vers dim_date (date de soumission)';
COMMENT ON COLUMN fact_exam_results.percentage IS 'Pourcentage obtenu (0-100)';
COMMENT ON COLUMN fact_exam_results.passed IS 'True si l''étudiant a réussi (percentage >= min_passing_score)';


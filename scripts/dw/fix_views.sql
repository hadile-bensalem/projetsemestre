
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

